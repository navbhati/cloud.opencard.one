# Redis Caching Implementation

## Overview

This project implements production-ready Redis caching with an adapter pattern that allows seamless switching between Redis providers (Upstash, Azure Redis, self-hosted Redis, etc.) without code changes.

## Architecture

```
┌─────────────────┐
│  Application    │
│  (User Service) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cache Service   │
│ (High-level)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Redis Factory   │
│ (Provider)      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌─────────┐
│Upstash │  │IORedis  │
│Adapter │  │Adapter  │
└────────┘  └─────────┘
```

## Features

✅ **Provider Agnostic**: Switch between Redis providers with just environment variables  
✅ **Graceful Degradation**: Application works without Redis (falls back to no-op)  
✅ **Cache-Aside Pattern**: Automatic cache-through with the `wrap()` method  
✅ **Type-Safe**: Full TypeScript support  
✅ **Automatic Invalidation**: Cache invalidation on data mutations  
✅ **Production-Ready**: Error handling, logging, and connection management  
✅ **Minimal Code Changes**: Existing services updated with minimal modifications  

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure:

#### Option A: Upstash (Recommended for Vercel)

```env
REDIS_PROVIDER=upstash
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

**Getting Upstash Credentials:**
1. Go to [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the REST URL and REST TOKEN
4. Paste into your `.env.local`

#### Option B: Azure Redis

```env
REDIS_PROVIDER=azure
REDIS_URL=rediss://your-redis.redis.cache.windows.net:6380?password=your_password
```

#### Option C: Self-Hosted Redis

```env
REDIS_PROVIDER=standard
REDIS_URL=redis://localhost:6379
```

### 2. Local Development

For local development, you can:

1. **Skip Redis** (recommended for quick starts)
   - Simply don't set the Redis environment variables
   - The app will work without caching

2. **Use Local Redis**
   ```bash
   # Install Redis locally
   brew install redis  # macOS
   # or use Docker
   docker run -d -p 6379:6379 redis
   
   # Configure
   REDIS_PROVIDER=standard
   REDIS_URL=redis://localhost:6379
   ```

3. **Use Upstash Free Tier**
   - Sign up at upstash.com
   - Create a free database
   - Configure as shown above

## Usage

### Using Cache Service Directly

```typescript
import CacheService, { CacheTTL } from "@/lib/server/cache/cache.service";

// Simple get/set
await CacheService.set("mykey", { data: "value" }, CacheTTL.SHORT);
const data = await CacheService.get<MyType>("mykey");

// Cache-aside pattern (recommended)
const user = await CacheService.wrap(
  "user:123",
  async () => {
    // This only runs on cache miss
    return await prisma.user.findUnique({ where: { id: 123 } });
  },
  CacheTTL.USER
);

// Invalidation
await CacheService.del("user:123");
await CacheService.delMany(["user:123", "user:456"]);
```

### Cached Functions

The following user service functions are already cached:

#### `getUserByClerkId(clerkId: string)`
- **Cache Key**: `user:clerk:{clerkId}`
- **TTL**: 5 minutes
- **Invalidation**: Automatic on user sync

#### `getUserProfile(options)`
- **Cache Key**: `user:profile:{userId}` or `user:clerk:{clerkId}`
- **TTL**: 5 minutes
- **Note**: Only caches simple ID lookups

#### `syncUserWithClerk(userId, email, name)`
- **Action**: Invalidates cache after user update/creation
- **Keys Invalidated**: `user:clerk:{userId}`, `user:profile:{id}`

## Cache TTL Constants

```typescript
CacheTTL.USER     // 5 minutes  - User data
CacheTTL.SESSION  // 1 minute   - Session data
CacheTTL.SHORT    // 30 seconds - Volatile data
CacheTTL.MEDIUM   // 10 minutes - Semi-stable data
CacheTTL.LONG     // 1 hour     - Stable data
```

## Switching Redis Providers

### From Upstash to Azure

1. Update `.env.local`:
   ```env
   REDIS_PROVIDER=azure
   REDIS_URL=rediss://your-azure-redis.redis.cache.windows.net:6380
   ```

2. Restart your application

**That's it!** No code changes needed.

### From Azure to Self-Hosted

1. Update `.env.local`:
   ```env
   REDIS_PROVIDER=standard
   REDIS_URL=redis://your-redis-server:6379
   ```

2. Restart your application

## Adding Caching to New Services

```typescript
import CacheService, { CacheTTL, CachePrefix } from "@/lib/server/cache/cache.service";

