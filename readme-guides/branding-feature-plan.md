# Plan: Branding Feature (Brand DNA via Firecrawl + Vercel Workflow)

## Context
Users want to extract and store their brand identity (logo, colors, fonts, personality, spacing) from a website URL. This uses Firecrawl's `branding` scrape format (`formats: ["branding"]`). The extraction runs as a **Vercel Workflow** with durable step execution, so the user can safely leave during processing and the pipeline is extensible with future steps.

---

## Architecture: Vercel Workflow-Based Processing

The branding pipeline uses the **Vercel Workflow SDK** (`workflow` package) — the same infrastructure powering agent automations. This gives us serverless durability, automatic retries, and step-level isolation.

### Workflow Structure

```
executeBrandingWorkflow(brandId, url)        ← "use workflow"
  └─ extractBrandingStep({ brandId, url })   ← "use step"
       ├─ Calls Firecrawl scrape(url, { formats: ["branding"] })
       ├─ Updates Brand record status via raw SQL
       └─ (future steps added here)
```

The `executeBrandingWorkflow` function lives in `executor.workflow.ts` alongside the existing `executeWorkflow` function, since the Vercel Workflow SDK discovers and registers functions from `.workflow.ts` files via the `withWorkflow()` Next.js plugin.

### Data Flow
1. User enters URL on `/branding` → clicks send
2. `POST /api/branding` → auth + deduct 50 credits → create Brand record with `status: "processing"`, `steps: [{ name: "extract_branding", status: "pending" }]` → return id immediately
3. `start(executeBrandingWorkflow, [brand.id, url])` dispatches the workflow via the Vercel Workflow SDK
4. The `extractBrandingStep` runs durably in the background, updating the Brand record directly via raw SQL
5. Frontend polls `GET /api/branding/[id]` every 3s (detail page) or 5s (list page)
6. On completion → UI transitions to detail view

### Why Vercel Workflow (not `after()`)
- **Durability**: Workflow steps survive serverless function timeouts
- **Extensibility**: Add new `"use step"` functions without changing the orchestrator
- **Consistency**: Same pattern as agent automations (`executeWorkflow`)
- **Observability**: Steps are isolated and trackable

---

## Database

### `prisma/schema.prisma` — Brand model

```prisma
model Brand {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String   // hostname initially, updated to brand name from data
  url       String   // website URL analyzed
  status    String   @default("processing") // "processing" | "completed" | "failed"
  error     String?  @db.Text
  steps     Json     @default("[]") // BrandPipelineStep[]
  data      Json?    // full Firecrawl branding response object
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([userId, status])
}
```

`brands Brand[]` added to User model.

### BrandPipelineStep shape (TypeScript, not Prisma)

```ts
interface BrandPipelineStep {
  name: string;        // "extract_branding"
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: string;  // ISO
  completedAt?: string;
  error?: string;
}
```

---

## Files Created

### 1. `src/lib/branding/types.ts` — Type definitions

- `BrandPipelineStep` interface
- `BrandData` interface (typed subset of Firecrawl branding response)
- `BrandRecord` interface (mirrors Prisma Brand model for client use)

### 2. `src/lib/workflow/steps/extract-branding.step.ts` — Extract Branding step

```ts
export async function extractBrandingStep(config: { brandId: string; url: string }): Promise<StepResult>
```

- Decorated with `"use step"` directive (Vercel Workflow SDK)
- Marks Brand step as `running` via raw SQL
- Calls `firecrawl.scrape(url, { formats: ["branding"] })`
- On success: updates Brand to `completed`, stores branding data, updates name
- On failure: updates Brand to `failed`, stores error message
- Uses `pg.Pool` for direct DB access (required by `"use step"` pattern)
- `maxRetries = 0` (matching other steps)

### 3. `src/lib/server/services/branding.service.ts` — DB operations (Prisma)

- `createBrand(userId, url)` → creates Brand record with initial steps
- `getBrandsByUser(userId)` → list brands
- `getBrandById(id, userId)` → single brand with ownership check
- `deleteBrand(id, userId)` → delete brand
- `updateBrandStep(brandId, stepName, updates)` → update step status
- `completeBrand(brandId, data)` → set completed + store data
- `failBrand(brandId, error)` → set failed

### 4. `src/app/api/branding/route.ts` — List + Create

**GET**: Auth → `getBrandsByUser(userId)`

**POST** `{ url }`:
1. Auth + getUserByClerkId
2. Validate URL (try `new URL()`)
3. checkCredits(50) + deductCredits(50, "brand_analysis", { url })
4. `createBrand(userId, url)` → returns brand with id
5. `start(executeBrandingWorkflow, [brand.id, url])` — dispatches Vercel Workflow
6. Return `{ id, status: "processing" }` (201)

### 5. `src/app/api/branding/[id]/route.ts` — Get + Delete

**GET**: Auth → `getBrandById(id, userId)` → return brand
**DELETE**: Auth → `deleteBrand(id, userId)` → return success

### 6. `src/app/(dashboard)/branding/page.tsx` — Main branding page

- Title: "Create a brand from any website!"
- Subtitle: "Enter a website to extract the brand and create on-brand content."
- URL input (rounded, with ArrowUp send button)
- "Your Brands" section with count badge
- Grid of `<BrandCard>` components (2-column on md+)
- Delete via `<DeleteDialog>` confirmation (behind `delete_branding_<env>` feature flag)
- Polls brands every 5s if any have `status: "processing"`
- Behind `branding_<env>` Edge Config feature flag (redirects to `/` if disabled)
- Triggers `triggerCreditDeduction()` after successful POST for immediate UI update

