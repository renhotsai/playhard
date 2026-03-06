# Quickstart: Checkbox Permission System (No Admin Plugin)

**Date**: 2025-01-13  
**Prerequisites**: data-model.md, contracts complete  
**Context**: Integration guide for permission system without Better Auth admin plugin

## 1. Database Setup

### Add Permission Tables to Prisma Schema
```bash
# Add to prisma/schema.prisma
cat >> prisma/schema.prisma << EOF

// Permission System Tables
model Permission {
  id             String   @id @default(cuid())
  subjectType    String   // 'user' | 'member'
  subjectId      String
  resource       String   // 'user' | 'organization' | 'member' | 'report' | 'team'
  action         String   // 'create' | 'read' | 'update' | 'delete'
  granted        Boolean
  organizationId String
  organization   Organization @relation("PermissionToOrganization", fields: [organizationId], references: [id], onDelete: Cascade)
  grantedAt      DateTime @default(now())
  grantedBy      String

  @@unique([subjectType, subjectId, organizationId, resource, action])
  @@map("permission")
}

model OrganizationPermissionLimit {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation("OrganizationLimitToOrganization", fields: [organizationId], references: [id], onDelete: Cascade)
  resource       String
  action         String
  allowed        Boolean
  setAt          DateTime @default(now())
  setBy          String

  @@unique([organizationId, resource, action])
  @@map("organization_permission_limit")
}

// Add relations to existing Organization model
model Organization {
  // ... existing fields
  permissions     Permission[] @relation("PermissionToOrganization")
  permissionLimits OrganizationPermissionLimit[] @relation("OrganizationLimitToOrganization")
}
EOF

# Run migration
npx prisma migrate dev --name add-permission-system
```

## 2. Remove Admin Plugin Dependencies

### Update Better Auth Configuration
```typescript
// src/lib/auth.ts - Remove admin plugin
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma";
import { 
  magicLink, 
  openAPI, 
  organization, 
  username 
  // Remove: admin plugin
} from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  
  user: {
    additionalFields: {
      role: { type: "string", required: false }, // Use for system admin
      // ... other fields
    },
  },
  
  plugins: [
    username(),
    organization(),
    magicLink({
      expiresIn: 15 * 60, // 15 minutes
      sendMagicLink: async ({ email, url }) => {
        // Send email implementation
      },
    }),
    openAPI(),
    // Remove: admin() plugin
  ],
});
```

## 3. Create Permission Library

### Install Permission System
```bash
# Already implemented in src/lib/permissions/
# - types.ts (Permission enums and interfaces)
# - validation.ts (Request validation)
# - inheritance.ts (Permission resolution logic)
# - queries.ts (Database operations)
# - audit.ts (Audit trail)
# - service.ts (Main service class)
# - index.ts (Library exports)
```

### Update System Admin Helper
```typescript
// src/lib/permissions.ts - Update system admin check
export const isSystemAdmin = (userRole?: string | null): boolean => {
  return userRole === 'admin';
};

// Remove dependency on Better Auth admin plugin
// Use user.role field instead of admin plugin methods
```

## 4. Migrate Admin Routes

### Replace Admin API Routes
```bash
# Current admin routes to migrate:
# src/app/api/admin/users/route.ts → src/app/api/organizations/[id]/users/route.ts
# src/app/api/admin/organizations/... → src/app/api/organizations/...

# Pattern: Add organizationId context + system admin bypass
```

#### Example Route Migration
```typescript
// OLD: src/app/api/admin/users/route.ts
export async function GET() {
  // Required admin plugin
  const adminSession = await auth.api.getAdminSession();
  // ...
}

// NEW: src/app/api/organizations/[orgId]/users/route.ts  
export async function GET(req: NextRequest, { params }: { params: { orgId: string } }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return new Response('Unauthorized', { status: 401 });
  
  // System admin access (no org restriction)
  const isSystemAdmin = session.user.role === 'admin';
  if (isSystemAdmin) {
    // Access all organizations
    return getAllUsers();
  }
  
  // Organization admin access (org restriction)
  const member = await getMembership(session.user.id, params.orgId);
  if (!member || !['owner', 'admin'].includes(member.role)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Access this organization only
  return getOrganizationUsers(params.orgId);
}
```

## 5. Update Admin UI

### Migrate Dashboard Pages
```bash
# Current admin pages to update:
# src/app/dashboard/admin/users/page.tsx → context-aware user management
# Add organization selector for system admins
# Use organization context for org admins
```

#### Example UI Migration
```typescript
// src/app/dashboard/admin/users/page.tsx - Update to context-aware
export default function AdminUsersPage() {
  const { data: session } = authClient.useSession();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  
  const isSystemAdmin = session?.user.role === 'admin';
  
  // System admin: Show organization selector
  if (isSystemAdmin) {
    return <SystemAdminUsersView />;
  }
  
  // Organization admin: Use active organization
  if (activeOrganization) {
    return <OrganizationUsersView organizationId={activeOrganization.id} />;
  }
  
  // No access
  return <NoAccessView />;
}
```

