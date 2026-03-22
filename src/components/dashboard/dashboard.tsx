"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { SITE_CONFIG } from "@/config/platform/site_config";
import { toast } from "@/lib/toast";
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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Bar, BarChart } from "recharts";
import {
  Bot,
  FileCheck,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  Users,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// --- Dummy data ---

const kpiCards = [
  { title: "Active Agents", value: "1,247", change: "+12%", icon: Bot },
  { title: "Live Mandates", value: "3,891", change: "+8%", icon: FileCheck },
  { title: "GMV (30d)", value: "$4.2M", change: "+23%", icon: DollarSign },
  { title: "Policy Compliance", value: "99.7%", change: "+0.2%", icon: ShieldCheck },
  { title: "Anomalies (7d)", value: "14", change: "-31%", icon: AlertTriangle },
  { title: "Avg Trust Score", value: "87.3", change: "+2.1", icon: TrendingUp },
  { title: "Avg Latency", value: "142ms", change: "-18ms", icon: Clock },
  { title: "Team Members", value: "23", change: "+3", icon: Users },
];

const topAgents = [
  { name: "procurement-agent-01", did: "did:opencard:ag_9x2k...", txns: 1_843, volume: "$312,400", status: "Active" as const },
  { name: "travel-booking-v3", did: "did:opencard:ag_4m7p...", txns: 1_291, volume: "$287,100", status: "Active" as const },
  { name: "saas-renewal-bot", did: "did:opencard:ag_1b3q...", txns: 967, volume: "$198,500", status: "Active" as const },
  { name: "expense-reconciler", did: "did:opencard:ag_8f2w...", txns: 843, volume: "$156,200", status: "Review" as const },
  { name: "vendor-pay-agent", did: "did:opencard:ag_5n9r...", txns: 712, volume: "$134,800", status: "Active" as const },
];

const recentEvents = [
  { id: "evt_001", type: "Mandate Created", agent: "procurement-agent-01", detail: "Spend limit $50,000/mo — Office supplies", time: "2 min ago" },
  { id: "evt_002", type: "Mandate Extended", agent: "travel-booking-v3", detail: "Extended to 2026-06-30", time: "18 min ago" },
  { id: "evt_003", type: "Mandate Revoked", agent: "test-agent-alpha", detail: "Policy violation — exceeded geo restriction", time: "1 hr ago" },
  { id: "evt_004", type: "Mandate Delegated", agent: "saas-renewal-bot", detail: "Delegated to sub-agent license-checker", time: "3 hr ago" },
  { id: "evt_005", type: "Mandate Created", agent: "vendor-pay-agent", detail: "Spend limit $25,000/mo — Raw materials", time: "5 hr ago" },
];

// GMV chart data — 30 days
const gmvData30d = [
  { date: "Feb 21", gmv: 98000, txns: 320 },
  { date: "Feb 22", gmv: 112000, txns: 345 },
  { date: "Feb 23", gmv: 87000, txns: 280 },
  { date: "Feb 24", gmv: 65000, txns: 210 },
  { date: "Feb 25", gmv: 134000, txns: 402 },
  { date: "Feb 26", gmv: 128000, txns: 389 },
  { date: "Feb 27", gmv: 142000, txns: 421 },
  { date: "Feb 28", gmv: 119000, txns: 365 },
  { date: "Mar 1", gmv: 156000, txns: 467 },
  { date: "Mar 2", gmv: 91000, txns: 295 },
  { date: "Mar 3", gmv: 78000, txns: 248 },
  { date: "Mar 4", gmv: 145000, txns: 432 },
  { date: "Mar 5", gmv: 167000, txns: 489 },
  { date: "Mar 6", gmv: 153000, txns: 451 },
  { date: "Mar 7", gmv: 138000, txns: 412 },
  { date: "Mar 8", gmv: 102000, txns: 328 },
  { date: "Mar 9", gmv: 84000, txns: 271 },
  { date: "Mar 10", gmv: 159000, txns: 478 },
  { date: "Mar 11", gmv: 174000, txns: 512 },
  { date: "Mar 12", gmv: 168000, txns: 498 },
  { date: "Mar 13", gmv: 181000, txns: 534 },
  { date: "Mar 14", gmv: 149000, txns: 443 },
  { date: "Mar 15", gmv: 112000, txns: 351 },
  { date: "Mar 16", gmv: 95000, txns: 308 },
  { date: "Mar 17", gmv: 187000, txns: 548 },
  { date: "Mar 18", gmv: 195000, txns: 571 },
  { date: "Mar 19", gmv: 178000, txns: 524 },
  { date: "Mar 20", gmv: 201000, txns: 589 },
  { date: "Mar 21", gmv: 192000, txns: 563 },
  { date: "Mar 22", gmv: 210000, txns: 612 },
];

const gmvData7d = gmvData30d.slice(-7);
const gmvData90d = [
  { date: "Jan", gmv: 2400000, txns: 7200 },
  { date: "Feb", gmv: 3100000, txns: 9400 },
  { date: "Mar", gmv: 4200000, txns: 12800 },
];

const gmvChartConfig: ChartConfig = {
  gmv: { label: "GMV ($)", color: "hsl(var(--chart-1))" },
  txns: { label: "Transactions", color: "hsl(var(--chart-2))" },
};

const pendingApprovals = [
  { id: "apr_001", title: "New agent registration: fleet-mgmt-v2", requester: "ops@acme.com", type: "Agent Registration" },
  { id: "apr_002", title: "Mandate increase: procurement-agent-01 → $100k/mo", requester: "finance@acme.com", type: "Mandate Change" },
  { id: "apr_003", title: "Policy override: allow weekend transactions for travel-booking-v3", requester: "travel@acme.com", type: "Policy Override" },
];

function StatusBadge({ status }: { status: "Active" | "Review" | "Suspended" }) {
  const variants = {
    Active: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
    Review: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    Suspended: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  };
  return <Badge variant="outline" className={variants[status]}>{status}</Badge>;
}

export function Dashboard() {
  const { user } = useUser();
  const [gmvRange, setGmvRange] = useState<"7d" | "30d" | "90d">("30d");

  const gmvChartData = useMemo(() => {
    if (gmvRange === "7d") return gmvData7d;
    if (gmvRange === "90d") return gmvData90d;
    return gmvData30d;
  }, [gmvRange]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-light text-foreground tracking-tight">
            {greeting},{" "}
            <span className="font-semibold">{user?.firstName ?? "there"}.</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome to <span className="font-serif-italic">{SITE_CONFIG.siteName}</span> — the authorization layer for AI agent payments.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="text-sm font-medium">{kpi.title}</CardDescription>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600 dark:text-green-400">{kpi.change}</span> from last period
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Agents */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Agents</CardTitle>
                <CardDescription>By transaction volume (30 days)</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info("Navigating to Agent Registry...")}>
                View All <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Txns</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAgents.map((agent) => (
                    <TableRow key={agent.name} className="cursor-pointer hover:bg-muted/50" onClick={() => toast.info(`Viewing agent: ${agent.name}`, { description: `DID: ${agent.did}` })}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-xs text-muted-foreground">{agent.did}</div>
                        </div>
                      </TableCell>
                      <TableCell>{agent.txns.toLocaleString()}</TableCell>
                      <TableCell>{agent.volume}</TableCell>
                      <TableCell><StatusBadge status={agent.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* GMV Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>GMV Trend</CardTitle>
                <CardDescription>Gross merchandise volume over time</CardDescription>
              </div>
              <Select value={gmvRange} onValueChange={(v) => setGmvRange(v as "7d" | "30d" | "90d")}>
                <SelectTrigger className="w-[100px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ChartContainer config={gmvChartConfig} className="h-[200px] w-full">
                <AreaChart data={gmvChartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-gmv)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-gmv)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={50} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => `$${Number(value).toLocaleString()}`} />} />
                  <Area type="monotone" dataKey="gmv" stroke="var(--color-gmv)" fill="url(#gmvGradient)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Mandate Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Mandate Events</CardTitle>
              <CardDescription>Latest mandate activity across all agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {event.type === "Mandate Revoked" ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{event.type}</span>
                        <span className="text-xs text-muted-foreground">{event.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{event.agent} — {event.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>{pendingApprovals.length} items need your review</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.requester}</p>
                      <Badge variant="outline" className="mt-1 text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
                        {item.type}
                      </Badge>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => toast.warning(`Rejected: ${item.title}`, { description: "The requester will be notified." })}>Reject</Button>
                      <Button size="sm" onClick={() => toast.success(`Approved: ${item.title}`, { description: "The requester has been notified." })}>Approve</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
