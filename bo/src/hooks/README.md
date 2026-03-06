# Cross-Brand Data Management with TanStack Query

This implementation provides a comprehensive TanStack Query architecture for cross-brand data management in your script-based gaming platform (劇本殺) backoffice system.

## Overview

The system implements a dual-role architecture:
- **System Admins**: Access all organizations and users across brands
- **Organization Members**: Access only their organization's data

## Key Features

### 🔐 Role-Based Access Control
- Automatic query switching based on user role
- Better Auth integration with system admin detection
- Organization-scoped data filtering

### 🚀 Optimistic Updates
- Immediate UI updates for admin operations
- Automatic rollback on errors
- Smart conflict resolution

### 💾 Smart Caching
- Role-based cache invalidation
- Cross-brand data consistency
- Efficient cache management

### 👤 User Impersonation
- System admin can impersonate any user
- Secure session management
- Activity logging

## Quick Start

### System Admin Data Access

```tsx
import { useSystemOrganizations, useSystemUsers } from '@/hooks';

function SystemDashboard() {
  const { data: orgsData, isLoading } = useSystemOrganizations();
  const { data: usersData } = useSystemUsers({ page: 1, limit: 20 });
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>All Organizations ({orgsData?.total})</h2>
      {orgsData?.organizations.map(org => (
        <div key={org.id}>{org.name} - {org.stats.totalMembers} members</div>
      ))}
    </div>
  );
}
```

### Role-Based Queries

```tsx
import { useRoleBasedOrganizations, useDataAccess } from '@/hooks';

function OrganizationsList() {
  // Automatically uses system API for admins, organization API for members
  const { data, isLoading } = useRoleBasedOrganizations();
  const { canViewAllOrganizations, isSystemAdmin } = useDataAccess();
  
  return (
    <div>
      {isSystemAdmin && <p>System Admin View - All Organizations</p>}
      {data?.organizations?.map(org => (
        <OrgCard key={org.id} organization={org} />
      ))}
    </div>
  );
}
```

### User Impersonation

```tsx
import { useImpersonateUser, useImpersonationUI } from '@/hooks';

function UserManagement() {
  const impersonateUser = useImpersonateUser();
  const { isImpersonating, impersonatedUser, stopImpersonation } = useImpersonationUI();
  
  const handleImpersonate = (userId: string) => {
    impersonateUser.mutate({
      userId,
      reason: "Customer support assistance",
      duration: 60 // minutes
    });
  };
  
  if (isImpersonating) {
    return (
      <div className="bg-orange-100 p-4">
        <p>Impersonating: {impersonatedUser?.name}</p>
        <button onClick={() => stopImpersonation()}>
          Stop Impersonation
        </button>
      </div>
    );
  }
  
  return (
    <UserTable onImpersonate={handleImpersonate} />
  );
}
```

### Analytics Dashboard

```tsx
import { useSystemAnalytics, useRoleBasedAnalytics } from '@/hooks';

function AnalyticsDashboard() {
  const { data: systemData } = useSystemAnalytics("30d");
  const { data: orgData } = useRoleBasedAnalytics("30d", "org_123");
  
  return (
    <div>
      {systemData && (
        <div>
          <h3>System Overview</h3>
          <p>Total Organizations: {systemData.dashboard.totalOrganizations}</p>
          <p>Total Users: {systemData.dashboard.totalUsers}</p>
          <p>Revenue: ${systemData.dashboard.totalRevenue}</p>
        </div>
      )}
    </div>
  );
}
```

### System Settings Management

```tsx
import { useSystemSettings, useToggleFeature } from '@/hooks';

function SystemSettings() {
  const { data: settings } = useSystemSettings();
  const toggleFeature = useToggleFeature();
  
  const handleToggleFeature = (feature: string, enabled: boolean) => {
    toggleFeature.mutate({ feature, enabled });
  };
  
  return (
    <div>
      <h3>Feature Flags</h3>
      {Object.entries(settings?.features || {}).map(([feature, enabled]) => (
        <div key={feature}>
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleToggleFeature(feature, e.target.checked)}
            />
            {feature}
          </label>
        </div>
      ))}
    </div>
  );
}
```

## Advanced Usage

### Custom Cache Invalidation

```tsx
import { useCacheInvalidation } from '@/lib/cache-invalidation';

function useCustomMutation() {
  const cacheService = useCacheInvalidation();
  
  return useMutation({
    mutationFn: async (data) => {
      // Your mutation logic
      return fetch('/api/custom-endpoint', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result) => {
      // Custom cache invalidation
      cacheService.onOrganizationUpdated(result.organizationId);
    },
  });
}
```

### Optimistic Updates

```tsx
import { useOptimisticUpdates } from '@/lib/optimistic-updates';

function useOptimisticOrganizationUpdate() {
  const optimisticService = useOptimisticUpdates();
  
  return useMutation({
    mutationFn: updateOrganizationAPI,
    onMutate: (variables) => {
      // Apply optimistic update
      const context = optimisticService.updateOrganizationOptimistic(
        variables.id,
        variables.updates
      );
      return context;
    },
    onError: (error, variables, context) => {
      // Rollback on error
      context?.rollback();
    },
  });
}
```

### Role-Based Data Prefetching

