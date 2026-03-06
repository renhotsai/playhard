# Research: Admin Create User Page - Role Type Sections Enhancement

**Enhancement**: Restructure user role type selection into two distinct sections: "System Roles" and "Organization Roles"  
**Date**: September 15, 2025  
**Phase**: 0 - Research & Analysis

## Role Section Enhancement Research

### Role Section UI Patterns

**Research Question**: What are the most effective UI patterns for grouping role selections into logical sections?

**Decision**: Grouped radio button sections with visual separation
- **Approach**: Use shadcn/ui RadioGroup components within distinct section containers
- **Visual Design**: Card-based sections with headers, descriptions, and clear boundaries
- **Interaction**: Single selection across all sections (radio button behavior)

**Rationale**: 
- Maintains intuitive single-selection UX expected for role assignment
- Provides clear visual hierarchy between system and organization roles
- Leverages existing shadcn/ui design system for consistency
- Supports accessibility requirements with proper ARIA labeling

**Alternatives Considered**:
1. **Tabbed Interface**: Rejected - adds unnecessary navigation complexity
2. **Dropdown Sections**: Rejected - reduces visibility of available options
3. **Accordion Sections**: Rejected - requires extra clicks to view all options

### Component Architecture for Sections

**Decision**: Create reusable RoleSelectionSections component with grouped structure
```tsx
<RoleSelectionSections>
  <RoleSectionGroup title="System Roles" section="system">
    <SystemAdminRoleOption />
  </RoleSectionGroup>
  <RoleSectionGroup title="Organization Roles" section="organization">
    <OrganizationOwnerRoleOption />
    <OrganizationAdminRoleOption />
    <GameMasterRoleOption />
    <GameStaffRoleOption />
    <GamePlayerRoleOption />
  </RoleSectionGroup>
</RoleSelectionSections>
```

**Rationale**: Provides clear separation while maintaining unified form state

## Technical Research Findings

### Better Auth Integration Patterns
**Decision**: Use Better Auth API methods for user creation  
**Rationale**: 
- Direct integration with existing auth system
- Handles password setup, email verification automatically  
- Supports organization role assignment via organization plugin
- Provides magic link functionality for user onboarding

**Alternatives considered**: Custom user creation, direct Prisma operations
- Rejected: Would bypass Better Auth security features and break authentication flow

### Role Assignment Architecture  
**Decision**: Enhanced hybrid approach using Better Auth roles + organization membership with murder mystery game roles
**Rationale**:
- System admin: Better Auth user.role = 'admin'  
- Organization business roles: Better Auth organization plugin (member.role = 'owner'/'admin')
- Murder mystery game roles: Extended organization roles (member.role = 'gm'/'staff'/'player')
- Consistent with existing unified permission system
- Leverages Better Auth's built-in role validation
- Supports game-specific character creation and management

**Enhanced Role Hierarchy**:
- **System Level**: 'admin' (global platform access)
- **Organization Business**: 'owner', 'admin' (business management)  
- **Murder Mystery Game**: 'gm' (Game Master), 'staff' (game operations), 'player' (game participant)

**Alternatives considered**: Single role table, custom permission system, separate game role system
- Rejected: Would duplicate existing unified permission system or create unnecessary complexity

### Form Validation Approach
**Decision**: Use TanStack Form with Zod validation
**Rationale**:
- Consistent with project's TanStack standard
- Type-safe validation with runtime checks
- Better UX with field-level validation
- Integrates well with shadcn/ui components

**Alternatives considered**: React Hook Form, native form validation
- Rejected: Breaks consistency with project TanStack standards

### UI Component Strategy
**Decision**: Build on existing shadcn/ui components with form composition
**Rationale**:
- Consistent design system
- Reusable form components already exist
- Role selection can use existing Select/Radio components
- Organization picker can reuse existing organization components

**Alternatives considered**: Custom form components, third-party form libraries
- Rejected: Unnecessary when existing components meet requirements

### Navigation Integration
**Decision**: Add to system admin sidebar with conditional rendering
**Rationale**:
- User specified requirement: "show on system admin sidebar"
- Follows existing app-sidebar.tsx pattern for role-based menu items
- Uses existing isSystemAdmin() utility for visibility control
- Consistent with other admin-only features

**Alternatives considered**: Separate admin navigation, floating action
- Rejected: Inconsistent with existing admin UI patterns

### Email Invitation Flow
**Decision**: Leverage existing magic link email system
**Rationale**:
- Already implemented in Better Auth configuration
- Consistent with existing user onboarding flow
- Handles email templates and delivery via Resend
- Automatic account setup flow to /set-username

**Alternatives considered**: Custom email system, third-party invitations
- Rejected: Would duplicate existing email infrastructure

## Architecture Decisions

### Page Structure
```
src/app/dashboard/admin/users/create/
├── page.tsx                 # Main create user page
└── admin-create-user-form.tsx   # Form component
```

### API Endpoints
```
POST /api/admin/users/create    # Create system admin or organization user
GET  /api/admin/organizations   # List organizations for role assignment
```

### Data Flow
1. Form submission → Validation → API call
2. API determines user type (system admin vs org user)  
3. Better Auth user creation + role assignment
4. Magic link email sent via existing email service
5. Success feedback + redirect to user list

### Permission Validation
- Page access: `isSystemAdmin(user.role)` check
- API access: Better Auth session validation + admin role check
- Organization selection: Validate admin has access to assign roles in org

## Integration Points

### Existing Systems
- **Sidebar Navigation**: Update app-sidebar.tsx with new menu item
- **Better Auth**: Use auth.api.signUp() and organization.inviteMember()
- **Email Service**: Leverage existing Resend integration
- **Permission System**: Integrate with unified permission system
- **Database**: Use existing Prisma schema (User, Member, Invitation)

### Components to Reuse
- `CreateOrgUserForm` pattern for form structure
- `AppSidebar` for navigation integration  
- `LoadingState`, `ErrorState` for UI feedback
- Existing shadcn/ui form components

## Performance Considerations
- Form validation: Client-side with server-side validation
- Organization list: Cache with TanStack Query (staleTime: 5min)
- Email sending: Async operation with loading states
- Database queries: Single transaction for user + role creation

## Security Considerations  
- Server-side validation of all inputs
- Admin role verification on every API call
- Email sanitization before sending invitations
- CSRF protection via Better Auth session handling
- Rate limiting for user creation to prevent spam

## Testing Strategy
- Contract tests: API endpoint validation
- Integration tests: Complete user creation flow  
- UI tests: Form validation and submission
- E2E tests: End-to-end user creation with email
- Load tests: Multiple concurrent admin user creation