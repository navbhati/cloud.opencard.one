// prisma/seed.ts
import { seedPlans } from "./seeds/plans.seed";
import prisma from "@/config/db/prisma";

async function main() {
  console.log("Starting database seeding...");

  await seedPlans();

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
