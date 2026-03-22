"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export interface NavItem {
  title: string;
  url?: string;
  icon?: LucideIcon;
  isActive?: boolean;
  badge?: string;
  items?: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

function NavItems({ items }: { items: NavItem[] }) {
  return (
    <>
      {items.map((item) => (
        <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={item.title}>
              <a href={item.url}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
            {item.badge && (
              <SidebarMenuBadge className="border border-sidebar-border bg-primary text-primary-foreground backdrop-blur-sm text-[10px] leading-tight rounded-sm">
                {item.badge}
              </SidebarMenuBadge>
            )}
            {item.items?.length ? (
              <>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90">
                    <ChevronRight />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>
                            <subItem.icon />
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </>
            ) : null}
          </SidebarMenuItem>
        </Collapsible>
      ))}
    </>
  );
}

export function NavMain({
  items,
  groups,
}: {
  items?: NavItem[];
  groups?: NavGroup[];
}) {
  // If groups are provided, render grouped layout
  if (groups && groups.length > 0) {
    return (
      <>
        {groups.map((group, index) => (
          <SidebarGroup
            key={group.label || index}
            className="px-2 py-0 group-data-[collapsible=icon]:py-1"
          >
            {group.label && (
              <SidebarGroupLabel className="h-5 text-[12px] mb-0">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarMenu className="gap-0 group-data-[collapsible=icon]:gap-2">
              <NavItems items={group.items} />
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </>
    );
  }

  // Fallback: flat items (backwards compatible)
  return (
    <SidebarGroup>
      <SidebarMenu>
        <NavItems items={items || []} />
      </SidebarMenu>
    </SidebarGroup>
  );
}
