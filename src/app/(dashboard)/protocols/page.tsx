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
import {
  Network,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";

// --- Dummy data ---

type ProtocolStatus = "Connected" | "Degraded" | "Coming Soon";

interface Protocol {
  id: string;
  name: string;
  shortName: string;
  description: string;
  status: ProtocolStatus;
  version: string;
  latency: string;
  uptime: string;
  lastSync: string;
  txnsToday: number;
  spec: string;
}

const protocols: Protocol[] = [
  { id: "proto_001", name: "Agent Payment Protocol v2", shortName: "AP2", description: "Open standard for agent-to-merchant payment authorization with cryptographic mandates", status: "Connected", version: "v2.1.0", latency: "89ms", uptime: "99.99%", lastSync: "12s ago", txnsToday: 4_821, spec: "https://opencard.one/specs/ap2" },
  { id: "proto_002", name: "Merchant Payment Protocol", shortName: "MPP", description: "Merchant-side protocol for receiving and verifying agent payments", status: "Connected", version: "v1.4.2", latency: "124ms", uptime: "99.97%", lastSync: "30s ago", txnsToday: 3_290, spec: "https://opencard.one/specs/mpp" },
  { id: "proto_003", name: "x402 Payment Required", shortName: "x402", description: "HTTP 402-based micropayment protocol for web services and APIs", status: "Connected", version: "v1.0.0", latency: "45ms", uptime: "99.98%", lastSync: "8s ago", txnsToday: 12_450, spec: "https://opencard.one/specs/x402" },
  { id: "proto_004", name: "Agent Communication Protocol", shortName: "ACP", description: "Inter-agent communication for mandate delegation and credential exchange", status: "Connected", version: "v1.2.1", latency: "67ms", uptime: "99.95%", lastSync: "15s ago", txnsToday: 8_120, spec: "https://opencard.one/specs/acp" },
  { id: "proto_005", name: "Visa Intelligent Commerce", shortName: "Visa IC", description: "Integration with Visa's AI commerce framework for card-based agent payments", status: "Degraded", version: "v0.9.3-beta", latency: "312ms", uptime: "98.2%", lastSync: "5 min ago", txnsToday: 890, spec: "https://developer.visa.com/ic" },
  { id: "proto_006", name: "Mastercard Agent Pay", shortName: "MC Agent Pay", description: "Mastercard's agent payment rails with embedded compliance checks", status: "Coming Soon", version: "—", latency: "—", uptime: "—", lastSync: "—", txnsToday: 0, spec: "https://developer.mastercard.com/agentpay" },
];

const unifiedMandateRecord = {
  mandateId: "mnd_001",
  issuer: "did:opencard:org_acme",
  agent: "did:opencard:ag_9x2kF7mNpQ3vLwR8",
  scope: { categories: ["office-supplies", "it-equipment"], merchantIds: ["AMZ_BIZ", "CDW_CORP", "STAPLES"] },
  limits: { perTransaction: 10000, monthly: 50000, currency: "USD" },
  constraints: { geoFence: ["US", "EU"], timeWindow: "Mon-Fri 06:00-22:00 UTC", hitlThreshold: 10000 },
  validity: { from: "2025-11-15T00:00:00Z", until: "2026-12-31T23:59:59Z" },
  proof: { type: "Ed25519Signature2020", hash: "0x7f3a8b2c4e1d...e21b", ledger: "opencard-l2" },
};

function ProtocolStatusBadge({ status }: { status: ProtocolStatus }) {
  const config: Record<ProtocolStatus, { className: string; icon: typeof CheckCircle2 }> = {
    Connected: { className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800", icon: CheckCircle2 },
    Degraded: { className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800", icon: AlertTriangle },
    "Coming Soon": { className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800", icon: Clock },
  };
  const { className, icon: Icon } = config[status];
  return (
    <Badge variant="outline" className={className}>
      <Icon className="mr-1 h-3 w-3" />{status}
    </Badge>
  );
}

export default function ProtocolsPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-medium tracking-tight">Protocol Bridge</h1>
            <p className="text-sm text-muted-foreground">Monitor and manage connections to payment protocols and network rails</p>
          </div>
        </div>

        {/* Protocol Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {protocols.map((protocol) => (
            <Card key={protocol.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{protocol.shortName}</CardTitle>
                  </div>
                  <ProtocolStatusBadge status={protocol.status} />
                </div>
                <CardDescription className="text-xs">{protocol.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">{protocol.description}</p>
                {protocol.status !== "Coming Soon" ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Version:</span> <span className="font-mono">{protocol.version}</span></div>
                    <div><span className="text-muted-foreground">Latency:</span> {protocol.latency}</div>
                    <div><span className="text-muted-foreground">Uptime:</span> {protocol.uptime}</div>
                    <div><span className="text-muted-foreground">Last sync:</span> {protocol.lastSync}</div>
                    <div className="col-span-2"><span className="text-muted-foreground">Txns today:</span> {protocol.txnsToday.toLocaleString()}</div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Integration in development</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Unified Mandate Record Sample */}
        <Card>
          <CardHeader>
            <CardTitle>Unified Mandate Record</CardTitle>
            <CardDescription>Sample cross-protocol mandate representation (JSON-LD format)</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto">
              {JSON.stringify(unifiedMandateRecord, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
