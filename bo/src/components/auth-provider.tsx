"use client";

import { ReactNode } from 'react';
import { SessionInitializer } from './session-initializer';

/**
 * Better Auth Session Provider
 * 
 * This component provides Better Auth session management for the application.
 * It includes session initialization and loading state handling.
 * 
 * Features:
 * - Session initialization on app load
 * - Client-server session synchronization  
 * - Proper loading states during session fetch
 * - Error handling for session failures
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionInitializer>
      {children}
    </SessionInitializer>
  );
}