import prisma from "@/config/db/prisma";
import { Referral, CreditTransactionType } from "@prisma/client";
import { SITE_CONFIG } from "@/config/platform/site_config";

/**
 * Generate a unique 8-character alphanumeric referral code
 */
function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get or create user's referral code
 */
export async function getUserReferralCode(clerkId: string): Promise<string> {
  try {
    // First, get the user's database ID from their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      throw new Error("User not found in database");
    }

    const userId = user.id;

    // Check if user already has a referral code
    const existingReferral = await prisma.referral.findFirst({
      where: { referrerId: userId },
      select: { referralCode: true },
    });

    if (existingReferral) {
      return existingReferral.referralCode;
    }

    // Generate new referral code (ensure uniqueness)
    let referralCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    console.log("Generating referral code for user:", userId);
    while (!isUnique && attempts < maxAttempts) {
      referralCode = generateReferralCode();
      console.log("Trying referral code:", referralCode);
      const existing = await prisma.referral.findUnique({
        where: { referralCode },
      });
      console.log("Existing referral code:", existing);
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    console.log("Is unique:", isUnique);
    if (!isUnique) {
      throw new Error("Failed to generate unique referral code");
    }

    console.log("Creating referral record for user in db:", userId);
    // Create referral record
    await prisma.referral.create({
      data: {
        referrerId: userId,
        referralCode: referralCode!,
      },
    });
    console.log("Referral record created for user in db:", userId);

    return referralCode!;
  } catch (error) {
    console.error("Error getting user referral code:", error);
    throw new Error("Failed to get referral code");
  }
}

/**
 * Get referral details by code
 */
