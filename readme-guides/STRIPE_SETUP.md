# Stripe Integration Setup Guide

## Required Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_BASIC_MONTHLY_PRICE_ID=price_...
STRIPE_BASIC_YEARLY_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup Steps

### 1. Create Stripe Account
- Go to [stripe.com](https://stripe.com) and sign up
- Get your API keys from the Stripe Dashboard

### 2. Create Products in Stripe

#### Basic Plan
1. Go to Products > Add Product
2. Name: "Basic Plan"
3. Create two prices:
   - Monthly: $8/month (recurring)
   - Yearly: $72/year (recurring)
4. Copy the price IDs and add to env variables

#### Pro Plan
1. Go to Products > Add Product
2. Name: "Pro Plan"
3. Create two prices:
   - Monthly: $15/month (recurring)
   - Yearly: $120/year (recurring)
4. Copy the price IDs and add to env variables

### 3. Configure Webhook

1. Go to Developers > Webhooks in Stripe Dashboard
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret and add to `STRIPE_WEBHOOK_SECRET`

### 4. Update Plan Seeds

After creating price IDs in Stripe, run:

```bash
npx tsx prisma/seeds/plans.seed.ts
```

This will update the plans in your database with the correct Stripe price IDs.

### 5. Enable Billing Portal

1. Go to Settings > Billing > Customer Portal in Stripe
2. Configure what customers can do:
   - Update payment method
   - View invoices
   - Cancel subscription
3. Save settings

## Testing

### Test Locally
Use Stripe CLI to forward webhooks to localhost:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Use the webhook secret provided by CLI in your .env.local
```

### Test Cards
Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Use any future date for expiry and any 3-digit CVC

## Features Implemented

✅ Subscription checkout
✅ Customer portal
✅ Webhook handling
✅ Credits system
✅ Trial management
✅ Plan upgrades/downgrades
✅ Subscription cancellation
✅ Payment failure handling

## Usage

### For Users
1. New users get free 7-day trial with 10 credits
2. Click "Get Started" on any paid plan
3. Complete Stripe checkout
4. Redirected back to app with subscription activated
5. Manage subscription via Settings > Billing

### For Developers
- Credits are tracked in `CreditBalance` table
- All transactions logged in `CreditTransaction` table
- Subscriptions synced via webhooks
- Cached for performance
- Atomic credit deductions prevent race conditions

