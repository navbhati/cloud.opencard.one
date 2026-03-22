"use client";

import { ReactNode } from "react";
import { ChartLine, CreditCard, UserStar, Globe, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  PageWithSidebar,
  type SidebarNavItem,
} from "@/components/layouts/page-with-sidebar";

type SettingsSection = "profile" | "general" | "billing" | "team" | "insights";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine active section based on current pathname
  const getActiveSection = (): SettingsSection => {
    if (pathname.includes("/settings/general")) return "general";
    if (pathname.includes("/settings/billing")) return "billing";
    if (pathname.includes("/settings/profile")) return "profile";
    if (pathname.includes("/settings/team")) return "team";
    if (pathname.includes("/settings/insights")) return "insights";
    return "profile";
  };

  const activeSection = getActiveSection();

  const handleSectionClick = (section: SettingsSection) => {
    // Prevent changing to insights tab - just show toast
    if (section === "insights") {
      toast.info("Thanks for your interest! It's coming soon.");
      return;
    }

    // Navigate to other sections
    switch (section) {
      case "profile":
        router.push("/settings/profile");
        break;
      case "general":
        router.push("/settings/general");
        break;
      case "billing":
        router.push("/settings/billing");
        break;
      case "team":
        router.push("/settings/team");
        break;
    }
  };

  const navItems: SidebarNavItem[] = [
    {
      id: "profile",
      label: "Profile",
      icon: UserStar,
      onClick: () => handleSectionClick("profile"),
    },
    {
      id: "general",
      label: "General",
      icon: Globe,
      onClick: () => handleSectionClick("general"),
    },
    {
      id: "billing",
      label: "Plan & Billing",
      icon: CreditCard,
      onClick: () => handleSectionClick("billing"),
    },
    {
      id: "team",
      label: "Team & Permissions",
      icon: Users,
      onClick: () => handleSectionClick("team"),
    },
    {
      id: "insights",
      label: "Insights",
      icon: ChartLine,
      badge: (
        <Badge className="ms-1 text-xs px-1.5 py-0.5 h-4">Coming soon</Badge>
      ),
      disabled: true,
      onClick: () => handleSectionClick("insights"),
    },
  ];

  return (
    <PageWithSidebar
      title="Settings"
      description="Manage your account settings"
      navItems={navItems}
      activeItemId={activeSection}
    >
      <main className="w-full">{children}</main>
    </PageWithSidebar>
  );
}
