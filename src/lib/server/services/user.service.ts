import prisma from "@/config/db/prisma";
import { Prisma, User } from "@prisma/client";
import CacheService, {
  CacheTTL,
  CacheKeys,
} from "@/lib/server/cache/cache.service";

export const createUser = async (user: Prisma.UserCreateInput) => {
  const newUser = await prisma.user.create({
    data: user,
  });
  return newUser;
};

export const getUserByClerkId = async (clerkId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId,
      },
    });

    return user;
  } catch (error) {
    console.error(`Failed to get user by clerk id: ${clerkId}`, error);
    throw new Error("Failed to get user.");
  }
};

export const getUserProfile = async (options: Prisma.UserFindUniqueArgs) => {
  try {
    // Create cache key based on where clause (only cache simple id lookups)
    const userId = options.where?.id;
    const clerkId = options.where?.clerkId;

    // If we have a simple lookup, use caching
    if (userId && Object.keys(options.where || {}).length === 1) {
      return await prisma.user.findUnique(options);
    }

    // If clerkId lookup, use the clerk cache key
    if (clerkId && Object.keys(options.where || {}).length === 1) {
      return await prisma.user.findUnique(options);
    }

    // For complex queries, skip caching
    const user = await prisma.user.findUnique(options);
    return user;
  } catch (error) {
    console.error(`Failed to get user by profile.`, error);
    throw new Error("Failed to get user.");
  }
};

export const syncUserWithClerk = async (
  clerkId: string,
  email: string,
  name: string,
  referralCode?: string,
  metadata?: { ip?: string; userAgent?: string }
): Promise<User> => {
  try {
    let isNewUser = false;

    const result = await prisma.$transaction(async (prisma) => {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { clerkId },
      });

      if (existingUser) {
        return existingUser;
      }

      // Create new user
      isNewUser = true;
      const newUser = await prisma.user.create({
        data: {
          clerkId,
          email,
          name,
        },
      });

      return newUser;
    });

    // If new user, create free subscription and credits
    if (isNewUser) {
      const { createFreeSubscription } = await import("./subscription.service");
      await createFreeSubscription(result.id);
      console.log(`✅ Created free trial subscription for user ${result.id}`);

      // Process referral code if provided
      if (referralCode) {
        try {
          const { processReferralSignup } = await import("./referral.service");
          const referralResult = await processReferralSignup(
            referralCode,
            result.id,
            metadata
          );

          if (referralResult.success) {
            console.log(
              `✅ Processed referral signup for user ${result.id} with code ${referralCode}`
            );
          } else {
            console.warn(
              `⚠️ Failed to process referral for user ${result.id}: ${referralResult.error}`
            );
          }
        } catch (error) {
          console.error(
            `❌ Error processing referral for user ${result.id}:`,
            error
          );
        }
      }
    }

    // Invalidate cache after user update/create
    const cacheKeys = [
      CacheKeys.UserByClerkId(clerkId),
      CacheKeys.UserById(result.id.toString()),
    ];
    await CacheService.invalidate(cacheKeys);

    return result;
  } catch (error) {
    console.error("Error synchronizing user:", error);
    throw new Error("Failed to synchronize user.");
  }
};

export const deleteUser = async (userId: string, clerkId: string) => {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    // Invalidate cache
    const cacheKeys = [
      CacheKeys.UserByClerkId(clerkId),
      CacheKeys.UserById(userId),
    ];
    await CacheService.invalidate(cacheKeys);
  } catch (error) {
    console.error(`Failed to delete user: ${userId}`, error);
    throw new Error("Failed to delete user.");
  }
};

// TODO
// check if user exists in clerk
// if not, create user in clerk
// if exists in clerk, and not in database, create user in User table in database
// if exists in database and not in clerk, delete user from User table in database (maybe)
// if user exists in both, do nothing and return the user

/**
 * Synchronizes a user between Clerk (auth provider) and the local database.
 * Ensures the user has a trial subscription and a container, performing actions depending on whether the user is new or existing.
 *
 * @param userId - The Clerk user ID.
 * @param email - The user's email address.
 * @returns The synced User object.
 */
/* export const syncUserWithClerk1 = async (userId: string, email: string): Promise<User> => {
  try {
    // Run all DB operations inside a transaction for atomicity.
    return await prisma.$transaction(async (prisma) => {
      // Upsert the user based on Clerk ID: update if exists, otherwise create.
      let existingUser: any = await prisma.user.upsert({
        where: { clerkId: userId },
        update: {},
        create: {
          clerkId: userId,
          email: email,
        },
      });

      // Determine if the user is "new": no container and no individual subscriptions
      const isNewUser =
        !existingUser.container &&
        existingUser.individualSubscriptions.length === 0;

      if (isNewUser) {
        // For a new user, create an individual trial subscription in the DB
        await createIndividualTrialInTransaction(userId, prisma);

        // Create and assign a sanitized container name for the user
        const containerName = sanitizeContainerName(`container-${userId}`);
        await ensureUserContainer(containerName);

        // Update the user record with the container name and fetch their subscriptions and org memberships
        existingUser = await prisma.user.update({
          where: { clerkId: userId },
          data: { container: containerName },
          include: {
            individualSubscriptions: {
              where: {
                organisationId: null,
                status: { in: ["Active", "Trial"] },
              },
            },
            organisationMemberships: {
              include: {
                organisation: {
                  include: {
                    subscriptions: {
                      where: { status: { in: ["Active", "Trial"] } },
                    },
                  },
                },
              },
            },
          },
        });

        // Return the updated new user
        return existingUser;
      } else {
        // For existing users, check for active subscriptions (individual or via organization)
        const hasIndividualSub =
          existingUser.individualSubscriptions.length > 0;
        const hasOrgSub = existingUser.organisationMemberships.some(
          (membership: any) =>
            membership?.organisation?.subscriptions?.length > 0
        );

        // If the user has no subscriptions, create an individual trial
        if (!hasIndividualSub && !hasOrgSub) {
          console.log(
            `Creating trial for existing user without subscription: ${userId}`
          );
          await createIndividualTrialInTransaction(userId, prisma);
        }

        // Ensure the user has a container; create it if missing
        if (!existingUser.container) {
          const containerName = sanitizeContainerName(`container-${userId}`);
          await ensureUserContainer(containerName);

          existingUser = await prisma.user.update({
            where: { clerkId: userId },
            data: { container: containerName },
          });
        }
        // If the current container name doesn't match the sanitized format, rename it
        else if (existingUser.container === `container-${existingUser.id}`) {
          const oldContainerName = existingUser.container;
          const newContainerName = sanitizeContainerName(`container-${userId}`);

          await renameUserContainer(oldContainerName, newContainerName);

          existingUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: { container: newContainerName },
          });
        }

        // Log for auditing and return the existing user record
        console.log(`Existing user synced: ${userId}`);
        return existingUser;
      }
    });
  } catch (error) {
    // Catch and log errors, then rethrow as a generic error.
    console.error("Error synchronizing user:", error);
    throw new Error("Failed to synchronize user");
  }
};
 */
