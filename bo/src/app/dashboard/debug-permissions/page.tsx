'use client';

import { useSession } from '@/lib/auth-client';
import { usePermissions, usePermissionChecks } from '@/hooks/use-permissions';
import { isSystemAdmin } from '@/lib/permissions';

export default function DebugPermissionsPage() {
  const { data: session } = useSession();
  const permissions = usePermissions();
  const permissionChecks = usePermissionChecks();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Permission Debug Information</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Session Information</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm">
            {JSON.stringify({
              userId: session?.user?.id,
              email: session?.user?.email,
              role: session?.user?.role,
              isSystemAdmin: session?.user ? isSystemAdmin(session.user.role) : false
            }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Permission Checks</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm">
            {JSON.stringify({
              canViewPermissions: permissionChecks.canViewPermissions,
              canViewSystemRoles: permissionChecks.canViewSystemRoles,
              canViewOrgRoles: permissionChecks.canViewOrgRoles,
              isSystemAdmin: permissionChecks.isSystemAdmin
            }, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Raw Permissions</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm">
            {JSON.stringify({
              loading: permissions.loading,
              error: permissions.error,
              permissions: permissions.permissions.slice(0, 10) // Show first 10 for readability
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}