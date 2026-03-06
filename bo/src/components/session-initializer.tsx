"use client";

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

/**
 * Session Initializer Component
 * 
 * This component handles Better Auth session initialization and loading states.
 * It ensures the session is properly loaded before rendering children components.
 */
export function SessionInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    // Initialize session when component mounts
    const initializeSession = async () => {
      try {
        // Force a session refresh to sync client-server state
        await authClient.getSession();
        setIsInitialized(true);
      } catch (error) {
        console.warn('Session initialization failed:', error);
        // Still allow app to load even if session fails
        setIsInitialized(true);
      }
    };

    if (!isPending && !isInitialized) {
      initializeSession();
    } else if (isPending === false) {
      setIsInitialized(true);
    }
  }, [isPending, isInitialized]);

  // Show loading state while session is being initialized
  if (!isInitialized || isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}