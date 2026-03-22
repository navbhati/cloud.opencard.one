import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getReferralUrl } from "@/lib/server/services/referral.service";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const referralData = await getReferralUrl(userId);

    return NextResponse.json(referralData);
  } catch (error) {
    console.error("Error getting referral code:", error);
    return NextResponse.json(
      { error: "Failed to get referral code" },
      { status: 500 }
    );
  }
}
