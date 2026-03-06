/**
 * Example API route showing how to use the Unified Permission System
 * 
 * This example demonstrates:
 * 1. How to integrate unified permissions in API routes
 * 2. How to handle different permission scenarios
 * 3. How to provide helpful error messages with permission context
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unifiedPermissionService, type PermissionContext } from '@/lib/permissions/unified-permissions';

export async function GET(request: NextRequest) {
  try {
    // Step 1: Get authentication session
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 2: Get organization context from query params or session
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.session.activeOrganizationId;

    // Step 3: Create permission context
    const context: PermissionContext = {
      userId: session.user.id,
      organizationId: organizationId || undefined
    };

    // Step 4: Check permissions using unified system
    const storeReadPermission = await unifiedPermissionService.hasPermission(
      context,
      'store',
      'read'
    );

    if (!storeReadPermission.granted) {
      return NextResponse.json({
        error: 'Insufficient permissions',
        details: storeReadPermission.details,
        reason: storeReadPermission.reason
      }, { status: 403 });
    }

    // Step 5: Example of batch permission check
    const permissions = await unifiedPermissionService.hasPermissions(context, [
      { resource: 'store', action: 'create' },
      { resource: 'store', action: 'update' },
      { resource: 'store', action: 'delete' },
      { resource: 'user', action: 'read' },
      { resource: 'team', action: 'create' }
    ]);

    // Step 6: Example of resource permissions for UI
    const storePermissions = await unifiedPermissionService.getResourcePermissions(
      context,
      'store'
    );

    return NextResponse.json({
      message: 'Permission check successful',
      context: {
        userId: context.userId,
        organizationId: context.organizationId,
        permissionReason: storeReadPermission.reason
      },
      permissions: {
        individualCheck: storeReadPermission,
        batchChecks: permissions,
        resourcePermissions: storePermissions
      }
    });

  } catch (error) {
    console.error('[Permissions Example API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Example: Creating a new store with permission check
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, storeName } = body;

    if (!organizationId) {
      return NextResponse.json({ 
        error: 'Organization ID is required' 
      }, { status: 400 });
    }

    // Create permission context
    const context: PermissionContext = {
      userId: session.user.id,
      organizationId
    };

    // Check if user can create stores
    const createPermission = await unifiedPermissionService.hasPermission(
      context,
      'store',
      'create'
    );

    if (!createPermission.granted) {
      return NextResponse.json({
        error: 'Cannot create store',
        details: createPermission.details,
        reason: createPermission.reason,
        suggestions: getPermissionSuggestions(createPermission.reason)
      }, { status: 403 });
    }

    // Simulate store creation (replace with actual store creation logic)
    const newStore = {
      id: `store_${Date.now()}`,
      name: storeName,
      organizationId,
      createdBy: session.user.id,
      createdAt: new Date().toISOString(),
      permissionGrantedBy: createPermission.reason
    };

    return NextResponse.json({
      message: 'Store created successfully',
      store: newStore,
      permissionContext: {
        grantedBy: createPermission.reason,
        details: createPermission.details
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[Permissions Example API] Create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to provide permission suggestions based on denial reason
 */
function getPermissionSuggestions(reason: string): string[] {
  switch (reason) {
    case 'denied':
      return [
        'Contact your organization administrator to request store creation permissions',
        'Check if you are a member of the correct organization',
        'Verify your account has the necessary role within the organization'
      ];
    default:
      return [
        'Contact system administrator for assistance',
        'Check your account status and organization membership'
      ];
  }
}