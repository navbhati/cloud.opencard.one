

# OpenCard Enterprise Dashboard

## Platform Architecture \& Page-by-Page Blueprint


---

## SIDEBAR NAVIGATION STRUCTURE

```
┌─────────────────────────────┐
│  [OpenCard Logo]            │
│  Acme Corp ▾  (org switcher)│
├─────────────────────────────┤
│                             │
│  OVERVIEW                   │
│  ◉ Dashboard                │
│                             │
│  AGENTS                     │
│  ◉ Agent Registry           │
│  ◉ Mandate Manager          │
│  ◉ Identity & KYA           │
│                             │
│  GOVERNANCE                 │
│  ◉ Policy Engine            │
│  ◉ Audit Trail              │
│  ◉ Anomaly Detection        │
│                             │
│  PROTOCOLS                  │
│  ◉ Protocol Bridge          │
│                             │
│  COMPLIANCE                 │
│  ◉ Compliance Reports       │
│  ◉ Kill Switch              │
│                             │
│  DEVELOPERS                 │
│  ◉ API Keys                 │
│  ◉ Webhooks                 │
│  ◉ SDK & Docs               │
│                             │
│  SETTINGS                   │
│  ◉ Organisation             │
│  ◉ Team & Permissions       │
│  ◉ Billing                  │
├─────────────────────────────┤
│  [?] Help & Docs            │
│  [⭐] GitHub                │
│  [@] naveen@acme.com        │
└─────────────────────────────┘
```


***

## PAGE 1 — DASHBOARD (Home)

**Purpose:** At-a-glance health of the entire agentic payment estate across all agents, protocols, and mandates.

```
┌──────────────────────────────────────────────────────────────────┐
│  Good morning, Naveen  ·  Acme Corp                              │
│  Sunday 22 March 2026  ·  ⚠ 2 anomalies require attention       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STAT CARDS (top row)                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 14       │ │ 847      │ │ £142,330 │ │ 2        │           │
│  │ Active   │ │ Mandates │ │ GMV This │ │ Active   │           │
│  │ Agents   │ │ Active   │ │ Month    │ │ Anomalies│           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 5        │ │ 99.2%    │ │ 3        │ │ 0        │           │
│  │ Protocols│ │ Mandate  │ │ Pending  │ │ Kill     │           │
│  │ Active   │ │ Compliance│ │ Approvals│ │ Switches │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MANDATE ACTIVITY (line chart)          PROTOCOL SPLIT          │
│  Transaction volume over 30 days        (donut chart)           │
│  Breakdown: AP2 / MPP / x402 / ACP      AP2: 41%               │
│  Y-axis: £GMV · X-axis: date            MPP: 28%               │
│                                         x402: 19%              │
│                                         ACP: 12%               │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TOP AGENTS BY SPEND (table)                                     │
│  Agent Name        Protocol   Mandates   Spend    Status        │
│  procurement-bot   AP2        142        £41,200  ✅ Compliant  │
│  travel-agent-v2   ACP        89         £18,450  ✅ Compliant  │
│  media-buyer-01    MPP        67         £12,300  ⚠ Review     │
│  saas-provisioner  x402       201        £9,100   ✅ Compliant  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RECENT MANDATE EVENTS              PENDING APPROVALS           │
│  09:14 - procurement-bot created    media-buyer-01 requesting   │
│          mandate #M-8821 (AP2)      £4,200 above daily limit   │
│  09:02 - travel-agent signed        [Approve] [Deny] [Review]  │
│          Cart Mandate #M-8820                                   │
│  08:51 - saas-provisioner           saas-provisioner requesting │
│          x402 bridge (USDC)         new vendor: aws-marketplace │
│                                     [Approve] [Deny] [Review]  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```


***

## PAGE 2 — AGENT REGISTRY

**Purpose:** Register, manage, and monitor every AI agent in the organisation. The single source of truth for agent identity.

