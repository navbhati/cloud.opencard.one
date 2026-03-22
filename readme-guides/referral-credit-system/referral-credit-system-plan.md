# Referral Credit System Implementation

## Overview

Implement a referral system where users earn 50 credits when someone signs up using their invite link. Both referrer and referee receive credits immediately after successful signup. Uses shadcn/ui components and existing credit transaction infrastructure.

## Database Schema Changes

### Add to `schema.prisma`:

```prisma
model Referral {
  id             String   @id @default(uuid())
  referrerId     String
  referrerUser   User     @relation("ReferrerReferrals", fields: [referrerId], references: [id], onDelete: Cascade)
  refereeId      String?  // User who signed up (null until used)
  refereeUser    User?    @relation("RefereeReferrals", fields: [refereeId], references: [id], onDelete: Cascade)
  referralCode   String   @unique // Unique 8-char code
  creditsAwarded Boolean  @default(false)
  createdAt      DateTime @default(now())
  usedAt         DateTime? // When referee signed up
  
  @@index([referrerId])
  @@index([referralCode])
}

enum CreditTransactionType {
  ALLOCATED
  DEDUCTED
  RESET
  REFUNDED
  REFERRAL_REWARD  // NEW - for referral credits
}
```

### Update User model:

```prisma
model User {
  // ... existing fields
  referralsGiven    Referral[] @relation("ReferrerReferrals")
  referralsReceived Referral[] @relation("RefereeReferrals")
  referredByCode    String?    // Referral code used at signup
}
```

## Anti-Abuse Measures (Minimal, Effective)

1. **Rate Limiting**: Max 5 signups per referral code per hour (Redis: `referral:limit:{code}`)
2. **Self-Referral Prevention**: Check referrer ≠ referee (userId comparison)
3. **One-Time Use per User**: Check if referee already used a referral code
4. **IP Tracking**: Store IP + user agent in CreditTransaction metadata (passive logging for manual review)

**Credits awarded immediately** - no background jobs or delayed validation needed.

## Backend Implementation

### File: `src/lib/server/services/referral.service.ts` (NEW)

Key functions:

- `generateReferralCode(userId)`: Create unique 8-char alphanumeric code, store in DB
- `getUserReferralCode(userId)`: Get or create user's referral code
- `getReferralByCode(code)`: Fetch referral details
- `validateReferralCode(code, newUserId)`: Check eligibility (not self, not used, rate limit)
- `processReferralSignup(code, newUserId, metadata)`: Award 50 credits to both users
- `getReferralStats(userId)`: Get referral count from CreditTransaction table

**Credit Award Flow**:

```typescript
// In atomic transaction:
1. Update Referral: set refereeId, creditsAwarded=true, usedAt=now
2. Award 50 credits to referrer using allocateCredits() with reason="Referral reward"
3. Award 50 credits to referee using allocateCredits() with reason="Referral signup bonus"
4. Both create CreditTransaction entries with type=REFERRAL_REWARD and metadata
```

### File: `src/app/api/referrals/code/route.ts` (NEW)

**GET**: Returns user's referral code (generates if doesn't exist)

```typescript
{ code: "ABC12XYZ", referralUrl: "https://app.infographixai.com/auth/register?ref=ABC12XYZ" }
```

### File: `src/app/api/referrals/stats/route.ts` (NEW)

**GET**: Returns referral statistics from CreditTransaction + Referral tables

```typescript
{
  totalReferrals: 5,
  creditsEarned: 250,
  recentReferrals: [{ refereeEmail, earnedAt, credits: 50 }]
}
```

### Modify: `src/lib/server/services/user.service.ts`

Update `syncUserWithClerk()` to:

```typescript
// After user creation, check for referral code
const referralCode = // get from Clerk publicMetadata or unsafeMetadata
if (referralCode && isNewUser) {
  await processReferralSignup(referralCode, newUser.id, { ip, userAgent });
}
```

### Modify: `src/app/auth/sso-callback/page.tsx`

Capture `ref` query param and store in Clerk metadata before signup completes

## Frontend Implementation

### Component: `src/components/referral/referral-dialog.tsx` (NEW)

**Shadcn Components Used**: Dialog, Tabs, Card, Button, Badge, Alert

**Structure**:

