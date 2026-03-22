# Automation Trigger Implementation Documentation

This document captures the complete trigger implementation including Composio integration and webhook triggers before their removal. These will be re-added later.

---

## Table of Contents

1. [Trigger Types & Settings (types.ts)](#1-trigger-types--settings)
2. [Triggers API Route (triggers/route.ts)](#2-triggers-api-route)
3. [Trigger Types Hook (use-trigger-types.ts)](#3-trigger-types-hook)
4. [Composio Webhook Subscription (webhook-subscription.ts)](#4-composio-webhook-subscription)
5. [Composio Webhook Receiver (webhooks/composio/route.ts)](#5-composio-webhook-receiver)
6. [Custom Webhook Trigger Handler (webhook/route.ts)](#6-custom-webhook-trigger-handler)
7. [Automations API - POST (automations/route.ts)](#7-automations-api---create-workflow)
8. [Automations API - PATCH (automations/[workflowId]/route.ts)](#8-automations-api---update-workflow)
9. [Cron Scheduled Trigger (cron/automations/route.ts)](#9-cron-scheduled-trigger)
10. [Platform Events - Source Added (platform-events.ts)](#10-platform-events---source-added)
11. [Automation Builder Panel UI (automation-builder-panel.tsx)](#11-automation-builder-panel-ui)
12. [Workflow Executor (executor.workflow.ts)](#12-workflow-executor)
13. [Template Resolution (template.ts)](#13-template-resolution)
14. [Vercel Config (vercel.json)](#14-vercel-config)

---

## 1. Trigger Types & Settings

**File:** `src/lib/workflow/types.ts`

```typescript
// ---- Trigger Types ----

export type TriggerType =
  | "manual"
  | "schedule"
  | "webhook"
  | "source_added"
  | string; // Composio trigger slugs (e.g. "GMAIL_NEW_GMAIL_MESSAGE")

export interface TriggerSettings {
  // Schedule
  scheduleFrequency?: "daily" | "weekly";
  scheduleTime?: string; // "HH:MM" (24h)
  scheduleDaysOfWeek?: number[]; // 0=Sun..6=Sat (for weekly)
  // Webhook
  webhookSecret?: string; // auto-generated on first save
  // Composio trigger
  composioTriggerSlug?: string;
  composioTriggerId?: string; // active instance ID after activation
  composioTriggerConfig?: Record<string, unknown>;
  // Platform event (no extra config — just triggerType = "source_added")
}
```

---

## 2. Triggers API Route

**File:** `src/app/api/agents/[agentId]/triggers/route.ts`

```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Composio } from "@composio/core";
import prisma from "@/config/db/prisma";
import { getUserByClerkId } from "@/lib/server/services/user.service";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

const BUILT_IN_TRIGGERS = [
  { slug: "manual", name: "Manual", description: "Run manually via button" },
  { slug: "schedule", name: "Schedule", description: "Run on a schedule" },
  { slug: "webhook", name: "Webhook", description: "Run via HTTP POST" },
  {
    slug: "source_added",
    name: "New Source Added",
    description: "Triggers when user adds a new source",
  },
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByClerkId(clerkUserId);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { agentId } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: user.id },
    select: { id: true, tools: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  // Fetch Composio triggers for the agent's connected toolkits
  let composioTriggers: Array<{
    slug: string;
    name: string;
    description: string;
    toolkit: { slug: string; name: string; logo: string };
    config: Record<string, unknown>;
  }> = [];

  const toolkitSlugs = (agent.tools as string[] | null) || [];

  if (toolkitSlugs.length > 0) {
    try {
      const triggers = await composio.triggers.listTypes({
        toolkits: toolkitSlugs,
      });

      composioTriggers = (triggers.items || []).map((t) => ({
        slug: t.slug,
        name: t.name,
        description: t.description,
        toolkit: {
          slug: t.toolkit.slug,
          name: t.toolkit.name,
          logo: t.toolkit.logo,
        },
        config: t.config || {},
      }));
    } catch (error) {
      console.error("Failed to fetch Composio triggers:", error);
    }
  }

  return NextResponse.json({
    builtIn: BUILT_IN_TRIGGERS,
    composio: composioTriggers,
  });
}
```

---

## 3. Trigger Types Hook

**File:** `src/hooks/use-trigger-types.ts`

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";

interface BuiltInTrigger {
  slug: string;
  name: string;
  description: string;
}

interface ComposioTrigger {
  slug: string;
  name: string;
  description: string;
  toolkit: { slug: string; name: string; logo: string };
  config: Record<string, unknown>;
}

export interface TriggerTypes {
  builtIn: BuiltInTrigger[];
  composio: ComposioTrigger[];
}

export function useTriggerTypes(agentId: string | null) {
  const [triggers, setTriggers] = useState<TriggerTypes>({
    builtIn: [],
    composio: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchTriggers = useCallback(async () => {
    if (!agentId) {
      setTriggers({ builtIn: [], composio: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/triggers`);
      if (res.ok) {
        const data = await res.json();
        setTriggers(data);
      }
    } catch (err) {
      console.error("Failed to fetch trigger types:", err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchTriggers();
  }, [fetchTriggers]);

  return { triggers, loading, refetch: fetchTriggers };
}
```

---

## 4. Composio Webhook Subscription

**File:** `src/lib/composio/webhook-subscription.ts`

```typescript
/**
 * Ensures the Composio webhook subscription is registered for this app.
 * Called once when the first Composio trigger is created.
 * Idempotent — safe to call multiple times.
 */

let registered = false;

export async function ensureComposioWebhookSubscription(appUrl: string) {
  if (registered) return;

  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    console.error("COMPOSIO_API_KEY not set, cannot register webhook");
    return;
  }

  const webhookUrl = `${appUrl}/api/webhooks/composio`;

  try {
    const res = await fetch(
      "https://backend.composio.dev/api/v3/webhook_subscriptions",
      {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          enabled_events: ["composio.trigger.message"],
        }),
      }
    );

    if (res.ok) {
      registered = true;
      console.log("Composio webhook subscription registered:", webhookUrl);
    } else {
      const body = await res.text();
      // 409 or similar means already registered — that's fine
      if (res.status === 409 || body.includes("already")) {
        registered = true;
        return;
      }
      console.error("Failed to register Composio webhook:", res.status, body);
    }
  } catch (error) {
    console.error("Error registering Composio webhook:", error);
  }
}
```

---

## 5. Composio Webhook Receiver

**File:** `src/app/api/webhooks/composio/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { start } from "workflow/api";
import prisma from "@/config/db/prisma";
import { executeWorkflow } from "@/lib/workflow/executor.workflow";
import type { Prisma } from "@prisma/client";
import type { AgentStep } from "@/lib/workflow/types";

/**
 * Composio Webhook Receiver
 *
 * Handles V3 webhook payloads from Composio.
 * Register this URL in Composio dashboard (Settings → Webhook) or via API:
 *   POST https://backend.composio.dev/api/v3/webhook_subscriptions
 *   { "webhook_url": "<APP_URL>/api/webhooks/composio", "enabled_events": ["composio.trigger.message"] }
 */

interface ComposioWebhookPayload {
  id: string;
  type: string; // "composio.trigger.message" | "composio.connected_account.expired"
  metadata: {
    log_id: string;
    trigger_slug: string;
    trigger_id: string; // The trigger instance ID — maps to our composioTriggerId
    connected_account_id: string;
    auth_config_id: string;
    user_id: string;
  };
  data: Record<string, unknown>;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: ComposioWebhookPayload = await request.json();

    // Only handle trigger message events
    if (payload.type !== "composio.trigger.message") {
      return NextResponse.json({ status: "ignored", type: payload.type });
    }

    const triggerId = payload.metadata?.trigger_id;
    if (!triggerId) {
      return NextResponse.json(
        { error: "Missing trigger_id in metadata" },
        { status: 400 }
      );
    }

    // Find workflows with this Composio trigger ID in their settings JSON
    const workflows = await prisma.$queryRaw<
      Array<{
        id: string;
        userId: string;
        steps: unknown;
      }>
    >`
      SELECT id, "userId", steps
      FROM "Workflow"
      WHERE settings::jsonb->>'composioTriggerId' = ${triggerId}
    `;

    if (!workflows.length) {
      return NextResponse.json(
        { error: "No workflow found for trigger", triggerId },
        { status: 404 }
      );
    }

    const executionIds: string[] = [];

    for (const workflow of workflows) {
      const steps = workflow.steps as unknown as AgentStep[];
      if (!steps.length) continue;

      // Pass both data and metadata so steps can access
      // {{trigger.fieldName}} from data, and {{trigger._meta.trigger_slug}} etc.
      const triggerInput: Record<string, unknown> = {
        ...payload.data,
        _meta: {
          triggerSlug: payload.metadata.trigger_slug,
          triggerId: payload.metadata.trigger_id,
          connectedAccountId: payload.metadata.connected_account_id,
          userId: payload.metadata.user_id,
          timestamp: payload.timestamp,
        },
      };

      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          userId: workflow.userId,
          status: "pending",
          input: triggerInput as unknown as Prisma.InputJsonValue,
        },
      });

      start(executeWorkflow, [
        execution.id,
        workflow.id,
        steps,
        triggerInput,
      ]);

      executionIds.push(execution.id);
    }

    return NextResponse.json({ status: "ok", executionIds });
  } catch (error) {
    console.error("Composio webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## 6. Custom Webhook Trigger Handler

**File:** `src/app/api/agents/[agentId]/automations/[workflowId]/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { start } from "workflow/api";
import prisma from "@/config/db/prisma";
import { executeWorkflow } from "@/lib/workflow/executor.workflow";
import type { Prisma } from "@prisma/client";
import type { AgentStep, TriggerSettings } from "@/lib/workflow/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string; workflowId: string }> }
) {
  const { agentId, workflowId } = await params;

  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret) {
    return NextResponse.json(
      { error: "Missing secret parameter" },
      { status: 401 }
    );
  }

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, agentId },
  });

  if (!workflow) {
    return NextResponse.json(
      { error: "Workflow not found" },
      { status: 404 }
    );
  }

  if (workflow.triggerType !== "webhook") {
    return NextResponse.json(
      { error: "Workflow is not configured for webhook trigger" },
      { status: 400 }
    );
  }

  const settings = (workflow.settings || {}) as TriggerSettings;
  if (settings.webhookSecret !== secret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
  }

  const steps = workflow.steps as unknown as AgentStep[];
  if (!steps.length) {
    return NextResponse.json(
      { error: "Workflow has no steps" },
      { status: 400 }
    );
  }

  // Parse request body as trigger input
  let triggerInput: Record<string, unknown> = {};
  try {
    triggerInput = await request.json();
  } catch {
    // No body is fine for webhook triggers
  }

  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      userId: workflow.userId,
      status: "pending",
      input: triggerInput as unknown as Prisma.InputJsonValue,
    },
  });

  start(executeWorkflow, [execution.id, workflow.id, steps, triggerInput]);

  return NextResponse.json({
    executionId: execution.id,
    status: "pending",
  });
}
```

---

## 7. Automations API - Create Workflow

**File:** `src/app/api/agents/[agentId]/automations/route.ts`

The POST handler includes Composio trigger activation logic:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Composio } from "@composio/core";
import prisma from "@/config/db/prisma";
import { getUserByClerkId } from "@/lib/server/services/user.service";
import type { Prisma } from "@prisma/client";
import type { TriggerSettings } from "@/lib/workflow/types";
import { ensureComposioWebhookSubscription } from "@/lib/composio/webhook-subscription";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByClerkId(clerkUserId);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { agentId } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const workflows = await prisma.workflow.findMany({
    where: { agentId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(workflows);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByClerkId(clerkUserId);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { agentId } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, userId: user.id },
    select: { id: true, name: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));

  const triggerType: string = body.triggerType || "manual";
  const settings: TriggerSettings = body.settings || {};

  // Auto-generate webhook secret for webhook triggers
  if (triggerType === "webhook" && !settings.webhookSecret) {
    settings.webhookSecret = crypto.randomUUID();
  }

  // Activate Composio trigger if it's a Composio trigger type
  if (
    triggerType !== "manual" &&
    triggerType !== "schedule" &&
    triggerType !== "webhook" &&
    triggerType !== "source_added" &&
    settings.composioTriggerSlug
  ) {
    try {
      // Look up the connected account for this user + trigger's toolkit
      const accounts = await composio.connectedAccounts.list({
        userIds: [clerkUserId],
        statuses: ["ACTIVE"],
      } as Parameters<typeof composio.connectedAccounts.list>[0]);

      // Find the connected account whose toolkit matches the trigger slug prefix
      const triggerSlug = settings.composioTriggerSlug!;
      const toolkitPrefix = triggerSlug.split("_")[0]?.toLowerCase();
      const account = (accounts.items as Array<{ id: string; toolkit: { slug: string } }>).find(
        (a) => a.toolkit?.slug?.toLowerCase() === toolkitPrefix
      );

      // Ensure our webhook URL is registered with Composio
      const origin = request.headers.get("origin") ?? new URL(request.url).origin;
      await ensureComposioWebhookSubscription(origin);

      const result = await composio.triggers.create(
        clerkUserId,
        triggerSlug,
        {
          connectedAccountId: account?.id,
          triggerConfig: settings.composioTriggerConfig || {},
        }
      );
      settings.composioTriggerId = result.triggerId;
    } catch (error) {
      console.error("Failed to activate Composio trigger:", error);
    }
  }

  const workflow = await prisma.workflow.create({
    data: {
      userId: user.id,
      agentId,
      name: body.name || "New Automation",
      description: body.description || "",
      steps: body.steps || [],
      triggerType,
      settings: settings as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json(workflow, { status: 201 });
}
```

---

## 8. Automations API - Update Workflow

**File:** `src/app/api/agents/[agentId]/automations/[workflowId]/route.ts`

The PATCH handler includes Composio trigger activation/deactivation logic:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Composio } from "@composio/core";
import prisma from "@/config/db/prisma";
import { getUserByClerkId } from "@/lib/server/services/user.service";
import type { TriggerSettings } from "@/lib/workflow/types";
import { ensureComposioWebhookSubscription } from "@/lib/composio/webhook-subscription";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ agentId: string; workflowId: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByClerkId(clerkUserId);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { agentId, workflowId } = await params;

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, agentId, userId: user.id },
  });

  if (!workflow)
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

  return NextResponse.json(workflow);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ agentId: string; workflowId: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByClerkId(clerkUserId);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { agentId, workflowId } = await params;

  const existing = await prisma.workflow.findFirst({
    where: { id: workflowId, agentId, userId: user.id },
  });
  if (!existing)
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

  const body = await request.json();

  const data: Record<string, unknown> = {};
  const allowedFields = ["name", "description", "steps", "triggerType", "settings"];
  for (const key of allowedFields) {
    if (key in body) {
      data[key] = body[key];
    }
  }

  const oldSettings = (existing.settings || {}) as TriggerSettings;
  const newTriggerType = (data.triggerType as string) || existing.triggerType;
  const newSettings = (data.settings as TriggerSettings) || oldSettings;

  // Auto-generate webhook secret for webhook triggers
  if (newTriggerType === "webhook" && !newSettings.webhookSecret) {
    newSettings.webhookSecret = crypto.randomUUID();
    data.settings = newSettings;
  }

  // If switching away from a Composio trigger, deactivate the old one
  const isComposioTrigger = (type: string) =>
    type !== "manual" &&
    type !== "schedule" &&
    type !== "webhook" &&
    type !== "source_added";

  if (
    isComposioTrigger(existing.triggerType) &&
    oldSettings.composioTriggerId &&
    existing.triggerType !== newTriggerType
  ) {
    try {
      await composio.triggers.disable(oldSettings.composioTriggerId);
    } catch (error) {
      console.error("Failed to deactivate old Composio trigger:", error);
    }
  }

  // If activating a new Composio trigger
  if (
    isComposioTrigger(newTriggerType) &&
    newSettings.composioTriggerSlug &&
    !newSettings.composioTriggerId
  ) {
    try {
      // Look up the connected account for this user + trigger's toolkit
      const accounts = await composio.connectedAccounts.list({
        userIds: [clerkUserId],
        statuses: ["ACTIVE"],
      } as Parameters<typeof composio.connectedAccounts.list>[0]);

      const triggerSlug = newSettings.composioTriggerSlug!;
      const toolkitPrefix = triggerSlug.split("_")[0]?.toLowerCase();
      const account = (accounts.items as Array<{ id: string; toolkit: { slug: string } }>).find(
        (a) => a.toolkit?.slug?.toLowerCase() === toolkitPrefix
      );

      // Ensure our webhook URL is registered with Composio
      const origin = request.headers.get("origin") ?? new URL(request.url).origin;
      await ensureComposioWebhookSubscription(origin);

      const result = await composio.triggers.create(
        clerkUserId,
        triggerSlug,
        {
          connectedAccountId: account?.id,
          triggerConfig: newSettings.composioTriggerConfig || {},
        }
      );
      newSettings.composioTriggerId = result.triggerId;
      data.settings = newSettings;
    } catch (error) {
      console.error("Failed to activate Composio trigger:", error);
    }
  }

  const updated = await prisma.workflow.update({
    where: { id: workflowId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ agentId: string; workflowId: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByClerkId(clerkUserId);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { agentId, workflowId } = await params;

  const existing = await prisma.workflow.findFirst({
    where: { id: workflowId, agentId, userId: user.id },
  });
  if (!existing)
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

  await prisma.workflow.delete({ where: { id: workflowId } });

  return NextResponse.json({ success: true });
}
```

---

## 9. Cron Scheduled Trigger

**File:** `src/app/api/cron/automations/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { start } from "workflow/api";
import prisma from "@/config/db/prisma";
import { executeWorkflow } from "@/lib/workflow/executor.workflow";
import type { AgentStep, TriggerSettings } from "@/lib/workflow/types";

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const currentHour = now.getUTCHours().toString().padStart(2, "0");
  const currentMinute = now.getUTCMinutes().toString().padStart(2, "0");
  const currentTime = `${currentHour}:${currentMinute}`;
  const currentDay = now.getUTCDay(); // 0=Sun..6=Sat

  const workflows = await prisma.workflow.findMany({
    where: { triggerType: "schedule" },
  });

  let triggered = 0;

  for (const workflow of workflows) {
    const settings = (workflow.settings || {}) as TriggerSettings;

    if (!settings.scheduleTime) continue;

    // Check if time matches
    if (settings.scheduleTime !== currentTime) continue;

    // For weekly, check day of week
    if (settings.scheduleFrequency === "weekly") {
      const days = settings.scheduleDaysOfWeek || [];
      if (!days.includes(currentDay)) continue;
    }

    const steps = workflow.steps as unknown as AgentStep[];
    if (!steps.length) continue;

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        userId: workflow.userId,
        status: "pending",
        input: { trigger: "schedule", scheduledAt: now.toISOString() },
      },
    });

    start(executeWorkflow, [
      execution.id,
      workflow.id,
      steps,
      { trigger: "schedule", scheduledAt: now.toISOString() },
    ]);

    triggered++;
  }

  return NextResponse.json({
    ok: true,
    checked: workflows.length,
    triggered,
    time: currentTime,
    day: currentDay,
  });
}
```

---

## 10. Platform Events - Source Added

**File:** `src/lib/workflow/triggers/platform-events.ts`

```typescript
import prisma from "@/config/db/prisma";
import { start } from "workflow/api";
import { executeWorkflow } from "@/lib/workflow/executor.workflow";
import type { AgentStep } from "@/lib/workflow/types";

export async function fireSourceAddedTrigger(
  userId: string,
  payload: {
    sourceId: string;
    sourceType: string;
    sourceUrl: string;
    title?: string | null;
    content?: string | null;
    mediaUrl?: string | null;
  }
) {
  try {
    const workflows = await prisma.workflow.findMany({
      where: {
        userId,
        triggerType: "source_added",
      },
    });

    for (const workflow of workflows) {
      const steps = workflow.steps as unknown as AgentStep[];
      if (!steps.length) continue;

      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          userId,
          status: "pending",
          input: payload,
        },
      });

      start(executeWorkflow, [
        execution.id,
        workflow.id,
        steps,
        payload as unknown as Record<string, unknown>,
      ]);
    }
  } catch (error) {
    console.error("Failed to fire source_added triggers:", error);
  }
}
```

---

## 11. Automation Builder Panel UI

**File:** `src/components/agents/automation-builder-panel.tsx`

### Key Composio/Webhook UI sections:

**Webhook Trigger Config UI (lines 153-193):**
```tsx
if (triggerType === "webhook") {
  const webhookUrl = workflowId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/agents/${agentId}/automations/${workflowId}/webhook?secret=${settings.webhookSecret || "SAVE_TO_GENERATE"}`
    : "Save automation first to generate webhook URL";

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Webhook URL</Label>
      <div className="flex items-center gap-1.5">
        <Input value={webhookUrl} readOnly className="h-8 text-xs font-mono" />
        <Button variant="ghost" size="icon" className="size-8 shrink-0 cursor-pointer" onClick={handleCopy} disabled={!workflowId}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Send a POST request to this URL to trigger the automation. The request body will be available as {"{{trigger.*}}"} in steps.
      </p>
    </div>
  );
}
```

**Composio Trigger Config UI (lines 206-238):**
```tsx
// Composio trigger — show config fields
return (
  <div className="space-y-2">
    <p className="text-xs text-muted-foreground">
      This trigger is powered by a connected app. Configuration will be sent to the provider on save.
    </p>
    {settings.composioTriggerConfig &&
      Object.keys(settings.composioTriggerConfig).length > 0 && (
        <div className="space-y-2">
          {Object.entries(settings.composioTriggerConfig).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{key}</Label>
              <Input
                value={typeof val === "string" ? val : JSON.stringify(val)}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    composioTriggerConfig: { ...settings.composioTriggerConfig, [key]: e.target.value },
                  })
                }
                className="h-8 text-xs"
              />
            </div>
          ))}
        </div>
      )}
  </div>
);
```

**Composio trigger grouping in dropdown (lines 274-291, 406-416):**
```tsx
// useMemo to group Composio triggers by toolkit
const composioByApp = useMemo(() => {
  const map = new Map<string, { name: string; logo: string; triggers: typeof triggers.composio }>();
  for (const t of triggers.composio) {
    const key = t.toolkit.slug;
    if (!map.has(key)) {
      map.set(key, { name: t.toolkit.name || key, logo: t.toolkit.logo, triggers: [] });
    }
    map.get(key)!.triggers.push(t);
  }
  return map;
}, [triggers.composio]);

// In the Select dropdown:
{Array.from(composioByApp.entries()).map(([appSlug, app]) => (
  <SelectGroup key={appSlug}>
    <SelectLabel>{app.name}</SelectLabel>
    {app.triggers.map((t) => (
      <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>
    ))}
  </SelectGroup>
))}
```

**Composio detection in trigger change handler (lines 293-319):**
```tsx
const handleTriggerChange = useCallback((value: string) => {
  const isComposio =
    value !== "manual" && value !== "schedule" && value !== "webhook" && value !== "source_added";
  if (isNew) {
    setDraftTriggerType(value);
    setDraftSettings(isComposio ? { composioTriggerSlug: value, composioTriggerConfig: {} } : {});
  } else {
    updateTriggerType(value);
    updateSettings(isComposio ? { composioTriggerSlug: value, composioTriggerConfig: {} } : {});
  }
}, [isNew, updateTriggerType, updateSettings]);
```

**useTriggerTypes import and usage (line 33, 271):**
```tsx
import { useTriggerTypes } from "@/hooks/use-trigger-types";
// ...
const { triggers, loading: triggersLoading } = useTriggerTypes(agentId);
```

---

## 12. Workflow Executor

**File:** `src/lib/workflow/executor.workflow.ts`

(No Composio-specific code — kept for completeness since it handles `triggerInput`)

```typescript
import { resolveConfigTemplates } from "./template";
import type { AgentStep, StepResult } from "./types";
import { httpRequestStep } from "./steps/http-request.step";
import { conditionStep } from "./steps/condition.step";
import { aiCallStep } from "./steps/ai-call.step";
import { updateExecutionStatus, createStepLog, updateStepLog, createSkippedLogs } from "./db/workflowDb";

export async function executeWorkflow(
  executionId: string,
  workflowId: string,
  steps: AgentStep[],
  triggerInput?: Record<string, unknown>
) {
  "use workflow";
  // ... (executes steps with triggerInput available via {{trigger.*}} templates)
}
```

---

## 13. Template Resolution

**File:** `src/lib/workflow/template.ts`

(No Composio-specific code — kept for completeness since it resolves `{{trigger.*}}`)

```typescript
export function resolveTemplates(
  text: string,
  stepResults: StepResult[],
  triggerInput?: Record<string, unknown>
): string {
  // Resolves {{trigger.*}} and {{steps.*}} patterns
}

export function resolveConfigTemplates(
  config: Record<string, unknown>,
  stepResults: StepResult[],
  triggerInput?: Record<string, unknown>
): Record<string, unknown> {
  // Resolves templates in all string values of a config object
}
```

---

## 14. Vercel Config

**File:** `vercel.json`

```json
{
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*": {
      "maxDuration": 300
    }
  },
  "crons": [
    {
      "path": "/api/cron/automations",
      "schedule": "* * * * *"
    }
  ]
}
```

---

## Summary of What Gets Removed

### Files to Delete:
- `src/lib/composio/webhook-subscription.ts`
- `src/app/api/webhooks/composio/route.ts`
- `src/app/api/agents/[agentId]/automations/[workflowId]/webhook/route.ts`

### Files to Clean Up (remove Composio + webhook parts):
- `src/lib/workflow/types.ts` — Remove `"webhook"` from TriggerType, remove `webhookSecret`, `composioTriggerSlug`, `composioTriggerId`, `composioTriggerConfig` from TriggerSettings
- `src/app/api/agents/[agentId]/triggers/route.ts` — Remove Composio import/client/fetch, remove webhook from built-in triggers
- `src/hooks/use-trigger-types.ts` — Remove ComposioTrigger interface, simplify to only return built-in triggers
- `src/app/api/agents/[agentId]/automations/route.ts` — Remove Composio import/client, webhook secret generation, Composio trigger activation
- `src/app/api/agents/[agentId]/automations/[workflowId]/route.ts` — Remove Composio import/client, webhook secret generation, Composio trigger activation/deactivation
- `src/components/agents/automation-builder-panel.tsx` — Remove webhook UI, Composio trigger UI, Composio grouping logic, useTriggerTypes dependency simplification

### Triggers Remaining After Cleanup:
1. **Manual** — Run via play button
2. **Schedule** — Run on cron (daily/weekly)
3. **Platform Event (source_added)** — When a new source is added
