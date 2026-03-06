'use client'

import React from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { HierarchicalRoleSelection } from './hierarchical-role-selection/hierarchical-role-selection'
import { toast } from 'sonner'
import type {
  RoleType,
  RoleCategory,
  SelectionStep,
  HierarchicalValidationResult
} from '@/types/hierarchical-roles'

// ============================================================================
// Validation Schema
// ============================================================================

const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  description: z.string().optional(),
  
  // Hierarchical role selection fields
  roleSelection: z.object({
    selectedCategory: z.enum(['system', 'organization'], {
      errorMap: () => ({ message: 'Please select a role category' })
    }).nullable(),
    selectedRole: z.enum([
      'system_admin',
      'organization_owner', 
      'organization_admin',
      'game_master',
      'game_staff',
      'game_player'
    ], {
      errorMap: () => ({ message: 'Please select a specific role' })
    }).nullable(),
    selectedOrganization: z.string().uuid().nullable(),
    currentStep: z.enum(['category', 'role'])
  }).refine((data) => {
    // Validate step completion
    if (data.currentStep === 'role' && !data.selectedCategory) {
      return false
    }
    return true
  }, {
    message: 'Please complete the role selection process',
    path: ['selectedCategory']
  }).refine((data) => {
    // Validate organization requirement for organization roles
    const organizationRoles: RoleType[] = [
      'organization_owner',
      'organization_admin', 
      'game_master',
      'game_staff',
      'game_player'
    ]
    
    if (data.selectedRole && organizationRoles.includes(data.selectedRole)) {
      return data.selectedOrganization !== null
    }
    return true
  }, {
    message: 'Organization is required for this role',
    path: ['selectedOrganization']
  })
})

type UserFormData = z.infer<typeof userFormSchema>

// ============================================================================
// Form Component Props
// ============================================================================

interface HierarchicalRoleFormProps {
  /** Initial form values */
  defaultValues?: Partial<UserFormData>
  /** Form submission handler */
  onSubmit: (data: UserFormData) => Promise<void>
  /** Cancel handler */
  onCancel?: () => void
  /** Loading state */
  isSubmitting?: boolean
  /** Form title */
  title?: string
  /** Submit button text */
  submitText?: string
}

// ============================================================================
// Main Form Component
// ============================================================================

export function HierarchicalRoleForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  title = 'Create User',
  submitText = 'Create User'
}: HierarchicalRoleFormProps) {
  
  // Initialize form with TanStack Form
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      description: '',
      roleSelection: {
        selectedCategory: null,
        selectedRole: null,
        selectedOrganization: null,
        currentStep: 'category' as SelectionStep
      },
      ...defaultValues
    } as UserFormData,
    validatorAdapter: zodValidator,
    validators: {
      onChange: userFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value)
        toast.success(`${title.split(' ')[1]} created successfully!`)
      } catch (error) {
        toast.error(`Failed to ${title.toLowerCase()}`)
        throw error
      }
    },
  })

  // Track hierarchical validation state
  const [hierarchicalValidation, setHierarchicalValidation] = 
    React.useState<HierarchicalValidationResult | null>(null)

  // Handle hierarchical role selection changes
  const handleRoleSelectionChange = (roleData: {
    selectedCategory: RoleCategory | null
    selectedRole: RoleType | null
    selectedOrganization: string | null
    currentStep: SelectionStep
  }) => {
    // Update form field using TanStack Form's field API
    form.setFieldValue('roleSelection', {
      selectedCategory: roleData.selectedCategory,
      selectedRole: roleData.selectedRole,
      selectedOrganization: roleData.selectedOrganization,
      currentStep: roleData.currentStep
    })
  }

  // Handle hierarchical validation updates
  const handleValidationChange = (validation: HierarchicalValidationResult) => {
    setHierarchicalValidation(validation)
    
    // Manually trigger validation for the roleSelection field
    // This ensures TanStack Form's validation state stays in sync
    form.validateField('roleSelection', 'change')
  }

  // Calculate form submission eligibility
  const canSubmit = React.useMemo(() => {
    return (
      form.state.canSubmit &&
      !form.state.isSubmitting &&
      !isSubmitting &&
      hierarchicalValidation?.isValid === true
    )
  }, [
    form.state.canSubmit,
    form.state.isSubmitting,
    isSubmitting,
    hierarchicalValidation?.isValid
  ])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-8"
        >
          {/* Basic User Information */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <form.Field
                name="name"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter full name"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              />

              <form.Field
                name="email"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter email address"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <form.Field
              name="description"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Description (Optional)</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Brief description about this user"
                    rows={3}
                  />
                </div>
              )}
            />
          </div>

          {/* Hierarchical Role Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">
                Role Assignment <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Select the role category and specific role for this user
              </p>
            </div>

            <form.Field
              name="roleSelection"
              children={(field) => (
                <div className="space-y-2">
                  <HierarchicalRoleSelection
                    value={field.state.value}
                    onChange={handleRoleSelectionChange}
                    onValidationChange={handleValidationChange}
                    disabled={form.state.isSubmitting || isSubmitting}
                    loading={form.state.isSubmitting || isSubmitting}
                    showSearch={true}
                    showProgress={true}
                  />
                  
                  {/* Show TanStack Form validation errors */}
                  {field.state.meta.errors.length > 0 && (
                    <div className="space-y-1">
                      {field.state.meta.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-600">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                  
                  {/* Show hierarchical validation errors */}
                  {hierarchicalValidation && !hierarchicalValidation.isValid && (
                    <div className="space-y-1">
                      {Object.entries(hierarchicalValidation.errors).map(([fieldName, error]) => (
                        <p key={fieldName} className="text-sm text-red-600">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={form.state.isSubmitting || isSubmitting}
              >
                Cancel
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={!canSubmit}
              className="min-w-[120px]"
            >
              {form.state.isSubmitting || isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating...
                </>
              ) : (
                submitText
              )}
            </Button>
          </div>

          {/* Development Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-8 p-4 bg-muted rounded-lg text-xs">
              <summary className="cursor-pointer font-medium">
                Form Debug Info
              </summary>
              <pre className="mt-2 overflow-auto text-xs">
                {JSON.stringify({
                  formValues: form.state.values,
                  formCanSubmit: form.state.canSubmit,
                  formIsSubmitting: form.state.isSubmitting,
                  hierarchicalValidation,
                  canSubmit,
                  formErrors: form.state.errors,
                }, null, 2)}
              </pre>
            </details>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Convenience Hook for Form Integration
// ============================================================================

/**
 * Custom hook for managing hierarchical role form state
 * Provides abstractions for common form operations
 */
export function useHierarchicalRoleForm(options: {
  defaultValues?: Partial<UserFormData>
  onSubmit: (data: UserFormData) => Promise<void>
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const handleSubmit = async (data: UserFormData) => {
    setIsSubmitting(true)
    try {
      await options.onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isSubmitting,
    handleSubmit,
    defaultValues: options.defaultValues
  }
}

export default HierarchicalRoleForm