### Update Sidebar Navigation
```typescript
// src/components/app-sidebar.tsx - Update admin menu items
const getMenuData = (isSystemAdmin: boolean, activeOrganizationId?: string) => {
  const menuItems = [];
  
  if (isSystemAdmin) {
    // System admin menu
    menuItems.push({
      label: "System Administration",
      items: [
        { title: "All Organizations", link: "/dashboard/organizations" },
        { title: "System Users", link: "/dashboard/users" },
        { title: "Permissions", link: "/dashboard/permissions" },
      ]
    });
  }
  
  if (activeOrganizationId) {
    // Organization context menu
    menuItems.push({
      label: "Organization Management", 
      items: [
        { title: "Users", link: `/dashboard/organizations/${activeOrganizationId}/users` },
        { title: "Permissions", link: `/dashboard/organizations/${activeOrganizationId}/permissions` },
      ]
    });
  }
  
  return menuItems;
};
```

## 6. Implement Permission APIs

### Add New Permission Routes
```bash
# Create new permission management routes:
mkdir -p src/app/api/permissions/matrix/[subjectType]/[subjectId]
mkdir -p src/app/api/permissions/check
mkdir -p src/app/api/organizations/[organizationId]/limits

# Implementation already exists in:
# - src/app/api/permissions/matrix/[subjectType]/[subjectId]/route.ts
# - src/app/api/permissions/check/route.ts  
# - src/app/api/permissions/organization-limits/[organizationId]/route.ts
```

## 7. Add Permission Components

### Use Existing Permission Components
```bash
# Components already implemented in src/components/permissions/:
# - PermissionMatrix (checkbox interface)
# - PermissionSummary (organization overview)
# - PermissionLimits (system admin restrictions)
# - PermissionAudit (audit trail)
```

### Add to Dashboard
```typescript
// src/app/dashboard/permissions/page.tsx - Already implemented
// Tabbed interface with all permission components
// Context-aware for system admin vs organization admin
```

## 8. TanStack Query Integration

### Use Permission Hooks
```typescript
// src/hooks/use-permissions.ts - Already implemented
import { 
  usePermissionMatrix,
  useUpdatePermissions,
  usePermissionCheck,
  useOrganizationLimits,
  useUpdateOrganizationLimits
} from '@/hooks/use-permissions';

// Example usage in components:
function PermissionManagementPage({ userId, organizationId }) {
  const { data: matrix, isLoading } = usePermissionMatrix('user', userId, organizationId);
  const updatePermissions = useUpdatePermissions();
  
  const handlePermissionUpdate = (updates) => {
    updatePermissions.mutate({ userId, organizationId, updates });
  };
  
  return (
    <PermissionMatrix 
      matrix={matrix} 
      loading={isLoading}
      onUpdatePermissions={handlePermissionUpdate}
    />
  );
}
```

## 9. Testing & Validation

### Run System Tests
```bash
# Permission contract tests (should pass after implementation)
npm test -- tests/contracts/permission-check.test.ts
npm test -- tests/contracts/permission-matrix.test.ts
npm test -- tests/contracts/admin-limits.test.ts

# Admin migration tests  
npm test -- tests/integration/admin-org-limits.test.ts
npm test -- tests/integration/route-compatibility.test.ts
```

### Manual Validation Checklist

#### System Admin Access
- [ ] System admin can access all organizations
- [ ] System admin can set organization limits
- [ ] System admin bypasses organization permission restrictions
- [ ] System admin sees organization selector in UI

#### Organization Admin Access  
- [ ] Organization owner/admin can manage users in their org
- [ ] Organization admin cannot access other organizations
- [ ] Organization admin cannot set organization limits
- [ ] Permission grants respect organization limits

#### Permission System
- [ ] Checkbox interface works for all resource/action combinations
- [ ] "All" checkbox toggles all actions for a resource
- [ ] Inherited permissions show correct source (role/team/direct)
- [ ] Organization limits disable checkboxes appropriately
- [ ] Audit trail captures all permission changes

#### Better Auth Integration
- [ ] No admin plugin dependencies remain
- [ ] user.role field used for system admin check
- [ ] Organization membership used for org-level access
- [ ] Session authentication works with all new routes

## 10. Cleanup & Migration Completion

### Remove Old Admin Dependencies
```bash
# After validation passes, remove old admin routes:
rm -rf src/app/api/admin/
rm -rf src/app/dashboard/admin/

# Update any remaining admin plugin references
grep -r "admin\." src/ --include="*.ts" --include="*.tsx"
# Manual fix any remaining admin plugin usage
```

### Update Documentation
```bash
# Update CLAUDE.md to reflect new architecture
# Update README with new admin access patterns
# Document migration from admin plugin to organization-based access
```

This quickstart provides step-by-step migration from Better Auth admin plugin to organization-based permission system with checkbox interface. The permission system maintains all existing functionality while removing admin plugin dependencies.