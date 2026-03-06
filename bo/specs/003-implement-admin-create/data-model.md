# Data Model: Admin Create User Page - Role Type Sections Enhancement

**Enhancement**: Two-section role type selection UI improvement
**Date**: September 15, 2025

## Role Section Enhancement Entities

### RoleSection (UI Grouping)
**Purpose**: UI categorization for role type sections
**Type**: `'system' | 'organization'`
**Usage**: Groups roles into logical sections for improved user experience

### RoleSectionDefinition
**Purpose**: Metadata for role section display
**Fields**:
- `section: RoleSection` - Section category (system/organization)
- `title: string` - Display title ("System Roles", "Organization Roles")
- `description: string` - Section description for user guidance
- `roles: RoleType[]` - Array of roles belonging to this section

**Section Mapping**:
- **System Section**: ['system_admin']
- **Organization Section**: ['organization_owner', 'organization_admin', 'game_master', 'game_staff', 'game_player']

### RoleSelectionSectionsProps
**Purpose**: Component interface for role section selection
**Fields**:
- `value?: string` - Currently selected role
- `onValueChange: (value: string) => void` - Selection change handler
- `disabled?: boolean` - Disable all role selections
- `error?: string` - Error message for validation

### RoleSectionGroupProps  
**Purpose**: Individual section group component interface
**Fields**:
- `title: string` - Section title
- `description: string` - Section description  
- `section: RoleSection` - Section identifier
- `roles: RoleDefinition[]` - Roles in this section
- `selectedValue?: string` - Currently selected role
- `onRoleSelect: (role: string) => void` - Role selection handler
- `disabled?: boolean` - Disable section

## Enhanced Entities

### CreateUserFormData
**Purpose**: Form input data for user creation
**Fields**:
- `email: string` - Required, validated email address
- `name: string` - Required, display name for the user  
- `userType: 'system_admin' | 'organization_user'` - Required, determines role assignment
- `organizationId?: string` - Required when userType is 'organization_user'
- `organizationRole?: 'owner' | 'admin' | 'gm' | 'staff' | 'player'` - Required when userType is 'organization_user'

**Validation Rules**:
- Email must be valid format and unique in system
- Name must be 2-100 characters, non-empty
- OrganizationId required when userType is 'organization_user'
- OrganizationRole required when userType is 'organization_user'  
- System admin creation bypasses organization fields

**State Transitions**:
- Draft → Validating → Valid/Invalid
- Valid → Submitting → Success/Error
- Error → Draft (for retry)

### CreateUserRequest (API)
**Purpose**: Server-side validated request data
**Fields**:
- `email: string` - Sanitized and validated
- `name: string` - Sanitized display name
- `userType: 'system_admin' | 'organization_user'`
- `organizationId?: string` - UUID validated
- `organizationRole?: 'owner' | 'admin' | 'gm' | 'staff' | 'player'` - Enum validated

**Validation Rules**:
- All client validation rules apply
- Additional server-side email uniqueness check
- Organization existence validation
- Admin permission validation for role assignment

### CreateUserResponse (API)
**Purpose**: API response with user creation result
**Fields**:
- `success: boolean` - Operation success status
- `user?: { id: string, email: string, name: string }` - Created user info
- `invitation?: { id: string, status: string }` - Invitation details
- `error?: { message: string, field?: string }` - Error information

**Success Flow**:
- User created in database
- Role assigned (system admin or organization member)
- Magic link invitation sent
- Response includes user ID and invitation status

**Error Cases**:
- Email already exists
- Invalid organization ID
- Permission denied for role assignment
- Email sending failure

### Organization (Existing)
**Purpose**: Organization data for role assignment
**Used Fields**:
- `id: string` - Primary key
- `name: string` - Display name for selection
- `slug: string` - URL-friendly identifier

**Relationship**: Used for organization selection in form and role assignment validation

### User (Better Auth - Existing)
**Purpose**: Core user entity
**Relevant Fields**:
- `id: string` - Primary key
- `email: string` - Unique identifier
- `name: string` - Display name
- `role?: string` - System-level role ('admin' for system admins)
- `emailVerified: boolean` - Verification status

**Role Assignment**:
- System admins: `user.role = 'admin'`
- Organization users: `user.role = null` (role via Member table)

### Member (Better Auth Organization - Existing)  
**Purpose**: Organization membership and roles
**Relevant Fields**:
- `userId: string` - Foreign key to User
- `organizationId: string` - Foreign key to Organization
- `role: string` - Organization role ('owner', 'admin')
- `createdAt: Date` - Membership creation

**Usage**: Created when assigning organization roles during user creation

### Invitation (Better Auth - Existing)
**Purpose**: Track invitation status
**Relevant Fields**:
- `id: string` - Primary key
- `email: string` - Invitation target
- `organizationId?: string` - Organization context
- `role?: string` - Intended role
- `status: string` - Invitation status
- `expiresAt: Date` - Expiration time

**Flow**: Created during user creation, links to magic link email

## Data Relationships

```
CreateUserFormData → CreateUserRequest (validation)
CreateUserRequest → User (creation)
CreateUserRequest → Member (if organization user)
CreateUserRequest → Invitation (magic link)
Organization ← Member (role assignment)
```

## Validation Schema (Zod)

```typescript
const CreateUserFormSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  userType: z.enum(['system_admin', 'organization_user']),
  organizationId: z.string().uuid().optional(),
  organizationRole: z.enum(['owner', 'admin', 'gm', 'staff', 'player']).optional(),
}).refine((data) => {
  if (data.userType === 'organization_user') {
    return data.organizationId && data.organizationRole;
  }
  return true;
}, {
  message: "Organization and role required for organization users",
  path: ["organizationId"],
});

// Murder Mystery Role Categories for UI grouping
const BUSINESS_ROLES = ['owner', 'admin'] as const;
const GAME_ROLES = ['gm', 'staff', 'player'] as const;
```

## State Management

### Form State (TanStack Form)
- Form values with real-time validation
- Field-level error states
- Submission loading state
- Success/error feedback

### Organization Data (TanStack Query)
- Cached organization list for selection
- Stale time: 5 minutes
- Background refetch on focus
- Error handling for organization loading

### Submission State
- Idle → Loading → Success/Error
- Error recovery with retry capability
- Success redirect after creation

## Database Operations

### Create System Admin
1. Insert User with role='admin'
2. Create Invitation record
3. Send magic link email
4. Return success response

### Create Organization User  
1. Insert User with role=null
2. Insert Member with organizationId + role
3. Create Invitation record with organization context
4. Send magic link email
5. Return success response

### Validation Queries
- Check email uniqueness: `SELECT id FROM User WHERE email = ?`
- Validate organization: `SELECT id FROM Organization WHERE id = ?`
- Check admin permissions: Validate session user has system admin role

## Security Considerations

### Input Sanitization
- Email: Trim whitespace, validate format
- Name: Sanitize HTML, limit length
- Organization ID: UUID validation
- Role: Enum validation

### Authorization
- Page access: System admin role required
- API access: Session + admin role validation
- Organization assignment: Validate admin can assign roles

### Data Protection  
- Email addresses stored securely
- Invitation tokens expire after 24 hours
- Audit logging for user creation events