```tsx
<Dialog>
  <DialogContent>
    <Tabs defaultValue="invite">
      <TabsList>
        <TabsTrigger value="invite">Invite</TabsTrigger>
        <TabsTrigger value="rewards">Rewards</TabsTrigger>
      </TabsList>
      
      <TabsContent value="invite">
        {/* Title + Description */}
        {/* Referral link Card with copy button */}
        {/* Primary "Copy invite link" Button */}
        {/* Social share buttons row */}
      </TabsContent>
      
      <TabsContent value="rewards">
        {/* Stats Cards: total referrals, credits earned */}
        {/* Recent referrals list with Badges */}
      </TabsContent>
    </Tabs>
  </DialogContent>
</Dialog>
```

Features:

- Auto-fetch referral code on mount (API: `/api/referrals/code`)
- Copy to clipboard with toast notification
- Social share buttons: X/Twitter, Email, LinkedIn, WhatsApp, Facebook
- Rewards tab shows data from existing credit history + referral count

### Component: `src/components/referral/referral-button.tsx` (NEW)

Simple trigger button with variants:

```tsx
<ReferralButton variant="sidebar" /> // Icon + "Earn Credits"
<ReferralButton variant="outline" /> // Full button for pages
```

### Integration Points:

1. **Sidebar** (`src/components/app-sidebar.tsx`): Add ReferralButton below credit info
2. **Register Page** (`src/app/auth/register/page.tsx`): Show Alert if referral code in URL

## Credit Transaction Logging

**Every referral award creates TWO CreditTransaction entries**:

**For Referrer**:

```typescript
{
  type: REFERRAL_REWARD,
  amount: 50,
  reason: "Referral reward - friend signed up",
  metadata: {
    referralCode: "ABC12XYZ",
    refereeId: "user-uuid",
    refereeEmail: "friend@example.com"
  }
}
```

**For Referee**:

```typescript
{
  type: REFERRAL_REWARD,
  amount: 50,
  reason: "Referral signup bonus",
  metadata: {
    referralCode: "ABC12XYZ",
    referrerId: "user-uuid",
    referrerEmail: "inviter@example.com",
    ip: "1.2.3.4", // for abuse tracking
    userAgent: "..."
  }
}
```

**Analytics**: Use existing `/api/credits/history` endpoint - filter by `REFERRAL_REWARD` type

## URL Structure

- Referral link: `https://app.infographixai.com/auth/register?ref=ABC12XYZ`
- Query param `ref` contains the referral code

## UI Design (Reference-based)

### Invite Tab:

- Title: **"Give 50 credits. Get 50 credits"**
- Description: "Invite your friends and you both earn 50 credits per referral"
- Referral link in Card with copy icon
- Large primary Button: "Copy invite link"
- Social share icons row (minimalist, icon-only buttons)

### Rewards Tab:

- Grid of stat Cards showing:
  - Total referrals (with badge)
  - Total credits earned (highlighted)
- List of recent referrals with status badges

### Styling:

- Match existing app design system
- Use existing color variables (primary, muted, etc.)
- Responsive, mobile-friendly

## Migration & Deployment

1. Create Prisma migration: `npx prisma migrate dev --name add_referral_system`
2. Update Prisma client: `npx prisma generate`
3. Deploy backend services (referral.service.ts + API routes)
4. Deploy frontend components
5. Test referral flow end-to-end
6. Monitor Redis rate limiting keys

## Security Checklist

✅ Server-side validation only (never trust client)

✅ Prevent self-referrals (userId check)

✅ One referral code per user (check in DB)

✅ Rate limiting via Redis

✅ Atomic transactions for credit awards (no partial awards)

✅ Comprehensive audit trail (CreditTransaction table)

✅ IP/user agent logging (passive abuse detection)

## Why This Plan is Best Practice

1. **Leverages Existing Infrastructure**: Uses existing `CreditTransaction` table instead of building new analytics
2. **Minimal Complexity**: No background jobs, no delayed validation, no complex state machines
3. **Atomic Operations**: All credit awards happen in DB transactions (no race conditions)
4. **Audit Trail**: Every credit change is logged with full metadata
5. **Extensible**: Easy to add features later (time limits, tier bonuses, etc.)
6. **Secure**: Server-side validation, rate limiting, self-referral prevention
7. **Maintainable**: Simple code, clear separation of concerns, uses established patterns