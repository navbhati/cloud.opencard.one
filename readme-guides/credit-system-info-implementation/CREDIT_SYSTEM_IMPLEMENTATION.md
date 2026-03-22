# Credit Management System - Implementation Summary

## 🎯 Overview

A production-grade, real-time credit management system with optimistic updates, centralized state management, and multi-variant display components.

## 📦 What's Included

### Core System

#### 1. **CreditProvider** - Context & State Management
**File:** `src/contexts/credit-context.tsx`

Features:
- Centralized credit state across the entire application
- Automatic data fetching and caching
- Race condition prevention with request cancellation
- Event-driven updates via custom events
- Optional auto-refresh polling
- Optimistic updates for instant UI feedback
- Error recovery and rollback

Exports:
- `CreditProvider` - Context provider component
- `useCreditInfo()` - Hook to access credit data
- `triggerCreditUpdate()` - Global update trigger
- `triggerCreditDeduction()` - Global deduction trigger

#### 2. **Credit Deduction Hook** - Smart Operations
**File:** `src/hooks/use-credit-deduction.ts`

Features:
- Simplified credit deduction with error handling
- Automatic toast notifications
- Success/error callbacks
- Loading states
- Optimistic updates with server confirmation

Exports:
- `useCreditDeduction()` - Main deduction hook
- `useHasCredits()` - Check credit availability

#### 3. **CreditInfo Component** - Multi-Variant Display
**File:** `src/components/credit-info.tsx`

Four display variants:
1. **header** - Compact inline for headers/breadcrumbs
2. **sidebar** - Default sidebar display
3. **menu** - Ultra-compact for dropdown menus
4. **page** - Full card with progress bars and details

All variants automatically sync via context.

### Documentation

1. **Complete System Guide** - `src/contexts/CREDIT_SYSTEM_GUIDE.md`
   - Full API reference
   - Architecture explanation
   - Best practices and patterns
   - Troubleshooting guide

2. **Component Usage Guide** - `src/components/CREDIT_INFO_USAGE.md`
   - Component variants reference
   - Props documentation
   - Integration examples

3. **Real-World Examples** - `src/components/examples/credit-usage-example.tsx`
   - 6 practical implementation examples
   - Copy-paste ready code
   - Different use case patterns

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              Application Root                    │
│         (CreditProvider wraps all)              │
└──────────────────┬──────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼───┐    ┌────▼────┐    ┌───▼───┐
│Header │    │Dashboard│    │Sidebar│
│       │    │         │    │       │
│Credit │    │ Feature │    │Credit │
│ Info  │    │ Buttons │    │ Info  │
└───────┘    └────┬────┘    └───────┘
                  │
         ┌────────┴────────┐
         │                 │
    useCreditDeduction  useCreditInfo
         │                 │
         └────────┬────────┘
                  │
         Shared State Updates
    (All components sync automatically)
```

## 🚀 Integration Steps

### Step 1: Provider Setup (✅ Already Done)

The `CreditProvider` is already integrated in `src/app/providers.tsx`:

```tsx
<CreditProvider enableOptimisticUpdates={true}>
  {children}
</CreditProvider>
```

### Step 2: Display Credits

Use the `CreditInfo` component anywhere:

```tsx
import { CreditInfo } from "@/components/credit-info";

// In sidebar
<CreditInfo variant="sidebar" />

// In header
<CreditInfo variant="header" />

// In user menu
<CreditInfo variant="menu" />

// On a page
<CreditInfo variant="page" showProgress />
```

### Step 3: Deduct Credits

Use the hook in any component:

```tsx
import { useCreditDeduction } from "@/hooks/use-credit-deduction";

function MyFeature() {
  const { deductCredits, isDeducting } = useCreditDeduction({
    showSuccessToast: true,
  });

  const handleAction = async () => {
    try {
      await deductCredits({
        amount: 1,
        reason: "feature_usage",
      });
      
      // Your feature logic...
    } catch (error) {
      // Error handled automatically
    }
  };

  return (
    <Button onClick={handleAction} disabled={isDeducting}>
      Use Feature (1 credit)
    </Button>
  );
}
```

### Step 4: Check Credits

Validate before expensive operations:

```tsx
import { useHasCredits } from "@/hooks/use-credit-deduction";

