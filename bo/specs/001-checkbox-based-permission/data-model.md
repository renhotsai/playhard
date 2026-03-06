# Data Model: Checkbox Permission System (No Admin Plugin)

**Date**: 2025-01-13  
**Prerequisites**: research.md complete  
**Context**: Data model designed to work without Better Auth admin plugin, using organization-based access control.

## Core Entities

### 1. Permission Table
**Purpose**: Store direct permission grants for users and teams  
**Scope**: Organization-scoped permissions with inheritance logic

```typescript
model Permission {
  id             String   @id @default(cuid())
  
  // Subject (who has the permission)
  subjectType    PermissionSubject  // 'user' | 'member'
  subjectId      String
  
  // Permission details  
  resource       PermissionResource // 'user' | 'organization' | 'member' | 'report' | 'team'
  action         PermissionAction   // 'create' | 'read' | 'update' | 'delete'
  granted        Boolean
  
  // Organization context (required for all permissions)
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Audit trail
  grantedAt      DateTime
  grantedBy      String     // User ID who granted this permission
  
  // Constraints
  @@unique([subjectType, subjectId, organizationId, resource, action])
  @@map("permission")
}
```

**Validation Rules**:
- All permissions must have organizationId (no global permissions)
- subjectId must exist (user.id or member.id)
- grantedBy must be valid user with admin access to organization
- Cannot grant permissions that violate OrganizationPermissionLimit

### 2. OrganizationPermissionLimit Table  
**Purpose**: Define maximum permissions allowed within an organization  
**Scope**: Set by system admins, enforced for all users in organization

```typescript
model OrganizationPermissionLimit {
  id             String   @id @default(cuid())
  
  // Organization scope
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Permission restriction
  resource       PermissionResource
  action         PermissionAction  
  allowed        Boolean           // false = this permission is forbidden in org
  
  // Audit trail
  setAt          DateTime
  setBy          String           // System admin user ID who set this limit
  
  // Constraints
  @@unique([organizationId, resource, action])
  @@map("organization_permission_limit")
}
```

**Validation Rules**:
- Only system admins (user.role = 'admin') can create/update limits
- setBy must be valid system admin user
- Cannot set limits that contradict existing granted permissions (graceful migration)

### 3. Enhanced User Model (Existing)
**Purpose**: Add system admin role to existing Better Auth user  
**Changes**: Utilize existing user.role field for system admin identification

```typescript
// Existing Better Auth user model - no changes needed
// user.role field used for system admin identification
// user.role = 'admin' → system admin access
// user.role = null/other → regular user, access via organization membership
```

### 4. Enhanced Organization/Member Models (Existing)
**Purpose**: Better Auth organization plugin models  
**Changes**: No database changes, enhanced access control logic

```typescript
// Existing Better Auth models - no changes needed
// organization table → organization context for permissions  
// member table → organization-level admin roles (owner, admin, member)
// Use member.role for organization-level access control
```

## Enum Definitions

```typescript
enum PermissionSubject {
  USER   = "user"    // Direct user permissions
  MEMBER = "member"  // Team-based permissions (future)
}

enum PermissionResource {
  USER         = "user"
  ORGANIZATION = "organization"  
  MEMBER       = "member"
  REPORT       = "report"
  TEAM         = "team"
}

enum PermissionAction {
  CREATE = "create"
  READ   = "read"
  UPDATE = "update" 
  DELETE = "delete"
}
```

## Permission Inheritance Logic

### Access Control Hierarchy
1. **System Admin**: user.role = 'admin' → access to all organizations
2. **Organization Owner**: member.role = 'owner' → full access within organization  
3. **Organization Admin**: member.role = 'admin' → admin access within organization
4. **Direct Permissions**: Permission table → specific granted permissions
5. **Organization Limits**: OrganizationPermissionLimit → maximum allowed permissions

### Permission Resolution Algorithm
```typescript
function resolvePermission(
  userId: string,
  organizationId: string, 
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  // 1. System admin override
  const user = getUser(userId)
  if (user.role === 'admin') return true
  
  // 2. Check organization limits (hard boundary)
  const limit = getOrganizationLimit(organizationId, resource, action)
  if (limit && !limit.allowed) return false
  
  // 3. Get user's role in organization
  const member = getMember(userId, organizationId)
  if (!member) return false
  
  // 4. Organization owner/admin roles
  if (['owner', 'admin'].includes(member.role)) {
    return getRolePermissions(member.role, resource, action)
  }
  
  // 5. Check direct permissions
  const permission = getPermission('user', userId, organizationId, resource, action)
  return permission?.granted || false
}
```

## State Transitions

### Permission Grant Flow
1. **Request**: Admin requests permission grant for user
2. **Validation**: Check admin has authority + doesn't violate org limits
3. **Grant**: Create/update Permission record
4. **Audit**: Log permission change

### Organization Limit Flow  
1. **Request**: System admin sets organization limit
2. **Validation**: Check system admin authority
3. **Impact Check**: Identify affected existing permissions
4. **Update**: Create/update OrganizationPermissionLimit
5. **Cascade**: Disable conflicting permissions (don't delete, mark as limited)

### Admin Migration Flow
1. **Phase 1**: Add organization context to existing admin routes  
2. **Phase 2**: Update admin UI to use organization membership
3. **Phase 3**: Remove admin plugin dependencies
4. **Phase 4**: Clean up old admin routes

## Database Migration Strategy

### New Tables
```sql
-- Add permission system tables
CREATE TABLE permission (...);
CREATE TABLE organization_permission_limit (...);

-- Indexes for performance
CREATE INDEX idx_permission_subject ON permission(subject_type, subject_id);  
CREATE INDEX idx_permission_org ON permission(organization_id);
CREATE INDEX idx_org_limit_org ON organization_permission_limit(organization_id);
```

### Data Migration
```sql
-- No existing data migration needed
-- Start with empty permission tables
-- Populate as users are granted specific permissions
-- Organization limits start empty (all permissions allowed)
```

## Validation & Constraints

### Business Rules
- All permissions must be organization-scoped
- System admins can access any organization
- Organization limits are enforced for all users except system admins
- Permission grants must not violate organization limits
- Direct permissions override role-based permissions (additive)

### Data Integrity
- Foreign key constraints to organization, user tables
- Unique constraints prevent duplicate permissions  
- Check constraints ensure valid enum values
- Audit fields required (grantedBy, grantedAt, setBy, setAt)

This data model supports the checkbox permission UI while working entirely within Better Auth's organization plugin capabilities, with system admin access via the user.role field.