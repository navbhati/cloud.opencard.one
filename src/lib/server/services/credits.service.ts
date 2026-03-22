import prisma from "@/config/db/prisma";
import {
  CreditBalance,
  CreditTransaction,
  CreditTransactionType,
  Prisma,
} from "@prisma/client";
import { BillingCycle, SubscriptionStatus } from "@prisma/client";
import { getUserSubscription } from "./subscription.service";
import { addMonthsPreservingEndOfMonth } from "@/lib/formatters";

/**
 * Get user's credit balance with caching
 */
export async function getCreditBalance(
  userId: string
): Promise<CreditBalance | null> {
  try {
    return await prisma.creditBalance.findUnique({
      where: { userId },
    });
  } catch (error) {
    console.error("Error getting credit balance:", error);
    return null;
  }
}

/**
 * Check if user has sufficient credits
 */
export async function checkCredits(
  userId: string,
  required: number
): Promise<{ sufficient: boolean; remaining: number; allocated: number }> {
  const balance = await getCreditBalance(userId);

  if (!balance) {
    return { sufficient: false, remaining: 0, allocated: 0 };
  }

  return {
    sufficient: balance.creditsRemaining >= required,
    remaining: balance.creditsRemaining,
    allocated: balance.creditsAllocated,
  };
}

/**
 * Deduct credits atomically with transaction logging
 */
export async function deductCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Prisma.InputJsonValue
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get current balance with row lock
      const balance = await tx.creditBalance.findUnique({
        where: { userId },
      });

      if (!balance) {
        throw new Error("Credit balance not found");
      }

      if (balance.creditsRemaining < amount) {
        throw new Error("Insufficient credits");
      }

      // Update balance
      const updatedBalance = await tx.creditBalance.update({
        where: { userId },
        data: {
          creditsRemaining: balance.creditsRemaining - amount,
        },
      });

      // Create transaction log
      await tx.creditTransaction.create({
        data: {
          userId,
          type: CreditTransactionType.DEDUCTED,
          amount: -amount,
          balanceAfter: updatedBalance.creditsRemaining,
          reason,
          metadata: metadata,
        },
      });

      return updatedBalance.creditsRemaining;
    });

    return { success: true, newBalance: result };
  } catch (error) {
    console.error("Error deducting credits:", error);
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Allocate credits to user
 */
export async function allocateCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; newBalance: number }> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.creditBalance.findUnique({
        where: { userId },
      });

      if (!balance) {
        throw new Error("Credit balance not found");
      }

      // Update balance
      const updatedBalance = await tx.creditBalance.update({
        where: { userId },
        data: {
          creditsRemaining: balance.creditsRemaining + amount,
          creditsAllocated: balance.creditsAllocated + amount,
        },
      });

      // Create transaction log
      await tx.creditTransaction.create({
        data: {
          userId,
          type: CreditTransactionType.ALLOCATED,
          amount,
          balanceAfter: updatedBalance.creditsRemaining,
          reason,
        },
      });

      return updatedBalance.creditsRemaining;
    });

    return { success: true, newBalance: result };
  } catch (error) {
    console.error("Error allocating credits:", error);
    return { success: false, newBalance: 0 };
  }
}

/**
 * Reset credits to plan allocation (for billing cycle)
 */
export async function resetCredits(
  userId: string,
  creditsAmount: number,
  nextResetDate: Date | null
): Promise<{ success: boolean; newBalance: number }> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update balance
      const updatedBalance = await tx.creditBalance.update({
        where: { userId },
        data: {
          creditsRemaining: creditsAmount,
          creditsAllocated: creditsAmount,
          lastResetAt: new Date(),
          nextResetAt: nextResetDate,
        },
      });

      // Create transaction log
      await tx.creditTransaction.create({
        data: {
          userId,
          type: CreditTransactionType.RESET,
          amount: creditsAmount,
          balanceAfter: updatedBalance.creditsRemaining,
          reason: "billing_cycle_renewal",
        },
      });

      return updatedBalance.creditsRemaining;
    });

    return { success: true, newBalance: result };
  } catch (error) {
    console.error("Error resetting credits:", error);
    return { success: false, newBalance: 0 };
  }
}

/**
 * Ensure monthly credits are issued for ACTIVE YEARLY subscriptions.
 * - Sets nextResetAt if missing (first-time init)
 * - If nextResetAt is due or past, resets credits to plan allocation and advances nextResetAt by 1 month
 */