export async function getReferralByCode(
  code: string
): Promise<Referral | null> {
  try {
    return await prisma.referral.findUnique({
      where: { referralCode: code },
      include: {
        referrerUser: {
          select: { id: true, email: true, name: true },
        },
        refereeUser: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  } catch (error) {
    console.error("Error getting referral by code:", error);
    return null;
  }
}

/**
 * Validate referral code eligibility
 */
export async function validateReferralCode(
  code: string,
  newUserId: string
): Promise<{ valid: boolean; error?: string; referral?: Referral }> {
  try {
    // Get referral details
    const referral = await getReferralByCode(code);
    if (!referral) {
      return { valid: false, error: "Invalid referral code" };
    }

    // Check if already used
    if (referral.refereeId) {
      return { valid: false, error: "Referral code already used" };
    }

    // Check if self-referral
    if (referral.referrerId === newUserId) {
      return { valid: false, error: "Cannot refer yourself" };
    }

    // Check if user already used a referral code
    const userAlreadyReferred = await prisma.user.findFirst({
      where: {
        id: newUserId,
        referredByCode: { not: null },
      },
    });

    if (userAlreadyReferred) {
      return { valid: false, error: "User already used a referral code" };
    }

    // Simple rate limiting check (database-based)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentUses = await prisma.referral.count({
      where: {
        referralCode: code,
        usedAt: { gte: oneHourAgo },
      },
    });

    if (recentUses >= 5) {
      return { valid: false, error: "Referral code rate limit exceeded" };
    }

    return { valid: true, referral };
  } catch (error) {
    console.error("Error validating referral code:", error);
    return { valid: false, error: "Validation failed" };
  }
}

/**
 * Process referral signup and award credits
 */
export async function processReferralSignup(
  code: string,
  newUserId: string,
  metadata?: { ip?: string; userAgent?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate referral code
    const validation = await validateReferralCode(code, newUserId);
    if (!validation.valid || !validation.referral) {
      return { success: false, error: validation.error };
    }

    const referral = validation.referral;

    // Atomic transaction to award credits and update referral
    await prisma.$transaction(async (tx) => {
      // Update referral record
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          refereeId: newUserId,
          creditsAwarded: true,
          usedAt: new Date(),
        },
      });

      // Update user's referredByCode
      await tx.user.update({
        where: { id: newUserId },
        data: { referredByCode: code },
      });

      // Award 50 credits to referrer
      await tx.creditBalance.update({
        where: { userId: referral.referrerId },
        data: {
          creditsRemaining: { increment: 50 },
          creditsAllocated: { increment: 50 },
        },
      });

      // Award 50 credits to referee
      await tx.creditBalance.update({
        where: { userId: newUserId },
        data: {
          creditsRemaining: { increment: 50 },
          creditsAllocated: { increment: 50 },
        },
      });

      // Create credit transaction for referrer
      await tx.creditTransaction.create({
        data: {
          userId: referral.referrerId,
          type: CreditTransactionType.REFERRAL_REWARD,
          amount: 50,
          balanceAfter: 0, // Will be updated after transaction
          reason: "Referral reward - friend signed up",
          metadata: {
            referralCode: code,
            refereeId: newUserId,
            refereeEmail: metadata?.ip || "unknown",
          },
        },
      });

      // Create credit transaction for referee
      await tx.creditTransaction.create({
        data: {
          userId: newUserId,
          type: CreditTransactionType.REFERRAL_REWARD,
          amount: 50,
          balanceAfter: 0, // Will be updated after transaction
          reason: "Referral signup bonus",
          metadata: {
            referralCode: code,
            referrerId: referral.referrerId,
            referrerEmail: "Unknown", // We'll get this from the database query if needed
            ip: metadata?.ip || "unknown",
            userAgent: metadata?.userAgent || "unknown",
          },
        },
      });
    });

    // Rate limiting is handled by the usedAt timestamp in the database

    return { success: true };
  } catch (error) {
    console.error("Error processing referral signup:", error);
    return { success: false, error: "Failed to process referral" };
  }
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(clerkId: string): Promise<{
  totalReferrals: number;
  creditsEarned: number;
  recentReferrals: Array<{
    refereeEmail: string;
    earnedAt: Date;
    credits: number;
  }>;
}> {
  try {
    console.log("getReferralStats called with clerkId:", clerkId);
    // First, get the user's database ID from their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    console.log("User found:", user);
    if (!user) {
      throw new Error("User not found in database");
    }

    const userId = user.id;
    console.log("User ID:", userId);

    // Get total referrals from Referral table
    const totalReferrals = await prisma.referral.count({
      where: {
        referrerId: userId,
        creditsAwarded: true,
      },
    });

    // Get credits earned from CreditTransaction table
    const creditsEarnedResult = await prisma.creditTransaction.aggregate({
      where: {
        userId,
        type: CreditTransactionType.REFERRAL_REWARD,
        amount: { gt: 0 }, // Only positive amounts (earned)
      },
      _sum: {
        amount: true,
      },
    });

    const creditsEarned = creditsEarnedResult._sum.amount || 0;

    // Get recent referrals
    const recentReferrals = await prisma.creditTransaction.findMany({
      where: {
        userId,
        type: CreditTransactionType.REFERRAL_REWARD,
        amount: { gt: 0 },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        createdAt: true,
        amount: true,
        metadata: true,
      },
    });

    const recentReferralsFormatted = recentReferrals.map((tx) => ({
      refereeEmail:
        (tx.metadata as { refereeEmail?: string })?.refereeEmail || "Unknown",
      earnedAt: tx.createdAt,
      credits: tx.amount,
    }));

    const result = {
      totalReferrals,
      creditsEarned,
      recentReferrals: recentReferralsFormatted,
    };
    console.log("Returning stats result:", result);
    return result;
  } catch (error) {
    console.error("Error getting referral stats:", error);
    const errorResult = {
      totalReferrals: 0,
      creditsEarned: 0,
      recentReferrals: [],
    };
    console.log("Returning error result:", errorResult);
    return errorResult;
  }
}

/**
 * Get user's referral code with full URL
 */
export async function getReferralUrl(clerkId: string): Promise<{
  code: string;
  referralUrl: string;
}> {
  const code = await getUserReferralCode(clerkId);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || SITE_CONFIG.siteUrl;
  const referralUrl = `${baseUrl}/auth/register?ref=${code}`;

  return { code, referralUrl };
}
