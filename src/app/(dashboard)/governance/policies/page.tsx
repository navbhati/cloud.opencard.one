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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ShieldCheck,
  Plus,
  Globe,
  Bot,
  Building2,
} from "lucide-react";
import { toast } from "@/lib/toast";

// --- Dummy data ---

type PolicyStatus = "Active" | "Draft" | "Disabled";

interface Policy {
  id: string;
  name: string;
  scope: "Global" | "Agent" | "Department";
  type: string;
  description: string;
  status: PolicyStatus;
  lastModified: string;
  appliedTo: string;
}

const policies: Policy[] = [
  { id: "pol_001", name: "Global Spend Cap", scope: "Global", type: "Spend Limit", description: "Maximum $500,000/mo aggregate spend across all agents", status: "Active", lastModified: "2026-03-10", appliedTo: "All agents" },
  { id: "pol_002", name: "Merchant Allowlist — Procurement", scope: "Department", type: "Merchant Control", description: "Restrict procurement agents to approved vendor list", status: "Active", lastModified: "2026-03-08", appliedTo: "Procurement dept" },
  { id: "pol_003", name: "Business Hours Only", scope: "Global", type: "Time Restriction", description: "Block transactions outside Mon-Fri 6am-10pm UTC", status: "Active", lastModified: "2026-02-28", appliedTo: "All agents" },
  { id: "pol_004", name: "Geo-fence: US & EU Only", scope: "Global", type: "Geo Restriction", description: "Block transactions from merchants outside US and EU", status: "Active", lastModified: "2026-02-15", appliedTo: "All agents" },
  { id: "pol_005", name: "HiTL > $10,000", scope: "Global", type: "HiTL Threshold", description: "Require human-in-the-loop approval for single txns > $10,000", status: "Active", lastModified: "2026-03-01", appliedTo: "All agents" },
  { id: "pol_006", name: "Travel Agent — Airline Cap", scope: "Agent", type: "Spend Limit", description: "Max $5,000 per individual flight booking", status: "Active", lastModified: "2026-03-05", appliedTo: "travel-booking-v3" },
  { id: "pol_007", name: "SaaS Auto-Renew Guard", scope: "Agent", type: "HiTL Threshold", description: "Require approval for renewals with >20% price increase", status: "Draft", lastModified: "2026-03-18", appliedTo: "saas-renewal-bot" },
  { id: "pol_008", name: "Marketing Budget Fence", scope: "Department", type: "Spend Limit", description: "Marketing dept capped at $100,000/mo", status: "Active", lastModified: "2026-02-20", appliedTo: "Marketing dept" },
];

function StatusBadge({ status }: { status: PolicyStatus }) {
  const variants: Record<PolicyStatus, string> = {
    Active: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
    Draft: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    Disabled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  };
  return <Badge variant="outline" className={variants[status]}>{status}</Badge>;
}

function ScopeIcon({ scope }: { scope: "Global" | "Agent" | "Department" }) {
  const icons = { Global: Globe, Agent: Bot, Department: Building2 };
  const Icon = icons[scope];
  return <Icon className="h-4 w-4 text-muted-foreground" />;
}

function PolicyTable({ scope }: { scope: "Global" | "Agent" | "Department" | "all" }) {
  const filtered = scope === "all" ? policies : policies.filter((p) => p.scope === scope);
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Applied To</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((policy) => (
              <TableRow key={policy.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => toast.info(`Viewing policy: ${policy.name}`, { description: policy.description })}>
                <TableCell>
                  <div>
                    <div className="font-medium">{policy.name}</div>
                    <div className="text-xs text-muted-foreground">{policy.description}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <ScopeIcon scope={policy.scope} />
                    <span className="text-sm">{policy.scope}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary">{policy.type}</Badge></TableCell>
                <TableCell className="text-sm">{policy.appliedTo}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{policy.lastModified}</TableCell>
                <TableCell><StatusBadge status={policy.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function PoliciesPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-medium tracking-tight">Policy Engine</h1>
            <p className="text-sm text-muted-foreground">Define and manage spending rules, merchant controls, time/geo restrictions, and HiTL thresholds</p>
          </div>
          <Button onClick={() => toast.info("Opening policy builder...")}><Plus className="mr-2 h-4 w-4" />Create Policy</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">Total Policies</CardDescription>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">47</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">Active</CardDescription>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">41</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">Draft</CardDescription>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">4</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-sm font-medium">Violations (30d)</CardDescription>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">12</div></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Policies</TabsTrigger>
            <TabsTrigger value="Global">Global</TabsTrigger>
            <TabsTrigger value="Agent">Agent</TabsTrigger>
            <TabsTrigger value="Department">Department</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4"><PolicyTable scope="all" /></TabsContent>
          <TabsContent value="Global" className="mt-4"><PolicyTable scope="Global" /></TabsContent>
          <TabsContent value="Agent" className="mt-4"><PolicyTable scope="Agent" /></TabsContent>
          <TabsContent value="Department" className="mt-4"><PolicyTable scope="Department" /></TabsContent>
        </Tabs>

        {/* Visual Policy Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Policy Builder</CardTitle>
            <CardDescription>Visually configure a new policy rule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Policy Name</Label>
                  <Input placeholder="e.g. Weekend Transaction Block" />
                </div>
                <div className="space-y-2">
                  <Label>Scope</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select scope" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Policy Type</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spend-limit">Spend Limit</SelectItem>
                      <SelectItem value="merchant-control">Merchant Control</SelectItem>
                      <SelectItem value="time-restriction">Time Restriction</SelectItem>
                      <SelectItem value="geo-restriction">Geo Restriction</SelectItem>
                      <SelectItem value="hitl-threshold">HiTL Threshold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Spend Limit (per month)</Label>
                  <Input type="number" placeholder="50000" />
                </div>
                <div className="space-y-2">
                  <Label>HiTL Threshold (single txn)</Label>
                  <Input type="number" placeholder="10000" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Require approval for new merchants</Label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enforce business hours only</Label>
                  <Switch />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => toast.info("Policy saved as draft.", { description: "You can activate it later from the policy list." })}>Save as Draft</Button>
              <Button onClick={() => toast.success("Policy activated!", { description: "The policy is now enforced across all matching agents." })}>Activate Policy</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
