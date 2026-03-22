# Distribution Hub & Social Media Distribution - Implementation

This document describes the complete implementation of the **Distribution Hub** and **social media distribution** features backed by **Late** (GetLate) – covering UI, APIs, data model, timezone handling, and webhook-driven status updates.

It is based on the original plan in `templates/temp.md` and the Late documentation:

- `https://docs.getlate.dev/`
- `https://docs.getlate.dev/guides/connecting-accounts`
- `https://docs.getlate.dev/platforms`
- The full API text spec used during development: `https://docs.getlate.dev/llms-full.txt`

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [User Experience & Entry Points](#2-user-experience--entry-points)
3. [Data Model & Persistence](#3-data-model--persistence)
4. [Timezone Preferences & Formatting](#4-timezone-preferences--formatting)
5. [Late Client & Configuration](#5-late-client--configuration)
6. [Social Account Connection Flow](#6-social-account-connection-flow)
7. [Account Management (LinkedIn Orgs & Facebook Pages)](#7-account-management-linkedin-orgs--facebook-pages)
8. [Media Upload Pipeline](#8-media-upload-pipeline)
9. [Post Creation, Scheduling & Queue Publishing](#9-post-creation-scheduling--queue-publishing)
10. [Calendar, Queues & Next-Slot Preview](#10-calendar-queues--next-slot-preview)
11. [Post Status Updates via Late Webhooks](#11-post-status-updates-via-late-webhooks)
12. [Library Integration: Publish from Generated Content](#12-library-integration-publish-from-generated-content)
13. [Key Files Reference](#13-key-files-reference)
14. [Environment Variables & Setup Checklist](#14-environment-variables--setup-checklist)

---

## 1. High-Level Overview

**Goal:** Provide a unified **Distribution Hub** where users can:

- Connect social accounts (initially **LinkedIn** and **X (Twitter)**, others as “Coming soon”).
- Compose, schedule, and queue posts.
- View calendars, queues, and post history.
- Publish directly from **Library** content.

**Core components:**

- **UI / Pages**
  - Distribution Hub tabbed interface: `src/app/(dashboard)/distribution/page.tsx`
  - Distribution views: `ComposeView`, `CalendarView`, `QueueView`, `PostsView`, `ConnectionsView`, `AnalyticsView`
  - Late-based social connectors UI: `src/components/apps/social-platforms-late/social-platforms.tsx`
  - Account selection screen for headless flows: `src/app/(dashboard)/social/select-account/page.tsx`

- **Late integration**
  - Singleton Node client: `src/lib/late/client.ts`
  - Shared types & platform metadata: `src/lib/late/types.ts`
  - Timezone helpers: `src/lib/late/timezones.ts`
  - Webhook registration helper: `src/lib/late/webhook.ts`

- **APIs**
  - Preferences (timezone): `src/app/api/preferences/route.ts`
  - Social accounts & management:
    - `src/app/api/social/accounts/route.ts`
    - `src/app/api/social/accounts/[id]/route.ts`
    - `src/app/api/social/accounts/[id]/manage/route.ts`
  - OAuth callback & account selection:
    - `src/app/api/social/callback/route.ts`
    - `src/app/api/social/callback/accounts/route.ts`
    - `src/app/api/social/callback/complete/route.ts`
    - `src/app/api/social/connect/[platform]/route.ts`
  - Media presigning: `src/app/api/social/media/route.ts`
  - Posts CRUD: `src/app/api/social/posts/route.ts`, `src/app/api/social/posts/[id]/route.ts`
  - Queues & previews:
    - `src/app/api/social/queues/route.ts`
    - `src/app/api/social/queues/preview/route.ts`
    - `src/app/api/social/queues/next-slot/route.ts`
  - Webhook receiver: `src/app/api/social/webhook/route.ts`

- **Persistence**
  - New social models: `SocialAccount`, `SocialPost`
  - Late profile linkage & timezone preferences on `User` / `Preferences`
  - Prisma schema: `prisma/schema.prisma`

---

## 2. User Experience & Entry Points

### 2.1 Distribution Hub navigation

- **Route:** `/distribution`
- **File:** `src/app/(dashboard)/distribution/page.tsx`
- Uses `PageWithSidebar` with sidebar tabs controlled by `tab` query param:
  - `compose`
  - `calendar`
  - `queue`
  - `posts`
  - `connections`
  - `analytics` (disabled; “Coming soon”)
- URL pattern: `/distribution?tab=<tabId>` – the active tab is derived from `useSearchParams()` and stored in `activeTab` state.
- The main app layout is adjusted (via existing layout/nav files) so that Distribution Hub has focused, template-style sidebar navigation similar to Templates.

### 2.2 Views inside Distribution Hub

- **Compose tab:** `src/components/distribution/compose-view.tsx`
  - Full-screen composer for writing content, attaching media (via creatives or file upload), selecting accounts, and choosing **Publish now / Schedule / Add to Queue**.

- **Calendar tab:** `src/components/distribution/calendar-view.tsx`
  - Month calendar + list view of posts (`SocialPost`).
  - “New Post” button opens `PublishDialog`.
  - Uses timezone-aware display and link back to Library for each post’s source.
  - Includes quick navigation to **Queues** tab.

- **Queue tab:** `src/components/distribution/queue-view.tsx`
  - CRUD for Late queues (recurring time slots).
  - Preview of next 7 slots per queue and global “Next Up” panel.
  - “Posts in Queue” section backed by Late + our `SocialPost` table.

- **Posts tab:** `src/components/distribution/posts-view.tsx`
  - List of all posts, grouped by date, with status badges and per-platform links.
  - “New Post” button opens `PublishDialog`.

- **Connections tab:** `src/components/distribution/connections-view.tsx`
  - Embeds Late-based connectors UI: `SocialPlatformsConnectors`.

- **Analytics tab:** `src/components/distribution/analytics-view.tsx`
  - Presentational placeholder for future analytics.

### 2.3 Library integration entry point

- **Files:**
  - `src/components/content/library-content.tsx`
  - `src/components/content/library/content-preview-card.tsx`
  - `src/components/social/publish-dialog.tsx`

From the Library:

- Each generated content card (`ContentPreviewCard`) has a **“Publish to Social”** action.
- When clicked, it opens `PublishDialog` with:
  - `initialContent` set from the generated content.
  - `sourceContentId` set to the generated content’s ID (used to link back).
  - Optionally pre-attached **creative image** if a generated creative exists for that content.

This means users can:

- Generate content from sources.
- Attach a generated creative (image).
- Publish or schedule directly to Late-managed social accounts.

---

## 3. Data Model & Persistence

**File:** `prisma/schema.prisma`

### 3.1 User & preferences

- `User` gains:
  - `lateProfileId: String?` – Late profile ID used across all social operations.
  - Relations:
    - `socialAccounts: SocialAccount[]`
    - `socialPosts: SocialPost[]`

- `Preferences` model:
  - `timezone: String?` – IANA timezone string used for scheduling and display.
  - Linked to `User` via `userId` (unique).

### 3.2 SocialAccount

```prisma
model SocialAccount {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lateAccountId String   @unique
  platform      String   // "twitter", "linkedin", etc.
  displayName   String?
  username      String?
  avatarUrl     String?
  status        String   @default("active") // "active", "needs_reconnect", "disconnected"
  metadata      Json?
  connectedAt   DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

Purpose:

- Local cache & metadata for Late `accounts.listAccounts` results.
- Enables:
  - Quick listing & filtering per-platform.
  - Management UI (LinkedIn org / Facebook page selection).
  - Status tracking (active / disconnected).

### 3.3 SocialPost

```prisma
model SocialPost {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  latePostId      String?   @unique
  sourceContentId String?
  content         String    @db.Text
  mediaUrls       Json?
  platforms       Json
  status          String    @default("draft") // "draft", "scheduled", "published", "failed", "partial"
  scheduledFor    DateTime?
  publishedAt     DateTime?
  timezone        String?
  lateResponse    Json?
  error           String?   @db.Text
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

Usage:

- Mirrors Late’s post state in our DB, keyed by `latePostId`.
- Stores:
  - Content and attached media URLs.
  - Target platforms & account IDs (JSON array).
  - Local status & timestamps (scheduled/published).
  - Latest Late response payload (`lateResponse`) and any error message.
  - Optional link back to Library (`sourceContentId`).

---

## 4. Timezone Preferences & Formatting

**Files:**

- `src/lib/late/timezones.ts`
- `src/app/api/preferences/route.ts`
- `src/app/(dashboard)/settings/general/page.tsx`
- Distribution views: `compose-view.tsx`, `calendar-view.tsx`, `queue-view.tsx`, `posts-view.tsx`, `publish-dialog.tsx`

### 4.1 Helpers

`src/lib/late/timezones.ts` provides:

- `COMMON_TIMEZONES` – curated list of commonly used IANA timezones.
- `getUserTimezone()` – browser-detected timezone (fallback/default).
- `isValidTimezone(tz: string)` – validation helper.
- `getTimezoneOptions(...additional)` – merges `COMMON_TIMEZONES`, browser timezone, and any additional valid timezones into a sorted list.
- `formatTimezoneDisplay(tz)` – human-friendly label like `"America/New_York (EST)"`.
- `formatInTimezone(isoString, formatStr, timezone)` – date-fns-tz-based formatting utility used throughout the UI for displaying times in the user’s timezone.

### 4.2 Preferences API

`src/app/api/preferences/route.ts`:

- `GET`:
  - Auth via Clerk.
  - Resolves user via `getUserByClerkId`.
  - Returns `preferences` row (or `null`).

- `PATCH`:
  - Auth via Clerk.
  - `body.timezone` is upserted to `Preferences`:
    - Creates `Preferences` row for user on first write.
    - Updates `timezone` on subsequent writes.

### 4.3 Settings UI

`src/app/(dashboard)/settings/general/page.tsx`:

- Fetches `/api/preferences` on mount.
- Fallback to `getUserTimezone()` when preferences are absent or request fails.
- Uses a searchable combobox (`Command` + `Popover`) over `getTimezoneOptions(...)`.
- Displays **“Browser detected: …”** hint.
- “Save” persists the chosen timezone via `PATCH /api/preferences`.

### 4.4 Consumption in Distribution views

- **ComposeView / PublishDialog:**
  - Load `timezone` from `/api/preferences` else `getUserTimezone()`.
  - For scheduled posts, we store `scheduledFor` (ISO) and `timezone` in DB / Late.

- **CalendarView / PostsView / QueueView:**
  - Fetch timezone from `/api/preferences`.
  - Use `formatInTimezone` for:
    - Per-post times (e.g. `"MMM d · h:mm a"`).
    - Next queue slots.
    - “Next Up” lists.

This ensures scheduling and display are always aligned to a **user-configurable** timezone, fulfilling the requirement in `templates/temp.md`.

---

## 5. Late Client & Configuration

**Files:**

- `src/lib/late/client.ts`
- `src/lib/late/index.ts`
- `src/lib/late/types.ts`
- `src/lib/late/webhook.ts`

### 5.1 Client singleton

`src/lib/late/client.ts`:

- Wraps `@getlatedev/node` as a server-side singleton:

```ts
import Late from "@getlatedev/node";

let serverClient: Late | null = null;

export function getLateClient(): Late {
  if (!serverClient) {
    const apiKey = process.env.LATE_API_KEY;
    if (!apiKey) throw new Error("LATE_API_KEY environment variable is not set");
    serverClient = new Late({ apiKey });
  }
  return serverClient;
}
```

### 5.2 Re-exports & platform metadata

`src/lib/late/index.ts`:

- Re-exports:
  - `getLateClient`
  - all types & timezone helpers.

`src/lib/late/types.ts`:

- Declares:
  - `SOCIAL_PLATFORMS` (superset of supported platforms).
  - `ENABLED_PLATFORMS` – currently: `["linkedin", "twitter"]`.
  - `PLATFORM_DISPLAY_NAMES`, `PLATFORM_COLORS`, `PLATFORM_CHAR_LIMITS` per platform.
  - `LateAccount`, `LatePost`, `CreatePostInput` interfaces.

These are used heavily in UI:

- `SocialPlatformsConnectors` for labeling and gating platforms.
- `ComposeView` / `PublishDialog` to compute per-platform character limits.

### 5.3 Webhook registration helper

`src/lib/late/webhook.ts`:

- `registerWebhook(baseUrl: string)`:
  - Asserts `LATE_WEBHOOK_SECRET` is set.
  - Registers a webhook with Late for:
    - `post.published`
    - `post.failed`
    - `post.partial`
  - Target URL: `${baseUrl}/api/social/webhook`.

Usage:

- Intended to be called from a one-off admin script or endpoint when setting up the environment (documented in [Environment Variables & Setup](#14-environment-variables--setup-checklist)).

---

## 6. Social Account Connection Flow

**Key files:**

- Connect endpoint: `src/app/api/social/connect/[platform]/route.ts`
- OAuth callback router: `src/app/api/social/callback/route.ts`
- Account sync helper: `syncAccountsFromLate` in `callback/route.ts`
- Accounts API: `src/app/api/social/accounts/route.ts`
- Connections UI: `src/components/apps/social-platforms-late/social-platforms.tsx`
- Connections view in Distribution Hub: `src/components/distribution/connections-view.tsx`

### 6.1 Connect endpoint (`/api/social/connect/[platform]`)

Responsibilities:

1. **Authenticate user** via Clerk and resolve `User`.
2. **Ensure Late profile**:
   - If `user.lateProfileId` is missing, call `late.profiles.createProfile` (and fall back to `listProfiles` if needed).
   - Persist `lateProfileId` on the `User`.
3. Build `redirectUrl` for Late to call back: `${origin}/api/social/callback`.
4. Call `late.connect.getConnectUrl` with:
   - `platform` path param.
   - Query:
     - `profileId: lateProfileId`.
     - `redirect_url: redirectUrl`.
     - `headless: true` for platforms that require secondary selection (LinkedIn, Facebook).
5. Return `{ authUrl }` to the frontend.

Platforms:

- Only platforms in `ENABLED_PLATFORMS` are allowed (`"linkedin"`, `"twitter"` initially).

### 6.2 Connections UI

`src/components/apps/social-platforms-late/social-platforms.tsx`:

- Shows two groups:
  - **Connected Accounts:** from `/api/social/accounts`.
  - **Available Platforms:** from `SOCIAL_PLATFORMS`, showing:
    - “Connect” button for enabled platforms.
    - “Coming soon” badge for all others.

- `Connect` button:
  - Calls `/api/social/connect/[platform]`, then `window.location.href = authUrl`.

- `Connected Accounts`:
  - For each platform, uses icon + color from `PLATFORM_DISPLAY_NAMES` / `PLATFORM_ICON_COLORS`.
  - Dropdown menu:
    - **Manage** (for LinkedIn & Facebook) – opens manage dialog.
    - **Disconnect** – calls `DELETE /api/social/accounts/[id]`.

`ConnectionsView` in Distribution Hub simply wraps this component inside a page section.

### 6.3 OAuth callback router

`src/app/api/social/callback/route.ts`:

- Called by Late after OAuth.
- Reads query params:
  - `connected` (platform identifier if direct connect).
  - `profileId`, `tempToken`, `step`, `pendingDataToken`, `connect_token`, `userProfile`, `orgIds`.
- Looks up `User` by `lateProfileId`.

Two paths:

1. **Headless selection flow (LinkedIn / Facebook):**
   - If `step` & `platform` present:
     - Build URL params including tokens.
     - Redirect to: `/social/select-account?…`.

2. **Direct connect flow:**
   - If `connected` is present and no headless selection is needed:
     - Call `syncAccountsFromLate(user.id, user.lateProfileId)`.
     - Redirect to `/distribution?tab=connections&connected=${connected}`.

### 6.4 Account synchronization

`syncAccountsFromLate(userId, lateProfileId)` in `callback/route.ts`:

- Calls `late.accounts.listAccounts({ query: { profileId } })`.
- Upserts each account into `SocialAccount` keyed by `lateAccountId`.

`/api/social/accounts` (`GET`) does a similar sync-on-read:

- Try to sync accounts from Late (best-effort).
- Mark missing accounts as `disconnected`.
- Then return local `SocialAccount` records for display.

### 6.5 Disconnect

`src/app/api/social/accounts/[id]/route.ts` (`DELETE`):

- Validates user and fetches `SocialAccount`.
- Calls `late.accounts.deleteAccount` with `account.lateAccountId`.
- Deletes the local `SocialAccount` record.
- Returns `{ success: true }`.

---

## 7. Account Management (LinkedIn Orgs & Facebook Pages)

**Files:**

- API:
  - `src/app/api/social/accounts/[id]/manage/route.ts`
  - `src/app/api/social/callback/accounts/route.ts`
  - `src/app/api/social/callback/complete/route.ts`
- UI:
  - `src/app/(dashboard)/social/select-account/page.tsx`
  - Manage dialog within `SocialPlatformsConnectors`

### 7.1 Headless account selection page

`src/app/(dashboard)/social/select-account/page.tsx`:

- Reads query params: `platform`, `tempToken`, `profileId`, `pendingDataToken`, `connectToken`, `userProfile`, `orgIds`.
- For **LinkedIn**:
  - Calls `/api/social/callback/accounts?platform=linkedin&…` to get:
    - `organizations: LinkedInOrg[]`
    - `userProfile` (decoded from `pendingDataToken` or `userProfile` query).
  - UI shows:
    - A **personal profile** card (always available).
    - Optional **Organizations** list to choose from.
  - User chooses between:
    - `personal` (no org).
    - `organization` (org-by-id).

- For **Facebook**:
  - Calls `/api/social/callback/accounts?platform=facebook&…` to get `pages: FacebookPage[]`.
  - UI lists available pages for the logged-in user.

- On submit, posts to `/api/social/callback/complete` with:
  - `platform`, tokens.
  - `selection` payload (page/org choice + userProfile).

### 7.2 Completing selection

`src/app/api/social/callback/complete/route.ts`:

- Validates user and `lateProfileId`.
- For **LinkedIn**:
  - Calls `late.connect.linkedin.selectLinkedInOrganization` with:
    - `profileId`
    - `tempToken`
    - `accountType` (`personal` or `organization`)
    - `organizationId` and/or `selectedOrganization`
    - `userProfile`

- For **Facebook**:
  - Calls `late.connect.facebook.selectFacebookPage` with:
    - `profileId`
    - `pageId`
    - `tempToken`
    - `userProfile`

- After selection:
  - Calls `syncAccountsFromLate` to sync `SocialAccount`.
  - Returns `{ redirectUrl: "/distribution?tab=connections&connected=<platform>" }`.

### 7.3 Post-connect management

`src/app/api/social/accounts/[id]/manage/route.ts`:

- `GET`:
  - For a given `SocialAccount`:
    - **LinkedIn:** calls `late.connect.getLinkedInOrganizations` and returns current `accountType` and `selectedOrganization`.
    - **Facebook:** calls `late.connect.getFacebookPages` and returns `pages` and `selectedPageId`.

- `PUT`:
  - **LinkedIn:** calls `late.connect.updateLinkedInOrganization`, then syncs displayName/username into `SocialAccount`.
  - **Facebook:** calls `late.connect.updateFacebookPage` with `selectedPageId`.

UI:

- Managed through dialogs in `SocialPlatformsConnectors`, accessible from the “Manage” menu on connected LinkedIn/Facebook accounts.

---

## 8. Media Upload Pipeline

**Files:**

- API: `src/app/api/social/media/route.ts`
- UI:
  - `src/components/distribution/compose-view.tsx`
  - `src/components/social/publish-dialog.tsx`

### 8.1 Presigning endpoint

`/api/social/media` (`POST`):

- Authenticated via Clerk.
- Expects `{ filename, contentType }`.
- Calls `late.media.getMediaPresignedUrl({ body: { filename, contentType } })`.
- Returns the Late response, which includes:
  - `uploadUrl` – to `PUT` the file.
  - `publicUrl` – to store and later use as media URL.

### 8.2 Frontend usage

Both `ComposeView` and `PublishDialog` implement:

- File selection & drag-and-drop.
- Validation against supported types:
  - Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`.
  - Video: `video/mp4`, `video/quicktime`, `video/webm`.
- Max `MAX_FILES = 10`.
- For each file:
  1. POST to `/api/social/media` to get presigned URL + public URL.
  2. `PUT` the file to `uploadUrl`.
  3. Store `MediaItem` object `{ url, type: "image" | "video", filename }` on the client.
- These `MediaItem`s are passed in the publish payload as:

```ts
mediaItems: mediaItems.map((m) => ({ type: m.type, url: m.url }))
```

---

## 9. Post Creation, Scheduling & Queue Publishing

**Files:**

- API:
  - `src/app/api/social/posts/route.ts`
  - `src/app/api/social/posts/[id]/route.ts`
- UI:
  - `src/components/distribution/compose-view.tsx`
  - `src/components/social/publish-dialog.tsx`
  - `src/components/distribution/calendar-view.tsx`
  - `src/components/distribution/posts-view.tsx`

### 9.1 Create / list posts API

`/api/social/posts`:

- **POST** – create new post in Late and mirror it into `SocialPost`:

  - Validates:
    - User authenticated.
    - `user.lateProfileId` present (user must connect at least one account first).
    - `content` non-empty.
    - At least one platform/account in `platforms`.

  - Builds `postData` for Late:

    - `content`
    - `platforms`: `{ platform, accountId }[]`
    - Optional `mediaItems`
    - Either:
      - `publishNow: true`, or
      - `scheduledFor` and `timezone`.

  - Calls `late.posts.createPost({ body: postData })`.
  - Extracts Late post `_id` and other fields from `res.data.post`.
  - Persists `SocialPost` with:
    - `latePostId`
    - `sourceContentId` (if provided).
    - `content`, `mediaUrls`, `platforms`, `status`, `scheduledFor`, `timezone`, `lateResponse`.

- **GET** – list posts:

  - Filters:
    - `from`, `to` (date range).
    - `status` (e.g. `scheduled`, `published`).
  - Builds a `where` clause that matches posts by:
    - `scheduledFor` window OR
    - `publishedAt` window OR
    - `createdAt` window (fallback).
  - Sorted primarily by `scheduledFor`.

### 9.2 Delete / unpublish API

`/api/social/posts/[id]` (`DELETE`):

- Auth + fetch `SocialPost` by `id` + `userId`.
- If `post.latePostId` present:

  - For `published` or `partial` posts:
    - For each platform in `post.platforms` that supports it (`UNPUBLISH_SUPPORTED_PLATFORMS`):
      - Call `late.posts.unpublishPost({ postId, body: { platform } })`.

  - For `draft` / `scheduled` posts:
    - Call `late.posts.deletePost({ postId })`.

- Regardless of Late outcome, delete `SocialPost` locally.
- If any Late operations failed, return `warning` alongside `{ success: true }` (the UI surfaces these as warnings).

### 9.3 Compose view

`src/components/distribution/compose-view.tsx`:

- Uses `/api/social/accounts` for account list and `/api/preferences` for timezone.
- Tracks:
  - `scheduleMode: "now" | "schedule" | "queue"`.
  - `scheduledDate`, `scheduledTime`, `timezone`.
  - `nextQueueSlot` fetched from `/api/social/queues/next-slot` when in `queue` mode.
- Validates:
  - Non-empty content.
  - At least one selected account.
  - Character limits per platform (`PLATFORM_CHAR_LIMITS`) not exceeded.
  - For scheduled posts, ensures scheduled time is at least 30 minutes in the future.
- On publish:
  - Gathers `platforms` and optional `mediaItems`.
  - Sets either `publishNow`, `scheduledFor + timezone`, or queue-based scheduling with `nextQueueSlot`.
  - Calls `POST /api/social/posts`.

### 9.4 Publish dialog

`src/components/social/publish-dialog.tsx`:

- Similar logic to `ComposeView`, but:
  - Embedded as a dialog used by:
    - Library (`LibraryContent`) “Publish to Social” action.
    - Calendar and Posts views (New Post / Add Post).
  - Accepts:
    - `initialContent` (prefills from Library or other contexts).
    - `sourceContentId` (for linking).
    - Optional `initialMediaItems` (e.g. from generated creatives).

- Shares:
  - Schedule modes.
  - Timezone logic.
  - Media upload pipeline via `/api/social/media`.

### 9.5 Calendar and Posts views

Both `CalendarView` and `PostsView`:

- Fetch posts via `/api/social/posts`.
- Fetch timezone via `/api/preferences`.
- Group posts by date and display:
  - Status badge (scheduled, published, failed, partial, draft).
  - Platform chips with icons and optional external URLs (from `lateResponse.platforms[*].platformPostUrl`).
  - Local times using `formatInTimezone`.
- Provide a “View Source” action that navigates back to Library:
  - `/content/library?highlight=<sourceContentId>`.

---

## 10. Calendar, Queues & Next-Slot Preview

**Files:**

- `src/components/distribution/queue-view.tsx`
- `src/app/api/social/queues/route.ts`
- `src/app/api/social/queues/preview/route.ts`
- `src/app/api/social/queues/next-slot/route.ts`

### 10.1 Queues API

`/api/social/queues`:

- **GET:**
  - Auth + user + `lateProfileId` check.
  - Calls Late `queue.listQueueSlots({ query: { profileId, all: true } })`.
  - Returns `{ queues }` from Late’s response.

- **POST:**
  - Validates `name`, `slots`.
  - Calls `queue.createQueueSlot({ body: { profileId, name, timezone, slots } })`.
  - Returns created `queue`.

- **PUT:**
  - Validates `queueId`.
  - Calls `queue.updateQueueSlot({ body: { profileId, queueId, ...updates } })`.

- **DELETE:**
  - Validates `queueId` from query string.
  - Calls `queue.deleteQueueSlot({ query: { profileId, queueId } })`.

Slots:

- Represented as `{ dayOfWeek: number; time: string }[]` (0–6 for Sun–Sat, `HH:mm` strings).

### 10.2 Queue view UI

`src/components/distribution/queue-view.tsx`:

- Displays:
  - List of queues with:
    - Time slots by weekday.
    - Queue timezone (`formatTimezoneDisplay`).
  - Preview panel:
    - “Next 7 slots” per queue using `/api/social/queues/preview`.
  - Global **“Next Up”** list:
    - Calls `/api/social/queues/preview?count=5`.
    - Shows upcoming slots across all queues in the user’s **display timezone**.
  - **“Posts in Queue”**:
    - Calls `/api/social/posts?status=scheduled` to show scheduled posts.
    - Uses `PublishDialog` to add new posts.

### 10.3 Preview & next-slot APIs

- `/api/social/queues/preview`:
  - Auth + `lateProfileId`.
  - Calls `queue.previewQueue` with `profileId`, optional `queueId`, and `count`.
  - Normalizes response into an array of `slots` (ISO strings or objects with `scheduledFor`).

- `/api/social/queues/next-slot`:
  - Auth + `lateProfileId`.
  - Calls `queue.getNextQueueSlot` with `profileId` and optional `queueId`.
  - Returns `{ nextSlot: { scheduledFor, timezone, queueId, queueName } }` (when available).

### 10.4 Compose / Publish integration

- When schedule mode is `"queue"`, both `ComposeView` and `PublishDialog`:
  - Call `/api/social/queues/next-slot`.
  - Set `scheduledFor` to the returned `nextSlot.scheduledFor` and `timezone` to `nextSlot.timezone`.

---

## 11. Post Status Updates via Late Webhooks

**Files:**

- `src/lib/late/webhook.ts`
- `src/app/api/social/webhook/route.ts`

### 11.1 Webhook registration

- `registerWebhook(baseUrl)` (see [5.3](#53-webhook-registration-helper)) should be run once per environment to tell Late where to send events:
  - `url`: `<baseUrl>/api/social/webhook`
  - `secret`: `LATE_WEBHOOK_SECRET`
  - `events`: `"post.published"`, `"post.failed"`, `"post.partial"`.

### 11.2 Webhook handler

`/api/social/webhook` (`POST`):

- Reads raw request body and `x-late-signature` header.
- Verifies HMAC-SHA256 over the raw payload using `LATE_WEBHOOK_SECRET`.
- Expects payload `{ event, data }` where `data` contains `post` or `postId`.
- Locates `SocialPost` by `latePostId = postId`.
- Maps events:
  - `post.published` → `status = "published"`, `publishedAt` from `data.post.publishedAt` or `now`.
  - `post.failed` → `status = "failed"`, `error` set from `data.error`.
  - `post.partial` → `status = "partial"`.
- Persists updates:
  - `status`, `lateResponse`, `publishedAt`, `error` as applicable.

UI impact:

- Calendar and Posts views immediately reflect updated statuses/links on refresh.
- External post URLs per platform (when present) are taken from `lateResponse.platforms[*].platformPostUrl`.

---

## 12. Library Integration: Publish from Generated Content

**Files:**

- `src/components/content/library-content.tsx`
- `src/components/content/library/content-preview-card.tsx`
- `src/components/social/publish-dialog.tsx`
- `src/lib/server/services/creative.service.ts`
- `src/app/api/creatives/route.ts`

### 12.1 Content library card actions

`ContentPreviewCard` adds:

- “Publish to Social” entry in the kebab menu (3-dot menu).
- `onPublish` callback wired by `LibraryContent`.

### 12.2 Library container logic

`LibraryContent`:

- Tracks:
  - `publishTarget` object containing:
    - `content`, `sourceContentId`, `contentType`.
    - Optional `initialMediaItems` from associated creative.
  - `creativeStates` per content:
    - If a creative image exists, it is passed as an initial media item to `PublishDialog`.
    - If a creative is being generated, the state is `'generating'` until ready.

- On “Publish to Social”:
  - Opens `PublishDialog` with:
    - Text content prefilled.
    - `sourceContentId` set to the generated content’s ID.
    - If a creative is already generated, attaches it as a media item.

### 12.3 Creative generation link

- For `linkedin` content specifically, `LibraryContent` exposes a **“Generate Creative”** action.
- This uses:
  - `src/app/api/creatives/route.ts` and `src/lib/server/services/creative.service.ts` to create and later poll for creatives.
  - Once the creative’s `assetUrl` is available, it is displayed in `ContentPreviewCard` and used as media when publishing.

---

## 13. Key Files Reference

### 13.1 Pages & views

- Distribution Hub container:
  - `src/app/(dashboard)/distribution/page.tsx`
- Distribution views:
  - `src/components/distribution/compose-view.tsx`
  - `src/components/distribution/calendar-view.tsx`
  - `src/components/distribution/queue-view.tsx`
  - `src/components/distribution/posts-view.tsx`
  - `src/components/distribution/connections-view.tsx`
  - `src/components/distribution/analytics-view.tsx`
- Social account selection UI:
  - `src/app/(dashboard)/social/select-account/page.tsx`

### 13.2 Late integration & helpers

- Client & types:
  - `src/lib/late/client.ts`
  - `src/lib/late/index.ts`
  - `src/lib/late/types.ts`
  - `src/lib/late/timezones.ts`
  - `src/lib/late/webhook.ts`

### 13.3 APIs

- Preferences:
  - `src/app/api/preferences/route.ts`
- Accounts:
  - `src/app/api/social/accounts/route.ts`
  - `src/app/api/social/accounts/[id]/route.ts`
  - `src/app/api/social/accounts/[id]/manage/route.ts`
- OAuth & selection:
  - `src/app/api/social/connect/[platform]/route.ts`
  - `src/app/api/social/callback/route.ts`
  - `src/app/api/social/callback/accounts/route.ts`
  - `src/app/api/social/callback/complete/route.ts`
- Media:
  - `src/app/api/social/media/route.ts`
- Posts:
  - `src/app/api/social/posts/route.ts`
  - `src/app/api/social/posts/[id]/route.ts`
- Queues:
  - `src/app/api/social/queues/route.ts`
  - `src/app/api/social/queues/preview/route.ts`
  - `src/app/api/social/queues/next-slot/route.ts`
- Webhook:
  - `src/app/api/social/webhook/route.ts`

### 13.4 Persistence

- Prisma schema (social & preferences):
  - `prisma/schema.prisma` (User.lateProfileId, Preferences, SocialAccount, SocialPost)

---

## 14. Environment Variables & Setup Checklist

To run Distribution Hub & Late integration end-to-end, the following env vars are required:

- **Late API:**
  - `LATE_API_KEY` – server-side API key for `@getlatedev/node`.
  - `LATE_WEBHOOK_SECRET` – shared secret for verifying Late post-status webhooks.

### 14.1 Initial setup steps

1. **Configure Late project**
   - Create a Late project and obtain an API key.
   - Add supported platforms (LinkedIn, Twitter, etc.) in Late dashboard as needed.

2. **Set environment variables**

   ```bash
   LATE_API_KEY=...
   LATE_WEBHOOK_SECRET=...
   ```

3. **Run migrations**
   - Ensure Prisma migrations including `SocialAccount`, `SocialPost`, and `Preferences.timezone` are applied.

4. **Register webhook (once per environment)**
   - Call `registerWebhook(baseUrl)` from `src/lib/late/webhook.ts` with:
     - `baseUrl` = your deployed app base URL (e.g. `https://app.getartifacts.io`).
   - Confirm that Late is sending events to `/api/social/webhook`.

5. **Connect accounts**
   - From the Distribution Hub → `Connections` tab (or Apps page where connectors are used):
     - Connect LinkedIn and Twitter.
     - For LinkedIn/Facebook, complete organization/page selection in `/social/select-account`.

6. **Set timezone**
   - Go to `Settings → General` and choose the default timezone.
   - Verify that Calendar, Queue, and Posts views display times in this timezone.

Once these steps are complete, the Distribution Hub should fully support:

- Connecting social accounts (via Late).
- Composing posts with media.
- Scheduling or queuing posts.
- Viewing calendars and queues.
- Publishing directly from Library content.
