"use client";

import { useState, useCallback } from "react";
import { useCreditInfo } from "@/contexts/credit-context";
import { FeatureId, PlanTier } from "@/lib/access-control/features";
import { canTierAccessFeature } from "@/lib/access-control/utils";

export interface AccessCheckResult {
  allowed: boolean;
  reason?:
    | "trial_expired"
    | "inactive"
    | "canceled"
    | "past_due"
    | "insufficient_credits"
    | "insufficient_tier"
    | "no_subscription"
    | "no_credits"
    | "subscription_inactive"
    | "subscription_canceled"
    | "subscription_past_due";
  message?: string;
  creditsRemaining?: number;
  creditsRequired?: number;
  creditsNeeded?: number;
  currentTier?: PlanTier;
  requiredTier?: PlanTier;
}

export interface UseAccessCheckOptions {
  /**
   * Feature ID to check access for (optional)
   * If provided, will check if user's tier has access to this feature
   */
  featureId?: FeatureId;
  /**
   * Required credits for the feature (optional)
   * If provided, will check if user has enough credits
   */
  requiredCredits?: number;
  /**
   * Whether to check access on mount
   * @default false
   */
  checkOnMount?: boolean;
  /**
   * Whether to use server-side validation (recommended for production)
   * @default true
   */
  useServerValidation?: boolean;
}

/**
 * Hook for checking user access to features
 * Combines subscription status, tier, and credit checks
 *
 * @example
 * // Basic subscription check
 * const { canAccess, checkAccess } = useAccessCheck();
 *
 * const handleAction = async () => {
 *   const access = await checkAccess();
 *   if (!access.allowed) {
 *     toast.error(access.message);
 *     return;
 *   }
 *   // Proceed with action
 * };
 *
 * @example
 * // Check with feature and credit requirement
 * const { canAccess, checkAccess } = useAccessCheck({
 *   featureId: "chat:model_selection",
 *   requiredCredits: 5
 * });
 *
 * @example
 * // Use in component
 * const { canAccess, isLoading } = useAccessCheck({
 *   featureId: "chat:start",
 *   requiredCredits: CHAT_MESSAGE_COST,
 *   checkOnMount: true
 * });
 *
 * return (
 *   <Button disabled={!canAccess || isLoading}>
 *     Send Message
 *   </Button>
 * );
 */
