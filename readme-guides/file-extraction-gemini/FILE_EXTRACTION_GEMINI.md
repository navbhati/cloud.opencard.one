# File Extraction Using Gemini

This guide describes how server-side file extraction is implemented: fetching files by URL, detecting type from MIME type, and extracting text using **Google Gemini** for PDFs and images, or plain `fetch` for text-based files.

## Overview

When users add content from a file (e.g. PDF, image, or text), the app can fetch the file from a URL and extract its text. The extraction strategy depends on the file type:

- **PDF** → Sent to Gemini as binary + prompt; Gemini returns extracted text (document understanding).
- **Images** (PNG, JPEG, WebP, etc.) → Sent to Gemini as binary + prompt; Gemini returns extracted text (vision/OCR).
- **Text** (TXT, MD, HTML, CSV, JSON) → Fetched and read as text with `response.text()`; no LLM call.

All extraction runs server-side. The API is authenticated and traces are sent to Langfuse for observability.

---

## Architecture

### Data flow

```
1. Client calls POST /api/content/file-extract with { url, mimeType? }
2. Route validates auth and body, then calls extractFromFile(url, mimeType, userId)
3. Service:
   a. Fetches file from URL (no-store)
   b. Resolves extraction type from mimeType (pdf | image | text)
   c. PDF/Image → buffer → generateText(Gemini) with file content + extract prompt
   d. Text → response.text()
4. Response: { content: string, mimeType }
```

### Extraction type resolution

MIME type is mapped to an extraction strategy:

| MIME type / prefix      | Extraction type | Method                    |
|-------------------------|-----------------|---------------------------|
| `application/pdf`       | `pdf`           | Gemini document understanding |
| `image/*`               | `image`         | Gemini vision (OCR)       |
| `text/*`                | `text`          | `fetch().text()`          |
| `application/json`      | `text`          | `fetch().text()`          |
| Anything else           | —               | Unsupported (error)       |

The caller can pass `mimeType` in the request body; if omitted, the service still uses the resolved type from the fetched URL (the route may pass through `Content-Type` or the client may always send `mimeType` from upload metadata).

---

## File structure

| File path | Purpose |
|-----------|---------|
| `src/app/api/content/file-extract/route.ts` | POST handler: auth, validate `url`/`mimeType`, call service, return `{ content, mimeType }`. |
| `src/lib/server/services/content/file.extract.service.ts` | Fetches file, dispatches by type, runs Gemini for PDF/image, returns extracted string. |
| `src/lib/config/file-types.ts` | Supported extensions and MIME types for upload validation and UI (single source of truth). |

Supported file types (from `file-types.ts`) include PDF, TXT, MD, HTML, CSV, JSON, and images (PNG, JPEG, WebP, HEIC, HEIF). The **extract** service only runs Gemini for PDF and image; text types are read directly.

---

## Gemini usage

### Model and gateway

- **Model:** `google/gemini-3-flash` (used in `generateText`).
- **Fallback / gateway:** `GEMINI_MODELS = ["google/gemini-2.5-flash"]` in the service, passed via `providerOptions.gateway.models` so the AI gateway can resolve the model.

### PDF extraction

- File is fetched and read into a `Uint8Array`.
- `generateText` is called with:
  - `messages[0].content`: one `type: "file"` part (`data`, `mediaType: "application/pdf"`) and one `type: "text"` part with the extract prompt.
  - Prompt instructs: extract all text, preserve structure (headings, paragraphs, lists), output only text with no commentary.
- Reference: [Gemini document processing](https://ai.google.dev/gemini-api/docs/document-processing).

### Image extraction (OCR)

- Image is fetched and read into a `Uint8Array`; `mimeType` is passed through (e.g. `image/png`, `image/jpeg`).
- Same pattern as PDF: one `type: "file"` part with `data` and `mediaType`, plus a short text prompt asking for extracted text only.
- Works for PNG, JPEG, WebP, and other image types supported by the gateway/Gemini.

### Telemetry

- Both PDF and image calls use `experimental_telemetry: { isEnabled: true }` so the AI SDK sends spans to Langfuse/OpenTelemetry.

---

## Langfuse tracing

The file extract service is traced under the **`file-extract`** trace name:

- The whole `extractFromFile` run is wrapped in `observe(..., { name: "file-extract" })`.
- **Input:** `{ url, mimeType }` (and `userId` for attribution).
- **Output (success):** `{ length: content.length }` (no full body in trace).
- **Output (error):** `String(error)`, `isError: true`.
- **Session:** Truncated URL (max 200 chars) as `sessionId`.
- **Flush:** `langfuseSpanProcessor.forceFlush()` is called in a `finally` block so traces are sent before the handler exits.

See [Langfuse Implementation Guide](../langfuse-implementation/LANGFUSE_IMPLEMENTATION_GUIDE.md) for the project-wide pattern and how to filter by `file-extract` in Langfuse.

---

## API contract

### POST `/api/content/file-extract`

- **Auth:** Required (Clerk). `userId` is passed into the service for tracing.
- **Body:** `{ url: string, mimeType?: string }`.
- **Success:** `200` with `{ content: string, mimeType: string }`.
- **Errors:**
  - `401` – Unauthorized.
  - `400` – Missing or invalid `url`.
  - `500` – Fetch failed, unsupported file type, or extraction error (message in `error`).

---

## Summary

| Concern | Implementation |
|--------|----------------|
| **PDF** | Gemini `generateText` with PDF binary + extract prompt. |
| **Image** | Gemini `generateText` with image binary + OCR-style prompt. |
| **Text** | `fetch(url).then(r => r.text())`, no LLM. |
| **Supported types** | Defined in `src/lib/config/file-types.ts`; extraction supports pdf, image, and text as above. |
| **Observability** | Langfuse trace `file-extract` with input/output metadata and `forceFlush`. |

Adding a new **text** type (e.g. new MIME in `file-types.ts`) only requires that `getExtractionTypeFromMimeType` in the service maps it to `"text"` (or the service already treats `text/*` and `application/json`). Adding a new **binary** type that should use Gemini would require a new branch and possibly a new prompt in `file.extract.service.ts`.
