/**
 * Process Team Assignments API
 * POST /api/invitations/process-teams - Process team assignments after invitation acceptance
 * Handles team membership assignment using metadata stored during invitation creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


interface ProcessTeamsData {
  invitationId: string;
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

    // Parse request body
    const body: ProcessTeamsData = await request.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    try {
      // Try to get invitation metadata (if table exists)
      const invitationMetadata = await prisma.invitationMetadata.findUnique({
        where: { invitationId },
        select: { teamIds: true, memberName: true }
      }).catch(() => null);

      if (!invitationMetadata) {
        // No metadata found, nothing to process
        return NextResponse.json({
          success: true,
          message: 'No team assignments to process'
        });
      }

      // Get the accepted invitation to find user and organization
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        select: { 
          email: true, 
          organizationId: true, 
          status: true 
        }
      });

      if (!invitation || invitation.status !== 'accepted') {
        return NextResponse.json(
          { success: false, error: 'Invitation not found or not accepted' },
          { status: 404 }
        );
      }

      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email: invitation.email },
        select: { id: true }
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Parse team IDs
      const teamIds = invitationMetadata.teamIds ? 
        invitationMetadata.teamIds.split(',').filter(id => id.trim()) : 
        [];

      if (teamIds.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No teams to assign'
        });
      }

      // Verify teams exist in the organization
      const teams = await prisma.team.findMany({
        where: { 
          id: { in: teamIds },
          organizationId: invitation.organizationId
        },
        select: { id: true, name: true }
      });

      if (teams.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid teams found' },
          { status: 400 }
        );
      }

      // Create team memberships
      const teamMembershipData = teams.map(team => ({
        id: crypto.randomUUID(),
        userId: user.id,
        teamId: team.id,
        createdAt: new Date()
      }));

      await prisma.$transaction(async (tx) => {
        // Create team memberships
        await tx.teamMember.createMany({
          data: teamMembershipData,
          skipDuplicates: true // Skip if already exists
        });

        // Clean up metadata
        await tx.invitationMetadata.delete({
          where: { invitationId }
        });
      });

      return NextResponse.json({
        success: true,
        message: `Successfully assigned user to ${teams.length} teams`,
        teamsAssigned: teams.map(t => t.name)
      });

    } catch (metadataError) {
      // If invitationMetadata table doesn't exist, just return success
      console.log('InvitationMetadata table not available:', metadataError);
      return NextResponse.json({
        success: true,
        message: 'Team assignment feature not configured'
      });
    }

  } catch (error) {
    console.error('[Process Teams API] Failed to process team assignments:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to process team assignments';

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  } finally {
  }
}