import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Session validation endpoint for Edge Runtime middleware
 * 
 * This API route provides session validation using the full Better Auth configuration
 * with Prisma adapter, which cannot run in Edge Runtime. The middleware calls this
 * endpoint to validate sessions while avoiding Prisma compatibility issues.
 */
export async function GET(request: NextRequest) {
  try {
    // Use the full Better Auth configuration with Prisma adapter
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "No valid session" },
        { status: 401 }
      );
    }

    // Return session data for middleware to use
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        username: session.user.username,
        role: session.user.role,
      },
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt,
      }
    });

  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "Session validation failed" },
      { status: 500 }
    );
  }
}