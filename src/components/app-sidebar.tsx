"use client";

import * as React from "react";
import { Home, Settings, CreditCard, HandHeart } from "lucide-react";

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { CreditInfo } from "./credit-info";
import { SITE_CONFIG } from "@/config/platform/site_config";
import { ReferralButton } from "./referral/referral-button";
import { ReferralDialog } from "./referral/referral-dialog";

const navGroups: NavGroup[] = [
  {
    items: [
      {
        title: "Home",
        url: "/",
        icon: Home,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Plans",
        url: "/plans",
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
  const [isReferralDialogOpen, setIsReferralDialogOpen] = React.useState(false);

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
        {isCollapsed ? (
          <div className="px-2 py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full"
                  onClick={() => setIsReferralDialogOpen(true)}
                >
                  <HandHeart className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share with friends</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <ReferralButton variant="banner-dismissible" className="mb-2" />
        )}
        <ReferralDialog
          open={isReferralDialogOpen}
          onOpenChange={setIsReferralDialogOpen}
        />
        {!isCollapsed && <CreditInfo variant="compact" showAction={false} />}
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
