"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CreditCard,
  Calendar,
  AlertCircle,
  XCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatters";
import Link from "next/link";
import LoadingScreen from "@/components/LoadingScreen";
import { RecentActivities } from "@/components/billing/recent-activities";
import { useAccessCheck } from "@/hooks/use-access-check";
import { useRouter } from "next/navigation";
import { LucideIcon } from "lucide-react";

interface SubscriptionData {
  subscription: {
    status: string;
    planId: string;
    planName: string;
    billingCycle: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    stripeCustomerId?: string;
  } | null;
}

interface CreditBalance {
  creditsRemaining: number;
  creditsAllocated: number;
  nextResetAt: string | null;
  lastResetAt: string | null;
}

interface StatusConfig {
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: LucideIcon;
  colors: string;
  textColor: string;
}

// Consolidated status configuration
const STATUS_CONFIGS: Record<string, StatusConfig> = {
  active: {
    variant: "default",
    icon: CheckCircle,
    colors: "text-green-600 bg-green-50 border-green-200",
    textColor: "text-green-700",
  },
  trial: {
    variant: "secondary",
    icon: Clock,
    colors: "text-blue-600 bg-blue-50 border-blue-200",
    textColor: "text-blue-700",
  },
  canceled: {
    variant: "destructive",
    icon: XCircle,
    colors: "text-red-600 bg-red-50 border-red-200",
    textColor: "text-red-700",
  },
  inactive: {
    variant: "destructive",
    icon: XCircle,
    colors: "text-red-600 bg-red-50 border-red-200",
    textColor: "text-red-700",
  },
  past_due: {
    variant: "destructive",
    icon: AlertCircle,
    colors: "text-orange-600 bg-orange-50 border-orange-200",
    textColor: "text-orange-700",
  },
};

const DEFAULT_STATUS_CONFIG: StatusConfig = {
  variant: "outline",
  icon: AlertCircle,
  colors: "text-gray-600 bg-gray-50 border-gray-200",
  textColor: "text-gray-700",
};

const getStatusConfig = (status: string): StatusConfig => {
  return STATUS_CONFIGS[status.toLowerCase()] || DEFAULT_STATUS_CONFIG;
};

// Status message based on subscription state
const getStatusMessage = (
  subscription: SubscriptionData["subscription"],
  isInactive: boolean
): string | null => {
  if (!subscription) return null;

  if (isInactive) {
    return "Your subscription is inactive. Subscribe to a plan to continue using OpenCard.";
  }

  const status = subscription.status.toLowerCase();

  if (status === "active") {
    return subscription.cancelAtPeriodEnd
      ? "Your subscription will cancel at the end of the billing period."
      : "Your subscription is active and will auto-renew.";
  }

  const messages: Record<string, string> = {
    trial:
      "You're currently on a free trial. Upgrade to continue after the trial ends.",
    canceled:
      "Your subscription has been canceled. You can reactivate it anytime or choose a new plan.",
    inactive:
      "Your subscription is inactive. Subscribe to a plan to continue using OpenCard.",
    past_due:
      "Your subscription payment is past due. Please update your payment method.",
  };

  return (
    messages[status] ||
    "Your subscription status is unknown. Please contact support."
  );
};

// Date label based on subscription state
const getDateLabel = (
  subscription: SubscriptionData["subscription"],
  isInactive: boolean,
  inactiveReason?: string
): string => {
  if (!subscription?.currentPeriodEnd) return "";

  const status = subscription.status.toLowerCase();
  const periodEndDate = new Date(subscription.currentPeriodEnd);
  const date = formatDate(periodEndDate);
  const isDatePast = periodEndDate < new Date();
  const isTrialExpired = inactiveReason === "trial_expired";

  // Handle canceled status
  if (status === "canceled") {
    return `Cancelled on ${date}`;
  }

  // Handle cancelAtPeriodEnd - check if date has passed
  if (subscription.cancelAtPeriodEnd) {
    return isDatePast ? `Cancelled on ${date}` : `Cancels on ${date}`;
  }

  // Handle trial status - check if date has passed or trial expired
  if (status === "trial" || isTrialExpired) {
    return isDatePast || isTrialExpired
      ? `Trial expired on ${date}`
      : `Trial ends on ${date}`;
  }

  // Default renewal date
  return `Renews on ${date}`;
};

// Button configuration based on subscription state
const getButtonConfig = (
  subscription: SubscriptionData["subscription"],
  isInactive: boolean
): {
  text: string;
  action: "manage" | "update" | "subscribe";
  variant: "default" | "outline";
} => {
  if (!subscription || isInactive) {
    return { text: "Upgrade Plan", action: "subscribe", variant: "default" };
  }

  const status = subscription.status.toLowerCase();

  if (status === "active") {
    return subscription.cancelAtPeriodEnd
      ? { text: "Reactivate", action: "manage", variant: "outline" }
      : { text: "Manage Plan", action: "update", variant: "outline" };
  }

  const configs: Record<
    string,
    {
      text: string;
      action: "manage" | "update" | "subscribe";
      variant: "default" | "outline";
    }
  > = {
    trial: { text: "Upgrade Plan", action: "subscribe", variant: "default" },
    canceled: {
      text: "Choose a Plan",
      action: "subscribe",
      variant: "default",
    },
    inactive: { text: "Reactivate", action: "manage", variant: "outline" },
    past_due: { text: "Update Payment", action: "manage", variant: "outline" },
  };

  return (
    configs[status] || {
      text: "Subscribe",
      action: "subscribe",
      variant: "default",
    }
  );
};

