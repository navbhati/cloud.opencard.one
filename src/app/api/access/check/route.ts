/**
 * API endpoint for access control checks
 *
 * This endpoint allows client-side components to check access without
 * exposing sensitive user data or subscription details.
 */

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/server/services/user.service";
import {
  checkAccess,
  canAccessFeature,
  hasSufficientCredits,
  canPerformActions,
} from "@/lib/server/services/access-control.service";
import { FeatureId } from "@/lib/access-control/features";

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      featureId,
      requiredCredits,
      checkType = "full", // "full" | "feature" | "credits" | "actions"
    } = body;

    let result;

    switch (checkType) {
      case "feature":
        if (!featureId) {
          return NextResponse.json(
            { error: "featureId is required for feature check" },
            { status: 400 }
          );
        }
        result = await canAccessFeature(
          user.id,
          featureId as FeatureId,
          requiredCredits
        );
        break;

      case "credits":
        if (requiredCredits === undefined) {
          return NextResponse.json(
            { error: "requiredCredits is required for credits check" },
            { status: 400 }
          );
        }
        result = await hasSufficientCredits(user.id, requiredCredits);
        break;

      case "actions":
        const canPerform = await canPerformActions(user.id);
        result = {
          allowed: canPerform,
          currentTier: (await checkAccess(user.id)).currentTier,
        };
        break;

      case "full":
      default:
        result = await checkAccess(user.id, {
          featureId: featureId as FeatureId | undefined,
          requiredCredits,
          allowViewOnly: false,
        });
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking access:", error);
    return NextResponse.json(
      { error: "Failed to check access" },
      { status: 500 }
    );
  }
}
