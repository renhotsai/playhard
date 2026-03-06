# RoleSelectionSections Component

A comprehensive two-tier role selection component for the PlayHard Backoffice admin create user interface. This component provides a card-based visual layout for selecting between System Roles and Organization Roles with conditional organization assignment.

## Features

- **Two-Section Design**: Clear visual separation between System Roles and Organization Roles
- **Card-Based Layout**: Uses shadcn/ui Card components for consistent styling
- **Radio Button Interface**: Single-selection behavior across both sections
- **Conditional Organization Selection**: Automatically shows organization picker for organization roles
- **Dual Interface Support**: Supports both simple and enhanced prop interfaces
- **Full Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Responsive Design**: Works on mobile and desktop
- **Loading States**: Built-in loading indicators
- **Error Handling**: Comprehensive validation and error display
- **TypeScript**: Full type safety with proper interfaces

## Role Structure

### System Roles
- **system_admin**: Complete system control across all organizations and users

### Organization Roles  
- **organization_owner**: Complete organization ownership and management privileges
- **organization_admin**: Administrative privileges for organization management
- **game_master**: Lead murder mystery games and guide player experiences
- **game_staff**: Support game operations and assist with customer service
- **game_player**: Participate in murder mystery games and solve puzzles

## Usage

### Original Interface (Simple)

```tsx
import { RoleSelectionSections } from '@/components/forms/role-selection-sections'
import { useState } from 'react'

function MyComponent() {
  const [selectedRole, setSelectedRole] = useState<RoleType | undefined>()
  const [error, setError] = useState<string>()

  return (
    <RoleSelectionSections
      value={selectedRole}
      onValueChange={setSelectedRole}
      error={error}
      disabled={false}
    />
  )
}
```

### Enhanced Interface (With Organization Selection)

```tsx
import { RoleSelectionSections } from '@/components/forms/role-selection-sections'
import { useState } from 'react'

function MyComponent() {
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null)
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{
    roleType?: string
    organizationId?: string
  }>({})

  const handleRoleChange = (selection: {
    roleType: RoleType | null
    section: RoleSection
    requiresOrganization: boolean
  }) => {
    setSelectedRole(selection.roleType)
    // Clear organization if switching to system role
    if (!selection.requiresOrganization) {
      setSelectedOrganization(null)
    }
  }

  const handleSubmit = (data: CreateUserFormData) => {
    console.log('Creating user:', data)
  }

  return (
    <RoleSelectionSections
      selectedRole={selectedRole}
      selectedOrganization={selectedOrganization}
      onRoleChange={handleRoleChange}
      onSubmit={handleSubmit}
      validationErrors={validationErrors}
    />
  )
}
```

## Props

### Original Interface Props (`RoleSelectionSectionsProps`)

```typescript
interface RoleSelectionSectionsProps {
  /** Currently selected role value */
  value?: RoleType;
  
  /** Callback when role selection changes */
  onValueChange: (value: RoleType) => void;
  
  /** Disable all role selections */
  disabled?: boolean;
  
  /** Error message to display */
  error?: string;
  
  /** Custom role configurations (optional override) */
  sections?: RoleSectionConfig[];
  
  /** Additional CSS classes */
  className?: string;
  
  /** Test ID for testing */
  'data-testid'?: string;
}
```

### Enhanced Interface Props (`RoleSelectionSectionsPropsEnhanced`)

```typescript
interface RoleSelectionSectionsPropsEnhanced {
  selectedRole: RoleType | null;
  selectedOrganization: string | null;
  onRoleChange: (selection: {
    roleType: RoleType | null;
    section: RoleSection;
    requiresOrganization: boolean;
  }) => void;
  onSubmit: (data: CreateUserFormData) => void;
  validationErrors?: {
    roleType?: string;
    organizationId?: string;
  };
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}
```

## Component Behavior

### Role Selection Flow

1. **Initial State**: No role selected
2. **User Selects Role**: Click on any role option
3. **System Role Selected**: Component shows only role selection
4. **Organization Role Selected**: Component automatically shows organization selector
5. **Organization Assignment**: User must select an organization for organization roles
6. **Validation**: Component validates required fields and shows errors
7. **Submission**: Form can be submitted with complete data

### Organization Selector

The organization selector appears automatically when an organization role is selected:

- Uses shadcn/ui Select component
- Shows organization name and description
- Validates organization selection for organization roles
- Hides when switching back to system roles

