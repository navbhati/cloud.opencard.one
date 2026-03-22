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
  FileCheck,
  Search,
  Plus,
  Clock,
  Ban,
  ArrowRightLeft,
  DollarSign,
} from "lucide-react";
import { toast } from "@/lib/toast";

// --- Dummy data ---

type MandateStatus = "Active" | "Expired" | "Revoked" | "Pending";

interface Mandate {
  id: string;
  agent: string;
  scope: string;
  spendLimit: string;
  spent: string;
  utilization: number;
  merchants: string;
  validUntil: string;
  cryptoProof: string;
  status: MandateStatus;
  createdAt: string;
}

const mandates: Mandate[] = [
  { id: "mnd_001", agent: "procurement-agent-01", scope: "Office supplies, IT equipment", spendLimit: "$50,000/mo", spent: "$31,240", utilization: 62, merchants: "Amazon Business, CDW, Staples", validUntil: "2026-12-31", cryptoProof: "0x7f3a...e21b", status: "Active", createdAt: "2025-11-15" },
  { id: "mnd_002", agent: "travel-booking-v3", scope: "Flights, hotels, car rentals", spendLimit: "$75,000/mo", spent: "$48,200", utilization: 64, merchants: "United, Marriott, Hertz", validUntil: "2026-06-30", cryptoProof: "0x8b2c...f43d", status: "Active", createdAt: "2026-01-10" },
  { id: "mnd_003", agent: "saas-renewal-bot", scope: "Software subscriptions", spendLimit: "$120,000/yr", spent: "$87,300", utilization: 73, merchants: "Salesforce, AWS, Datadog", validUntil: "2026-12-31", cryptoProof: "0x4e1d...a92f", status: "Active", createdAt: "2025-12-01" },
  { id: "mnd_004", agent: "test-agent-alpha", scope: "Testing transactions", spendLimit: "$1,000/mo", spent: "$1,000", utilization: 100, merchants: "Sandbox", validUntil: "2026-01-31", cryptoProof: "0x2a9e...b71c", status: "Revoked", createdAt: "2025-09-20" },
  { id: "mnd_005", agent: "vendor-pay-agent", scope: "Raw materials, logistics", spendLimit: "$200,000/mo", spent: "$134,800", utilization: 67, merchants: "Grainger, FedEx, DHL", validUntil: "2026-09-30", cryptoProof: "0x6c4f...d58e", status: "Active", createdAt: "2026-02-01" },
  { id: "mnd_006", agent: "fleet-mgmt-v2", scope: "Vehicle maintenance, fuel", spendLimit: "$30,000/mo", spent: "$0", utilization: 0, merchants: "Shell, AutoZone", validUntil: "2026-03-15", cryptoProof: "0x1d7b...c39a", status: "Expired", createdAt: "2025-06-01" },
  { id: "mnd_007", agent: "expense-reconciler", scope: "Expense reimbursements", spendLimit: "$25,000/mo", spent: "$18,400", utilization: 74, merchants: "Various", validUntil: "2026-08-31", cryptoProof: "0x9e3a...f12b", status: "Pending", createdAt: "2026-03-18" },
];

const stats = [
  { title: "Total Mandates", value: "3,891", icon: FileCheck },
  { title: "Active", value: "3,412", icon: Clock },
  { title: "Total Spend (30d)", value: "$4.2M", icon: DollarSign },
  { title: "Revoked (30d)", value: "23", icon: Ban },
];

function StatusBadge({ status }: { status: MandateStatus }) {
  const variants: Record<MandateStatus, string> = {
    Active: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
    Pending: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    Expired: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    Revoked: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  };
  return <Badge variant="outline" className={variants[status]}>{status}</Badge>;
}

function UtilizationBar({ value }: { value: number }) {
  const color = value >= 90 ? "bg-red-500" : value >= 70 ? "bg-amber-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{value}%</span>
    </div>
  );
}

export default function MandatesPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-medium tracking-tight">Mandate Manager</h1>
            <p className="text-sm text-muted-foreground">Create, monitor, and manage cryptographically-signed agent spending mandates</p>
          </div>
          <Button onClick={() => toast.success("Mandate created!", { description: "New mandate has been cryptographically signed and recorded on-chain." })}><Plus className="mr-2 h-4 w-4" />Create Mandate</Button>
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
            <Input placeholder="Search mandates..." className="pl-9" />
          </div>
          <Select>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mandate Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mandate ID</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Spend Limit</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mandates.map((mandate) => (
                  <TableRow key={mandate.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{mandate.id}</TableCell>
                    <TableCell className="font-medium">{mandate.agent}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{mandate.scope}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{mandate.spendLimit}</div>
                        <div className="text-xs text-muted-foreground">{mandate.spent} used</div>
                      </div>
                    </TableCell>
                    <TableCell><UtilizationBar value={mandate.utilization} /></TableCell>
                    <TableCell className="text-sm">{mandate.validUntil}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{mandate.cryptoProof}</TableCell>
                    <TableCell><StatusBadge status={mandate.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {mandate.status === "Active" && (
                          <>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.success(`Mandate ${mandate.id} extended`, { description: "Validity extended by 90 days." })}><Clock className="mr-1 h-3 w-3" />Extend</Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={() => toast.warning(`Mandate ${mandate.id} revoked`, { description: `Agent ${mandate.agent} will lose spending authority immediately.` })}><Ban className="mr-1 h-3 w-3" />Revoke</Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.info(`Delegation initiated for ${mandate.id}`, { description: "Select a sub-agent to delegate this mandate to." })}><ArrowRightLeft className="mr-1 h-3 w-3" />Delegate</Button>
                          </>
                        )}
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
