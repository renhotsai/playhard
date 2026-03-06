import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { permissionService } from '@/lib/permissions/permission-service';
import { isSystemAdmin } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;
    
    // Check if user can view team permissions (system admin or organization admin)
    const canViewPermissions = isSystemAdmin(session.user.role);
    
    if (!canViewPermissions) {
      // TODO: Check if user is organization admin for this team's organization
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get permission matrix for the team
    const permissionMatrix = await permissionService.getPermissionMatrix('team', teamId);
    
    return NextResponse.json({
      teamId,
      permissions: permissionMatrix
    });
  } catch (error) {
    console.error('Error fetching team permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = await params;
    const body = await request.json();
    const { permissions } = body;

    // Check if user can manage team permissions (system admin or organization admin)
    const canManagePermissions = isSystemAdmin(session.user.role);
    
    if (!canManagePermissions) {
      // TODO: Check if user is organization admin for this team's organization
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate permissions format
    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      );
    }

    // Set permissions for the team
    await permissionService.setPermissions(
      'team',
      teamId,
      permissions,
      session.user.id
    );

    // Return updated permission matrix
    const updatedMatrix = await permissionService.getPermissionMatrix('team', teamId);
    
    return NextResponse.json({
      teamId,
      permissions: updatedMatrix,
      message: 'Team permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating team permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}