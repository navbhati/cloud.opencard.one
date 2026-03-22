"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ReferralDialog } from "./referral-dialog";
import { Gift, ChevronRight, HandHeart, X } from "lucide-react";
import { SITE_CONFIG } from "@/config/platform/site_config";

const REFERRAL_BANNER_DISMISSED_KEY = "referral-banner-dismissed";

function ReferralBannerDismissible({ className }: { className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const freeCredits = process.env.NEXT_PUBLIC_REFERRAL_FREE_CREDITS || 50;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem(REFERRAL_BANNER_DISMISSED_KEY);
      if (!dismissed) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(REFERRAL_BANNER_DISMISSED_KEY, "true");
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div
        className={`w-full bg-muted hover:bg-muted/80 border border-border rounded-lg px-1 py-2 flex items-center gap-2 cursor-pointer transition-colors ${className ?? ""}`}
        onClick={() => setDialogOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDialogOpen(true);
          }
        }}
      >
        <HandHeart className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 text-left">
          <div className="text-foreground font-medium text-xs">
            Share {SITE_CONFIG.siteName} with a friend
          </div>
          <div className="text-muted-foreground text-[10px] mt-1">
            Get {freeCredits} credits each
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="shrink-0 self-start p-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded"
          aria-label="Close banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <ReferralDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

interface ReferralButtonProps {
  variant?: "sidebar" | "outline" | "default" | "banner" | "banner-dismissible";
  className?: string;
}

export function ReferralButton({
  variant = "default",
  className,
}: ReferralButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (variant === "default") {
    return (
      <>
        <Button
          variant="outline"
          className={`w-full justify-start gap-2 ${className}`}
          onClick={() => setDialogOpen(true)}
        >
          <Gift className="h-4 w-4" />
          Earn Credits
        </Button>
        <ReferralDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  if (variant === "outline") {
    return (
      <>
        <span
          className="cursor-pointer w-full justify-start flex gap-2 text-primary font-medium"
          onClick={() => setDialogOpen(true)}
        >
          <Gift className="h-4 w-4" />
          Earn Credits
        </span>
        <ReferralDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  if (variant === "banner") {
    const freeCredits = process.env.NEXT_PUBLIC_REFERRAL_FREE_CREDITS || 50;
    return (
      <>
        <button
          className={`w-full bg-muted hover:bg-muted/80 border border-border rounded-lg px-1 py-2 flex items-center gap-2 cursor-pointer transition-colors ${className}`}
          onClick={() => setDialogOpen(true)}
        >
          <HandHeart className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 text-left">
            <div className="text-foreground font-medium text-xs">
              Share {SITE_CONFIG.siteName} with a friend
            </div>
            <div className="text-muted-foreground text-[10px] mt-1">
              Get {freeCredits} credits each
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
        <ReferralDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  if (variant === "banner-dismissible") {
    return <ReferralBannerDismissible className={className} />;
  }

  return (
    <>
      <Button
        className={`gap-2 ${className}`}
        onClick={() => setDialogOpen(true)}
      >
        <Gift className="h-4 w-4" />
        Earn Credits
      </Button>
      <ReferralDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
