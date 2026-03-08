import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { isSystemAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/**
 * System-level Organizations API
 * Only accessible by system administrators (user.role = 'admin')
 * Provides cross-brand management capabilities
 */

// GET /api/system/organizations - List all organizations (system admin only)
export async function GET() {
  try {
    // Validate system admin session
    const session = await auth.api.getSession({
      headers: new Headers()
    });
    
    if (!session?.user || !isSystemAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "System admin privileges required" },
        { status: 403 }
      );
    }

    // Fetch all organizations with member counts
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        createdAt: true,
        metadata: true,
        _count: {
          select: {
            members: true,
            teams: true,
            invitations: {
              where: {
                status: 'pending'
              }
            }
          }
        },
        members: {
          select: {
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          where: {
            role: 'owner'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data for system admin view
    const systemOrganizations = organizations.map(org => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
      createdAt: org.createdAt,
      metadata: org.metadata ? JSON.parse(org.metadata) : null,
      stats: {
        totalMembers: org._count.members,
        totalTeams: org._count.teams,
        pendingInvitations: org._count.invitations
      },
      owners: org.members.map(member => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: member.role
      }))
    }));

    return NextResponse.json({
      organizations: systemOrganizations,
      total: systemOrganizations.length
    });

  } catch (error) {
    console.error("System organizations API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
}

// POST /api/system/organizations - Create new organization (system admin only)
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
    const { name, ownerId, metadata } = body;

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: "Organization name and owner ID are required" },
        { status: 400 }
      );
    }

    // Verify owner user exists
    const ownerUser = await prisma.user.findUnique({
      where: { id: ownerId }
    });

    if (!ownerUser) {
      return NextResponse.json(
        { error: "Owner user not found" },
        { status: 404 }
      );
    }

    // Generate unique slug
    const baseSlug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);
    
    const slug = `${baseSlug}-${Date.now()}`;

    // Create organization via Better Auth compliant approach
    const organization = await prisma.organization.create({
      data: {
        id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        slug,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdAt: new Date(),
        members: {
          create: {
            id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: ownerId,
            role: 'owner',
            createdAt: new Date()
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: "Organization created successfully",
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        createdAt: organization.createdAt,
        owner: organization.members[0]?.user
      }
    }, { status: 201 });

  } catch (error) {
    console.error("System create organization error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Organization with this slug already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
}