# Agents Feature - Full End-to-End Plan

## Context
Build an agent builder feature where users configure AI agents via a settings UI. The critical piece is how saved settings **translate into a working execution pipeline** - the agent's instructions become the system prompt, its model overrides the default, its tools filter Composio toolkits, and its knowledge gets injected as context.

---

## Part 1: Data Model (Prisma Schema)

### Add to `prisma/schema.prisma`:

```prisma
enum AgentStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum AgentExecutionStatus {
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

model Agent {
  id           String           @id @default(cuid())
  userId       String
  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  name         String
  description  String?          @db.Text
  avatar       String?
  instructions String?          @db.Text    // → becomes system prompt
  model        String           @default("google/gemini-2.5-flash-lite")  // → overrides model selection
  triggers     Json?            // [{ type: "manual"|"schedule"|"webhook", config: {} }]
  tools        Json?            // ["gmail","slack"] → filters Composio toolkits
  knowledge    Json?            // [{ type:"source"|"document", id:"...", title:"..." }] → injected as context
  skills       Json?            // future
  status       AgentStatus      @default(DRAFT)
  isTemplate   Boolean          @default(false)
  templateId   String?
  metadata     Json?
  chats        AgentChat[]
  executions   AgentExecution[]
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  @@unique([userId, name])
  @@index([userId, status])
}

model AgentChat {
  id        String   @id @default(cuid())
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  chatId    String   @unique
  chat      Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@index([agentId])
}

model AgentExecution {
  id          String               @id @default(cuid())
  agentId     String
  agent       Agent                @relation(fields: [agentId], references: [id], onDelete: Cascade)
  chatId      String?
  triggerType String               @default("manual") // manual | schedule | webhook
  status      AgentExecutionStatus @default(RUNNING)
  startedAt   DateTime             @default(now())
  completedAt DateTime?
  durationMs  Int?
  tokenUsage  Json?                // { promptTokens, completionTokens, totalTokens }
  creditsCost Int                  @default(0)
  error       String?              @db.Text
  metadata    Json?
  logs        AgentExecutionLog[]

  @@index([agentId, startedAt(sort: Desc)])
  @@index([status])
}

model AgentExecutionLog {
  id          String         @id @default(cuid())
  executionId String
  execution   AgentExecution @relation(fields: [executionId], references: [id], onDelete: Cascade)
  level       String         @default("INFO")   // INFO | WARN | ERROR | DEBUG
  stepType    String                             // SYSTEM_PROMPT | TOOL_CALL | TOOL_RESULT | MODEL_RESPONSE | KNOWLEDGE_FETCH | CREDIT_CHECK
  message     String         @db.Text
  metadata    Json?
  createdAt   DateTime       @default(now())

  @@index([executionId, createdAt])
}
```

Add `agents Agent[]` to `User` model, `agentChat AgentChat?` to `Chat` model.

---

## Part 2: Settings → Execution Translation

This is the core of the architecture. Here's how each setting field maps to the execution pipeline:

### How It Works at Runtime (`/api/agents/[id]/chat/route.ts`)

