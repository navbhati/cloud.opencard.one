"use client";

import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Eye,
  XCircle,
  Activity,
  Zap,
  Clock,
} from "lucide-react";
import { toast } from "@/lib/toast";

// --- Dummy data ---

const alertCards = [
  { title: "Active Alerts", value: "14", icon: AlertTriangle, variant: "amber" as const },
  { title: "Critical", value: "3", icon: Zap, variant: "red" as const },
  { title: "Investigated (7d)", value: "28", icon: Eye, variant: "blue" as const },
  { title: "False Positive Rate", value: "8.2%", icon: Shield, variant: "green" as const },
];

// Behavior baseline chart data — 7 day
const baselineData7d = [
  { time: "Mar 16", actual: 142, baseline: 120, anomalies: 1 },
  { time: "Mar 17", actual: 189, baseline: 125, anomalies: 3 },
  { time: "Mar 18", actual: 156, baseline: 128, anomalies: 2 },
  { time: "Mar 19", actual: 134, baseline: 122, anomalies: 0 },
  { time: "Mar 20", actual: 198, baseline: 130, anomalies: 4 },
  { time: "Mar 21", actual: 167, baseline: 126, anomalies: 2 },
  { time: "Mar 22", actual: 245, baseline: 132, anomalies: 5 },
];

const baselineData24h = [
  { time: "00:00", actual: 12, baseline: 8, anomalies: 0 },
  { time: "03:00", actual: 3, baseline: 2, anomalies: 0 },
  { time: "06:00", actual: 18, baseline: 15, anomalies: 0 },
  { time: "09:00", actual: 45, baseline: 38, anomalies: 1 },
  { time: "12:00", actual: 67, baseline: 42, anomalies: 2 },
  { time: "15:00", actual: 52, baseline: 40, anomalies: 1 },
  { time: "18:00", actual: 38, baseline: 30, anomalies: 0 },
  { time: "21:00", actual: 22, baseline: 12, anomalies: 1 },
];

const baselineData30d = [
  { time: "Feb 21", actual: 3200, baseline: 2800, anomalies: 8 },
  { time: "Feb 24", actual: 2900, baseline: 2750, anomalies: 3 },
  { time: "Feb 27", actual: 3400, baseline: 2900, anomalies: 6 },
  { time: "Mar 2", actual: 3100, baseline: 2850, anomalies: 4 },
  { time: "Mar 5", actual: 3600, baseline: 3000, anomalies: 7 },
  { time: "Mar 8", actual: 2800, baseline: 2900, anomalies: 2 },
  { time: "Mar 11", actual: 3900, baseline: 3100, anomalies: 9 },
  { time: "Mar 14", actual: 3500, baseline: 3050, anomalies: 5 },
  { time: "Mar 17", actual: 4100, baseline: 3200, anomalies: 10 },
  { time: "Mar 20", actual: 4400, baseline: 3300, anomalies: 14 },
  { time: "Mar 22", actual: 4800, baseline: 3350, anomalies: 14 },
];

const baselineChartConfig: ChartConfig = {
  actual: { label: "Actual Txns", color: "hsl(var(--chart-1))" },
  baseline: { label: "Baseline", color: "hsl(var(--chart-4))" },
};

type AnomalySeverity = "Critical" | "High" | "Medium" | "Low";
type AnomalyStatus = "Open" | "Investigating" | "Dismissed" | "Resolved";

interface Anomaly {
  id: string;
  timestamp: string;
  agent: string;
  type: string;
  description: string;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  confidence: number;
  baselineDeviation: string;
}

