"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  badge?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  onClick?: () => void;
  size?: "default" | "lg";
}

export interface SidebarNavGroup {
  title?: string;
  items: SidebarNavItem[];
}

export interface PageWithSidebarProps {
  title?: string;
  description?: string;
  customHeader?: ReactNode;
  navItems: SidebarNavItem[] | SidebarNavGroup[];
  activeItemId: string;
  children: ReactNode;
  sidebarWidth?: string;
  showGroupLabels?: boolean;
  sidebarClassName?: string;
  sidebarProps?: Omit<React.ComponentProps<typeof Sidebar>, "children" | "className">;
}

export function PageWithSidebar({
  title,
  description,
  customHeader,
  navItems,
  activeItemId,
  children,
  sidebarWidth = "18rem",
  showGroupLabels = false,
  sidebarClassName,
  sidebarProps,
}: PageWithSidebarProps) {
  // Normalize navItems to always be groups
  const navGroups: SidebarNavGroup[] = Array.isArray(navItems)
    ? navItems.length > 0 && "items" in navItems[0]
      ? (navItems as SidebarNavGroup[])
      : navItems.length > 0
        ? [{ items: navItems as SidebarNavItem[] }]
        : []
    : [];

  return (
    <div className="absolute inset-0 flex overflow-hidden select-text">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsible="none"
        className={cn(
          "hidden md:flex border-r bg-transparent [&>div[data-sidebar=sidebar]]:bg-transparent [&>div[data-sidebar=sidebar]]:h-full [&>div[data-sidebar=sidebar]]:flex [&>div[data-sidebar=sidebar]]:flex-col",
          sidebarClassName
        )}
        style={{ "--sidebar-width": sidebarWidth } as React.CSSProperties}
        {...sidebarProps}
      >
        {customHeader ? (
          customHeader
        ) : title || description ? (
          <SidebarHeader className="gap-3.5 border-b p-4 shrink-0">
            <div className="space-y-1">
              {title && <h1 className="text-base font-semibold">{title}</h1>}
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </SidebarHeader>
        ) : null}
        <SidebarContent className="overflow-hidden flex-1 min-h-0">
          <SidebarGroup className="px-0 h-full flex flex-col">
            <SidebarGroupContent className="flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto h-full">
                {navGroups.map((group, groupIndex) => (
                  <SidebarGroup key={group.title || groupIndex}>
                    {group.title && showGroupLabels && (
                      <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                    )}
                    <SidebarGroupContent>
                      <SidebarMenu className={group.items[0]?.size === "lg" ? "gap-1" : ""}>
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeItemId === item.id;
                          const handleClick = () => {
                            if (!item.disabled && item.onClick) {
                              item.onClick();
                            }
                          };
                          return (
                            <SidebarMenuItem key={item.id}>
                              <SidebarMenuButton
                                size={item.size || "default"}
                                onClick={handleClick}
                                isActive={isActive}
                                disabled={item.disabled}
                                className={cn(
                                  "w-full justify-start cursor-pointer",
                                  item.size === "lg" && "gap-3 px-3 py-2.5",
                                  isActive &&
                                    "bg-primary text-primary-foreground",
                                  item.disabled && "opacity-60 cursor-not-allowed"
                                )}
                              >
                                <Icon
                                  className={cn(
                                    item.size === "lg" ? "size-4 shrink-0" : "size-4 mr-3",
                                    isActive
                                      ? "text-primary"
                                      : item.color || "text-muted-foreground"
                                  )}
                                />
                                {item.size === "lg" && item.description ? (
                                  <div className="flex-1 min-w-0 text-left">
                                    <div className="text-sm font-medium">{item.label}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {item.description}
                                    </div>
                                  </div>
                                ) : (
                                  <span>{item.label}</span>
                                )}
                                {item.badge && (
                                  typeof item.badge === "string" ? (
                                    <SidebarMenuBadge className={cn(
                                      "ml-auto",
                                      item.size === "lg" && "static text-[10px] h-5 min-w-5 px-1.5"
                                    )}>
                                      {item.badge}
                                    </SidebarMenuBadge>
                                  ) : (
                                    <span className={cn(
                                      "ml-auto",
                                      item.size === "lg" && "static"
                                    )}>
                                      {item.badge}
                                    </span>
                                  )
                                )}
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