```
User sends message to agent
        ↓
1. Fetch Agent from DB (get all settings)
        ↓
2. INSTRUCTIONS → System Prompt
   - agent.instructions replaces buildSystemPrompt()
   - If empty, fallback: "You are a helpful AI assistant named {agent.name}."
        ↓
3. KNOWLEDGE → Context Injection (appended to system prompt)
   - Loop through agent.knowledge[] refs
   - Fetch each source/document content from DB (same as fetchSourceContext)
   - Append as "KNOWLEDGE BASE" sections to the system prompt
   - e.g.: "--- KNOWLEDGE: {title} ---\n{content}\n"
        ↓
4. TOOLS → Filtered Composio Session
   - agent.tools = ["gmail", "slack"]
   - createToolSession() but FILTER to only agent's toolkit slugs
   - New function: createAgentToolSession(clerkUserId, agentToolkits)
   - Only connects tools the agent is configured to use
        ↓
5. MODEL → Override Model Selection
   - Use agent.model directly (skip user preference lookup)
   - Still validate against AVAILABLE_MODELS
   - Still check Pro tier access for non-default models
        ↓
6. TRIGGERS → How Agent is Invoked (Phase 2 - start with manual only)
   - manual: user clicks "Run" or chats
   - schedule: cron job hits webhook (future)
   - webhook: external service hits endpoint (future)
        ↓
7. AgentExecution tracking:
   - Create AgentExecution record (status: RUNNING)
   - Log each step via AgentExecutionLog
   - On finish: update status to COMPLETED, record duration + tokens
   - On error: update status to FAILED, record error
        ↓
8. Standard execution continues:
   - Credit deduction (same CHAT_MESSAGE_COST)
   - streamText() with agent's model, prompt, tools
   - Save messages to Chat linked via AgentChat
   - Langfuse tracing with agentId in metadata
```

### System Prompt Assembly (pseudocode):
```typescript
function buildAgentSystemPrompt(agent: Agent): string {
  let prompt = agent.instructions || `You are ${agent.name}, a helpful AI assistant.`;

  // Inject knowledge
  if (agent.knowledge?.length) {
    prompt += "\n\n--- KNOWLEDGE BASE ---\n";
    for (const ref of agent.knowledge) {
      const content = await fetchKnowledgeContent(ref);
      prompt += `\n### ${ref.title}\n${content}\n`;
    }
    prompt += "\n--- END KNOWLEDGE BASE ---\n";
    prompt += "\nUse the knowledge base above to inform your responses.";
  }

  // Tool instructions
  if (agent.tools?.length) {
    prompt += `\nYou have access to: ${agent.tools.join(", ")}. Use them when helpful.`;
  }

  return prompt;
}
```

---

## Part 3: File Structure

```
NEW FILES:
src/lib/agents/
  agent-types.ts              # TypeScript interfaces
  agent-templates.ts          # Static template definitions

src/lib/server/services/
  agent.service.ts            # CRUD + business logic

src/app/api/agents/
  route.ts                    # GET (list) + POST (create)
  [id]/
    route.ts                  # GET + PUT + DELETE
    chat/
      route.ts                # POST - agent chat (THE KEY FILE)
  templates/
    route.ts                  # GET static templates

src/components/agents/
  agent-card.tsx              # Card for listing grid
  agent-template-card.tsx     # Template card
  agent-builder-layout.tsx    # Split-screen wrapper
  agent-builder-form.tsx      # Right-half settings form
  agent-preview-chat.tsx      # Left-half chat (wraps ChatInterface)

src/app/(dashboard)/agents/
  page.tsx                    # REPLACE ComingSoon → listing page
  new/
    page.tsx                  # Creates draft, redirects to [id]
  [id]/
    page.tsx                  # Builder/editor page

MODIFIED FILES:
prisma/schema.prisma          # Add Agent, AgentChat, AgentExecution, AgentExecutionLog models
src/components/chat/ChatInterface.tsx  # Add apiEndpoint prop
src/components/chat/ChatPromptInput.tsx # Add hide* props
```

---

## Part 4: Agent Chat API Route (The Critical File)

`src/app/api/agents/[id]/chat/route.ts` - Based on existing `/api/chat/route.ts` but with agent overrides:

```
POST /api/agents/:agentId/chat

Request Body: {
  messages: UIMessage[],
  chatId?: string      // continue existing conversation
}

