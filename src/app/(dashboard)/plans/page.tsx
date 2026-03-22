"use client";

// TODO test behaviour when user is on different plans and tries to upgrade to a different plan

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";
import { Spinner } from "@/components/ui/spinner";
import { SITE_CONFIG } from "@/config/platform/site_config";

// Types
type PaymentFrequency = "monthly" | "yearly";

type PricingTier = {
  id: string;
  name: string;
  price: Record<PaymentFrequency, number | string>;
  description: string;
  featureTitle: string;
  features: string[];
  cta: string;
  popular?: boolean;
};

interface ApiPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  creditsPerMonth: number;
  features: string[];
  cta: string;
  popular: boolean;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  trialDays: number;
  isActive: boolean;
}

// Constants
const PAYMENT_FREQUENCIES: PaymentFrequency[] = ["monthly", "yearly"];

// Helper function to render badge
const renderBadge = (tier: PricingTier) => {
  if (tier.popular) {
    return (
      <Badge className="bg-orange-900 px-2 py-1 text-xs text-white hover:bg-orange-900 rounded-sm">
        Most Popular
      </Badge>
    );
  }

  if (tier.id === "free") {
    return (
      <Badge
        variant="secondary"
        className="bg-gray-200 text-gray-600 hover:bg-gray-200 px-2 py-1 text-xs rounded-sm"
      >
        No credit card required
      </Badge>
    );
  }

  return null;
};

// Helper function to render pricing
const renderPrice = (
  price: number | string,
  frequency: PaymentFrequency,
  planId?: string
) => {
  // Handle enterprise plan with custom pricing
  if (planId === "enterprise") {
    return <h1 className="text-md font-normal text-primary">Custom Pricing</h1>;
  }

  if (typeof price === "string") {
    return <h1 className="text-4xl font-medium">{price}</h1>;
  }

  const billingText =
    frequency === "monthly"
      ? "billed monthly"
      : //: `$${price * 12} billed annually`;
        `billed annually`;

  return (
    <>
      <div className="flex items-baseline gap-1">
        <h1 className="text-4xl font-medium">${price}</h1>
        <span className="text-sm text-foreground/60">/month</span>
      </div>
      <p className="mt-1 text-sm text-foreground/60">{billingText}</p>
    </>
  );
};

// Components
const Tab = ({
  text,
  selected,
  onSelect,
  showDiscount = false,
}: {
  text: string;
  selected: boolean;
  onSelect: () => void;
  showDiscount?: boolean;
}) => (
  <button
    onClick={onSelect}
    className={cn(
      "text-foreground relative px-4 py-2 text-sm font-semibold capitalize transition-colors",
      showDiscount && "flex items-center gap-2.5"
    )}
  >
    <span className="relative z-10">{text}</span>
    {selected && (
      <motion.span
        layoutId="tab"
        transition={{ type: "spring", duration: 0.4 }}
        className="bg-background absolute inset-0 rounded-lg shadow-sm"
      />
    )}
    {showDiscount && (
      <Badge
        className={cn(
          "relative z-10 text-xs whitespace-nowrap text-black shadow-none hover:bg-gray-100 normal-case",
          selected ? "bg-green-300" : "bg-gray-300"
        )}
      >
        Save up to 20%
      </Badge>
    )}
  </button>
);

