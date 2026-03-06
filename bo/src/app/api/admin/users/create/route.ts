/**
 * Admin User Creation API
 * POST /api/admin/users/create - Create new users with Better Auth standard patterns
 * Implements system admin and organization user creation flows
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { auth } from '@/lib/auth';
import { isSystemAdmin } from '@/lib/permissions';

// Request body interface based on Better Auth patterns
interface CreateUserRequest {
  email: string;
  name: string;
  userType: 'system_admin' | 'organization_user';
  organizationId?: string;
  organizationRole?: 'owner' | 'admin' | 'supervisor' | 'employee';
}

// Response type matching test requirements
interface CreateUserResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  invitation?: {
    id: string;
    status: 'sent' | 'pending' | 'accepted' | 'expired';
    expiresAt: string;
  };
  error?: {
    message: string;
    field?: string;
  };
  organization?: {
    id: string;
    role: string;
  };
  message?: string;
}

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Authentication validation using Better Auth
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'Authentication required' }
        },
        { status: 401 }
      );
    }

    if (!isSystemAdmin(session.user.role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'System admin access required' }
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body: CreateUserRequest = await request.json();
    const { email, name, userType, organizationId, organizationRole } = body;

    // Basic validation
    if (!email || !name || !userType) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Missing required fields', 
            field: !email ? 'email' : !name ? 'name' : 'userType'
          }
        },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'Invalid email format', field: 'email' }
        },
        { status: 400 }
      );
    }

    // Organization user validation
    if (userType === 'organization_user') {
      if (!organizationId) {
        return NextResponse.json(
          { 
            success: false, 
            error: { message: 'Organization ID is required for organization users', field: 'organizationId' }
          },
          { status: 400 }
        );
      }
      if (!organizationRole) {
        return NextResponse.json(
          { 
            success: false, 
            error: { message: 'Organization role is required for organization users', field: 'organizationRole' }
          },
          { status: 400 }
        );
      }
    }

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true }
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'Email address is already in use', field: 'email' }
        },
        { status: 409 }
      );
    }

    // Validate organization exists for organization users
    if (userType === 'organization_user' && organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true }
      });

      if (!organization) {
        return NextResponse.json(
          { 
            success: false, 
            error: { message: 'Organization not found', field: 'organizationId' }
          },
          { status: 404 }
        );
      }
    }

    let newUser;
    let invitation = null;

    if (userType === 'system_admin') {
      // Create system admin using Better Auth createUser method
      try {
        // Create user with admin role using Better Auth createUser
        const userResult = await auth.api.createUser({
          body: {
            email: email.toLowerCase(),
            name: name,
            role: 'admin' // Set admin role directly
          }
        });

        if (!userResult?.user) {
          throw new Error('Failed to create admin user');
        }

        newUser = userResult.user;

        // Send magic link for admin authentication
        await auth.api.magicLink.send({
          body: {
            email: email.toLowerCase(),
            callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
          }
        });

        // Create mock invitation object for response consistency
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        
        invitation = {
          id: 'magic-link',
          status: 'sent' as const,
          expiresAt: expiresAt.toISOString()
        };

      } catch (error) {
        console.error('System admin creation failed:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: { message: 'Failed to create system admin user' }
          },
          { status: 500 }
        );
      }

    } else if (userType === 'organization_user') {
      // Create organization user
      try {
        // First create the user without admin role
        const userResult = await auth.api.createUser({
          body: {
            email: email.toLowerCase(),
            name: name
          }
        });

        if (!userResult?.user) {
          throw new Error('Failed to create organization user');
        }

        newUser = userResult.user;

        // Send organization invitation
        const invitationResult = await auth.api.organization.inviteMember({
          body: {
            organizationId: organizationId!,
            email: email.toLowerCase(),
            role: organizationRole!
          }
        });

        if (invitationResult) {
          // Get invitation details from database
          const dbInvitation = await prisma.invitation.findFirst({
            where: {
              email: email.toLowerCase(),
              organizationId: organizationId,
              status: 'pending'
            },
            orderBy: { expiresAt: 'desc' }
          });

          if (dbInvitation) {
            invitation = {
              id: dbInvitation.id,
              status: dbInvitation.status as 'sent' | 'pending' | 'accepted' | 'expired',
              expiresAt: dbInvitation.expiresAt.toISOString()
            };
          }
        }

      } catch (error) {
        console.error('Organization user creation failed:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: { message: 'Failed to create organization user' }
          },
          { status: 500 }
        );
      }
    }

    // Prepare success response
    const response: CreateUserResponse = {
      success: true,
      user: {
        id: newUser!.id,
        email: newUser!.email,
        name: newUser!.name,
        role: userType === 'system_admin' ? 'admin' : 'member'
      },
      message: userType === 'system_admin' 
        ? 'System admin created. Magic link sent.' 
        : 'Organization user created. Invitation sent.'
    };

    if (invitation) {
      response.invitation = invitation;
    }

    if (userType === 'organization_user' && organizationId && organizationRole) {
      response.organization = {
        id: organizationId,
        role: organizationRole
      };
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('[Admin Create User API] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { message: 'Internal server error during user creation' }
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint to fetch organizations for dropdown
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user || !isSystemAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch organizations for dropdown selection
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: organizations
    });

  } catch (error) {
    console.error('[Admin User Creation API] Failed to fetch organizations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}