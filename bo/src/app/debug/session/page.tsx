import { SessionDebug } from '@/components/session-debug';

/**
 * Session Debug Page
 * 
 * This page allows you to test and debug Better Auth session management.
 * Visit /debug/session to see session information and verify proper setup.
 */
export default function SessionDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Session Debug</h1>
        <p className="text-gray-600">
          Debug and test Better Auth session management. This page shows current session state,
          user information, and demonstrates correct usage patterns.
        </p>
      </div>
      <SessionDebug />
    </div>
  );
}