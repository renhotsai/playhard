/**
 * Unified Permission Service
 * Integrates Better Auth admin/organization permissions with custom fine-grained permissions
 * 
 * Three-layer permission system:
 * 1. System Admin (Better Auth admin plugin) - Bypasses all other checks
 * 2. Organization Roles (Better Auth organization plugin) - Enhanced permissions
 * 3. Fine-grained Permissions (Custom Permission Service) - Detailed control
 */

import { auth } from '@/lib/auth';
import { PermissionService, type Resource, type Action } from './permission-service';
import { isSystemAdmin, hasOrganizationAdminAccess } from '@/lib/permissions';

export interface UnifiedPermissionResult {
  granted: boolean;
  reason: 'system_admin' | 'organization_role' | 'fine_grained' | 'denied';
  details?: string;
}

export interface PermissionContext {
  userId: string;
  organizationId?: string;
  teamId?: string;
}

export class UnifiedPermissionService {
  private permissionService: PermissionService;

  constructor() {
    this.permissionService = new PermissionService();
  }

  /**
   * Main permission check method - integrates all three layers
   */
  async hasPermission(
    context: PermissionContext,
    resource: Resource,
    action: Action
  ): Promise<UnifiedPermissionResult> {
    const { userId, organizationId } = context;

    try {
      // Get user session and organization membership
      const userInfo = await this.getUserInfo(userId, organizationId);
      
      if (!userInfo) {
        return {
          granted: false,
          reason: 'denied',
          details: 'User not found or not authenticated'
        };
      }

      // Layer 1: System Admin bypass
      if (isSystemAdmin(userInfo.systemRole)) {
        return {
          granted: true,
          reason: 'system_admin',
          details: 'System administrator has full access'
        };
      }

      // Layer 2: Organization role-based permissions
      if (organizationId && userInfo.organizationRole) {
        const orgPermission = await this.checkOrganizationPermission(
          userInfo.organizationRole,
          resource,
          action,
          organizationId
        );

        if (orgPermission.granted) {
          return orgPermission;
        }
      }

      // Layer 3: Fine-grained permission check
      const fineGrainedResult = await this.permissionService.hasPermission(
        userId,
        resource,
        action,
        organizationId
      );

      return {
        granted: fineGrainedResult,
        reason: fineGrainedResult ? 'fine_grained' : 'denied',
        details: fineGrainedResult 
          ? 'Granted via fine-grained permissions' 
          : 'No permissions found for this resource and action'
      };

    } catch (error) {
      console.error('[UnifiedPermissionService] Permission check failed:', error);
      return {
        granted: false,
        reason: 'denied',
        details: 'Permission check failed due to system error'
      };
    }
  }

  /**
   * Batch permission check for multiple resources/actions
   */
  async hasPermissions(
    context: PermissionContext,
    checks: Array<{ resource: Resource; action: Action }>
  ): Promise<Record<string, UnifiedPermissionResult>> {
    const results: Record<string, UnifiedPermissionResult> = {};

    for (const check of checks) {
      const key = `${check.resource}:${check.action}`;
      results[key] = await this.hasPermission(context, check.resource, check.action);
    }

    return results;
  }

  /**
   * Check if user can perform any action on a resource
   */
  async canAccessResource(
    context: PermissionContext,
    resource: Resource
  ): Promise<UnifiedPermissionResult> {
    const actions: Action[] = ['read', 'create', 'update', 'delete'];
    
    for (const action of actions) {
      const result = await this.hasPermission(context, resource, action);
      if (result.granted) {
        return result;
      }
    }

    return {
      granted: false,
      reason: 'denied',
      details: `No access to resource: ${resource}`
    };
  }

  /**
   * Get user's effective permissions for a resource (for UI display)
   */
  async getResourcePermissions(
    context: PermissionContext,
    resource: Resource
  ): Promise<Record<Action, UnifiedPermissionResult>> {
    const actions: Action[] = ['read', 'create', 'update', 'delete'];
    const permissions: Record<Action, UnifiedPermissionResult> = {} as any;

    for (const action of actions) {
      permissions[action] = await this.hasPermission(context, resource, action);
    }

    return permissions;
  }

  /**
   * Private helper: Get user information from Better Auth
   */
  private async getUserInfo(userId: string, organizationId?: string) {
    try {
      // Get user from Better Auth
      const user = await auth.api.getUser({ userId });
      if (!user) return null;

      let organizationRole: string | null = null;

      // Get organization membership if organizationId provided
      if (organizationId) {
        const memberships = await auth.api.listUserOrganizations({ userId });
        const membership = memberships?.find(m => m.id === organizationId);
        organizationRole = membership?.role || null;
      }

      return {
        systemRole: user.role,
        organizationRole
      };
    } catch (error) {
      console.error('[UnifiedPermissionService] Failed to get user info:', error);
      return null;
    }
  }

  /**
   * Private helper: Check organization-level permissions
   */
  private async checkOrganizationPermission(
    organizationRole: string,
    resource: Resource,
    action: Action,
    organizationId: string
  ): Promise<UnifiedPermissionResult> {
    // Organization owners and admins get enhanced permissions
    if (hasOrganizationAdminAccess(organizationRole)) {
      // Define enhanced permissions for organization admins
      const adminPermissions = this.getOrganizationAdminPermissions();
      const resourcePermissions = adminPermissions[resource];
      
      if (resourcePermissions && resourcePermissions.includes(action)) {
        return {
          granted: true,
          reason: 'organization_role',
          details: `Granted via organization role: ${organizationRole}`
        };
      }
    }

    // Check organization permission limits
    const limitsAllowed = await this.permissionService.isPermissionAllowedInOrganization(
      organizationId,
      resource,
      action
    );

    if (!limitsAllowed) {
      return {
        granted: false,
        reason: 'denied',
        details: 'Permission not allowed by organization limits'
      };
    }

    return {
      granted: false,
      reason: 'denied',
      details: 'No organization-level permission found'
    };
  }

  /**
   * Define what permissions organization admins get by default
   */
  private getOrganizationAdminPermissions(): Record<Resource, Action[]> {
    return {
      user: ['read', 'create', 'update'],
      team: ['read', 'create', 'update', 'delete'],
      organization: ['read', 'update'],
      store: ['read', 'create', 'update', 'delete'],
      game: ['read', 'create', 'update', 'delete'],
      report: ['read', 'create'],
      system_role: ['read'], // Organization admins can only read system roles
      organization_role: ['read', 'create', 'update', 'delete'], // Can manage org roles
      permission: ['read', 'create', 'update', 'delete'] // Can manage permissions within org
    };
  }
}

// Singleton instance
export const unifiedPermissionService = new UnifiedPermissionService();

// Convenience functions for common permission checks
export const hasPermission = async (
  context: PermissionContext,
  resource: Resource,
  action: Action
): Promise<boolean> => {
  const result = await unifiedPermissionService.hasPermission(context, resource, action);
  return result.granted;
};

export const canRead = (context: PermissionContext, resource: Resource) =>
  hasPermission(context, resource, 'read');

export const canCreate = (context: PermissionContext, resource: Resource) =>
  hasPermission(context, resource, 'create');

export const canUpdate = (context: PermissionContext, resource: Resource) =>
  hasPermission(context, resource, 'update');

export const canDelete = (context: PermissionContext, resource: Resource) =>
  hasPermission(context, resource, 'delete');