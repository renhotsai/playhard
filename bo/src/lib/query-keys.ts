/**
 * TanStack Query Key Factory
 * 
 * Centralized query key management for consistent caching and invalidation.
 * Following TanStack Query best practices for hierarchical key structure.
 * 
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

// Base query key factories
export const queryKeys = {
  // System-level queries (admin only)
  system: {
    all: () => ['system'] as const,
    organizations: {
      all: () => [...queryKeys.system.all(), 'organizations'] as const,
      list: (filters?: Record<string, unknown>) => 
        [...queryKeys.system.organizations.all(), filters] as const,
      detail: (id: string) => [...queryKeys.system.organizations.all(), 'detail', id] as const,
      members: (orgId: string) => 
        [...queryKeys.system.organizations.detail(orgId), 'members'] as const,
      analytics: (orgId: string, period?: string) => 
        [...queryKeys.system.organizations.detail(orgId), 'analytics', period] as const,
    },
    users: {
      all: () => [...queryKeys.system.all(), 'users'] as const,
      list: (filters?: Record<string, unknown>) => 
        [...queryKeys.system.users.all(), filters] as const,
      paginated: (page: number, limit: number, filters?: Record<string, unknown>) =>
        [...queryKeys.system.users.all(), 'paginated', { page, limit, ...filters }] as const,
      detail: (id: string) => [...queryKeys.system.users.all(), 'detail', id] as const,
      impersonate: (userId: string) => [...queryKeys.system.users.detail(userId), 'impersonate'] as const,
    },
    analytics: {
      all: () => [...queryKeys.system.all(), 'analytics'] as const,
      dashboard: (period?: string) => 
        [...queryKeys.system.analytics.all(), 'dashboard', period] as const,
      organizations: (period?: string) => 
        [...queryKeys.system.analytics.all(), 'organizations', period] as const,
      users: (period?: string) => 
        [...queryKeys.system.analytics.all(), 'users', period] as const,
      revenue: (period?: string, orgId?: string) => 
        [...queryKeys.system.analytics.all(), 'revenue', { period, orgId }] as const,
    },
    settings: {
      all: () => [...queryKeys.system.all(), 'settings'] as const,
      global: () => [...queryKeys.system.settings.all(), 'global'] as const,
      feature: (featureKey: string) => 
        [...queryKeys.system.settings.all(), 'feature', featureKey] as const,
      maintenance: () => [...queryKeys.system.settings.all(), 'maintenance'] as const,
    },
  },
  // Organizations
  organizations: {
    all: () => ['organizations'] as const,
    lists: () => [...queryKeys.organizations.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.organizations.lists(), filters] as const,
    details: () => [...queryKeys.organizations.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.organizations.details(), id] as const,
    members: (orgId: string) => 
      [...queryKeys.organizations.detail(orgId), 'members'] as const,
    stores: (orgId: string) => 
      [...queryKeys.organizations.detail(orgId), 'stores'] as const,
    // Advanced caching keys for selectors
    selector: {
      all: () => [...queryKeys.organizations.all(), 'selector'] as const,
      simple: () => [...queryKeys.organizations.selector.all(), 'simple'] as const,
      detailed: () => [...queryKeys.organizations.selector.all(), 'detailed'] as const,
      search: (query?: string) => 
        [...queryKeys.organizations.selector.all(), 'search', query] as const,
      prefetch: () => [...queryKeys.organizations.selector.all(), 'prefetch'] as const,
    },
  },

  // Teams
  teams: {
    all: () => ['teams'] as const,
    byOrganization: (orgId: string) => 
      [...queryKeys.teams.all(), 'organization', orgId] as const,
    detail: (teamId: string) => [...queryKeys.teams.all(), 'detail', teamId] as const,
  },

  // Users
  users: {
    all: () => ['users'] as const,
    lists: () => [...queryKeys.users.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.users.lists(), { ...filters }] as const,
    details: () => [...queryKeys.users.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    profile: () => [...queryKeys.users.all(), 'profile'] as const,
    // Add pagination support
    paginated: (page: number, limit: number, filters?: Record<string, unknown>) =>
      [...queryKeys.users.lists(), 'paginated', { page, limit, ...filters }] as const,
  },

  // Permissions - Fresh Checkbox Permission System
  permissions: {
    all: () => ['permissions'] as const,
    // Permission Matrix queries
    matrices: () => [...queryKeys.permissions.all(), 'matrix'] as const,
    matrix: (subjectType: string, subjectId: string, organizationId?: string) =>
      [...queryKeys.permissions.matrices(), subjectType, subjectId, organizationId] as const,
    // Permission Check queries
    checks: () => [...queryKeys.permissions.all(), 'check'] as const,
    check: (request: Record<string, any>) => 
      [...queryKeys.permissions.checks(), request] as const,
    batchCheck: (requests: Record<string, any>[]) =>
      [...queryKeys.permissions.checks(), 'batch', requests] as const,
    // Organization Limits queries
    organizationLimits: () => [...queryKeys.permissions.all(), 'organization-limits'] as const,
    organizationLimit: (organizationId: string) =>
      [...queryKeys.permissions.organizationLimits(), organizationId] as const,
    // Audit Trail queries
    audits: () => [...queryKeys.permissions.all(), 'audit'] as const,
    audit: (organizationId?: string, subjectId?: string) =>
      [...queryKeys.permissions.audits(), { organizationId, subjectId }] as const,
    summary: (organizationId: string) =>
      [...queryKeys.permissions.all(), 'summary', organizationId] as const,
  },
} as const;

/**
 * Query key utilities for cache invalidation patterns
 */
