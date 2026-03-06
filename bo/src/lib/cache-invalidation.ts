"use client";

import { QueryClient } from "@tanstack/react-query";
import { queryKeys, queryKeyUtils } from "./query-keys";

/**
 * Cache Invalidation Service for Cross-Brand Data Management
 * 
 * Manages complex cache invalidation patterns between system-level and 
 * organization-scoped data to ensure data consistency across different user roles.
 */

export class CacheInvalidationService {
  constructor(private queryClient: QueryClient) {}

  /**
   * System Admin Actions - Invalidate both system and affected organization caches
   */

  // When system admin creates an organization
  async onOrganizationCreated(organizationId: string) {
    await Promise.all([
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.organizations.all(),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.analytics.organizations(),
      }),
      // Preload the new organization's data
      this.queryClient.prefetchQuery({
        queryKey: queryKeys.system.organizations.detail(organizationId),
      }),
    ]);
  }

  // When system admin updates an organization
  async onOrganizationUpdated(organizationId: string) {
    await Promise.all([
      // System-level caches
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.organizations.detail(organizationId),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.organizations.all(),
      }),
      // Organization-level caches (for organization members)
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.detail(organizationId),
      }),
      // Analytics that might be affected
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.organizations.analytics(organizationId),
      }),
    ]);
  }

  // When system admin deletes an organization
  async onOrganizationDeleted(organizationId: string) {
    // Remove all related queries from cache
    this.queryClient.removeQueries({
      queryKey: queryKeys.system.organizations.detail(organizationId),
    });
    this.queryClient.removeQueries({
      queryKey: queryKeys.organizations.detail(organizationId),
    });

    // Invalidate lists and analytics
    await Promise.all([
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.organizations.all(),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.analytics.all(),
      }),
    ]);
  }

  // When system admin creates a user
  async onUserCreated(userId: string, organizationIds: string[] = []) {
    await Promise.all([
      // System-level user caches
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.users.all(),
      }),
      // Organization member caches if user was added to organizations
      ...organizationIds.map((orgId) =>
        this.queryClient.invalidateQueries({
          queryKey: queryKeys.system.organizations.members(orgId),
        })
      ),
      // Analytics
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.analytics.users(),
      }),
    ]);
  }

  // When system admin updates a user
  async onUserUpdated(userId: string, organizationIds: string[] = []) {
    await Promise.all([
      // System-level user caches
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.users.detail(userId),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.users.all(),
      }),
      // Regular user caches
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(userId),
      }),
      // Organization member caches
      ...organizationIds.map((orgId) =>
        Promise.all([
          this.queryClient.invalidateQueries({
            queryKey: queryKeys.system.organizations.members(orgId),
          }),
          this.queryClient.invalidateQueries({
            queryKey: queryKeys.organizations.members(orgId),
          }),
        ])
      ),
    ]);
  }

  // When system admin bans/unbans a user
  async onUserBanned(userId: string, organizationIds: string[] = []) {
    // Same invalidation pattern as user update, but also clear sessions
    await this.onUserUpdated(userId, organizationIds);

    // Additional session-related invalidations
    this.queryClient.removeQueries({
      predicate: (query) => {
        // Remove any user-specific session or auth queries
        return query.queryKey.includes(userId) || 
               (query.queryKey.includes('session') && query.queryKey.includes(userId));
      },
    });
  }

  /**
   * Impersonation Cache Management
   */

  // When system admin starts impersonating a user
  async onImpersonationStarted(originalUserId: string, targetUserId: string) {
    // Clear current session caches
    this.queryClient.removeQueries({
      queryKey: ['auth', 'session'],
    });

    // Clear user-specific data to refetch as impersonated user
    this.queryClient.removeQueries({
      queryKey: queryKeys.users.profile(),
    });

    // Track impersonation state
    this.queryClient.setQueryData(
      ["impersonation", "active"],
      { originalUserId, targetUserId, startedAt: new Date() }
    );
  }

  // When system admin stops impersonation
  async onImpersonationStopped(originalUserId: string, targetUserId: string) {
    // Clear all cached data as we're switching back to original user
    this.queryClient.clear();

    // Remove impersonation tracking
    this.queryClient.removeQueries({
      queryKey: ["impersonation", "active"],
    });

    // Force refetch of original user session
    this.queryClient.invalidateQueries({
      queryKey: ['auth', 'session'],
    });
  }

  /**
   * Role-Based Cache Invalidation
   */

  // When user's role changes (system or organization level)
  async onUserRoleChanged(
    userId: string, 
    oldRole: string | null, 
    newRole: string | null,
    organizationId?: string
  ) {
    // If system role changed, clear everything for that user
    if (oldRole !== newRole && (oldRole === 'admin' || newRole === 'admin')) {
      this.queryClient.removeQueries({
        predicate: (query) => {
          // Remove any query that might have different data based on admin role
          return query.queryKey.includes(userId) || 
                 query.queryKey.includes('system');
        },
      });
    }

    // Standard user update invalidation
    await this.onUserUpdated(userId, organizationId ? [organizationId] : []);
  }

  /**
   * Organization Membership Cache Management
   */

  // When user joins an organization
  async onUserJoinedOrganization(userId: string, organizationId: string) {
    await Promise.all([
      // System views
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.organizations.members(organizationId),
      }),
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.users.detail(userId),
      }),
      // Organization views
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.members(organizationId),
      }),
      // User's organization list
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.all(),
      }),
    ]);
  }

  // When user leaves an organization
  async onUserLeftOrganization(userId: string, organizationId: string) {
    // Same invalidation as joining
    await this.onUserJoinedOrganization(userId, organizationId);

    // Also remove organization-specific data for the user
    this.queryClient.removeQueries({
      predicate: (query) => {
        return query.queryKey.includes(userId) && 
               query.queryKey.includes(organizationId);
      },
    });
  }

  /**
   * Settings and Configuration Cache Management
   */

  // When system settings change
  async onSystemSettingsChanged(settingSection?: string) {
    if (settingSection) {
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.settings.feature(settingSection),
      });
    }

    // Always invalidate global settings
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.system.settings.global(),
    });

    // If maintenance mode or critical settings changed, clear everything
    if (settingSection === 'maintenance' || settingSection === 'security') {
      this.queryClient.clear();
    }
  }

  /**
   * Analytics Cache Management with Smart Invalidation
   */

  // When business data changes that affects analytics
  async onBusinessDataChanged(
    organizationId?: string, 
    dataType?: 'revenue' | 'users' | 'activity'
  ) {
    const analyticsQueries = [];

    // System-level analytics
    analyticsQueries.push(
      this.queryClient.invalidateQueries({
        queryKey: queryKeys.system.analytics.all(),
      })
    );

    // Organization-specific analytics if applicable
    if (organizationId) {
      analyticsQueries.push(
        this.queryClient.invalidateQueries({
          queryKey: queryKeys.system.organizations.analytics(organizationId),
        })
      );
    }

    // Data-type specific invalidation
    if (dataType === 'revenue') {
      analyticsQueries.push(
        this.queryClient.invalidateQueries({
          queryKey: [...queryKeys.system.analytics.all(), 'revenue'],
        })
      );
    } else if (dataType === 'users') {
      analyticsQueries.push(
        this.queryClient.invalidateQueries({
          queryKey: queryKeys.system.analytics.users(),
        })
      );
    }

    await Promise.all(analyticsQueries);
  }

  /**
   * Batch Invalidation for Complex Operations
   */

  // When multiple operations happen in a transaction
  async batchInvalidate(operations: Array<{
    type: 'organization' | 'user' | 'settings' | 'analytics';
    action: 'create' | 'update' | 'delete';
    id: string;
    relatedIds?: string[];
  }>) {
    const invalidationPromises = [];

    for (const operation of operations) {
      switch (operation.type) {
        case 'organization':
          if (operation.action === 'create') {
            invalidationPromises.push(this.onOrganizationCreated(operation.id));
          } else if (operation.action === 'update') {
            invalidationPromises.push(this.onOrganizationUpdated(operation.id));
          } else if (operation.action === 'delete') {
            invalidationPromises.push(this.onOrganizationDeleted(operation.id));
          }
          break;
        
        case 'user':
          if (operation.action === 'create') {
            invalidationPromises.push(
              this.onUserCreated(operation.id, operation.relatedIds || [])
            );
          } else if (operation.action === 'update') {
            invalidationPromises.push(
              this.onUserUpdated(operation.id, operation.relatedIds || [])
            );
          }
          break;
      }
    }

    await Promise.all(invalidationPromises);
  }

  /**
   * Emergency Cache Clear with Selective Retention
   */
  
  // Clear all caches except critical session data
  async emergencyClear(retainSession = true) {
    if (retainSession) {
      // Store session data before clearing
      const sessionData = this.queryClient.getQueryData(['auth', 'session']);
      const impersonationData = this.queryClient.getQueryData(['impersonation', 'active']);
      
      this.queryClient.clear();
      
      // Restore critical data
      if (sessionData) {
        this.queryClient.setQueryData(['auth', 'session'], sessionData);
      }
      if (impersonationData) {
        this.queryClient.setQueryData(['impersonation', 'active'], impersonationData);
      }
    } else {
      this.queryClient.clear();
    }
  }
}

/**
 * Factory function to create cache invalidation service
 */
export function createCacheInvalidationService(queryClient: QueryClient) {
  return new CacheInvalidationService(queryClient);
}

/**
 * Hook to access cache invalidation service
 */
export function useCacheInvalidation() {
  // This would typically be provided via context in a real app
  // For now, we'll assume the service is available globally
  const queryClient = new QueryClient();
  return createCacheInvalidationService(queryClient);
}