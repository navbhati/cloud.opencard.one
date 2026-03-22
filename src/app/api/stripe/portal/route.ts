import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { getUserSubscription } from "@/lib/server/services/subscription.service";
import { getUserByClerkId } from "@/lib/server/services/user.service";
import { STRIPE_CONFIG } from "@/config/stripe";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    // get action from request body to manage current subscription or update subscription plan
    const { action } = await req.json();
    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    if (action !== "manage" && action !== "update") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // ------------------------------------------------------------

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await getUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user subscription
    const subscription = await getUserSubscription(user.id);
    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active Stripe subscription found" },
        { status: 400 }
      );
    }

    const subscriptionId = subscription.stripeSubscriptionId;

    const config: Stripe.BillingPortal.SessionCreateParams = {
      customer: subscription.stripeCustomerId,
      return_url: STRIPE_CONFIG.customerPortalUrl,
    };

    // if action is update and subscription id is provided, add flow data to config
    if (action === "update" && subscriptionId) {
      config.flow_data = {
        type: "subscription_update",
        subscription_update: {
          subscription: subscriptionId,
        },
      };
    }
    // Create portal session
    const session = await stripe.billingPortal.sessions.create(config);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