```tsx
import { useRoleBasedPrefetch } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';

function useSmartPrefetch() {
  const queryClient = useQueryClient();
  const { prefetchSystemData, prefetchOrganizationData } = useRoleBasedPrefetch();
  
  const prefetchDashboardData = () => {
    if (prefetchSystemData) {
      // System admin - prefetch system-wide data
      queryClient.prefetchQuery({
        queryKey: prefetchSystemData.organizations(),
        queryFn: () => fetch('/api/system/organizations').then(r => r.json()),
      });
    } else {
      // Regular user - prefetch organization data
      queryClient.prefetchQuery({
        queryKey: prefetchOrganizationData.organizations(),
        queryFn: () => fetch('/api/organizations').then(r => r.json()),
      });
    }
  };
  
  return { prefetchDashboardData };
}
```

## Query Key Structure

```typescript
// System-level queries (admin only)
queryKeys.system.organizations.all()          // ['system', 'organizations']
queryKeys.system.organizations.list(filters)  // ['system', 'organizations', filters]
queryKeys.system.users.paginated(1, 20)      // ['system', 'users', 'paginated', {page: 1, limit: 20}]
queryKeys.system.analytics.dashboard("30d")   // ['system', 'analytics', 'dashboard', '30d']

// Organization-scoped queries
queryKeys.organizations.all()                 // ['organizations']
queryKeys.organizations.detail(orgId)         // ['organizations', 'detail', orgId]
queryKeys.users.list()                        // ['users', 'list']
```

## Cache Invalidation Patterns

### Automatic Invalidation
```typescript
// When system admin creates organization
- Invalidates: system.organizations.all()
- Prefetches: system.organizations.detail(newOrgId)
- Invalidates: system.analytics.organizations()

// When system admin updates user
- Invalidates: system.users.detail(userId) and system.users.all()
- Invalidates: users.detail(userId) (for regular users)  
- Invalidates: organizations.members(orgId) (if user is in org)
```

### Manual Invalidation
```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryKeyUtils } from '@/lib/query-keys';

const queryClient = useQueryClient();

// Invalidate all system data
queryClient.invalidateQueries({
  queryKey: queryKeyUtils.invalidateAllSystemData()
});

// Invalidate organization and related data
queryKeyUtils.invalidateSystemAndOrganizationData(orgId).forEach(key => {
  queryClient.invalidateQueries({ queryKey: key });
});
```

## Error Handling

### Built-in Error Handling
```typescript
// All hooks include automatic error handling
const { data, error, isError, refetch } = useSystemOrganizations();

if (isError) {
  if (error.message.includes('privileges')) {
    // Permission error - don't retry
    return <AccessDenied />;
  } else {
    // Other errors - show retry option
    return <ErrorState onRetry={refetch} />;
  }
}
```

### Custom Error Handling
```typescript
import { useSystemUsers } from '@/hooks';

function UsersPage() {
  const { data, error, isError } = useSystemUsers({
    retry: (failureCount, error) => {
      // Custom retry logic
      return failureCount < 2 && !error.message.includes('403');
    },
    onError: (error) => {
      // Custom error handling
      console.error('Users query failed:', error);
      // Could send to error reporting service
    }
  });
}
```

## Performance Optimizations

### Smart Stale Time Configuration
```typescript
// Analytics data - longer stale time
useSystemAnalytics("30d", {
  staleTime: 10 * 60 * 1000,  // 10 minutes
  refetchInterval: 5 * 60 * 1000  // Auto-refresh every 5 minutes
});

// User data - shorter stale time  
useSystemUsers(filters, {
  staleTime: 2 * 60 * 1000,   // 2 minutes
  keepPreviousData: true      // Smooth pagination
});
```

### Background Refetching
```typescript
// Real-time analytics with background updates
const { data } = useRealTimeAnalytics("24h", true, {
  refetchInterval: 30 * 1000,           // Every 30 seconds
  refetchIntervalInBackground: true,     // Continue in background
});
```

## Integration with Better Auth

### Session-Based Conditional Queries
```typescript
import { useSession } from '@/lib/auth-client';
import { isSystemAdmin } from '@/lib/permissions';

// All hooks automatically integrate with Better Auth
function Dashboard() {
  const { data: session } = useSession();
  const isAdmin = isSystemAdmin(session?.user?.role);
  
  // Queries automatically enabled/disabled based on session
  const { data } = useSystemOrganizations(); // Only runs if isAdmin
  
  if (!session) return <LoginForm />;
  if (!isAdmin) return <OrganizationDashboard />;
  return <SystemDashboard />;
}
```

## Best Practices

### 1. Use Role-Based Hooks
```typescript
// Good - automatically switches based on role
const { data } = useRoleBasedOrganizations();

// Avoid - manual role checking
const { data: session } = useSession();
const isAdmin = isSystemAdmin(session?.user?.role);
const { data } = isAdmin ? useSystemOrganizations() : useOrganizations();
```

### 2. Leverage Optimistic Updates
```typescript
// Good - immediate UI feedback
const mutation = useCreateOrganization(); // Built-in optimistic updates

// Less optimal - wait for server response
const mutation = useMutation({ 
  mutationFn: createOrgAPI,
  onSuccess: () => queryClient.invalidateQueries()
});
```

### 3. Use Proper Error Boundaries
```typescript
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <SystemDashboard />
    </ErrorBoundary>
  );
}
```

### 4. Monitor Performance
```typescript
// Development only - enable React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <MyApp />
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </>
  );
}
```

This comprehensive implementation provides a robust foundation for cross-brand data management while maintaining clean separation of concerns and optimal performance.