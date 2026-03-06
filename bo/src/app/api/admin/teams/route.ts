import { NextRequest, NextResponse } from 'next/server';
import { PermissionMiddleware } from '@/lib/permissions/permission-middleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Check permission using new permission middleware
  const permissionCheck = await PermissionMiddleware.checkPermission(request, {
    resource: 'team',
    action: 'read',
    allowSystemAdmin: true
  });

  if (!permissionCheck.success) {
    return permissionCheck.response;
  }

  try {
    
    try {
      const teams = await prisma.team.findMany({
        select: {
          id: true,
          name: true,
          organizationId: true,
          organization: {
            select: {
              name: true
            }
          },
          createdAt: true,
          _count: {
            select: {
              teammembers: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const formattedTeams = teams.map(team => ({
        id: team.id,
        name: team.name,
        organizationId: team.organizationId,
        organizationName: team.organization.name,
        memberCount: team._count.teammembers,
        createdAt: team.createdAt
      }));

      return NextResponse.json({
        teams: formattedTeams,
        total: formattedTeams.length
      });
    } finally {
    }
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}