/**
 * Feature Badge Component
 *
 * Displays a badge indicating the subscription tier required for a feature.
 * Only shows the badge when the user doesn't have access to the feature.
 */

import { FeatureId, getFeatureBadge } from "@/lib/access-control/features";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useAccessCheck } from "@/hooks/use-access-check";

interface FeatureBadgeProps {
  /** Feature ID to show badge for */
  featureId: FeatureId;
  /** Custom className */
  className?: string;
  /** Variant for the badge */
  variant?: "default" | "secondary" | "outline";
  /** Force show badge even if user has access (default: false) */
  forceShow?: boolean;
}

/**
 * Feature Badge Component
 *
 * Only displays the badge when the user doesn't have access to the feature.
 * This prevents showing "Pro" badge to users who already have Pro access.
 *
 * @example
 * <FeatureBadge featureId="chat:model_selection" />
 */
export function FeatureBadge({
  featureId,
  className,
  variant = "secondary",
  forceShow = false,
}: FeatureBadgeProps) {
  const badge = getFeatureBadge(featureId);

  // Check if user has access (only if not forcing show)
  const { canAccess } = useAccessCheck({
    featureId,
    useServerValidation: false, // Use client-side check for badge visibility
  });

  // Don't show badge if:
  // 1. No badge defined
  // 2. User has access AND not forcing show
  if (!badge || (!forceShow && canAccess)) {
    return null;
  }

  return (
    <Badge
      variant={variant}
      className={["border border-primary rounded-sm font-normal", className]
        .filter(Boolean)
        .join(" ")}
    >
      <Sparkles className="size-4 text-primary" /> {badge}
    </Badge>
  );
}
