/**
 * Unified Permission Hooks
 * React hooks for the unified permission system integrating Better Auth and custom permissions
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { unifiedPermissionService, type PermissionContext, type UnifiedPermissionResult } from '@/lib/permissions/unified-permissions';
import { type Resource, type Action } from '@/lib/permissions/permission-service';
import { queryKeys } from '@/lib/query-keys';

export interface UsePermissionOptions {
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Hook for checking a single permission
 */
export function usePermission(
  resource: Resource,
  action: Action,
  organizationId?: string,
  options: UsePermissionOptions = {}
) {
  const { data: session } = authClient.useSession();
  const { enabled = true, staleTime = 5 * 60 * 1000 } = options;

  const context: PermissionContext | null = useMemo(() => {
    if (!session?.user?.id) return null;
    return {
      userId: session.user.id,
      organizationId
    };
  }, [session?.user?.id, organizationId]);

  return useQuery({
    queryKey: queryKeys.permissions.check({ 
      userId: context?.userId || '', 
      resource, 
      action, 
      organizationId 
    }),
    queryFn: async (): Promise<UnifiedPermissionResult> => {
      if (!context) {
        return {
          granted: false,
          reason: 'denied',
          details: 'No authentication context'
        };
      }
      return await unifiedPermissionService.hasPermission(context, resource, action);
    },
    enabled: enabled && !!context,
    staleTime,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for checking multiple permissions
 */
export function usePermissions(
  checks: Array<{ resource: Resource; action: Action }>,
  organizationId?: string,
  options: UsePermissionOptions = {}
) {
  const { data: session } = authClient.useSession();
  const { enabled = true, staleTime = 5 * 60 * 1000 } = options;

  const context: PermissionContext | null = useMemo(() => {
    if (!session?.user?.id) return null;
    return {
      userId: session.user.id,
      organizationId
    };
  }, [session?.user?.id, organizationId]);

  return useQuery({
    queryKey: queryKeys.permissions.batchCheck(checks.map(c => ({ 
      userId: context?.userId || '', 
      resource: c.resource, 
      action: c.action, 
      organizationId 
    }))),
    queryFn: async (): Promise<Record<string, UnifiedPermissionResult>> => {
      if (!context) {
        return checks.reduce((acc, check) => {
          acc[`${check.resource}:${check.action}`] = {
            granted: false,
            reason: 'denied',
            details: 'No authentication context'
          };
          return acc;
        }, {} as Record<string, UnifiedPermissionResult>);
      }
      return await unifiedPermissionService.hasPermissions(context, checks);
    },
    enabled: enabled && !!context && checks.length > 0,
    staleTime,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for getting all permissions for a resource (useful for permission matrix UI)
 */
export function useResourcePermissions(
  resource: Resource,
  organizationId?: string,
  options: UsePermissionOptions = {}
) {
  const { data: session } = authClient.useSession();
  const { enabled = true, staleTime = 5 * 60 * 1000 } = options;

  const context: PermissionContext | null = useMemo(() => {
    if (!session?.user?.id) return null;
    return {
      userId: session.user.id,
      organizationId
    };
  }, [session?.user?.id, organizationId]);

  return useQuery({
    queryKey: queryKeys.permissions.matrix('user', context?.userId || '', organizationId),
    queryFn: async (): Promise<Record<Action, UnifiedPermissionResult>> => {
      if (!context) {
        const actions: Action[] = ['read', 'create', 'update', 'delete'];
        return actions.reduce((acc, action) => {
          acc[action] = {
            granted: false,
            reason: 'denied',
            details: 'No authentication context'
          };
          return acc;
        }, {} as Record<Action, UnifiedPermissionResult>);
      }
      return await unifiedPermissionService.getResourcePermissions(context, resource);
    },
    enabled: enabled && !!context,
    staleTime,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for checking if user can access a resource at all
 */
export function useCanAccessResource(
  resource: Resource,
  organizationId?: string,
  options: UsePermissionOptions = {}
) {
  const { data: session } = authClient.useSession();
  const { enabled = true, staleTime = 5 * 60 * 1000 } = options;

  const context: PermissionContext | null = useMemo(() => {
    if (!session?.user?.id) return null;
    return {
      userId: session.user.id,
      organizationId
    };
  }, [session?.user?.id, organizationId]);

  return useQuery({
    queryKey: [...queryKeys.permissions.check({
      userId: context?.userId || '',
      resource,
      action: 'read',
      organizationId
    }), 'access'],
    queryFn: async (): Promise<UnifiedPermissionResult> => {
      if (!context) {
        return {
          granted: false,
          reason: 'denied',
          details: 'No authentication context'
        };
      }
      return await unifiedPermissionService.canAccessResource(context, resource);
    },
    enabled: enabled && !!context,
    staleTime,
    refetchOnWindowFocus: false,
  });
}

/**
 * Convenient boolean hooks for common permission checks
 */
export function useCanRead(resource: Resource, organizationId?: string) {
  const { data } = usePermission(resource, 'read', organizationId);
  return data?.granted ?? false;
}

export function useCanCreate(resource: Resource, organizationId?: string) {
  const { data } = usePermission(resource, 'create', organizationId);
  return data?.granted ?? false;
}

export function useCanUpdate(resource: Resource, organizationId?: string) {
  const { data } = usePermission(resource, 'update', organizationId);
  return data?.granted ?? false;
}

export function useCanDelete(resource: Resource, organizationId?: string) {
  const { data } = usePermission(resource, 'delete', organizationId);
  return data?.granted ?? false;
}

/**
 * Hook for permission checks with organization context from active organization
 */
export function useActiveOrgPermission(resource: Resource, action: Action) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  return usePermission(resource, action, activeOrganization?.id);
}

/**
 * Hook for multiple permission checks with active organization context
 */
export function useActiveOrgPermissions(checks: Array<{ resource: Resource; action: Action }>) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  return usePermissions(checks, activeOrganization?.id);
}

/**
 * Hook for resource permissions with active organization context
 */
export function useActiveOrgResourcePermissions(resource: Resource) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  return useResourcePermissions(resource, activeOrganization?.id);
}

/**
 * Convenient boolean hooks for active organization permissions
 */
export function useActiveOrgCanRead(resource: Resource) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  return useCanRead(resource, activeOrganization?.id);
}

export function useActiveOrgCanCreate(resource: Resource) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  return useCanCreate(resource, activeOrganization?.id);
}

export function useActiveOrgCanUpdate(resource: Resource) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  return useCanUpdate(resource, activeOrganization?.id);
}

export function useActiveOrgCanDelete(resource: Resource) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  return useCanDelete(resource, activeOrganization?.id);
}

/**
 * Legacy compatibility - wrapper for the existing usePermissionChecks hook
 * This helps migrate from the old permission system gradually
 */
export function usePermissionChecks(organizationId?: string) {
  const canViewUsers = useCanRead('user', organizationId);
  const canCreateUsers = useCanCreate('user', organizationId);
  const canUpdateUsers = useCanUpdate('user', organizationId);
  const canDeleteUsers = useCanDelete('user', organizationId);

  const canViewTeams = useCanRead('team', organizationId);
  const canCreateTeams = useCanCreate('team', organizationId);
  const canUpdateTeams = useCanUpdate('team', organizationId);
  const canDeleteTeams = useCanDelete('team', organizationId);

  const canViewOrganizations = useCanRead('organization', organizationId);
  const canUpdateOrganizations = useCanUpdate('organization', organizationId);

  const canViewStores = useCanRead('store', organizationId);
  const canManageStores = useCanCreate('store', organizationId);

  const canViewScripts = useCanRead('game', organizationId);
  const canManageScripts = useCanCreate('game', organizationId);

  const canViewSessions = useCanRead('game', organizationId);
  const canManageSessions = useCanCreate('game', organizationId);

  // Role Management Permissions
  const canViewSystemRoles = useCanRead('system_role', organizationId);
  const canCreateSystemRoles = useCanCreate('system_role', organizationId);
  const canUpdateSystemRoles = useCanUpdate('system_role', organizationId);
  const canDeleteSystemRoles = useCanDelete('system_role', organizationId);

  const canViewOrgRoles = useCanRead('organization_role', organizationId);
  const canCreateOrgRoles = useCanCreate('organization_role', organizationId);
  const canUpdateOrgRoles = useCanUpdate('organization_role', organizationId);
  const canDeleteOrgRoles = useCanDelete('organization_role', organizationId);

  const canViewPermissions = useCanRead('permission', organizationId);
  const canCreatePermissions = useCanCreate('permission', organizationId);
  const canUpdatePermissions = useCanUpdate('permission', organizationId);
  const canDeletePermissions = useCanDelete('permission', organizationId);

  return {
    canViewUsers,
    canCreateUsers,
    canUpdateUsers,
    canDeleteUsers,
    canViewTeams,
    canCreateTeams,
    canUpdateTeams,
    canDeleteTeams,
    canViewOrganizations,
    canUpdateOrganizations,
    canViewStores,
    canManageStores,
    canViewScripts,
    canManageScripts,
    canViewSessions,
    canManageSessions,
    // Role Management
    canViewSystemRoles,
    canCreateSystemRoles,
    canUpdateSystemRoles,
    canDeleteSystemRoles,
    canViewOrgRoles,
    canCreateOrgRoles,
    canUpdateOrgRoles,
    canDeleteOrgRoles,
    canViewPermissions,
    canCreatePermissions,
    canUpdatePermissions,
    canDeletePermissions,
  };
}