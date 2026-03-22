import { del, type PutBlobResult } from "@vercel/blob";
import prisma from "@/config/db/prisma";
import { BlobCategory, BlobVisibility, Prisma } from "@prisma/client";
import {
  BlobMetadata,
  BlobListOptions,
  BlobListResponse,
  ExtendedPutBlobResult,
} from "@/types/blob";
import CacheService, { CacheKeys } from "@/lib/server/cache/cache.service";
import { getUserByClerkId } from "./user.service";


//this is use both for server side and client side uploads
export async function createBlobDatabaseRecord(
  clerkUserId: string,
  filename: string, // Original filename
  blob: PutBlobResult | ExtendedPutBlobResult,
  options: {
    category: BlobCategory;
    visibility?: BlobVisibility;
    folder?: string;
    metadata?: Record<string, unknown>;
    tags?: string[];
    expiresAt?: Date;
    addRandomSuffix?: boolean;
    allowOverwrite?: boolean;
  }
): Promise<BlobMetadata> {
  try {
    const extendedBlob = blob as ExtendedPutBlobResult;

    // Get the database user ID from Clerk ID
    const user = await getUserByClerkId(clerkUserId);

    if (!user) {
      throw new Error("User not found in database");
    }
    const userId = user.id;

    // Create database record
    const dbBlob = await prisma.blob.create({
      data: {
        userId,
        url: extendedBlob.url,
        downloadUrl: extendedBlob.downloadUrl,
        pathname: extendedBlob.pathname,
        filename: filename,
        contentType: extendedBlob.contentType || "application/octet-stream",
        size: extendedBlob.size || 0,
        category: options.category,
        visibility: options.visibility ?? BlobVisibility.PRIVATE,
        folder: options.folder,
        metadata: options.metadata
          ? (options.metadata as Prisma.InputJsonValue)
          : undefined,
        tags: options.tags ?? [],
        expiresAt: options.expiresAt,
      },
    });

    // Invalidate user blobs cache
    await CacheService.invalidate([CacheKeys.UserBlobs(userId)]);

    return {
      id: dbBlob.id,
      url: dbBlob.url,
      downloadUrl: dbBlob.downloadUrl,
      pathname: dbBlob.pathname,
      filename: dbBlob.filename,
      contentType: dbBlob.contentType,
      size: dbBlob.size,
      category: dbBlob.category,
      visibility: dbBlob.visibility,
      folder: dbBlob.folder ?? undefined,
      metadata: dbBlob.metadata as Record<string, unknown> | undefined,
      tags: dbBlob.tags,
      expiresAt: dbBlob.expiresAt ?? undefined,
      createdAt: dbBlob.createdAt,
      updatedAt: dbBlob.updatedAt,
    };
  } catch (error) {
    console.error("Error creating blob database record:", error);
    // If database record fails, we should ideally delete the uploaded blob
    // But we'll leave it for now and let cleanup handle it
    throw new Error(
      error instanceof Error
        ? `Database error: ${error.message}`
        : "Failed to create blob database record"
    );
  }
}

/**
 * Get blob metadata by ID
 */
export async function getBlobById(
  blobId: string,
  userId?: string
): Promise<BlobMetadata | null> {
  try {
    const where: Prisma.BlobWhereInput = { id: blobId };
    if (userId) {
      where.userId = userId;
    }

    const blob = await prisma.blob.findFirst({
      where,
    });

    if (!blob) return null;

    return {
      id: blob.id,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      filename: blob.filename,
      contentType: blob.contentType,
      size: blob.size,
      category: blob.category,
      visibility: blob.visibility,
      folder: blob.folder ?? undefined,
      metadata: blob.metadata as Record<string, unknown> | undefined,
      tags: blob.tags,
      expiresAt: blob.expiresAt ?? undefined,
      createdAt: blob.createdAt,
      updatedAt: blob.updatedAt,
    };
  } catch (error) {
    console.error("Error getting blob:", error);
    return null;
  }
}

/**
 * List user's blobs with filtering and pagination
 */
export async function listUserBlobs(
  userId: string,
  options: BlobListOptions = {}
): Promise<BlobListResponse> {
  try {
    const {
      category,
      visibility,
      search,
      tags,
      limit = 20,
      offset = 0,
      orderBy = "createdAt",
      orderDirection = "desc",
    } = options;

    const where: Prisma.BlobWhereInput = {
      userId,
    };

    if (category) {
      where.category = category;
    }

    if (visibility) {
      where.visibility = visibility;
    }

    if (search) {
      where.filename = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    const [blobs, total] = await Promise.all([
      prisma.blob.findMany({
        where,
        orderBy: {
          [orderBy]: orderDirection,
        },
        take: limit,
        skip: offset,
      }),
      prisma.blob.count({ where }),
    ]);

    return {
      blobs: blobs.map((blob) => ({
        id: blob.id,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        pathname: blob.pathname,
        filename: blob.filename,
        contentType: blob.contentType,
        size: blob.size,
        category: blob.category,
        visibility: blob.visibility,
        folder: blob.folder ?? undefined,
        metadata: blob.metadata as Record<string, unknown> | undefined,
        tags: blob.tags,
        expiresAt: blob.expiresAt ?? undefined,
        createdAt: blob.createdAt,
        updatedAt: blob.updatedAt,
      })),
      total,
      hasMore: offset + blobs.length < total,
    };
  } catch (error) {
    console.error("Error listing user blobs:", error);
    throw new Error("Failed to list files");
  }
}

/**
 * Delete a blob from storage and database
 */
export async function deleteBlob(
  blobId: string,
  userId: string
): Promise<boolean> {
  try {
    // Get blob info first
    const blob = await prisma.blob.findFirst({
      where: {
        id: blobId,
        userId,
      },
    });

    if (!blob) {
      throw new Error("Blob not found or access denied");
    }

    // Delete from Vercel Blob
    await del(blob.url);

    // Delete from database
    await prisma.blob.delete({
      where: { id: blobId },
    });

    // Clear cache
    await CacheService.invalidate([CacheKeys.UserBlobs(userId)]);

    return true;
  } catch (error) {
    console.error("Error deleting blob:", error);
    throw new Error("Failed to delete file");
  }
}

/**
 * Clean up expired temporary blobs
 */
export async function cleanupExpiredBlobs(): Promise<number> {
  try {
    const now = new Date();

    // Find expired blobs
    const expiredBlobs = await prisma.blob.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });

    let deletedCount = 0;

    for (const blob of expiredBlobs) {
      try {
        // Delete from Vercel Blob
        await del(blob.url);

        // Delete from database
        await prisma.blob.delete({
          where: { id: blob.id },
        });

        deletedCount++;
      } catch (error) {
        console.error(`Error cleaning up blob ${blob.id}:`, error);
      }
    }

    return deletedCount;
  } catch (error) {
    console.error("Error cleaning up expired blobs:", error);
    return 0;
  }
}