export async function getProduct(id: string) {
  const cacheKey = `product:${id}`;
  
  return await CacheService.wrap(
    cacheKey,
    async () => {
      // Your database query
      return await prisma.product.findUnique({ where: { id } });
    },
    CacheTTL.MEDIUM
  );
}

export async function updateProduct(id: string, data: UpdateData) {
  const product = await prisma.product.update({
    where: { id },
    data,
  });
  
  // Invalidate cache
  await CacheService.del(`product:${id}`);
  
  return product;
}
```

## Best Practices

### 1. Cache Key Naming
Use consistent prefixes:
```typescript
user:clerk:{clerkId}
user:profile:{userId}
product:{productId}
session:{sessionId}
```

### 2. TTL Selection
- **High-frequency, low-change**: Long TTL (1 hour)
- **User data**: Medium TTL (5 minutes)
- **Session data**: Short TTL (1 minute)
- **Real-time data**: Very short or no cache

### 3. Cache Invalidation
Always invalidate cache on mutations:
```typescript
// Update database
const user = await prisma.user.update({ ... });

// Invalidate all related cache keys
await CacheService.invalidate([
  `user:clerk:${user.clerkId}`,
  `user:profile:${user.id}`,
]);
```

### 4. Error Handling
The cache service fails gracefully. If Redis is down:
- `get()` returns `null` (cache miss)
- `set()` logs error and continues
- Your application continues working

### 5. Don't Cache Everything
Skip caching for:
- Write-heavy data
- Large payloads (>1MB)
- Highly personalized data
- Real-time requirements

## Monitoring

### Check if Redis is Available

```typescript
import CacheService from "@/lib/server/cache/cache.service";

if (CacheService.isAvailable()) {
  console.log("✅ Redis is connected");
} else {
  console.log("⚠️ Running without Redis cache");
}
```

### Logs

The caching layer logs important events:
- Connection status
- Cache errors (non-fatal)
- Provider initialization

Check your application logs for:
```
Initializing Redis with provider: upstash
Redis initialized successfully
```

## Production Deployment

### Vercel (Recommended: Upstash)

1. Add environment variables in Vercel dashboard:
   ```
   REDIS_PROVIDER=upstash
   UPSTASH_REDIS_REST_URL=...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

2. Deploy - caching works automatically

### Azure App Service (Azure Redis)

1. Provision Azure Redis Cache
2. Add connection string to App Service configuration
3. Set `REDIS_PROVIDER=azure`

### Self-Hosted

1. Deploy Redis server (Docker recommended)
2. Configure `REDIS_URL` with connection string
3. Set `REDIS_PROVIDER=standard`

## Troubleshooting

### Cache Not Working

1. Check environment variables are set correctly
2. Check logs for initialization errors
3. Verify Redis connectivity:
   ```bash
   # For Upstash
   curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" $UPSTASH_REDIS_REST_URL/ping
   
   # For standard Redis
   redis-cli ping
   ```

### Performance Issues

1. Monitor cache hit rate
2. Adjust TTL values
3. Consider caching more aggressively
4. Check Redis memory usage

### Connection Errors

- **IORedis**: Check network connectivity, firewall rules
- **Upstash**: Verify REST URL and token are correct
- **Azure**: Ensure using `rediss://` (SSL) and correct password

## File Structure

```
src/
├── config/
│   └── cache/
│       └── redis.ts                 # Factory pattern (provider selection)
├── lib/
│   └── server/
│       ├── cache/
│       │   ├── redis-adapter.interface.ts  # Common interface
│       │   ├── cache.service.ts            # High-level cache API
│       │   └── adapters/
│       │       ├── upstash.adapter.ts      # Upstash implementation
│       │       └── ioredis.adapter.ts      # Standard Redis implementation
│       └── services/
│           └── user.service.ts             # Example: Cached user queries
```

## Support

For issues or questions:
1. Check logs for error messages
2. Verify environment configuration
3. Test Redis connection separately
4. Review this documentation

## License

Part of the Infographix AI application.

