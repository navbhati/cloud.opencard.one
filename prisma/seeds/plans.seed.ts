import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  {
    id: "free",
    name: "Free",
    description: "Get started with OpenCard SDK and basic agent authorization.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    creditsPerMonth: 50,
    trialDays: 14,
    features: [
      "50 API calls per month",
      "Agent DID registration",
      "Basic mandate lifecycle",
      "Community support",
    ],
    cta: "Get started",
    popular: false,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    isActive: true,
  },
  {
    id: "plus",
    name: "Plus",
    description: "For teams building AI agent payment workflows.",
    monthlyPrice: 49,
    yearlyPrice: 39,
    creditsPerMonth: 800,
    trialDays: 0,
    features: [
      "800 API calls per month",
      "Agent DID registration & management",
      "Full mandate lifecycle API",
      "W3C Verifiable Credentials issuance",
      "Cross-protocol bridge (AP2, MPP, x402)",
      "Basic audit dashboard",
      "Email support",
    ],
    cta: "Get started",
    popular: false,
    stripePriceIdMonthly: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID || null,
    stripePriceIdYearly: process.env.STRIPE_PLUS_YEARLY_PRICE_ID || null,
    isActive: true,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Enterprise-ready agent authorization and governance.",
    monthlyPrice: 149,
    yearlyPrice: 119,
    creditsPerMonth: 4000,
    trialDays: 0,
    features: [
      "4000 API calls per month",
      "Everything in Plus",
      "Visual no-code mandate policy builder",
      "Unified cross-protocol audit dashboard",
      "Kill-switch API for instant suspension",
      "Reputation scoring",
      "Visa IC & Mastercard Agent Pay bridge",
      "ISO 20022-aligned exports",
      "Priority support",
      "1 onboarding session",
    ],
    cta: "Get started",
    popular: true,
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || null,
    stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || null,
    isActive: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For organizations with custom compliance and scale requirements.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    creditsPerMonth: 0,
    trialDays: 0,
    features: [
      "Unlimited API calls",
      "Everything in Pro",
      "FCA Consumer Duty audit packs",
      "AI-powered anomaly detection",
      "Custom protocol integrations",
      "Multi-agent orchestration",
      "Dedicated account manager",
      "Custom onboarding & training",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    isActive: true,
  },
];

export async function seedPlans() {
  console.log("Seeding plans...");

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
    console.log(`Plan "${plan.name}" created/updated`);
  }

  console.log("Plans seeded successfully!");
}