### Accessibility Features

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support with arrow keys
- **Focus Management**: Logical tab order
- **Error Announcements**: Screen reader announcements for validation errors
- **Heading Hierarchy**: Proper semantic structure

### Visual Design

- **Card Layout**: Each section uses shadcn/ui Card components
- **Badge System**: Role-specific badges with appropriate variants
  - System Admin: `destructive` variant (red)
  - Organization Owner: `default` variant
  - Organization Admin: `secondary` variant  
  - Game Master: `default` variant
  - Game Staff: `outline` variant
  - Game Player: `outline` variant
- **Responsive**: Works on all screen sizes
- **Loading States**: Skeleton loading during async operations

## Testing

The component includes comprehensive test coverage:

```bash
# Run tests
npx jest tests/components/role-selection-sections.test.tsx

# Run with watch mode
npx jest tests/components/role-selection-sections.test.tsx --watch
```

### Test Categories

- **Component Interface & Props Contract**: Validates prop interfaces
- **Two-Section Structure**: Tests visual structure and layout
- **Role Section Content**: Validates role options and descriptions
- **Single Selection Behavior**: Tests radio button logic
- **Disabled State**: Tests disabled functionality
- **Error Handling**: Tests validation and error display
- **Custom Sections Override**: Tests configuration flexibility
- **Accessibility**: Tests ARIA compliance and keyboard navigation
- **Event Handling**: Tests callbacks and user interactions
- **Component Integration**: Tests edge cases and integration scenarios

## File Structure

```
src/
├── components/forms/
│   ├── role-selection-sections.tsx      # Main component
│   ├── role-selection-demo.tsx          # Demo/example usage
│   ├── role-section-group.tsx           # Section group component
│   └── role-option.tsx                  # Individual role option
├── types/
│   └── role-sections.ts                 # TypeScript interfaces
├── lib/
│   └── role-section-utils.ts            # Utility functions
└── tests/components/
    └── role-selection-sections.test.tsx # Component tests
```

## Dependencies

### shadcn/ui Components
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `RadioGroup`, `RadioGroupItem`
- `Label`
- `Badge`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Alert`, `AlertDescription`
- `Skeleton`

### Icons
- `AlertCircle` from lucide-react
- `Building2` from lucide-react

### Utilities
- `cn` utility for className merging
- Role validation utilities from `@/lib/role-section-utils`

## Implementation Details

### Function Overloading

The component uses TypeScript function overloading to support both interfaces:

```typescript
export function RoleSelectionSections(props: RoleSelectionSectionsProps): JSX.Element;
export function RoleSelectionSections(props: RoleSelectionSectionsPropsEnhanced): JSX.Element;
export function RoleSelectionSections(props: RoleSelectionSectionsProps | RoleSelectionSectionsPropsEnhanced) {
  // Implementation with type guards to determine interface
}
```

### Type Safety

- Full TypeScript coverage with strict typing
- Union types for role definitions
- Utility functions for type checking
- Comprehensive interfaces for all props

### Performance Optimizations

- Memoized components where appropriate
- Efficient re-render handling
- Optimized prop comparison for memo

## Demo

To see the component in action, use the demo component:

```tsx
import { RoleSelectionCombinedDemo } from '@/components/forms/role-selection-demo'

export default function DemoPage() {
  return <RoleSelectionCombinedDemo />
}
```

## Browser Support

- Modern browsers with ES2020+ support
- Mobile browsers (iOS Safari, Chrome Mobile)
- Desktop browsers (Chrome, Firefox, Safari, Edge)

## Contributing

When modifying this component:

1. **Maintain Backward Compatibility**: Don't break existing usage
2. **Update Tests**: Add tests for new functionality
3. **Document Changes**: Update this README
4. **Follow Design System**: Use shadcn/ui components consistently
5. **Accessibility First**: Ensure ARIA compliance and keyboard support

## Related Components

- `RoleSectionGroup`: Renders individual role sections
- `RoleOption`: Renders individual role options  
- `OrganizationSelect`: Organization selection dropdown
- Form components that use role selection

## Support

For questions or issues with this component, check:

1. **Tests**: Run tests to ensure functionality
2. **Demo**: Use the demo component to test behavior
3. **Types**: Check TypeScript interfaces for prop requirements
4. **Console**: Check browser console for validation warnings