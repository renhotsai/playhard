"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useSession } from "@/lib/auth-client";
import { isSystemAdmin } from "@/lib/permissions";

/**
 * System User Types
 */
export interface SystemUser {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  role: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  stats: {
    activeSessions: number;
    organizationMemberships: number;
  };
  organizations: Array<{
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    role: string;
    joinedAt: Date;
  }>;
}

export interface SystemUsersResponse {
  users: SystemUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role?: "admin" | "member";
  organizationId?: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
}

/**
 * Hook to fetch all users with pagination (system admin only)
 */
export function useSystemUsers(filters: UserFilters = {}) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  const { page = 1, limit = 20, ...otherFilters } = filters;

  return useQuery({
    queryKey: queryKeys.system.users.paginated(page, limit, otherFilters),
    queryFn: async (): Promise<SystemUsersResponse> => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.entries(otherFilters)
          .filter(([_, value]) => value !== undefined && value !== "")
          .reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {}),
      });

      const response = await fetch(`/api/system/users?${searchParams}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch system users");
      }

      return response.json();
    },
    enabled: isAdmin, // Only run query if user is system admin
    staleTime: 2 * 60 * 1000, // 2 minutes (users change more frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData, // Keep previous page data while fetching new page
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
 * Hook to fetch specific user details (system admin view)
 */
export function useSystemUser(userId: string) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useQuery({
    queryKey: queryKeys.system.users.detail(userId),
    queryFn: async (): Promise<SystemUser> => {
      const response = await fetch(`/api/system/users/${userId}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch user details");
      }

      return response.json();
    },
    enabled: isAdmin && !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create new user (system admin only)
 */
export function useCreateSystemUser() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const response = await fetch("/api/system/users", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate all user queries to refresh lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.users.all(),
      });

      // If user was added to organization, invalidate organization data too
      if (data.organizationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.system.organizations.members(data.organizationId),
        });
      }

      // Invalidate analytics
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.analytics.users(),
      });
    },
    onError: (error) => {
      console.error("Create user mutation error:", error);
    },
  });
}

/**
 * Hook to update user role and details (system admin only)
 */
export function useUpdateSystemUser() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: Partial<{
        name: string;
        email: string;
        role: "admin" | "member";
        emailVerified: boolean;
      }>;
    }) => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const response = await fetch(`/api/system/users/${userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      return response.json();
    },
    onMutate: async ({ userId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.system.users.detail(userId),
      });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(
        queryKeys.system.users.detail(userId)
      );

      // Optimistically update
      queryClient.setQueryData(
        queryKeys.system.users.detail(userId),
        (old: SystemUser | undefined) => old ? { ...old, ...data } : undefined
      );

      return { previousUser };
    },
    onError: (error, { userId }, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(
          queryKeys.system.users.detail(userId),
          context.previousUser
        );
      }
    },
    onSettled: (data, error, { userId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.users.detail(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.users.all(),
      });
    },
  });
}

/**
 * Hook to ban/unban user (system admin only)
 */
export function useBanUser() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async ({
      userId,
      banned,
      reason,
    }: {
      userId: string;
      banned: boolean;
      reason?: string;
    }) => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const response = await fetch(`/api/system/users/${userId}/ban`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ banned, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${banned ? "ban" : "unban"} user`);
      }

      return response.json();
    },
    onSuccess: (data, { userId }) => {
      // Invalidate user queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.users.detail(userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.users.all(),
      });
    },
  });
}

/**
 * Hook to delete user (system admin only)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const response = await fetch(`/api/system/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      return response.json();
    },
    onSuccess: (data, userId) => {
      // Remove user from cache
      queryClient.removeQueries({
        queryKey: queryKeys.system.users.detail(userId),
      });

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.users.all(),
      });

      // Invalidate organization data if user was a member
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.organizations.all(),
      });

      // Invalidate analytics
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.analytics.users(),
      });
    },
  });
}