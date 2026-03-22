# Vercel Blob Implementation Guide

## Overview

This application implements Vercel Blob storage for file uploads with two methods: **server-side** (max 4.5MB) and **client-side** (max 50MB). All uploads are tracked in PostgreSQL with metadata, categories, and automatic cache invalidation.

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  API Routes  │────▶│   Vercel    │
│  Component  │     │              │     │    Blob     │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Postgres   │
                    │   (Metadata) │
                    └──────────────┘
```

---

## Database Schema

### Blob Model
```prisma
model Blob {
  id          String         @id @default(uuid())
  userId      String
  url         String         // Full blob URL
  downloadUrl String         // Download URL with ?download=1
  pathname    String         @unique
  filename    String         // Original filename
  contentType String         // MIME type
  size        Int            // Size in bytes
  category    BlobCategory   @default(UPLOAD)
  visibility  BlobVisibility @default(PRIVATE)
  folder      String?        // Subfolder path
  metadata    Json?          // Custom metadata
  tags        String[]       @default([])
  expiresAt   DateTime?      // For temporary files
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}
```

### Enums
```typescript
enum BlobCategory {
  UPLOAD, TEMPLATE, EXPORT, DESIGN, ASSET, TEMP
}

enum BlobVisibility {
  PRIVATE, PUBLIC, SHARED
}
```

---

## Upload Methods

### 1. Server-Side Upload (≤ 4.5MB)

**Route:** `POST /api/blob/upload/server`

**How it works:**
1. Client sends file as request body
2. Server uploads directly to Vercel Blob
3. Database record created synchronously
4. Response includes blob URL and metadata

**Usage:**
```typescript
const response = await fetch(
  `/api/blob/upload/server?filename=${encodeURIComponent(file.name)}&category=${category}&size=${file.size}`,
  {
    method: "POST",
    body: file,
  }
);
const result = await response.json();
// { url, downloadUrl, pathname, contentType, size, blobId }
```

**Pros:** Simple, synchronous
**Cons:** 4.5MB limit, blocks until upload completes

---

### 2. Client-Side Upload (≤ 50MB)

**Route:** `POST /api/blob/upload/client`

**How it works:**
1. Client requests upload token from server
2. Client uploads directly to Vercel Blob (multipart)
3. Vercel calls webhook on completion
4. Webhook creates database record asynchronously

**Usage:**
```typescript
import { upload } from "@vercel/blob/client";

const blob = await upload(pathname, file, {
  access: "public",
  multipart: true,
  handleUploadUrl: "/api/blob/upload/client",
  clientPayload: JSON.stringify({
    size: file.size,
    originalFilename: file.name,
    category: BlobCategory.TEMP,
    visibility: BlobVisibility.PUBLIC,
  }),
});
```

**Webhook:** `POST /api/blob/upload/client/webhook`
- Called by Vercel after upload completes
- Creates database record from `tokenPayload`
- **Local dev:** Requires ngrok (set `NGROK_URL` env var)

**Pros:** 50MB limit, doesn't block server, multipart uploads
**Cons:** Async database record creation, requires webhook setup

---

## API Routes

### List Blobs
```
GET /api/blob/list
Query: category, visibility, search, tags, limit, offset, orderBy, orderDirection
Response: { success, data: { blobs[], total, hasMore } }
```

### Get Single Blob
```
GET /api/blob/[id]
Response: { success, data: BlobMetadata }
```

### Delete Blob
```
DELETE /api/blob/[id]
Response: { success, message }
```

---

## Service Functions

Located in `src/lib/server/services/blob.service.ts`:

### `createBlobDatabaseRecord(clerkUserId, filename, blob, options)`
Creates database record for uploaded blob. Used by both upload methods.

**Options:**
```typescript
{
  category: BlobCategory;
  visibility?: BlobVisibility;
  folder?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  expiresAt?: Date;
}
```

### `listUserBlobs(userId, options)`
Lists user's blobs with filtering, search, and pagination. Results are cached in Redis.

### `getBlobById(blobId, userId?)`
Gets single blob metadata by ID. Optional user ID for authorization.

### `deleteBlob(blobId, userId)`
Deletes blob from Vercel Blob storage and database. Invalidates cache.

### `cleanupExpiredBlobs()`
Deletes blobs with `expiresAt` in the past. Run via cron job.

---

## Frontend Implementation

### Example Page
`src/app/(dashboard)/examples/blob/page.tsx`

Demonstrates both upload methods side-by-side with:
- File selection and validation
- Upload progress (client-side)
- Success/error toasts
- Download functionality
- Clear/reset state

### Blob List Component
`src/app/(dashboard)/examples/blob/components/blob-list.tsx`

Displays all user blobs in a data table with:
- Filename, size, category, visibility
- Created/updated timestamps
- Download and delete actions
- Real-time list updates after deletion

### Data Table
`src/app/(dashboard)/examples/blob/components/blob-data-table.tsx`

Implements TanStack Table with:
- Sorting by any column
- Checkbox selection
- Responsive design

---

## Quick Start

### 1. Environment Setup
```bash
# Required
BLOB_READ_WRITE_TOKEN=vercel_blob_token_from_dashboard