```
┌──────────────────────────────────────────────────────────────────┐
│  Agent Registry                                                  │
│  14 agents registered · 12 active · 2 suspended                 │
│                                          [+ Register New Agent] │
├──────────────────────────────────────────────────────────────────┤
│  🔍 Search agents...  [Status ▾] [Protocol ▾] [Owner ▾] [Export]│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AGENT CARDS (grid or table toggle)                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🤖 procurement-bot-v2              ✅ Active            │    │
│  │ DID: did:opencard:procurement-bot-v2                    │    │
│  │ Owner: Naveen Bhati · Dept: Finance                     │    │
│  │ Protocols: AP2, x402                                    │    │
│  │ Mandates: 142 active · Last transaction: 2 mins ago     │    │
│  │ Spend this month: £41,200 / £60,000 limit ████████░░   │    │
│  │ Compliance: 100%  Trust Score: 94/100                   │    │
│  │ [View Mandates] [Edit Policy] [Suspend] [View DID ↗]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🤖 media-buyer-01                  ⚠ Under Review      │    │
│  │ DID: did:opencard:media-buyer-01                        │    │
│  │ Owner: Sarah Chen · Dept: Marketing                     │    │
│  │ Protocols: MPP, ACP                                     │    │
│  │ Mandates: 67 active · Last transaction: 14 mins ago     │    │
│  │ Spend this month: £12,300 / £15,000 limit ██████████░  │    │
│  │ Compliance: 91%  Trust Score: 76/100  ⚠ Anomaly flagged│    │
│  │ [View Mandates] [Edit Policy] [Suspend] [View DID ↗]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  REGISTER NEW AGENT (expandable form)                           │
│                                                                  │
│  Agent Name *        [procurement-bot-v3          ]             │
│  Agent Type *        [Procurement ▾               ]             │
│  Owner *             [Naveen Bhati ▾              ]             │
│  Department          [Finance ▾                  ]             │
│  Protocols           [✅ AP2] [✅ x402] [☐ MPP] [☐ ACP]        │
│  Capabilities        [inventory-check, vendor-compare, purchase]│
│  Credentials URL     [auto-generated if empty    ]             │
│  Description         [                           ]             │
│                                      [Register Agent] [Cancel] │
└──────────────────────────────────────────────────────────────────┘
```

