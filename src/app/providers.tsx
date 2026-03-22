"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CreditProvider } from "@/contexts/credit-context";
import { EdgeConfigProvider } from "@/providers/EdgeConfigProvider";

export function Providers({
  children,
  edgeConfigs,
}: {
  children: React.ReactNode;
  edgeConfigs: Record<string, boolean | string | number>;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <EdgeConfigProvider initialEdgeConfigs={edgeConfigs}>
        <TooltipProvider>
          <CreditProvider enableOptimisticUpdates={true}>
            {children}
          </CreditProvider>
        </TooltipProvider>
      </EdgeConfigProvider>
    </ThemeProvider>
  );
}
