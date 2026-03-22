"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Bot,
  Search,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { toast } from "@/lib/toast";

// --- Dummy data ---

type AgentStatus = "Active" | "Suspended" | "Pending Review";

interface Agent {
  id: string;
  name: string;
  did: string;
  type: string;
  trustScore: number;
  activeMandates: number;
  totalTxns: number;
  volume: string;
  status: AgentStatus;
  lastActive: string;
  credentials: string[];
}

const agents: Agent[] = [
  { id: "ag_9x2k", name: "procurement-agent-01", did: "did:opencard:ag_9x2kF7mNpQ3vLwR8", type: "Procurement", trustScore: 94, activeMandates: 12, totalTxns: 18_430, volume: "$3.1M", status: "Active", lastActive: "2 min ago", credentials: ["VC:spending-authority", "VC:vendor-approved"] },
  { id: "ag_4m7p", name: "travel-booking-v3", did: "did:opencard:ag_4m7pT2bXqK9wHsE5", type: "Travel", trustScore: 91, activeMandates: 8, totalTxns: 12_910, volume: "$2.8M", status: "Active", lastActive: "5 min ago", credentials: ["VC:travel-policy", "VC:expense-auth"] },
  { id: "ag_1b3q", name: "saas-renewal-bot", did: "did:opencard:ag_1b3qY6nRvM4cJwP7", type: "SaaS", trustScore: 88, activeMandates: 23, totalTxns: 9_670, volume: "$1.9M", status: "Active", lastActive: "12 min ago", credentials: ["VC:license-mgmt"] },
  { id: "ag_8f2w", name: "expense-reconciler", did: "did:opencard:ag_8f2wL5kDtG1bNxS3", type: "Finance", trustScore: 72, activeMandates: 5, totalTxns: 8_430, volume: "$1.5M", status: "Pending Review", lastActive: "1 hr ago", credentials: ["VC:reconciliation"] },
  { id: "ag_5n9r", name: "vendor-pay-agent", did: "did:opencard:ag_5n9rC8jHzQ2eFmV6", type: "Procurement", trustScore: 89, activeMandates: 15, totalTxns: 7_120, volume: "$1.3M", status: "Active", lastActive: "8 min ago", credentials: ["VC:vendor-approved", "VC:payment-auth"] },
  { id: "ag_3t6y", name: "fleet-mgmt-v2", did: "did:opencard:ag_3t6yA1pWxN7dKrB4", type: "Operations", trustScore: 45, activeMandates: 0, totalTxns: 0, volume: "$0", status: "Suspended", lastActive: "3 days ago", credentials: [] },
  { id: "ag_7w1e", name: "marketing-spend-ai", did: "did:opencard:ag_7w1eD4sLcU8gMtF9", type: "Marketing", trustScore: 82, activeMandates: 4, totalTxns: 3_290, volume: "$890K", status: "Active", lastActive: "25 min ago", credentials: ["VC:budget-auth"] },
];

const stats = [
  { title: "Total Agents", value: "1,247", icon: Bot },
  { title: "Active", value: "1,189", icon: ShieldCheck },
  { title: "Pending Review", value: "43", icon: Clock },
  { title: "Suspended", value: "15", icon: AlertTriangle },
];

function StatusBadge({ status }: { status: AgentStatus }) {
  const variants: Record<AgentStatus, string> = {
    Active: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
    "Pending Review": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    Suspended: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  };
  return <Badge variant="outline" className={variants[status]}>{status}</Badge>;
}

function TrustScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-600 dark:text-green-400" : score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
  return <span className={`font-semibold ${color}`}>{score}</span>;
}

export default function AgentsPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-medium tracking-tight">Agent Registry</h1>
            <p className="text-sm text-muted-foreground">Manage AI agent identities, credentials, and trust scores</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Register Agent</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Agent</DialogTitle>
                <DialogDescription>Create a decentralized identity and issue initial credentials for a new AI agent.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-name">Agent Name</Label>
                  <Input id="agent-name" placeholder="e.g. procurement-agent-02" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-type">Agent Type</Label>
                  <Select>
                    <SelectTrigger id="agent-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="procurement">Procurement</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="saas">SaaS</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-desc">Description</Label>
                  <Input id="agent-desc" placeholder="What does this agent do?" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => toast.info("Registration cancelled.")}>Cancel</Button>
                <Button onClick={() => toast.success("Agent registered successfully!", { description: "A new DID has been generated and initial credentials issued." })}>Register</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">{stat.title}</CardDescription>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search agents..." className="pl-9" />
          </div>
          <Select>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="procurement">Procurement</SelectItem>
              <SelectItem value="travel">Travel</SelectItem>
              <SelectItem value="saas">SaaS</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Agent Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Trust Score</TableHead>
                  <TableHead>Active Mandates</TableHead>
                  <TableHead>Txns</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toast.info(`Viewing agent: ${agent.name}`, { description: `DID: ${agent.did}` })}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{agent.did}</div>
                      </div>
                    </TableCell>
                    <TableCell>{agent.type}</TableCell>
                    <TableCell><TrustScoreBadge score={agent.trustScore} /></TableCell>
                    <TableCell>{agent.activeMandates}</TableCell>
                    <TableCell>{agent.totalTxns.toLocaleString()}</TableCell>
                    <TableCell>{agent.volume}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{agent.lastActive}</TableCell>
                    <TableCell><StatusBadge status={agent.status} /></TableCell>
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
