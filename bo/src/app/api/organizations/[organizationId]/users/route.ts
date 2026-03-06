import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { withOrganizationAccess, withOrganizationAdmin } from "@/lib/api-auth";

const prisma = new PrismaClient();

// GET: List users in organization (requires organization membership)
export const GET = withOrganizationAccess(async (
  request: NextRequest, 
  session,
  { params }: { params: Promise<{ organizationId: string }> }
) => {
  const { organizationId } = await params;

  // Parse query parameters
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  const queryParams = {
    searchValue: searchParams.get('search') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortDirection: searchParams.get('sortDirection') as 'asc' | 'desc' || 'desc',
  };

  // Get users in this specific organization
  const whereClause = {
    member: {
      some: {
        organizationId: organizationId
      }
    },
    ...(queryParams.searchValue ? {
      OR: [
        { email: { contains: queryParams.searchValue, mode: 'insensitive' } },
        { name: { contains: queryParams.searchValue, mode: 'insensitive' } },
      ]
    } : {})
  } as any;

  const users = await prisma.user.findMany({
    take: queryParams.limit,
    skip: queryParams.offset,
    orderBy: {
      [queryParams.sortBy]: queryParams.sortDirection
    },
    where: whereClause,
    include: {
      members: {
        where: {
          organizationId: organizationId
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }
    }
  });

  const total = await prisma.user.count({
    where: whereClause
  });

  // Transform the data to include organization role
  const enhancedUsers = users.map((user) => ({
    ...user,
    organizationRole: user.members[0]?.role || null,
    joinedAt: user.members[0]?.createdAt || null,
    organization: user.members[0]?.organization || null
  }));

  return NextResponse.json({
    users: enhancedUsers,
    total,
    limit: queryParams.limit,
    offset: queryParams.offset,
    organizationId
  });
});

// POST: Invite user to organization (requires organization admin access)
export const POST = withOrganizationAdmin(async (
  request: NextRequest,
  session,
  { params }: { params: Promise<{ organizationId: string }> }
) => {
  const { organizationId } = await params;
  
  try {
    const body = await request.json();
    const { name, email, role = 'member' } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!['owner', 'admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be owner, admin, or member" },
        { status: 400 }
      );
    }

    // Check if user already exists in this organization
    const existingMember = await prisma.member.findFirst({
      where: {
        organizationId: organizationId,
        user: {
          email: email.toLowerCase()
        }
      },
      include: {
        user: true
      }
    });

    if (existingMember) {
      return NextResponse.json(
        { 
          error: 'User is already a member of this organization',
          code: 'USER_ALREADY_MEMBER',
          user: existingMember.user
        },
        { status: 409 }
      );
    }

    // Use transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      let user;
      
      // Check if user already exists in system
      const existingUser = await tx.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        user = existingUser;
      } else {
        // Create new user
        const bcrypt = await import("bcryptjs");
        const hashedPassword = bcrypt.hashSync("temporaryPassword123", 10);
        
        user = await tx.user.create({
          data: {
            id: crypto.randomUUID(),
            email: email.toLowerCase(),
            name: name,
            emailVerified: false,
            role: undefined, // No system-level role
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });

        // Create account record for password authentication
        await tx.account.create({
          data: {
            id: crypto.randomUUID(),
            accountId: user.id,
            providerId: "credential",
            userId: user.id,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
      }

      // Create membership
      const membership = await tx.member.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: organizationId,
          userId: user.id,
          role: role,
          createdAt: new Date(),
        }
      });

      // Create invitation record
      const invitation = await tx.invitation.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: organizationId,
          email: email.toLowerCase(),
          role: role,
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          inviterId: session.user.id,
        }
      });

      return { user, membership, invitation };
    });

    // TODO: Send invitation email using Better Auth magic link
    // This would be implemented with the email service

    return NextResponse.json({
      success: true,
      message: `User ${name} invited to organization successfully`,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      membership: {
        id: result.membership.id,
        role: result.membership.role,
        organizationId: organizationId
      },
      invitation: {
        id: result.invitation.id,
        status: result.invitation.status,
        expiresAt: result.invitation.expiresAt
      }
    });

  } catch (error: unknown) {
    console.error('Invite user error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Handle specific error types
    if (errorMessage.includes('Unique constraint')) {
      return NextResponse.json(
        { 
          error: 'User is already a member of this organization.',
          code: 'DUPLICATE_MEMBER'
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: errorMessage || 'Failed to invite user',
        code: 'INVITE_FAILED'
      },
      { status: 500 }
    );
  }
});