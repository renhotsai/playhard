"use client";

import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { SystemOrganization } from "@/hooks/use-system-organizations";
import { SystemUser } from "@/hooks/use-system-users";

/**
 * Optimistic Updates Service for System Admin Operations
 * 
 * Provides optimistic update patterns for system admin operations
 * to improve perceived performance while maintaining data consistency.
 */

export type OptimisticUpdateContext<T> = {
  previousData: T;
  rollback: () => void;
};

export class OptimisticUpdatesService {
  constructor(private queryClient: QueryClient) {}

  /**
   * Organization Optimistic Updates
   */

  // Optimistically create organization
  createOrganizationOptimistic(
    newOrganization: Omit<SystemOrganization, 'id' | 'createdAt' | 'stats'>
  ): OptimisticUpdateContext<SystemOrganization[]> {
    const tempId = `temp_${Date.now()}`;
    const tempOrganization: SystemOrganization = {
      id: tempId,
      createdAt: new Date(),
      stats: { totalMembers: 1, totalTeams: 0, pendingInvitations: 0 },
      ...newOrganization,
    };

    const queryKey = queryKeys.system.organizations.all();
    const previousData = this.queryClient.getQueryData<{ organizations: SystemOrganization[] }>(queryKey);

    if (previousData) {
      this.queryClient.setQueryData(queryKey, {
        ...previousData,
        organizations: [tempOrganization, ...previousData.organizations],
        total: previousData.total + 1,
      });
    }

    return {
      previousData: previousData?.organizations || [],
      rollback: () => {
        if (previousData) {
          this.queryClient.setQueryData(queryKey, previousData);
        }
      },
    };
  }

  // Optimistically update organization
  updateOrganizationOptimistic(
    organizationId: string,
    updates: Partial<SystemOrganization>
  ): OptimisticUpdateContext<SystemOrganization> {
    const queryKey = queryKeys.system.organizations.detail(organizationId);
    const previousData = this.queryClient.getQueryData<SystemOrganization>(queryKey);

    if (previousData) {
      const updatedOrganization = { ...previousData, ...updates };
      this.queryClient.setQueryData(queryKey, updatedOrganization);

      // Also update in lists
      this.updateInOrganizationLists(organizationId, updatedOrganization);
    }

    return {
      previousData: previousData!,
      rollback: () => {
        if (previousData) {
          this.queryClient.setQueryData(queryKey, previousData);
          this.updateInOrganizationLists(organizationId, previousData);
        }
      },
    };
  }

  // Optimistically delete organization
  deleteOrganizationOptimistic(organizationId: string): OptimisticUpdateContext<any> {
    const detailQueryKey = queryKeys.system.organizations.detail(organizationId);
    const listQueryKey = queryKeys.system.organizations.all();
    
    const previousDetail = this.queryClient.getQueryData(detailQueryKey);
    const previousList = this.queryClient.getQueryData<{ organizations: SystemOrganization[], total: number }>(listQueryKey);

    // Remove from cache
    this.queryClient.removeQueries({ queryKey: detailQueryKey });

    // Remove from list
    if (previousList) {
      const filteredOrganizations = previousList.organizations.filter(org => org.id !== organizationId);
      this.queryClient.setQueryData(listQueryKey, {
        ...previousList,
        organizations: filteredOrganizations,
        total: previousList.total - 1,
      });
    }

    return {
      previousData: { detail: previousDetail, list: previousList },
      rollback: () => {
        if (previousDetail) {
          this.queryClient.setQueryData(detailQueryKey, previousDetail);
        }
        if (previousList) {
          this.queryClient.setQueryData(listQueryKey, previousList);
        }
      },
    };
  }

  private updateInOrganizationLists(organizationId: string, updatedOrganization: SystemOrganization) {
    const listQueryKey = queryKeys.system.organizations.all();
    const currentList = this.queryClient.getQueryData<{ organizations: SystemOrganization[] }>(listQueryKey);

    if (currentList) {
      const updatedList = {
        ...currentList,
        organizations: currentList.organizations.map(org =>
          org.id === organizationId ? updatedOrganization : org
        ),
      };
      this.queryClient.setQueryData(listQueryKey, updatedList);
    }
  }

  /**
   * User Optimistic Updates
   */

  // Optimistically create user
  createUserOptimistic(
    newUser: Omit<SystemUser, 'id' | 'createdAt' | 'updatedAt' | 'stats'>
  ): OptimisticUpdateContext<SystemUser[]> {
    const tempId = `temp_${Date.now()}`;
    const tempUser: SystemUser = {
      id: tempId,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: { activeSessions: 0, organizationMemberships: 0 },
      organizations: [],
      ...newUser,
    };

    // Get current page from the most recent user query
    const userQueries = this.queryClient.getQueriesData<{users: SystemUser[]}>({
      queryKey: queryKeys.system.users.all(),
      type: 'active',
    });

    let context: OptimisticUpdateContext<SystemUser[]> | null = null;

    // Update the first page (most recent query)
    if (userQueries.length > 0) {
      const [queryKey, previousData] = userQueries[0];
      
      if (previousData) {
        this.queryClient.setQueryData(queryKey, {
          ...previousData,
          users: [tempUser, ...previousData.users],
          pagination: {
            ...previousData.pagination,
            total: previousData.pagination.total + 1,
          },
        });

        context = {
          previousData: previousData.users,
          rollback: () => this.queryClient.setQueryData(queryKey, previousData),
        };
      }
    }

    return context || {
      previousData: [],
      rollback: () => {},
    };
  }

