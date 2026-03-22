/**
 * Utility functions for access control
 *
 * Client-side utilities for checking access, displaying badges, etc.
 */

import {
  FeatureId,
  getFeature,
  getFeatureBadge,
  PlanTier,
  tierHasAccess,
} from "./features";

/**
 * Get badge text for a feature
 */
export function getBadgeForFeature(featureId: FeatureId): string | undefined {
  return getFeatureBadge(featureId);
}

/**
 * Check if a tier can access a feature (client-side check)
 * Note: This is optimistic - server validation is authoritative
 */
export function canTierAccessFeature(
  userTier: PlanTier,
  featureId: FeatureId
): boolean {
  const feature = getFeature(featureId);
  if (!feature) return false;
  return tierHasAccess(userTier, feature.requiredTier);
}

/**
 * Get upgrade message for a feature
 */
export function getUpgradeMessage(featureId: FeatureId): string {
  const feature = getFeature(featureId);
  if (!feature) return "This feature is not available.";

  const tierName =
    feature.requiredTier.charAt(0).toUpperCase() +
    feature.requiredTier.slice(1);
  return `This feature requires a ${tierName} plan or higher.`;
}

/**
 * Format plan tier for display
 */
export function formatTier(tier: PlanTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
