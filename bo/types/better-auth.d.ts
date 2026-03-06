/**
 * Better Auth Type Extensions
 * 
 * This file extends Better Auth types to include custom fields from the Prisma schema.
 * It ensures type safety across the application when using Better Auth with custom user properties.
 */

import type { UserRole } from "@/generated/prisma";

declare module "better-auth/types" {
  interface User {
    /**
     * Custom user role field from Prisma schema
     * Maps to UserRole enum: 'admin' | null
     */
    role?: UserRole | null;
    
    /**
     * Username field from Better Auth username plugin
     */
    username?: string | null;
    
    /**
     * Display username field from Better Auth username plugin
     */
    displayUsername?: string | null;
    
    /**
     * User ban status (custom field)
     */
    banned?: boolean | null;
    
    /**
     * Reason for user ban (custom field)
     */
    banReason?: string | null;
    
    /**
     * Ban expiration date (custom field)
     */
    banExpires?: Date | null;
  }

  interface Session {
    /**
     * User data with extended properties
     */
    user: User;
    
    /**
     * Active organization ID from Better Auth organization plugin
     */
    activeOrganizationId?: string | null;
    
    /**
     * Active team ID from Better Auth teams feature
     */
    activeTeamId?: string | null;
  }
}

declare module "better-auth" {
  interface BetterAuthOptions {
    /**
     * Additional user fields configuration
     */
    user?: {
      additionalFields?: {
        role?: {
          type: "string";
          required?: boolean;
        };
        username?: {
          type: "string";
          required?: boolean;
        };
        displayUsername?: {
          type: "string";
          required?: boolean;
        };
        banned?: {
          type: "boolean";
          required?: boolean;
        };
        banReason?: {
          type: "string";
          required?: boolean;
        };
        banExpires?: {
          type: "date";
          required?: boolean;
        };
      };
    };
  }
}

// Re-export commonly used types for convenience
export type { User, Session } from "better-auth/types";

// Custom utility types for the application
export type AuthUser = NonNullable<Session['user']>;
export type AuthSession = Session;

// Helper type for system admin checking
export type SystemAdmin = AuthUser & { role: 'admin' };

// Helper type for organization context
export type OrganizationSession = AuthSession & { 
  activeOrganizationId: string;
};