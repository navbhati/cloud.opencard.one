# Langfuse Implementation Guide

This guide describes how [Langfuse](https://langfuse.com/) is configured and used in the app for observability of AI/LLM calls (content generation, chat, voice profiles, infographics, and title generation).

## What is Langfuse?

Langfuse is an observability platform for LLM applications. It provides:

- **Traces** – Request-level visibility (input, output, metadata, errors)
- **Sessions** – Grouping by `sessionId` (e.g. chat, source, profile)
- **Environments** – Filtering by `development` / `preview` / `production`
- **OpenTelemetry** – AI SDK spans (e.g. `streamText`, `generateText`) are sent to Langfuse via the OTel integration

The app uses Langfuse **directly** in routes and services (no adapter layer): each traced handler is wrapped with `observe()`, and we call `updateActiveTrace()` and `langfuseSpanProcessor.forceFlush()` as needed.

---

## Configuration

### Environment variables

Set these in `.env`, `.env.local`, or in Vercel:

| Variable | Description | Example |
|----------|-------------|---------|
| `LANGFUSE_SECRET_KEY` | Server-side secret (backend only) | `sk-lf-...` |
| `LANGFUSE_PUBLIC_KEY` | Public key for client/edge (if needed) | `pk-lf-...` |
| `LANGFUSE_BASE_URL` | Langfuse API URL | `https://cloud.langfuse.com` |

**Optional:** `LANGFUSE_TRACING_ENVIRONMENT` overrides the environment string sent with each trace. If unset, the app uses `VERCEL_ENV` → `NODE_ENV` → `"development"` (see [Environment resolution](#environment-resolution) below).

### NPM packages

From `package.json`:

- **`@langfuse/tracing`** – `observe()`, `updateActiveTrace()`, `updateActiveObservation()`
- **`@langfuse/otel`** – `LangfuseSpanProcessor` for OpenTelemetry (used in `instrumentation.ts`)

---

## Files involved

### 1. Root: `instrumentation.ts`

- **Purpose:** Registers the OpenTelemetry tracer and sends spans to Langfuse.
- **Exports:** `langfuseSpanProcessor` (used for `forceFlush()` in serverless).

```ts
import { LangfuseSpanProcessor, ShouldExportSpan } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

const shouldExportSpan: ShouldExportSpan = (span) => {
  return span.otelSpan.instrumentationScope.name !== "next.js";
};

export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
});

const tracerProvider = new NodeTracerProvider({
  spanProcessors: [langfuseSpanProcessor],
});

tracerProvider.register();
```

Next.js loads this file automatically when the Node.js runtime is used (API routes, server components).

### 2. Shared helpers: `src/lib/langfuse.ts`

| Export | Purpose |
|--------|---------|
| `getLangfuseEnvironment()` | Resolves the environment string for traces (see [Environment resolution](#environment-resolution)). |
| `getContentGenerationTraceAttributes(params)` | Builds attributes for **content-generation** traces (used by content/generate route). |
| `getTraceAttributes(params)` | Generic helper for all other traces (chat, voice-profile, infographic, title generation). |
| `ContentGenerationTraceParams` | Type for content-generation params. |
| `TraceAttributesParams` | Type for generic trace params. |

**Environment resolution:** `getLangfuseEnvironment()` returns (in order) `LANGFUSE_TRACING_ENVIRONMENT`, `VERCEL_ENV`, `NODE_ENV`, or `"development"`, lowercased and truncated to 40 chars (Langfuse constraint).

### 3. API routes and services that send traces

| File | Trace name(s) | Pattern |
|------|----------------|--------|
| `src/app/api/content/generate/route.ts` | `content-generate` | `observe` + `getContentGenerationTraceAttributes` + stream `onFinish`/`onError` + `forceFlush` |
| `src/app/api/chat/route.ts` | `chat` | `observe` + `getTraceAttributes` + stream callbacks + `forceFlush` |
| `src/app/api/content/voice-profile/process/route.ts` | `voice-profile-process` | `observe` + `getTraceAttributes` (start / success / error) + `forceFlush` |
| `src/app/api/infographics/transform/route.ts` | `infographic-transform` | `observe` + `getTraceAttributes` + `forceFlush` |
| `src/lib/server/services/chat.service.ts` | `chat-title-generation` | `observe` around title-generation logic + `getTraceAttributes` + `forceFlush` |
| `src/lib/server/services/content/generate.service.ts` | `source-title-generation` | `observe` around title logic + `getTraceAttributes` + `forceFlush` |
| `src/lib/server/services/content/file.extract.service.ts` | `file-extract` | `observe` around extraction logic + `getTraceAttributes` + `forceFlush` |

---

## Implementation pattern

### Non-streaming route (e.g. voice-profile, infographic)

1. **Wrap the handler** with `observe(handler, { name: "<trace-name>" })`. Default `endOnExit: true` is fine.
2. **At start** (after auth/validation):  
   `updateActiveTrace(getTraceAttributes({ name, sessionId, userId, input, environment: getLangfuseEnvironment(), metadata }))`.
3. **On success:**  
   `updateActiveTrace(getTraceAttributes({ ...same, output }))`.
4. **On error:**  
   `updateActiveTrace(getTraceAttributes({ ...same, output: String(error), isError: true }))`.
5. **Before returning:**  
   `after(async () => await langfuseSpanProcessor.forceFlush())`.

### Streaming route (e.g. chat, content/generate)

1. **Wrap the handler** with `observe(handler, { name: "<trace-name>", endOnExit: false })`.
2. **Before calling `streamText`:**  
   `updateActiveTrace(getTraceAttributes({ ... }))`.
3. **In `streamText`:**  
   - `experimental_telemetry: { isEnabled: true }` so AI SDK spans go to Langfuse.
   - In `onFinish`: `updateActiveTrace(...)` with `output`, then `trace.getActiveSpan()?.end()`.
   - In `onError`: `updateActiveTrace(..., isError: true)` and end the span.
4. **Before returning the stream response:**  
   `after(async () => await langfuseSpanProcessor.forceFlush())`.

### Service used from routes (e.g. generateChatTitle, triggerTitleGeneration)

1. **Wrap the AI call path** with `observe(async () => { ... }, { name: "<trace-name>" })`.
2. **Start:** `updateActiveTrace(getTraceAttributes({ ... }))`.
3. **Success/error:** `updateActiveTrace(...)` with `output` and optional `isError`.
4. **After the observed block:** `await langfuseSpanProcessor.forceFlush()` (important for fire-and-forget callers so traces are sent before the process exits).

### Imports to use

```ts
import { observe, updateActiveTrace } from "@langfuse/tracing";
import { langfuseSpanProcessor } from "@/instrumentation"; // or relative path to root instrumentation.ts
import { getLangfuseEnvironment, getTraceAttributes } from "@/lib/langfuse";
// For streaming only:
import { trace } from "@opentelemetry/api";
import { after } from "next/server";
```

For **content-generation** only, use `getContentGenerationTraceAttributes` from `@/lib/langfuse` instead of `getTraceAttributes`.

---

## Trace attribute contract

Attributes passed to `updateActiveTrace()` must include:

- **Required:** `name`, `sessionId`, `userId`, `input`, `environment`
- **Optional:** `output`, `metadata` (object), `isError` (boolean)

`getTraceAttributes()` and `getContentGenerationTraceAttributes()` build objects that match this contract. Use them so metadata shape stays consistent and filters in Langfuse work as expected.

---

## Adding tracing to a new route or service

1. **Install** – Packages are already in the project (`@langfuse/tracing`, `@langfuse/otel`).
2. **Env** – Ensure `LANGFUSE_SECRET_KEY`, `LANGFUSE_PUBLIC_KEY`, and `LANGFUSE_BASE_URL` are set.
3. **Route:**  
   - Extract the handler into an async function.  
   - Wrap export: `export const POST = observe(handleX, { name: "your-trace-name", endOnExit: false })` only if you have streaming; otherwise omit `endOnExit`.  
   - Call `updateActiveTrace(getTraceAttributes({ ... }))` at start, on success, and on error.  
   - Call `after(async () => await langfuseSpanProcessor.forceFlush())` before returning (and for streaming, end the active span in `onFinish`/`onError`).
4. **Service:**  
   - Wrap the block that does the LLM call with `observe(..., { name: "your-trace-name" })`.  
   - Use `getTraceAttributes` and `updateActiveTrace` inside.  
   - Call `await langfuseSpanProcessor.forceFlush()` after the observed block.

---

## Quick reference: trace names

| Trace name | Where |
|------------|--------|
| `content-generate` | Content generation API (streaming) |
| `chat` | Chat API (streaming) |
| `voice-profile-process` | Voice profile process API |
| `infographic-transform` | Infographics transform API |
| `chat-title-generation` | Chat service – generateChatTitle |
| `source-title-generation` | Generate service – triggerTitleGeneration |
| `file-extract` | File extract service – extractFromFile (PDF/image via Gemini) |

Use these names in Langfuse to filter and debug traces.
