import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  deductCredits,
  checkCredits,
} from "@/lib/server/services/credits.service";
import { canAccessFeature } from "@/lib/server/services/subscription.service";
import { getUserByClerkId } from "@/lib/server/services/user.service";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { amount, reason, metadata } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    // Check if user can access features
    const accessCheck = await canAccessFeature(user.id);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          error: "Access denied",
          reason: accessCheck.reason,
        },
        { status: 403 }
      );
    }

    // Check if user has sufficient credits
    const creditCheck = await checkCredits(user.id, amount);
    if (!creditCheck.sufficient) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          remaining: creditCheck.remaining,
          required: amount,
        },
        { status: 400 }
      );
    }

    // Deduct credits
    const result = await deductCredits(user.id, amount, reason, metadata);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to deduct credits" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      creditsRemaining: result.newBalance,
      creditsAllocated: creditCheck.allocated,
    });
  } catch (error) {
    console.error("Error deducting credits:", error);
    return NextResponse.json(
      { error: "Failed to deduct credits" },
      { status: 500 }
    );
  }
}