export async function ensureMonthlyCredits(userId: string): Promise<void> {
  try {
    const subscription = await getUserSubscription(userId);
    console.log(`[ensureMonthlyCredits] Subscription fetched:`, subscription);

    if (!subscription) {
      console.log(
        `[ensureMonthlyCredits] No subscription found for user ${userId}, exiting.`
      );
      return;
    }

    if (
      subscription.status !== SubscriptionStatus.ACTIVE ||
      subscription.billingCycle !== BillingCycle.YEARLY
    ) {
      console.log(
        `[ensureMonthlyCredits] Subscription not ACTIVE and YEARLY (status: ${subscription.status}, cycle: ${subscription.billingCycle}), exiting.`
      );
      return;
    }

    // Fetch current credit balance
    const balance = await prisma.creditBalance.findUnique({
      where: { userId },
    });
    console.log(`[ensureMonthlyCredits] Credit balance fetched:`, balance);
    if (!balance) {
      console.log(
        `[ensureMonthlyCredits] No credit balance found for user ${userId}, exiting.`
      );
      return;
    }

    const planCredits = subscription.plan?.creditsPerMonth ?? 0;
    console.log(
      `[ensureMonthlyCredits] Plan credits per month: ${planCredits}`
    );
    if (planCredits <= 0) {
      console.log(
        `[ensureMonthlyCredits] Plan credits <= 0 (${planCredits}), exiting.`
      );
      return;
    }

    const now = new Date();
    console.log(`[ensureMonthlyCredits] Current time: ${now.toISOString()}`);

    // Initialize nextResetAt if missing
    if (!balance.nextResetAt) {
      const base = subscription.currentPeriodStart ?? now;
      console.log(
        `[ensureMonthlyCredits] nextResetAt is missing. Using base date: ${base.toISOString()}`
      );
      const next = addMonthsPreservingEndOfMonth(base, 1);
      console.log(
        `[ensureMonthlyCredits] Calculated nextResetAt: ${next.toISOString()}`
      );
      await prisma.creditBalance.update({
        where: { userId },
        data: { nextResetAt: next },
      });
      console.log(
        `[ensureMonthlyCredits] nextResetAt initialized to: ${next.toISOString()} for user ${userId}`
      );
      return;
    }

    // If nextResetAt has reached or passed, perform reset and advance to next month
    if (balance.nextResetAt <= now) {
      console.log(
        `[ensureMonthlyCredits] nextResetAt (${balance.nextResetAt.toISOString()}) <= now (${now.toISOString()}), resetting credits.`
      );
      const nextPointer = addMonthsPreservingEndOfMonth(balance.nextResetAt, 1);
      console.log(
        `[ensureMonthlyCredits] Calculated new nextResetAt: ${nextPointer.toISOString()}, resetting credits...`
      );
      await resetCredits(userId, planCredits, nextPointer);
      console.log(
        `[ensureMonthlyCredits] Credits reset for user ${userId} to ${planCredits}, nextResetAt advanced to ${nextPointer.toISOString()}`
      );
    } else {
      console.log(
        `[ensureMonthlyCredits] nextResetAt (${balance.nextResetAt.toISOString()}) > now (${now.toISOString()}), no reset needed.`
      );
    }
  } catch (error) {
    console.error("ensureMonthlyCredits error:", error);
  }
}

/* Get credit transaction history
 */
export async function getCreditHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<CreditTransaction[]> {
  return await prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/**
 * Get usage analytics
 */
export async function getUsageAnalytics(userId: string) {
  const [totalDeducted, transactionCount, recentTransactions] =
    await Promise.all([
      prisma.creditTransaction.aggregate({
        where: {
          userId,
          type: CreditTransactionType.DEDUCTED,
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.creditTransaction.count({
        where: { userId },
      }),
      prisma.creditTransaction.findMany({
        where: {
          userId,
          type: CreditTransactionType.DEDUCTED,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  return {
    totalCreditsUsed: Math.abs(totalDeducted._sum.amount || 0),
    transactionCount,
    recentTransactions,
  };
}

/**
 * Create initial credit balance for new user
 */
export async function createCreditBalance(
  userId: string,
  initialCredits: number
): Promise<CreditBalance> {
  const balance = await prisma.creditBalance.create({
    data: {
      userId,
      creditsRemaining: initialCredits,
      creditsAllocated: initialCredits,
      lastResetAt: new Date(),
      nextResetAt: null, // No reset for free trial
    },
  });

  // Create initial transaction
  await prisma.creditTransaction.create({
    data: {
      userId,
      type: CreditTransactionType.ALLOCATED,
      amount: initialCredits,
      balanceAfter: initialCredits,
      reason: "trial_signup",
    },
  });

  return balance;
}
