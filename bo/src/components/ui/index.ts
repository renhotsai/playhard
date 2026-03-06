// Centralized exports for all UI state components
// This makes it easy to import consistent loading, error, and empty states

// Loading components - use these for consistent loading states across the app
export { 
  LoadingState,          // Main loading component with flexible options
  LoadingSpinner,        // Just the spinner icon for inline use
  LoadingOverlay,        // Full screen loading overlay
  LoadingInline,         // Small inline loading for buttons and form elements
  LoadingCard,           // Medium loading for card/section content
  LoadingPage            // Large loading for main page content
} from './loading-state';

// Error components - use these for consistent error handling
export { 
  ErrorState,              // Main configurable error component
  NetworkError,            // Pre-configured network error
  PermissionError,         // Pre-configured permission error  
  ValidationError,         // Pre-configured validation error
  NotFoundError,           // Pre-configured not found error
  useErrorActions,         // Hook for creating common error actions
  type ErrorType           // TypeScript type for error types
} from './error-state';

// Empty state components - use these for consistent empty states
export { EmptyState } from './empty-state';

// Skeleton components - use these for content placeholder loading
export { Skeleton, SkeletonPatterns } from './skeleton';

// Role selection components - use these for role-based forms
export { RoleSelect, useRoleInfo } from './role-select';

/* 
Usage Examples:

// For page-level loading
import { LoadingPage } from '@/components/ui';
return <LoadingPage message="Loading dashboard..." />;

// For card/section loading  
import { LoadingCard } from '@/components/ui';
return <LoadingCard message="Loading users..." />;

// For button loading states
import { LoadingSpinner } from '@/components/ui';
<Button disabled={isPending}>
  {isPending && <LoadingSpinner size="sm" className="mr-2" />}
  {isPending ? 'Creating...' : 'Create User'}
</Button>

// For full screen overlays (like authentication checks)
import { LoadingOverlay } from '@/components/ui';
if (checkingAuth) return <LoadingOverlay message="Checking permissions..." />;

// For table/list empty states
import { EmptyState } from '@/components/ui';
<EmptyState 
  icon={Users}
  title="No users found"
  description="Get started by creating your first user."
  action={{
    label: "Create User",
    onClick: () => navigate('/users/create')
  }}
/>

// For error states with retry
import { ErrorState, NetworkError, PermissionError, useErrorActions } from '@/components/ui';

// Simple network error with retry
<NetworkError onRetry={refetch} />

// Permission error with custom actions
const errorActions = useErrorActions();
<PermissionError
  action={{
    label: "Contact Support",
    onClick: () => window.open('mailto:support@example.com'),
    icon: Mail
  }}
  secondaryAction={errorActions.goBack(() => router.back())}
/>

// Custom error for role selection
<ErrorState
  type="custom"
  icon={AlertTriangle}
  title="Role Assignment Failed"
  message="Unable to assign the selected role. Please verify permissions."
  action={{
    label: "Retry Assignment",
    onClick: handleRetry,
    loading: isRetrying
  }}
  errorCode="ROLE_ASSIGN_001"
/>
*/