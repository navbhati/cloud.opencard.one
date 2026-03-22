// server-side upload handler for Vercel Blob

import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { BlobCategory, BlobVisibility } from "@prisma/client";
import { createBlobDatabaseRecord } from "@/lib/server/services/blob.service";
import { ExtendedPutBlobResult } from "@/types/blob";

export async function POST(request: Request): Promise<NextResponse> {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get filename and category from query parameters
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename") || "";
  const category = searchParams.get("category") as BlobCategory | null;
  const size = parseInt(searchParams.get("size") || "0");

  // Check if request body is valid
  if (!request.body) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Validate category
  if (!category) {
    return NextResponse.json(
      { error: "Category is required" },
      { status: 400 }
    );
  }

  try {
    // Upload to Vercel Blob
    const uploadedBlob = await put(
      `users/${clerkUserId}/${category}/${filename}`,
      request.body,
      {
        access: "public",
        multipart: true,
        addRandomSuffix: true,
      }
    );

    // Cast to ExtendedPutBlobResult to access size property
    const extendedBlob = uploadedBlob as ExtendedPutBlobResult;
    extendedBlob.size = size;

    // Create database record with database user ID (not Clerk ID)
    const dbRecord = await createBlobDatabaseRecord(
      clerkUserId,
      filename,
      extendedBlob,
      {
        category: category,
        visibility: BlobVisibility.PUBLIC,
        folder: `users/${clerkUserId}/${category}`,
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalFilename: filename,
          clerkUserId: clerkUserId, // Store Clerk ID in metadata for reference
          size: size,
        },
        tags: [category],
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
      }
    );

    // Return the uploaded blob result (matches Vercel Blob's PutBlobResult interface)
    return NextResponse.json({
      url: extendedBlob.url,
      downloadUrl: extendedBlob.downloadUrl,
      pathname: extendedBlob.pathname,
      contentType: extendedBlob.contentType,
      size: extendedBlob.size || 0,
      blobId: dbRecord.id, // Include database ID for reference
    });
  } catch (error) {
    console.error("Server upload failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
