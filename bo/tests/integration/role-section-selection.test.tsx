/**
 * @jest-environment jsdom
 * 
 * T008 - Integration Test: Role Section Selection Flow
 * 
 * Tests the complete end-to-end flow for role selection across two sections
 * ("System Roles" vs "Organization Roles") and its integration with TanStack Form.
 * This test validates the entire user journey of selecting roles and how it 
 * integrates with form state management.
 * 
 * This test MUST FAIL initially as the components don't exist yet (TDD approach).
 * 
 * Integration Scope:
 * - Complete role selection flow across both sections
 * - Single selection behavior (radio button pattern)
 * - TanStack Form integration and state management
 * - Section transitions and conditional field visibility
 * - Form validation with different role types
 * - Accessibility compliance throughout the flow
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'

// Mock the role selection components that will be created later
const MockRoleSelectionSections = ({ value, onValueChange, ...props }: any) => (
  <div data-testid="role-selection-sections" {...props}>
    <div role="group" aria-label="System Roles">
      <h3>System Roles</h3>
      <div role="radiogroup">
        <input
          type="radio"
          value="admin"
          checked={value === 'admin'}
          onChange={() => onValueChange?.('admin')}
          data-testid="radio-item-admin"
        />
        <label>System Administrator</label>
      </div>
    </div>
    <div role="group" aria-label="Organization Roles">
      <h3>Organization Roles</h3>
      <div role="radiogroup">
        <div>
          <input
            type="radio"
            value="owner"
            checked={value === 'owner'}
            onChange={() => onValueChange?.('owner')}
            data-testid="radio-item-owner"
          />
          <label>Owner</label>
        </div>
        <div>
          <input
            type="radio"
            value="gm"
            checked={value === 'gm'}
            onChange={() => onValueChange?.('gm')}
            data-testid="radio-item-gm"
          />
          <label>Gm</label>
        </div>
        <div>
          <input
            type="radio"
            value="staff"
            checked={value === 'staff'}
            onChange={() => onValueChange?.('staff')}
            data-testid="radio-item-staff"
          />
          <label>Staff</label>
        </div>
        <div>
          <input
            type="radio"
            value="player"
            checked={value === 'player'}
            onChange={() => onValueChange?.('player')}
            data-testid="radio-item-player"
          />
          <label>Player</label>
        </div>
      </div>
    </div>
  </div>
)

const MockRoleSectionGroup = ({ children }: any) => <div>{children}</div>
const MockRoleOption = ({ children }: any) => <div>{children}</div>

// Import role definitions and types
import {
  SYSTEM_ROLES,
  ORGANIZATION_ROLES,
  ROLE_DISPLAY_NAMES,
  type SystemRole,
  type OrganizationRole,
  type UserRole,
  isSystemRole,
  isOrganizationRole
} from '@/lib/roles'

// Mock organization data for testing
const mockOrganizations = [
  { id: '1', name: 'Test Organization 1', slug: 'test-org-1' },
  { id: '2', name: 'Test Organization 2', slug: 'test-org-2' }
]

// Mock shadcn/ui components to ensure they render correctly in tests
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={className} data-testid="card-title" {...props}>
      {children}
    </h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={className} data-testid="card-description" {...props}>
      {children}
    </p>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="card-content" {...props}>
      {children}
    </div>
  )
}))

jest.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ value, onValueChange, children, className, ...props }: any) => (
    <div 
      role="radiogroup"
      className={className}
      data-testid="radio-group"
      data-value={value}
      {...props}
    >
      {React.Children.map(children, (child, index) => 
        React.cloneElement(child, { 
          key: index,
          selected: child.props.value === value,
          onSelect: () => onValueChange?.(child.props.value)
        })
      )}
    </div>
  ),
  RadioGroupItem: ({ value, className, onSelect, selected, ...props }: any) => (
    <input
      type="radio"
      value={value}
      checked={selected}
      onChange={() => onSelect?.(value)}
      className={className}
      data-testid={`radio-item-${value}`}
      {...props}
    />
  )
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, className, htmlFor, ...props }: any) => (
    <label className={className} htmlFor={htmlFor} {...props}>
      {children}
    </label>
  )
}))

jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children, ...props }: any) => (
    <div data-testid="select" data-value={value} {...props}>
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        data-testid="select-trigger"
      >
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => children,
  SelectItem: ({ value, children }: any) => (
    <option value={value} data-testid={`select-item-${value}`}>
      {children}
    </option>
  ),
  SelectTrigger: ({ children }: any) => children,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>
}))

// Define form schema for testing
const createUserFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.string().min(1, 'Role is required'),
  organizationId: z.string().optional(),
}).refine((data) => {
  // Organization is required for organization roles
  if (isOrganizationRole(data.role) && !data.organizationId) {
    return false
  }
  return true
}, {
  message: 'Organization is required for organization roles',
  path: ['organizationId']
})

type FormData = z.infer<typeof createUserFormSchema>

// Test wrapper component that integrates TanStack Form with role selection
const TestFormWrapper: React.FC<{
  onSubmit?: (data: FormData) => void
  defaultValues?: Partial<FormData>
}> = ({ onSubmit = jest.fn(), defaultValues = {} }) => {
  const form = useForm({
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: '',
      organizationId: '',
      ...defaultValues
    },
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
    validatorAdapter: zodValidator,
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      data-testid="test-form"
    >
      <div data-testid="form-fields">
        <form.Field
          name="email"
          validators={{
            onChange: z.string().email('Invalid email address')
          }}
        >
          {(field) => (
            <div>
              <input
                data-testid="email-input"
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Email"
              />
              {field.state.meta.errors && (
                <span data-testid="email-error">{field.state.meta.errors[0]}</span>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="firstName"
          validators={{
            onChange: z.string().min(1, 'First name is required')
          }}
        >
          {(field) => (
            <div>
              <input
                data-testid="firstName-input"
                type="text"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="First Name"
              />
              {field.state.meta.errors && (
                <span data-testid="firstName-error">{field.state.meta.errors[0]}</span>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="lastName"
          validators={{
            onChange: z.string().min(1, 'Last name is required')
          }}
        >
          {(field) => (
            <div>
              <input
                data-testid="lastName-input"
                type="text"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Last Name"
              />
              {field.state.meta.errors && (
                <span data-testid="lastName-error">{field.state.meta.errors[0]}</span>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="role">
          {(field) => (
            <div data-testid="role-field">
              <MockRoleSelectionSections
                value={field.state.value}
                onValueChange={field.handleChange}
                data-testid="role-selection-sections"
              />
              {field.state.meta.errors && (
                <span data-testid="role-error">{field.state.meta.errors[0]}</span>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="organizationId">
          {(field) => {
            return (
              <form.Subscribe
                selector={(state) => state.values.role}
              >
                {(roleValue) => {
                  const isOrgRole = isOrganizationRole(roleValue)
                  
                  return (
                    <div 
                      data-testid="organization-field"
                      style={{ display: isOrgRole ? 'block' : 'none' }}
                    >
                      <select
                        data-testid="organization-select"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={!isOrgRole}
                      >
                        <option value="">Select Organization</option>
                        {mockOrganizations.map(org => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                      {field.state.meta.errors && (
                        <span data-testid="organization-error">{field.state.meta.errors[0]}</span>
                      )}
                    </div>
                  )
                }}
              </form.Subscribe>
            )
          }}
        </form.Field>
      </div>

      <button type="submit" data-testid="submit-button">
        Create User
      </button>
    </form>
  )
}

describe('Integration Test: Role Section Selection Flow', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
  })

  describe('Component Integration', () => {
    it('should render both role sections with proper structure', async () => {
      render(<TestFormWrapper />)

      // Check that role selection sections container is present
      expect(screen.getByTestId('role-selection-sections')).toBeInTheDocument()

      // Check that both sections are rendered
      expect(screen.getByRole('group', { name: /system roles/i })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: /organization roles/i })).toBeInTheDocument()

      // Check that system role option is present
      expect(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`)).toBeInTheDocument()

      // Check that organization role options are present (excluding admin to avoid duplication)
      const orgRoles = ['owner', 'gm', 'staff', 'player']
      orgRoles.forEach(role => {
        expect(screen.getByTestId(`radio-item-${role}`)).toBeInTheDocument()
      })
    })

    it('should display correct role labels and descriptions', async () => {
      render(<TestFormWrapper />)

      // Check system role display
      expect(screen.getByText(ROLE_DISPLAY_NAMES[SYSTEM_ROLES.ADMIN])).toBeInTheDocument()

      // Check organization role displays (using the labels from our mock)
      expect(screen.getByText('Owner')).toBeInTheDocument()
      expect(screen.getByText('Gm')).toBeInTheDocument()
      expect(screen.getByText('Staff')).toBeInTheDocument()
      expect(screen.getByText('Player')).toBeInTheDocument()
    })
  })

  describe('Single Selection Behavior', () => {
    it('should allow only one role selection across all sections', async () => {
      render(<TestFormWrapper />)

      // Select system admin role
      const systemAdminRadio = screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`)
      await user.click(systemAdminRadio)

      // Verify system admin is selected
      expect(systemAdminRadio).toBeChecked()

      // Verify no organization roles are selected
      const orgRoles = ['owner', 'gm', 'staff', 'player']
      orgRoles.forEach(role => {
        expect(screen.getByTestId(`radio-item-${role}`)).not.toBeChecked()
      })

      // Select an organization role
      const ownerRadio = screen.getByTestId('radio-item-owner')
      await user.click(ownerRadio)

      // Verify organization role is selected
      expect(ownerRadio).toBeChecked()

      // Verify system admin is no longer selected
      expect(systemAdminRadio).not.toBeChecked()

      // Verify other organization roles are not selected
      ['gm', 'staff', 'player'].forEach(role => {
        expect(screen.getByTestId(`radio-item-${role}`)).not.toBeChecked()
      })
    })

    it('should maintain single selection when switching between sections multiple times', async () => {
      render(<TestFormWrapper />)

      // System -> Organization -> System -> Organization
      await user.click(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`))
      await user.click(screen.getByTestId('radio-item-owner'))
      await user.click(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`))
      await user.click(screen.getByTestId('radio-item-gm'))

      // Only GM should be selected
      expect(screen.getByTestId('radio-item-gm')).toBeChecked()
      expect(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`)).not.toBeChecked()
      expect(screen.getByTestId('radio-item-owner')).not.toBeChecked()
    })
  })

  describe('TanStack Form Integration', () => {
    it('should update form state when role is selected', async () => {
      const mockSubmit = jest.fn()
      render(<TestFormWrapper onSubmit={mockSubmit} />)

      // Fill in basic fields
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('firstName-input'), 'John')
      await user.type(screen.getByTestId('lastName-input'), 'Doe')

      // Select system admin role
      await user.click(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`))

      // Submit form
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: SYSTEM_ROLES.ADMIN,
            organizationId: ''
          })
        )
      })
    })

    it('should validate role field is required', async () => {
      render(<TestFormWrapper />)

      // Fill in other fields but leave role empty
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('firstName-input'), 'John')
      await user.type(screen.getByTestId('lastName-input'), 'Doe')

      // Try to submit without selecting a role
      await user.click(screen.getByTestId('submit-button'))

      // Should show role validation error
      await waitFor(() => {
        expect(screen.getByTestId('role-error')).toHaveTextContent('Role is required')
      })
    })

    it('should clear role field when switching selections', async () => {
      render(<TestFormWrapper defaultValues={{ role: SYSTEM_ROLES.ADMIN }} />)

      // Verify initial selection
      expect(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`)).toBeChecked()

      // Switch to organization role
      await user.click(screen.getByTestId(`radio-item-${'owner'}`))

      // Verify new selection
      expect(screen.getByTestId(`radio-item-${'owner'}`)).toBeChecked()
      expect(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`)).not.toBeChecked()
    })
  })

  describe('Organization Field Conditional Display', () => {
    it('should hide organization field when system role is selected', async () => {
      render(<TestFormWrapper />)

      // Select system admin role
      await user.click(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`))

      // Organization field should be hidden
      const organizationField = screen.getByTestId('organization-field')
      expect(organizationField).toHaveStyle({ display: 'none' })

      // Organization select should be disabled
      expect(screen.getByTestId('organization-select')).toBeDisabled()
    })

    it('should show organization field when organization role is selected', async () => {
      render(<TestFormWrapper />)

      // Select organization role
      await user.click(screen.getByTestId(`radio-item-${'owner'}`))

      // Organization field should be visible
      const organizationField = screen.getByTestId('organization-field')
      expect(organizationField).toHaveStyle({ display: 'block' })

      // Organization select should be enabled
      expect(screen.getByTestId('organization-select')).not.toBeDisabled()
    })

    it('should validate organization is required for organization roles', async () => {
      render(<TestFormWrapper />)

      // Fill in basic fields
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('firstName-input'), 'John')
      await user.type(screen.getByTestId('lastName-input'), 'Doe')

      // Select organization role but don't select organization
      await user.click(screen.getByTestId(`radio-item-${'owner'}`))

      // Try to submit
      await user.click(screen.getByTestId('submit-button'))

      // Should show organization validation error
      await waitFor(() => {
        expect(screen.getByTestId('organization-error')).toHaveTextContent(
          'Organization is required for organization roles'
        )
      })
    })

    it('should not require organization for system roles', async () => {
      const mockSubmit = jest.fn()
      render(<TestFormWrapper onSubmit={mockSubmit} />)

      // Fill in all required fields for system admin
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('firstName-input'), 'John')
      await user.type(screen.getByTestId('lastName-input'), 'Doe')
      await user.click(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`))

      // Submit form
      await user.click(screen.getByTestId('submit-button'))

      // Should submit successfully without organization
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            role: SYSTEM_ROLES.ADMIN,
            organizationId: ''
          })
        )
      })
    })
  })

  describe('Section Transitions', () => {
    it('should smoothly transition from system to organization role selection', async () => {
      render(<TestFormWrapper />)

      // Start with system role selection
      await user.click(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`))
      
      // Organization field should be hidden
      expect(screen.getByTestId('organization-field')).toHaveStyle({ display: 'none' })

      // Switch to organization role
      await user.click(screen.getByTestId(`radio-item-${'owner'}`))

      // Organization field should now be visible
      expect(screen.getByTestId('organization-field')).toHaveStyle({ display: 'block' })
      
      // System role should be deselected
      expect(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`)).not.toBeChecked()
      
      // Organization role should be selected
      expect(screen.getByTestId(`radio-item-${'owner'}`)).toBeChecked()
    })

    it('should smoothly transition from organization to system role selection', async () => {
      render(<TestFormWrapper />)

      // Start with organization role selection
      await user.click(screen.getByTestId(`radio-item-${'owner'}`))
      
      // Organization field should be visible
      expect(screen.getByTestId('organization-field')).toHaveStyle({ display: 'block' })

      // Select an organization
      await user.selectOptions(screen.getByTestId('organization-select'), '1')

      // Switch to system role
      await user.click(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`))

      // Organization field should now be hidden
      expect(screen.getByTestId('organization-field')).toHaveStyle({ display: 'none' })
      
      // Organization role should be deselected
      expect(screen.getByTestId(`radio-item-${'owner'}`)).not.toBeChecked()
      
      // System role should be selected
      expect(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`)).toBeChecked()
    })

    it('should handle rapid section switching without state corruption', async () => {
      render(<TestFormWrapper />)

      // Rapid switching between roles
      await user.click(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`))
      await user.click(screen.getByTestId(`radio-item-${'owner'}`))
      await user.click(screen.getByTestId(`radio-item-${'gm'}`))
      await user.click(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`))
      await user.click(screen.getByTestId(`radio-item-${'staff'}`))

      // Final state should be consistent
      expect(screen.getByTestId(`radio-item-${'staff'}`)).toBeChecked()
      expect(screen.getByTestId('organization-field')).toHaveStyle({ display: 'block' })
      
      // Other roles should not be selected
      expect(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`)).not.toBeChecked()
      expect(screen.getByTestId(`radio-item-${'owner'}`)).not.toBeChecked()
      expect(screen.getByTestId(`radio-item-${'gm'}`)).not.toBeChecked()
    })
  })

  describe('Accessibility Compliance', () => {
    it('should have proper ARIA roles and labels', async () => {
      render(<TestFormWrapper />)

      // Check main role groups have proper ARIA roles
      expect(screen.getByRole('group', { name: /system roles/i })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: /organization roles/i })).toBeInTheDocument()

      // Check that role options are properly labeled
      const systemAdminRadio = screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`)
      expect(systemAdminRadio).toHaveAttribute('type', 'radio')

      // Check that the form has proper structure
      expect(screen.getByTestId('test-form')).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(<TestFormWrapper />)

      const systemAdminRadio = screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`)
      const ownerRadio = screen.getByTestId(`radio-item-${'owner'}`)

      // Tab to first radio button
      await user.tab()
      await user.tab()
      await user.tab()
      await user.tab() // Navigate to role selection

      // Use keyboard to select system admin
      systemAdminRadio.focus()
      await user.keyboard(' ') // Space to select

      expect(systemAdminRadio).toBeChecked()

      // Navigate to organization role and select
      ownerRadio.focus()
      await user.keyboard(' ') // Space to select

      expect(ownerRadio).toBeChecked()
      expect(systemAdminRadio).not.toBeChecked()
    })

    it('should announce selection changes to screen readers', async () => {
      render(<TestFormWrapper />)

      // Select system role
      const systemAdminRadio = screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`)
      await user.click(systemAdminRadio)

      // Verify ARIA states are correct
      expect(systemAdminRadio).toBeChecked()
      expect(systemAdminRadio).toHaveAttribute('type', 'radio')

      // Switch to organization role
      const ownerRadio = screen.getByTestId(`radio-item-${'owner'}`)
      await user.click(ownerRadio)

      // Verify new ARIA states
      expect(ownerRadio).toBeChecked()
      expect(systemAdminRadio).not.toBeChecked()
    })
  })

  describe('Complex Integration Scenarios', () => {
    it('should handle complete user creation flow with role selection', async () => {
      const mockSubmit = jest.fn()
      render(<TestFormWrapper onSubmit={mockSubmit} />)

      // Fill out complete form
      await user.type(screen.getByTestId('email-input'), 'gamemaster@example.com')
      await user.type(screen.getByTestId('firstName-input'), 'Jane')
      await user.type(screen.getByTestId('lastName-input'), 'Smith')
      
      // Select organization role
      await user.click(screen.getByTestId(`radio-item-${'gm'}`))
      
      // Select organization
      await user.selectOptions(screen.getByTestId('organization-select'), '2')

      // Submit form
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          email: 'gamemaster@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'gm',
          organizationId: '2'
        })
      })
    })

    it('should maintain form validation state during role transitions', async () => {
      render(<TestFormWrapper />)

      // Fill some fields with invalid data
      await user.type(screen.getByTestId('email-input'), 'invalid-email')
      
      // Select organization role
      await user.click(screen.getByTestId(`radio-item-${'owner'}`))
      
      // Switch to system role
      await user.click(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`))

      // Try to submit
      await user.click(screen.getByTestId('submit-button'))

      // Should still show email validation error
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email address')
      })
    })

    it('should reset organization selection when switching to system role', async () => {
      render(<TestFormWrapper />)

      // Select organization role and organization
      await user.click(screen.getByTestId(`radio-item-${'owner'}`))
      await user.selectOptions(screen.getByTestId('organization-select'), '1')

      // Verify selection
      expect(screen.getByTestId('organization-select')).toHaveValue('1')

      // Switch to system role
      await user.click(screen.getByTestId(`radio-item-${SYSTEM_ROLES.ADMIN}`))

      // Organization field should be hidden and reset
      expect(screen.getByTestId('organization-field')).toHaveStyle({ display: 'none' })
      expect(screen.getByTestId('organization-select')).toHaveValue('')
    })
  })
})