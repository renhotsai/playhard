"use client";

import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * Session Debug Component
 * 
 * This component demonstrates correct Better Auth session usage patterns
 * and provides debugging information for session management.
 */
export function SessionDebug() {
  const { data: session, isPending, error } = authClient.useSession();

  const handleRefreshSession = async () => {
    try {
      await authClient.getSession();
      window.location.reload();
    } catch (err) {
      console.error('Session refresh failed:', err);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Better Auth Session Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading State */}
        {isPending && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            <span>Loading session...</span>
            <Badge variant="secondary">isPending: true</Badge>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800">Session Error</h4>
            <p className="text-red-700">{error.message}</p>
          </div>
        )}

        {/* Session Data */}
        {!isPending && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Session Status:</span>
              {session ? (
                <Badge variant="default" className="bg-green-600">Authenticated</Badge>
              ) : (
                <Badge variant="destructive">Not Authenticated</Badge>
              )}
            </div>

            {session ? (
              <div className="space-y-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">User Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">ID:</span> {session.user.id}
                    </div>
                    <div>
                      <span className="font-medium">Name:</span> {session.user.name || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {session.user.email}
                    </div>
                    <div>
                      <span className="font-medium">Role:</span> 
                      <Badge variant="outline" className="ml-1">{session.user.role}</Badge>
                    </div>
                    <div>
                      <span className="font-medium">Username:</span> {session.user.username || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Verified:</span> {session.user.emailVerified ? '✓' : '✗'}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Session Information</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Session ID:</span> {session.id}
                    </div>
                    <div>
                      <span className="font-medium">Expires:</span> {new Date(session.expiresAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">IP Address:</span> {session.ipAddress || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">User Agent:</span> {session.userAgent?.slice(0, 50)}...
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  No active session found. User needs to log in.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Debug Actions */}
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button onClick={handleRefreshSession} variant="outline" size="sm">
              Refresh Session
            </Button>
            <Button 
              onClick={() => console.log('Session:', session)} 
              variant="outline" 
              size="sm"
            >
              Log to Console
            </Button>
          </div>
        </div>

        {/* Usage Example */}
        <div className="bg-blue-50 p-4 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Correct Usage Pattern</h4>
          <pre className="text-xs text-blue-700 bg-white p-2 rounded border overflow-x-auto">
{`// In your React component:
const { data: session, isPending } = authClient.useSession();

// Handle loading state
if (isPending) {
  return <LoadingSpinner />;
}

// Check authentication
if (!session) {
  return <LoginForm />;
}

// Use session data
console.log('User role:', session.user.role);
console.log('User ID:', session.user.id);`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}