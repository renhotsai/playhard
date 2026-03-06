/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// Import component - this will fail until component is implemented (TDD approach)
import { HierarchicalRoleSelection } from '@/components/forms/hierarchical-role-selection/hierarchical-role-selection'
import type {
  HierarchicalRoleSelectionProps,
  RoleSelectionData,
  RoleType,
  RoleCategory,
  HierarchicalSelectionState
} from '@/types/hierarchical-roles'

// Mock sub-components to ensure they render correctly in tests
jest.mock('@/components/forms/hierarchical-role-selection/category-selection', () => ({
  CategorySelection: ({ categories, selectedCategory, onSelect, disabled, loading, error, ...props }: any) => (
    <div 
      data-testid="category-selection"
      className={disabled ? 'disabled' : loading ? 'loading' : ''}
      {...props}
    >
      <h3>Category Selection</h3>
      {error && <div data-testid="category-error">{error}</div>}
      {categories.map((category: any) => (
        <button
          key={category.id}
          data-testid={`category-${category.id}`}
          className={selectedCategory === category.id ? 'selected' : ''}
          onClick={() => !disabled && !loading && onSelect(category.id)}
          disabled={disabled || loading}
        >
          {category.title}
        </button>
      ))}
    </div>
  )
}))

jest.mock('@/components/forms/hierarchical-role-selection/role-selection-step', () => ({
  RoleSelectionStep: ({ roles, category, selectedRole, onSelect, disabled, loading, error, showSearch, searchQuery, onSearchChange, ...props }: any) => (
    <div 
      data-testid="role-selection-step"
      className={disabled ? 'disabled' : loading ? 'loading' : ''}
      {...props}
    >
      <h3>Role Selection - {category}</h3>
      {error && <div data-testid="role-error">{error}</div>}
      {showSearch && (
        <input
          data-testid="role-search"
          value={searchQuery || ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search roles..."
          disabled={disabled || loading}
        />
      )}
      {roles.map((role: any) => (
        <button
          key={role.id}
          data-testid={`role-${role.id}`}
          className={selectedRole === role.id ? 'selected' : ''}
          onClick={() => !disabled && !loading && onSelect(role.id)}
          disabled={disabled || loading}
        >
          {role.title}
        </button>
      ))}
    </div>
  )
}))

jest.mock('@/components/forms/hierarchical-role-selection/step-indicator', () => ({
  StepIndicator: ({ currentStep, completedSteps, selectedCategory, progress, onStepClick, disabled, ...props }: any) => (
    <div 
      data-testid="step-indicator"
      className={disabled ? 'disabled' : ''}
      {...props}
    >
      <div data-testid={`step-category`} className={currentStep === 'category' ? 'current' : completedSteps.includes('category') ? 'completed' : 'pending'}>
        <button 
          onClick={() => !disabled && onStepClick('category')}
          disabled={disabled}
        >
          Category
        </button>
      </div>
      <div data-testid={`step-role`} className={currentStep === 'role' ? 'current' : completedSteps.includes('role') ? 'completed' : 'pending'}>
        <button 
          onClick={() => !disabled && onStepClick('role')}
          disabled={disabled}
        >
          Role {selectedCategory && `(${selectedCategory})`}
        </button>
      </div>
      {progress && <div data-testid="progress" style={{ width: `${progress}%` }} />}
    </div>
  )
}))

// Mock Organization Selection component for organization roles
jest.mock('@/components/forms/hierarchical-role-selection/organization-selection', () => ({
  OrganizationSelection: ({ selectedOrganization, onSelect, disabled, loading, error, ...props }: any) => (
    <div 
      data-testid="organization-selection"
      className={disabled ? 'disabled' : loading ? 'loading' : ''}
      {...props}
    >
      <h3>Organization Selection</h3>
      {error && <div data-testid="organization-error">{error}</div>}
      <select
        data-testid="organization-select"
        value={selectedOrganization || ''}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled || loading}
      >
        <option value="">Select organization...</option>
        <option value="org-1">Organization 1</option>
        <option value="org-2">Organization 2</option>
      </select>
    </div>
  )
}))