**Agent Detail Page (drill-in):**

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Registry                                             │
│  🤖 procurement-bot-v2                          ✅ Active       │
│  did:opencard:procurement-bot-v2 [Copy] [View on Registry ↗]   │
├────────────────┬─────────────────────────────────────────────────┤
│  Overview      │  IDENTITY & CREDENTIALS                        │
│  Mandates      │  DID Document: [View Raw JSON]                 │
│  Transactions  │  Verifiable Credentials: 3 issued, 3 valid     │
│  Anomalies     │  Human Principal: Naveen Bhati (verified)      │
│  Audit Log     │  Credential Scope: office-supplies, cloud      │
│  Settings      │  Issued: 15 Jan 2026 · Expires: 15 Jan 2027   │
│                │  [Revoke Credential] [Re-issue]                │
│                ├─────────────────────────────────────────────────┤
│                │  SPEND SUMMARY (30 days)                       │
│                │  Total Spend:     £41,200                      │
│                │  Mandates Used:   142                          │
│                │  Avg per mandate: £290                         │
│                │  Protocol split:  AP2 72% · x402 28%          │
│                │  Compliance rate: 100%                         │
│                │  Trust score:     94 / 100                     │
└────────────────┴─────────────────────────────────────────────────┘
```


***

## PAGE 3 — MANDATE MANAGER

**Purpose:** Full lifecycle view of every mandate — create, inspect, delegate, scope, revoke. The operational heart of the platform.

```
┌──────────────────────────────────────────────────────────────────┐
│  Mandate Manager                                                 │
│  847 active mandates · 12 pending · 3 expired · 1 revoked       │
│                                         [+ Create Mandate]      │
├──────────────────────────────────────────────────────────────────┤
│  MANDATE TYPE TABS                                               │
│  [Intent Mandates] [Cart Mandates] [Payment Mandates] [All]     │
├──────────────────────────────────────────────────────────────────┤
│  🔍 Search mandates...  [Agent ▾] [Protocol ▾] [Status ▾] [Date]│
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MANDATE TABLE                                                   │
│  ID         Type    Agent              Protocol  Status  Spend  │
│  M-8821     Intent  procurement-bot    AP2      ✅ Active £500  │
│  M-8820     Cart    travel-agent-v2    ACP      ✅ Signed £890  │
│  M-8819     Intent  media-buyer-01     MPP      ⚠ Review £4,200│
│  M-8818     Payment saas-provisioner   x402     ✅ Settled £45  │
│  M-8817     Intent  procurement-bot    AP2      ⏳ Pending £200 │
│                                                                  │
│  [Showing 5 of 847 · Load more]                                  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  MANDATE DETAIL (click-through panel)                           │
│                                                                  │
│  Mandate ID:    M-8821                                          │
│  Type:          Intent Mandate                                  │
│  Agent:         did:opencard:procurement-bot-v2                 │
│  Protocol:      AP2                                             │
│  Status:        ✅ Active                                        │
│  Created:       22 Mar 2026, 09:14:32                           │
│  Expires:       22 Apr 2026, 23:59:59                           │
│                                                                  │
│  SCOPE                                                          │
│  Spend Limit:   £500 (£142 used · £358 remaining)              │
│  Currency:      GBP                                             │
│  Categories:    office-supplies, cloud-credits                  │
│  Merchants:     Any (no whitelist applied)                      │
│  Geography:     UK, EU                                          │
│  Time Window:   Mon–Fri 08:00–18:00 GMT                        │
│                                                                  │
│  CRYPTOGRAPHIC PROOF                                            │
│  Signature:     ECDSA-P256 ✅ Valid                             │
│  VC ID:         vc:opencard:M-8821-proof                       │
│  DID Document:  [View] [Download]                              │
│                                                                  │
│  [Revoke Mandate] [Extend] [Delegate] [Download Proof]         │
└──────────────────────────────────────────────────────────────────┘
```


***

## PAGE 4 — IDENTITY \& KYA

**Purpose:** The Know Your Agent trust registry — all agent DIDs, verifiable credentials, trust scores, and human principal bindings.

```
┌──────────────────────────────────────────────────────────────────┐
│  Identity & KYA — Know Your Agent                               │
│  Trust registry for all agents in your organisation             │
├──────────────────────────────────────────────────────────────────┤
│  TRUST SUMMARY CARDS                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 14       │ │ 38       │ │ 0        │ │ 94 avg   │          │
│  │ Agents   │ │ VCs      │ │ Revoked  │ │ Trust    │          │
│  │ Registered│ │ Issued   │ │ This Mo. │ │ Score    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
├──────────────────────────────────────────────────────────────────┤
│  CREDENTIAL REGISTRY TABLE                                      │
│                                                                  │
│  Agent DID                          Credentials  Score  Status │
│  did:opencard:procurement-bot-v2    3 VCs        94     ✅ Valid│
│  did:opencard:travel-agent-v2       2 VCs        89     ✅ Valid│
│  did:opencard:media-buyer-01        2 VCs        76     ⚠ Watch│
│  did:opencard:saas-provisioner      4 VCs        91     ✅ Valid│
│                                                                  │
│  [Issue New Credential] [Bulk Revoke] [Export Registry]        │
├──────────────────────────────────────────────────────────────────┤
│  ISSUE VERIFIABLE CREDENTIAL                                    │
│                                                                  │
│  Agent *            [Select agent ▾                ]            │
│  Credential Type *  [Intent Scope ▾               ]            │
│  Permitted Scope    [office-supplies, cloud-credits]            │
│  Spend Authority    [£ 5000          ] per [month ▾]           │
│  Merchant Whitelist [Add merchants...             ]            │
│  Valid From         [22 Mar 2026    ] Until [22 Mar 2027]      │
│  Human Principal *  [Naveen Bhati ▾               ]            │
│  Disclosure Level   [Full ◉] [Selective ◎] [Minimal ◎]        │
│                                                                  │
│                           [Issue Credential] [Cancel]          │
├──────────────────────────────────────────────────────────────────┤
│  TRUST SCORE BREAKDOWN (for selected agent)                     │
│  Mandate Compliance Rate:     100%   ████████████ +35 pts      │
│  No Policy Violations:         Yes   ████████████ +25 pts      │
│  Human Principal Verified:     Yes   ████████████ +20 pts      │
│  Transaction History (>30d):   Yes   ████████████ +14 pts      │
│  TOTAL TRUST SCORE:           94/100                           │
└──────────────────────────────────────────────────────────────────┘
```


***

## PAGE 5 — POLICY ENGINE

**Purpose:** The no-code governance control centre. Set, manage, and enforce spend policies per agent, per department, or org-wide.

```
┌──────────────────────────────────────────────────────────────────┐
│  Policy Engine                                                   │
│  Define and enforce spend policies across all agents            │
│                                            [+ Create Policy]    │
├──────────────────────────────────────────────────────────────────┤
│  POLICY TABS                                                     │
│  [Global Policies] [Agent Policies] [Department Policies] [Templates]│
├──────────────────────────────────────────────────────────────────┤
│  ACTIVE POLICIES                                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ 📋 Global: Enterprise Default Policy      ✅ Active   │     │
│  │ Applies to: All agents (14)                           │     │
│  │ Daily limit: £10,000 · Per-transaction: £5,000        │     │
│  │ HiTL threshold: £1,000 · Categories: No restrictions  │     │
│  │ Hours: Mon–Fri 07:00–20:00 GMT · Geographies: UK, EU  │     │
│  │ [Edit] [Clone] [Disable]                              │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ 📋 Agent: procurement-bot-v2          ✅ Active       │     │
│  │ Inherits: Enterprise Default + overrides below        │     │
│  │ Daily limit: £60,000 · Categories: office-supplies,   │     │
│  │ cloud-credits, saas · Vendors: AWS, Google, Slack +12 │     │
│  │ [Edit] [Clone] [Disable]                              │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  CREATE / EDIT POLICY (visual builder)                          │
│                                                                  │
│  Policy Name       [Finance Agent Policy Q2 2026    ]          │
│  Applies To        [◉ Agent] [◎ Department] [◎ Global]         │
│  Select Agent      [procurement-bot-v2 ▾            ]          │
│                                                                  │
│  💰 SPEND LIMITS                                               │
│  Daily Limit       [£ 60,000      ]                            │
│  Per Transaction   [£ 10,000      ]                            │
│  Monthly Cap       [£ 200,000     ]                            │
│                                                                  │
│  🏪 MERCHANT CONTROLS                                          │
│  Category Allow    [✅ office-supplies] [✅ saas] [✅ cloud]    │
│  Category Block    [❌ gambling] [❌ crypto-exchanges]           │
│  Vendor Whitelist  [AWS, Google Cloud, Slack, Notion... +8]    │
│                                                                  │
│  🕐 TIME CONTROLS                                              │
│  Active Hours      [08:00] to [20:00]  [✅ Mon-Fri] [☐ Sat-Sun]│
│                                                                  │
│  🌍 GEOGRAPHIC CONTROLS                                        │
│  Allowed Regions   [✅ UK] [✅ EU] [☐ US] [☐ APAC]             │
│                                                                  │
│  👤 HUMAN APPROVAL                                             │
│  Require HiTL above  [£ 5,000     ] per transaction           │
│  Require HiTL for    [☐ First-time vendors] [✅ New geographies]│
│  Approver            [Naveen Bhati ▾       ]                   │
│                                                                  │
│  🔔 ALERTS                                                     │
│  Alert at            [^80] % of daily limit                     │
│  Alert on            [✅ Policy violation] [✅ Unusual pattern]  │
│                                                                  │
│                         [Save Policy] [Test Policy] [Cancel]   │
└──────────────────────────────────────────────────────────────────┘
```


***

## PAGE 6 — AUDIT TRAIL

**Purpose:** Non-repudiable, tamper-proof record of every mandate event and transaction across every protocol surface. The FCA/CMA evidence vault.

```
┌──────────────────────────────────────────────────────────────────┐
│  Audit Trail                                                     │
│  Complete non-repudiable record of all mandate events           │
│                    [Export FCA Pack] [Export CMA Bundle] [CSV]  │
├──────────────────────────────────────────────────────────────────┤
│  AUDIT STATS                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 4,821    │ │ 0        │ │ 100%     │ │ Retained │          │
│  │ Total    │ │ Tampered │ │ Chain    │ │ 7 Years  │          │
│  │ Events   │ │ Records  │ │ Integrity│ │ FCA Req. │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
├──────────────────────────────────────────────────────────────────┤
│  FILTERS                                                        │
│  🔍 Search events...                                            │
│  [All Events ▾] [All Agents ▾] [All Protocols ▾] [Date Range ▾]│
│  [All Status ▾] [Risk Level ▾]                                 │
├──────────────────────────────────────────────────────────────────┤
│  EVENT LOG TABLE                                                │
│                                                                  │
│  Time         Event Type          Agent          Protocol Risk  │
│  09:14:32     Mandate Created     procurement    AP2    Low  ✅ │
│  09:14:29     Agent Verified      procurement    —      Low  ✅ │
│  09:02:11     Cart Mandate Signed travel-agent   ACP    Low  ✅ │
│  08:51:07     x402 Bridge Called  saas-prov      x402   Low  ✅ │
│  08:44:03     Policy Violation    media-buyer    MPP    High ⚠ │
│  08:44:03     HiTL Triggered      media-buyer    MPP    Med  🕐 │
│  08:30:00     Mandate Revoked     test-agent     AP2    Low  ✅ │
│  Yesterday    VC Issued           procurement    —      Low  ✅ │
│                                                                  │
│  [Click any row to expand full mandate chain proof]            │
├──────────────────────────────────────────────────────────────────┤
│  EVENT DETAIL (expanded row)                                    │
│                                                                  │
│  Event:         Policy Violation — Spend above daily limit     │
│  Timestamp:     22 Mar 2026, 08:44:03 UTC                      │
│  Agent:         did:opencard:media-buyer-01                    │
│  Protocol:      MPP (Stripe session)                           │
│  Mandate:       M-8819                                         │
│  Triggered:     Daily limit £12,300 / £15,000 (82%)           │
│  Action Taken:  HiTL approval requested · Transaction paused  │
│  Mandate Chain: [View full chain ↗]                           │
│  Cryptographic Proof: ECDSA-P256 ✅ Verified                  │
│  ISO 20022 Record: [Download PACS.008] [Download CAMT.053]    │
└──────────────────────────────────────────────────────────────────┘
```


***

## PAGE 7 — ANOMALY DETECTION

**Purpose:** AI-powered behavioural monitoring across all agents — flags deviations from mandate scope and baseline patterns in real time.

```
┌──────────────────────────────────────────────────────────────────┐
│  Anomaly Detection                                               │
│  AI-powered monitoring of mandate compliance and spend patterns  │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 2        │ │ 1        │ │ 0        │ │ 14/14    │          │
│  │ Active   │ │ High     │ │ Critical │ │ Agents   │          │
│  │ Anomalies│ │ Risk     │ │ Alerts   │ │ Monitored│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
├──────────────────────────────────────────────────────────────────┤
│  ACTIVE ANOMALIES                                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔴 HIGH RISK — media-buyer-01                          │   │
│  │ Detected: 08:44 today                                  │   │
│  │ Type: Spend velocity anomaly                           │   │
│  │ Detail: 3 transactions in 4 minutes totalling £4,200.  │   │
│  │ Baseline: avg £1,200/hr on Tuesdays. 3.5x above norm. │   │
│  │ Protocol: MPP (Stripe session)                         │   │
│  │ Mandate: M-8819 (Intent Mandate, ad-placements)        │   │
│  │ Action: HiTL triggered · Pending approval              │   │
│  │ [Approve & Continue] [Block Agent] [View Mandate] [Dismiss]│
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🟡 MEDIUM — saas-provisioner                           │   │
│  │ Detected: Yesterday 23:12                              │   │
│  │ Type: Out-of-hours transaction                         │   │
│  │ Detail: Transaction at 23:12 outside policy hours      │   │
│  │ (policy: Mon-Fri 08:00-20:00). Vendor: AWS APAC.       │   │
│  │ Amount: £45 (within limit). New geographic region.     │   │
│  │ [Mark Safe] [Update Policy] [View Audit Entry]         │   │
│  └─────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│  AGENT BEHAVIOUR BASELINES (chart)                             │
│  Select agent: [media-buyer-01 ▾]                              │
│  Metric: [Hourly spend ▾] · Period: [Last 30 days ▾]          │
│                                                                  │
│  [Spend chart showing baseline band + anomaly spike]           │
│  Grey band = normal range · Red dot = anomaly point            │
│                                                                  │
│  BASELINE STATS                                                │
│  Avg daily spend:     £1,840    Current: £12,300 ⚠            │
│  Avg transaction:     £180      Current: £1,400  ⚠            │
│  Typical hours:       09:00–17:00  Today: 08:44  ✅           │
│  Typical vendors:     Google Ads, Meta  New: TikTok Ads ⚠     │
└──────────────────────────────────────────────────────────────────┘
```


***

## PAGE 8 — PROTOCOL BRIDGE

**Purpose:** View and manage all active protocol surfaces — live status, mandate flow across each, bridge configuration.

```
┌──────────────────────────────────────────────────────────────────┐
│  Protocol Bridge                                                 │
│  Unified view of all active protocol connections                │
├──────────────────────────────────────────────────────────────────┤
│  PROTOCOL STATUS GRID                                           │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ AP2      │ │ MPP      │ │ x402     │ │ ACP      │          │
│  │ ✅ Live  │ │ ✅ Live  │ │ ✅ Live  │ │ ✅ Live  │          │
│  │ 142 mand.│ │ 67 sess. │ │ 201 call │ │ 89 check.│          │
│  │ £41.2K   │ │ £12.3K   │ │ £9.1K   │ │ £18.4K  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ Visa IC  │ │ MC Agent │ │ UCP      │                       │
│  │ ✅ Live  │ │ ✅ Live  │ │ 🔜 Soon  │                       │
│  │ Bridge   │ │ Bridge   │ │ Q2 2026  │                       │
│  └──────────┘ └──────────┘ └──────────┘                       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  PROTOCOL DETAIL — AP2 (selected)                              │
│                                                                  │
│  Mandate Version:     AP2 v0.1                                 │
│  W3C VC Support:      ✅ Full (DID, VC, SD-JSON, Revocation)  │
│  Agents on Protocol:  8 of 14                                  │
│  Mandates Active:     142                                      │
│  Bridge Status:       ✅ All downstream protocols connected    │
│  ISO 20022 Export:    ✅ Enabled                              │
│                                                                  │
│  UNIFIED MANDATE RECORD SAMPLE                                 │
│  Every AP2 mandate is translated to:                           │
│  [✅ Stripe ACP annotation]                                    │
│  [✅ MPP session scope]                                        │
│  [✅ x402 payment header]                                      │
│  [✅ Visa IC token metadata]                                   │
│  [✅ ISO 20022 PACS/CAMT record]                              │
│                                                                  │
│  One mandate. Every protocol. One audit trail.                 │
│                                    [View Bridge Config] [Docs] │
└──────────────────────────────────────────────────────────────────┘
```


***

## PAGE 9 — COMPLIANCE REPORTS

**Purpose:** Generate, schedule, and export regulatory compliance packages — FCA Consumer Duty, CMA evidence, ISO 20022, SOC 2.

```
┌──────────────────────────────────────────────────────────────────┐
│  Compliance Reports                                              │
│  FCA · CMA · ISO 20022 · SOC 2 · PCI DSS                       │
├──────────────────────────────────────────────────────────────────┤
│  COMPLIANCE HEALTH                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ ✅ Pass  │ │ ✅ Pass  │ │ 🟡 Review│ │ ✅ Pass  │          │
│  │ FCA      │ │ ISO 20022│ │ CMA DMCC │ │ PCI DSS  │          │
│  │ Consumer │ │ Export   │ │ Evidence │ │ Scope    │          │
│  │ Duty     │ │ Ready    │ │ Required │ │ Compliant│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
├──────────────────────────────────────────────────────────────────┤
│  REPORT TEMPLATES                                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────┐           │
│  │ 📄 FCA Consumer Duty Audit Pack                │           │
│  │ Evidence that all AI agents acted within        │           │
│  │ authorized scope and delivered fair outcomes.   │           │
│  │ Includes: mandate chain, policy evidence,       │           │
│  │ transaction records, human principal bindings.  │           │
│  │ Period: [Q1 2026 ▾]         [Generate] [Schedule]│          │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
│  ┌─────────────────────────────────────────────────┐           │
│  │ 📄 CMA DMCC Evidence Bundle                    │           │
│  │ Evidence that AI-driven commercial practices    │           │
│  │ were authorized, disclosed, and compliant.      │           │
│  │ Includes: agent scope VCs, mandate chain,       │           │
│  │ policy records, anomaly logs, HiTL decisions.   │           │
│  │ Period: [Custom ▾]           [Generate] [Schedule]│         │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
│  ┌─────────────────────────────────────────────────┐           │
│  │ 📄 ISO 20022 Transaction Export                │           │
│  │ Structured PACS.008 / CAMT.053 format mandate  │           │
│  │ records for CHAPS/SWIFT reporting.              │           │
│  │ Period: [March 2026 ▾]       [Export Now] [Auto]│           │
│  └─────────────────────────────────────────────────┘           │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  RECENT REPORTS                                                 │
│  FCA Pack Q1 2026          Generated 01 Apr  [Download] [Share]│
│  CMA Bundle — media-buyer  Generated 22 Mar  [Download] [Share]│
│  ISO 20022 March Export    Auto 01 Apr       [Scheduled]       │
└──────────────────────────────────────────────────────────────────┘
```


***

## PAGE 10 — KILL SWITCH

**Purpose:** Instant suspension of one, several, or all agent payment authorities across all PSPs and protocols simultaneously.

```
┌──────────────────────────────────────────────────────────────────┐
│  Kill Switch                   🔴 EMERGENCY SUSPEND ALL AGENTS  │
│  Instantly suspend agent payment authorities                    │
├──────────────────────────────────────────────────────────────────┤
│  ⚠ USE WITH CARE — Kill switch actions are logged,             │
│  non-reversible without manual re-authorisation,               │
│  and automatically included in FCA audit records.              │
├──────────────────────────────────────────────────────────────────┤
│  INDIVIDUAL AGENT CONTROLS                                      │
│                                                                  │
│  Agent                Protocol    Mandates  Status   Action    │
│  procurement-bot-v2   AP2, x402   142       ✅ Active [Suspend]│
│  travel-agent-v2      ACP         89        ✅ Active [Suspend]│
│  media-buyer-01       MPP, ACP    67        ⚠ Review  [Suspend]│
│  saas-provisioner     x402        201       ✅ Active [Suspend]│
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  BULK CONTROLS                                                  │
│                                                                  │
│  Suspend by:                                                    │
│  [☐ All Agents]  [Protocol: AP2 ▾]  [Dept: Finance ▾]         │
│                                                                  │
│  Reason (required):  [Security incident ▾ / free text]        │
│  Duration:           [Indefinite ▾] or [Until: date/time]     │
│  Notify:             [✅ Agent owner] [✅ Compliance team]      │
│                                                                  │
│  [🔴 Suspend Selected] [🔴 Suspend All Agents on Protocol]    │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  SUSPENSION LOG                                                 │
│  Date        Agent              Reason          Duration  By   │
│  22 Feb      test-agent-01      Dev testing     2 hours   NB  │
│  15 Jan      old-procurement    Decommissioned  Permanent NB  │
│                                                                  │
│  All suspensions are cryptographically logged and              │
│  included in FCA Consumer Duty and CMA audit exports.          │
└──────────────────────────────────────────────────────────────────┘
```


***

## PAGE 11 — API KEYS \& WEBHOOKS

**Purpose:** Developer credentials, SDK configuration, and webhook management.

```
┌──────────────────────────────────────────────────────────────────┐
│  API Keys                                          [+ New Key]  │
├──────────────────────────────────────────────────────────────────┤
│  ENVIRONMENTS                                                   │
│  [✅ Production] [🧪 Sandbox]                                   │
│                                                                  │
│  Key Name            Last Used    Permissions     Action       │
│  Production Key 1    2 mins ago   Full Access     [Revoke]     │
│  CI/CD Pipeline Key  Yesterday    Read Only       [Revoke]     │
│  Sandbox Test Key    1 hour ago   Sandbox Only    [Revoke]     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  QUICK START                                                    │
│                                                                  │
│  npm install @opencard/sdk                                      │
│                                                                  │
│  import { OpenCard } from '@opencard/sdk'                       │
│  const client = new OpenCard({ apiKey: 'oc_live_••••••••' })   │
│                                                                  │
│  [📖 Full Docs] [⭐ GitHub] [💬 Discord]                       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  WEBHOOKS                                          [+ Add URL]  │
│                                                                  │
│  Endpoint URL                Events              Status        │
│  https://acme.com/webhooks   mandate.created     ✅ Active     │
│                              mandate.revoked                   │
│                              anomaly.detected                  │
│                              hitl.triggered                    │
│                                               [Edit] [Delete]  │
└──────────────────────────────────────────────────────────────────┘
```


***

## NAVIGATION SUMMARY — FEATURE MATRIX

| Page | Free | Growth | Enterprise |
| :-- | :-- | :-- | :-- |
| Dashboard | ✅ Limited | ✅ Full | ✅ Full |
| Agent Registry | ✅ 5 agents | ✅ 50 agents | ✅ Unlimited |
| Mandate Manager | ✅ 1K/mo | ✅ 100K/mo | ✅ Unlimited |
| Identity \& KYA | ✅ Basic | ✅ Full | ✅ Full + Registry |
| Policy Engine | ❌ | ✅ Basic | ✅ Advanced |
| Audit Trail | ✅ 30 days | ✅ 1 year | ✅ 7 years |
| Anomaly Detection | ❌ | ✅ Basic | ✅ AI-powered |
| Protocol Bridge | ✅ AP2+x402 | ✅ All 5 | ✅ All + custom |
| Compliance Reports | ❌ | ❌ | ✅ FCA+CMA+ISO |
| Kill Switch | ❌ | ✅ Per-agent | ✅ Full + bulk |
| API Keys | ✅ 1 key | ✅ 10 keys | ✅ Unlimited |
| Webhooks | ❌ | ✅ 3 endpoints | ✅ Unlimited |


***

The key design principles differentiating this from Ralio's four-page utility dashboard:

1. **Mandate-first** — every page centres on the mandate lifecycle, not just payment methods
2. **Compliance as core UX** — FCA/CMA export is a top-level page, not buried in settings
3. **Protocol bridge is visible** — agents' cross-protocol activity is surfaced, not abstracted away
4. **Trust scores and KYA** — agent identity health is a first-class metric shown everywhere
5. **Kill switch gets its own page** — not a toggle hidden in guardrails — it's a deliberate, logged, auditable action

