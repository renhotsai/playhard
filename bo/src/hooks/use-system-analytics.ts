"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useSession } from "@/lib/auth-client";
import { isSystemAdmin } from "@/lib/permissions";

/**
 * System Analytics Types
 */
export interface SystemAnalytics {
  dashboard: {
    totalOrganizations: number;
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    revenueGrowth: number;
    userGrowth: number;
    organizationGrowth: number;
  };
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    memberCount: number;
    revenue: number;
    activeUsers: number;
    lastActivity: Date;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    organizationCount: number;
    lastActive: Date;
    totalRevenue: number;
  }>;
  revenue: {
    total: number;
    byOrganization: Array<{
      organizationId: string;
      organizationName: string;
      amount: number;
      growth: number;
    }>;
    byPeriod: Array<{
      period: string;
      amount: number;
      count: number;
    }>;
  };
}

export interface AnalyticsPeriod {
  period: "24h" | "7d" | "30d" | "90d" | "1y";
  organizationId?: string;
}

/**
 * Hook to fetch system dashboard analytics (system admin only)
 */
export function useSystemAnalytics(period: AnalyticsPeriod["period"] = "30d") {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useQuery({
    queryKey: queryKeys.system.analytics.dashboard(period),
    queryFn: async (): Promise<SystemAnalytics> => {
      const response = await fetch(`/api/system/analytics?period=${period}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch system analytics");
      }

      return response.json();
    },
    enabled: isAdmin,
    staleTime: 10 * 60 * 1000, // 10 minutes (analytics can be slightly stale)
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("privileges")) {
        return false;
      }
      return failureCount < 2; // Less retries for analytics
    },
  });
}

/**
 * Hook to fetch organization-specific analytics (system admin view)
 */
export function useSystemOrganizationAnalytics(
  organizationId: string,
  period: AnalyticsPeriod["period"] = "30d"
) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useQuery({
    queryKey: queryKeys.system.organizations.analytics(organizationId, period),
    queryFn: async () => {
      const response = await fetch(
        `/api/system/analytics/organizations/${organizationId}?period=${period}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch organization analytics");
      }

      return response.json();
    },
    enabled: isAdmin && !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch user analytics across all organizations (system admin only)
 */
export function useSystemUserAnalytics(period: AnalyticsPeriod["period"] = "30d") {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useQuery({
    queryKey: queryKeys.system.analytics.users(period),
    queryFn: async () => {
      const response = await fetch(`/api/system/analytics/users?period=${period}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch user analytics");
      }

      return response.json();
    },
    enabled: isAdmin,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch revenue analytics (system admin only)
 */
export function useSystemRevenueAnalytics(
  period: AnalyticsPeriod["period"] = "30d",
  organizationId?: string
) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useQuery({
    queryKey: queryKeys.system.analytics.revenue(period, organizationId),
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (organizationId) {
        params.append("organizationId", organizationId);
      }

      const response = await fetch(`/api/system/analytics/revenue?${params}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch revenue analytics");
      }

      return response.json();
    },
    enabled: isAdmin,
    staleTime: 15 * 60 * 1000, // 15 minutes (revenue updates less frequently)
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to export analytics data (system admin only)
 */
export function useExportAnalytics() {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async ({
      type,
      period,
      organizationId,
      format = "csv",
    }: {
      type: "dashboard" | "organizations" | "users" | "revenue";
      period: AnalyticsPeriod["period"];
      organizationId?: string;
      format?: "csv" | "xlsx" | "json";
    }) => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const params = new URLSearchParams({ 
        type, 
        period, 
        format 
      });
      if (organizationId) {
        params.append("organizationId", organizationId);
      }

      const response = await fetch(`/api/system/analytics/export?${params}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to export analytics");
      }

      // Handle file download
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ?.split("filename=")[1]
        ?.replace(/"/g, "") || `analytics-${type}-${period}.${format}`;

      return { blob, filename };
    },
    onSuccess: ({ blob, filename }) => {
      // Download the file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      console.error("Export analytics mutation error:", error);
    },
  });
}

/**
 * Hook to refresh all analytics data
 */
export function useRefreshAnalytics() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async () => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const response = await fetch("/api/system/analytics/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to refresh analytics");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all analytics queries to trigger refresh
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.analytics.all(),
      });
    },
    onError: (error) => {
      console.error("Refresh analytics mutation error:", error);
    },
  });
}

/**
 * Real-time analytics hook with WebSocket support
 */
export function useRealTimeAnalytics(
  period: AnalyticsPeriod["period"] = "24h",
  enabled = false
) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.system.analytics.dashboard(`realtime-${period}`),
    queryFn: async () => {
      const response = await fetch(`/api/system/analytics/realtime?period=${period}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch real-time analytics");
      }

      return response.json();
    },
    enabled: isAdmin && enabled,
    staleTime: 0, // Always fresh for real-time
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    refetchIntervalInBackground: true,
  });
}