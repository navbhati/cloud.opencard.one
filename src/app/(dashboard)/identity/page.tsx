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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Fingerprint,
  ShieldCheck,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "@/lib/toast";

// --- Dummy data ---

const trustSummary = [
  { title: "Avg Trust Score", value: "87.3", icon: ShieldCheck, description: "Across all active agents" },
  { title: "Credentials Issued", value: "4,821", icon: Award, description: "Verifiable credentials total" },
  { title: "Pending Verification", value: "18", icon: Clock, description: "Awaiting KYA review" },
  { title: "Trust Violations", value: "7", icon: AlertTriangle, description: "Last 30 days" },
];

interface TrustBreakdown {
  category: string;
  weight: number;
  score: number;
  maxScore: number;
}

const trustBreakdown: TrustBreakdown[] = [
  { category: "Transaction History", weight: 25, score: 23, maxScore: 25 },
  { category: "Policy Compliance", weight: 20, score: 19, maxScore: 20 },
  { category: "Credential Validity", weight: 20, score: 18, maxScore: 20 },
  { category: "Behavioral Consistency", weight: 15, score: 12, maxScore: 15 },
  { category: "Peer Attestations", weight: 10, score: 8, maxScore: 10 },
  { category: "Time in Network", weight: 10, score: 7, maxScore: 10 },
];

type VerificationStatus = "Pending" | "Approved" | "Rejected";

interface VerificationItem {
  id: string;
  agent: string;
  type: string;
  submitted: string;
  riskLevel: "Low" | "Medium" | "High";
  status: VerificationStatus;
}

const verificationQueue: VerificationItem[] = [
  { id: "kyc_001", agent: "fleet-mgmt-v2", type: "Initial KYA", submitted: "2 hrs ago", riskLevel: "High", status: "Pending" },
  { id: "kyc_002", agent: "marketing-spend-ai", type: "Credential Renewal", submitted: "5 hrs ago", riskLevel: "Low", status: "Pending" },
  { id: "kyc_003", agent: "new-vendor-bot", type: "Initial KYA", submitted: "1 day ago", riskLevel: "Medium", status: "Pending" },
  { id: "kyc_004", agent: "hr-expense-agent", type: "Trust Upgrade", submitted: "1 day ago", riskLevel: "Low", status: "Pending" },
  { id: "kyc_005", agent: "procurement-agent-01", type: "Credential Renewal", submitted: "2 days ago", riskLevel: "Low", status: "Approved" },
  { id: "kyc_006", agent: "test-agent-gamma", type: "Initial KYA", submitted: "3 days ago", riskLevel: "High", status: "Rejected" },
];

function RiskBadge({ level }: { level: "Low" | "Medium" | "High" }) {
  const variants = {
    Low: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
    Medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    High: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  };
  return <Badge variant="outline" className={variants[level]}>{level}</Badge>;
}

function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  const variants: Record<VerificationStatus, string> = {
    Pending: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    Approved: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
    Rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  };
  return <Badge variant="outline" className={variants[status]}>{status}</Badge>;
}

export default function IdentityPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-medium tracking-tight">Identity & KYA</h1>
            <p className="text-sm text-muted-foreground">Know Your Agent — manage trust scores, credentials, and verification workflows</p>
          </div>
          <Button onClick={() => toast.info("Opening credential issuance form...")}><Fingerprint className="mr-2 h-4 w-4" />Issue Credential</Button>
        </div>

        {/* Trust Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trustSummary.map((item) => (
            <Card key={item.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">{item.title}</CardDescription>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trust Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Trust Score Breakdown</CardTitle>
              <CardDescription>Weighted scoring model for agent trust assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trustBreakdown.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.category}</span>
                      <span className="text-muted-foreground">{item.score}/{item.maxScore} (weight: {item.weight}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between font-medium">
                    <span>Total Trust Score</span>
                    <span className="text-lg">87.3 / 100</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credential Issuance Form */}
          <Card>
            <CardHeader>
              <CardTitle>Issue Credential</CardTitle>
              <CardDescription>Issue a new verifiable credential to an agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cred-agent">Agent</Label>
                  <Select>
                    <SelectTrigger id="cred-agent"><SelectValue placeholder="Select agent" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="procurement-agent-01">procurement-agent-01</SelectItem>
                      <SelectItem value="travel-booking-v3">travel-booking-v3</SelectItem>
                      <SelectItem value="saas-renewal-bot">saas-renewal-bot</SelectItem>
                      <SelectItem value="vendor-pay-agent">vendor-pay-agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-type">Credential Type</Label>
                  <Select>
                    <SelectTrigger id="cred-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spending-authority">Spending Authority</SelectItem>
                      <SelectItem value="vendor-approved">Vendor Approved</SelectItem>
                      <SelectItem value="travel-policy">Travel Policy</SelectItem>
                      <SelectItem value="payment-auth">Payment Authorization</SelectItem>
                      <SelectItem value="budget-auth">Budget Authority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-expiry">Expiry Date</Label>
                  <Input id="cred-expiry" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-notes">Notes</Label>
                  <Input id="cred-notes" placeholder="Optional notes for this credential" />
                </div>
                <Button className="w-full" onClick={() => toast.success("Credential issued!", { description: "Verifiable credential has been signed and anchored to the agent's DID." })}>Issue Credential</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verification Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Queue</CardTitle>
            <CardDescription>Agent KYA verification requests awaiting review</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verificationQueue.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{item.id}</TableCell>
                    <TableCell className="font-medium">{item.agent}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.submitted}</TableCell>
                    <TableCell><RiskBadge level={item.riskLevel} /></TableCell>
                    <TableCell><VerificationStatusBadge status={item.status} /></TableCell>
                    <TableCell>
                      {item.status === "Pending" && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600" onClick={() => toast.success(`Approved: ${item.agent}`, { description: `${item.type} verification passed. Trust score updated.` })}><CheckCircle2 className="mr-1 h-3 w-3" />Approve</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={() => toast.error(`Rejected: ${item.agent}`, { description: `${item.type} verification failed. Agent has been notified.` })}><XCircle className="mr-1 h-3 w-3" />Reject</Button>
                        </div>
                      )}
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
