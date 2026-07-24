/**
 * Seed script: creates the `owner` account from env vars.
 * Idempotent -- running it twice does not create a duplicate owner.
 *
 * Run with: npm run db:seed
 */
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function main() {
  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;
  const name = process.env.SEED_OWNER_NAME ?? "Owner";

  if (!email || !password) {
    throw new Error("SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD must be set");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Owner account already exists for ${email}, skipping.`);
    return;
  }

  await auth.api.signUpEmail({
    body: { email, password, name },
  });

  await prisma.user.update({
    where: { email },
    data: { role: "owner" },
  });

  console.log(`Owner account created for ${email}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
