# Credit Management System - Complete Guide

A production-grade, real-time credit management system with optimistic updates, centralized state management, and event-driven architecture.

## 🎯 Overview

This system provides:
- **Centralized State**: Single source of truth for credits across the app
- **Optimistic Updates**: Instant UI feedback before server confirmation
- **Event-Driven**: Trigger updates from anywhere in the app
- **Auto-Refresh**: Optional polling for real-time sync
- **Race Condition Safe**: Prevents conflicts from concurrent requests
- **Error Recovery**: Automatic rollback on failed operations
- **TypeScript**: Full type safety

## 📁 Files

```
src/
├── contexts/
│   ├── credit-context.tsx          # Main context and provider
│   └── CREDIT_SYSTEM_GUIDE.md      # This file
├── hooks/
│   └── use-credit-deduction.ts     # Credit deduction hook
├── components/
│   └── credit-info.tsx             # Display component with variants
└── app/
    └── providers.tsx               # Root providers (CreditProvider included)
```

## 🚀 Quick Start

### 1. Setup (Already Done)

The `CreditProvider` is already wrapped in `providers.tsx`:

```tsx
// src/app/providers.tsx
<CreditProvider enableOptimisticUpdates={true}>
  {children}
</CreditProvider>
```

### 2. Display Credits

Use the `CreditInfo` component anywhere:

```tsx
import { CreditInfo } from "@/components/credit-info";

// In sidebar
<CreditInfo variant="sidebar" />

// In header
<CreditInfo variant="header" />

// In dropdown menu
<CreditInfo variant="menu" />

// On a page
<CreditInfo variant="page" showProgress />
```

### 3. Deduct Credits

Use the `useCreditDeduction` hook in your components:

```tsx
"use client";

import { useCreditDeduction } from "@/hooks/use-credit-deduction";
import { Button } from "@/components/ui/button";

export function GenerateButton() {
  const { deductCredits, isDeducting } = useCreditDeduction({
    showSuccessToast: true,
    successMessage: "Image generated successfully!",
  });

  const handleGenerate = async () => {
    try {
      await deductCredits({
        amount: 1,
        reason: "image_generation",
        metadata: { type: "ai_image" },
      });

      // Proceed with generation...
    } catch (error) {
      // Error already handled by the hook
      console.error("Failed:", error);
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={isDeducting}>
      {isDeducting ? "Processing..." : "Generate Image"}
    </Button>
  );
}
```

## 📚 Detailed Usage

### Using the Context Hook

Access credit info anywhere in your app:

```tsx
import { useCreditInfo } from "@/contexts/credit-context";

function MyComponent() {
  const {
    subscription,      // Current subscription info
    loading,           // Loading state
    error,             // Error state
    refreshCredits,    // Manually refresh
    deductCredits,     // Optimistic deduction
    updateCredits,     // Direct update
    lastUpdated,       // Last update timestamp
  } = useCreditInfo();

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <p>Credits: {subscription?.creditsRemaining}</p>
      <p>Plan: {subscription?.planName}</p>
      <button onClick={refreshCredits}>Refresh</button>
    </div>
  );
}
```

### Credit Deduction Hook

The `useCreditDeduction` hook provides a complete solution:

```tsx
const { deductCredits, isDeducting } = useCreditDeduction({
  // Options
  showSuccessToast: true,         // Show success notification
  showErrorToast: true,            // Show error notification
  successMessage: "Credits used!", // Custom success message
  errorMessage: "Failed!",         // Custom error message
  onSuccess: (remaining) => {      // Success callback
    console.log("Remaining:", remaining);
  },
  onError: (error) => {            // Error callback
    console.error("Error:", error);
  },
});

// Use it
await deductCredits({
  amount: 5,                    // Credits to deduct
  reason: "video_generation",   // Reason (optional)
  metadata: {                   // Additional data (optional)
    duration: "30s",
    quality: "HD",
  },
});
```

### Check Available Credits

```tsx
import { useHasCredits } from "@/hooks/use-credit-deduction";

function FeatureButton() {
  const { hasEnoughCredits, creditsRemaining, creditsNeeded } = 
    useHasCredits(10); // Requires 10 credits

  if (!hasEnoughCredits) {
    return (
      <div>
        <p>Not enough credits!</p>
        <p>You need {creditsNeeded} more credits</p>
        <Button>Upgrade</Button>
      </div>
    );
  }

  return <Button>Use Feature (10 credits)</Button>;
}
```

