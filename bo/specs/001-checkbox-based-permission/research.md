# Research: Better Auth Without Admin Plugin & Admin Structure Reorganization

**Date**: 2025-01-13  
**Context**: Checkbox permission system needs to work without Better Auth admin plugin. Existing admin structure must be reorganized.

## Research Findings

### 1. Better Auth Organization-Only Patterns

**Decision**: Use organization ownership/admin roles as system-level access control  
**Rationale**: Better Auth organization plugin provides sufficient role-based access within organizations. System-level access can be achieved by creating a special "system" organization or using a user.role field.  
**Alternatives considered**: 
- Third-party admin plugins (adds complexity)
- Custom session management (breaks Better Auth integration)
- Role-based middleware (requires admin plugin)

**Implementation Pattern**:
```typescript
// Use user.role for system-level access
const isSystemAdmin = (userRole?: string) => userRole === 'admin'

// Use organization membership for org-level access  
const isOrgAdmin = (memberRole?: string) => ['owner', 'admin'].includes(memberRole || '')
```

### 2. Admin Route Reorganization Strategy

**Decision**: Convert `/api/admin/*` to organization-scoped routes with system admin bypass  
**Rationale**: Maintains existing functionality while removing admin plugin dependency. System admins can access any organization's data.  
**Alternatives considered**:
- Global admin routes (requires admin plugin)
- Separate admin app (adds deployment complexity)
- Permission-based routing (over-engineered)

**Migration Plan**:
```
OLD: /api/admin/users → NEW: /api/organizations/{id}/users (+ system admin access)
OLD: /api/admin/organizations → NEW: /api/organizations (+ system admin list all)
OLD: /dashboard/admin/* → NEW: /dashboard/organizations/{id}/* (+ system admin nav)
```

### 3. System Admin vs Organization Admin Access Patterns

**Decision**: Dual-layer access control using user.role + organization membership  
**Rationale**: System admins need cross-organization access, org admins need within-org access only.  
**Alternatives considered**:
- Single-layer org-only (no system admin capability)
- Role hierarchy in organization (insufficient for system access)
- Permission-based (too complex for this use case)

**Access Control Logic**:
```typescript
// System admin: Access to all organizations
if (userRole === 'admin') return { accessAll: true }

// Organization admin: Access to specific organization  
const member = await getUserOrgMembership(userId, orgId)
if (['owner', 'admin'].includes(member?.role)) return { accessOrg: orgId }

// Regular user: No admin access
return { accessNone: true }
```

### 4. Permission System Architecture Without Admin Plugin

**Decision**: Custom Permission + OrganizationPermissionLimit tables with inheritance logic  
**Rationale**: Provides checkbox UI flexibility without requiring global admin role management.  
**Alternatives considered**:
- Extended organization roles (insufficient granularity)
- RBAC library integration (adds complexity)
- Custom role tables (duplicates organization plugin)

**Data Model**:
```typescript
// Direct permissions
Permission: { subjectType, subjectId, resource, action, granted, organizationId }

// Organization-level limits (set by system admins)
OrganizationPermissionLimit: { organizationId, resource, action, allowed }

// Permission inheritance: Direct ∪ Team ∩ OrgLimits
```

### 5. Admin UI Reorganization

**Decision**: Context-aware admin interface that adapts to user role and organization  
**Rationale**: Single UI that works for both system admins and organization admins with appropriate scope.  
**Alternatives considered**:
- Separate admin dashboards (maintenance overhead)
- Role-based component rendering (complex state management)
- Permission-driven UI (over-engineered)

**UI Strategy**:
- System admin: Organization selector + full access
- Org admin: Current organization context + limited access
- Shared components with access-level props

### 6. Migration Strategy from Current Admin Structure

**Decision**: Incremental migration with backward compatibility during transition  
**Rationale**: Allows testing new patterns before fully removing admin dependencies.  
**Alternatives considered**:
- Big bang migration (risky)
- Parallel implementation (resource intensive)
- Feature flag approach (adds complexity)

**Migration Steps**:
1. Add organization-scoped routes alongside existing admin routes
2. Update admin UI to use organization context
3. Migrate system admin access to user.role checking
4. Remove admin plugin dependencies
5. Clean up old admin routes

## Resolved Unknowns

- ✅ Better Auth system admin: Use user.role field
- ✅ Organization access: Use organization plugin membership
- ✅ Admin route migration: Organization-scoped with system bypass
- ✅ Permission inheritance: Custom tables + logic
- ✅ UI reorganization: Context-aware shared components
- ✅ Migration strategy: Incremental with compatibility

## Next Phase Requirements

Phase 1 should focus on:
1. Data model that works without admin plugin
2. API contracts for organization-scoped admin routes
3. Permission system contracts (matrix, check, limits)
4. UI component contracts for reorganized admin interface
5. Migration contracts for existing admin functionality

All designs must work with basic Better Auth setup (organization, username, magic-link plugins only).