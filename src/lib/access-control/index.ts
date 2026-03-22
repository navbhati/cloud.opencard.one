/**
 * Access Control Framework - Public API
 *
 * Centralized exports for access control functionality
 */

// Feature definitions
export {
  type PlanTier,
  type FeatureId,
  type FeatureDefinition,
  FEATURES,
  TIER_HIERARCHY,
  tierHasAccess,
  getFeature,
  getFeatureBadge,
} from "./features";

// Client-side utilities
export {
  getBadgeForFeature,
  canTierAccessFeature,
  getUpgradeMessage,
  formatTier,
} from "./utils";

// Re-export types from hook for convenience
export type {
  AccessCheckResult,
  UseAccessCheckOptions,
} from "@/hooks/use-access-check";
