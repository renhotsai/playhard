# Data Model: Hierarchical Role Selection Enhancement

**Data Architecture**: Component State and Interface Design  
**Date**: September 17, 2025  
**Feature**: Step-by-step role selection with mutually exclusive category display

## State Architecture

### Core State Structure

```typescript
interface HierarchicalSelectionState {
  // Navigation state
  currentStep: SelectionStep;
  
  // Selection state
  selectedCategory: RoleCategory | null;
  selectedRole: RoleType | null;
  selectedOrganization: string | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Validation state
  canProceedToRole: boolean;
  canSubmitForm: boolean;
}

type SelectionStep = 'category' | 'role';
type RoleCategory = 'system' | 'organization';
```

### State Transitions

```typescript
interface StateTransition {
  from: SelectionStep;
  to: SelectionStep;
  trigger: 'categorySelected' | 'backToCategory' | 'roleSelected';
  validation: (state: HierarchicalSelectionState) => boolean;
}

const transitions: StateTransition[] = [
  {
    from: 'category',
    to: 'role',
    trigger: 'categorySelected',
    validation: (state) => state.selectedCategory !== null
  },
  {
    from: 'role',
    to: 'category',
    trigger: 'backToCategory',
    validation: () => true
  }
];
```

## Component Interface Design

### HierarchicalRoleSelection Component

**Primary Component Interface**:
```typescript
interface HierarchicalRoleSelectionProps {
  // Integration with TanStack Form
  value?: CreateUserFormData['roleType'];
  onRoleChange: (data: RoleSelectionData) => void;
  
  // Form state integration
  selectedOrganization?: string;
  onOrganizationChange: (organizationId: string | null) => void;
  
  // Error handling
  error?: string;
  
  // Loading states
  isSubmitting?: boolean;
  
  // Configuration
  className?: string;
  disabled?: boolean;
}

interface RoleSelectionData {
  roleType: RoleType | null;
  category: RoleCategory;
  requiresOrganization: boolean;
  step: SelectionStep;
}
```

### CategorySelection Component

**Category Selection Interface**:
```typescript
interface CategorySelectionProps {
  selectedCategory: RoleCategory | null;
  onCategorySelect: (category: RoleCategory) => void;
  error?: string;
  className?: string;
}

interface CategoryOption {
  id: RoleCategory;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'default' | 'destructive' | 'secondary';
}
```

### RoleSelection Component

**Role Selection Interface**:
```typescript
interface RoleSelectionProps {
  category: RoleCategory;
  selectedRole: RoleType | null;
  onRoleSelect: (role: RoleType) => void;
  selectedOrganization?: string;
  onOrganizationChange: (organizationId: string | null) => void;
  onBack: () => void;
  error?: string;
  className?: string;
}
```

## Data Flow Architecture

### State Management Flow

```typescript
// Parent Component (CreateUserForm)
const [selectionState, setSelectionState] = useState<HierarchicalSelectionState>({
  currentStep: 'category',
  selectedCategory: null,
  selectedRole: null,
  selectedOrganization: null,
  isLoading: false,
  error: null,
  canProceedToRole: false,
  canSubmitForm: false
});

// Handle role selection changes
const handleRoleSelectionChange = useCallback((data: RoleSelectionData) => {
  // Update form state
  form.setFieldValue('roleType', data.roleType);
  form.setFieldValue('selectedSection', data.category === 'system' ? 'system' : 'organization');
  
  // Update component state
  setSelectionState(prev => ({
    ...prev,
    selectedRole: data.roleType,
    selectedCategory: data.category,
    currentStep: data.step,
    canSubmitForm: data.roleType !== null && 
                   (!data.requiresOrganization || selectedOrganization !== null)
  }));
}, [form, selectedOrganization]);
```

### Validation Logic

```typescript
interface ValidationRules {
  categorySelection: (category: RoleCategory | null) => boolean;
  roleSelection: (role: RoleType | null, category: RoleCategory) => boolean;
  organizationSelection: (org: string | null, requiresOrg: boolean) => boolean;
  formCompletion: (state: HierarchicalSelectionState) => boolean;
}

const validationRules: ValidationRules = {
  categorySelection: (category) => category !== null,
  
  roleSelection: (role, category) => {
    if (!role) return false;
    return category === 'system' ? isSystemRole(role) : isOrganizationRole(role);
  },
  
  organizationSelection: (org, requiresOrg) => {
    return !requiresOrg || (requiresOrg && org !== null);
  },
  
  formCompletion: (state) => {
    const { selectedRole, selectedCategory, selectedOrganization } = state;
    if (!selectedRole || !selectedCategory) return false;
    
    const requiresOrg = selectedCategory === 'organization';
    return !requiresOrg || (requiresOrg && selectedOrganization !== null);
  }
};
```

