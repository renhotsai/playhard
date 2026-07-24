import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin as adminPlugin } from "better-auth/plugins/admin";
import prisma from "@/lib/prisma";
import { ac, owner, employee, user } from "@/lib/auth-access-control";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    // Avoid colliding with the app's existing game-`Session` model:
    // the auth session table is named `AuthSession` in the Prisma schema.
    modelName: "AuthSession",
  },
  plugins: [
    adminPlugin({
      ac,
      roles: { owner, employee, user },
      defaultRole: "user",
    }),
  ],
});