  // Optimistically update user
  updateUserOptimistic(
    userId: string,
    updates: Partial<SystemUser>
  ): OptimisticUpdateContext<SystemUser> {
    const queryKey = queryKeys.system.users.detail(userId);
    const previousData = this.queryClient.getQueryData<SystemUser>(queryKey);

    if (previousData) {
      const updatedUser = { ...previousData, ...updates };
      this.queryClient.setQueryData(queryKey, updatedUser);

      // Also update in paginated lists
      this.updateInUserLists(userId, updatedUser);
    }

    return {
      previousData: previousData!,
      rollback: () => {
        if (previousData) {
          this.queryClient.setQueryData(queryKey, previousData);
          this.updateInUserLists(userId, previousData);
        }
      },
    };
  }

  // Optimistically ban/unban user
  banUserOptimistic(
    userId: string,
    banned: boolean
  ): OptimisticUpdateContext<SystemUser> {
    return this.updateUserOptimistic(userId, {
      // Assuming we have a banned field in the user model
      updatedAt: new Date(),
      // Add banned status to user metadata or custom field
    });
  }

  private updateInUserLists(userId: string, updatedUser: SystemUser) {
    // Update all cached user lists
    const userQueries = this.queryClient.getQueriesData<{users: SystemUser[]}>({
      queryKey: queryKeys.system.users.all(),
    });

    userQueries.forEach(([queryKey, data]) => {
      if (data) {
        const updatedData = {
          ...data,
          users: data.users.map(user => user.id === userId ? updatedUser : user),
        };
        this.queryClient.setQueryData(queryKey, updatedData);
      }
    });
  }

  /**
   * Settings Optimistic Updates
   */

  // Optimistically update system settings
  updateSettingsOptimistic<T>(
    settingsSection: string,
    updates: Partial<T>
  ): OptimisticUpdateContext<T> {
    const queryKey = queryKeys.system.settings.global();
    const previousData = this.queryClient.getQueryData<any>(queryKey);

    if (previousData) {
      const updatedSettings = {
        ...previousData,
        [settingsSection]: {
          ...previousData[settingsSection],
          ...updates,
        },
      };
      this.queryClient.setQueryData(queryKey, updatedSettings);
    }

    return {
      previousData: previousData?.[settingsSection],
      rollback: () => {
        if (previousData) {
          this.queryClient.setQueryData(queryKey, previousData);
        }
      },
    };
  }

  // Optimistically toggle feature
  toggleFeatureOptimistic(
    feature: string,
    enabled: boolean
  ): OptimisticUpdateContext<any> {
    return this.updateSettingsOptimistic('features', { [feature]: enabled });
  }

  // Optimistically toggle maintenance mode
  toggleMaintenanceModeOptimistic(
    enabled: boolean,
    message?: string
  ): OptimisticUpdateContext<any> {
    const maintenanceData = {
      enabled,
      message: message || "System is under maintenance",
      startTime: enabled ? new Date() : null,
    };

    return this.updateSettingsOptimistic('maintenance', maintenanceData);
  }

  /**
   * Batch Optimistic Updates
   */

  // Execute multiple optimistic updates with coordinated rollback
  batchOptimisticUpdates<T extends Record<string, any>>(
    operations: Array<{
      type: 'organization' | 'user' | 'settings';
      action: 'create' | 'update' | 'delete';
      id?: string;
      data: T[keyof T];
    }>
  ): { rollback: () => void } {
    const contexts: Array<{ rollback: () => void }> = [];

    operations.forEach(operation => {
      let context: { rollback: () => void } | null = null;

      switch (operation.type) {
        case 'organization':
          if (operation.action === 'create') {
            context = this.createOrganizationOptimistic(operation.data);
          } else if (operation.action === 'update' && operation.id) {
            context = this.updateOrganizationOptimistic(operation.id, operation.data);
          } else if (operation.action === 'delete' && operation.id) {
            context = this.deleteOrganizationOptimistic(operation.id);
          }
          break;
        
        case 'user':
          if (operation.action === 'create') {
            context = this.createUserOptimistic(operation.data);
          } else if (operation.action === 'update' && operation.id) {
            context = this.updateUserOptimistic(operation.id, operation.data);
          }
          break;
      }

      if (context) {
        contexts.push(context);
      }
    });

    return {
      rollback: () => {
        // Rollback in reverse order
        contexts.reverse().forEach(context => context.rollback());
      },
    };
  }

  /**
   * Smart Optimistic Updates with Conflict Resolution
   */

  // Update with automatic conflict resolution
  updateWithConflictResolution<T>(
    queryKey: readonly unknown[],
    updates: Partial<T>,
    conflictResolver?: (current: T, updates: Partial<T>, server: T) => T
  ): OptimisticUpdateContext<T> {
    const previousData = this.queryClient.getQueryData<T>(queryKey);

    if (previousData) {
      const optimisticData = { ...previousData, ...updates };
      this.queryClient.setQueryData(queryKey, optimisticData);

      return {
        previousData,
        rollback: () => {
          if (conflictResolver && previousData) {
            // Use custom conflict resolution logic
            const currentData = this.queryClient.getQueryData<T>(queryKey);
            if (currentData) {
              const resolvedData = conflictResolver(currentData, updates, previousData);
              this.queryClient.setQueryData(queryKey, resolvedData);
            }
          } else {
            this.queryClient.setQueryData(queryKey, previousData);
          }
        },
      };
    }

    return {
      previousData: previousData!,
      rollback: () => {},
    };
  }
}

/**
 * Factory function to create optimistic updates service
 */
export function createOptimisticUpdatesService(queryClient: QueryClient) {
  return new OptimisticUpdatesService(queryClient);
}

/**
 * Hook to access optimistic updates service
 */
export function useOptimisticUpdates() {
  // This would typically be provided via context in a real app
  const queryClient = new QueryClient();
  return createOptimisticUpdatesService(queryClient);
}