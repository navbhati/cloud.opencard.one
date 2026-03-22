// Import and re-export Prisma enums to maintain type consistency
import { BlobCategory, BlobVisibility } from "@prisma/client";
export { BlobCategory, BlobVisibility };

// Extended PutBlobResult that includes size property (may not be in type definition but exists at runtime)
export interface ExtendedPutBlobResult {
  url: string;
  downloadUrl: string;
  pathname: string;
  contentType: string;
  size?: number;
}

export interface BlobUploadOptions {
  category: BlobCategory;
  visibility: BlobVisibility;
  filename: string;
  file: File;
}

export interface BlobUploadResponse {
  url: string;
  downloadUrl: string;
  pathname: string;
  filename: string;
  contentType: string;
  size: number;
  category: BlobCategory;
  visibility: BlobVisibility;
  folder?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlobMetadata {
  id: string;
  url: string;
  downloadUrl: string;
  pathname: string;
  filename: string;
  contentType: string;
  size: number;
  category?: BlobCategory;
  visibility?: BlobVisibility;
  folder?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BlobListOptions {
  category?: BlobCategory;
  visibility?: BlobVisibility;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  orderBy?: "createdAt" | "updatedAt" | "size" | "filename";
  orderDirection?: "asc" | "desc";
}

export interface BlobListResponse {
  blobs: BlobMetadata[];
  total: number;
  hasMore: boolean;
}
