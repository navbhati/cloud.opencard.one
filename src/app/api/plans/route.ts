import { NextResponse } from "next/server";
import { getAllPlans } from "@/lib/server/services/plans.service";

export async function GET() {
  try {
    const plans = await getAllPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
