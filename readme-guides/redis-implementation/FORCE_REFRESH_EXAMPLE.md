# Force Refresh Cache - Practical Examples

## Basic Force Refresh Usage

### Example 1: Add Force Refresh to User Service

Update your user service to support optional force refresh:

```typescript
// src/lib/server/services/user.service.ts

export const getUserByClerkId = async (
  clerkId: string,
  options?: { forceRefresh?: boolean }
) => {
  try {
    const cacheKey = CacheKeys.UserByClerkId(clerkId);

    const user = await CacheService.wrap(
      cacheKey,
      async () => {
        return await prisma.user.findUnique({
          where: { clerkId },
          select: { id: true },
        });
      },
      CacheTTL.USER,
      options // Pass through the options
    );

    return user;
  } catch (error) {
    console.error(`Failed to get user by clerk id: ${clerkId}`, error);
    throw new Error("Failed to get user.");
  }
};
```

### Example 2: API Route with Force Refresh

Create an API endpoint that supports cache refresh via query parameter:

```typescript
// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/server/services/user.service";

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for force refresh query parameter
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get("refresh") === "true";

    // Fetch user with optional force refresh
    const user = await getUserByClerkId(userId, { forceRefresh });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
```

**Usage:**
```bash
# Normal request (uses cache)
GET /api/user/profile

# Force refresh (bypasses cache)
GET /api/user/profile?refresh=true
```

### Example 3: React Component with Refresh Button

```typescript
// src/components/UserProfile.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const params = forceRefresh ? "?refresh=true" : "";
      const response = await fetch(`/api/user/profile${params}`);
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <h2>User Profile</h2>
        <Button
          onClick={() => fetchProfile(true)}
          disabled={loading}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {user && (
        <div className="mt-4">
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
        </div>
      )}
    </div>
  );
}
```

### Example 4: Admin Endpoint (Force Refresh After Updates)

```typescript
// src/app/api/admin/user/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/config/db/prisma";
import CacheService, { CacheKeys } from "@/lib/server/cache/cache.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const body = await request.json();
    const { name, email } = body;

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(params.userId) },
      data: { name, email },
    });

    // Invalidate cache immediately
    await CacheService.invalidate([
      CacheKeys.UserById(params.userId),
      CacheKeys.UserByClerkId(updatedUser.clerkId),
    ]);

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
```

### Example 5: Scheduled Cache Refresh (Background Job)

```typescript
// src/lib/server/jobs/cache-refresh.ts
import { getUserByClerkId } from "@/lib/server/services/user.service";
import prisma from "@/config/db/prisma";

/**
 * Refresh cache for active users
 * Run this periodically (e.g., every hour via cron job)
 */
export async function refreshActiveUserCache() {
  try {
    // Get list of active users (logged in within last 24 hours)
    const activeUsers = await prisma.user.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      select: { clerkId: true },
    });

    console.log(`Refreshing cache for ${activeUsers.length} active users...`);

    // Refresh cache for each active user
    for (const user of activeUsers) {
      await getUserByClerkId(user.clerkId, { forceRefresh: true });
    }

    console.log("Cache refresh complete");
  } catch (error) {
    console.error("Cache refresh job failed:", error);
  }
}
```

**Usage with Vercel Cron:**
```typescript
// src/app/api/cron/refresh-cache/route.ts
import { NextResponse } from "next/server";
import { refreshActiveUserCache } from "@/lib/server/jobs/cache-refresh";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await refreshActiveUserCache();

  return NextResponse.json({ success: true });
}
```

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-cache",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Example 6: Conditional Force Refresh Based on Data Age

```typescript
// src/lib/server/services/smart-user-fetch.ts
import CacheService, { CacheKeys, CacheTTL } from "@/lib/server/cache/cache.service";
import prisma from "@/config/db/prisma";

/**
 * Fetch user with smart caching:
 * - Uses cache if data is fresh (< 2 minutes)
 * - Forces refresh if data is stale (> 2 minutes)
 */
export async function getSmartUser(clerkId: string) {
  const cacheKey = CacheKeys.UserByClerkId(clerkId);
  const ageKey = `${cacheKey}:age`;

  // Check when data was last cached
  const cachedAge = await CacheService.get<number>(ageKey);
  const dataAge = cachedAge ? Date.now() - cachedAge : Infinity;

  const forceRefresh = dataAge > 2 * 60 * 1000; // Force if > 2 minutes

  const user = await CacheService.wrap(
    cacheKey,
    async () => {
      const userData = await prisma.user.findUnique({
        where: { clerkId },
      });

      // Store the timestamp
      await CacheService.set(ageKey, Date.now(), CacheTTL.USER);

      return userData;
    },
    CacheTTL.USER,
    { forceRefresh }
  );

  return user;
}
```

### Example 7: Debug Mode (Always Fresh in Development)

```typescript
// src/lib/server/services/user.service.ts
const isDevelopment = process.env.NODE_ENV === "development";
const debugMode = process.env.CACHE_DEBUG === "true";

export const getUserByClerkId = async (
  clerkId: string,
  options?: { forceRefresh?: boolean }
) => {
  try {
    const cacheKey = CacheKeys.UserByClerkId(clerkId);

    // In debug mode, always force refresh
    const forceRefresh = options?.forceRefresh || debugMode;

    const user = await CacheService.wrap(
      cacheKey,
      async () => {
        return await prisma.user.findUnique({
          where: { clerkId },
          select: { id: true },
        });
      },
      CacheTTL.USER,
      { forceRefresh }
    );

    return user;
  } catch (error) {
    console.error(`Failed to get user by clerk id: ${clerkId}`, error);
    throw new Error("Failed to get user.");
  }
};
```

**Enable debug mode:**
```bash
CACHE_DEBUG=true npm run dev
```

## Summary of Force Refresh Methods

| Method | When to Use | Example |
|--------|-------------|---------|
| **Query Parameter** | User-triggered refresh | `?refresh=true` |
| **Function Parameter** | Programmatic control | `getUserByClerkId(id, { forceRefresh: true })` |
| **Manual Invalidation** | After updates | `await CacheService.del(key)` |
| **Scheduled Jobs** | Periodic refresh | Cron job every hour |
| **Conditional Logic** | Based on data age | Check timestamp, refresh if old |
| **Debug Mode** | Development testing | `CACHE_DEBUG=true` |

## Best Practices

1. **Don't overuse force refresh** - It defeats the purpose of caching
2. **Use it for user-triggered actions** - "Refresh" buttons, webhooks
3. **Prefer invalidation over force refresh** - After updates, delete cache keys
4. **Log force refresh operations** - Helps with debugging and monitoring
5. **Rate limit refresh endpoints** - Prevent abuse of force refresh APIs

## Testing Force Refresh

```typescript
// Test in your API routes or services
describe("Force Refresh", () => {
  it("should use cache on first call", async () => {
    const user1 = await getUserByClerkId("user_123");
    // This hits the database
  });

  it("should use cache on second call", async () => {
    const user2 = await getUserByClerkId("user_123");
    // This uses cache (fast)
  });

  it("should bypass cache with force refresh", async () => {
    const user3 = await getUserByClerkId("user_123", { forceRefresh: true });
    // This hits the database again (fresh data)
  });
});
```

