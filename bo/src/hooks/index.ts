/**
 * TanStack Query Hooks for Cross-Brand Data Management
 * 
 * Comprehensive hooks for system admin and organization-scoped operations
 * with Better Auth integration and role-based access control.
 */

// System Admin Hooks
export {
  useSystemOrganizations,
  useSystemOrganization,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  type SystemOrganization,
  type SystemOrganizationsResponse,
  type CreateOrganizationRequest,
} from "./use-system-organizations";

export {
  useSystemUsers,
  useSystemUser,
  useCreateSystemUser,
  useUpdateSystemUser,
  useBanUser,
  useDeleteUser,
  type SystemUser,
  type SystemUsersResponse,
  type CreateUserRequest,
  type UserFilters,
} from "./use-system-users";

export {
  useSystemAnalytics,
  useSystemOrganizationAnalytics,
  useSystemUserAnalytics,
  useSystemRevenueAnalytics,
  useExportAnalytics,
  useRefreshAnalytics,
  useRealTimeAnalytics,
  type SystemAnalytics,
  type AnalyticsPeriod,
} from "./use-system-analytics";

export {
  useSystemSettings,
  useFeatureSettings,
  useMaintenanceSettings,
  useUpdateSystemSettings,
  useToggleFeature,
  useToggleMaintenanceMode,
  useBackupSettings,
  useRestoreSettings,
  type SystemSettings,
  type UpdateSettingsRequest,
} from "./use-system-settings";

// User Impersonation Hooks
export {
  useImpersonateUser,
  useStopImpersonation,
  useImpersonationStatus,
  useImpersonationHistory,
  useCanImpersonate,
  useImpersonationUI,
  useLogImpersonationActivity,
  type ImpersonationSession,
  type ImpersonationRequest,
} from "./use-impersonation";

// Role-Based Query Hooks
export {
  useSystemAdminQuery,
  useRoleBasedQuery,
  useRoleBasedOrganizations,
  useRoleBasedUsers,
  useRoleBasedAnalytics,
  useDataAccess,
  useRoleBasedPrefetch,
  useOrganizationScopedQuery,
  useUserPermissions,
} from "./use-role-based-queries";

// Organization Selector Hooks
export {
  useOrganizationsSelector,
  type OrganizationOption,
  type OrganizationsResponse,
} from "./use-organizations-selector";

// Utility Hooks (existing)
export { useIsMobile } from "./use-mobile";

/**
 * Common Query Patterns
 * 
 * These are the most commonly used patterns for cross-brand data management:
 * 
 * 1. **System Admin Data Access**:
 *    - useSystemOrganizations() - All organizations
 *    - useSystemUsers() - All users with pagination
 *    - useSystemAnalytics() - Cross-brand analytics
 *    - useSystemSettings() - Global settings
 * 
 * 2. **Organization-Scoped Access**:
 *    - useRoleBasedOrganizations() - Auto-switches based on role
 *    - useRoleBasedUsers() - Role-based user lists
 *    - useRoleBasedAnalytics() - Role-based analytics
 * 
 * 3. **User Impersonation**:
 *    - useImpersonateUser() - Start impersonation
 *    - useImpersonationUI() - UI state and controls
 *    - useStopImpersonation() - End impersonation
 * 
 * 4. **Permission-Based Queries**:
 *    - useSystemAdminQuery() - Conditional execution for admins
 *    - useDataAccess() - Permission checks
 *    - useCanImpersonate() - Impersonation permissions
 */

/**
 * Cache Strategy Overview
 * 
 * - **System Queries**: Longer stale time (5-10 minutes)
 * - **User Queries**: Shorter stale time (2-5 minutes) 
 * - **Analytics**: Longest stale time (10-15 minutes) with auto-refresh
 * - **Settings**: Moderate stale time (5-10 minutes)
 * - **Real-time Data**: No stale time, frequent refetch
 * 
 * Cache invalidation is handled automatically through the CacheInvalidationService
 * when mutations complete successfully.
 */

/**
 * Error Handling Patterns
 * 
 * All hooks include:
 * - Automatic retry logic (except for permission errors)
 * - Role-based conditional execution
 * - Optimistic updates for mutations
 * - Proper error boundaries integration
 */