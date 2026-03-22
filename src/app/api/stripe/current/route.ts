import { NextResponse } from "next/server";
import { getUserSubscription } from "@/lib/server/services/subscription.service";
import { getUserByClerkId } from "@/lib/server/services/user.service";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscription = await getUserSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Error getting user subscription:", error);
    return NextResponse.json(
      { error: "Failed to get user subscription" },
      { status: 500 }
    );
  }
}
