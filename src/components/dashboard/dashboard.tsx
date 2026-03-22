"use client";

import { useUser } from "@clerk/nextjs";
import { SITE_CONFIG } from "@/config/platform/site_config";

export function Dashboard() {
  const { user } = useUser();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 pb-15">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-light text-foreground tracking-tight mb-1.5">
              {greeting},{" "}
              <span className="font-semibold">
                {user?.firstName ?? "there"}.
              </span>
            </h1>
            <p className="text-sm text-muted-foreground font-normal">
              Welcome to <span className="font-serif-italic">{SITE_CONFIG.siteName}</span> — the authorization layer for AI agent payments.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Your dashboard is being built. Check back soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
