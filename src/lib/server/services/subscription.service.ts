import prisma from "@/config/db/prisma";
import CacheService, { CacheTTL } from "@/lib/server/cache/cache.service";
import {
  Subscription,
  SubscriptionStatus,
  BillingCycle,
  Plan,
} from "@prisma/client";
import { createCreditBalance } from "./credits.service";
import { getPlanById } from "./plans.service";

const CACHE_KEYS = {
  SUBSCRIPTION: (userId: string) => `subscription:${userId}`,
};

type SubscriptionWithPlan = Subscription & { plan: Plan };

/**
 * Get user's subscription with caching
 */
export async function getUserSubscription(
  userId: string
): Promise<SubscriptionWithPlan | null> {
  const fetchSubscription = async () => {
    return await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  };

  if (process.env.NODE_ENV === "development") {
    return fetchSubscription();
  }

  return await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });
}

/**
 * Create free trial subscription for new user
 */
export async function createFreeSubscription(
  userId: string
): Promise<Subscription> {
  const freePlan = await getPlanById("free");

  if (!freePlan) {
    throw new Error("Free plan not found");
  }

  const now = new Date();
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + freePlan.trialDays);

  // Create subscription and credit balance in transaction
  const subscription = await prisma.$transaction(async (tx) => {
    // Create subscription
    const sub = await tx.subscription.create({
      data: {
        userId,
        planId: freePlan.id,
        status: SubscriptionStatus.TRIAL,
        billingCycle: BillingCycle.NONE,
        trialStartDate: now,
        trialEndDate,
        currentPeriodStart: now,
        currentPeriodEnd: trialEndDate,
        cancelAtPeriodEnd: true,
      },
    });

    // Create credit balance (done via credits service outside transaction)
    return sub;
  });

  // Create credit balance
  await createCreditBalance(userId, freePlan.creditsPerMonth);

  return subscription;
}

/**
 * Update subscription details
 */
export async function updateSubscription(
  userId: string,
  data: Partial<Omit<Subscription, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Subscription> {
  const subscription = await prisma.subscription.update({
    where: { userId },
    data,
  });

  // Invalidate cache
  await CacheService.invalidate([CACHE_KEYS.SUBSCRIPTION(userId)]);

  return subscription;
}

/**
 * Activate paid subscription (called from webhook)
 */
export async function activatePaidSubscription(
  userId: string,
  planId: string,
  billingCycle: BillingCycle,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  stripePriceId: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date
): Promise<Subscription> {
  const subscription = await prisma.subscription.update({
    where: { userId },
    data: {
      planId,
      status: SubscriptionStatus.ACTIVE,
      billingCycle,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      currentPeriodStart,
      currentPeriodEnd,
      trialStartDate: null,
      trialEndDate: null,
      cancelAtPeriodEnd: false,
    },
  });

  // Invalidate cache
  await CacheService.invalidate([CACHE_KEYS.SUBSCRIPTION(userId)]);

  return subscription;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  userId: string,
  immediate: boolean = false
): Promise<Subscription> {
  const subscription = await prisma.subscription.update({
    where: { userId },
    data: {
      status: immediate
        ? SubscriptionStatus.CANCELED
        : SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: !immediate,
    },
  });

  // Invalidate cache
  await CacheService.invalidate([CACHE_KEYS.SUBSCRIPTION(userId)]);

  return subscription;
}

/**
 * Check if user can access features
 */
export async function canAccessFeature(userId: string): Promise<{
  allowed: boolean;
  reason?: "trial_expired" | "inactive" | "canceled" | "past_due";
}> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return { allowed: false, reason: "inactive" };
  }

  // Check status
  if (subscription.status === SubscriptionStatus.CANCELED) {
    return { allowed: false, reason: "canceled" };
  }

  if (subscription.status === SubscriptionStatus.INACTIVE) {
    return { allowed: false, reason: "inactive" };
  }

  if (subscription.status === SubscriptionStatus.PAST_DUE) {
    return { allowed: false, reason: "past_due" };
  }

  // Check trial expiration
  if (
    subscription.status === SubscriptionStatus.TRIAL &&
    subscription.trialEndDate &&
    new Date() > subscription.trialEndDate
  ) {
    // Update status to inactive
    await updateSubscription(userId, {
      status: SubscriptionStatus.INACTIVE,
    });
    return { allowed: false, reason: "trial_expired" };
  }

  return { allowed: true };
}

/**
 * Check and expire trials (background job)
 */
export async function checkAndExpireTrials(): Promise<number> {
  const now = new Date();

  const result = await prisma.subscription.updateMany({
    where: {
      status: SubscriptionStatus.TRIAL,
      trialEndDate: {
        lt: now,
      },
    },
    data: {
      status: SubscriptionStatus.INACTIVE,
    },
  });

  console.log(`Expired ${result.count} trial subscriptions`);
  return result.count;
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string
): Promise<Subscription | null> {
  return await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });
}

/**
 * Get subscription by Stripe customer ID
 */
export async function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string
): Promise<Subscription | null> {
  return await prisma.subscription.findUnique({
    where: { stripeCustomerId },
  });
}
