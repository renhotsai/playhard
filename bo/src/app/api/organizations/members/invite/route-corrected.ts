/**
 * Organization Member Invitation API - Better Auth Compliant Implementation
 * POST /api/organizations/members/invite - Invite new members to organization
 * Uses Better Auth's organization plugin for proper invitation flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasOrganizationAdminAccess } from '@/lib/permissions';
import { userManagementValidators } from '@/lib/form-validators';
import type { UserCreationResult } from '@/types/user-management';

interface InviteMemberData {
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  teamIds?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication using Better Auth
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's current organization context
    const organizationId = session.activeOrganizationId;
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'No active organization' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body: InviteMemberData = await request.json();
    const { name, email, role, teamIds = [] } = body;

    // Validate organization role
    const roleError = userManagementValidators.organizationRole(role, true);
    if (roleError) {
      return NextResponse.json(
        { success: false, error: roleError },
        { status: 400 }
      );
    }

    // ✅ CORRECT: Use Better Auth's organization plugin to invite member
    const result = await auth.api.organization.inviteMember({
      organizationId,
      email,
      role,
      
      // Optional: include additional metadata that can be handled by your sendInvitationEmail handler
      metadata: {
        name,
        teamIds,
        inviterName: session.user.name,
        inviterEmail: session.user.email
      }
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error?.message || 'Failed to invite member'
        },
        { status: 400 }
      );
    }

    // ✅ Better Auth handles:
    // - Creating invitation record in the database
    // - Calling your sendInvitationEmail handler
    // - Setting proper expiration times
    // - Validating email uniqueness and permissions
    
    const invitationResult: UserCreationResult = {
      success: true,
      invitationId: result.data.invitationId,
      // Note: userId may not be available until user accepts invitation
      userId: result.data.userId || undefined
    };

    return NextResponse.json(invitationResult, { status: 201 });

  } catch (error) {
    console.error('[Organization Invitation API] Failed to invite member:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to invite member';

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}