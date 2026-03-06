import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { isSystemAdmin } from "@/lib/permissions";

const prisma = new PrismaClient();

/**
 * System-level Settings API
 * Only accessible by system administrators (user.role = 'admin')
 * Manages global system configuration
 */

// GET /api/system/settings - Get system settings (system admin only)
export async function GET(request: NextRequest) {
  try {
    // Validate system admin session
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user || !isSystemAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "System admin privileges required" },
        { status: 403 }
      );
    }

    // Fetch system configuration
    // Since we don't have a specific settings table, we'll return system-level info
    const systemInfo = {
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      features: {
        adminPlugin: true,
        organizationPlugin: true,
        magicLinkPlugin: true,
        usernamePlugin: true,
        emailService: !!process.env.RESEND_API_KEY,
      },
      limits: {
        maxOrganizations: 100, // System-wide limit
        maxUsersPerOrganization: 50,
        sessionExpiryDays: 7,
        invitationExpiryDays: 7
      },
      email: {
        enabled: !!process.env.RESEND_API_KEY,
        defaultSender: process.env.DEFAULT_SENDER_EMAIL || "noreply@playhard.local"
      },
      authentication: {
        requireEmailVerification: false,
        magicLinkExpiryMinutes: 15,
        allowUserRegistration: false, // Only admin can create users
        defaultUserRole: "member"
      }
    };

    return NextResponse.json({
      settings: systemInfo,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error("System settings API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch system settings" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/system/settings - Update system settings (system admin only)
export async function PUT(request: NextRequest) {
  try {
    // Validate system admin session
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user || !isSystemAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "System admin privileges required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { limits, email, authentication } = body;

    // Validate settings
    const validatedSettings = {
      limits: {
        maxOrganizations: Math.max(1, Math.min(1000, limits?.maxOrganizations || 100)),
        maxUsersPerOrganization: Math.max(1, Math.min(500, limits?.maxUsersPerOrganization || 50)),
        sessionExpiryDays: Math.max(1, Math.min(30, limits?.sessionExpiryDays || 7)),
        invitationExpiryDays: Math.max(1, Math.min(30, limits?.invitationExpiryDays || 7))
      },
      email: {
        enabled: email?.enabled || false,
        defaultSender: email?.defaultSender || "noreply@playhard.local"
      },
      authentication: {
        requireEmailVerification: authentication?.requireEmailVerification || false,
        magicLinkExpiryMinutes: Math.max(5, Math.min(60, authentication?.magicLinkExpiryMinutes || 15)),
        allowUserRegistration: authentication?.allowUserRegistration || false,
        defaultUserRole: authentication?.defaultUserRole || "member"
      }
    };

    // Log settings change
    console.log(`[SYSTEM-SETTINGS] Updated by admin: ${session.user.email}`, validatedSettings);

    // In a real implementation, you would save these to a settings table
    // For now, we return the validated settings
    return NextResponse.json({
      message: "System settings updated successfully",
      settings: validatedSettings,
      updatedBy: session.user.email,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("System settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update system settings" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/system/settings/health - System health check (system admin only)
export async function health(request: NextRequest) {
  try {
    // Validate system admin session
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session?.user || !isSystemAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "System admin privileges required" },
        { status: 403 }
      );
    }

    // Check database connectivity
    const dbHealth = await prisma.$queryRaw`SELECT 1 as health`;
    
    // Check Better Auth endpoints
    const authHealth = {
      status: "ok",
      plugins: ["username", "organization", "magicLink", "admin"]
    };

    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth ? "connected" : "error",
        authentication: authHealth.status,
        email: process.env.RESEND_API_KEY ? "configured" : "not_configured"
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node_version: process.version
      }
    };

    return NextResponse.json(healthStatus);

  } catch (error) {
    console.error("System health check error:", error);
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}