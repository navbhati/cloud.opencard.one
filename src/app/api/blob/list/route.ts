import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/server/services/user.service";
import { listUserBlobs } from "@/lib/server/services/blob.service";
import { BlobCategory, BlobVisibility } from "@prisma/client";
import { BlobListOptions } from "@/types/blob";

export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as BlobCategory | null;
    const visibility = searchParams.get("visibility") as BlobVisibility | null;
    const search = searchParams.get("search") || undefined;
    const tags =
      searchParams.get("tags")?.split(",").filter(Boolean) || undefined;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const orderBy =
      (searchParams.get("orderBy") as
        | "createdAt"
        | "updatedAt"
        | "filename"
        | "size") || "createdAt";
    const orderDirection =
      (searchParams.get("orderDirection") as "asc" | "desc") || "desc";

    const options: BlobListOptions = {
      category: category || undefined,
      visibility: visibility || undefined,
      search,
      tags,
      limit: Math.min(limit, 100), // Cap at 100
      offset,
      orderBy,
      orderDirection,
    };

    const result = await listUserBlobs(user.id, options);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error listing blobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to list files",
      },
      { status: 500 }
    );
  }
}
