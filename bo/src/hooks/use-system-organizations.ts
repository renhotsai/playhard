"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useSession } from "@/lib/auth-client";
import { isSystemAdmin } from "@/lib/permissions";

/**
 * System Organization Types
 */
export interface SystemOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  metadata: Record<string, any> | null;
  stats: {
    totalMembers: number;
    totalTeams: number;
    pendingInvitations: number;
  };
  owners: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
  }>;
}

export interface SystemOrganizationsResponse {
  organizations: SystemOrganization[];
  total: number;
}

export interface CreateOrganizationRequest {
  name: string;
  ownerId: string;
  metadata?: Record<string, any>;
}

/**
 * Hook to fetch all organizations (system admin only)
 */
export function useSystemOrganizations(filters?: Record<string, unknown>) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useQuery({
    queryKey: queryKeys.system.organizations.list(filters),
    queryFn: async (): Promise<SystemOrganizationsResponse> => {
      const response = await fetch("/api/system/organizations", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch system organizations");
      }

      return response.json();
    },
    enabled: isAdmin, // Only run query if user is system admin
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 403 (permission errors)
      if (error instanceof Error && error.message.includes("privileges")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to fetch specific organization details (system admin view)
 */
export function useSystemOrganization(organizationId: string) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useQuery({
    queryKey: queryKeys.system.organizations.detail(organizationId),
    queryFn: async (): Promise<SystemOrganization> => {
      const response = await fetch(`/api/system/organizations/${organizationId}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch organization details");
      }

      return response.json();
    },
    enabled: isAdmin && !!organizationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to create new organization (system admin only)
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async (data: CreateOrganizationRequest) => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const response = await fetch("/api/system/organizations", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create organization");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch system organizations list
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.organizations.all(),
      });

      // Add optimistic data to cache
      queryClient.setQueryData(
        queryKeys.system.organizations.detail(data.organization.id),
        data.organization
      );

      // Invalidate analytics that might be affected
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.analytics.all(),
      });
    },
    onError: (error) => {
      console.error("Create organization mutation error:", error);
    },
  });
}

/**
 * Hook to update organization (system admin only)
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async ({ 
      organizationId, 
      data 
    }: { 
      organizationId: string; 
      data: Partial<CreateOrganizationRequest>;
    }) => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const response = await fetch(`/api/system/organizations/${organizationId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update organization");
      }

      return response.json();
    },
    onMutate: async ({ organizationId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.system.organizations.detail(organizationId),
      });

      // Snapshot previous value
      const previousOrganization = queryClient.getQueryData(
        queryKeys.system.organizations.detail(organizationId)
      );

      // Optimistically update to new value
      queryClient.setQueryData(
        queryKeys.system.organizations.detail(organizationId),
        (old: SystemOrganization | undefined) => old ? { ...old, ...data } : undefined
      );

      return { previousOrganization };
    },
    onError: (error, { organizationId }, context) => {
      // Rollback on error
      if (context?.previousOrganization) {
        queryClient.setQueryData(
          queryKeys.system.organizations.detail(organizationId),
          context.previousOrganization
        );
      }
    },
    onSettled: (data, error, { organizationId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.organizations.detail(organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.organizations.all(),
      });
    },
  });
}

/**
 * Hook to delete organization (system admin only)
 */
export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async (organizationId: string) => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const response = await fetch(`/api/system/organizations/${organizationId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete organization");
      }

      return response.json();
    },
    onSuccess: (data, organizationId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.system.organizations.detail(organizationId),
      });

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.organizations.all(),
      });

      // Invalidate analytics
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.analytics.all(),
      });
    },
  });
}