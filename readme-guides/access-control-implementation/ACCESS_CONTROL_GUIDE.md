# Access Control Framework - Complete Guide

A comprehensive guide to the centralized access control system for managing feature access based on subscription status, tier, and credits.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Adding New Features](#adding-new-features)
5. [Removing Features](#removing-features)
6. [Using Access Control](#using-access-control)
7. [Integration Examples](#integration-examples)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Access Control Framework provides a centralized mechanism to check if users can access specific features or parts of the application. It handles:

- **Subscription Status**: Active, Inactive, Trial, Canceled, Past Due
- **Tier-Based Access**: Free, Plus, Pro, Enterprise
- **Credit Availability**: Prevents actions when credits are insufficient
- **Security**: Server-side validation with no PII exposure

### Key Behaviors

**Inactive Subscription (Trial Expired, Payment Failed, Canceled):**
- ❌ Cannot start chat
- ❌ Cannot add sources
- ❌ Cannot generate content
- ❌ Cannot save/create templates
- ✅ Can view existing content (read-only)

**Active Subscription:**
- ✅ Can perform actions based on subscription tier
- ✅ Features gated by tier (e.g., Pro features require Pro plan)
- ✅ Credit checks prevent actions when credits are insufficient

---

## Architecture

### Core Components

```
src/lib/access-control/
├── features.ts              # Feature definitions and tier requirements
├── utils.ts                 # Client-side utility functions
├── index.ts                 # Public API exports
└── README.md                # Framework documentation

src/lib/server/services/
└── access-control.service.ts # Server-side access control logic

src/hooks/
└── use-access-check.ts      # React hook for client-side checks

src/components/access-control/
├── feature-guard.tsx        # Component for conditional rendering
└── feature-badge.tsx         # Component for tier badges

src/app/api/access/
└── check/route.ts           # API endpoint for access checks
```

### Data Flow

1. **Feature Definition** → Defined in `features.ts` with tier requirements
2. **Client Check** → Uses `useAccessCheck` hook or `FeatureGuard` component
3. **API Validation** → Calls `/api/access/check` for server-side validation
4. **Server Service** → `access-control.service.ts` performs authoritative check
5. **Response** → Returns access result with reason and message

---

## File Structure

### 1. Feature Definitions (`src/lib/access-control/features.ts`)

**Purpose**: Central registry of all features and their tier requirements.

**Key Exports**:
- `FEATURES`: Record of all feature definitions
- `FeatureId`: Type for feature identifiers
- `PlanTier`: Type for subscription tiers (free, plus, pro, enterprise)
- `tierHasAccess()`: Function to check tier hierarchy
- `getFeature()`: Get feature definition by ID
- `getFeatureBadge()`: Get badge text for a feature

**Feature Definition Structure**:
```typescript
{
  id: "chat:model_selection",
  requiredTier: "pro",
  name: "AI Model Selection",
  description: "Select different AI models for chat",
  badge: "Pro", // Optional badge text
}
```

### 2. Server Service (`src/lib/server/services/access-control.service.ts`)

**Purpose**: Authoritative server-side access control checks.

**Key Functions**:
- `checkAccess()`: Comprehensive access check (status, tier, credits)
- `canAccessFeature()`: Check feature access for a user
- `hasSufficientCredits()`: Check credit availability
- `canPerformActions()`: Quick check if user can perform actions
- `getUserTier()`: Get user's current subscription tier

**Access Check Result**:
```typescript
{
  allowed: boolean;
  reason?: "subscription_inactive" | "trial_expired" | "insufficient_tier" | "insufficient_credits" | ...;
  message?: string;
  currentTier?: PlanTier;
  requiredTier?: PlanTier;
  creditsRemaining?: number;
  creditsRequired?: number;
  creditsNeeded?: number;
}
```

### 3. Client Hook (`src/hooks/use-access-check.ts`)

**Purpose**: React hook for client-side access checks.

**Usage**:
```typescript
const { canAccess, checkAccess, isChecking, lastCheck } = useAccessCheck({
  featureId: "chat:model_selection",
  requiredCredits: 1,
  useServerValidation: true,
});
```

**Returns**:
- `canAccess`: Quick synchronous check (for UI disabled states)
- `checkAccess()`: Async comprehensive check (before actions)
- `isChecking`: Loading state
- `lastCheck`: Last access check result

### 4. UI Components

**FeatureGuard** (`src/components/access-control/feature-guard.tsx`):
- Conditionally renders children based on access
- Shows upgrade message or custom fallback when denied

**FeatureBadge** (`src/components/access-control/feature-badge.tsx`):
- Displays tier badge (Pro, Plus, Enterprise)
- Only shows if feature has a badge defined

### 5. API Endpoint (`src/app/api/access/check/route.ts`)

**Purpose**: RESTful endpoint for client-side access validation.

**Request**:
```typescript
POST /api/access/check
{
  featureId?: "chat:model_selection",
  requiredCredits?: 5,
  checkType?: "full" | "feature" | "credits" | "actions"
}
```

**Response**: Same as `AccessCheckResult` from server service.

---

## Adding New Features

### Step-by-Step Process

#### Step 1: Define the Feature

Edit `src/lib/access-control/features.ts`:

```typescript
// 1. Add feature ID to FeatureId type
export type FeatureId =
  | "chat:start"
  | "chat:model_selection"
  | "my:new:feature" // ← Add here
  // ... other features

// 2. Add feature definition to FEATURES object
export const FEATURES: Record<FeatureId, FeatureDefinition> = {
  // ... existing features
  
  "my:new:feature": {
    id: "my:new:feature",
    requiredTier: "pro", // or "free" | "plus" | "enterprise"
    name: "My New Feature",
    description: "Description of what this feature does",
    badge: "Pro", // Optional: "Pro", "Plus", "Enterprise", etc.
  },
  
  // ... other features
};
```

#### Step 2: Use the Feature in Components

**Option A: Using FeatureGuard (Recommended for conditional rendering)**

```typescript
import { FeatureGuard } from "@/components/access-control/feature-guard";

function MyComponent() {
  return (
    <FeatureGuard 
      featureId="my:new:feature"
      fallback={<div>Upgrade to Pro to access this feature</div>}
    >
      <MyNewFeatureComponent />
    </FeatureGuard>
  );
}
```

**Option B: Using useAccessCheck Hook**

```typescript
import { useAccessCheck } from "@/hooks/use-access-check";

function MyComponent() {
  const { canAccess, checkAccess } = useAccessCheck({
    featureId: "my:new:feature",
    useServerValidation: true,
  });

  const handleAction = async () => {
    const access = await checkAccess();
    if (!access.allowed) {
      toast.error(access.message);
      return;
    }
    // Proceed with action
  };

  return (
    <Button disabled={!canAccess} onClick={handleAction}>
      Use Feature
    </Button>
  );
}
```

**Option C: Using FeatureBadge**

```typescript
import { FeatureBadge } from "@/components/access-control/feature-badge";

function SettingsPage() {
  return (
    <div>
      <label>
        My New Feature
        <FeatureBadge featureId="my:new:feature" />
      </label>
    </div>
  );
}
```

#### Step 3: Protect API Routes

Edit your API route file (e.g., `src/app/api/my-feature/route.ts`):

```typescript
import { checkAccess } from "@/lib/server/services/access-control.service";
import { getUserByClerkId } from "@/lib/server/services/user.service";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(userId);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Check access
  const access = await checkAccess(user.id, {
    featureId: "my:new:feature",
  });

  if (!access.allowed) {
    return Response.json(
      { error: access.message },
      { status: 403 }
    );
  }

  // Proceed with feature logic
  // ...
}
```

#### Step 4: Test the Feature

1. Test with different subscription tiers
2. Test with inactive subscriptions
3. Test with insufficient credits (if applicable)
4. Verify upgrade messages appear correctly
5. Verify badges display correctly

---

## Removing Features

### Step-by-Step Process

#### Step 1: Remove Feature Definition

Edit `src/lib/access-control/features.ts`:

```typescript
// 1. Remove from FeatureId type
export type FeatureId =
  | "chat:start"
  // | "my:old:feature" ← Remove this line
  | "chat:model_selection"

// 2. Remove from FEATURES object
export const FEATURES: Record<FeatureId, FeatureDefinition> = {
  // Remove the entire feature definition
  // "my:old:feature": { ... }, ← Remove this
};
```

#### Step 2: Remove Feature Usage

Search for the feature ID across the codebase:

```bash
# Search for feature usage
grep -r "my:old:feature" src/
```

Remove or update:
- `FeatureGuard` components using the feature
- `useAccessCheck` hooks with the feature
- `FeatureBadge` components
- API route checks
- Any other references

#### Step 3: Update Tests

- Remove feature-specific tests
- Update integration tests if needed

---

## Using Access Control

### Client-Side Usage

#### Basic Access Check

```typescript
import { useAccessCheck } from "@/hooks/use-access-check";

function MyComponent() {
  const { canAccess, checkAccess } = useAccessCheck({
    featureId: "chat:model_selection",
    useServerValidation: true, // Always use in production
  });

  return (
    <Button 
      disabled={!canAccess}
      onClick={async () => {
        const access = await checkAccess();
        if (!access.allowed) {
          toast.error(access.message);
          return;
        }
        // Proceed
      }}
    >
      Use Feature
    </Button>
  );
}
```

#### With Credit Check

```typescript
import { useAccessCheck } from "@/hooks/use-access-check";

function ContentGenerator() {
  const { canAccess, checkAccess } = useAccessCheck({
    featureId: "content:generate",
    requiredCredits: 5, // Required credits for this action
    useServerValidation: true,
  });

  const handleGenerate = async () => {
    const access = await checkAccess();
    if (!access.allowed) {
      if (access.reason === "insufficient_credits") {
        toast.error(`You need ${access.creditsNeeded} more credits`);
        router.push("/plans");
      } else {
        toast.error(access.message);
      }
      return;
    }
    // Proceed with generation
  };

  return (
    <Button disabled={!canAccess} onClick={handleGenerate}>
      Generate Content
    </Button>
  );
}
```

#### Conditional Rendering with FeatureGuard

```typescript
import { FeatureGuard } from "@/components/access-control/feature-guard";

function SettingsPage() {
  return (
    <div>
      <h2>General Settings</h2>
      <GeneralSettings />

      <h2>Pro Features</h2>
      <FeatureGuard 
        featureId="automation:triggers"
        showUpgradeMessage={true}
      >
        <AutomationSettings />
      </FeatureGuard>
    </div>
  );
}
```

#### Custom Fallback

```typescript
<FeatureGuard 
  featureId="chat:model_selection"
  fallback={
    <div className="p-4 border rounded">
      <p>Upgrade to Pro to select AI models</p>
      <Button onClick={() => router.push("/plans")}>
        View Plans
      </Button>
    </div>
  }
>
  <ModelSelector />
</FeatureGuard>
```

### Server-Side Usage

#### API Route Protection

```typescript
import { checkAccess } from "@/lib/server/services/access-control.service";
import { getUserByClerkId } from "@/lib/server/services/user.service";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(userId);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Check if user can perform actions (not just viewing)
  const access = await checkAccess(user.id, {
    allowViewOnly: false, // Block inactive users
  });

  if (!access.allowed) {
    return Response.json(
      { error: access.message, reason: access.reason },
      { status: 403 }
    );
  }

  // Proceed with action
}
```

#### Feature-Specific Check

```typescript
import { canAccessFeature } from "@/lib/server/services/access-control.service";

export async function POST(request: Request) {
  // ... auth and user setup ...

  const access = await canAccessFeature(user.id, "chat:model_selection");
  
  if (!access.allowed) {
    return Response.json(
      { error: access.message },
      { status: 403 }
    );
  }

  // Proceed
}
```

#### Credit Check

```typescript
import { hasSufficientCredits } from "@/lib/server/services/access-control.service";

export async function POST(request: Request) {
  // ... auth and user setup ...

  const creditCheck = await hasSufficientCredits(user.id, 5);
  
  if (!creditCheck.allowed) {
    return Response.json(
      {
        error: creditCheck.message,
        creditsRemaining: creditCheck.creditsRemaining,
        creditsNeeded: creditCheck.creditsNeeded,
      },
      { status: 400 }
    );
  }

  // Deduct credits and proceed
}
```

#### Server Component Usage

```typescript
import { checkAccess } from "@/lib/server/services/access-control.service";
import { getUserByClerkId } from "@/lib/server/services/user.service";
import { auth, redirect } from "@clerk/nextjs/server";

export default async function ProtectedPage() {
  const { userId } = await auth();
  const user = await getUserByClerkId(userId);
  
  const access = await checkAccess(user.id, {
    featureId: "analytics:advanced",
  });
  
  if (!access.allowed) {
    redirect("/plans");
  }
  
  return <AdvancedAnalytics />;
}
```

---

## Integration Examples

### Example 1: Protecting Chat Model Selection (Pro Feature)

**Component Implementation**:

```typescript
import { FeatureGuard } from "@/components/access-control/feature-guard";
import { FeatureBadge } from "@/components/access-control/feature-badge";
import { useAccessCheck } from "@/hooks/use-access-check";

function ChatSettings() {
  const { canAccess, checkAccess } = useAccessCheck({
    featureId: "chat:model_selection",
    useServerValidation: true,
  });

  const handleModelChange = async (modelId: string) => {
    const access = await checkAccess();
    if (!access.allowed) {
      toast.error(access.message);
      if (access.reason === "insufficient_tier") {
        router.push("/plans");
      }
      return;
    }
    await updateUserModel(modelId);
  };

  return (
    <div>
      <label>
        AI Model
        <FeatureBadge featureId="chat:model_selection" />
      </label>
      
      <FeatureGuard 
        featureId="chat:model_selection"
        fallback={
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Pro feature" />
            </SelectTrigger>
          </Select>
        }
      >
        <ModelSelector onModelChange={handleModelChange} />
      </FeatureGuard>
    </div>
  );
}
```

**API Route Protection**:

```typescript
import { checkAccess } from "@/lib/server/services/access-control.service";

export async function POST(request: Request) {
  const { userId } = await auth();
  const user = await getUserByClerkId(userId);
  
  const body = await request.json();
  const { model } = body;
  
  // Check if model selection is allowed (Pro feature)
  if (model !== DEFAULT_MODEL) {
    const access = await checkAccess(user.id, {
      featureId: "chat:model_selection",
    });
    
    if (!access.allowed) {
      return Response.json(
        { error: access.message },
        { status: 403 }
      );
    }
  }
  
  // Continue with chat...
}
```

### Example 2: Protecting Content Generation with Credits

```typescript
import { useAccessCheck } from "@/hooks/use-access-check";
import { CONTENT_GENERATION_COST } from "@/config/content/costs";

function ContentGenerationButton() {
  const { canAccess, checkAccess, isChecking } = useAccessCheck({
    featureId: "content:generate",
    requiredCredits: CONTENT_GENERATION_COST,
  });

  const handleGenerate = async () => {
    const access = await checkAccess();
    if (!access.allowed) {
      toast.error(access.message);
      if (access.reason === "insufficient_credits") {
        router.push("/plans");
      }
      return;
    }
    await generateContent();
  };

  return (
    <Button 
      disabled={!canAccess || isChecking}
      onClick={handleGenerate}
    >
      Generate Content
    </Button>
  );
}
```

### Example 3: Blocking Actions for Inactive Users

```typescript
import { useAccessCheck } from "@/hooks/use-access-check";

function AddSourceButton() {
  const { canAccess, checkAccess } = useAccessCheck({
    featureId: "source:add",
    useServerValidation: true,
  });

  const handleAddSource = async () => {
    const access = await checkAccess();
    if (!access.allowed) {
      toast.error(access.message);
      return;
    }
    setDialogOpen(true);
  };

  return (
    <Button disabled={!canAccess} onClick={handleAddSource}>
      Add Source
    </Button>
  );
}
```

### Example 4: Conditional Feature Display

```typescript
import { FeatureGuard } from "@/components/access-control/feature-guard";

function SettingsPage() {
  return (
    <div>
      <h2>General Settings</h2>
      <GeneralSettings />
      
      <h2>Advanced Settings</h2>
      <FeatureGuard featureId="automation:triggers">
        <AutomationSettings />
      </FeatureGuard>
      
      <FeatureGuard featureId="automation:workflows">
        <CustomWorkflowsSettings />
      </FeatureGuard>
    </div>
  );
}
```

### Example 5: Disabling UI Elements with Badges

```typescript
import { useAccessCheck } from "@/hooks/use-access-check";
import { FeatureBadge } from "@/components/access-control/feature-badge";

function FeatureButton() {
  const { canAccess } = useAccessCheck({
    featureId: "content:save_template",
  });

  return (
    <div className="relative">
      <Button disabled={!canAccess}>
        Save Template
      </Button>
      {!canAccess && (
        <FeatureBadge 
          featureId="content:save_template"
          className="absolute -top-2 -right-2"
        />
      )}
    </div>
  );
}
```

---

## Best Practices

### 1. Always Validate on Server

**Client-side checks are for UX only. Server-side checks are for security.**

```typescript
// ✅ Good: Check on server
const access = await checkAccess(user.id, { featureId: "my:feature" });
if (!access.allowed) {
  return Response.json({ error: access.message }, { status: 403 });
}

// ❌ Bad: Only checking on client
if (!canAccess) {
  return; // User can bypass this!
}
```

### 2. Use Server Validation in Production

```typescript
// ✅ Good
const { checkAccess } = useAccessCheck({
  featureId: "my:feature",
  useServerValidation: true, // Always use in production
});

// ⚠️ Acceptable for development/testing only
const { checkAccess } = useAccessCheck({
  featureId: "my:feature",
  useServerValidation: false, // Only for quick prototyping
});
```

### 3. Show Clear Error Messages

```typescript
// ✅ Good
if (!access.allowed) {
  toast.error(access.message); // Uses message from server
  if (access.reason === "insufficient_tier") {
    router.push("/plans"); // Provide upgrade path
  }
}

// ❌ Bad
if (!access.allowed) {
  toast.error("Access denied"); // Not helpful
}
```

### 4. Handle All Access Denial Reasons

```typescript
const access = await checkAccess();
if (!access.allowed) {
  switch (access.reason) {
    case "insufficient_tier":
      toast.error(access.message);
      router.push("/plans");
      break;
    case "insufficient_credits":
      toast.error(`You need ${access.creditsNeeded} more credits`);
      router.push("/plans");
      break;
    case "subscription_inactive":
    case "trial_expired":
      toast.error(access.message);
      router.push("/plans");
      break;
    default:
      toast.error(access.message || "Access denied");
  }
  return;
}
```

### 5. Use FeatureGuard for Conditional Rendering

```typescript
// ✅ Good: Clean and declarative
<FeatureGuard featureId="chat:model_selection">
  <ModelSelector />
</FeatureGuard>

// ⚠️ Acceptable but more verbose
{canAccess && <ModelSelector />}
{!canAccess && <UpgradeMessage />}
```

### 6. Check Credits Before Credit-Consuming Actions

```typescript
// ✅ Good: Check before action
const access = await checkAccess(user.id, {
  featureId: "content:generate",
  requiredCredits: 5,
});

if (!access.allowed) {
  return Response.json({ error: access.message }, { status: 400 });
}

// Then deduct credits
await deductCredits(user.id, 5, "content_generation");
```

### 7. Provide Upgrade Paths

Always link to `/plans` when access is denied due to tier:

```typescript
if (access.reason === "insufficient_tier") {
  toast.error(access.message, {
    action: {
      label: "Upgrade",
      onClick: () => router.push("/plans"),
    },
  });
}
```

---

## Troubleshooting

### Access Denied When It Should Be Allowed

**Checklist**:
1. Verify subscription status in database
2. Check trial expiration date (`trialEndDate`)
3. Verify user's plan tier matches feature requirement
4. Check credit balance if credits are required
5. Ensure feature is defined in `features.ts`
6. Check server logs for errors

**Debug Steps**:
```typescript
// Add logging in your component
const access = await checkAccess();
console.log("Access check result:", {
  allowed: access.allowed,
  reason: access.reason,
  currentTier: access.currentTier,
  requiredTier: access.requiredTier,
  creditsRemaining: access.creditsRemaining,
});
```

### Badge Not Showing

**Possible Causes**:
1. Feature doesn't have `badge` property defined
2. Feature ID is incorrect
3. Component not imported correctly

**Solution**:
```typescript
// Check feature definition
const feature = getFeature("my:feature");
console.log("Feature badge:", feature?.badge);

// Verify badge is set
"my:feature": {
  id: "my:feature",
  requiredTier: "pro",
  badge: "Pro", // ← Must be set
}
```

### Server Validation Failing

**Checklist**:
1. Verify API endpoint is accessible (`/api/access/check`)
2. Check authentication is working
3. Verify user exists in database
4. Check server logs for errors
5. Ensure `useServerValidation: true` is set

**Debug**:
```typescript
// Test API endpoint directly
const response = await fetch("/api/access/check", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    featureId: "my:feature",
    checkType: "feature",
  }),
});
const result = await response.json();
console.log("API result:", result);
```

### Feature Not Found Error

**Cause**: Feature ID doesn't exist in `FEATURES` object.

**Solution**: Add feature to `features.ts` following [Adding New Features](#adding-new-features) guide.

### Credits Check Always Failing

**Checklist**:
1. Verify credit balance in database
2. Check `requiredCredits` value is correct
3. Ensure credits service is working
4. Check for race conditions (multiple simultaneous requests)

---

## Quick Reference

### Feature Definition Template

```typescript
"feature:name": {
  id: "feature:name",
  requiredTier: "pro", // "free" | "plus" | "pro" | "enterprise"
  name: "Feature Name",
  description: "What this feature does",
  badge: "Pro", // Optional
}
```

### Access Check Template

```typescript
// Client-side
const { canAccess, checkAccess } = useAccessCheck({
  featureId: "feature:name",
  requiredCredits: 5, // Optional
  useServerValidation: true,
});

// Server-side
const access = await checkAccess(userId, {
  featureId: "feature:name",
  requiredCredits: 5, // Optional
});
```

### Component Usage Template

```typescript
// Conditional rendering
<FeatureGuard featureId="feature:name">
  <FeatureComponent />
</FeatureGuard>

// Badge display
<FeatureBadge featureId="feature:name" />
```

---

## Related Documentation

- [Credit System Guide](./credit-system-info-implementation/CREDIT_SYSTEM_GUIDE.md)
- [Subscription Service](../src/lib/server/services/subscription.service.ts)
- [Access Control API](../src/app/api/access/check/route.ts)

---

## Support

For questions or issues:
1. Check this guide first
2. Review integration examples
3. Check server logs
4. Verify feature definitions
5. Contact the team
