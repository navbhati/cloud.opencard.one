import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import {
  getUserByClerkId,
  syncUserWithClerk,
} from "@/lib/server/services/user.service";

export async function POST(request: NextRequest) {
  try {
    // Extract the authenticated user's ID from the Clerk auth object on the incoming request.
    // This ID is only available if the user is currently authenticated.
    const { userId: authenticatedUserId } = getAuth(request);

    // If there is no authenticated user, deny access with a 401 Unauthorized error.
    if (!authenticatedUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the incoming JSON body to extract the userId the client wants to sync
    const body = await request.json();
    const { userId, email, name, referralCode } = body;

    // Compare the requested userId to the authenticated user.
    // Prevents users from syncing data for anyone except themselves.
    if (userId !== authenticatedUserId) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 401 });
    }

    // Get the user from the database based on the Clerk ID.
    const existingUser = await getUserByClerkId(userId);
    if (existingUser) {
      // User already exists in the local database.
      return NextResponse.json({ localUserId: existingUser.id });
    }

    // User does not exist in the local database.
    // Attempt to sync the user with Clerk and local database.
    // This ensures that the user is both present locally and (depending on implementation) matches Clerk state.
    const metadata = {
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    };

    const user = await syncUserWithClerk(
      userId,
      email,
      name,
      referralCode,
      metadata
    );
    return NextResponse.json({ localUserId: user.id });
  } catch (error: unknown) {
    // Log error for debugging. Expose a generic error to client.
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}
