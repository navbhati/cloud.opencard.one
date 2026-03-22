import { NextResponse } from "next/server";
import { createBlobDatabaseRecord } from "@/lib/server/services/blob.service";
import { ExtendedPutBlobResult } from "@/types/blob";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Log the ENTIRE body structure to see what Vercel sends
    console.log("🔥 Full webhook body:", JSON.stringify(body, null, 2));

    // Try different payload structures
    let blob, tokenPayload;

    if (body.type === "blob.upload-completed" && body.payload) {
      // Expected Vercel format
      console.log("📍 Using Vercel format");
      blob = body.payload.blob;
      tokenPayload = body.payload.tokenPayload;
    } else if (body.blob && body.tokenPayload) {
      // Alternative direct format
      console.log("📍 Using direct format");
      blob = body.blob;
      tokenPayload = body.tokenPayload;
    } else {
      // Unknown format - log it and return error
      console.error(
        "❌ Unknown payload structure. Body keys:",
        Object.keys(body)
      );
      console.error("❌ Full body:", body);
      return NextResponse.json(
        { error: "Unknown payload structure", receivedKeys: Object.keys(body) },
        { status: 400 }
      );
    }

    if (!blob) {
      console.error("❌ Blob is undefined after parsing");
      return NextResponse.json(
        { error: "Blob not found in payload" },
        { status: 400 }
      );
    }

    console.log("🔥 Blob:", blob);
    console.log("🔑 Raw tokenPayload:", tokenPayload);

    const payload = JSON.parse(tokenPayload || "{}");
    console.log("🔑 Parsed payload:", payload);

    const clerkUserId = payload.clerkUserId;

    if (!clerkUserId) {
      console.error("❌ No clerkUserId. Payload contents:", payload);
      return NextResponse.json(
        { error: "User ID not found in token payload", payload },
        { status: 400 }
      );
    }

    const extendedBlob = blob as ExtendedPutBlobResult;
    extendedBlob.size = payload.size || 0;

    await createBlobDatabaseRecord(
      clerkUserId,
      payload.originalFilename || "",
      extendedBlob,
      {
        category: payload.category,
        visibility: payload.visibility,
        folder: payload.folder,
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalFilename: payload.originalFilename,
          uploadMethod: "client",
          size: payload.size,
          type: payload.type,
        },
        tags: payload.category ? [payload.category] : [],
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      }
    );

    console.log("✅ Database record created for blob:", blob.pathname);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