function PremiumFeature() {
  const { hasEnoughCredits, creditsNeeded } = useHasCredits(10);

  if (!hasEnoughCredits) {
    return <div>Need {creditsNeeded} more credits!</div>;
  }

  return <ExpensiveFeature />;
}
```

## 📁 File Structure

```
src/
├── contexts/
│   ├── credit-context.tsx              # Core context provider
│   └── CREDIT_SYSTEM_GUIDE.md          # Complete documentation
│
├── hooks/
│   └── use-credit-deduction.ts         # Deduction & validation hooks
│
├── components/
│   ├── credit-info.tsx                 # Multi-variant display
│   ├── CREDIT_INFO_USAGE.md            # Component documentation
│   ├── examples/
│   │   └── credit-usage-example.tsx    # Real-world examples
│   └── upgrade.tsx                     # (Old component - can be removed)
│
└── app/
    └── providers.tsx                   # CreditProvider integrated here
```

## ✨ Key Features

### 1. Real-Time Synchronization
All credit displays update automatically across the entire app when credits change.

### 2. Optimistic Updates
UI updates instantly before server confirmation for better UX.

```tsx
// User clicks button
deductCredits({ amount: 1 });

// UI updates immediately ⚡
// API call happens in background
// Real data syncs when ready
```

### 3. Error Recovery
Failed operations automatically roll back optimistic updates.

```tsx
try {
  await deductCredits({ amount: 5 });
  // If API fails, credits are restored automatically
} catch (error) {
  // UI already rolled back
}
```

### 4. Event System
Trigger updates from anywhere, even outside React:

```tsx
import { triggerCreditUpdate } from "@/contexts/credit-context";

// After any operation that affects credits
triggerCreditUpdate();

// Or with specific amount for optimistic update
triggerCreditDeduction(3);
```

### 5. Race Condition Safe
Automatic cancellation of outdated requests:

```tsx
// User clicks rapidly
deductCredits({ amount: 1 }); // Request 1
deductCredits({ amount: 1 }); // Request 2 (Request 1 cancelled)
deductCredits({ amount: 1 }); // Request 3 (Request 2 cancelled)
// Only latest request completes
```

### 6. Smart Loading States
Each variant has appropriate loading UI:

```tsx
const { loading } = useCreditInfo();
// header variant: Small spinner
// sidebar variant: Centered spinner
// page variant: Card with centered spinner
```

## 🎨 Usage Patterns

### Pattern 1: Simple Feature Button

```tsx
function FeatureButton() {
  const { deductCredits, isDeducting } = useCreditDeduction({
    showSuccessToast: true,
  });

  return (
    <Button
      onClick={() => deductCredits({ amount: 1, reason: "feature" })}
      disabled={isDeducting}
    >
      {isDeducting ? "Processing..." : "Use Feature"}
    </Button>
  );
}
```

### Pattern 2: Feature Gate

```tsx
function PremiumContent() {
  const { hasEnoughCredits } = useHasCredits(10);

  if (!hasEnoughCredits) {
    return <UpgradePrompt />;
  }

  return <PremiumFeature />;
}
```

### Pattern 3: Variable Cost Feature

```tsx
function FlexibleFeature() {
  const [quality, setQuality] = useState("standard");
  const costs = { standard: 1, hd: 3, ultra: 5 };
  const cost = costs[quality];

  const { hasEnoughCredits } = useHasCredits(cost);
  const { deductCredits } = useCreditDeduction();

  const handleGenerate = async () => {
    await deductCredits({
      amount: cost,
      reason: "generation",
      metadata: { quality },
    });
    // Generate...
  };

  return (
    <div>
      <select onChange={(e) => setQuality(e.target.value)}>
        <option value="standard">Standard (1)</option>
        <option value="hd">HD (3)</option>
        <option value="ultra">Ultra (5)</option>
      </select>
      <Button onClick={handleGenerate} disabled={!hasEnoughCredits}>
        Generate ({cost} credits)
      </Button>
    </div>
  );
}
```

### Pattern 4: Multi-Step Process

```tsx
function Wizard() {
  const { deductCredits } = useCreditDeduction();

  const handleStep = async (stepCredits: number) => {
    await deductCredits({
      amount: stepCredits,
      reason: "wizard_step",
    });
    // Move to next step...
  };

  return (
    <div>
      <Button onClick={() => handleStep(1)}>Step 1 (1 credit)</Button>
      <Button onClick={() => handleStep(2)}>Step 2 (2 credits)</Button>
      <Button onClick={() => handleStep(1)}>Step 3 (1 credit)</Button>
    </div>
  );
}
```

### Pattern 5: Batch Operations

```tsx
function BatchProcessor({ items }: { items: string[] }) {
  const totalCredits = items.length * 2;
  const { hasEnoughCredits } = useHasCredits(totalCredits);
  const { deductCredits } = useCreditDeduction();

  const processBatch = async () => {
    // Deduct all credits upfront
    await deductCredits({
      amount: totalCredits,
      reason: "batch_processing",
    });

    // Process items...
    for (const item of items) {
      await processItem(item);
    }
  };

  return (
    <Button onClick={processBatch} disabled={!hasEnoughCredits}>
      Process {items.length} items ({totalCredits} credits)
    </Button>
  );
}
```

## 🔧 Configuration Options

### CreditProvider Options

```tsx
<CreditProvider
  enableOptimisticUpdates={true}     // Instant UI feedback
  autoRefreshInterval={30000}        // Auto-refresh every 30s (0 = disabled)
