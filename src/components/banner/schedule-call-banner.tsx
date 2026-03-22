"use client";

import { useState, useEffect } from "react";
import { Calendar, X } from "lucide-react";
import { SITE_CONFIG } from "@/config/platform/site_config";
import { Button } from "../ui/button";

const STORAGE_KEY = "schedule-call-banner-dismissed";

export function ScheduleCallBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
  };

  const bookingUrl =
    process.env.NEXT_PUBLIC_SCHEDULE_CALL_URL ||
    `mailto:${SITE_CONFIG.supportEmail}?subject=Schedule a Call`;

  if (!isVisible) {
    return null;
  }

  return (
    <div className="p-4 sm:p-5 rounded-xl border bg-card flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-7">
      <div className="w-[42px] h-[42px] rounded-lg flex items-center justify-center border bg-primary/10 border-primary/20 shrink-0">
        <Calendar size={20} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground mb-1">
          Need help getting started with OpenCard?
        </div>
        <div className="text-xs text-muted-foreground">
          Schedule a free 1-on-1 with our team. We&apos;ll help you get
          set up and get the most out of OpenCard.
        </div>
      </div>
      <Button
        asChild
        size="sm"
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-normal whitespace-normal sm:whitespace-nowrap hover:bg-primary/90 transition-colors w-full sm:w-auto shrink-0 text-center"
      >
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
          Schedule a Call
        </a>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={handleClose}
        className="bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground p-1 transition-colors shrink-0 self-end sm:self-auto"
        aria-label="Close banner"
      >
        <X size={16} />
      </Button>
    </div>
  );
}
