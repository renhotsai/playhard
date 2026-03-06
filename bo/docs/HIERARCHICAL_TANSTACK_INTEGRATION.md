# Hierarchical Role Selection + TanStack Form Integration Guide

This guide demonstrates how to integrate the hierarchical role selection component with TanStack Form for optimal form state management and validation.

## Overview

The integration provides:
- ✅ **Seamless form state management** using TanStack Form patterns
- ✅ **Bi-directional data flow** between hierarchical component and form
- ✅ **Synchronized validation** combining Zod schemas with hierarchical validation
- ✅ **Type-safe integration** with full TypeScript support
- ✅ **Real-time validation feedback** with debouncing
- ✅ **Multi-step form support** with progress tracking

## Quick Start

### 1. Basic Integration

```typescript
import { HierarchicalRoleForm } from '@/components/forms/hierarchical-role-form'

export function CreateUserPage() {
  const handleSubmit = async (data) => {
    console.log('Form data:', data)
    // Handle form submission
  }

  return (
    <HierarchicalRoleForm
      onSubmit={handleSubmit}
      title="Create New User"
      submitText="Create User"
    />
  )
}
```

### 2. Field-Level Integration

```typescript
import { useForm } from '@tanstack/react-form'
import { HierarchicalRoleSelection } from '@/components/forms/hierarchical-role-selection'
import { useHierarchicalFormField } from '@/hooks/use-hierarchical-form-field'

export function CustomForm() {
  const form = useForm({
    defaultValues: {
      name: '',
      roleSelection: {
        selectedCategory: null,
        selectedRole: null,
        selectedOrganization: null,
        currentStep: 'category'
      }
    }
  })

  return (
    <form onSubmit={form.handleSubmit}>
      <form.Field
        name="roleSelection"
        children={(field) => {
          const { value, onChange, validation } = useHierarchicalFormField({
            field,
            validation: { realtime: true }
          })

          return (
            <HierarchicalRoleSelection
              value={value}
              onChange={onChange}
              onValidationChange={(v) => console.log('Validation:', v)}
            />
          )
        }}
      />
    </form>
  )
}
```

## Integration Patterns

### Pattern 1: Complete Form Component

**Use Case**: Ready-to-use form with hierarchical role selection built-in.

```typescript
import { HierarchicalRoleForm } from '@/components/forms/hierarchical-role-form'

export function CreateOrgMember({ organizationId }: { organizationId: string }) {
  const handleSubmit = async (data) => {
    await createUser({
      ...data,
      organizationId
    })
  }

  return (
    <HierarchicalRoleForm
      defaultValues={{
        roleSelection: {
          selectedCategory: 'organization',
          selectedOrganization: organizationId,
          selectedRole: null,
          currentStep: 'role'
        }
      }}
      onSubmit={handleSubmit}
      title="Add Team Member"
    />
  )
}
```

### Pattern 2: Field-Level Integration

**Use Case**: Custom form with hierarchical role selection as one field.

```typescript
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { HierarchicalRoleSelection } from '@/components/forms/hierarchical-role-selection'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  roleSelection: z.object({
    selectedCategory: z.enum(['system', 'organization']).nullable(),
    selectedRole: z.string().nullable(),
    selectedOrganization: z.string().nullable(),
    currentStep: z.enum(['category', 'role'])
  })
})

export function CustomUserForm() {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      roleSelection: {
        selectedCategory: null,
        selectedRole: null,
        selectedOrganization: null,
        currentStep: 'category'
      }
    },
    validatorAdapter: zodValidator,
    validators: { onChange: schema }
  })

  return (
    <form onSubmit={form.handleSubmit}>
      {/* Regular form fields */}
      <form.Field name="name" children={(field) => (
        <Input
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      )} />

      {/* Hierarchical role selection field */}
      <form.Field name="roleSelection" children={(field) => (
        <HierarchicalRoleSelection
          value={field.state.value}
          onChange={field.handleChange}
          error={field.state.meta.errors[0]}
        />
      )} />

      <Button type="submit">Submit</Button>
    </form>
  )
}
```

### Pattern 3: Advanced Hook Integration

**Use Case**: Maximum control with custom validation and callbacks.

```typescript
import { useHierarchicalFormField } from '@/hooks/use-hierarchical-form-field'

export function AdvancedRoleForm() {
  const form = useForm({ /* ... */ })

  return (
    <form.Field name="roleSelection" children={(field) => {
      const {
        value,
        onChange,
        validation,
        fieldState,
        actions
      } = useHierarchicalFormField({
        field,
        validation: {
          realtime: true,
          debounceMs: 500,
          customValidator: (value) => {
            // Custom validation logic
            return { isValid: true, errors: {}, step: 'category' }
          }
        },
        callbacks: {
          onValidationChange: (validation) => {
            console.log('Validation changed:', validation)
          },
          onStepChange: (step) => {
            console.log('Step changed:', step)
          },
          onComplete: (value) => {
            console.log('Selection complete:', value)
          }
        }
      })

      return (
        <div>
          <HierarchicalRoleSelection
            value={value}
            onChange={onChange}
            disabled={fieldState.isValidating}
          />
          
          {/* Custom validation display */}
          {!validation.isValid && (
            <div className="text-red-600">
              {Object.values(validation.errors).join(', ')}
            </div>
          )}

          {/* Custom actions */}
          <div className="flex gap-2 mt-4">
            <Button onClick={actions.reset} variant="outline">
              Reset Selection
            </Button>
            <Button onClick={actions.validate}>
              Validate Now
            </Button>
          </div>
        </div>
      )
    }} />
  )
}
```

## Validation Integration

### Schema-Based Validation

