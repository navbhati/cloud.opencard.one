/**
 * Feature Guard Component
 *
 * Conditionally renders children based on feature access.
 * Shows upgrade message if access is denied.
 */

"use client";

import { ReactNode } from "react";
import { useAccessCheck } from "@/hooks/use-access-check";
import { FeatureId } from "@/lib/access-control/features";
import { getUpgradeMessage } from "@/lib/access-control/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FeatureGuardProps {
  /** Feature ID to check access for */
  featureId: FeatureId;
  /** Children to render if access is allowed */
  children: ReactNode;
  /** Fallback content to show if access is denied */
  fallback?: ReactNode;
  /** Show upgrade message if access denied */
  showUpgradeMessage?: boolean;
  /** Required credits for the feature */
  requiredCredits?: number;
}

/**
 * Feature Guard Component
 *
 * Conditionally renders children based on feature access.
 *
 * @example
 * <FeatureGuard featureId="chat:model_selection">
 *   <ModelSelector />
 * </FeatureGuard>
 */
export function FeatureGuard({
  featureId,
  children,
  fallback,
  showUpgradeMessage = true,
  requiredCredits,
}: FeatureGuardProps) {
  const { canAccess, isChecking, lastCheck } = useAccessCheck({
    featureId,
    requiredCredits,
    useServerValidation: true,
  });

  if (isChecking) {
    return null; // Or a loading spinner
  }

  if (!canAccess && lastCheck?.reason === "insufficient_tier") {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradeMessage) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Required</CardTitle>
            <CardDescription>
              {lastCheck.message || getUpgradeMessage(featureId)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/plans")}>
              View Plans
            </Button>
          </CardContent>
        </Card>
      );
    }

    return null;
  }

  if (!canAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
}
