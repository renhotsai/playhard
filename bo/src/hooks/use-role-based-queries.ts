"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { isSystemAdmin, canAccessAllOrganizations } from "@/lib/permissions";
import { queryKeys } from "@/lib/query-keys";

/**
 * Role-Based Query Patterns for Cross-Brand Data Management
 * 
 * Provides conditional query execution based on user roles and permissions,
 * ensuring data access follows the dual-tier permission system.
 */

/**
 * Hook that conditionally executes queries based on system admin status
 */
export function useSystemAdminQuery<TData = unknown, TError = Error>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn' | 'enabled'>
) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useQuery({
    queryKey,
    queryFn,
    enabled: isAdmin,
    ...options,
  });
}

/**
 * Hook that provides different query functions based on user role
 */
export function useRoleBasedQuery<TData = unknown, TError = Error>(
  queries: {
    systemAdmin: {
      queryKey: readonly unknown[];
      queryFn: () => Promise<TData>;
    };
    organizationMember: {
      queryKey: readonly unknown[];
      queryFn: () => Promise<TData>;
    };
  },
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn' | 'enabled'>
) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  const selectedQuery = isAdmin ? queries.systemAdmin : queries.organizationMember;

  return useQuery({
    ...selectedQuery,
    enabled: !!session?.user,
    ...options,
  });
}

/**
 * Hook for organizations data with role-based access
 */
export function useRoleBasedOrganizations(filters?: Record<string, unknown>) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useRoleBasedQuery(
    {
      systemAdmin: {
        queryKey: queryKeys.system.organizations.list(filters),
        queryFn: async () => {
          const response = await fetch("/api/system/organizations", {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to fetch system organizations");
          }
          
          return response.json();
        },
      },
      organizationMember: {
        queryKey: queryKeys.organizations.list(filters),
        queryFn: async () => {
          // Use Better Auth organization client for regular users
          const response = await fetch("/api/organizations", {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to fetch organizations");
          }
          
          return response.json();
        },
      },
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

/**
 * Hook for users data with role-based access and pagination
 */
export function useRoleBasedUsers(
  filters: {
    page?: number;
    limit?: number;
    search?: string;
    organizationId?: string;
  } = {}
) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);
  const { page = 1, limit = 20, ...otherFilters } = filters;

  return useRoleBasedQuery(
    {
      systemAdmin: {
        queryKey: queryKeys.system.users.paginated(page, limit, otherFilters),
        queryFn: async () => {
          const searchParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...Object.entries(otherFilters)
              .filter(([_, value]) => value !== undefined && value !== "")
              .reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {}),
          });

          const response = await fetch(`/api/system/users?${searchParams}`, {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to fetch system users");
          }
          
          return response.json();
        },
      },
      organizationMember: {
        queryKey: queryKeys.users.paginated(page, limit, otherFilters),
        queryFn: async () => {
          // For organization members, they can only see users in their organizations
          const searchParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...Object.entries(otherFilters)
              .filter(([_, value]) => value !== undefined && value !== "")
              .reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {}),
          });

          const response = await fetch(`/api/users?${searchParams}`, {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to fetch users");
          }
          
          return response.json();
        },
      },
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      placeholderData: (previousData) => previousData,
    }
  );
}

/**
 * Hook for analytics data with role-based access
 */
export function useRoleBasedAnalytics(
  period: "24h" | "7d" | "30d" | "90d" | "1y" = "30d",
  organizationId?: string
) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useRoleBasedQuery(
    {
      systemAdmin: {
        queryKey: organizationId 
          ? queryKeys.system.organizations.analytics(organizationId, period)
          : queryKeys.system.analytics.dashboard(period),
        queryFn: async () => {
          const url = organizationId 
            ? `/api/system/analytics/organizations/${organizationId}?period=${period}`
            : `/api/system/analytics?period=${period}`;

          const response = await fetch(url, {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to fetch system analytics");
          }
          
          return response.json();
        },
      },
      organizationMember: {
        queryKey: ["organizations", "analytics", period, organizationId],
        queryFn: async () => {
          // Organization members can only see their organization's analytics
          const url = organizationId
            ? `/api/organizations/${organizationId}/analytics?period=${period}`
            : `/api/analytics?period=${period}`;

          const response = await fetch(url, {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to fetch organization analytics");
          }
          
          return response.json();
        },
      },
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
    }
  );
}

/**
 * Hook to check if user can access specific data
 */
export function useDataAccess() {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return {
    // System-level access
    canViewAllOrganizations: isAdmin,
    canViewAllUsers: isAdmin,
    canViewSystemAnalytics: isAdmin,
    canManageSystemSettings: isAdmin,
    canImpersonateUsers: isAdmin,
    
    // Organization-level access
    canViewOrganizationData: !!session?.user,
    canManageOrganizationUsers: !!session?.user,
    
    // Current user context
    isSystemAdmin: isAdmin,
    currentUserId: session?.user?.id,
    currentUserRole: session?.user?.role,
  };
}

/**
 * Hook for conditional data prefetching based on role
 */
export function useRoleBasedPrefetch() {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  // Returns prefetch functions based on user role
  return {
    prefetchSystemData: isAdmin ? {
      organizations: () => queryKeys.system.organizations.all(),
      users: () => queryKeys.system.users.all(),
      analytics: () => queryKeys.system.analytics.dashboard(),
      settings: () => queryKeys.system.settings.global(),
    } : null,
    
    prefetchOrganizationData: {
      organizations: () => queryKeys.organizations.all(),
      users: () => queryKeys.users.all(),
    },
  };
}

/**
 * Hook for organization-scoped queries with automatic filtering
 */
export function useOrganizationScopedQuery<TData = unknown, TError = Error>(
  organizationId: string,
  queryKeyFactory: (orgId: string) => readonly unknown[],
  queryFnFactory: (orgId: string) => () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn' | 'enabled'>
) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  // System admins can access any organization, regular users need membership check
  const canAccess = isAdmin || (session?.user && organizationId);

  return useQuery({
    queryKey: queryKeyFactory(organizationId),
    queryFn: queryFnFactory(organizationId),
    enabled: canAccess && !!organizationId,
    ...options,
  });
}

/**
 * Hook for user permission checks with caching
 */
export function useUserPermissions(userId?: string) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useQuery({
    queryKey: ["permissions", "user", userId],
    queryFn: async () => {
      if (!userId) return null;

      const response = await fetch(`/api/users/${userId}/permissions`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 403) {
          // User doesn't have permission to view these permissions
          return null;
        }
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch user permissions");
      }

      return response.json();
    },
    enabled: !!userId && (isAdmin || session?.user?.id === userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}