# For client-side upload webhook in local dev
NGROK_URL=https://your-ngrok-url.ngrok.io
```

### 2. Run Migration
```bash
npx prisma migrate deploy
```

### 3. Test Upload
Navigate to `/examples/blob` to test both upload methods.

### 4. Implement in Your Feature

**Server-side example:**
```typescript
const response = await fetch(
  `/api/blob/upload/server?filename=${file.name}&category=DESIGN&size=${file.size}`,
  { method: "POST", body: file }
);
const { url, blobId } = await response.json();
```

**Client-side example:**
```typescript
import { upload } from "@vercel/blob/client";

const blob = await upload(`designs/${userId}/${filename}`, file, {
  access: "public",
  handleUploadUrl: "/api/blob/upload/client",
  clientPayload: JSON.stringify({
    category: "DESIGN",
    visibility: "PRIVATE",
    size: file.size,
    originalFilename: file.name,
  }),
});
```

---

## Important Notes

### File Size Limits
- **Server-side:** 4.5MB (Vercel Edge Function limit)
- **Client-side:** 50MB (Vercel Blob default, configurable up to 5GB)

### Caching
- User blob lists are cached in Redis with key: `user:${userId}:blobs`
- Cache invalidated on create/delete operations
- TTL: 1 hour (default)

### Security
- All routes require Clerk authentication
- Blob access filtered by `userId`
- Delete operations validate ownership

### Storage Organization
Files are stored with path pattern:
```
users/{clerkUserId}/{category}/{filename}-{randomSuffix}
```

### Cleanup
Expired blobs (with `expiresAt` set) should be cleaned up periodically:
```typescript
import { cleanupExpiredBlobs } from "@/lib/server/services/blob.service";
await cleanupExpiredBlobs(); // Returns count of deleted blobs
```

Recommended: Run via cron job (e.g., Vercel Cron, GitHub Actions)

### Webhook for Local Development
Client-side uploads require webhook callback. For local testing:
1. Install ngrok: `npm install -g ngrok`
2. Start ngrok: `ngrok http 3000`
3. Set `NGROK_URL` in `.env.local`
4. Restart dev server

---

## File Reference

### Core Files
- **Service:** `src/lib/server/services/blob.service.ts`
- **Types:** `src/types/blob.ts`
- **Schema:** `prisma/schema.prisma` (Blob model)

### API Routes
- **Server Upload:** `src/app/api/blob/upload/server/route.ts`
- **Client Token:** `src/app/api/blob/upload/client/route.ts`
- **Client Webhook:** `src/app/api/blob/upload/client/webhook/route.ts`
- **List:** `src/app/api/blob/list/route.ts`
- **Get/Delete:** `src/app/api/blob/[id]/route.ts`

### Frontend
- **Example Page:** `src/app/(dashboard)/examples/blob/page.tsx`
- **Blob List:** `src/app/(dashboard)/examples/blob/components/blob-list.tsx`
- **Data Table:** `src/app/(dashboard)/examples/blob/components/blob-data-table.tsx`
- **Table Columns:** `src/app/(dashboard)/examples/blob/components/blob-table-columns.tsx`

---

## Troubleshooting

### Client-side upload completes but no database record
- Check webhook is being called (logs in server)
- Verify `NGROK_URL` is set correctly in local dev
- Ensure `callbackUrl` is accessible from Vercel

### "Unauthorized" errors
- Verify Clerk authentication is working
- Check `auth()` returns valid `userId`
- Ensure user exists in database

### Files not appearing in list
- Check cache invalidation is working
- Verify `userId` matches between upload and list
- Look for database record creation errors in logs

### Upload fails with size limit error
- Server-side: Use client-side for files > 4.5MB
- Client-side: Files must be ≤ 50MB (or your configured limit)
