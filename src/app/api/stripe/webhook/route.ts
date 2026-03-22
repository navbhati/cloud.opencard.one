import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { STRIPE_CONFIG } from "@/config/stripe";
import {
  activatePaidSubscription,
  getSubscriptionByStripeId,
  updateSubscription,
} from "@/lib/server/services/subscription.service";
import { resetCredits } from "@/lib/server/services/credits.service";
import { getPlanByStripePriceId } from "@/lib/server/services/plans.service";
import { BillingCycle, SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";
import { addMonthsPreservingEndOfMonth } from "@/lib/formatters";

export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, event);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

function getDateAfterMonth(date: Date): Date {
  const result = new Date(date);
  // Set to the same date next month
  result.setMonth(result.getMonth() + 1);
  return result;
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const planId = subscription.metadata?.planId;
  const billingCycle = subscription.metadata?.billingCycle;
  const subscriptionType = subscription.metadata?.subscriptionType;
  const priceId = subscription.items.data[0].price.id;

  if (!userId) {
    console.error("Missing metadata in subscription");
  }

  if (subscriptionType !== "individual") {
    console.log("Skipping non-individual subscription.");
    return;
  }

  // Activate subscription in database
  const periodStart = new Date(
    subscription.items.data[0].current_period_start * 1000
  );
  const periodEnd = new Date(
    subscription.items.data[0].current_period_end * 1000
  );

  const plan = await getPlanByStripePriceId(priceId);
  if (!plan) {
    throw new Error(`Plan not found for price ID: ${priceId}`);
  }

  await activatePaidSubscription(
    userId,
    planId,
    billingCycle === "monthly" ? BillingCycle.MONTHLY : BillingCycle.YEARLY,
    subscription.customer as string,
    subscription.id,
    priceId,
    periodStart,
    periodEnd
  );

  // Allocate credits
  await resetCredits(
    userId,
    plan?.creditsPerMonth || 0,
    addMonthsPreservingEndOfMonth(periodStart, 1)
  );

  console.log(`✅ Subscription activated for user ${userId}`);
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  event: Stripe.Event
) {
  console.log(
    `✅ Subscription: ${JSON.stringify(subscription)} - date: ${new Date().toLocaleString()}`
  );
  console.log(`✅ Event type: ${event} - date: ${new Date().toLocaleString()}`);
  console.log(
    `✅ Event data: ${event.api_version} - date: ${new Date().toLocaleString()}`
  );
  const userId = subscription.metadata?.userId;
  const planId = subscription.metadata?.planId;
  const billingCycle =
    subscription.items.data[0]?.plan?.interval === "month"
      ? BillingCycle.MONTHLY
      : BillingCycle.YEARLY;
  const priceId = subscription.items.data[0]?.price?.id;

  if (!priceId) {
    console.error("Price ID not found in subscription");
    return;
  }

  const plan = await getPlanByStripePriceId(priceId);
  if (!plan) {
    throw new Error(`Plan not found for price ID: ${priceId}`);
  }

  // Update subscription details
  const periodStart = new Date(
    subscription.items.data[0].current_period_start * 1000
  );
  const periodEnd = new Date(
    subscription.items.data[0].current_period_end * 1000
  );
  const cancelAt = new Date(subscription.cancel_at || 0 * 1000);

  console.log(
    `✅ Period start: ${periodStart} - date: ${new Date().toLocaleString()}`
  );
  console.log(
    `✅ Period end: ${periodEnd} - date: ${new Date().toLocaleString()}`
  );
  console.log(
    `✅ Cancel at: ${cancelAt} - date: ${new Date().toLocaleString()}`
  );
  console.log(
    `✅ Subscription status: ${subscription.status} - date: ${new Date().toLocaleString()}`
  );
  console.log(
    `✅ Subscription cancel at period end: ${subscription.cancel_at_period_end} - date: ${new Date().toLocaleString()}  `
  );
  console.log(
    `✅ Subscription cancellation details reason: ${subscription.cancellation_details?.reason} - date: ${new Date().toLocaleString()}`
  );

  // If subscription is cancelled by the user, update the subscription status to Active and cancelAtPeriodEnd to true - meaning subscription will be cancelled at the end of the current billing period
  if (
    subscription.items?.data[0]?.current_period_end ===
      subscription.cancel_at &&
    subscription.cancellation_details?.reason === "cancellation_requested"
  ) {
    await updateSubscription(userId, {
      status: SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: true,
    });
    console.log(
      `✅ Subscription reactivated for user ${userId} - date: ${new Date().toLocaleString()}`
    );
    return;
  }

  const previousAttributes = event.data
    .previous_attributes as Stripe.Subscription;

  console.log(
    `✅ Previous attributes: ${JSON.stringify(previousAttributes)} - date: ${new Date().toLocaleString()}`
  );

  // if a cancelled plan is reactivated, update the subscription details
  const isPlanReactivated =
    previousAttributes?.cancel_at ===
      subscription.items.data[0].current_period_end &&
    subscription.cancel_at === null;

  if (isPlanReactivated) {
    await updateSubscription(userId, {
      status: SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: false,
    });
    console.log(
      `✅ Plan reactivated for user ${userId} - date: ${new Date().toLocaleString()}`
    );
    return;
  }

  // If the plan has changed, update the subscription details
  const isPlanChanged =
    previousAttributes?.items?.data[0]?.price?.id !== priceId;
  if (isPlanChanged) {
    //get new plan details
    const newPlan = await getPlanByStripePriceId(priceId);
    if (!newPlan) {
      console.error("New plan not found for price ID:", priceId);
      return;
    }
    await updateSubscription(userId, {
      planId: newPlan.id,
      billingCycle: billingCycle,
      status: SubscriptionStatus.ACTIVE,
    });
    console.log(
      `✅ Plan changed to ${planId} for user ${userId} - date: ${new Date().toLocaleString()}`
    );

    await resetCredits(
      userId,
      newPlan?.creditsPerMonth || 0,
      addMonthsPreservingEndOfMonth(periodStart, 1)
    );

    console.log(
      `✅ Credits reset for user ${userId} - date: ${new Date().toLocaleString()}`
    );
    return;
  }

  // Update the subscription details
  await updateSubscription(userId, {
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    status:
      subscription.status === "active"
        ? SubscriptionStatus.ACTIVE
        : subscription.status === "past_due"
          ? SubscriptionStatus.PAST_DUE
          : subscription.status === "canceled"
            ? SubscriptionStatus.CANCELED
            : SubscriptionStatus.INACTIVE,
  });

  console.log(`✅ Subscription updated for user ${userId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionDetail = await getSubscriptionByStripeId(subscription.id);
  if (!subscriptionDetail) {
    console.error("Subscription not found:", subscription.id);
    return;
  }

  // Get the cancellation date from Stripe subscription
  //Timestamp when the cancellation was requested/initiated

  const canceledAt = subscription.canceled_at
    ? new Date(subscription.canceled_at * 1000)
    : new Date();

  // Get the period end date (when subscription actually ended)
  //Timestamp when the subscription actually stopped providing service
  const endedAt = subscription.ended_at
    ? new Date(subscription.ended_at * 1000)
    : null; // or undefined

  if (endedAt) {
    console.log(`Subscription ended on ${endedAt}`);
  }

  console.log(`📅 Subscription canceled at: ${canceledAt.toISOString()}`);
  console.log(`📅 Subscription ended at: ${endedAt?.toISOString()}`);

  // Mark as canceled and update period end to show when it actually ended
  await updateSubscription(subscriptionDetail.userId, {
    status: SubscriptionStatus.CANCELED,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: endedAt || undefined, // Update to show when subscription actually ended
  });

  console.log(
    `✅ Subscription canceled for user ${subscriptionDetail.userId} - ended at ${endedAt?.toISOString()}`
  );
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(invoice);
  // Validate invoice has subscription details
  if (!invoice.parent || invoice.parent.type !== "subscription_details") {
    console.log("Not a subscription invoice, skipping.");
    return;
  }

  const subscriptionId = invoice.parent.subscription_details?.subscription;
  if (!subscriptionId) {
    console.error("Missing subscription ID in invoice:", invoice.id);
    return;
  }

  // Verify invoice was actually paid
  if (invoice.status !== "paid") {
    console.log(`Invoice ${invoice.id} status is ${invoice.status}, not paid`);
    return;
  }

  // Get subscription from database
  const subscription = await getSubscriptionByStripeId(
    subscriptionId.toString()
  );
  if (!subscription) {
    console.error(
      "Subscription not found in database for Stripe ID:",
      subscriptionId
    );
    return;
  }

  // Get Stripe subscription for period dates and price info
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscriptionId.toString()
  );

  // Get the current price ID
  const priceId = stripeSubscription.items.data[0]?.price.id;
  if (!priceId) {
    console.error("No price ID found in subscription:", subscriptionId);
    return;
  }

  const plan = await getPlanByStripePriceId(priceId || "");

  if (!plan) {
    console.error("Plan not found for price ID:", priceId);
    return;
  }

  // Reset credits for new billing period
  const periodStart = new Date(
    stripeSubscription.items.data[0].current_period_start * 1000
  );
  const periodEnd = new Date(
    stripeSubscription.items.data[0].current_period_end * 1000
  );

  try {
    // Reset credits for new billing period
    // Allowed credits value based on plan is used to reset both creditsRemaining and creditsAllocated
    await resetCredits(
      subscription.userId,
      plan.creditsPerMonth,
      addMonthsPreservingEndOfMonth(periodStart, 1)
    );

    // Update subscription with new billing period and status
    await updateSubscription(subscription.userId, {
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      status: SubscriptionStatus.ACTIVE,
    });

    console.log(`✅ Invoice ${invoice.id} payment processed successfully`);
    console.log(`   - User: ${subscription.userId}`);
    console.log(`   - Credits reset: ${plan.creditsPerMonth}`);
    console.log(
      `   - Period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`
    );
  } catch (error) {
    console.error(
      `Failed to process invoice payment for ${invoice.id}:`,
      error
    );
    throw error; // Re-throw so webhook handler knows it failed
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Validate invoice has subscription details (mirror of payment_succeeded)
  if (!invoice.parent || invoice.parent.type !== "subscription_details") {
    console.log("Not a subscription invoice (failed), skipping.");
    return;
  }

  const subscriptionId = invoice.parent.subscription_details?.subscription;
  if (!subscriptionId) {
    console.error("Missing subscription ID in failed invoice:", invoice.id);
    return;
  }

  const subscription = await getSubscriptionByStripeId(
    subscriptionId.toString()
  );
  if (!subscription) {
    console.error(
      "Subscription not found in database for Stripe ID (failed):",
      subscriptionId
    );
    return;
  }

  await updateSubscription(subscription.userId, {
    status: SubscriptionStatus.PAST_DUE,
  });

  console.log(
    `⚠️ Invoice ${invoice.id} payment failed. Marked user ${subscription.userId} as PAST_DUE`
  );
}
