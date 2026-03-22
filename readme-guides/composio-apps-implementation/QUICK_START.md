# Composio Apps – Quick Start

This guide gets you running with the Composio-based “Manage apps” feature: connecting and disconnecting third-party accounts (Gmail, Slack, etc.) via [Composio](https://composio.dev/).

## Prerequisites

- A [Composio](https://composio.dev/) account and API key
- [Clerk](https://clerk.com/) (or another auth provider) for user identity

## Setup

1. **Environment**
   - Add to `.env` (or Vercel):
     ```bash
     COMPOSIO_API_KEY=your_composio_api_key
     ```

2. **Dependencies**
   - Already in the project: `@composio/core`

3. **Auth**
   - The app uses Clerk’s `userId` as the external user ID for Composio. Ensure users are signed in before they hit the apps page.

## Where It Lives

| Area | Location |
|------|----------|
| **Page** | `src/app/(dashboard)/apps/page.tsx` |
| **API** | `src/app/api/apps/` (GET list, POST connect, POST disconnect) |
| **Service** | `src/lib/server/services/app.service.ts` |
| **UI components** | `src/components/apps/` (ConnectButton, ManageAppDialog, types) |

## User Flow

1. User opens **Manage apps** (e.g. `/apps`).
2. **GET /api/apps** returns all Composio auth configs (apps) plus the current user’s connected accounts per app.
3. User clicks **Connect** on an app → **POST /api/apps/connect** returns a `redirectUrl` → user is sent to Composio/OAuth and returns to `/apps`.
4. User clicks **Manage** on a connected app → dialog shows connections; user can **Disconnect** → **POST /api/apps/disconnect** revokes the connection.

## Key APIs

- **GET /api/apps** – List apps and current user’s connections (requires auth).
- **POST /api/apps/connect** – Body: `{ authConfigId }`. Returns `{ redirectUrl, connectedAccountId }`. Redirect the client to `redirectUrl`.
- **POST /api/apps/disconnect** – Body: `{ connectedAccountId }`. Returns `{ success: true }`.

For full architecture, data shapes, and extension points, see [COMPOSIO_APPS_IMPLEMENTATION.md](./COMPOSIO_APPS_IMPLEMENTATION.md).
