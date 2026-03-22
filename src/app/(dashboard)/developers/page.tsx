"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Code2,
  Copy,
  Check,
  Key,
  Plus,
  Webhook,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { toast } from "@/lib/toast";

// --- Dummy data ---

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  fullKey: string;
  created: string;
  lastUsed: string;
  scopes: string[];
  status: "Active" | "Revoked";
}

const apiKeys: ApiKey[] = [
  { id: "key_001", name: "Production — Main", prefix: "oc_live_9x2k", fullKey: "oc_live_9x2kF7mNpQ3vLwR8dG5tY1hJ4bKcXeWzA0", created: "2026-01-15", lastUsed: "2 min ago", scopes: ["agents:read", "agents:write", "mandates:read", "mandates:write"], status: "Active" },
  { id: "key_002", name: "Production — Read Only", prefix: "oc_live_4m7p", fullKey: "oc_live_4m7pT2bXqK9wHsE5fN8rC1jDmLgUyI6oP3", created: "2026-02-01", lastUsed: "1 hr ago", scopes: ["agents:read", "mandates:read", "audit:read"], status: "Active" },
  { id: "key_003", name: "Staging", prefix: "oc_test_1b3q", fullKey: "oc_test_1b3qY6nRvM4cJwP7kS9tH2xBfE8dG5lA0mN", created: "2026-01-10", lastUsed: "3 days ago", scopes: ["agents:read", "agents:write", "mandates:read", "mandates:write"], status: "Active" },
  { id: "key_004", name: "Legacy Integration", prefix: "oc_live_8f2w", fullKey: "oc_live_8f2wL5kDtG1bNxS3pQ7rY9mCjE4hF6vI0wU", created: "2025-09-01", lastUsed: "30 days ago", scopes: ["mandates:read"], status: "Revoked" },
];

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: "Active" | "Failing" | "Disabled";
  lastDelivery: string;
  successRate: string;
}

const webhooks: WebhookEndpoint[] = [
  { id: "wh_001", url: "https://api.acme.com/webhooks/opencard", events: ["mandate.created", "mandate.revoked", "transaction.completed"], status: "Active", lastDelivery: "30s ago", successRate: "100%" },
  { id: "wh_002", url: "https://billing.acme.com/hooks/payments", events: ["transaction.completed", "transaction.failed"], status: "Active", lastDelivery: "2 min ago", successRate: "99.8%" },
  { id: "wh_003", url: "https://security.acme.com/alerts", events: ["anomaly.detected", "policy.violation"], status: "Failing", lastDelivery: "1 hr ago", successRate: "87.3%" },
];

const quickStartCode = `import { OpenCard } from '@opencard/sdk';

const client = new OpenCard({
  apiKey: process.env.OPENCARD_API_KEY,
});

// Register a new agent
const agent = await client.agents.create({
  name: 'procurement-agent-01',
  type: 'procurement',
  credentials: ['spending-authority'],
});

// Create a mandate
const mandate = await client.mandates.create({
  agentId: agent.id,
  scope: {
    categories: ['office-supplies'],
    merchantIds: ['AMZ_BIZ'],
  },
  limits: {
    perTransaction: 10_000,
    monthly: 50_000,
    currency: 'USD',
  },
  validUntil: '2026-12-31',
});

console.log('Mandate created:', mandate.id);`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7">
      {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function WebhookStatusBadge({ status }: { status: "Active" | "Failing" | "Disabled" }) {
  const variants = {
    Active: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
    Failing: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
    Disabled: "bg-muted text-muted-foreground border-border",
  };
  return <Badge variant="outline" className={variants[status]}>{status}</Badge>;
}

export default function DevelopersPage() {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-medium tracking-tight">SDK & Docs</h1>
            <p className="text-sm text-muted-foreground">API keys, quick start guides, and webhook management</p>
          </div>
        </div>

        {/* API Keys */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API keys for accessing the OpenCard platform</CardDescription>
            </div>
            <Button size="sm" onClick={() => toast.success("API key created!", { description: "New key: oc_live_new1... — copy it now, it won't be shown again." })}><Plus className="mr-2 h-4 w-4" />Create Key</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {visibleKeys.has(key.id) ? key.fullKey : `${key.prefix}...`}
                        </code>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleKeyVisibility(key.id)}>
                          {visibleKeys.has(key.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((scope) => (
                          <Badge key={scope} variant="secondary" className="text-xs">{scope}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{key.created}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{key.lastUsed}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={key.status === "Active" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"}>
                        {key.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <CopyButton text={key.fullKey} />
                        {key.status === "Active" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={() => toast.warning(`API key "${key.name}" revoked`, { description: "This key can no longer be used for authentication." })}><Trash2 className="h-3 w-3" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>Get started with the OpenCard SDK in minutes</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">TypeScript</Badge>
              <CopyButton text={quickStartCode} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto">
                <code>{quickStartCode}</code>
              </pre>
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Install:</span>
                <code className="bg-muted px-2 py-0.5 rounded text-xs">npm install @opencard/sdk</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Configure webhook endpoints for real-time event notifications</CardDescription>
            </div>
            <Button size="sm" onClick={() => toast.success("Webhook endpoint added!", { description: "Configure the events you want to subscribe to." })}><Plus className="mr-2 h-4 w-4" />Add Endpoint</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Delivery</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id} className="hover:bg-muted/50">
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{webhook.url}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">{event}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell><WebhookStatusBadge status={webhook.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{webhook.lastDelivery}</TableCell>
                    <TableCell className="text-sm">{webhook.successRate}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.info(`Editing webhook: ${webhook.url}`)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={() => toast.warning("Webhook endpoint deleted", { description: `${webhook.url} will no longer receive events.` })}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
