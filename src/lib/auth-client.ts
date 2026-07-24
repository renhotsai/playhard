import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, owner, employee, user } from "@/lib/auth-access-control";

export const authClient = createAuthClient({
  plugins: [adminClient({ ac, roles: { owner, employee, user } })],
});

export const { signIn, signUp, signOut, useSession } = authClient;
