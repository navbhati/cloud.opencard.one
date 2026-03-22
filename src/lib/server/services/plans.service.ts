import prisma from "@/config/db/prisma";
import CacheService, { CacheTTL } from "@/lib/server/cache/cache.service";
import { Plan } from "@prisma/client";

const CACHE_KEYS = {
  ALL_PLANS: "plans:all",
  PLAN_BY_ID: (id: string) => `plans:${id}`,
};

/**
 * Get all active plans with caching
 */
export async function getAllPlans(): Promise<Plan[]> {
  const fetchPlans = async () => {
    return await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: "asc" },
    });
  };

  if (process.env.NODE_ENV === "development") {
    // Disable caching in development
    return fetchPlans();
  }

  return CacheService.wrap(
    CACHE_KEYS.ALL_PLANS,
    fetchPlans,
    CacheTTL.LONG // 1 hour
  );
}

/**
 * Get a specific plan by ID with caching
 */
export async function getPlanById(id: string): Promise<Plan | null> {
  const fetchPlan = async () => {
    return await prisma.plan.findUnique({
      where: { id },
    });
  };

  if (process.env.NODE_ENV === "development") {
    // Disable caching in development
    return fetchPlan();
  }

  return CacheService.wrap(CACHE_KEYS.PLAN_BY_ID(id), fetchPlan, CacheTTL.LONG);
}

/**
 * Update Stripe price IDs for a plan (admin function)
 */
export async function updateStripePriceIds(
  planId: string,
  monthlyPriceId: string | null,
  yearlyPriceId: string | null
): Promise<Plan> {
  const plan = await prisma.plan.update({
    where: { id: planId },
    data: {
      stripePriceIdMonthly: monthlyPriceId,
      stripePriceIdYearly: yearlyPriceId,
    },
  });

  // Invalidate caches
  await CacheService.invalidate([
    CACHE_KEYS.ALL_PLANS,
    CACHE_KEYS.PLAN_BY_ID(planId),
  ]);

  return plan;
}

/**
 * Get plan by Stripe price ID
 */
export async function getPlanByStripePriceId(
  priceId: string
): Promise<Plan | null> {
  return await prisma.plan.findFirst({
    where: {
      OR: [{ stripePriceIdMonthly: priceId }, { stripePriceIdYearly: priceId }],
    },
  });
}
