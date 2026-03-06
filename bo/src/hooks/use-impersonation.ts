"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useSession } from "@/lib/auth-client";
import { isSystemAdmin } from "@/lib/permissions";
import { useRouter } from "next/navigation";

/**
 * User Impersonation Types
 */
export interface ImpersonationSession {
  originalUserId: string;
  impersonatedUserId: string;
  impersonatedUser: {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
    role: string | null;
  };
  startedAt: Date;
  expiresAt: Date;
}

export interface ImpersonationRequest {
  userId: string;
  reason?: string;
  duration?: number; // in minutes, default 60
}

/**
 * Hook to start user impersonation (system admin only)
 */
export function useImpersonateUser() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async ({ userId, reason, duration = 60 }: ImpersonationRequest) => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const response = await fetch("/api/system/impersonate", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, reason, duration }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start impersonation");
      }

      return response.json();
    },
    onSuccess: (data, { userId }) => {
      // Invalidate user-specific queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.users.impersonate(userId),
      });

      // Invalidate current session to reflect impersonation
      queryClient.invalidateQueries({
        queryKey: ['auth', 'session'], // TanStack Query key for auth session
      });

      // Store impersonation state in local storage for UI indicators
      localStorage.setItem("impersonation", JSON.stringify({
        originalUserId: session?.user?.id,
        impersonatedUserId: userId,
        startedAt: new Date().toISOString(),
      }));

      // Redirect to dashboard as impersonated user
      router.push("/dashboard");
    },
    onError: (error) => {
      console.error("Impersonation mutation error:", error);
    },
  });
}

/**
 * Hook to stop user impersonation and return to original session
 */
export function useStopImpersonation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/system/impersonate/stop", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to stop impersonation");
      }

      return response.json();
    },
    onSuccess: () => {
      // Clear impersonation state
      localStorage.removeItem("impersonation");

      // Invalidate all cached data as we're switching users
      queryClient.clear();

      // Refetch session to get original user
      queryClient.invalidateQueries({
        queryKey: ['auth', 'session'],
      });

      // Redirect to system admin area
      router.push("/dashboard/system");
    },
    onError: (error) => {
      console.error("Stop impersonation mutation error:", error);
    },
  });
}

/**
 * Hook to get current impersonation status
 */
export function useImpersonationStatus() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["impersonation", "status"],
    queryFn: async (): Promise<ImpersonationSession | null> => {
      const response = await fetch("/api/system/impersonate/status", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Not impersonating
        }
        const error = await response.json();
        throw new Error(error.error || "Failed to get impersonation status");
      }

      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Check every minute
    retry: false, // Don't retry 404s
  });
}

/**
 * Hook to get impersonation history (system admin only)
 */
export function useImpersonationHistory(page = 1, limit = 20) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useQuery({
    queryKey: ["impersonation", "history", { page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/system/impersonate/history?${params}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch impersonation history");
      }

      return response.json();
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to validate impersonation permissions for a specific user
 */
export function useCanImpersonate(userId?: string) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useQuery({
    queryKey: queryKeys.system.users.impersonate(userId || ""),
    queryFn: async () => {
      if (!userId) return false;

      const response = await fetch(`/api/system/impersonate/validate/${userId}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.canImpersonate;
    },
    enabled: isAdmin && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Custom hook to provide impersonation UI helpers
 */
export function useImpersonationUI() {
  const { data: impersonationStatus } = useImpersonationStatus();
  const stopImpersonation = useStopImpersonation();

  // Check if currently impersonating
  const isImpersonating = !!impersonationStatus;

  // Get local storage state for UI consistency
  const localImpersonationState = typeof window !== "undefined" 
    ? localStorage.getItem("impersonation") 
    : null;
  
  const localState = localImpersonationState 
    ? JSON.parse(localImpersonationState) 
    : null;

  return {
    isImpersonating,
    impersonationSession: impersonationStatus,
    originalUserId: impersonationStatus?.originalUserId || localState?.originalUserId,
    impersonatedUser: impersonationStatus?.impersonatedUser,
    stopImpersonation: stopImpersonation.mutate,
    isStoppingImpersonation: stopImpersonation.isPending,
  };
}

/**
 * Hook for impersonation activity logging
 */
export function useLogImpersonationActivity() {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async ({
      action,
      targetUserId,
      details,
    }: {
      action: "start" | "stop" | "access" | "error";
      targetUserId: string;
      details?: Record<string, any>;
    }) => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const response = await fetch("/api/system/impersonate/log", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          targetUserId,
          details,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to log impersonation activity");
      }

      return response.json();
    },
  });
}