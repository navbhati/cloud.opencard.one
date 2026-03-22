# Composio Apps Implementation Guide

This guide documents the “Manage apps” feature: listing third-party apps (toolkits) from Composio, connecting and disconnecting user accounts via OAuth, and surfacing connection status in the dashboard.

## Overview

- **Composio** provides auth configs (apps like Gmail, Slack, etc.) and manages OAuth flows and connected accounts.
- **Clerk** supplies the external user ID; we pass it to Composio as `userId` so connections are scoped per user.
- The UI lives under the dashboard: a searchable list of apps, Connect/Manage actions, and a manage dialog to view/disconnect connections.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  src/app/(dashboard)/apps/page.tsx                              │
│  – Fetches GET /api/apps, search, open Manage dialog            │
│  – Renders ConnectButton, ManageAppDialog, table                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│  src/components/apps/                                            │
│  – ConnectButton: POST /api/apps/connect → redirect               │
│  – ManageAppDialog: list connections, POST /api/apps/disconnect  │
│  – types: AuthConfigItem, UserConnectionSummary                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  src/app/api/apps/                                               │
│  – route.ts (GET): auth configs + user connections per app        │
│  – connect/route.ts (POST): start connection, return redirectUrl │
│  – disconnect/route.ts (POST): revoke one connection             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  src/lib/server/services/app.service.ts                         │
│  – connect(authConfigId, userId, callbackUrl)                   │
│  – listConnectedAccounts(userId)                                 │
│  – disconnect(connectedAccountId, userId)                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                   Composio API (@composio/core)
                   – authConfigs.list, connectedAccounts.*
```

## Environment

| Variable | Description |
|----------|-------------|
| `COMPOSIO_API_KEY` | Composio API key (server-side only). Required for all Composio calls. |

Used in:

- `src/lib/server/services/app.service.ts` – single `Composio` instance
- `src/app/api/apps/route.ts` – second instance for `authConfigs.list` (could be refactored to use the service)

## Service Layer: `app.service.ts`

### `connect(input: ConnectInput): Promise<ConnectResult>`

- Calls `composio.connectedAccounts.link(userId, authConfigId, { callbackUrl })`.
- Returns `{ redirectUrl, connectedAccountId }`. The client must redirect the user to `redirectUrl` to complete OAuth; after success, Composio redirects to `callbackUrl` (e.g. `/apps`).

### `listConnectedAccounts(userId: string)`

- Calls `composio.connectedAccounts.list({ userIds: [userId] })`.
- Returns the raw Composio response (list of connected accounts with toolkit, id, etc.).

### `disconnect(connectedAccountId: string, userId: string)`

- Fetches the connected account, verifies it belongs to `userId` (via `userId` / `user_id`), then calls `composio.connectedAccounts.delete(connectedAccountId)`.

## API Routes

### GET `/api/apps`

- **Auth:** Clerk required; uses `userId` as Composio external user ID.
- **Response:** Pagination metadata plus `items: AuthConfigItem[]`.
- **Logic:**
  1. `composio.authConfigs.list()` → all auth configs (apps).
  2. `listConnectedAccounts(clerkUserId)` → user’s connected accounts.
  3. Group connected accounts by `toolkit.slug`; for each account build `{ id, label }` where `label` is `name ?? label ?? identifier ?? email ?? slug`.
  4. Attach to each app: `userConnections`, `userConnectionsCount`.
  5. Sort: connected apps first, then by app name.

### POST `/api/apps/connect`

- **Auth:** Clerk required.
- **Body:** `{ authConfigId: string }`.
- **Response:** `{ redirectUrl: string, connectedAccountId: string }`.
- **Logic:** Builds `callbackUrl` from request origin (e.g. `${origin}/apps`), calls `connect({ authConfigId, userId: clerkUserId, callbackUrl })`, returns result. Client redirects to `redirectUrl`.

### POST `/api/apps/disconnect`

- **Auth:** Clerk required.
- **Body:** `{ connectedAccountId: string }`.
- **Response:** `{ success: true }`.
- **Logic:** Calls `disconnect(connectedAccountId, clerkUserId)`.

## Data Types

### `AuthConfigItem` (apps list + manage dialog)

- `id` – Composio auth config ID
- `name` – Display name
- `toolkit.logo`, `toolkit.slug`
- `userConnectionsCount`, `userConnections` – derived from Composio connected accounts for the current user

### `UserConnectionSummary` (one connection in the manage dialog)

- `id` – Composio connected account ID
- `label` – Display string (email, name, or slug from Composio account)

Defined in `src/components/apps/types.ts` and used by the page and ManageAppDialog.

## UI Components

### `ConnectButton` (`src/components/apps/connect-button.tsx`)

- Props: `authConfigId`, optional `label`, `variant`, `size`.
- On click: POST `/api/apps/connect` with `{ authConfigId }`, then `window.location.href = redirectUrl`.

### `ManageAppDialog` (`src/components/apps/manage-app-dialog.tsx`)

- Props: `open`, `onOpenChange`, `app` (AuthConfigItem | null), `onDisconnect({ appId, connectionId })`.
- Shows app header (logo, name, connection count) and a table of connections (label + “Default” on first, Disconnect in dropdown).
- On Disconnect: POST `/api/apps/disconnect` with `{ connectedAccountId }`, then calls `onDisconnect` so the parent can update its list (e.g. remove the connection from state).

### Apps page (`src/app/(dashboard)/apps/page.tsx`)

- Fetches `GET /api/apps`, keeps `items`, search, and manage-dialog state.
- Renders search (max-w-6xl, centered), table of apps (max-w-6xl, centered), Connect or Manage per row, and `ManageAppDialog` with `onDisconnect` that updates `items` optimistically.

## Connection Label

The connection label shown in the manage dialog comes from the GET `/api/apps` logic: for each connected account, `label` is set to the first available of `name`, `label`, `identifier`, `email`, or `toolkit.slug`. So Gmail connections can show the email if Composio returns it.

## Security Notes

- All three API routes require Clerk auth; unauthenticated requests get 401.
- Disconnect verifies that the connected account’s `userId`/`user_id` matches the current Clerk user before deleting.
- `COMPOSIO_API_KEY` must only be used on the server (service and API routes).

## Extending

- **More actions in the manage dialog:** Add dropdown items in `ManageAppDialog` and new API routes or service methods as needed.
- **Custom callback URL:** Change the `callbackUrl` in `POST /api/apps/connect` (e.g. by query param or tenant) and ensure that route exists and, if desired, re-fetches apps.
- **Using connections elsewhere:** Use the same Clerk `userId` and Composio `connectedAccounts.list({ userIds: [userId] })` (or the app service’s `listConnectedAccounts`) to resolve which accounts are connected for tools/workflows.

## References

- [Composio Docs](https://docs.composio.dev/)
- [Composio Connected Accounts API](https://docs.composio.dev/reference/api-reference/connected-accounts)
- In-repo: `src/lib/server/services/app.service.ts`, `src/app/api/apps/`, `src/components/apps/`
