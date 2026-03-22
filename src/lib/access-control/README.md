# Access Control Framework

A centralized mechanism for checking user access to features based on subscription status, tier, and credits.

## Overview

This framework provides:
- **Subscription Status Checks**: Active, Inactive, Trial, Canceled, Past Due
- **Tier-Based Feature Access**: Free, Plus, Pro, Enterprise
- **Credit Availability Checks**: Prevents actions when credits are insufficient
- **Server-Side Validation**: Secure, authoritative access checks
- **Client-Side Utilities**: Optimistic UI updates and badges

## Architecture

### Core Components

1. **Feature Definitions** (`features.ts`)
   - Defines all features and their tier requirements
   - Maps features to subscription tiers

2. **Server-Side Service** (`access-control.service.ts`)
   - Authoritative access checks
   - Handles subscription status, tier, and credit validation
   - No PII exposure

3. **API Endpoint** (`/api/access/check`)
   - RESTful endpoint for client-side access checks
   - Supports feature checks, credit checks, and full validation

4. **Client-Side Hook** (`use-access-check.ts`)
   - React hook for component-level access checks
   - Supports server and client-side validation
   - Optimistic UI updates

5. **UI Components**
   - `FeatureBadge`: Displays tier badges (Pro, Plus, etc.)
   - `FeatureGuard`: Conditionally renders based on access

## Usage

### Server-Side (API Routes, Server Actions)

```typescript
import { checkAccess, canAccessFeature } from "@/lib/server/services/access-control.service";

// Full access check
const result = await checkAccess(userId, {
  featureId: "chat:model_selection",
  requiredCredits: 1,
});

if (!result.allowed) {
  return Response.json({ error: result.message }, { status: 403 });
}

// Feature-specific check
const canAccess = await canAccessFeature(userId, "chat:model_selection");

// Credit check
const hasCredits = await hasSufficientCredits(userId, 5);
```

### Client-Side (React Components)

```typescript
import { useAccessCheck } from "@/hooks/use-access-check";
import { FeatureGuard } from "@/components/access-control/feature-guard";
import { FeatureBadge } from "@/components/access-control/feature-badge";

// Using the hook
function MyComponent() {
  const { canAccess, checkAccess, isChecking } = useAccessCheck({
    featureId: "chat:model_selection",
    requiredCredits: 1,
  });

  const handleAction = async () => {
    const result = await checkAccess();
    if (!result.allowed) {
      toast.error(result.message);
      return;
    }
    // Proceed with action
  };

  return (
    <Button disabled={!canAccess || isChecking} onClick={handleAction}>
      Use Feature
    </Button>
  );
}

// Using FeatureGuard component
function ChatComponent() {
  return (
    <FeatureGuard featureId="chat:model_selection">
      <ModelSelector />
    </FeatureGuard>
  );
}

// Using FeatureBadge
function SettingsPage() {
  return (
    <div>
      <label>AI Model</label>
      <FeatureBadge featureId="chat:model_selection" />
    </div>
  );
}
```

## Feature Definitions

Features are defined in `features.ts`. To add a new feature:

```typescript
export const FEATURES: Record<FeatureId, FeatureDefinition> = {
  "my:new:feature": {
    id: "my:new:feature",
    requiredTier: "pro",
    name: "My New Feature",
    description: "Description of the feature",
    badge: "Pro", // Optional badge text
  },
};
```

## Subscription Status Behavior

### Active Subscription
- ✅ Can perform all actions
- ✅ Can access features based on tier
- ✅ Can use credits

### Inactive Subscription
- ❌ Cannot perform actions (start chat, add source, generate content, save templates)
- ✅ Can view existing content
- ❌ Cannot access any features

### Trial Expired
- ❌ Same as inactive
- ✅ Can view existing content

### Canceled / Past Due
- ❌ Cannot perform actions
- ✅ Can view existing content

## Tier Hierarchy

```
Free < Plus < Pro < Enterprise
```

Users on a higher tier can access all features of lower tiers.

## Credit Checks

Even with an active subscription and correct tier, users cannot perform credit-consuming actions if they have insufficient credits:

```typescript
const result = await checkAccess(userId, {
  requiredCredits: 5,
});

if (!result.allowed && result.reason === "insufficient_credits") {
  // Show upgrade message or credit purchase option
}
```

## Security Considerations

1. **Server-Side Validation**: Always validate access on the server. Client-side checks are for UX only.
2. **No PII Exposure**: The access control service does not expose personal information.
3. **Fail Securely**: On errors, access is denied by default.
4. **Performance**: Server checks are cached where possible.

## Best Practices

1. **Use Server Validation**: Always use `useServerValidation: true` in production
2. **Check Before Actions**: Always call `checkAccess()` before performing actions
3. **Show Clear Messages**: Display user-friendly error messages
4. **Provide Upgrade Paths**: Link to `/plans` when access is denied
5. **Optimistic UI**: Use client-side checks for immediate feedback, but validate on server

## Examples

### Protecting a Chat Feature

```typescript
// In your chat component
const { checkAccess } = useAccessCheck({
  featureId: "chat:start",
  requiredCredits: CHAT_MESSAGE_COST,
});

const handleSendMessage = async () => {
  const access = await checkAccess();
  if (!access.allowed) {
    toast.error(access.message);
    if (access.reason === "insufficient_tier") {
      router.push("/plans");
    }
    return;
  }
  // Send message
};
```

### Protecting Model Selection

```typescript
// In settings or chat component
<FeatureGuard featureId="chat:model_selection">
  <ModelSelector />
</FeatureGuard>

// Or with badge
<div>
  <label>AI Model <FeatureBadge featureId="chat:model_selection" /></label>
  <ModelSelector />
</div>
```

### API Route Protection

```typescript
// In your API route
export async function POST(request: Request) {
  const { userId } = await auth();
  const user = await getUserByClerkId(userId);
  
  const access = await checkAccess(user.id, {
    featureId: "content:generate",
    requiredCredits: CONTENT_GENERATION_COST,
  });
  
  if (!access.allowed) {
    return Response.json(
      { error: access.message },
      { status: 403 }
    );
  }
  
  // Proceed with generation
}
```

## Migration Guide

If you're migrating from the old access check system:

1. Replace `useAccessCheck` calls with feature IDs
2. Add `featureId` to access checks
3. Use `FeatureGuard` for conditional rendering
4. Add `FeatureBadge` to show tier requirements
5. Update API routes to use `checkAccess` from the service

## Troubleshooting

### Access Denied When It Should Be Allowed
- Check subscription status in database
- Verify trial expiration date
- Check credit balance
- Ensure feature tier requirement matches user tier

### Badge Not Showing
- Verify feature is defined in `features.ts`
- Check that `badge` property is set in feature definition

### Server Validation Failing
- Check API endpoint is accessible
- Verify authentication is working
- Check server logs for errors