// Check if user can manage subscription via portal
const canManageSubscription = (
  subscription: SubscriptionData["subscription"],
  isInactive: boolean
): boolean => {
  if (!subscription || isInactive) return false;

  const activeStatuses = ["active", "trial", "past_due"];
  return (
    activeStatuses.includes(subscription.status.toLowerCase()) &&
    !!subscription.stripeCustomerId
  );
};

// Format status for display
const formatStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export default function BillingPage() {
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState<
    "manage" | "update" | null
  >(null);

  const { canAccess, lastCheck } = useAccessCheck({
    checkOnMount: true,
    useServerValidation: true,
  });

  // Determine if subscription is inactive
  const isInactive =
    !canAccess &&
    [
      "trial_expired",
      "subscription_inactive",
      "subscription_canceled",
      "subscription_past_due",
    ].includes(lastCheck?.reason || "");

  const inactiveMessage = lastCheck?.message || "Your subscription is inactive";

  const fetchBillingData = useCallback(async () => {
    try {
      const [subResponse, creditResponse] = await Promise.all([
        fetch("/api/stripe/current"),
        fetch("/api/credits/check"),
      ]);

      if (subResponse.ok) {
        setSubscriptionData(await subResponse.json());
      }
      if (creditResponse.ok) {
        const result = await creditResponse.json();
        setCreditBalance(result.creditBalance);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const handleManageSubscription = async (
    action: "manage" | "update" | "subscribe"
  ) => {
    if (isInactive) {
      toast.error(inactiveMessage);
      router.push("/plans");
      return;
    }

    if (action === "subscribe") {
      window.location.href = "/plans";
      return;
    }

    setPortalLoading(action);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        }
      } else {
        toast.error("Failed to open customer portal");
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
      toast.error("Something went wrong");
    } finally {
      setPortalLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingScreen />
      </div>
    );
  }

  if (!subscriptionData || !creditBalance) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          Failed to load billing information
        </p>
      </div>
    );
  }

  const subscription = subscriptionData.subscription;

  // Derive all status-related values once
  const statusKey = isInactive
    ? "inactive"
    : subscription?.status?.toLowerCase() || "inactive";
  const statusConfig = getStatusConfig(statusKey);
  const StatusIcon = statusConfig.icon;
  const statusMessage = getStatusMessage(subscription, isInactive);
  const buttonConfig = getButtonConfig(subscription, isInactive);
  const showManageButton = canManageSubscription(subscription, isInactive);
  const dateLabel = getDateLabel(subscription, isInactive, lastCheck?.reason);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
      <div className="space-y-6">
        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="text-xl font-medium tracking-tight">
            Plan & Billing
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>

      {/* Current Plan */}
      <Card className="rounded-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {subscription
                  ? "Your subscription details"
                  : "No active subscription"}
              </CardDescription>
            </div>
            {subscription && (
              <div className="flex gap-2">
                {showManageButton && (
                  <Button
                    onClick={() => handleManageSubscription("manage")}
                    disabled={portalLoading === "manage"}
                    variant="outline"
                    size="sm"
                    className="h-7 font-normal rounded-sm"
                  >
                    {portalLoading === "manage" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Manage Subscription
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (isInactive) {
                      router.push("/plans");
                    } else {
                      handleManageSubscription(buttonConfig.action);
                    }
                  }}
                  disabled={portalLoading === "update"}
                  variant={buttonConfig.variant}
                  size="sm"
                  className="font-normal h-7 rounded-sm"
                >
                  {portalLoading === "update" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                      Loading...
                    </>
                  ) : (
                    buttonConfig.text
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div>
                <p className="font-medium text-lg">{subscription.planName}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {subscription.billingCycle === "NONE"
                    ? "Free Plan"
                    : `${subscription.billingCycle.toLowerCase()} billing`}
                </p>
              </div>

              {dateLabel && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{dateLabel}</span>
                </div>
              )}

              {statusMessage && (
                <div
                  className={`flex w-fit items-center gap-2 p-1 rounded-md border ${statusConfig.colors}`}
                >
                  <StatusIcon className="h-3 w-3 shrink-0" />
                  <p className={`text-xs ${statusConfig.textColor}`}>
                    {statusMessage}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No active subscription
              </p>
              <Button asChild>
                <Link href="/plans">Choose a Plan</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

        {/* Recent Activity */}
        <RecentActivities />
      </div>
    </div>
  );
}
