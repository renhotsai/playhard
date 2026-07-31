/**
 * Seeds the full catalog of scripts. Idempotent -- running it twice does not
 * create duplicates (skips entirely if any Script rows already exist).
 *
 * Run with: npm run db:seed:scripts
 */
import prisma from "@/lib/prisma";
import { seedScripts } from "./seed-data/scripts";

async function main() {
  const existingCount = await prisma.script.count();

  if (existingCount > 0) {
    console.log(`Scripts table already has ${existingCount} row(s), skipping.`);
    return;
  }

  for (const script of seedScripts) {
    await prisma.script.create({ data: script });
  }

  console.log(`Seeded ${seedScripts.length} scripts.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
