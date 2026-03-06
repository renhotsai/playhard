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
    
    // Organization plugin for ORGANIZATION-LEVEL multi-tenant support (FRESH & SIMPLIFIED)
    organization({
      allowUserToCreateOrganization: false, // 限制組織創建 - 只有系統管理員可創建
      organizationLimit: 1, // 每用戶限制加入組織數
      
      // Enable teams within organizations for permission inheritance
      teams: {
        enabled: true,
      },
      
      // Enhanced invitation email handler with role-specific templates
      sendInvitationEmail: async (data) => {
        const { sendMagicLinkEmail } = await import("./email");

        // Build invitation URL from invitation ID
        const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.invitation.id}`;

        // Determine role-specific email template data
        // Note: Better Auth organization invitation doesn't include role info directly
        // We'll use a generic organization role approach, but this can be enhanced
        // with custom invitation metadata in future versions
        
        await sendMagicLinkEmail({
          email: data.email,
          url: invitationUrl,
          token: data.invitation.id,
          recipientName: data.email.split('@')[0], // Extract name from email as fallback
          role: 'organization-owner', // Default role for organization invitations
          organizationName: data.organization?.name || 'PlayHard 組織',
          inviterName: data.inviter?.name || 'PlayHard 團隊'
        });
      },
    }),
    
    // Magic link plugin for passwordless authentication with enhanced templates
    magicLink({
      expiresIn: 60 * 15, // 15 minutes
      sendMagicLink: async (data) => {
        const { sendMagicLinkEmail } = await import("./email");
        
        // Enhanced magic link with role-specific template support
        // For direct magic links (not organization invitations), we use system-admin as default
        await sendMagicLinkEmail({
          email: data.email,
          url: data.url,
          token: data.token,
          recipientName: data.email.split('@')[0], // Extract name from email as fallback
          role: 'system-admin', // Default role for direct magic link authentication
          organizationName: 'PlayHard 平台',
          inviterName: 'PlayHard 團隊'
        });
      }
    }),
  ],
});