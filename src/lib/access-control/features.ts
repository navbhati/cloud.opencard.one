/**
 * Feature definitions and tier requirements
 *
 * This file defines all features and their subscription tier requirements.
 * Features are organized by category for better maintainability.
 */

export type PlanTier = "free" | "plus" | "pro" | "enterprise";

export type FeatureId =
  // Content Generation
  | "content:generate"
  | "content:generate:batch"
  | "content:save_template"
  | "content:create_template"

  // Chat
  | "chat:start"
  | "chat:model_selection"

  // Sources
  | "source:add"
  | "source:import"
  | "source:bulk_import"

  // Templates
  | "template:create"
  | "template:save"
  | "template:custom"

  // Infographics
  | "infographic:create"
  | "infographic:custom_template"

  // Analytics
  | "analytics:advanced"

  // Voice Profiles
  | "content:voice_profile"

// Integrations
//TODO: Add integrations

// Automation
//TODO: Add automation
// | "automation:triggers"
// | "automation:monitoring"
// | "automation:workflows";

/**
 * Feature definition with tier requirement and metadata
 */
export interface FeatureDefinition {
  /** Unique feature identifier */
  id: FeatureId;
  /** Minimum tier required to access this feature */
  requiredTier: PlanTier;
  /** Human-readable feature name */
  name: string;
  /** Feature description */
  description?: string;
  /** Badge text to show (e.g., "Pro", "Plus", "Enterprise") */
  badge?: string;
}

/**
 * Feature registry - all features with their tier requirements
 */
export const FEATURES: Record<FeatureId, FeatureDefinition> = {
  // Content Generation
  "content:generate": {
    id: "content:generate",
    requiredTier: "free",
    name: "Generate Content",
    description: "Generate content from sources",
  },
  "content:generate:batch": {
    id: "content:generate:batch",
    requiredTier: "plus",
    name: "Batch Content Generation",
    description: "Generate multiple content pieces at once",
    badge: "Plus",
  },
  "content:save_template": {
    id: "content:save_template",
    requiredTier: "plus",
    name: "Save Templates",
    description: "Save custom content templates",
    badge: "Plus",
  },
  //for now, free tier users can create templates
  "content:create_template": {
    id: "content:create_template",
    requiredTier: "free",
    name: "Create Templates",
    description: "Create custom content templates",
    //badge: "Plus",
  },

  // Chat
  "chat:start": {
    id: "chat:start",
    requiredTier: "free",
    name: "Start Chat",
    description: "Start a chat conversation",
  },
  "chat:model_selection": {
    id: "chat:model_selection",
    requiredTier: "free",
    name: "AI Model Selection",
    description: "Select different AI models for chat",
    // badge: "Pro",
  },

  // Sources
  "source:add": {
    id: "source:add",
    requiredTier: "free",
    name: "Add Source",
    description: "Add a new content source",
  },
  "source:import": {
    id: "source:import",
    requiredTier: "free",
    name: "Import Source",
    description: "Import sources from links or text",
  },
  "source:bulk_import": {
    id: "source:bulk_import",
    requiredTier: "pro",
    name: "Bulk Source Import",
    description: "Import multiple sources at once",
    badge: "Pro",
  },

  // Templates
  "template:create": {
    id: "template:create",
    requiredTier: "free",
    name: "Create Template",
    description: "Create custom templates",
    //badge: "Plus",
  },
  "template:save": {
    id: "template:save",
    requiredTier: "free",
    name: "Save Template",
    description: "Save templates for reuse",
    //badge: "Plus",
  },
  "template:custom": {
    id: "template:custom",
    requiredTier: "free",
    name: "Custom Templates",
    description: "Create fully custom templates",
    //badge: "Pro",
  },

  // Infographics
  "infographic:create": {
    id: "infographic:create",
    requiredTier: "free",
    name: "Create Infographic",
    description: "Create infographics",
  },
  "infographic:custom_template": {
    id: "infographic:custom_template",
    requiredTier: "free",
    name: "Custom Infographic Templates",
    description: "Create custom infographic templates",
  },

  // Analytics
  "analytics:advanced": {
    id: "analytics:advanced",
    requiredTier: "free",
    name: "Advanced Analytics",
    description: "Access advanced analytics features",
    //badge: "Pro",
  },

  // Voice Profiles
  "content:voice_profile": {
    id: "content:voice_profile",
    requiredTier: "free",
    name: "Voice Profile",
    description: "Create and use voice profiles to match your writing style",
    // No badge - available to all tiers with different limits
  },

  // Integrations
  //TODO: Add integrations

  // Automation
  /* "automation:triggers": {
    id: "automation:triggers",
    requiredTier: "pro",
    name: "Automation Triggers",
    description: "Set up automated content generation triggers",
    badge: "Pro",
  },
  "automation:monitoring": {
    id: "automation:monitoring",
    requiredTier: "pro",
    name: "Source Monitoring",
    description: "Automated source and competitor monitoring",
    badge: "Pro",
  },
  "automation:workflows": {
    id: "automation:workflows",
    requiredTier: "enterprise",
    name: "Custom Workflows",
    description: "Create custom automation workflows",
    badge: "Enterprise",
  }, */
};

/**
 * Tier hierarchy for comparison
 * Higher number = higher tier
 */
export const TIER_HIERARCHY: Record<PlanTier, number> = {
  free: 0,
  plus: 1,
  pro: 2,
  enterprise: 3,
};

/**
 * Check if a tier has access to a required tier
 */
export function tierHasAccess(
  userTier: PlanTier,
  requiredTier: PlanTier
): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
}

/**
 * Get feature definition by ID
 */
export function getFeature(
  featureId: FeatureId
): FeatureDefinition | undefined {
  return FEATURES[featureId];
}

/**
 * Get badge text for a feature
 */
export function getFeatureBadge(featureId: FeatureId): string | undefined {
  return FEATURES[featureId]?.badge;
}
