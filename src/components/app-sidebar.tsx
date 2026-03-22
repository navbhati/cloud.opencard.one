"use client";

import * as React from "react";
import {
  Home,
  Settings,
  Bot,
  FileCheck,
  Fingerprint,
  ShieldCheck,
  ScrollText,
  AlertTriangle,
  Network,
  Code2,
  Building2,
  Users,
  CreditCard,
} from "lucide-react";

import { NavMain, type NavGroup } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { SITE_CONFIG } from "@/config/platform/site_config";

const navGroups: NavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Home,
      },
    ],
  },
  {
    label: "Core",
    items: [
      {
        title: "Agent Registry",
        url: "/agents",
        icon: Bot,
      },
      {
        title: "Mandate Manager",
        url: "/mandates",
        icon: FileCheck,
      },
      {
        title: "Identity & KYA",
        url: "/identity",
        icon: Fingerprint,
      },
    ],
  },
  {
    label: "Governance",
    items: [
      {
        title: "Policy Engine",
        url: "/governance/policies",
        icon: ShieldCheck,
      },
      {
        title: "Audit Trail",
        url: "/governance/audit",
        icon: ScrollText,
      },
      {
        title: "Anomaly Detection",
        url: "/governance/anomalies",
        icon: AlertTriangle,
      },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      {
        title: "Protocol Bridge",
        url: "/protocols",
        icon: Network,
      },
      {
        title: "SDK & Docs",
        url: "/developers",
        icon: Code2,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Organisation",
        url: "/settings/general",
        icon: Building2,
      },
      {
        title: "Team",
        url: "/settings/team",
        icon: Users,
      },
      {
        title: "Billing",
        url: "/settings/billing",
        icon: CreditCard,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const userData = {
    name:
      user?.firstName && user?.lastName
        ? user?.firstName + " " + user?.lastName
        : "My Account",
    email: user?.primaryEmailAddress?.emailAddress,
    avatar: user?.imageUrl,
  };

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={isCollapsed ? SITE_CONFIG.siteName : undefined}
              className="hover:bg-transparent!"
            >
              <div
                className="cursor-pointer flex items-center justify-center relative"
                onClick={() => (window.location.href = "/")}
              >
                {isCollapsed ? (
                  <div className="text-sidebar-primary-foreground flex aspect-square size-6 items-center justify-center rounded-lg relative">
                    <Image
                      width={32}
                      height={32}
                      src="/logo-icon-light.svg"
                      alt={SITE_CONFIG.siteLogoAlt}
                      className="block dark:hidden"
                    />
                    <Image
                      width={32}
                      height={32}
                      src="/logo-icon-dark.svg"
                      alt={SITE_CONFIG.siteLogoDarkAlt}
                      className="hidden dark:block"
                    />
                  </div>
                ) : (
                  <div className="text-sidebar-primary-foreground flex aspect-square size-[150px] items-center justify-center rounded-lg relative">
                    <Image
                      width={200}
                      height={200}
                      src={SITE_CONFIG.siteLogo}
                      alt={SITE_CONFIG.siteLogoAlt}
                      className="block dark:hidden"
                    />
                    <Image
                      width={200}
                      height={200}
                      src={SITE_CONFIG.siteLogoDark}
                      alt={SITE_CONFIG.siteLogoDarkAlt}
                      className="hidden dark:block"
                    />
                    <span className="absolute bottom-1 right-1 text-[8px] font-semibold text-sidebar-foreground/60 leading-none">
                      BETA
                    </span>
                  </div>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: userData.name,
            email: userData.email ?? "",
            avatar: userData.avatar ?? "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
