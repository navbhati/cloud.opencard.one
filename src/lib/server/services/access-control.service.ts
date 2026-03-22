/**
 * Centralized Access Control Service
 *
 * This service provides server-side access control checks for:
 * - Subscription status (active/inactive/trial expired)
 * - Subscription tier (free/plus/pro/enterprise)
 * - Credit availability
 * - Feature-specific access
 *
 * Security: Does not expose PII or sensitive user data
 */

import { SubscriptionStatus } from "@prisma/client";
import {
  getUserSubscription,
  updateSubscription,
} from "./subscription.service";
import { getCreditBalance } from "./credits.service";
import {
  FeatureId,
  PlanTier,
  getFeature,
  tierHasAccess,
} from "@/lib/access-control/features";

export type AccessDenialReason =
  | "subscription_inactive"
  | "trial_expired"
  | "subscription_canceled"
  | "subscription_past_due"
  | "insufficient_tier"
  | "insufficient_credits"
  | "no_subscription"
  | "no_credits";

export interface AccessCheckResult {
  /** Whether access is allowed */
  allowed: boolean;
  /** Reason for denial (if not allowed) */
  reason?: AccessDenialReason;
  /** Human-readable message */
  message?: string;
  /** User's current plan tier */
  currentTier?: PlanTier;
  /** Required tier for the feature (if checking a feature) */
  requiredTier?: PlanTier;
  /** Credits remaining */
  creditsRemaining?: number;
  /** Credits required (if checking credits) */
  creditsRequired?: number;
  /** Credits needed (if insufficient) */
  creditsNeeded?: number;
}

export interface FeatureAccessCheckOptions {
  /** Feature ID to check access for */
  featureId?: FeatureId;
  /** Required credits for the action */
  requiredCredits?: number;
  /** Whether to allow view-only access (for inactive subscriptions) */
  allowViewOnly?: boolean;
}

/**
 * Normalize plan ID to PlanTier
 */
function normalizePlanTier(planId: string | null | undefined): PlanTier {
  if (!planId) return "free";

  const normalized = planId.toLowerCase();
  if (["free", "plus", "pro", "enterprise"].includes(normalized)) {
    return normalized as PlanTier;
  }

  return "free";
}

/**
 * Check if subscription status allows any actions (not just viewing)
 */
function isActiveStatus(status: SubscriptionStatus): boolean {
  return (
    status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIAL
  );
}

/**
 * Check if trial has expired
 */
function isTrialExpired(
  status: SubscriptionStatus,
  trialEndDate: Date | null
): boolean {
  if (status !== SubscriptionStatus.TRIAL) return false;
  if (!trialEndDate) return false;
  return new Date() > trialEndDate;
}

/**
 * Comprehensive access check for a user
 *
 * This is the main function to use for checking if a user can perform an action.
 * It checks:
 * 1. Subscription status (must be active or trial)
 * 2. Trial expiration
 * 3. Feature tier requirement (if featureId provided)
 * 4. Credit availability (if requiredCredits provided)
 *
 * @param userId - User ID
 * @param options - Access check options
 * @returns Access check result
 */
