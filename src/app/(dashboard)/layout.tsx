"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Suspense } from "react";
import { CreditInfo } from "@/components/credit-info";
import LoadingScreen from "@/components/LoadingScreen";
import { useEdgeConfig } from "@/providers/EdgeConfigProvider";
import { Info } from "lucide-react";

/* //
 * This is the sidebar auto collapse function.
 * It is used to collapse the sidebar when the user is on a certain route.
 * It is used to prevent the sidebar from being too wide.
 * It is used to prevent the sidebar from being too wide. */
const COLLAPSE_ON_ROUTES = [
  "/agents",
  "/mandates",
  "/governance/audit",
];
function SidebarAutoCollapse() {
  const pathname = usePathname();
  const { setOpen, open } = useSidebar();
  const openRef = useRef(open);
  const prevPathRef = useRef<string | null>(null);

  // Keep open ref in sync without triggering the effect
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    const isCollapseRoute = COLLAPSE_ON_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/"),
    );
    const wasCollapseRoute =
      prevPathRef.current !== null &&
      COLLAPSE_ON_ROUTES.some(
        (route) =>
          prevPathRef.current === route ||
          prevPathRef.current!.startsWith(route + "/"),
      );

    prevPathRef.current = pathname;

    if (isCollapseRoute && !wasCollapseRoute && openRef.current) {
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="overflow-x-hidden">
      <SidebarAutoCollapse />
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-x-hidden max-w-full flex flex-col h-screen">
        <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-1.5 flex items-center justify-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-medium shrink-0">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>Demo environment — all data is simulated. No real transactions or agents.</span>
        </div>
        <header className="bg-background sticky top-0 z-50 flex shrink-0 items-center gap-2 border-b p-2 overflow-x-hidden">
          <div className="flex items-center gap-2 px-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumb />
          </div>

          <div className="ml-auto hidden md:flex items-center gap-4">
            <CreditInfo variant="header" showAction={false} className="pr-5" />
          </div>
        </header>

        {/* Make this the scrollable area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className="flex flex-col gap-4 p-0">
            <Suspense fallback={<LoadingScreen />}>
              <div className="min-w-0 overflow-x-hidden">{children}</div>
            </Suspense>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
