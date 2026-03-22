// this code is from:https://www.prisma.io/docs/guides/nextjs
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Ensure Prisma is only used on the server side
if (typeof window !== "undefined") {
  throw new Error("Prisma should only be used on the server side");
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const prisma =
  globalForPrisma.prisma || new PrismaClient().$extends(withAccelerate());

// In development, store Prisma instance on the global object to prevent hot-reload issues
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