export function useAccessCheck(options: UseAccessCheckOptions = {}) {
  const { subscription, loading: creditsLoading } = useCreditInfo();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<AccessCheckResult | null>(null);
  const { useServerValidation = true } = options;

  /**
   * Check access using server-side validation (recommended)
   */
  const checkAccessServer = useCallback(
    async (
      overrideCredits?: number,
      overrideFeatureId?: FeatureId
    ): Promise<AccessCheckResult> => {
      setIsChecking(true);
      try {
        const requiredCredits = overrideCredits ?? options.requiredCredits;
        const featureId = overrideFeatureId ?? options.featureId;

        const response = await fetch("/api/access/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            featureId,
            requiredCredits,
            checkType: featureId
              ? "feature"
              : requiredCredits
                ? "credits"
                : "full",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to check access");
        }

        const result: AccessCheckResult = await response.json();
        setLastCheck(result);
        return result;
      } catch (error) {
        console.error("Error checking access:", error);
        // Fallback to client-side check on error
        return checkAccessClient(overrideCredits, overrideFeatureId);
      } finally {
        setIsChecking(false);
      }
    },
    [options.requiredCredits, options.featureId]
  );

  /**
   * Client-side quick check (fallback or for optimistic UI)
   */
  const checkAccessClient = useCallback(
    async (
      overrideCredits?: number,
      overrideFeatureId?: FeatureId
    ): Promise<AccessCheckResult> => {
      const requiredCredits = overrideCredits ?? options.requiredCredits;
      const featureId = overrideFeatureId ?? options.featureId;

      // Client-side quick check using subscription context
      if (subscription) {
        // Check subscription status (handle both uppercase enum values and lowercase strings)
        const status = subscription.status?.toLowerCase();
        if (status !== "active" && status !== "trial") {
          const result: AccessCheckResult = {
            allowed: false,
            reason:
              status === "inactive"
                ? "inactive"
                : status === "canceled"
                  ? "canceled"
                  : status === "past_due"
                    ? "past_due"
                    : "inactive",
            message:
              status === "inactive"
                ? "Your subscription is inactive. Please upgrade to continue using Artivact."
                : status === "canceled"
                  ? "Your subscription has been canceled. Please reactivate or choose a new plan."
                  : status === "past_due"
                    ? "Your subscription payment is past due. Please update your payment method."
                    : "Your subscription is not active. Please upgrade to continue.",
            creditsRemaining: subscription.creditsRemaining,
            currentTier: subscription.planId as PlanTier,
          };

          setLastCheck(result);
          return result;
        }

        // Check credits if required
        if (requiredCredits !== undefined && requiredCredits > 0) {
          const creditsRemaining = subscription.creditsRemaining ?? 0;
          if (creditsRemaining < requiredCredits) {
            const creditsNeeded = requiredCredits - creditsRemaining;
            const result: AccessCheckResult = {
              allowed: false,
              reason: "insufficient_credits",
              message: `You need ${creditsNeeded} more credit${creditsNeeded !== 1 ? "s" : ""} to use this feature.`,
              creditsRemaining,
              creditsRequired: requiredCredits,
              creditsNeeded,
              currentTier: subscription.planId as PlanTier,
            };

            setLastCheck(result);
            return result;
          }
        }

        // Note: Tier-based feature checks should use server validation
        // Client-side can't reliably check tier requirements without server

        // All checks passed
        const result: AccessCheckResult = {
          allowed: true,
          creditsRemaining: subscription.creditsRemaining,
          creditsRequired: requiredCredits,
          currentTier: subscription.planId as PlanTier,
        };

        setLastCheck(result);
        return result;
      }

      // No subscription
      const result: AccessCheckResult = {
        allowed: false,
        reason: "no_subscription",
        message:
          "No subscription found. Please subscribe to a plan to continue.",
      };

      setLastCheck(result);
      return result;
    },
    [subscription, options.requiredCredits, options.featureId]
  );

  /**
   * Main check access function - uses server validation by default
   */
  const checkAccess = useCallback(
    async (
      overrideCredits?: number,
      overrideFeatureId?: FeatureId
    ): Promise<AccessCheckResult> => {
      if (useServerValidation) {
        return checkAccessServer(overrideCredits, overrideFeatureId);
      }
      return checkAccessClient(overrideCredits, overrideFeatureId);
    },
    [useServerValidation, checkAccessServer, checkAccessClient]
  );

  // Quick access check based on current subscription state
  // Note: This is optimistic - server validation is authoritative
  // Use checkAccess() for comprehensive validation
  const canAccess = useCallback(() => {
    // If we have a server validation result, use that as the source of truth
    if (lastCheck && useServerValidation) {
      return lastCheck.allowed;
    }

    // Otherwise, use client-side subscription data for optimistic UI
    if (!subscription) return false;

    // Check subscription status (handle both uppercase enum values and lowercase strings)
    const status = subscription.status?.toLowerCase();
    if (status !== "active" && status !== "trial") {
      return false;
    }

    // Check tier requirement if featureId is provided (client-side tier check)
    if (options.featureId) {
      const userTier = (subscription.planId || "free") as PlanTier;
      if (!canTierAccessFeature(userTier, options.featureId)) {
        return false;
      }
    }

    if (
      options.requiredCredits !== undefined &&
      options.requiredCredits > 0 &&
      (subscription.creditsRemaining ?? 0) < options.requiredCredits
    ) {
      return false;
    }

    return true;
  }, [
    subscription,
    options.requiredCredits,
    options.featureId,
    lastCheck,
    useServerValidation,
  ]);

  // Check access on mount if requested
  const [hasCheckedOnMount, setHasCheckedOnMount] = useState(false);
  if (options.checkOnMount && !hasCheckedOnMount && !creditsLoading) {
    setHasCheckedOnMount(true);
    checkAccess();
  }

  return {
    /**
     * Quick synchronous check based on current subscription state
     * Use this for UI disabled states, etc.
     */
    canAccess: canAccess(),
    /**
     * Async comprehensive access check
     * Use this before performing actions
     */
    checkAccess,
    /**
     * Last access check result
     */
    lastCheck,
    /**
     * Whether an access check is currently in progress
     */
    isChecking: isChecking || creditsLoading,
    /**
     * Current subscription info
     */
    subscription,
  };
}
