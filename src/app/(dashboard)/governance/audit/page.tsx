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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ScrollText,
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
} from "lucide-react";
import { toast } from "@/lib/toast";

// --- Dummy data ---

const auditStats = [
  { title: "Total Events (30d)", value: "124,891", icon: ScrollText },
  { title: "Policy Violations", value: "12", icon: AlertTriangle },
  { title: "Compliance Score", value: "99.7%", icon: ShieldCheck },
  { title: "Avg Response Time", value: "1.2s", icon: Clock },
];

type EventSeverity = "Info" | "Warning" | "Critical";

interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  severity: EventSeverity;
  detail: string;
  ipAddress: string;
  txHash: string;
}

const auditEvents: AuditEvent[] = [
  { id: "evt_10001", timestamp: "2026-03-22 14:32:18", actor: "procurement-agent-01", action: "transaction.execute", resource: "mnd_001", severity: "Info", detail: "Purchase order #PO-4521 executed — $2,340.00 at Amazon Business. Within policy limits.", ipAddress: "10.0.1.45", txHash: "0x7f3a...e21b" },
  { id: "evt_10002", timestamp: "2026-03-22 14:28:05", actor: "travel-booking-v3", action: "mandate.extend", resource: "mnd_002", severity: "Info", detail: "Mandate extended to 2026-06-30. Approved by finance@acme.com.", ipAddress: "10.0.1.72", txHash: "0x8b2c...f43d" },
  { id: "evt_10003", timestamp: "2026-03-22 13:15:42", actor: "expense-reconciler", action: "policy.violation", resource: "pol_003", severity: "Warning", detail: "Transaction attempted outside business hours (Saturday 13:15 UTC). Blocked by policy.", ipAddress: "10.0.2.18", txHash: "0x4e1d...a92f" },
  { id: "evt_10004", timestamp: "2026-03-22 12:45:33", actor: "test-agent-alpha", action: "mandate.revoke", resource: "mnd_004", severity: "Critical", detail: "Mandate revoked — agent exceeded geo restriction. Attempted transaction from restricted jurisdiction.", ipAddress: "203.0.113.42", txHash: "0x2a9e...b71c" },
  { id: "evt_10005", timestamp: "2026-03-22 11:20:17", actor: "saas-renewal-bot", action: "transaction.execute", resource: "mnd_003", severity: "Info", detail: "Datadog annual renewal — $24,000.00. Auto-approved within mandate scope.", ipAddress: "10.0.1.33", txHash: "0x6c4f...d58e" },
  { id: "evt_10006", timestamp: "2026-03-22 10:55:09", actor: "vendor-pay-agent", action: "hitl.trigger", resource: "pol_005", severity: "Warning", detail: "HiTL triggered — transaction $12,500 exceeds $10,000 threshold. Awaiting approval from ops@acme.com.", ipAddress: "10.0.1.56", txHash: "0x1d7b...c39a" },
  { id: "evt_10007", timestamp: "2026-03-22 09:30:44", actor: "admin@acme.com", action: "policy.create", resource: "pol_007", severity: "Info", detail: "New policy draft created: SaaS Auto-Renew Guard. Pending activation.", ipAddress: "10.0.0.5", txHash: "N/A" },
  { id: "evt_10008", timestamp: "2026-03-22 08:12:21", actor: "fleet-mgmt-v2", action: "credential.expire", resource: "ag_3t6y", severity: "Critical", detail: "All credentials expired. Agent suspended pending KYA re-verification.", ipAddress: "10.0.3.11", txHash: "N/A" },
];

function SeverityBadge({ severity }: { severity: EventSeverity }) {
  const variants: Record<EventSeverity, string> = {
    Info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    Warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    Critical: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  };
  return <Badge variant="outline" className={variants[severity]}>{severity}</Badge>;
}

function ExpandableRow({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <TableCell>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </TableCell>
        <TableCell className="text-sm font-mono text-muted-foreground">{event.timestamp}</TableCell>
        <TableCell className="font-medium">{event.actor}</TableCell>
        <TableCell><Badge variant="secondary" className="font-mono text-xs">{event.action}</Badge></TableCell>
        <TableCell className="font-mono text-sm">{event.resource}</TableCell>
        <TableCell><SeverityBadge severity={event.severity} /></TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={6} className="py-4">
            <div className="space-y-2 text-sm pl-6">
              <p><span className="font-medium">Detail:</span> {event.detail}</p>
              <div className="flex gap-6 text-muted-foreground">
                <span><span className="font-medium text-foreground">IP:</span> {event.ipAddress}</span>
                <span><span className="font-medium text-foreground">Tx Hash:</span> <span className="font-mono">{event.txHash}</span></span>
                <span><span className="font-medium text-foreground">Event ID:</span> <span className="font-mono">{event.id}</span></span>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function AuditPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-medium tracking-tight">Audit Trail</h1>
            <p className="text-sm text-muted-foreground">Complete, immutable log of all agent transactions, policy events, and system actions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.success("FCA report exported", { description: "Compliance report downloaded as FCA_audit_2026-03.csv" })}><Download className="mr-2 h-4 w-4" />FCA Export</Button>
            <Button variant="outline" onClick={() => toast.success("CMA report exported", { description: "Compliance report downloaded as CMA_audit_2026-03.csv" })}><Download className="mr-2 h-4 w-4" />CMA Export</Button>
            <Button variant="outline" onClick={() => toast.success("ISO 27001 report exported", { description: "Compliance report downloaded as ISO27001_audit_2026-03.pdf" })}><Download className="mr-2 h-4 w-4" />ISO 27001</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {auditStats.map((stat) => (
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
            <Input placeholder="Search events..." className="pl-9" />
          </div>
          <Select>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All severities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="transaction">Transactions</SelectItem>
              <SelectItem value="mandate">Mandates</SelectItem>
              <SelectItem value="policy">Policies</SelectItem>
              <SelectItem value="credential">Credentials</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Event Log */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEvents.map((event) => (
                  <ExpandableRow key={event.id} event={event} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