export async function checkAccess(
  userId: string,
  options: FeatureAccessCheckOptions = {}
): Promise<AccessCheckResult> {
  const { featureId, requiredCredits, allowViewOnly = false } = options;

  try {
    // Get subscription
    const subscription = await getUserSubscription(userId);

    if (!subscription) {
      return {
        allowed: false,
        reason: "no_subscription",
        message:
          "No subscription found. Please subscribe to a plan to continue.",
      };
    }

    const planTier = normalizePlanTier(subscription.plan?.id);
    const status = subscription.status;

    // Check subscription status
    // If allowViewOnly is true, we allow inactive users to view but not act
    if (!isActiveStatus(status) && !allowViewOnly) {
      let reason: AccessDenialReason;
      let message: string;

      switch (status) {
        case SubscriptionStatus.INACTIVE:
          reason = "subscription_inactive";
          message =
            "Your subscription is inactive. Please upgrade to continue using OpenCard.";
          break;
        case SubscriptionStatus.CANCELED:
          reason = "subscription_canceled";
          message =
            "Your subscription has been canceled. Please reactivate or choose a new plan.";
          break;
        case SubscriptionStatus.PAST_DUE:
          reason = "subscription_past_due";
          message =
            "Your subscription payment is past due. Please update your payment method.";
          break;
        default:
          reason = "subscription_inactive";
          message =
            "Your subscription is not active. Please upgrade to continue using OpenCard.";
      }

      return {
        allowed: false,
        reason,
        message,
        currentTier: planTier,
      };
    }

    // Check trial expiration
    if (isTrialExpired(status, subscription.trialEndDate)) {
      // Update subscription status to inactive if trial expired
      // This ensures immediate updates even if background job hasn't run
      if (status === SubscriptionStatus.TRIAL) {
        try {
          await updateSubscription(userId, {
            status: SubscriptionStatus.INACTIVE,
          });
        } catch (error) {
          // Log but don't fail - background job will handle it
          console.error("Failed to update expired trial status:", error);
        }
      }
      return {
        allowed: false,
        reason: "trial_expired",
        message:
          "Your trial has expired. Please upgrade to continue using OpenCard.",
        currentTier: planTier,
      };
    }

    // Check feature tier requirement
    if (featureId) {
      const feature = getFeature(featureId);
      if (!feature) {
        // Feature not found - deny access for safety
        return {
          allowed: false,
          reason: "insufficient_tier",
          message: "Feature not available.",
          currentTier: planTier,
        };
      }

      if (!tierHasAccess(planTier, feature.requiredTier)) {
        return {
          allowed: false,
          reason: "insufficient_tier",
          message: `This feature requires a ${feature.requiredTier} plan or higher.`,
          currentTier: planTier,
          requiredTier: feature.requiredTier,
        };
      }
    }

    // Check credits if required
    if (requiredCredits !== undefined && requiredCredits > 0) {
      const creditBalance = await getCreditBalance(userId);

      if (!creditBalance) {
        return {
          allowed: false,
          reason: "no_credits",
          message: "Credit balance not found. Please contact support.",
          currentTier: planTier,
        };
      }

      const creditsRemaining = creditBalance.creditsRemaining;

      if (creditsRemaining < requiredCredits) {
        const creditsNeeded = requiredCredits - creditsRemaining;
        return {
          allowed: false,
          reason: "insufficient_credits",
          message: `You need ${creditsNeeded} more credit${creditsNeeded !== 1 ? "s" : ""} to use this feature.`,
          currentTier: planTier,
          creditsRemaining,
          creditsRequired: requiredCredits,
          creditsNeeded,
        };
      }

      // Return success with credit info
      return {
        allowed: true,
        currentTier: planTier,
        creditsRemaining,
        creditsRequired: requiredCredits,
      };
    }

    // All checks passed
    return {
      allowed: true,
      currentTier: planTier,
    };
  } catch (error) {
    console.error("Error checking access:", error);
    // Fail securely - deny access on error
    return {
      allowed: false,
      reason: "subscription_inactive",
      message: "Unable to verify access. Please try again.",
    };
  }
}

/**
 * Quick check if user can perform any actions (not just viewing)
 * Returns true if subscription is active/trial and not expired
 */
export async function canPerformActions(userId: string): Promise<boolean> {
  const result = await checkAccess(userId, { allowViewOnly: false });
  return result.allowed;
}

/**
 * Check if user can access a specific feature
 */
export async function canAccessFeature(
  userId: string,
  featureId: FeatureId,
  requiredCredits?: number
): Promise<AccessCheckResult> {
  return checkAccess(userId, {
    featureId,
    requiredCredits,
    allowViewOnly: false,
  });
}

/**
 * Check if user has sufficient credits
 */
export async function hasSufficientCredits(
  userId: string,
  requiredCredits: number
): Promise<AccessCheckResult> {
  return checkAccess(userId, {
    requiredCredits,
    allowViewOnly: false,
  });
}

/**
 * Get user's current tier
 */
export async function getUserTier(userId: string): Promise<PlanTier> {
  const subscription = await getUserSubscription(userId);
  return normalizePlanTier(subscription?.plan?.id);
}