### 7. `src/app/(dashboard)/branding/[id]/page.tsx` — Brand detail page

- Fetches brand via `GET /api/branding/[id]`
- If `status === "processing"` → render `<ProcessingState>`
- If `status === "failed"` → render error with retry option
- If `status === "completed"` → render `<BrandDetail data={brand.data}>`
- Polls every 3s while processing

### 8. `src/components/branding/brand-card.tsx`

- Logo/avatar, brand name, URL
- Status indicator (spinner / failed badge / chevron)
- Optional delete button (trash icon, appears on hover)
- Click navigates to `/branding/[id]`

### 9. `src/components/branding/brand-detail.tsx`

**Row 1 (3 columns):** Logo, Name + URL, Colors (all swatches with hex codes)

**Row 2 (3 columns):** Typography preview, Personality (tone/audience/traits), Images (logo/favicon/OG)

**Row 3 (3 columns):** Fonts (families + weights), Typography sizes (h1/h2/body), Spacing (baseUnit/borderRadius)

**Full-width:** Brand Images (logo/favicon/OG with large previews)

All sections render conditionally.

### 10. `src/components/branding/processing-state.tsx`

- Gradient card (blue → white)
- Title: "Generating your *Business DNA*"
- Scanning pill badge with animated icon
- URL display
- Step progress label from `brand.steps`

---

## Files Modified

### 11. `src/lib/workflow/executor.workflow.ts`

Added `executeBrandingWorkflow` function with `"use workflow"` directive and import for `extractBrandingStep`. This must live in the existing `.workflow.ts` file because the Vercel Workflow SDK registers functions at the file level.

### 12. `src/lib/config/credit-costs.ts`

Added `BRAND_ANALYSIS_COST = 50`.

### 13. `src/lib/server/services/content-source-processing/firecrawl.service.ts`

Exported `firecrawlClient`.

### 14. `src/components/app-sidebar.tsx`

Added "Branding" nav item with `Palette` icon and `NEW` badge. Hidden behind `branding_<env>` Edge Config feature flag (same pattern as agents).

### 15. `prisma/schema.prisma`

Added `Brand` model and `brands Brand[]` relation on User.

### 16. `src/components/dynamic-breadcrumb.tsx`

- Made all breadcrumb items clickable (using `<BreadcrumbLink>` + Next.js `<Link>`)
- Added dynamic name resolution for `/branding/[id]`, `/agents/[id]`, `/content/source/[id]`
- Added `pathRedirectMap` for segments without pages (e.g., `/source` → `/content`)
- Added `branding` to `pathLabelMap`

---

## Feature Flags (Edge Config)

| Flag | Purpose |
|------|---------|
| `branding_<env>` | Show/hide Branding in sidebar + gate `/branding` page |
| `delete_branding_<env>` | Show/hide delete button on brand cards |

---

## Key Patterns Reused

| What | From |
|------|------|
| Auth + getUserByClerkId | `src/lib/server/services/user.service.ts` |
| checkCredits + deductCredits | `src/lib/server/services/credits.service.ts` |
| Credit cost constant | `src/lib/config/credit-costs.ts` |
| `start()` + `"use workflow"` | `src/app/api/agents/[agentId]/execute/route.ts` |
| `"use step"` + raw SQL | `src/lib/workflow/steps/scrape-url.step.ts` |
| Edge Config feature flags | `src/components/app-sidebar.tsx` (agents pattern) |
| `DeleteDialog` component | `src/components/content/settings/voice-profile/delete-dialog.tsx` |
| `triggerCreditDeduction()` | `src/contexts/credit-context.tsx` |
| Toast notifications | `src/lib/toast` |
| Dashboard page routing | `src/app/(dashboard)/` pattern |

---

## Firecrawl API Details

- **SDK**: `@mendable/firecrawl-js` (already installed)
- **Call**: `firecrawl.scrape(url, { formats: ["branding"] })`
- **Response**: `response.branding` object containing:
  - `colorScheme`, `logo`, `colors` (primary/secondary/accent/background/text/link)
  - `fonts[]`, `typography` (families/sizes/weights)
  - `spacing` (baseUnit, borderRadius)
  - `images` (logo, favicon, ogImage — all URLs)
  - `personality` (tone, targetAudience, traits)
  - `components`, `animations`, `layout`, `icons`
- No need to store images — use URLs directly from the JSON

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid URL format | Client-side validation, toast: "Please enter a valid website URL." |
| Insufficient credits | Toast: "You need 50 credits for brand analysis." + 402 response |
| Firecrawl 404/timeout | Step fails, Brand `status: "failed"`, error shown on detail page |
| Firecrawl rate limit | Step fails, error stored in Brand record |
| Network error in workflow | Step fails gracefully via `"use step"` error handling |

---

## Verification Checklist
1. `npx prisma db push` succeeds ✅
2. `npx tsc --noEmit` passes ✅
3. Sidebar shows "Branding" link with NEW badge (when feature flag enabled) ✅
4. `/branding` page loads with URL input ✅
5. Enter URL → brand card appears in list with processing spinner ✅
6. Navigate away, come back → processing state persists ✅
7. After completion → brand status updates to completed ✅
8. Click brand card → detail page shows logo, colors, fonts, personality grid ✅
9. Credit balance decreased by 50 + UI updates immediately ✅
10. Delete brand → confirmation dialog → removed from list ✅
11. Invalid URL → validation error ✅
12. Insufficient credits → error toast ✅
13. Breadcrumbs are clickable and show brand name (not ID) ✅
