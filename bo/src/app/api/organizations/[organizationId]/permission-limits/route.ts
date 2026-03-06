import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { permissionService } from '@/lib/permissions/permission-service';
import { isSystemAdmin } from '@/lib/permissions';
import { PrismaClient } from '@/generated/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await params;
    
    // Only system admin can view organization permission limits
    if (!isSystemAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all permission limits for the organization
    const prisma = new PrismaClient();
    const limits = await prisma.organizationPermissionLimit.findMany({
      where: { organizationId }
    });
    await prisma.$disconnect();

    // Transform to matrix format
    const resources = ["user", "team", "organization", "report", "store", "game"];
    const actions = ["create", "update", "delete", "read"];
    
    const permissionMatrix = resources.map(resource => {
      const resourceLimits = limits.filter(l => l.resource === resource);
      const permissions: Record<string, boolean> = {};
      
      actions.forEach(action => {
        const limit = resourceLimits.find(l => l.action === action);
        permissions[action] = limit?.allowed !== false; // Default to true if not set
      });

      const all = actions.every(action => permissions[action]);

      return {
        resource,
        permissions,
        all
      };
    });
    
    return NextResponse.json({
      organizationId,
      permissionLimits: permissionMatrix
    });
  } catch (error) {
    console.error('Error fetching organization permission limits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await params;
    const body = await request.json();
    const { limits } = body;

    // Only system admin can manage organization permission limits
    if (!isSystemAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate limits format
    if (!Array.isArray(limits)) {
      return NextResponse.json(
        { error: 'Limits must be an array' },
        { status: 400 }
      );
    }

    // Set organization permission limits
    await permissionService.setOrganizationPermissionLimits(organizationId, limits);

    // Return updated limits
    const updatedLimits = await permissionService.getPermissionMatrix('user', ''); // This needs to be updated
    
    return NextResponse.json({
      organizationId,
      message: 'Organization permission limits updated successfully'
    });
  } catch (error) {
    console.error('Error updating organization permission limits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}