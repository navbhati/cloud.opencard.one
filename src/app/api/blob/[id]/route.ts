import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "@/lib/server/services/user.service";
import { getBlobById, deleteBlob } from "@/lib/server/services/blob.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, context: RouteParams) {
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

    const params = await context.params;
    const blob = await getBlobById(params.id, user.id);

    if (!blob) {
      return NextResponse.json({ error: "Blob not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: blob,
    });
  } catch (error) {
    console.error("Error getting blob:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get file",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteParams) {
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

    const params = await context.params;
    const success = await deleteBlob(params.id, user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blob:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete file",
      },
      { status: 500 }
    );
  }
}
