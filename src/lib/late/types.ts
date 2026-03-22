export const SOCIAL_PLATFORMS = [
  "linkedin",
  "twitter",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "pinterest",
  "threads",
  "bluesky",
  "snapchat",
  "reddit",
  "telegram",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/** Platforms currently enabled for user connection */
export const ENABLED_PLATFORMS: SocialPlatform[] = ["linkedin", "twitter"];

export const PLATFORM_DISPLAY_NAMES: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  twitter: "X (Twitter)",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
  threads: "Threads",
  bluesky: "Bluesky",
  snapchat: "Snapchat",
  reddit: "Reddit",
  telegram: "Telegram",
};

export const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  linkedin: "#0A66C2",
  twitter: "#000000",
  instagram: "#E4405F",
  facebook: "#1877F2",
  tiktok: "#000000",
  youtube: "#FF0000",
  pinterest: "#BD081C",
  threads: "#000000",
  bluesky: "#0085FF",
  snapchat: "#FFFC00",
  reddit: "#FF4500",
  telegram: "#26A5E4",
};

export const PLATFORM_CHAR_LIMITS: Partial<Record<SocialPlatform, number>> = {
  twitter: 280,
  bluesky: 300,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
  threads: 500,
  tiktok: 2200,
  reddit: 40000,
  telegram: 4096,
};

export interface LateAccount {
  _id: string;
  platform: string;
  displayName?: string;
  username?: string;
  profilePicture?: string;
  status?: string;
}

export interface LatePost {
  _id: string;
  content: string;
  mediaItems?: Array<{
    type: "image" | "video";
    url: string;
    altText?: string;
  }>;
  platforms: Array<{
    platform: string;
    accountId: string;
    status?: string;
    publishedUrl?: string;
  }>;
  status: "draft" | "scheduled" | "published" | "failed" | "partial";
  scheduledFor?: string;
  publishedAt?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostInput {
  content: string;
  mediaItems?: Array<{
    type: "image" | "video";
    url: string;
    altText?: string;
  }>;
  platforms: Array<{
    platform: string;
    accountId: string;
  }>;
  publishNow?: boolean;
  scheduledFor?: string;
  timezone?: string;
}
