import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { isSystemAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/**
 * System-level Users API
 * Only accessible by system administrators (user.role = 'admin')
 * Provides cross-organization user management capabilities
 */

// GET /api/system/users - List all users with organization memberships (system admin only)
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      where.role = role;
    }

    // Fetch users with organization memberships
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          members: {
            select: {
              role: true,
              createdAt: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          },
          _count: {
            select: {
              sessions: true,
              members: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    // Transform data for system admin view
    const systemUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      stats: {
        activeSessions: user._count.sessions,
        organizationMemberships: user._count.members
      },
      organizations: user.members.map(member => ({
        organizationId: member.organization.id,
        organizationName: member.organization.name,
        organizationSlug: member.organization.slug,
        role: member.role,
        joinedAt: member.createdAt
      }))
    }));

    return NextResponse.json({
      users: systemUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("System users API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  } finally {
  }
}

// POST /api/system/users - Create new user with system role (system admin only)
export async function POST(request: NextRequest) {
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
    const { name, email, role = 'member', organizationId } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'member'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'member'" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create user via Better Auth API (system admin can create users)
    try {
      // Use Better Auth admin API to create user
      const createUserResponse = await auth.api.createUser({
        body: {
          name,
          email: email.toLowerCase(),
          password: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Temporary password
          role // Set system role
        }
      });

      if (!createUserResponse || !createUserResponse.user) {
        throw new Error("Failed to create user via Better Auth API");
      }

      const newUser = createUserResponse.user;

      // If organizationId provided, add user to organization
      if (organizationId) {
        const organization = await prisma.organization.findUnique({
          where: { id: organizationId }
        });

        if (organization) {
          await prisma.member.create({
            data: {
              id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              organizationId,
              userId: newUser.id,
              role: 'member', // Default organization role
              createdAt: new Date()
            }
          });
        }
      }

      // Send magic link for account activation
      try {
        await auth.api.signInMagicLink({
          body: {
            email: email.toLowerCase(),
            callbackURL: "/set-username"
          },
          headers: request.headers
        });

        console.log(`[SYSTEM-CREATE-USER] Magic link sent to: ${email}`);
      } catch (magicLinkError) {
        console.warn(`[SYSTEM-CREATE-USER] Magic link failed for: ${email}`, magicLinkError);
      }

      return NextResponse.json({
        message: "User created successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        },
        note: "User will receive magic link to complete account setup"
      }, { status: 201 });

    } catch (createError) {
      console.error("Better Auth user creation error:", createError);
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("System create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  } finally {
  }
}