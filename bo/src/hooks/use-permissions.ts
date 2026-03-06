import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { authClient } from '@/lib/auth-client';
import { isSystemAdmin } from '@/lib/permissions';

// Define resource and action types for the permission system
export type Resource = 
  | 'user' 
  | 'team' 
  | 'organization' 
  | 'report' 
  | 'store' 
  | 'game' 
  | 'script' 
  | 'session' 
  | 'booking'
  | 'system_role'
  | 'organization_role'
  | 'permission';

export type Action = 'create' | 'read' | 'update' | 'delete';

interface Permission {
  resource: Resource;
  action: Action;
  granted: boolean;
}

interface UsePermissionsOptions {
  organizationId?: string;
  enabled?: boolean;
}

/**
 * React hook for checking user permissions in components
 * 
 * This hook integrates with the unified permission system
 * combining Better Auth plugins with fine-grained permissions.
 */
export function usePermissions(options: UsePermissionsOptions = {}) {
  const { data: session } = authClient.useSession();
  const { organizationId, enabled = true } = options;

  const permissionsQuery = useQuery({
    queryKey: ['permissions', session?.user?.id, organizationId],
    queryFn: async () => {
      if (!session?.user?.id) {
        return [];
      }

      // System admins have all permissions
      if (isSystemAdmin(session.user.role)) {
        const allPermissions: Permission[] = [];
        const allResources: Resource[] = [
          'user', 'team', 'organization', 'report', 'store', 'game',
          'script', 'session', 'booking', 'system_role', 'organization_role', 'permission'
        ];
        const allActions: Action[] = ['create', 'read', 'update', 'delete'];
        
        for (const resource of allResources) {
          for (const action of allActions) {
            allPermissions.push({ resource, action, granted: true });
          }
        }
        return allPermissions;
      }

      // For non-admin users, implement basic permission logic
      // This can be extended based on organization roles and specific business logic
      const basicPermissions: Permission[] = [
        // Basic read permissions for all users
        { resource: 'user', action: 'read', granted: true },
        { resource: 'organization', action: 'read', granted: true },
        { resource: 'script', action: 'read', granted: true },
        { resource: 'session', action: 'read', granted: true },
        { resource: 'booking', action: 'read', granted: true },
        { resource: 'store', action: 'read', granted: true },
        { resource: 'game', action: 'read', granted: true },
        { resource: 'report', action: 'read', granted: true },
        { resource: 'team', action: 'read', granted: true },
        
        // Permission management - only for admins
        { resource: 'system_role', action: 'read', granted: false },
        { resource: 'organization_role', action: 'read', granted: false },
        { resource: 'permission', action: 'read', granted: false },
      ];

      return basicPermissions;
    },
    enabled: enabled && !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (resource: Resource, action: Action): boolean => {
    // System admins have all permissions
    if (session?.user && isSystemAdmin(session.user.role)) {
      return true;
    }

    const permissions = permissionsQuery.data || [];
    return permissions.some(p => 
      p.resource === resource && 
      p.action === action && 
      p.granted
    );
  };

  /**
   * Check if user has all specified permissions
   */
  const hasAllPermissions = (checks: Array<{ resource: Resource; action: Action }>): boolean => {
    return checks.every(check => hasPermission(check.resource, check.action));
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (checks: Array<{ resource: Resource; action: Action }>): boolean => {
    return checks.some(check => hasPermission(check.resource, check.action));
  };

  /**
   * Get all permissions for a specific resource
   */
  const getResourcePermissions = (resource: Resource): Permission[] => {
    const permissions = permissionsQuery.data || [];
    return permissions.filter(p => p.resource === resource);
  };

  /**
   * Check if user can perform any action on a resource
   */
  const canAccessResource = (resource: Resource): boolean => {
    const permissions = permissionsQuery.data || [];
    return permissions.some(p => p.resource === resource && p.granted);
  };

  return {
    permissions: permissionsQuery.data || [],
    loading: permissionsQuery.isLoading,
    error: permissionsQuery.error?.message || null,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    getResourcePermissions,
    canAccessResource,
    isSystemAdmin: session?.user ? isSystemAdmin(session.user.role) : false,
    refetch: permissionsQuery.refetch,
    isError: permissionsQuery.isError,
    isSuccess: permissionsQuery.isSuccess
  };
}

/**
 * Hook for checking specific permission patterns
 */
export function usePermissionChecks(organizationId?: string) {
  const { hasPermission, isSystemAdmin } = usePermissions({ organizationId });

  return {
    canCreateUsers: hasPermission('user', 'create'),
    canViewUsers: hasPermission('user', 'read'),
    canUpdateUsers: hasPermission('user', 'update'),
    canDeleteUsers: hasPermission('user', 'delete'),

    canCreateTeams: hasPermission('team', 'create'),
    canViewTeams: hasPermission('team', 'read'),
    canUpdateTeams: hasPermission('team', 'update'),
    canDeleteTeams: hasPermission('team', 'delete'),

    canCreateOrganizations: hasPermission('organization', 'create'),
    canViewOrganizations: hasPermission('organization', 'read'),
    canUpdateOrganizations: hasPermission('organization', 'update'),
    canDeleteOrganizations: hasPermission('organization', 'delete'),

    canViewReports: hasPermission('report', 'read'),
    canCreateReports: hasPermission('report', 'create'),

    canManageScripts: hasPermission('script', 'update'),
    canViewScripts: hasPermission('script', 'read'),

    canManageStores: hasPermission('store', 'update'),
    canViewStores: hasPermission('store', 'read'),

    canManageSessions: hasPermission('session', 'update'),
    canViewSessions: hasPermission('session', 'read'),

    canManageBookings: hasPermission('booking', 'update'),
    canViewBookings: hasPermission('booking', 'read'),

    // Role Management Permissions
    canViewSystemRoles: hasPermission('system_role', 'read'),
    canCreateSystemRoles: hasPermission('system_role', 'create'),
    canUpdateSystemRoles: hasPermission('system_role', 'update'),
    canDeleteSystemRoles: hasPermission('system_role', 'delete'),

    canViewOrgRoles: hasPermission('organization_role', 'read'),
    canCreateOrgRoles: hasPermission('organization_role', 'create'),
    canUpdateOrgRoles: hasPermission('organization_role', 'update'),
    canDeleteOrgRoles: hasPermission('organization_role', 'delete'),

    canViewPermissions: hasPermission('permission', 'read'),
    canCreatePermissions: hasPermission('permission', 'create'),
    canUpdatePermissions: hasPermission('permission', 'update'),
    canDeletePermissions: hasPermission('permission', 'delete'),

    isSystemAdmin,
  };
}

/**
 * Component wrapper for permission-based rendering
 */
export interface PermissionGateProps {
  resource: Resource;
  action: Action;
  organizationId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  resource,
  action,
  organizationId,
  fallback = null,
  children
}: PermissionGateProps) {
  const { hasPermission, loading } = usePermissions({ organizationId });

  if (loading) {
    return null; // or a loading spinner
  }

  if (!hasPermission(resource, action)) {
    return React.createElement(React.Fragment, null, fallback);
  }

  return React.createElement(React.Fragment, null, children);
}