const PricingCard = ({
  tier,
  frequency,
  currentPlanId,
  onSelectPlan,
  loading,
  isAnyLoading,
}: {
  tier: PricingTier;
  frequency: PaymentFrequency;
  currentPlanId?: string;
  onSelectPlan: (planId: string, billingCycle: PaymentFrequency) => void;
  loading: boolean;
  isAnyLoading: boolean;
}) => {
  const price = tier.price[frequency];
  const isPopular = tier.popular ?? false;
  const isCurrentPlan = currentPlanId === tier.id;

  const handleClick = () => {
    if (!isAnyLoading && tier.id !== "free" && tier.id !== "enterprise") {
      onSelectPlan(tier.id, frequency);
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col gap-8 overflow-hidden rounded-2xl border p-4 shadow bg-background text-foreground",
        isPopular && "outline outline-primary",
        isCurrentPlan && "ring-2 ring-primary"
      )}
    >
      {/* Popular Background Effect */}
      {isPopular && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(85,97,200,0.13),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(85,97,200,0.38),rgba(255,255,255,0))] pointer-events-none" />
      )}

      {/* Badge Section */}
      <div className="h-4 flex justify-end items-center">
        {isCurrentPlan ? (
          <Badge className="bg-primary text-primary-foreground px-2 py-1 text-xs rounded-sm">
            Current Plan
          </Badge>
        ) : (
          renderBadge(tier)
        )}
      </div>

      {/* Plan Name */}
      <h2 className="text-2xl font-bold capitalize">{tier.name}</h2>

      {/* Description */}
      <p className="text-xs text-foreground/60 -mt-6">{tier.description}</p>

      {/* Pricing */}
      <div className="relative">{renderPrice(price, frequency, tier.id)}</div>

      {/* Features */}
      <div className="flex-1 space-y-2">
        <h3 className="text-sm font-medium">{tier.featureTitle}</h3>
        <ul className="space-y-2">
          {tier.features.map((feature, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm font-normal text-foreground/60 normal-case"
            >
              <Check
                className="text-primary dark:text-primary shrink-0 mt-0.5"
                strokeWidth={2}
                size={16}
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      {tier.id === "enterprise" ? (
        <Button
          variant="default"
          className="w-full rounded-lg cursor-pointer bg-primary hover:bg-primary/90"
          asChild
        >
          <a
            href={`mailto:${SITE_CONFIG.supportEmail}?subject=Enterprise Plan Inquiry - ${SITE_CONFIG.siteName}`}
          >
            Contact Sales
          </a>
        </Button>
      ) : (
        <Button
          variant={isPopular ? "default" : "outline"}
          className={cn(
            "w-full rounded-lg cursor-pointer",
            !isPopular && "hover:bg-primary/10"
          )}
          onClick={handleClick}
          disabled={isAnyLoading || isCurrentPlan || tier.id === "free"}
        >
          {loading ? (
            <>
              <Spinner />
              Processing...
            </>
          ) : isCurrentPlan ? (
            "Current Plan"
          ) : tier.id === "free" ? (
            "Free"
          ) : (
            tier.cta
          )}
        </Button>
      )}
    </div>
  );
};

export default function PlansPage() {
  const [selectedFrequency, setSelectedFrequency] =
    useState<PaymentFrequency>("yearly");
  const [currentPlanId, setCurrentPlanId] = useState<string | undefined>();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    fetchCurrentPlan();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/plans");
      if (response.ok) {
        const data = await response.json();

        // Get all plans including Free to determine hierarchy
        const allPlans: ApiPlan[] = data.plans;

        // Define plan hierarchy order
        const planOrder = ["free", "plus", "pro", "enterprise"];

        // Sort all plans by hierarchy
        const sortedPlans = [...allPlans].sort((a, b) => {
          const aIndex = planOrder.indexOf(a.id);
          const bIndex = planOrder.indexOf(b.id);
          return aIndex - bIndex;
        });

        // Create a map for quick lookup
        const planMap = new Map(sortedPlans.map((plan) => [plan.id, plan]));

        // Transform API data to PricingTier format (excluding free plan from display)
        const transformedTiers: PricingTier[] = sortedPlans
          .filter((plan: ApiPlan) => plan.id !== "free") // Don't show free plan as purchasable
          .map((plan: ApiPlan) => {
            // Find previous plan in hierarchy
            const currentIndex = planOrder.indexOf(plan.id);
            const previousPlanId =
              currentIndex > 0 ? planOrder[currentIndex - 1] : null;
            const previousPlan = previousPlanId
              ? planMap.get(previousPlanId)
              : null;

            // Set feature title based on previous plan
            const featureTitle = previousPlan
              ? `Everything in ${previousPlan.name}, and:`
              : `Everything in ${plan.name} and:`;

            return {
              id: plan.id,
              name: plan.name,
              price: {
                monthly: plan.monthlyPrice,
                yearly: plan.yearlyPrice,
              },
              description: plan.description,
              featureTitle,
              features: plan.features,
              cta: plan.cta,
              popular: plan.popular,
            };
          });

        setTiers(transformedTiers);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load plans");
    } finally {
      setPlansLoading(false);
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch("/api/stripe/current");
      if (response.ok) {
        const data = await response.json();
        if (data.subscription) {
          setCurrentPlanId(data.subscription.plan.id);
        }
      }
    } catch (error) {
      console.error("Error fetching current plan:", error);
    }
  };

  const handleSelectPlan = async (
    planId: string,
    billingCycle: PaymentFrequency
  ) => {
    setLoadingPlanId(planId);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          billingCycle,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingPlanId(null);
    }
  };

  if (plansLoading) {
    return (
      <section className="flex flex-col items-center justify-center gap-10 py-10 min-h-[400px]">
        <LoadingScreen />
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center gap-10 py-10">
      {/* Header */}
      <div className="space-y-7 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-medium md:text-4xl">
            Pricing for Everyone
          </h1>
          <p className="text-foreground/60 text-sm">
            Enable everyone to bring ideas to life with AI-driven visuals and
            content.
          </p>
        </div>

        {/* Payment Frequency Toggle */}
        <div className="mx-auto flex w-fit rounded-lg bg-[#F3F4F6] p-1 dark:bg-[#222]">
          {PAYMENT_FREQUENCIES.map((freq) => (
            <Tab
              key={freq}
              text={freq}
              selected={selectedFrequency === freq}
              onSelect={() => setSelectedFrequency(freq)}
              showDiscount={freq === "yearly"}
            />
          ))}
        </div>
      </div>

      {/* Pricing Cards Grid */}
      {tiers.length > 0 ? (
        <div className="flex flex-wrap justify-center w-full max-w-[1040px] gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] max-w-[340px]"
            >
              <PricingCard
                tier={tier}
                frequency={selectedFrequency}
                currentPlanId={currentPlanId}
                onSelectPlan={handleSelectPlan}
                loading={loadingPlanId === tier.id}
                isAnyLoading={loadingPlanId !== null}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            No plans available at the moment.
          </p>
        </div>
      )}
    </section>
  );
}