describe('HierarchicalRoleSelection Component Integration Tests', () => {
  const mockOnChange = jest.fn()
  const mockOnValidationChange = jest.fn()

  const defaultProps: HierarchicalRoleSelectionProps = {
    onChange: mockOnChange,
    onValidationChange: mockOnValidationChange
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Interface & Props Contract', () => {
    it('should accept all required props according to HierarchicalRoleSelectionProps interface', () => {
      const testProps: HierarchicalRoleSelectionProps = {
        value: {
          selectedCategory: 'organization',
          selectedRole: 'organization_owner',
          selectedOrganization: 'org-1',
          currentStep: 'role'
        },
        onChange: mockOnChange,
        onValidationChange: mockOnValidationChange,
        disabled: false,
        loading: false,
        error: 'Test error message',
        showSearch: true,
        showProgress: true,
        className: 'test-custom-class',
        'data-testid': 'custom-test-id'
      }

      const { container } = render(<HierarchicalRoleSelection {...testProps} />)
      
      // Component should render without errors
      expect(container.firstChild).toBeInTheDocument()
      
      // Should have custom test ID
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument()
      
      // Should apply custom className
      expect(container.firstChild).toHaveClass('test-custom-class')
    })

    it('should handle minimal props (only required onChange and onValidationChange)', () => {
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      expect(screen.getByTestId('hierarchical-role-selection')).toBeInTheDocument()
    })

    it('should use default data-testid when not provided', () => {
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      expect(screen.getByTestId('hierarchical-role-selection')).toBeInTheDocument()
    })
  })

  describe('Step Flow Integration', () => {
    it('should start with category selection step', () => {
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Should show category selection
      expect(screen.getByTestId('category-selection')).toBeInTheDocument()
      expect(screen.getByText('Category Selection')).toBeInTheDocument()
      
      // Should not show role selection initially
      expect(screen.queryByTestId('role-selection-step')).not.toBeInTheDocument()
      
      // Step indicator should show category as current
      const stepIndicator = screen.getByTestId('step-indicator')
      const categoryStep = within(stepIndicator).getByTestId('step-category')
      expect(categoryStep).toHaveClass('current')
    })

    it('should proceed to role selection after category is selected', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Select organization category
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      // Should now show role selection step
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
        expect(screen.getByText('Role Selection - organization')).toBeInTheDocument()
      })
      
      // Step indicator should show role as current
      const stepIndicator = screen.getByTestId('step-indicator')
      const roleStep = within(stepIndicator).getByTestId('step-role')
      expect(roleStep).toHaveClass('current')
      
      // Category step should be completed
      const categoryStep = within(stepIndicator).getByTestId('step-category')
      expect(categoryStep).toHaveClass('completed')
    })

    it('should show organization selection for organization roles', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Select organization category
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      // Select an organization role
      const organizationOwnerRole = screen.getByTestId('role-organization_owner')
      await user.click(organizationOwnerRole)
      
      // Should show organization selection
      await waitFor(() => {
        expect(screen.getByTestId('organization-selection')).toBeInTheDocument()
        expect(screen.getByText('Organization Selection')).toBeInTheDocument()
      })
    })

    it('should not show organization selection for system roles', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Select system category
      const systemCategory = screen.getByTestId('category-system')
      await user.click(systemCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      // Select system admin role
      const systemAdminRole = screen.getByTestId('role-system_admin')
      await user.click(systemAdminRole)
      
      // Should not show organization selection
      expect(screen.queryByTestId('organization-selection')).not.toBeInTheDocument()
    })
  })

  describe('Step Navigation', () => {
    it('should allow navigation back to category step from role step', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Progress to role step
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      // Click on category step in step indicator
      const stepIndicator = screen.getByTestId('step-indicator')
      const categoryStep = within(stepIndicator).getByTestId('step-category')
      const categoryButton = within(categoryStep).getByRole('button')
      await user.click(categoryButton)
      
      // Should return to category selection
      await waitFor(() => {
        expect(screen.getByTestId('category-selection')).toBeInTheDocument()
        expect(screen.queryByTestId('role-selection-step')).not.toBeInTheDocument()
      })
    })

    it('should preserve selected category when navigating back', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Select organization category and proceed
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      // Navigate back to category
      const stepIndicator = screen.getByTestId('step-indicator')
      const categoryStep = within(stepIndicator).getByTestId('step-category')
      const categoryButton = within(categoryStep).getByRole('button')
      await user.click(categoryButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('category-selection')).toBeInTheDocument()
      })
      
      // Organization category should still be selected
      const orgCategoryButton = screen.getByTestId('category-organization')
      expect(orgCategoryButton).toHaveClass('selected')
    })

    it('should reset role selection when changing categories', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Select organization category and role
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      const organizationOwnerRole = screen.getByTestId('role-organization_owner')
      await user.click(organizationOwnerRole)
      
      // Navigate back and select system category
      const stepIndicator = screen.getByTestId('step-indicator')
      const categoryStep = within(stepIndicator).getByTestId('step-category')
      const categoryButton = within(categoryStep).getByRole('button')
      await user.click(categoryButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('category-selection')).toBeInTheDocument()
      })
      
      const systemCategory = screen.getByTestId('category-system')
      await user.click(systemCategory)
      
      // Should proceed to role selection with no role selected
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      // No role should be selected
      const systemAdminRole = screen.getByTestId('role-system_admin')
      expect(systemAdminRole).not.toHaveClass('selected')
    })
  })

  describe('Data Management & Callbacks', () => {
    it('should call onChange with correct data structure when selections change', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Select organization category
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      // Should call onChange with category selection
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedCategory: 'organization',
          selectedRole: null,
          selectedOrganization: null,
          currentStep: 'role'
        })
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      // Select role
      const organizationOwnerRole = screen.getByTestId('role-organization_owner')
      await user.click(organizationOwnerRole)
      
      // Should call onChange with role selection
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedCategory: 'organization',
          selectedRole: 'organization_owner',
          selectedOrganization: null
        })
      )
    })

    it('should call onValidationChange when validation state changes', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Initial state should be invalid
      expect(mockOnValidationChange).toHaveBeenCalledWith({
        isValid: false,
        errors: expect.objectContaining({
          selectedCategory: expect.any(String)
        })
      })
      
      // Select category
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      // Validation should update
      expect(mockOnValidationChange).toHaveBeenCalledWith({
        isValid: false,
        errors: expect.objectContaining({
          selectedRole: expect.any(String)
        })
      })
    })

    it('should provide complete and valid data when all required selections are made', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Complete flow for organization role
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      const organizationOwnerRole = screen.getByTestId('role-organization_owner')
      await user.click(organizationOwnerRole)
      
      await waitFor(() => {
        expect(screen.getByTestId('organization-selection')).toBeInTheDocument()
      })
      
      const organizationSelect = screen.getByTestId('organization-select')
      await user.selectOptions(organizationSelect, 'org-1')
      
      // Should call onChange with complete data
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          selectedCategory: 'organization',
          selectedRole: 'organization_owner',
          selectedOrganization: 'org-1'
        })
      )
      
      // Should call onValidationChange with valid state
      expect(mockOnValidationChange).toHaveBeenLastCalledWith({
        isValid: true,
        errors: {}
      })
    })
  })

  describe('Controlled Component Behavior', () => {
    it('should display provided value correctly', () => {
      const value: RoleSelectionData = {
        selectedCategory: 'organization',
        selectedRole: 'game_master',
        selectedOrganization: 'org-1',
        currentStep: 'role'
      }
      
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          value={value}
        />
      )
      
      // Should show role selection step
      expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      
      // Should show organization selection
      expect(screen.getByTestId('organization-selection')).toBeInTheDocument()
      
      // Selected role should be highlighted
      const gameMasterRole = screen.getByTestId('role-game_master')
      expect(gameMasterRole).toHaveClass('selected')
    })

    it('should sync with external state changes', () => {
      const initialValue: RoleSelectionData = {
        selectedCategory: 'system',
        selectedRole: null,
        selectedOrganization: null,
        currentStep: 'role'
      }
      
      const { rerender } = render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          value={initialValue}
        />
      )
      
      // Should show role selection for system
      expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      expect(screen.getByText('Role Selection - system')).toBeInTheDocument()
      
      // Update to organization category
      const updatedValue: RoleSelectionData = {
        selectedCategory: 'organization',
        selectedRole: null,
        selectedOrganization: null,
        currentStep: 'role'
      }
      
      rerender(
        <HierarchicalRoleSelection 
          {...defaultProps}
          value={updatedValue}
        />
      )
      
      // Should update to show organization roles
      expect(screen.getByText('Role Selection - organization')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should show search input when showSearch is true', async () => {
      const user = userEvent.setup()
      
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          showSearch={true}
        />
      )
      
      // Progress to role step
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      // Should show search input
      expect(screen.getByTestId('role-search')).toBeInTheDocument()
    })

    it('should filter roles based on search query', async () => {
      const user = userEvent.setup()
      
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          showSearch={true}
        />
      )
      
      // Progress to role step
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      // Search for "admin"
      const searchInput = screen.getByTestId('role-search')
      await user.type(searchInput, 'admin')
      
      // Should call onChange with search data
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          searchQuery: 'admin'
        })
      )
    })
  })

  describe('Loading and Error States', () => {
    it('should propagate loading state to sub-components', () => {
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          loading={true}
        />
      )
      
      const categorySelection = screen.getByTestId('category-selection')
      expect(categorySelection).toHaveClass('loading')
      
      const stepIndicator = screen.getByTestId('step-indicator')
      expect(stepIndicator).toHaveClass('disabled')
    })

    it('should propagate disabled state to sub-components', () => {
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          disabled={true}
        />
      )
      
      const categorySelection = screen.getByTestId('category-selection')
      expect(categorySelection).toHaveClass('disabled')
      
      const stepIndicator = screen.getByTestId('step-indicator')
      expect(stepIndicator).toHaveClass('disabled')
    })

    it('should display error messages appropriately', () => {
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          error="Failed to load categories"
        />
      )
      
      expect(screen.getByTestId('category-error')).toBeInTheDocument()
      expect(screen.getByText('Failed to load categories')).toBeInTheDocument()
    })

    it('should handle step-specific errors', async () => {
      const user = userEvent.setup()
      
      // Start with a role-specific error
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          value={{
            selectedCategory: 'organization',
            selectedRole: null,
            selectedOrganization: null,
            currentStep: 'role'
          }}
          error="Failed to load roles"
        />
      )
      
      // Should show role selection with error
      expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      expect(screen.getByTestId('role-error')).toBeInTheDocument()
      expect(screen.getByText('Failed to load roles')).toBeInTheDocument()
    })
  })

  describe('Accessibility & UX', () => {
    it('should maintain focus flow during step transitions', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Tab to category selection
      await user.tab()
      const organizationCategory = screen.getByTestId('category-organization')
      expect(organizationCategory).toHaveFocus()
      
      // Select category
      await user.keyboard('{Enter}')
      
      // Focus should move to role selection
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
    })

    it('should provide proper ARIA labels and navigation', () => {
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      const container = screen.getByTestId('hierarchical-role-selection')
      expect(container).toHaveAttribute('role', 'region')
      expect(container).toHaveAttribute('aria-label', 'Hierarchical role selection')
    })

    it('should announce step changes to screen readers', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      // Should have aria-live region for step announcements
      const announcement = screen.getByRole('status')
      expect(announcement).toBeInTheDocument()
    })
  })

  describe('Integration Edge Cases', () => {
    it('should handle rapid step navigation without state corruption', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      const organizationCategory = screen.getByTestId('category-organization')
      const systemCategory = screen.getByTestId('category-system')
      
      // Rapid category switches
      await user.click(organizationCategory)
      await user.click(systemCategory)
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
        expect(screen.getByText('Role Selection - organization')).toBeInTheDocument()
      })
      
      // State should be consistent
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          selectedCategory: 'organization',
          selectedRole: null,
          currentStep: 'role'
        })
      )
    })

    it('should handle invalid role/category combinations gracefully', () => {
      const invalidValue: RoleSelectionData = {
        selectedCategory: 'system',
        selectedRole: 'organization_owner' as RoleType, // Invalid combination
        selectedOrganization: null,
        currentStep: 'role'
      }
      
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          value={invalidValue}
        />
      )
      
      // Should handle gracefully and show appropriate error
      expect(screen.getByTestId('hierarchical-role-selection')).toBeInTheDocument()
      
      // Should call onValidationChange with error
      expect(mockOnValidationChange).toHaveBeenCalledWith({
        isValid: false,
        errors: expect.objectContaining({
          selectedRole: expect.stringContaining('does not match')
        })
      })
    })

    it('should maintain performance with large datasets', () => {
      const start = performance.now()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      const end = performance.now()
      
      // Should render quickly (less than 50ms)
      expect(end - start).toBeLessThan(50)
    })
  })

  describe('Progress Tracking', () => {
    it('should show progress indicator when showProgress is true', () => {
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          showProgress={true}
        />
      )
      
      const stepIndicator = screen.getByTestId('step-indicator')
      expect(within(stepIndicator).getByTestId('progress')).toBeInTheDocument()
    })

    it('should update progress as user completes steps', async () => {
      const user = userEvent.setup()
      
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          showProgress={true}
        />
      )
      
      // Initial progress should be 50% (category step)
      let progress = screen.getByTestId('progress')
      expect(progress).toHaveStyle('width: 50%')
      
      // Complete category selection
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        progress = screen.getByTestId('progress')
        expect(progress).toHaveStyle('width: 100%')
      })
    })
  })
})