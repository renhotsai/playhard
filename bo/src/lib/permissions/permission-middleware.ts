import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PermissionService } from './permission-service';
import { isSystemAdmin } from '@/lib/permissions';

export type Resource = 'user' | 'team' | 'organization' | 'report' | 'script' | 'store' | 'session' | 'booking';
export type Action = 'create' | 'read' | 'update' | 'delete';

export interface PermissionCheckOptions {
  resource: Resource;
  action: Action;
  organizationId?: string;
  allowSystemAdmin?: boolean;
}

/**
 * API Route Permission Middleware
 * 
 * This middleware integrates with the new checkbox-based permission system
 * to validate permissions for API routes using the PermissionService.
 */
export class PermissionMiddleware {
  private static permissionService = new PermissionService();

  /**
   * Check if user has permission for a specific resource and action
   */
  static async checkPermission(
    request: NextRequest, 
    options: PermissionCheckOptions
  ): Promise<{ success: true; userId: string; organizationId?: string } | { success: false; response: NextResponse }> {
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      
      if (!session?.user) {
        return {
          success: false,
          response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        };
      }

      const userId = session.user.id;
      const userRole = session.user.role;

      // System admins have full access if allowed
      if (options.allowSystemAdmin !== false && isSystemAdmin(userRole)) {
        return {
          success: true,
          userId,
          organizationId: options.organizationId
        };
      }

      // Check specific permission using PermissionService
      const hasPermission = await this.permissionService.hasPermission(
        userId,
        options.resource,
        options.action,
        options.organizationId
      );

      if (!hasPermission) {
        return {
          success: false,
          response: NextResponse.json({ 
            error: `Permission denied: ${options.action} ${options.resource}` 
          }, { status: 403 })
        };
      }

      return {
        success: true,
        userId,
        organizationId: options.organizationId
      };

    } catch (error) {
      console.error('Permission check error:', error);
      return {
        success: false,
        response: NextResponse.json({ 
          error: 'Permission validation failed' 
        }, { status: 500 })
      };
    }
  }

  /**
   * Extract organization ID from request URL or body
   */
  static extractOrganizationId(request: NextRequest): string | undefined {
    // Extract from URL path (e.g., /api/organizations/123/...)
    const pathMatch = request.nextUrl.pathname.match(/\/api\/organizations\/([^\/]+)/);
    if (pathMatch) {
      return pathMatch[1];
    }

    // Could also extract from query params or body if needed
    const orgId = request.nextUrl.searchParams.get('organizationId');
    return orgId || undefined;
  }

  /**
   * Middleware factory for easy permission checking in API routes
   */
  static requirePermission(options: PermissionCheckOptions) {
    return async (request: NextRequest) => {
      // Auto-extract organization ID if not provided
      const organizationId = options.organizationId || this.extractOrganizationId(request);
      
      return this.checkPermission(request, {
        ...options,
        organizationId
      });
    };
  }
}

/**
 * Decorator for API route handlers that require specific permissions
 */
export function withPermission(options: PermissionCheckOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (request: NextRequest, context?: any) {
      const permissionCheck = await PermissionMiddleware.checkPermission(request, options);
      
      if (!permissionCheck.success) {
        return permissionCheck.response;
      }

      // Add permission info to request context
      const enhancedContext = {
        ...context,
        userId: permissionCheck.userId,
        organizationId: permissionCheck.organizationId,
      };

      return originalMethod.call(this, request, enhancedContext);
    };

    return descriptor;
  };
}

/**
 * Utility functions for common permission patterns
 */
export const PermissionChecks = {
  /**
   * Check if user can manage users (create, update, delete)
   */
  canManageUsers: (organizationId?: string) => 
    PermissionMiddleware.requirePermission({
      resource: 'user',
      action: 'update',
      organizationId,
      allowSystemAdmin: true
    }),

  /**
   * Check if user can view users
   */
  canViewUsers: (organizationId?: string) => 
    PermissionMiddleware.requirePermission({
      resource: 'user',
      action: 'read',
      organizationId,
      allowSystemAdmin: true
    }),

  /**
   * Check if user can manage teams
   */
  canManageTeams: (organizationId?: string) => 
    PermissionMiddleware.requirePermission({
      resource: 'team',
      action: 'update',
      organizationId,
      allowSystemAdmin: true
    }),

  /**
   * Check if user can manage organizations
   */
  canManageOrganizations: () => 
    PermissionMiddleware.requirePermission({
      resource: 'organization',
      action: 'update',
      allowSystemAdmin: true
    }),

  /**
   * Check if user can create resources
   */
  canCreate: (resource: Resource, organizationId?: string) => 
    PermissionMiddleware.requirePermission({
      resource,
      action: 'create',
      organizationId,
      allowSystemAdmin: true
    }),

  /**
   * Check if user can read resources
   */
  canRead: (resource: Resource, organizationId?: string) => 
    PermissionMiddleware.requirePermission({
      resource,
      action: 'read',
      organizationId,
      allowSystemAdmin: true
    }),

  /**
   * Check if user can update resources
   */
  canUpdate: (resource: Resource, organizationId?: string) => 
    PermissionMiddleware.requirePermission({
      resource,
      action: 'update',
      organizationId,
      allowSystemAdmin: true
    }),

  /**
   * Check if user can delete resources
   */
  canDelete: (resource: Resource, organizationId?: string) => 
    PermissionMiddleware.requirePermission({
      resource,
      action: 'delete',
      organizationId,
      allowSystemAdmin: true
    }),
};