Flow:
1. Auth (Clerk) → get user
2. Fetch agent by id → verify agent.userId === user.id
3. Access check (featureId: "chat:start", credits: CHAT_MESSAGE_COST)
4. Credit check + deduction
5. Create AgentExecution record (status: RUNNING)
6. Log SYSTEM_PROMPT step
7. Build system prompt from agent.instructions + agent.knowledge
8. Create filtered tool session from agent.tools (if any)
9. Log KNOWLEDGE_FETCH / TOOL_CALL steps as needed
10. Create/reuse Chat + link via AgentChat
11. Save user message
12. streamText({
      model: agent.model,
      system: agentSystemPrompt,
      messages: convertedMessages,
      tools: filteredTools,
    })
13. onFinish: save assistant message, generate title, update execution (COMPLETED, duration, tokens)
14. onError: update execution (FAILED, error message)
15. Return streaming response with X-Chat-Id header
```

Key difference from `/api/chat/route.ts`:
- No `buildSystemPrompt(contexts)` → uses `buildAgentSystemPrompt(agent)`
- No user model preference lookup → uses `agent.model`
- No `enableWebSearch`/`enableTools` toggles → agent settings control this
- Filtered tool session → only agent's configured tools
- AgentChat junction table links chat to agent
- AgentExecution + AgentExecutionLog tracking each run

---

## Part 5: Service Layer

### `src/lib/server/services/agent.service.ts`

Following patterns from `chat.service.ts`:

```typescript
// CRUD
createAgent(userId, data: AgentFormData) → string (id)
getAgentById(agentId, userId) → Agent | null (with ownership check)
getAgents(userId) → AgentSummary[]
updateAgent(agentId, userId, data: Partial<AgentFormData>) → boolean
deleteAgent(agentId, userId) → boolean

// Template
createAgentFromTemplate(userId, templateId) → string (new agent id)

// Knowledge resolution
resolveAgentKnowledge(knowledge: KnowledgeRef[], userId) → string (concatenated content)

// Tool session (filtered)
createAgentToolSession(clerkUserId, agentTools: string[]) → UserToolSession
  - Calls composio.connectedAccounts.list()
  - Filters to only accounts matching agent.tools slugs
  - Creates session with filtered toolkits

// Execution tracking
createExecution(agentId, triggerType) → string (execution id)
logExecutionStep(executionId, level, stepType, message, metadata?) → void
completeExecution(executionId, tokenUsage?, creditsCost?) → void
failExecution(executionId, error) → void
getExecutions(agentId, userId, options?) → paginated list
```

---

## Part 6: UI - Agents Listing Page

### `src/app/(dashboard)/agents/page.tsx` (replace ComingSoon)

```
AgentsPage
├── Header: "Agents" title + "Create New Agent" Button (→ /agents/new)
├── "My Agents" Section
│   ├── Grid of AgentCard (fetched via fetch from /api/agents)
│   └── Empty state: illustration + "Create your first agent"
└── "Get Started with Templates" Section
    └── Grid of AgentTemplateCard (from /api/agents/templates)
```

**AgentCard**: shadcn Card with Avatar, name, description (truncated), status Badge, model label. Click → `/agents/[id]`. Dropdown menu: Edit, Delete.

**AgentTemplateCard**: Card with Lucide icon, name, description, category badge. "Use Template" button → POST `/api/agents` with template data → redirect to `/agents/[newId]`.

---

## Part 7: UI - Agent Builder Page (Split-Screen)

### `src/app/(dashboard)/agents/[id]/page.tsx`

```
AgentBuilderLayout (client component, state: settingsOpen)
├── Left Half (flex-1, expands when settings closed)
│   ├── Top: Avatar + Agent Name + Description
│   ├── Settings toggle button (when panel closed)
│   └── Bottom (flex-1): AgentPreviewChat
│       └── ChatInterface with overrides:
│           - apiEndpoint="/api/agents/{id}/chat"
│           - hideContextUI=true
│           - hideModelSelector=true
│           - placeholder="Test your agent..."
│
└── Right Half (w-1/2, border-l, scroll-y, conditionally rendered)
    └── AgentBuilderForm
        ├── Name (Input)
        ├── Description (Textarea)
        ├── Triggers (Manual only for now, with "Schedule" & "Webhook" as disabled/coming soon)
        ├── Instructions (large Textarea - "What should this agent do?")
        ├── Tools & Access (checkboxes/switches for connected apps from /api/apps)
        ├── Model (Select from AVAILABLE_MODELS)
        ├── Knowledge (attach sources - reuse source selector pattern)
        ├── Skills (coming soon placeholder)
        └── Save Button → PUT /api/agents/[id] → setSettingsOpen(false)
