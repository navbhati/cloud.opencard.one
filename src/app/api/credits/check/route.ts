import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getCreditBalance,
  ensureMonthlyCredits,
} from "@/lib/server/services/credits.service";
import { getUserByClerkId } from "@/lib/server/services/user.service";
import { getUserSubscription } from "@/lib/server/services/subscription.service";

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await getUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure monthly credits are issued (ACTIVE + YEARLY only)
    await ensureMonthlyCredits(user.id);
    
    // Get credit balance
    const creditBalance = await getCreditBalance(user.id);
    if (!creditBalance) {
      return NextResponse.json(
        { error: "Credit balance not found" },
        { status: 404 }
      );
    }

    // Get subscription information
    const subscription = await getUserSubscription(user.id);

    // Format response for CreditInfo component
    return NextResponse.json({
      subscription: subscription
        ? {
            planName: subscription.plan?.name || "Free",
            planId: subscription.plan?.id || "free",
            status: subscription.status || "inactive",
          }
        : {
            planName: "Free",
            planId: "free",
            status: "inactive",
          },
      creditsRemaining: creditBalance.creditsRemaining,
      creditsTotal: creditBalance.creditsAllocated,
      creditBalance, // Include full balance for backward compatibility
    });
  } catch (error) {
    console.error("Error checking credits:", error);
    return NextResponse.json(
      { error: "Failed to check credits" },
      { status: 500 }
    );
  }
}