The integration combines Zod schema validation with hierarchical-specific validation:

```typescript
const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  roleSelection: z.object({
    selectedCategory: z.enum(['system', 'organization']).nullable(),
    selectedRole: z.string().nullable(),
    selectedOrganization: z.string().nullable(),
    currentStep: z.enum(['category', 'role'])
  }).refine((data) => {
    // Custom validation: organization required for org roles
    if (data.selectedCategory === 'organization') {
      return data.selectedOrganization !== null
    }
    return true
  }, {
    message: 'Organization is required for organization roles',
    path: ['selectedOrganization']
  })
})
```

### Real-Time Validation

```typescript
const { validation } = useHierarchicalFormField({
  field,
  validation: {
    realtime: true,        // Enable real-time validation
    debounceMs: 300,       // Debounce validation calls
    customValidator: (value) => {
      // Your custom validation logic
      return validateHierarchicalForm(value)
    }
  },
  callbacks: {
    onValidationChange: (validation) => {
      // React to validation changes
      if (!validation.isValid) {
        console.log('Validation errors:', validation.errors)
      }
    }
  }
})
```

## State Management

### Form State Flow

```
User Interaction
       ↓
Hierarchical Component
       ↓
onChange handler
       ↓
TanStack Form Field
       ↓
Form validation
       ↓
UI updates
```

### Bi-Directional Data Flow

```typescript
// Parent form → Hierarchical component
<HierarchicalRoleSelection
  value={field.state.value}  // Form state → Component
  onChange={field.handleChange}  // Component → Form state
/>

// With validation synchronization
const handleChange = (data) => {
  field.handleChange(data)  // Update form field
  validateSelection(data)   // Trigger validation
  onValidationChange(result)  // Sync validation state
}
```

## Error Handling

### Validation Error Types

```typescript
interface HierarchicalValidationResult {
  isValid: boolean
  errors: Record<string, string>  // Field-specific errors
  step: SelectionStep             // Current validation step
}

// Example error states
const validationErrors = {
  selectedCategory: 'Please select a role category',
  selectedRole: 'Please select a specific role',
  selectedOrganization: 'Organization is required for this role'
}
```

### Error Display Patterns

```typescript
<form.Field name="roleSelection" children={(field) => (
  <div>
    <HierarchicalRoleSelection
      value={field.state.value}
      onChange={field.handleChange}
    />
    
    {/* TanStack Form errors */}
    {field.state.meta.errors.map((error, index) => (
      <p key={index} className="text-red-600">{error}</p>
    ))}
    
    {/* Hierarchical validation errors */}
    {hierarchicalValidation && !hierarchicalValidation.isValid && (
      <div>
        {Object.entries(hierarchicalValidation.errors).map(([field, error]) => (
          <p key={field} className="text-red-600">{error}</p>
        ))}
      </div>
    )}
  </div>
)} />
```

## Performance Optimization

### Debounced Validation

```typescript
const { onChange } = useHierarchicalFormField({
  field,
  validation: {
    debounceMs: 500  // Wait 500ms before validating
  }
})
```

### Memoized Callbacks

```typescript
const handleValidationChange = useCallback((validation) => {
  setValidationState(validation)
}, [])

const handleStepChange = useCallback((step) => {
  trackAnalytics('role_selection_step', { step })
}, [])
```

## Testing Patterns

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { HierarchicalRoleForm } from '@/components/forms/hierarchical-role-form'

test('submits form with valid hierarchical role selection', async () => {
  const mockSubmit = jest.fn()
  
  render(<HierarchicalRoleForm onSubmit={mockSubmit} />)
  
  // Fill basic fields
  fireEvent.change(screen.getByLabelText(/name/i), {
    target: { value: 'John Doe' }
  })
  
  // Navigate hierarchical selection
  fireEvent.click(screen.getByText('Organization'))
  fireEvent.click(screen.getByText('Game Master'))
  
  // Submit form
  fireEvent.click(screen.getByText('Create User'))
  
  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      roleSelection: {
        selectedCategory: 'organization',
        selectedRole: 'game_master',
        selectedOrganization: expect.any(String),
        currentStep: 'role'
      }
    })
  })
})
```

### Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react'
import { useHierarchicalFormField } from '@/hooks/use-hierarchical-form-field'

test('validates hierarchical field changes', () => {
  const mockField = createMockField()
  
  const { result } = renderHook(() => 
    useHierarchicalFormField({ field: mockField })
  )
  
  act(() => {
    result.current.onChange({
      selectedCategory: 'organization',
      selectedRole: 'game_master',
      selectedOrganization: null,
      currentStep: 'role'
    })
  })
  
  expect(result.current.validation.isValid).toBe(false)
  expect(result.current.validation.errors.selectedOrganization).toBeDefined()
})
```

## Best Practices

1. **Use Complete Form Component** for standard user creation flows
2. **Use Field-Level Integration** for custom forms with multiple complex fields
3. **Use Hook Integration** for maximum control and custom validation
4. **Enable real-time validation** for better user experience
5. **Implement proper error handling** for both TanStack and hierarchical errors
6. **Use TypeScript** for type safety throughout the integration
7. **Test both form submission and validation flows** thoroughly
8. **Debounce validation** to reduce unnecessary API calls

## File References

- **Main Form Component**: `/src/components/forms/hierarchical-role-form.tsx`
- **Field Hook**: `/src/hooks/use-hierarchical-form-field.ts`
- **Usage Example**: `/src/components/forms/create-user-with-hierarchical-role.tsx`
- **Type Definitions**: `/src/types/hierarchical-roles.ts`
- **Validation**: `/src/lib/hierarchical-validation.ts`