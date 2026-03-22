"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Gift, Users, Send, HandHeart } from "lucide-react";
import { toast } from "sonner";
import { SITE_CONFIG } from "@/config/platform/site_config";
import { Input } from "../ui/input";
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "../ui/skeleton";

interface ReferralData {
  code: string;
  referralUrl: string;
}

interface ReferralStats {
  totalReferrals: number;
  creditsEarned: number;
  recentReferrals: Array<{
    refereeEmail: string;
    earnedAt: string;
    credits: number;
  }>;
}

interface ReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReferralDialog({ open, onOpenChange }: ReferralDialogProps) {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const { user } = useUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress || "";
  const fetchingStats = useRef(false);

  const freeCredits = process.env.NEXT_PUBLIC_REFERRAL_FREE_CREDITS || 50;

  // Fetch stats when rewards tab is accessed
  const fetchStats = useCallback(async () => {
    if (stats || fetchingStats.current) return;

    fetchingStats.current = true;
    setStatsLoading(true);
    try {
      const response = await fetch("/api/referrals/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error("Stats API error:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response:", errorText);
      }
    } catch (error) {
      console.error("Failed to fetch referral stats:", error);
    } finally {
      setStatsLoading(false);
      fetchingStats.current = false;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch referral code and stats when dialog opens
  useEffect(() => {
    if (open) {
      if (!referralData) {
        fetchReferralCode();
      }
      // Reset stats to force fresh fetch
      setStats(null);
      fetchStats();
    }
  }, [open, referralData, fetchStats]);

  const fetchReferralCode = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/referrals/code");
      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
      } else {
        toast.error("Failed to get referral code");
      }
    } catch (error) {
      console.error("Failed to fetch referral code:", error);
      toast.error("Failed to get referral code");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!referralData) return;

    try {
      await navigator.clipboard.writeText(referralData.referralUrl);
      toast.success("Referral link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="flex gap-2 text-xl font-bold text-primary">
            <HandHeart className="h-6 w-6" /> Invite to get Credits
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Share your invitation link with friends, get {freeCredits} credits
            each.
          </p>
        </DialogHeader>

        <Tabs defaultValue="invite" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger
              value="invite"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Gift className="h-4 w-4" />
              Invite Friends
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              onClick={fetchStats}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Users className="h-4 w-4" />
              Share & Earn
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invite" className="space-y-4">
            <div className="text-center space-y-1">
              {/* <h3 className="text-lg font-medium text-primary">
                Invite Friends, Earn Credits
              </h3> */}
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Share your unique referral link and earn{" "}
                <span className="font-bold text-primary">
                  {freeCredits} free credits
                </span>{" "}
                each for every friend who signs up.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-background border-border">
                <CardContent className="p-2 text-center">
                  <div className="text-sm text-muted-foreground mb-0.5">
                    Total Referrals
                  </div>
                  <div className="text-xl font-bold text-primary flex justify-center">
                    {statsLoading || !stats ? (
                      <Skeleton className="w-16 h-5 mx-auto" />
                    ) : (
                      stats.totalReferrals
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-background border-border">
                <CardContent className="p-2 text-center">
                  <div className="text-sm text-muted-foreground mb-0.5">
                    Credits Earned
                  </div>
                  <div className="text-xl font-bold text-primary flex justify-center">
                    {statsLoading || !stats ? (
                      <Skeleton className="w-16 h-5 mx-auto" />
                    ) : (
                      stats.creditsEarned
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Referral Link Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Input
                  type="url"
                  value={referralData?.referralUrl || ""}
                  readOnly
                  disabled
                  className=""
                />
                <Button
                  variant="default"
                  onClick={copyToClipboard}
                  disabled={!referralData || loading}
                  size="sm"
                  className="cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  Copy Invite Link
                </Button>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-background border border-border rounded-lg p-3">
              <h4 className="font-medium text-primary text-sm mb-2">
                How it works:
              </h4>
              <ol className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[11px] font-medium">
                    1
                  </span>
                  Share your referral link.
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[11px] font-medium">
                    2
                  </span>
                  They sign up with your link.
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[11px] font-medium">
                    3
                  </span>
                  Both you and your friend earn {freeCredits} free credits each.
                </li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-bold text-primary">
                Share about us on Social Media
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Share our content on any social platform and earn {freeCredits}{" "}
                free credits per verified share
              </p>
            </div>
            {/* Link to Social Media Post */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Paste the URL of your post after sharing on any platform
              </label>
              <Input
                type="url"
                placeholder={SITE_CONFIG.socialMediaLinks.linkedin}
                className="w-full text-sm border border-border rounded-md bg-background text-foreground"
              />
            </div>

            {/* Submit Button */}
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              variant="default"
              size="sm"
              onClick={() => {
                const input =
                  document.querySelector<HTMLInputElement>('input[type="url"]');
                const url = input?.value || "";
                const subject = encodeURIComponent(
                  `Social Share Verification - ${SITE_CONFIG.siteName}`
                );
                const body = encodeURIComponent(
                  `Hi,\n\nI've shared about ${SITE_CONFIG.siteName} on social media. Here is the link to my post:\n${url}\n\nPlease verify my share and credit my account.\n\nMy email is: ${userEmail}.\n\nMy referral code is: ${referralData?.code || ""}\n\n\nThank you!`
                );
                window.open(
                  `mailto:${SITE_CONFIG.supportEmail}?subject=${subject}&body=${body}`
                );
              }}
            >
              <Send className="h-4 w-4" />
              Submit for Verification
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              We&apos;ll verify your share and credit your account
            </p>

            {/* How it works */}
            <div className="bg-background border border-border rounded-lg p-3">
              <h4 className="font-medium text-primary text-sm mb-2">
                How it works:
              </h4>
              <ol className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[11px] font-medium">
                    1
                  </span>
                  Share our content on any social media platform.
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[11px] font-medium">
                    2
                  </span>
                  Copy the link to your post.
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[11px] font-medium">
                    3
                  </span>
                  Submit the link along with your email for verification.
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[11px] font-medium">
                    4
                  </span>
                  We&apos;ll verify your share and credit your account.
                </li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
