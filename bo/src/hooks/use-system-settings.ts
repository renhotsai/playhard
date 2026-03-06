"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useSession } from "@/lib/auth-client";
import { isSystemAdmin } from "@/lib/permissions";

/**
 * System Settings Types
 */
export interface SystemSettings {
  global: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    supportEmail: string;
    maxOrganizations: number;
    maxUsersPerOrganization: number;
    enableRegistration: boolean;
    enableInvitations: boolean;
    defaultUserRole: "admin" | "member";
    sessionTimeout: number; // in minutes
  };
  features: {
    analytics: boolean;
    notifications: boolean;
    emailVerification: boolean;
    twoFactorAuth: boolean;
    apiAccess: boolean;
    exportData: boolean;
    auditLogs: boolean;
    customBranding: boolean;
  };
  maintenance: {
    enabled: boolean;
    message: string;
    startTime: Date | null;
    endTime: Date | null;
    allowedRoles: string[];
  };
  security: {
    passwordMinLength: number;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
    passwordRequireUppercase: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number; // in minutes
    sessionSecure: boolean;
    corsOrigins: string[];
  };
  email: {
    provider: "resend" | "sendgrid" | "ses";
    fromName: string;
    fromEmail: string;
    replyTo: string;
    templates: {
      welcome: string;
      invitation: string;
      passwordReset: string;
      emailVerification: string;
    };
  };
}

export interface UpdateSettingsRequest {
  section: keyof SystemSettings;
  data: Partial<SystemSettings[keyof SystemSettings]>;
}

/**
 * Hook to fetch all system settings (system admin only)
 */
export function useSystemSettings() {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useQuery({
    queryKey: queryKeys.system.settings.global(),
    queryFn: async (): Promise<SystemSettings> => {
      const response = await fetch("/api/system/settings", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch system settings");
      }

      return response.json();
    },
    enabled: isAdmin,
    staleTime: 10 * 60 * 1000, // 10 minutes (settings don't change frequently)
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("privileges")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to fetch specific feature settings
 */
export function useFeatureSettings(featureKey: string) {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useQuery({
    queryKey: queryKeys.system.settings.feature(featureKey),
    queryFn: async () => {
      const response = await fetch(`/api/system/settings/features/${featureKey}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to fetch ${featureKey} settings`);
      }

      return response.json();
    },
    enabled: isAdmin && !!featureKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to fetch maintenance mode settings
 */
export function useMaintenanceSettings() {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useQuery({
    queryKey: queryKeys.system.settings.maintenance(),
    queryFn: async () => {
      const response = await fetch("/api/system/settings/maintenance", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch maintenance settings");
      }

      return response.json();
    },
    enabled: isAdmin,
    staleTime: 1 * 60 * 1000, // 1 minute (maintenance status needs to be fresh)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Check every minute
  });
}

/**
 * Hook to update system settings (system admin only)
 */
export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async ({ section, data }: UpdateSettingsRequest) => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const response = await fetch(`/api/system/settings/${section}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to update ${section} settings`);
      }

      return response.json();
    },
    onMutate: async ({ section, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.system.settings.global(),
      });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<SystemSettings>(
        queryKeys.system.settings.global()
      );

      // Optimistically update settings
      queryClient.setQueryData<SystemSettings>(
        queryKeys.system.settings.global(),
        (old) => old ? { ...old, [section]: { ...old[section], ...data } } : undefined
      );

      return { previousSettings };
    },
    onError: (error, { section }, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(
          queryKeys.system.settings.global(),
          context.previousSettings
        );
      }
      console.error(`Update ${section} settings error:`, error);
    },
    onSuccess: (data, { section }) => {
      // Invalidate specific section queries
      if (section === "features") {
        queryClient.invalidateQueries({
          queryKey: [...queryKeys.system.settings.all(), "feature"],
        });
      } else if (section === "maintenance") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.system.settings.maintenance(),
        });
      }
    },
    onSettled: () => {
      // Always refetch settings after mutation
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.settings.global(),
      });
    },
  });
}

/**
 * Hook to toggle feature flags
 */
export function useToggleFeature() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async ({
      feature,
      enabled,
    }: {
      feature: string;
      enabled: boolean;
    }) => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const response = await fetch(`/api/system/settings/features/${feature}/toggle`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to toggle ${feature}`);
      }

      return response.json();
    },
    onSuccess: (data, { feature }) => {
      // Invalidate feature and global settings
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.settings.feature(feature),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.settings.global(),
      });
    },
  });
}

/**
 * Hook to toggle maintenance mode
 */
export function useToggleMaintenanceMode() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async ({
      enabled,
      message,
      duration, // in minutes
    }: {
      enabled: boolean;
      message?: string;
      duration?: number;
    }) => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const endTime = duration 
        ? new Date(Date.now() + duration * 60 * 1000).toISOString()
        : null;

      const response = await fetch("/api/system/settings/maintenance/toggle", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled,
          message: message || "System is under maintenance. Please try again later.",
          startTime: enabled ? new Date().toISOString() : null,
          endTime,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle maintenance mode");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate maintenance settings
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.settings.maintenance(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.settings.global(),
      });
    },
  });
}

/**
 * Hook to backup system settings
 */
export function useBackupSettings() {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async () => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const response = await fetch("/api/system/settings/backup", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to backup settings");
      }

      // Handle file download
      const blob = await response.blob();
      const filename = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;

      return { blob, filename };
    },
    onSuccess: ({ blob, filename }) => {
      // Download the backup file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}

/**
 * Hook to restore system settings from backup
 */
export function useRestoreSettings() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);

  return useMutation({
    mutationFn: async (backupFile: File) => {
      if (!isAdmin) {
        throw new Error("System admin privileges required");
      }

      const formData = new FormData();
      formData.append("backup", backupFile);

      const response = await fetch("/api/system/settings/restore", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to restore settings");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all settings queries after restore
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.settings.all(),
      });
    },
  });
}