export const queryKeyUtils = {
  // System-level invalidation patterns
  invalidateAllSystemData: () => queryKeys.system.all(),
  
  invalidateSystemOrganizations: () => queryKeys.system.organizations.all(),
  
  invalidateSystemUsers: () => queryKeys.system.users.all(),
  
  invalidateSystemAnalytics: () => queryKeys.system.analytics.all(),
  
  invalidateSystemSettings: () => queryKeys.system.settings.all(),
  
  // Cross-brand invalidation when system admin makes changes
  invalidateSystemAndOrganizationData: (orgId: string) => [
    queryKeys.system.organizations.detail(orgId),
    queryKeys.system.organizations.members(orgId),
    queryKeys.organizations.detail(orgId),
    queryKeys.organizations.members(orgId),
  ],
  
  // Invalidate system and user-specific caches when impersonating
  invalidateForUserImpersonation: (userId: string) => [
    queryKeys.system.users.detail(userId),
    queryKeys.system.users.impersonate(userId),
    queryKeys.users.detail(userId),
    queryKeys.users.profile(),
  ],
  
  // Invalidate analytics across system and organization levels
  invalidateAnalyticsEverywhere: (orgId?: string) => [
    queryKeys.system.analytics.all(),
    ...(orgId ? [queryKeys.organizations.detail(orgId)] : []),
  ],
  // Invalidate all users
  invalidateAllUsers: () => queryKeys.users.all(),
  
  // Invalidate all organizations
  invalidateAllOrganizations: () => queryKeys.organizations.all(),
  
  // Invalidate organization and its members
  invalidateOrganizationAndMembers: (orgId: string) => [
    queryKeys.organizations.detail(orgId),
    queryKeys.organizations.members(orgId),
  ],
  
  // Invalidate organization, members, and stores
  invalidateOrganizationComplete: (orgId: string) => [
    queryKeys.organizations.detail(orgId),
    queryKeys.organizations.members(orgId),
    queryKeys.organizations.stores(orgId),
  ],
  
  // Invalidate all permission queries
  invalidateAllPermissions: () => queryKeys.permissions.all(),
  
  // Invalidate permission matrix for specific subject
  invalidatePermissionMatrix: (subjectType: string, subjectId: string, organizationId?: string) => [
    queryKeys.permissions.matrix(subjectType, subjectId, organizationId),
    queryKeys.permissions.checks(), // Also invalidate checks as permissions may have changed
  ],
  
  // Invalidate organization limits and related permission queries
  invalidateOrganizationLimitsAndPermissions: (organizationId: string) => [
    queryKeys.permissions.organizationLimit(organizationId),
    queryKeys.permissions.summary(organizationId),
    queryKeys.permissions.audits(), // Invalidate audit queries to refresh recent changes
  ],
} as const;