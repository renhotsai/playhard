'use client';

import { useSession } from '@/lib/auth-client';
import { isSystemAdmin } from '@/lib/permissions';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SystemAdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showError?: boolean;
}

/**
 * SystemAdminGuard Component
 * 
 * Protects routes and components that require system administrator privileges.
 * Uses Better Auth session management and follows the project's permission patterns.
 * 
 * Features:
 * - Session-based authentication validation
 * - System admin role verification using isSystemAdmin() utility
 * - Automatic redirection for unauthorized users
 * - Loading and error states
 * - Customizable fallback content
 * 
 * Usage:
 * ```tsx
 * <SystemAdminGuard>
 *   <AdminOnlyContent />
 * </SystemAdminGuard>
 * ```
 */
export function SystemAdminGuard({
  children,
  fallback,
  redirectTo = '/dashboard',
  showError = true
}: SystemAdminGuardProps) {
  const { data: session, isPending, error } = useSession();
  const router = useRouter();

  // Handle redirect for unauthorized users
  useEffect(() => {
    if (!isPending && session && !isSystemAdmin(session.user?.role)) {
      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [session, isPending, router, redirectTo]);

  // Loading state - show while session is being fetched
  if (isPending) {
    return (
      <LoadingState 
        message="Verifying administrator privileges..." 
        className="min-h-[400px]" 
      />
    );
  }

  // Authentication error
  if (error) {
    return (
      <ErrorState
        title="Authentication Error"
        message="Failed to verify your session. Please try logging in again."
        actionLabel="Go to Login"
        onAction={() => router.push('/login')}
      />
    );
  }

  // No session - redirect will be handled by middleware, but show error for safety
  if (!session?.user) {
    return (
      <ErrorState
        title="Authentication Required"
        message="Please log in to access this page."
        actionLabel="Go to Login"
        onAction={() => router.push('/login')}
      />
    );
  }

  // Not a system admin
  if (!isSystemAdmin(session.user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <ErrorState
          title="Access Denied"
          message="This area is restricted to system administrators only."
          actionLabel="Return to Dashboard"
          onAction={() => router.push('/dashboard')}
        />
      );
    }

    // Silent fallback - just don't render children
    return null;
  }

  // User is authenticated and is a system admin
  return <>{children}</>;
}

/**
 * Hook for checking system admin status
 * Useful for conditional rendering without full component guard
 */
export function useSystemAdminCheck() {
  const { data: session, isPending, error } = useSession();
  
  return {
    isSystemAdmin: session?.user ? isSystemAdmin(session.user.role) : false,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    user: session?.user,
    error
  };
}