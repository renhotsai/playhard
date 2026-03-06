# Role Section Components

This directory contains the role selection components that provide a two-section interface for choosing user roles in the admin create user form.

## Overview

The role selection system divides roles into two distinct sections:
- **System Roles**: Global platform administration roles (System Administrator)
- **Organization Roles**: Organization-specific roles (Owner, Admin, Game Master, Staff, Player)

## Components

### RoleSelectionSections

Main component that renders the complete two-section role selection interface.

**Location**: `src/components/forms/role-selection-sections.tsx`

**Props**: 
```typescript
interface RoleSelectionSectionsProps {
  value?: RoleType;
  onValueChange: (value: RoleType) => void;
  disabled?: boolean;
  error?: string;
  sections?: RoleSectionConfig[];
  className?: string;
  'data-testid'?: string;
}
```

**Usage**:
```tsx
import { RoleSelectionSections } from '@/components/forms/role-selection-sections';

<RoleSelectionSections
  value={selectedRole}
  onValueChange={setSelectedRole}
  disabled={isLoading}
  error={validationError}
/>
```

### RoleSectionGroup

Individual section component that renders a group of roles (either System or Organization).

**Location**: `src/components/forms/role-section-group.tsx`

**Features**:
- Card-based layout with section title and description
- Individual role options within the section
- Proper ARIA attributes for accessibility
- Responsive design with shadcn/ui components

### RoleOption

Individual role selection option component with radio button behavior.

**Location**: `src/components/forms/role-option.tsx`

**Features**:
- Radio button selection behavior
- Role badges (e.g., "FULL ACCESS", "OWNER", "ADMIN")
- Hover states and visual feedback
- Keyboard navigation support
- Proper accessibility attributes

## Type System

### Core Types

```typescript
// Role section categories
type RoleSection = 'system' | 'organization';

// System-level roles
type SystemRole = 'system_admin';

// Organization-level roles
type OrganizationRole = 
  | 'organization_owner' 
  | 'organization_admin' 
  | 'game_master' 
  | 'game_staff' 
  | 'game_player';

// Combined role type
type RoleType = SystemRole | OrganizationRole;
```

### Role Definitions

Each role includes:
- `id`: Unique role identifier
- `label`: Display name for the role
- `description`: Detailed explanation of role permissions
- `section`: Which section the role belongs to
- `badge`: Optional badge with text and styling variant

## Form Integration

### TanStack Form Integration

The components integrate seamlessly with TanStack Form:

```tsx
import { useForm } from '@tanstack/react-form';
import { RoleSelectionSections } from '@/components/forms/role-selection-sections';

const form = useForm({
  defaultValues: {
    roleType: undefined as RoleType | undefined,
    // ... other fields
  },
  // ... form configuration
});

// In the render:
<form.Field
  name="roleType"
  children={(field) => (
    <RoleSelectionSections
      value={field.state.value}
      onValueChange={field.handleChange}
      error={field.state.meta.errors?.[0]}
    />
  )}
/>
```

### Validation

Role selection validation is handled through the form validator system:

```typescript
import { roleSectionsValidators } from '@/lib/form-validators';

// Validate role type
const validationResult = roleSectionsValidators.roleType(selectedRole);
```

## Styling and Design

### shadcn/ui Components Used
- `Card`, `CardHeader`, `CardTitle`, `CardContent` - Section containers
- `RadioGroup`, `RadioGroupItem` - Selection mechanism
- `Label` - Role labels and descriptions
- `Badge` - Role badges and indicators
- `Separator` - Visual separation between sections

### Design Patterns
- Card-based section grouping for clear visual hierarchy
- Consistent spacing and typography
- Hover states and interactive feedback
- Badge system for role importance indication
- Responsive design principles

## Accessibility

### ARIA Attributes
- `role="radiogroup"` for the selection container
- `aria-label` for screen reader context
- `aria-checked` for selection state
- `aria-labelledby` for section groupings
- `role="alert"` for error messages

### Keyboard Navigation
- Tab navigation between sections and options
- Space/Enter key selection
- Focus management and visual indicators

## Testing

### Test Coverage
- Unit tests for individual components
- Integration tests for form interaction
- Accessibility testing with screen readers
- Visual regression testing

### Test IDs
Components include data-testid attributes for reliable testing:
- `role-selection-sections` - Main container
- `role-section-system` - System roles section
- `role-section-organization` - Organization roles section
- `role-option-{roleId}` - Individual role options

## Migration Notes

### From Single Role Selection
When migrating from a single role dropdown:

1. Replace the old role selection component with `RoleSelectionSections`
2. Update form schema to use `RoleType` instead of string
3. Update validation to use `roleSectionsValidators`
4. Test the new two-section interface thoroughly

### Organization Context
Organization roles automatically require organization selection in the form. The role section utilities provide helper functions to determine when organization context is needed:

```typescript
import { requiresOrganization } from '@/lib/role-section-utils';

if (requiresOrganization(selectedRole)) {
  // Show organization selection field
}
```

## Utilities

### Role Section Utils (`src/lib/role-section-utils.ts`)

Utility functions for working with role sections:
- `getRoleSectionType(roleId)` - Get section for a role
- `requiresOrganization(roleId)` - Check if role needs organization
- `validateRoleSelection(roleId)` - Validate role choice
- `getRoleDisplayInfo(roleId)` - Get role presentation data

### Default Configurations

Default role sections are defined in `src/types/role-sections.ts` as `DEFAULT_ROLE_SECTIONS`. This can be overridden if needed for specific use cases.

## Performance Considerations

- Components use React.memo for optimization where appropriate
- Minimal re-renders through proper prop management
- Lazy loading of heavy role data if needed
- Efficient event handling for selection changes

## Future Enhancements

Potential improvements:
- Role permission matrix integration
- Dynamic role loading from API
- Role templates and presets
- Advanced filtering and search
- Custom role creation interface