>
  {children}
</CreditProvider>
```

### useCreditDeduction Options

```tsx
const { deductCredits } = useCreditDeduction({
  showSuccessToast: true,              // Show success notification
  showErrorToast: true,                // Show error notification
  successMessage: "Success!",          // Custom message
  errorMessage: "Failed!",             // Custom error message
  onSuccess: (remaining) => {},        // Success callback
  onError: (error) => {},              // Error callback
});
```

### CreditInfo Props

```tsx
<CreditInfo
  variant="sidebar"           // header | sidebar | menu | page
  showAction={true}           // Show upgrade/manage button
  showProgress={false}        // Show progress bar (page variant)
  className="custom-class"    // Additional classes
/>
```

## 🚦 Migration Guide

### From Old `Upgrade` Component

**Before:**
```tsx
import { Upgrade } from "@/components/upgrade";
<Upgrade />
```

**After:**
```tsx
import { CreditInfo } from "@/components/credit-info";
<CreditInfo variant="sidebar" />
```

### From Manual API Calls

**Before:**
```tsx
const response = await fetch("/api/credits/deduct", {
  method: "POST",
  body: JSON.stringify({ amount: 1 }),
});
```

**After:**
```tsx
const { deductCredits } = useCreditDeduction();
await deductCredits({ amount: 1 });
```

## 📝 Next Steps

### Immediate Integration

1. **Replace `Upgrade` component** with `CreditInfo` in:
   - Sidebar: `src/components/app-sidebar.tsx`
   - User menu: `src/components/nav-user.tsx`
   - Header: Dashboard layout

2. **Update feature components** to use `useCreditDeduction`:
   - Any component that calls `/api/credits/deduct`
   - Add credit checks before expensive operations

3. **Add credit displays** where relevant:
   - Dashboard page (`variant="page" showProgress`)
   - Settings page
   - Feature pages

### Optional Enhancements

1. **Enable auto-refresh** for real-time apps:
   ```tsx
   <CreditProvider autoRefreshInterval={60000}>
   ```

2. **Add credit warnings** when low:
   ```tsx
   const { subscription } = useCreditInfo();
   if (subscription.creditsRemaining < 10) {
     toast.warning("Low credits!");
   }
   ```

3. **Track credit usage** in analytics:
   ```tsx
   const { deductCredits } = useCreditDeduction({
     onSuccess: (remaining) => {
       analytics.track("credits_used", { remaining });
     },
   });
   ```

## 🎉 Benefits

✅ **Developer Experience**
- Simple, intuitive API
- TypeScript support
- Comprehensive documentation
- Real-world examples

✅ **User Experience**
- Instant feedback (optimistic updates)
- Real-time credit sync
- Clear error messages
- Smooth loading states

✅ **Production Ready**
- Race condition handling
- Error recovery
- Memory leak prevention
- Performance optimized

✅ **Maintainable**
- Centralized logic
- Consistent patterns
- Well documented
- Easy to extend

## 📚 Resources

- **System Guide**: `src/contexts/CREDIT_SYSTEM_GUIDE.md`
- **Component Guide**: `src/components/CREDIT_INFO_USAGE.md`
- **Examples**: `src/components/examples/credit-usage-example.tsx`
- **API**: `/api/credits/check` and `/api/credits/deduct`

---

**Built with ❤️ for production use**

