/**
 * Organization Members API
 * GET /api/organizations/members - List organization members
 * Uses Prisma types for complete type safety
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hasOrganizationAdminAccess } from '@/lib/permissions';
import type { 
import { prisma } from '@/lib/prisma';
  OrganizationMemberWithDetails, 
  OrganizationMembersResponse 
} from '@/types/user-management';


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

    // Get user's current organization context
    const organizationId = session.activeOrganizationId;
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'No active organization' },
        { status: 400 }
      );
    }

    // Check if user has admin access to the organization
    const userMembership = await prisma.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organizationId
      },
      select: { role: true }
    });

    if (!userMembership || !hasOrganizationAdminAccess(userMembership.role)) {
      return NextResponse.json(
        { success: false, error: 'Organization admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as 'owner' | 'admin' | 'member' | null;
    const teamId = searchParams.get('teamId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    // Build where clause
    const where: any = {
      organizationId: organizationId
    };
    
    if (role) {
      where.role = role;
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    if (teamId) {
      where.teammembers = {
        some: {
          teamId: teamId
        }
      };
    }

    // Query members with full details using Prisma types
    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              createdAt: true
            }
          },
          teammembers: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }) satisfies Promise<OrganizationMemberWithDetails[]>,
      
      prisma.member.count({ where })
    ]);

    const response: OrganizationMembersResponse = {
      success: true,
      data: members,
      pagination: {
        page,
        limit,
        total
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Organization Members API] Failed to fetch members:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch organization members',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
}