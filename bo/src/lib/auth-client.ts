"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, magicLinkClient, organizationClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    usernameClient(),
    adminClient(),
    magicLinkClient(),
    organizationClient({
      teams: {
        enabled: true
      }
    })
  ],
  
  // Enable automatic session fetching
  fetchOptions: {
    onError: (context) => {
      // Handle authentication errors gracefully
      if (context.response.status === 401) {
        console.warn("Session expired or invalid");
      }
    },
  },
});

// Export all the hooks and methods from authClient that actually exist
export const { 
  useSession, 
  signIn, 
  signOut, 
  signUp,
  changePassword,
  updateUser,
  setPassword,
  resetPassword,
  getSession,
  username,
  admin,
  organization,
  magicLink,
  // Organization hooks with proper types
  useListOrganizations,
  useActiveOrganization
} = authClient;

// Type inference helpers for auth client hooks
export type AuthSession = NonNullable<ReturnType<typeof useSession>['data']>;
export type AuthUser = AuthSession['user'];
export type AuthOrganization = NonNullable<ReturnType<typeof useListOrganizations>['data']>[number];
export type AuthActiveOrganization = NonNullable<ReturnType<typeof useActiveOrganization>['data']>;