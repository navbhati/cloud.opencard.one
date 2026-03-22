# Credit System - Quick Start Guide

## 🚀 In 30 Seconds

### Display Credits
```tsx
import { CreditInfo } from "@/components/credit-info";

// Pick your variant
<CreditInfo variant="header" />    // Compact inline
<CreditInfo variant="sidebar" />   // Sidebar display (default)
<CreditInfo variant="menu" />      // Ultra-compact for menus
<CreditInfo variant="page" showProgress />  // Full card
```

### Deduct Credits
```tsx
import { useCreditDeduction } from "@/hooks/use-credit-deduction";

function MyFeature() {
  const { deductCredits, isDeducting } = useCreditDeduction({
    showSuccessToast: true,
  });

  const handleClick = async () => {
    await deductCredits({ amount: 1, reason: "feature_usage" });
    // Your logic here...
  };

  return (
    <Button onClick={handleClick} disabled={isDeducting}>
      Use Feature (1 credit)
    </Button>
  );
}
```

### Check Credits
```tsx
import { useHasCredits } from "@/hooks/use-credit-deduction";

function ProtectedFeature() {
  const { hasEnoughCredits, creditsNeeded } = useHasCredits(10);

  if (!hasEnoughCredits) {
    return <div>Need {creditsNeeded} more credits!</div>;
  }

  return <ExpensiveFeature />;
}
```

## 📦 What You Get

✅ **Auto-sync** - All credit displays update automatically everywhere  
✅ **Optimistic UI** - Instant feedback, no waiting  
✅ **Error recovery** - Failed operations roll back automatically  
✅ **TypeScript** - Fully typed  
✅ **Production-ready** - Race condition safe, memory leak free  

## 📚 Full Documentation

- **Complete Guide**: [CREDIT_SYSTEM_IMPLEMENTATION.md](./CREDIT_SYSTEM_IMPLEMENTATION.md)
- **System Details**: [src/contexts/CREDIT_SYSTEM_GUIDE.md](./src/contexts/CREDIT_SYSTEM_GUIDE.md)
- **Component Guide**: [src/components/CREDIT_INFO_USAGE.md](./src/components/CREDIT_INFO_USAGE.md)
- **Code Examples**: [src/components/examples/credit-usage-example.tsx](./src/components/examples/credit-usage-example.tsx)

## 🎯 Common Patterns

### Pattern 1: Feature Button
```tsx
const { deductCredits, isDeducting } = useCreditDeduction({
  showSuccessToast: true,
  successMessage: "Feature activated!",
});

<Button 
  onClick={() => deductCredits({ amount: 1 })} 
  disabled={isDeducting}
>
  Activate (1 credit)
</Button>
```

### Pattern 2: Variable Cost
```tsx
const [quality, setQuality] = useState("hd");
const cost = { standard: 1, hd: 3, ultra: 5 }[quality];
const { hasEnoughCredits } = useHasCredits(cost);

<select onChange={(e) => setQuality(e.target.value)}>
  <option value="standard">Standard (1)</option>
  <option value="hd">HD (3)</option>
  <option value="ultra">Ultra (5)</option>
</select>

<Button disabled={!hasEnoughCredits}>
  Generate ({cost} credits)
</Button>
```

### Pattern 3: Batch Operations
```tsx
const totalCredits = items.length * 2;
const { hasEnoughCredits } = useHasCredits(totalCredits);
const { deductCredits } = useCreditDeduction();

const processBatch = async () => {
  await deductCredits({ 
    amount: totalCredits,
    reason: "batch_processing" 
  });
  
  for (const item of items) {
    await processItem(item);
  }
};
```

### Pattern 4: Manual Refresh
```tsx
const { refreshCredits } = useCreditInfo();

// After background operation
await someBackgroundTask();
await refreshCredits(); // Get latest credits
```

## 🔧 Configuration

### Enable Auto-Refresh
```tsx
// In providers.tsx
<CreditProvider 
  enableOptimisticUpdates={true}
  autoRefreshInterval={30000}  // 30 seconds
>
  {children}
</CreditProvider>
```

### Custom Messages
```tsx
const { deductCredits } = useCreditDeduction({
  showSuccessToast: true,
  showErrorToast: true,
  successMessage: "🎉 Credits used!",
  errorMessage: "❌ Operation failed!",
  onSuccess: (remaining) => console.log(remaining),
  onError: (error) => console.error(error),
});
```

## 🆘 Troubleshooting

### "Must be used within CreditProvider"
Already fixed! Provider is wrapped in `src/app/providers.tsx`.

### Credits not updating
```tsx
const { refreshCredits } = useCreditInfo();
await refreshCredits(); // Manual refresh
```

### Check current state
```tsx
const { subscription, loading, error, lastUpdated } = useCreditInfo();

console.log({
  credits: subscription?.creditsRemaining,
  plan: subscription?.planName,
  loading,
  error,
  lastUpdated,
});
```

## 🎨 Component Variants Preview

```
header:   💳 150 credits [Upgrade] ←──── Inline, minimal
sidebar:  Plan     [Pro]              ┐
          Credits  150                │ Compact, stacked
          [Upgrade Button]            ┘
menu:     Plan     [Pro]              ┐
          Credits  150                │ Ultra-compact
          [Upgrade]                   ┘
page:     ┌─────────────────────┐    ┐
          │ Credits & Plan      │    │
          │ Available: 150      │    │ Full card
          │ ████████░░ 75%      │    │ with details
          │ [Manage]            │    │
          └─────────────────────┘    ┘
```

## ✨ Key Features

1. **One Context, Multiple Views** - All variants share state
2. **Optimistic Updates** - UI updates before API confirms
3. **Error Recovery** - Auto-rollback on failure
4. **Race Condition Safe** - Smart request cancellation
5. **Event-Driven** - Update from anywhere in the app

## 🔥 Pro Tips

```tsx
// Tip 1: Check credits before expensive operations
const { hasEnoughCredits } = useHasCredits(requiredAmount);
if (!hasEnoughCredits) return <UpgradePrompt />;

// Tip 2: Use callbacks for side effects
const { deductCredits } = useCreditDeduction({
  onSuccess: () => analytics.track("feature_used"),
});

// Tip 3: Trigger updates from anywhere
import { triggerCreditUpdate } from "@/contexts/credit-context";
triggerCreditUpdate(); // Works outside React components

// Tip 4: Show different messages per feature
const { deductCredits } = useCreditDeduction({
  successMessage: "Image generated! ✨",
});
```

## 📝 Migration Checklist

- [ ] Replace `<Upgrade />` with `<CreditInfo variant="sidebar" />`
- [ ] Update feature components to use `useCreditDeduction()`
- [ ] Add credit checks with `useHasCredits()` where needed
- [ ] Add `<CreditInfo variant="page" />` to dashboard
- [ ] Add `<CreditInfo variant="header" />` to header
- [ ] Remove manual `/api/credits/check` calls
- [ ] Remove manual `/api/credits/deduct` calls
- [ ] Test credit deduction flows
- [ ] Test error scenarios
- [ ] Test optimistic updates

---

**Need more details?** See [CREDIT_SYSTEM_IMPLEMENTATION.md](./CREDIT_SYSTEM_IMPLEMENTATION.md)

