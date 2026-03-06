// Corrected Better Auth Configuration for Organization Invitations

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma";
import { 
  admin,
  magicLink, 
  openAPI, 
  organization, 
  username 
} from "better-auth/plugins";

const prisma = new PrismaClient();

export const auth = betterAuth({
  // Database configuration
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  
  // Basic configuration
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  
  // Trusted origins for CORS and security
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ],
  
  // Enable email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for admin-created accounts
    
    // Custom password reset email handler
    sendResetPassword: async (data) => {
      const { sendPasswordResetEmail } = await import("./email");
      await sendPasswordResetEmail(data.user.email, data.url);
    },
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  
  // Plugins configuration
  plugins: [
    // OpenAPI plugin for API documentation
    openAPI(),
    
    // Username plugin for username support
    username(),
    
    // Admin plugin for system-level administrators
    admin({
      defaultRole: "member", // Default role for new users
      impersonationSessionDuration: 60 * 60 * 24, // 24 hours for impersonation sessions
    }),
    
    // ✅ CORRECTED: Organization plugin with proper invitation handling
    organization({
      allowUserToCreateOrganization: false, // 限制組織創建 - 只有系統管理員可創建
      organizationLimit: 1, // 每用戶限制加入組織數
      
      // Enable teams within organizations for permission inheritance
      teams: {
        enabled: true,
      },
      
      // ✅ CORRECTED: Better Auth compliant invitation email handler
      sendInvitationEmail: async (data) => {
        const { sendMagicLinkEmail } = await import("./email");

        // data contains Better Auth's invitation structure:
        // data.invitation.id, data.invitation.organizationId, data.invitation.role
        // data.email, data.organizationName, data.inviter (user who sent invitation)
        
        // Build invitation URL from invitation ID (Better Auth provides this)
        const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.invitation.id}`;

        await sendMagicLinkEmail({
          email: data.email,
          url: invitationUrl,
          token: data.invitation.id, // Use invitation ID as token
          // Additional context for email template
          organizationName: data.organizationName || 'Organization',
          inviterName: data.inviter?.name || 'Team Member',
          role: data.invitation.role
        });
      },
    }),
    
    // Magic link plugin for passwordless authentication
    magicLink({
      expiresIn: 60 * 15, // 15 minutes
      sendMagicLink: async (data) => {
        const { sendMagicLinkEmail } = await import("./email");
        
        await sendMagicLinkEmail({
          email: data.email,
          url: data.url,
          token: data.token
        });
      }
    }),
  ],
});