## 🎪 Advanced Usage

### Trigger Updates from Anywhere

```tsx
import { triggerCreditUpdate, triggerCreditDeduction } from "@/contexts/credit-context";

// After an API call or external action
triggerCreditUpdate(); // Full refresh

// When you know the exact amount deducted
triggerCreditDeduction(5); // Optimistic update
```

### In API Route Handlers

```tsx
// app/api/some-action/route.ts
import { triggerCreditUpdate } from "@/contexts/credit-context";

export async function POST(request: Request) {
  // ... your logic ...
  
  // Trigger update (works on client-side only)
  // Client components will receive the event
  
  return Response.json({ success: true });
}
```

### Using in Non-React Code

```tsx
// In a service file or utility
export async function performAction() {
  // ... some action that uses credits ...
  
  // Trigger update from anywhere
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('creditUpdate', {
      detail: { amount: 3 }
    }));
  }
}
```

### Auto-Refresh Configuration

Enable automatic polling (useful for real-time apps):

```tsx
// In providers.tsx
<CreditProvider 
  enableOptimisticUpdates={true}
  autoRefreshInterval={30000} // Refresh every 30 seconds
>
  {children}
</CreditProvider>
```

### Manual Refresh After Operations

```tsx
function MyComponent() {
  const { refreshCredits } = useCreditInfo();

  const performExpensiveOperation = async () => {
    await someApiCall();
    
    // Manually refresh to get latest credits
    await refreshCredits();
  };

  return <Button onClick={performExpensiveOperation}>Do Something</Button>;
}
```

## 🏗️ Architecture

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    CreditProvider                       │
│  • Centralized state management                         │
│  • Handles all API calls                                │
│  • Manages race conditions                              │
│  • Listens for custom events                            │
└─────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
    │Component│      │Component│      │Component│
    │    A    │      │    B    │      │    C    │
    └─────────┘      └─────────┘      └─────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
              All components stay in sync
```

### State Flow

1. **Initial Load**: Provider fetches credits on mount
2. **User Action**: Component calls `deductCredits`
3. **Optimistic Update**: UI updates immediately
4. **API Call**: Request sent to `/api/credits/deduct`
5. **Confirmation**: Real data fetched and synced
6. **All Components Update**: All `CreditInfo` instances update automatically

### Event System

```
Component Action → useCreditDeduction hook
                      ↓
                Optimistic Update (UI)
                      ↓
                API Call (/api/credits/deduct)
                      ↓
                Custom Event Dispatched
                      ↓
           CreditProvider Receives Event
                      ↓
          All Components Update Automatically
```

## 🛡️ Error Handling

The system automatically handles:

- **Network Errors**: Shows error toast, rolls back optimistic update
- **Insufficient Credits**: API returns error, user notified
- **Race Conditions**: Cancels outdated requests
- **Concurrent Updates**: Queues and processes in order

### Example with Error Recovery

```tsx
const { deductCredits } = useCreditDeduction({
  showErrorToast: true,
  onError: (error) => {
    // Custom error handling
    if (error.message.includes("insufficient")) {
      // Redirect to upgrade page
      window.location.href = "/plans";
    }
  },
});

try {
  await deductCredits({ amount: 100 });
  // Success - proceed
} catch (error) {
  // Error already handled, UI already rolled back
  // Additional error handling if needed
}
```

## 🎨 Best Practices

### ✅ Do's

```tsx
// ✅ Use the hook for credit deduction
const { deductCredits } = useCreditDeduction();
await deductCredits({ amount: 1 });

// ✅ Check credits before expensive operations
const { hasEnoughCredits } = useHasCredits(5);
if (!hasEnoughCredits) {
  toast.error("Not enough credits!");
  return;
}

// ✅ Use optimistic updates for better UX
<CreditProvider enableOptimisticUpdates={true}>

// ✅ Trigger updates after background operations
triggerCreditUpdate();
```

### ❌ Don'ts

```tsx
// ❌ Don't fetch credits manually in components
const [credits, setCredits] = useState(0);
fetch("/api/credits/check"); // Use useCreditInfo instead

// ❌ Don't bypass the deduction hook
fetch("/api/credits/deduct", { /* ... */ }); // Use useCreditDeduction

// ❌ Don't forget to handle loading states
const { subscription } = useCreditInfo();
return <div>{subscription.creditsRemaining}</div>; // Might be null!

