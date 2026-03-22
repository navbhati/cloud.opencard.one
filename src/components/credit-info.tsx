"use client";

import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Sparkle,
  Loader2,
  CreditCard,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useCreditInfo } from "@/contexts/credit-context";
import { Separator } from "@/components/ui/separator";
import { useAccessCheck } from "@/hooks/use-access-check";
import { Alert, AlertDescription } from "@/components/ui/alert";

type CreditInfoVariant = "header" | "sidebar" | "menu" | "page" | "compact";

interface CreditInfoProps {
  /**
   * Display variant:
   * - header: Compact display for header/breadcrumb area
   * - sidebar: Default sidebar display with plan and credits
   * - menu: Inline compact display for dropdown menus
   * - page: Full card display for page content
   * - compact: Dark sidebar variant with progress bar and manage button
   */
  variant?: CreditInfoVariant;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Show action button (Upgrade/Manage)
   */
  showAction?: boolean;
  /**
   * Show progress bar (only applicable for page variant)
   */
  showProgress?: boolean;
}

export function CreditInfo({
  variant = "sidebar",
  className,
  showAction = true,
  showProgress = false,
}: CreditInfoProps) {
  const { subscription, loading } = useCreditInfo();
  const { canAccess, lastCheck, isChecking } = useAccessCheck({
    checkOnMount: true,
    useServerValidation: true,
  });

  const shouldShowUpgrade =
    subscription?.planId === "free" || subscription?.planId === "plus";

  const actionText = shouldShowUpgrade ? "Upgrade" : "Manage";
  const actionUrl = shouldShowUpgrade ? "/plans" : "/settings/billing";

  const creditPercentage = subscription?.creditsTotal
    ? (subscription.creditsRemaining / subscription.creditsTotal) * 100
    : 100;

  // Determine if subscription is inactive
  const isInactive =
    !canAccess &&
    (lastCheck?.reason === "trial_expired" ||
      lastCheck?.reason === "subscription_inactive" ||
      lastCheck?.reason === "subscription_canceled" ||
      lastCheck?.reason === "subscription_past_due");

  const inactiveMessage = lastCheck?.message || "Your subscription is inactive";

  // Loading states for each variant
  if (loading) {
    switch (variant) {
      case "header":
        return (
          <div className={cn("flex items-center gap-2", className)}>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        );
      case "menu":
        return (
          <div className={cn("flex items-center gap-2 px-2 py-1.5", className)}>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        );
      case "compact":
        return (
          <div
            className={cn("bg-background rounded-lg p-3 space-y-2", className)}
          >
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        );
      case "page":
        return (
          <Card className={className}>
            <CardHeader>
              <CardTitle>Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        );
      default: // sidebar
        return (
          <div className={cn("grid gap-2 py-2", className)}>
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        );
    }
  }

  // Handle no subscription data (error or not logged in)
  if (!subscription) {
    switch (variant) {
      case "header":
        return (
          <div className={cn("flex items-center gap-2", className)}>
            <span className="text-sm text-muted-foreground">No data</span>
          </div>
        );
      case "menu":
      case "sidebar":
        return (
          <div className={cn("px-2 py-1 text-center", className)}>
            <span className="text-xs text-muted-foreground">
              No subscription data
            </span>
          </div>
        );
      case "compact":
        return (
          <div
            className={cn(
              "bg-background rounded-lg p-3 text-center",
              className
            )}
          >
            <span className="text-xs text-muted-foreground">
              No subscription data
            </span>
          </div>
        );
      case "page":
        return (
          <Card className={className}>
            <CardHeader>
              <CardTitle>Credits Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-muted-foreground">
                  No subscription data available
                </span>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  }

  // Render variants
  switch (variant) {
    case "header":
      return (
        <div className={cn("flex items-center gap-3", className)}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {subscription.creditsRemaining.toLocaleString()}
            </span>
            <span className="text-xs text-primary">credits remaining</span>
            {isInactive && (
              <Badge
                variant="destructive"
                className="text-[10px] px-1 py-0.5 rounded-[3px] h-4 leading-none font-light"
              >
                Inactive
              </Badge>
            )}
          </div>
          {showAction && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => (window.location.href = "/plans")}
              disabled={isInactive}
            >
              <Sparkle className="h-3.5 w-3.5" />
              {isInactive ? "Upgrade" : actionText}
            </Button>
          )}
        </div>
      );

    case "menu":
      return (
        <div className={cn("px-2 py-1.5 space-y-2", className)}>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Plan</span>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-xs font-medium">
                {subscription.planName}
              </Badge>
              {isInactive && (
                <Badge variant="destructive" className="text-xs">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              Credits Remaining
            </span>
            <span className="text-xs font-semibold">
              {subscription.creditsRemaining.toLocaleString()}
            </span>
          </div>
          {isInactive && (
            <Alert className="py-2">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                {inactiveMessage}
              </AlertDescription>
            </Alert>
          )}
          {showAction && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 gap-1.5 mt-1"
              onClick={() => (window.location.href = "/plans")}
              disabled={isInactive}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isInactive ? "Upgrade" : actionText}
            </Button>
          )}
        </div>
      );

    case "page":
      return (
        <Card className={className}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Credits & Plan</CardTitle>
                <CardDescription className="mt-1">
                  Monitor your usage and manage your subscription
                </CardDescription>
              </div>
              <Badge
                variant={shouldShowUpgrade ? "secondary" : "default"}
                className="text-sm px-3 py-1"
              >
                {subscription.planName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Credits Display */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Available Credits</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {subscription.creditsRemaining.toLocaleString()}
                  </div>
                  {subscription.creditsTotal && (
                    <div className="text-xs text-muted-foreground">
                      of {subscription.creditsTotal.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {showProgress && subscription.creditsTotal && (
                <div className="space-y-1">
                  <Progress value={creditPercentage} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{creditPercentage.toFixed(0)}% remaining</span>
                    <span>
                      {(
                        subscription.creditsTotal -
                        subscription.creditsRemaining
                      ).toLocaleString()}{" "}
                      used
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    subscription.status === "active" ? "default" : "secondary"
                  }
                  className="capitalize"
                >
                  {subscription.status}
                </Badge>
                {isInactive && (
                  <Badge variant="destructive" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>

            {/* Inactive Warning */}
            {isInactive && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{inactiveMessage}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            {showAction && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant={
                    isInactive || shouldShowUpgrade ? "default" : "outline"
                  }
                  className="flex-1 gap-2"
                  onClick={() => (window.location.href = "/plans")}
                  disabled={isInactive}
                >
                  {isInactive || shouldShowUpgrade ? (
                    <>
                      <TrendingUp className="h-4 w-4" />
                      Upgrade Plan
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Manage Subscription
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      );

    case "compact":
      return (
        <div className={cn("rounded-lg p-3 space-y-1", className)}>
          <div className="flex items-center gap-1.5 justify-between">
            <Badge variant="outline" className="text-xs rounded-sm">
              {subscription.planName}
            </Badge>
            {isInactive && (
              <Badge
                variant="destructive"
                className="text-[10px] px-1 py-0.5 rounded-[3px] h-4 leading-none font-light"
              >
                Inactive
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-0 mt-2">
            <Progress
              value={creditPercentage}
              className="h-1.5 bg-primary/20"
            />
          </div>

          {/* Credits Remaining */}
          <div className="text-muted-foreground text-xs mb-4">
            {subscription.creditsRemaining.toLocaleString()} Credits Remaining
          </div>

          {/* {isInactive && (
            <Alert className="py-1 mb-2 px-1 rounded-sm flex items-center gap-1">
              <span className="flex items-center h-full">
                <AlertCircle className="h-4 w-4 mr-1" />
              </span>
              <AlertDescription className="text-xs">
                {inactiveMessage}
              </AlertDescription>
            </Alert>
          )} */}

          {showAction && (
            <div className="grid gap-2.5">
              <Button
                variant="outline"
                className="cursor-pointer"
                size="sm"
                onClick={() => (window.location.href = "/plans")}
              >
                <span className="inline-flex items-center gap-1">
                  <Sparkles />
                  {isInactive ? "Upgrade" : actionText}
                </span>
              </Button>
            </div>
          )}
        </div>
      );

    default: // sidebar
      return (
        <div className={cn("grid gap-2 py-2", className)}>
          {subscription && (
            <div className="px-2 py-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Plan</span>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    {subscription.planName}
                  </Badge>
                  {isInactive && (
                    <Badge variant="destructive" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Credits</span>
                <span className="text-xs font-medium">
                  {subscription.creditsRemaining.toLocaleString()}
                </span>
              </div>
            </div>
          )}
          {isInactive && subscription && (
            <div className="px-2">
              <Alert className="py-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  {inactiveMessage}
                </AlertDescription>
              </Alert>
            </div>
          )}
          {showAction && (
            <div className="grid gap-2.5">
              <Button
                variant="outline"
                className="cursor-pointer"
                size="sm"
                onClick={() => (window.location.href = "/plans")}
              >
                <span className="inline-flex items-center gap-1">
                  <Sparkles />
                  {isInactive ? "Upgrade" : actionText}
                </span>
              </Button>
            </div>
          )}
        </div>
      );
  }
}