## Integration with Existing Systems

### TanStack Form Integration

```typescript
// Form field mapping
interface FormFieldMapping {
  roleType: RoleType;           // Maps to selectedRole
  selectedSection: RoleSection; // Maps to selectedCategory
  organizationId?: string;      // Maps to selectedOrganization
}

// Form validation schema updates
const hierarchicalValidation = {
  roleType: validateRoleType.required('Please select a role'),
  selectedSection: z.enum(['system', 'organization']).refine(
    (section) => section !== null,
    'Please select a role category'
  ),
  organizationId: z.string().optional().refine(
    (org, ctx) => {
      const section = ctx.parent.selectedSection;
      return section !== 'organization' || org !== undefined;
    },
    'Organization is required for organization roles'
  )
};
```

### Component Composition

```typescript
// Component hierarchy
HierarchicalRoleSelection
├── StepIndicator                    // Visual progress indicator
├── CategorySelection               // Step 1: Category selection
│   ├── CategoryOption (System)
│   └── CategoryOption (Organization)
└── RoleSelection                   // Step 2: Role selection
    ├── SystemRoleSection          // Conditional system roles
    ├── OrganizationRoleSection    // Conditional org roles
    └── OrganizationSelect         // Conditional org selector
```

## Error Handling Data Model

### Error State Structure

```typescript
interface SelectionError {
  type: 'validation' | 'network' | 'permission';
  step: SelectionStep;
  field?: string;
  message: string;
  code?: string;
}

interface ErrorStateManagement {
  currentError: SelectionError | null;
  errorHistory: SelectionError[];
  clearError: () => void;
  setError: (error: SelectionError) => void;
}
```

### Loading State Management

```typescript
interface LoadingStates {
  categories: boolean;      // Loading category options
  roles: boolean;          // Loading role options
  organizations: boolean;   // Loading organization list
  submission: boolean;     // Form submission in progress
}
```

## Performance Optimization Data

### Memoization Strategy

```typescript
// Memoized computations
const memoizedData = {
  categoryOptions: useMemo(() => getCategoryOptions(), []),
  
  systemRoles: useMemo(() => 
    getRolesByCategory('system'), 
    []
  ),
  
  organizationRoles: useMemo(() => 
    getRolesByCategory('organization'), 
    []
  ),
  
  validationState: useMemo(() => 
    computeValidationState(selectionState), 
    [selectionState]
  )
};
```

### Component Update Optimization

```typescript
// Prevent unnecessary re-renders
const CategorySelectionMemo = React.memo(CategorySelection, (prev, next) => {
  return prev.selectedCategory === next.selectedCategory &&
         prev.error === next.error;
});

const RoleSelectionMemo = React.memo(RoleSelection, (prev, next) => {
  return prev.category === next.category &&
         prev.selectedRole === next.selectedRole &&
         prev.selectedOrganization === next.selectedOrganization &&
         prev.error === next.error;
});
```

## Migration Data Model

### Backward Compatibility

```typescript
interface LegacyMigration {
  // Support for existing role selection data
  legacyRoleType?: 'systemRole' | 'organizationRole';
  legacyRole?: string;
  
  // Migration helpers
  migrateLegacyData: (legacy: any) => HierarchicalSelectionState;
  convertToLegacyFormat: (modern: HierarchicalSelectionState) => any;
}
```

### Feature Flag Support

```typescript
interface FeatureConfiguration {
  enableHierarchicalSelection: boolean;
  fallbackToLegacyUI: boolean;
  allowUserToggle: boolean;
}
```

## Summary

The hierarchical role selection data model maintains clear separation between navigation state, selection state, and UI state while integrating seamlessly with existing TanStack Form validation and Better Auth role systems. The architecture supports progressive disclosure UX patterns while optimizing for performance and accessibility.

**Key Design Principles**:
1. **Single Source of Truth**: Centralized state management
2. **Predictable State Transitions**: Clear step progression rules
3. **Form Integration**: Seamless TanStack Form compatibility
4. **Performance Optimized**: Memoization and conditional rendering
5. **Error Resilient**: Comprehensive error handling and recovery