```

### ChatInterface Modifications (minimal):
Add optional props to `ChatInterface`:
- `apiEndpoint?: string` (default `/api/chat`) → passed to `DefaultChatTransport({ api: ... })`
- `hideContextUI?: boolean` → hides source/template attachment chips
- `hideModelSelector?: boolean` → hides model picker in ChatPromptInput
- `placeholder?: string` → custom input placeholder

These are passed through to `ChatPromptInput` which already accepts `placeholder` and can conditionally render UI elements.

---

## Part 8: Agent Templates (Static Data)

### `src/lib/agents/agent-templates.ts`

4 starter templates:

| Template | Instructions Summary | Tools | Icon |
|----------|---------------------|-------|------|
| Content Writer | Professional content creation from sources | none | FileText |
| Research Assistant | Analyze, summarize, extract insights | none | Search |
| Social Media Manager | Craft platform-specific posts | none | Share2 |
| Email Assistant | Draft professional emails | gmail | Mail |

Templates are static objects. Creating from template = POST new agent with template's instructions/model/tools pre-filled.

---

## Part 9: Implementation Order

### Step 1: Database (schema + migration)
- Add Agent, AgentChat, AgentExecution, AgentExecutionLog to schema
- Update User, Chat relations
- Run `npx prisma migrate dev --name add-agents`

### Step 2: Types + Templates
- `src/lib/agents/agent-types.ts`
- `src/lib/agents/agent-templates.ts`

### Step 3: Agent Service
- `src/lib/server/services/agent.service.ts` (CRUD + knowledge resolution + filtered tool session + execution tracking)

### Step 4: CRUD API Routes
- `src/app/api/agents/route.ts` (GET list + POST create)
- `src/app/api/agents/[id]/route.ts` (GET + PUT + DELETE)
- `src/app/api/agents/templates/route.ts` (GET static templates)

### Step 5: Agent Chat API Route
- `src/app/api/agents/[id]/chat/route.ts` (the critical execution pipeline)
- Based on `/api/chat/route.ts` with agent overrides + execution tracking

### Step 6: Listing Page
- `src/components/agents/agent-card.tsx`
- `src/components/agents/agent-template-card.tsx`
- Replace `src/app/(dashboard)/agents/page.tsx`

### Step 7: ChatInterface Modifications
- Add `apiEndpoint`, `hideContextUI`, `hideModelSelector`, `placeholder` props
- Minimal changes, backward compatible

### Step 8: Builder Components
- `src/components/agents/agent-preview-chat.tsx`
- `src/components/agents/agent-builder-form.tsx`
- `src/components/agents/agent-builder-layout.tsx`

### Step 9: Builder Pages
- `src/app/(dashboard)/agents/new/page.tsx`
- `src/app/(dashboard)/agents/[id]/page.tsx`

---

## Verification Plan
1. `npx prisma migrate dev` succeeds
2. `npm run build` - no type errors
3. Visit `/agents` → listing page with templates, empty "My Agents"
4. Click template → agent created, redirected to builder
5. Fill settings form, save → settings panel closes
6. Type in chat preview → message streams from agent with configured instructions/model
7. Return to `/agents` → new agent appears in "My Agents" grid
8. Edit agent → settings reopen with saved values
9. Delete agent → removed from listing
10. Check AgentExecution records created for each chat interaction
11. Check AgentExecutionLog has step-by-step entries for debugging
