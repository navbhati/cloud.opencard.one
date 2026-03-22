# Shared Source and Chat - Quick Reference

## File Locations

### Components
- **ShareModal**: `src/components/share/ShareModal.tsx`
- **SharedContentHeader**: `src/components/share/SharedContentHeader.tsx`
- **ReadOnlyChatInterface**: `src/components/chat/ReadOnlyChatInterface.tsx`
- **ReadOnlySourceView**: `src/components/content/ReadOnlySourceView.tsx`

### API Routes
- **Chat Share API**: `src/app/api/chat/conversations/[chatId]/share/route.ts`
- **Source Share API**: `src/app/api/content/sources/[id]/share/route.ts`

### Public Pages
- **Shared Chat Page**: `src/app/share/chat/[token]/page.tsx`
- **Shared Source Page**: `src/app/share/source/[token]/page.tsx`

### Services
- **Chat Service**: `src/lib/server/services/chat.service.ts`
  - `toggleChatSharing()`
  - `getPublicChatByToken()`
- **Source Service**: `src/lib/server/services/content/content.source.service.ts`
  - `toggleSourceSharing()`
  - `getPublicSourceByToken()`

## Database Fields

### Chat Model
```prisma
isPublic   Boolean   @default(false)
shareToken String?   @unique
```

### Source Model
```prisma
isPublic   Boolean   @default(false)
shareToken String?   @unique
```

## API Endpoints

### Get Share Status
```
GET /api/chat/conversations/[chatId]/share
GET /api/content/sources/[id]/share
```

### Toggle Sharing
```
POST /api/chat/conversations/[chatId]/share
Body: { "isPublic": true }
```

## Public URLs

### Format
```
/share/chat/[token]
/share/source/[token]
```

### Example
```
https://app.getartifacts.io/share/chat/abc123def456
https://app.getartifacts.io/share/source/xyz789ghi012
```

## Token Generation

```typescript
import { nanoid } from "nanoid";
const shareToken = nanoid(12); // 12-character URL-safe token
```

## Common Operations

### Enable Sharing
1. User clicks share button
2. ShareModal opens
3. User toggles to "Public"
4. API generates token
5. Database updated with `isPublic=true` and `shareToken`
6. Share URL displayed

### Disable Sharing
1. User toggles to "Private"
2. API sets `isPublic=false` and `shareToken=null`
3. Share URL removed

### View Shared Content
1. Visitor navigates to `/share/[type]/[token]`
2. Server queries by `shareToken` and `isPublic=true`
3. Read-only view rendered

## Environment Variables

```env
NEXT_PUBLIC_APP_URL=https://app.getartifacts.io
```

## Key Functions

### Toggle Sharing
```typescript
toggleChatSharing(chatId, userId, isPublic)
toggleSourceSharing(sourceId, userId, isPublic)
```

### Get Public Content
```typescript
getPublicChatByToken(token)
getPublicSourceByToken(token)
```

## Integration Points

### Chat History
- File: `src/components/chat/ChatHistory.tsx`
- Action: Share button in chat list

### Source Table
- File: `src/components/content/source-table.tsx`
- Action: Share button in source actions

## Security Checklist

- [ ] Token is unique (database constraint)
- [ ] Ownership verified before sharing
- [ ] Public access only with valid token + isPublic=true
- [ ] No sensitive data in public views
- [ ] Read-only access enforced

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Token collision | Handled by retry (max 5 attempts) |
| Share URL 404 | Check `isPublic=true` and token exists |
| Permission denied | Verify user owns content |
| URL not working | Check `NEXT_PUBLIC_APP_URL` env var |
