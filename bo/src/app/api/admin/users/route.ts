/**
 * System Admin Users API
 * Enhanced with full Prisma types and user management features
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { auth } from '@/lib/auth';
import { isSystemAdmin, type RoleType } from '@/lib/permissions';
import type { 
  SystemUserWithOrganizations, 
  SystemUsersResponse 
} from '@/types/user-management';

const prisma = new PrismaClient();

interface CreateUserFormData {
  name: string;
  email: string;
  systemRole: 'admin' | 'member';
  organizationId?: string;
  organizationRole?: 'owner' | 'admin' | 'supervisor' | 'employee';
  teamIds?: string[];
  organizationName?: string;
}

/**
 * Role Mapping Helper - Maps RoleType to Better Auth two-tier system
 */
function mapRoleTypeToAuth(roleType: RoleType): { systemRole: 'admin' | 'member', organizationRole?: 'owner' | 'admin' | 'supervisor' | 'employee' } {
  const roleMap: Record<RoleType, { systemRole: 'admin' | 'member', organizationRole?: 'owner' | 'admin' | 'supervisor' | 'employee' }> = {
    'system_admin': { systemRole: 'admin' },
    'organization_owner': { systemRole: 'member', organizationRole: 'owner' },
    'organization_admin': { systemRole: 'member', organizationRole: 'admin' },
    'game_master': { systemRole: 'member', organizationRole: 'supervisor' },
    'game_staff': { systemRole: 'member', organizationRole: 'employee' },
    'game_player': { systemRole: 'member', organizationRole: 'employee' }
  };
  
  return roleMap[roleType];
}

export async function POST(request: NextRequest) {
  try {
    // Better Auth session validation
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isSystemAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'System admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body: CreateUserFormData = await request.json();
    const { name, email, systemRole, organizationId, organizationRole, teamIds = [], organizationName } = body;

    // Validation
    if (!name || !email || !systemRole) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and system role are required' },
        { status: 400 }
      );
    }

    if (systemRole === 'member' && !organizationId && !organizationName) {
      return NextResponse.json(
        { success: false, error: 'Organization members require either organizationId or organizationName' },
        { status: 400 }
      );
    }

    if (systemRole === 'member' && !organizationRole) {
      return NextResponse.json(
        { success: false, error: 'Organization members require an organization role' },
        { status: 400 }
      );
    }

    let targetOrganizationId = organizationId;

    // Step 1: Create or validate organization (Better Auth compliant)
    if (systemRole === 'member' && !organizationId && organizationName) {
      try {
        // Create new organization using Better Auth organization plugin
        const orgResult = await auth.api.organization.create({
          body: {
            name: organizationName,
            slug: organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          }
        });

        if (!orgResult.organization) {
          throw new Error('Failed to create organization');
        }

        targetOrganizationId = orgResult.organization.id;
      } catch (orgError) {
        console.error('Failed to create organization:', orgError);
        return NextResponse.json(
          { success: false, error: 'Failed to create organization' },
          { status: 500 }
        );
      }
    }

    // Step 2: Create user using Better Auth Admin Plugin (CRITICAL: Proper role setting)
    let userResult;
    try {
      // Use Better Auth admin plugin createUser API for proper role assignment
      userResult = await auth.api.createUser({
        body: {
          email: email.toLowerCase(),
          name: name,
          role: systemRole, // Better Auth admin plugin handles system-level roles
          data: {
            createdByAdmin: true,
            createdAt: new Date().toISOString()
          }
        }
      });

      if (!userResult || !userResult.user) {
        throw new Error('Failed to create user via Better Auth Admin API');
      }
    } catch (createError) {
      console.error('Failed to create user:', createError);
      
      // Handle Better Auth specific errors
      if (createError instanceof Error && createError.message.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: 'User with this email already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    const newUser = userResult.user;

    // Step 3: Handle organization membership (Better Auth organization plugin)
    if (systemRole === 'member' && targetOrganizationId && organizationRole) {
      try {
        // Send organization invitation using Better Auth organization plugin
        await auth.api.organization.inviteMember({
          body: {
            organizationId: targetOrganizationId,
            email: newUser.email,
            role: organizationRole
          }
        });

        // Step 4: Handle team assignments (Better Auth teams feature)
        if (teamIds && teamIds.length > 0) {
          // Better Auth teams integration - assign user to teams after organization membership
          // Note: This would require additional API calls to Better Auth teams endpoints
          // Implementation depends on specific Better Auth teams plugin API availability
          console.log(`Team assignments requested for user ${newUser.id}:`, teamIds);
          // TODO: Implement team assignment using Better Auth teams API when available
        }

      } catch (inviteError) {
        console.error('Failed to invite user to organization:', inviteError);
        // User created but organization invitation failed - this is recoverable
        return NextResponse.json(
          { 
            success: true, 
            user: {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role
            },
            warning: 'User created but organization invitation failed. Manual invitation required.',
            organizationError: true
          },
          { status: 201 }
        );
      }
    }

    // Step 5: Send authentication email (Better Auth magic link)
    try {
      if (systemRole === 'admin') {
        // System admins get magic link authentication
        await auth.api.magicLink.send({
          body: {
            email: newUser.email,
            callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
          }
        });
      } else {
        // Organization users get invitation email (already sent via organization.inviteMember)
        console.log(`Organization invitation email sent to ${newUser.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send authentication email:', emailError);
      // User and organization membership created successfully, but email failed
      return NextResponse.json(
        { 
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role
          },
          warning: 'User created successfully but authentication email failed to send. Manual email required.',
          emailError: true
        },
        { status: 201 }
      );
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        },
        organization: targetOrganizationId ? {
          id: targetOrganizationId,
          role: organizationRole
        } : null,
        message: systemRole === 'admin' ? 'System admin created. Magic link sent.' : 'Organization user created. Invitation sent.'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[Admin Create User API] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during user creation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    // Ensure Prisma disconnection if used
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.warn('Prisma disconnect warning:', disconnectError);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication using Better Auth
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isSystemAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'System admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as 'admin' | 'member' | null;
    const organizationId = searchParams.get('organizationId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100); // Max 100 per page

    // Build where clause for filtering
    const where: any = {};
    
    if (role) {
      where.role = role;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (organizationId) {
      where.members = {
        some: {
          organizationId: organizationId
        }
      };
    }

    // Query users with full organization details using exact Prisma types
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          members: {
            include: {
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
              sessions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }) satisfies Promise<SystemUserWithOrganizations[]>,
      
      prisma.user.count({ where })
    ]);

    const response: SystemUsersResponse = {
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Admin Users API] Failed to fetch users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}