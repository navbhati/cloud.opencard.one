export const STRIPE_CONFIG = {
  plans: {
    plus: {
      monthly: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID || "",
      yearly: process.env.STRIPE_PLUS_YEARLY_PRICE_ID || "",
    },
    pro: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "",
    },
  },
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/plans`,
  customerPortalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
};

export function getStripePriceId(
  planId: "plus" | "pro",
  billingCycle: "monthly" | "yearly"
): string {
  return STRIPE_CONFIG.plans[planId][billingCycle];
}