// ✅ Always check loading/null states
const { subscription, loading } = useCreditInfo();
if (loading) return <Spinner />;
if (!subscription) return null;
```

## 🧪 Testing

### Mock the Context

```tsx
import { CreditContext } from "@/contexts/credit-context";

const mockCreditContext = {
  subscription: {
    planName: "Pro",
    planId: "pro",
    status: "active",
    creditsRemaining: 100,
    creditsTotal: 200,
  },
  loading: false,
  error: null,
  refreshCredits: jest.fn(),
  deductCredits: jest.fn(),
  updateCredits: jest.fn(),
  lastUpdated: new Date(),
};

// In your test
<CreditContext.Provider value={mockCreditContext}>
  <YourComponent />
</CreditContext.Provider>
```

## 🚦 Performance

### Optimizations

- **Request Cancellation**: Aborts ongoing requests when new ones start
- **Debounced Updates**: Groups rapid updates together
- **Optimistic Updates**: Instant UI feedback, no waiting
- **Conditional Polling**: Auto-refresh only when enabled
- **Memoized Callbacks**: Prevents unnecessary re-renders

### Monitoring

```tsx
const { lastUpdated } = useCreditInfo();

// Track how fresh the data is
const freshness = lastUpdated 
  ? Date.now() - lastUpdated.getTime() 
  : Infinity;

if (freshness > 60000) {
  console.warn("Credit data is stale (>1 min)");
}
```

## 🔄 Migration Guide

### From Old `Upgrade` Component

**Before:**
```tsx
import { Upgrade } from "@/components/upgrade";

<SidebarFooter>
  <Upgrade />
</SidebarFooter>
```

**After:**
```tsx
import { CreditInfo } from "@/components/credit-info";

<SidebarFooter>
  <CreditInfo variant="sidebar" />
</SidebarFooter>
```

### From Manual Credit Checks

**Before:**
```tsx
const [credits, setCredits] = useState(0);

useEffect(() => {
  fetch("/api/credits/check")
    .then(r => r.json())
    .then(data => setCredits(data.creditsRemaining));
}, []);
```

**After:**
```tsx
const { subscription } = useCreditInfo();
const credits = subscription?.creditsRemaining || 0;
```

## 📝 API Reference

### CreditProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoRefreshInterval` | `number` | `0` | Auto-refresh interval in ms (0 = disabled) |
| `enableOptimisticUpdates` | `boolean` | `true` | Enable instant UI updates |

### useCreditInfo() Returns

| Property | Type | Description |
|----------|------|-------------|
| `subscription` | `SubscriptionInfo \| null` | Current subscription data |
| `loading` | `boolean` | Loading state |
| `error` | `Error \| null` | Error state |
| `refreshCredits` | `() => Promise<void>` | Manually refresh |
| `deductCredits` | `(amount: number) => void` | Optimistic deduction |
| `updateCredits` | `(credits: number) => void` | Direct update |
| `lastUpdated` | `Date \| null` | Last update time |

### useCreditDeduction() Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showSuccessToast` | `boolean` | `false` | Show success notification |
| `showErrorToast` | `boolean` | `true` | Show error notification |
| `successMessage` | `string` | Auto | Custom success message |
| `errorMessage` | `string` | Auto | Custom error message |
| `onSuccess` | `(remaining: number) => void` | - | Success callback |
| `onError` | `(error: Error) => void` | - | Error callback |

## 🆘 Troubleshooting

### Credits Not Updating

```tsx
// Check if provider is wrapped
// Must be inside CreditProvider
const { subscription } = useCreditInfo(); // ✅

// Manually trigger refresh
const { refreshCredits } = useCreditInfo();
await refreshCredits();
```

### "useCreditInfo must be used within a CreditProvider"

```tsx
// ❌ Component is outside provider
<MyComponent /> // Uses useCreditInfo

// ✅ Wrap in provider
<CreditProvider>
  <MyComponent />
</CreditProvider>
```

### Stale Data

```tsx
// Enable auto-refresh
<CreditProvider autoRefreshInterval={30000}>
  {children}
</CreditProvider>

// Or manually refresh after operations
await refreshCredits();
```

---

## 🎉 Summary

This credit management system provides:

✅ **Real-time updates** across all components  
✅ **Optimistic UI** for instant feedback  
✅ **Error handling** with automatic rollback  
✅ **Type-safe** with full TypeScript support  
✅ **Production-ready** with race condition handling  
✅ **Developer-friendly** with simple hooks and utilities  

Use it with confidence! 🚀