const anomalies: Anomaly[] = [
  { id: "anm_001", timestamp: "2026-03-22 14:18", agent: "expense-reconciler", type: "Velocity Spike", description: "Transaction frequency 340% above baseline — 47 txns in 15 minutes vs. typical 12/hr", severity: "Critical", status: "Open", confidence: 96, baselineDeviation: "+340%" },
  { id: "anm_002", timestamp: "2026-03-22 13:45", agent: "vendor-pay-agent", type: "New Merchant", description: "First-ever transaction with unrecognized merchant ID: MRC_99421 (offshore entity)", severity: "High", status: "Investigating", confidence: 89, baselineDeviation: "New pattern" },
  { id: "anm_003", timestamp: "2026-03-22 12:30", agent: "travel-booking-v3", type: "Amount Anomaly", description: "Single booking $8,200 — 4.1x average booking value of $2,000", severity: "Medium", status: "Open", confidence: 74, baselineDeviation: "+310%" },
  { id: "anm_004", timestamp: "2026-03-22 11:15", agent: "fleet-mgmt-v2", type: "Reactivation Attempt", description: "Suspended agent attempted credential refresh and mandate creation", severity: "Critical", status: "Open", confidence: 99, baselineDeviation: "Suspended agent" },
  { id: "anm_005", timestamp: "2026-03-22 10:00", agent: "procurement-agent-01", type: "Geo Anomaly", description: "Transaction originated from IP in restricted jurisdiction (RU)", severity: "Critical", status: "Investigating", confidence: 92, baselineDeviation: "Restricted geo" },
  { id: "anm_006", timestamp: "2026-03-22 08:45", agent: "marketing-spend-ai", type: "Category Drift", description: "Spending in 'Electronics' category — agent typically only uses 'Advertising' MCC codes", severity: "Medium", status: "Dismissed", confidence: 65, baselineDeviation: "New category" },
  { id: "anm_007", timestamp: "2026-03-21 22:30", agent: "saas-renewal-bot", type: "Off-Hours Activity", description: "Transaction executed at 22:30 UTC — outside normal operating window", severity: "Low", status: "Resolved", confidence: 58, baselineDeviation: "Off-hours" },
  { id: "anm_008", timestamp: "2026-03-21 19:15", agent: "vendor-pay-agent", type: "Credential Sharing", description: "Same credential used from two different IPs within 3-minute window", severity: "High", status: "Investigating", confidence: 87, baselineDeviation: "Dual IP" },
];

function SeverityBadge({ severity }: { severity: AnomalySeverity }) {
  const variants: Record<AnomalySeverity, string> = {
    Critical: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
    High: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    Medium: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    Low: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
  };
  return <Badge variant="outline" className={variants[severity]}>{severity}</Badge>;
}

function StatusBadge({ status }: { status: AnomalyStatus }) {
  const variants: Record<AnomalyStatus, string> = {
    Open: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
    Investigating: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    Dismissed: "bg-muted text-muted-foreground border-border",
    Resolved: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
  };
  return <Badge variant="outline" className={variants[status]}>{status}</Badge>;
}

export default function AnomaliesPage() {
  const [baselineRange, setBaselineRange] = useState<"24h" | "7d" | "30d">("7d");

  const baselineChartData = useMemo(() => {
    if (baselineRange === "24h") return baselineData24h;
    if (baselineRange === "30d") return baselineData30d;
    return baselineData7d;
  }, [baselineRange]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-medium tracking-tight">Anomaly Detection</h1>
            <p className="text-sm text-muted-foreground">AI-powered behavioral analysis to detect unusual agent transaction patterns</p>
          </div>
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {alertCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">{card.title}</CardDescription>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Behavior Baseline Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Behavior Baseline</CardTitle>
              <CardDescription>Agent transaction volume vs. established baselines</CardDescription>
            </div>
            <Select value={baselineRange} onValueChange={(v) => setBaselineRange(v as "24h" | "7d" | "30d")}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 hours</SelectItem>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ChartContainer config={baselineChartConfig} className="h-[250px] w-full">
              <AreaChart data={baselineChartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-actual)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-actual)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={11} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="baseline" stroke="var(--color-baseline)" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                <Area type="monotone" dataKey="actual" stroke="var(--color-actual)" fill="url(#actualGradient)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Anomaly List */}
        <Card>
          <CardHeader>
            <CardTitle>Anomaly Alerts</CardTitle>
            <CardDescription>Detected anomalies sorted by severity and recency</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Deviation</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalies.map((anomaly) => (
                  <TableRow key={anomaly.id} className="hover:bg-muted/50">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{anomaly.timestamp}</TableCell>
                    <TableCell className="font-medium">{anomaly.agent}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{anomaly.type}</Badge></TableCell>
                    <TableCell className="max-w-[300px] text-sm">{anomaly.description}</TableCell>
                    <TableCell className="font-mono text-sm">{anomaly.baselineDeviation}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${anomaly.confidence >= 90 ? "text-red-600 dark:text-red-400" : anomaly.confidence >= 70 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                        {anomaly.confidence}%
                      </span>
                    </TableCell>
                    <TableCell><SeverityBadge severity={anomaly.severity} /></TableCell>
                    <TableCell><StatusBadge status={anomaly.status} /></TableCell>
                    <TableCell>
                      {(anomaly.status === "Open" || anomaly.status === "Investigating") && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.info(`Investigating: ${anomaly.type}`, { description: `Agent ${anomaly.agent} — ${anomaly.description}` })}><Eye className="mr-1 h-3 w-3" />Investigate</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => toast.warning(`Dismissed: ${anomaly.id}`, { description: "Anomaly marked as false positive." })}><XCircle className="mr-1 h-3 w-3" />Dismiss</Button>
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
