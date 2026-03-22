import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getReferralStats } from "@/lib/server/services/referral.service";

export async function GET() {
  try {
    console.log("Stats API called");
    const { userId } = await auth();
    console.log("User ID from auth:", userId);

    if (!userId) {
      console.log("No user ID, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Getting referral stats for user:", userId);
    const stats = await getReferralStats(userId);
    console.log("Stats retrieved:", stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error getting referral stats:", error);
    return NextResponse.json(
      { error: "Failed to get referral stats" },
      { status: 500 }
    );
  }
}
