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
  Users,
  Plus,
  Mail,
  Shield,
  ShieldCheck,
  Crown,
  Eye,
} from "lucide-react";
import { toast } from "@/lib/toast";

// --- Dummy data ---

type MemberRole = "Owner" | "Admin" | "Policy Manager" | "Auditor" | "Viewer";
type MemberStatus = "Active" | "Invited" | "Suspended";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
  lastActive: string;
  agentsManaged: number;
}

const teamMembers: TeamMember[] = [
  { id: "usr_001", name: "Sarah Chen", email: "sarah@acme.com", role: "Owner", status: "Active", joinedAt: "2025-06-01", lastActive: "Just now", agentsManaged: 0 },
  { id: "usr_002", name: "Marcus Johnson", email: "marcus@acme.com", role: "Admin", status: "Active", joinedAt: "2025-07-15", lastActive: "5 min ago", agentsManaged: 12 },
  { id: "usr_003", name: "Priya Patel", email: "priya@acme.com", role: "Policy Manager", status: "Active", joinedAt: "2025-08-20", lastActive: "1 hr ago", agentsManaged: 8 },
  { id: "usr_004", name: "James Wilson", email: "james@acme.com", role: "Auditor", status: "Active", joinedAt: "2025-09-10", lastActive: "3 hrs ago", agentsManaged: 0 },
  { id: "usr_005", name: "Lisa Wang", email: "lisa@acme.com", role: "Admin", status: "Active", joinedAt: "2025-10-01", lastActive: "30 min ago", agentsManaged: 15 },
  { id: "usr_006", name: "Alex Turner", email: "alex@acme.com", role: "Viewer", status: "Active", joinedAt: "2026-01-15", lastActive: "2 days ago", agentsManaged: 0 },
  { id: "usr_007", name: "Emily Davis", email: "emily@acme.com", role: "Policy Manager", status: "Invited", joinedAt: "—", lastActive: "—", agentsManaged: 0 },
];

const roleDescriptions: { role: MemberRole; icon: typeof Crown; description: string; permissions: string[] }[] = [
  { role: "Owner", icon: Crown, description: "Full access to all resources and settings", permissions: ["All permissions", "Transfer ownership", "Delete organisation"] },
  { role: "Admin", icon: ShieldCheck, description: "Manage agents, mandates, policies, and team members", permissions: ["Manage agents", "Manage mandates", "Manage policies", "Invite members"] },
  { role: "Policy Manager", icon: Shield, description: "Create and modify policies, review audit trails", permissions: ["Manage policies", "View audit trail", "Manage mandates"] },
  { role: "Auditor", icon: Eye, description: "Read-only access to audit trails and compliance reports", permissions: ["View audit trail", "Export reports", "View anomalies"] },
  { role: "Viewer", icon: Eye, description: "Read-only access to dashboards and agent data", permissions: ["View dashboard", "View agents", "View mandates"] },
];

function RoleBadge({ role }: { role: MemberRole }) {
  const variants: Record<MemberRole, string> = {
    Owner: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
    Admin: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    "Policy Manager": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    Auditor: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
    Viewer: "bg-muted text-muted-foreground border-border",
  };
  return <Badge variant="outline" className={variants[role]}>{role}</Badge>;
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const variants: Record<MemberStatus, string> = {
    Active: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
    Invited: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    Suspended: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  };
  return <Badge variant="outline" className={variants[status]}>{status}</Badge>;
}

export default function TeamPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-medium tracking-tight">Team & Permissions</h1>
            <p className="text-sm text-muted-foreground">Manage team members, roles, and access control for your organisation</p>
          </div>
        </div>

        {/* Invite Form */}
        <Card>
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>Send an invitation to join your organisation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="invite-email" placeholder="colleague@company.com" className="pl-9" />
                </div>
              </div>
              <div className="w-[200px] space-y-2">
                <Label>Role</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="policy-manager">Policy Manager</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => toast.success("Invitation sent!", { description: "The team member will receive an email with instructions to join." })}><Plus className="mr-2 h-4 w-4" />Send Invite</Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>{teamMembers.length} members in your organisation</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Agents Managed</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </TableCell>
                    <TableCell><RoleBadge role={member.role} /></TableCell>
                    <TableCell><StatusBadge status={member.status} /></TableCell>
                    <TableCell>{member.agentsManaged > 0 ? member.agentsManaged : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{member.joinedAt}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{member.lastActive}</TableCell>
                    <TableCell>
                      {member.role !== "Owner" && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.info(`Editing role for ${member.name}`, { description: `Current role: ${member.role}` })}>Edit Role</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={() => toast.warning(`${member.name} removed from team`, { description: `${member.email} will lose access to the organisation.` })}>Remove</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Role Descriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Role Definitions</CardTitle>
            <CardDescription>Available roles and their associated permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roleDescriptions.map((role) => (
                <div key={role.role} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <role.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{role.role}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-xs">{perm}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
