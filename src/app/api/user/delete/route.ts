import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import {
  getUserByClerkId,
  deleteUser,
} from "@/lib/server/services/user.service";
import { cancelSubscription } from "@/lib/server/services/subscription.service";
import clerkClient from "@/config/auth/clerkClient";

export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up user in database
    const user = await getUserByClerkId(clerkId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cancel Stripe subscription if exists
    try {
      await cancelSubscription(user.id, true);
    } catch {
      // User may not have an active subscription — continue
    }

    // Delete user from database (cascade handles related records)
    await deleteUser(user.id, clerkId);

    // Delete user from Clerk
    await clerkClient.users.deleteUser(clerkId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
