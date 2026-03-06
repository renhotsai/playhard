import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { permissionService } from '@/lib/permissions/permission-service';
import { isSystemAdmin } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    
    // Check if user can view permissions (system admin or organization admin)
    const canViewPermissions = isSystemAdmin(session.user.role);
    
    if (!canViewPermissions && session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get permission matrix for the user
    const permissionMatrix = await permissionService.getPermissionMatrix('user', userId);
    
    return NextResponse.json({
      userId,
      permissions: permissionMatrix
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { permissions } = body;

    // Check if user can manage permissions (system admin or organization admin)
    const canManagePermissions = isSystemAdmin(session.user.role);
    
    if (!canManagePermissions) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate permissions format
    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      );
    }

    // Set permissions for the user
    await permissionService.setPermissions(
      'user',
      userId,
      permissions,
      session.user.id
    );

    // Return updated permission matrix
    const updatedMatrix = await permissionService.getPermissionMatrix('user', userId);
    
    return NextResponse.json({
      userId,
      permissions: updatedMatrix,
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}