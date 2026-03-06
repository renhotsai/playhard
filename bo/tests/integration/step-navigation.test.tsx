/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// Import main component for integration testing
import { HierarchicalRoleSelection } from '@/components/forms/hierarchical-role-selection/hierarchical-role-selection'
import type {
  HierarchicalRoleSelectionProps,
  RoleSelectionData,
  HierarchicalValidationResult
} from '@/types/hierarchical-roles'

// Mock the utility modules for consistent testing
jest.mock('@/lib/role-selection-utils')
jest.mock('@/lib/hierarchical-validation')

describe('Step Navigation Flow Integration Tests', () => {
  const mockOnChange = jest.fn()
  const mockOnValidationChange = jest.fn()

  const defaultProps: HierarchicalRoleSelectionProps = {
    onChange: mockOnChange,
    onValidationChange: mockOnValidationChange
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Forward Navigation Flow', () => {
    it('should complete full navigation flow for system admin', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Step 1: Should start on category selection
      expect(screen.getByTestId('category-selection')).toBeInTheDocument()
      expect(screen.queryByTestId('role-selection-step')).not.toBeInTheDocument()
      
      // Step 2: Select system category
      const systemCategory = screen.getByTestId('category-system')
      await user.click(systemCategory)
      
      // Should transition to role selection
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
        expect(screen.queryByTestId('category-selection')).not.toBeInTheDocument()
      })
      
      // Step 3: Select system admin role
      const systemAdminRole = screen.getByTestId('role-system_admin')
      await user.click(systemAdminRole)
      
      // Should complete flow (no organization selection needed)
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            selectedCategory: 'system',
            selectedRole: 'system_admin',
            selectedOrganization: null
          })
        )
      })
      
      // Validation should indicate completion
      expect(mockOnValidationChange).toHaveBeenLastCalledWith({
        isValid: true,
        errors: {}
      })
    })

    it('should complete full navigation flow for organization role', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Step 1: Select organization category
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      // Step 2: Select organization role
      const organizationOwnerRole = screen.getByTestId('role-organization_owner')
      await user.click(organizationOwnerRole)
      
      // Step 3: Should show organization selection
      await waitFor(() => {
        expect(screen.getByTestId('organization-selection')).toBeInTheDocument()
      })
      
      // Step 4: Select organization
      const organizationSelect = screen.getByTestId('organization-select')
      await user.selectOptions(organizationSelect, 'org-1')
      
      // Should complete flow
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            selectedCategory: 'organization',
            selectedRole: 'organization_owner',
            selectedOrganization: 'org-1'
          })
        )
      })
      
      expect(mockOnValidationChange).toHaveBeenLastCalledWith({
        isValid: true,
        errors: {}
      })
    })

    it('should handle step progression correctly', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Check initial step indicator state
      const stepIndicator = screen.getByTestId('step-indicator')
      let categoryStep = within(stepIndicator).getByTestId('step-category')
      let roleStep = within(stepIndicator).getByTestId('step-role')
      
      expect(categoryStep).toHaveClass('current')
      expect(roleStep).toHaveClass('pending')
      
      // Progress to role step
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        categoryStep = within(stepIndicator).getByTestId('step-category')
        roleStep = within(stepIndicator).getByTestId('step-role')
        
        expect(categoryStep).toHaveClass('completed')
        expect(roleStep).toHaveClass('current')
      })
    })
  })

  describe('Backward Navigation Flow', () => {
    it('should allow navigation back to category from role step', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Progress to role step
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      // Navigate back using step indicator
      const stepIndicator = screen.getByTestId('step-indicator')
      const categoryStep = within(stepIndicator).getByTestId('step-category')
      const categoryButton = within(categoryStep).getByRole('button')
      await user.click(categoryButton)
      
      // Should return to category selection
      await waitFor(() => {
        expect(screen.getByTestId('category-selection')).toBeInTheDocument()
        expect(screen.queryByTestId('role-selection-step')).not.toBeInTheDocument()
      })
      
      // Category should still be selected
      const orgCategoryButton = screen.getByTestId('category-organization')
      expect(orgCategoryButton).toHaveClass('selected')
    })

    it('should preserve state when navigating backward', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Make complete selection
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
      
      // Navigate back to category
      const stepIndicator = screen.getByTestId('step-indicator')
      const categoryStep = within(stepIndicator).getByTestId('step-category')
      const categoryButton = within(categoryStep).getByRole('button')
      await user.click(categoryButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('category-selection')).toBeInTheDocument()
      })
      
      // State should be preserved
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          selectedCategory: 'organization',
          selectedRole: 'organization_owner',
          selectedOrganization: 'org-1'
        })
      )
    })

    it('should reset dependent selections when changing category', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Complete organization selection
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      const organizationOwnerRole = screen.getByTestId('role-organization_owner')
      await user.click(organizationOwnerRole)
      
      // Navigate back and select different category
      const stepIndicator = screen.getByTestId('step-indicator')
      const categoryStep = within(stepIndicator).getByTestId('step-category')
      const categoryButton = within(categoryStep).getByRole('button')
      await user.click(categoryButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('category-selection')).toBeInTheDocument()
      })
      
      const systemCategory = screen.getByTestId('category-system')
      await user.click(systemCategory)
      
      // Role and organization should be reset
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          selectedCategory: 'system',
          selectedRole: null,
          selectedOrganization: null
        })
      )
    })
  })

  describe('Step Validation and Restrictions', () => {
    it('should prevent navigation to role step without category selection', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Try to navigate directly to role step
      const stepIndicator = screen.getByTestId('step-indicator')
      const roleStep = within(stepIndicator).getByTestId('step-role')
      const roleButton = within(roleStep).getByRole('button')
      
      // Role step should be disabled
      expect(roleButton).toBeDisabled()
      
      await user.click(roleButton)
      
      // Should remain on category step
      expect(screen.getByTestId('category-selection')).toBeInTheDocument()
      expect(screen.queryByTestId('role-selection-step')).not.toBeInTheDocument()
    })

    it('should validate each step before allowing progression', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Initial validation should be invalid
      expect(mockOnValidationChange).toHaveBeenCalledWith({
        isValid: false,
        errors: expect.any(Object)
      })
      
      // Select category - should update validation
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      expect(mockOnValidationChange).toHaveBeenCalledWith({
        isValid: false,
        errors: expect.any(Object)
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      // Select role - should update validation again
      const organizationOwnerRole = screen.getByTestId('role-organization_owner')
      await user.click(organizationOwnerRole)
      
      expect(mockOnValidationChange).toHaveBeenCalledWith({
        isValid: false,
        errors: expect.any(Object)
      })
    })

    it('should enable step navigation based on completion state', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      const stepIndicator = screen.getByTestId('step-indicator')
      
      // Initially, only category step should be available
      const categoryStep = within(stepIndicator).getByTestId('step-category')
      const roleStep = within(stepIndicator).getByTestId('step-role')
      
      expect(within(categoryStep).getByRole('button')).not.toBeDisabled()
      expect(within(roleStep).getByRole('button')).toBeDisabled()
      
      // After category selection, both should be available
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(within(categoryStep).getByRole('button')).not.toBeDisabled()
        expect(within(roleStep).getByRole('button')).not.toBeDisabled()
      })
    })
  })

  describe('Navigation State Persistence', () => {
    it('should maintain navigation state across re-renders', () => {
      const { rerender } = render(
        <HierarchicalRoleSelection {...defaultProps} />
      )
      
      // Simulate external state update
      const updatedValue: RoleSelectionData = {
        selectedCategory: 'organization',
        selectedRole: 'game_master',
        selectedOrganization: null,
        currentStep: 'role'
      }
      
      rerender(
        <HierarchicalRoleSelection 
          {...defaultProps}
          value={updatedValue}
        />
      )
      
      // Should show correct step
      expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      expect(screen.queryByTestId('category-selection')).not.toBeInTheDocument()
      
      // Should show organization selection for organization role
      expect(screen.getByTestId('organization-selection')).toBeInTheDocument()
    })

    it('should sync step indicator with current navigation state', () => {
      const value: RoleSelectionData = {
        selectedCategory: 'system',
        selectedRole: 'system_admin',
        selectedOrganization: null,
        currentStep: 'role'
      }
      
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          value={value}
        />
      )
      
      const stepIndicator = screen.getByTestId('step-indicator')
      const categoryStep = within(stepIndicator).getByTestId('step-category')
      const roleStep = within(stepIndicator).getByTestId('step-role')
      
      expect(categoryStep).toHaveClass('completed')
      expect(roleStep).toHaveClass('current')
    })
  })

  describe('Navigation Performance and UX', () => {
    it('should handle rapid navigation changes smoothly', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Rapid navigation between categories
      const organizationCategory = screen.getByTestId('category-organization')
      const systemCategory = screen.getByTestId('category-system')
      
      await user.click(organizationCategory)
      await user.click(systemCategory)
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
        expect(screen.getByText('Role Selection - organization')).toBeInTheDocument()
      })
      
      // Final state should be consistent
      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          selectedCategory: 'organization',
          currentStep: 'role'
        })
      )
    })

    it('should provide smooth transitions between steps', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Measure transition timing
      const start = performance.now()
      
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      const end = performance.now()
      
      // Transition should be fast (less than 100ms)
      expect(end - start).toBeLessThan(100)
    })

    it('should maintain focus management during navigation', async () => {
      const user = userEvent.setup()
      
      render(<HierarchicalRoleSelection {...defaultProps} />)
      
      // Tab to first category
      await user.tab()
      const organizationCategory = screen.getByTestId('category-organization')
      expect(organizationCategory).toHaveFocus()
      
      // Select category
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      // Focus should move appropriately to role selection
      // Implementation would depend on actual focus management
    })
  })

  describe('Navigation Edge Cases', () => {
    it('should handle invalid step transitions gracefully', async () => {
      const user = userEvent.setup()
      
      const invalidValue: RoleSelectionData = {
        selectedCategory: null,
        selectedRole: 'organization_owner', // Invalid: role without category
        selectedOrganization: null,
        currentStep: 'role'
      }
      
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          value={invalidValue}
        />
      )
      
      // Should handle gracefully, possibly by resetting to valid state
      expect(screen.getByTestId('hierarchical-role-selection')).toBeInTheDocument()
      
      // Should call validation with errors
      expect(mockOnValidationChange).toHaveBeenCalledWith({
        isValid: false,
        errors: expect.any(Object)
      })
    })

    it('should recover from error states during navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          error="Network error"
        />
      )
      
      // Should show error but still allow interaction
      expect(screen.getByTestId('category-error')).toBeInTheDocument()
      
      // Should still be able to make selections
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      // Error should clear on successful interaction
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedCategory: 'organization'
        })
      )
    })

    it('should handle disabled state during navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          disabled={true}
        />
      )
      
      // All interactions should be disabled
      const organizationCategory = screen.getByTestId('category-organization')
      expect(organizationCategory).toHaveClass('disabled')
      
      await user.click(organizationCategory)
      
      // Should not trigger navigation
      expect(mockOnChange).not.toHaveBeenCalled()
      expect(screen.getByTestId('category-selection')).toBeInTheDocument()
    })
  })

  describe('Navigation Analytics and Tracking', () => {
    it('should track step completion events', async () => {
      const user = userEvent.setup()
      const onStepComplete = jest.fn()
      
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          onStepComplete={onStepComplete}
        />
      )
      
      // Complete category step
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      expect(onStepComplete).toHaveBeenCalledWith('category', {
        selectedCategory: 'organization'
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
      })
      
      // Complete role step
      const organizationOwnerRole = screen.getByTestId('role-organization_owner')
      await user.click(organizationOwnerRole)
      
      expect(onStepComplete).toHaveBeenCalledWith('role', {
        selectedCategory: 'organization',
        selectedRole: 'organization_owner'
      })
    })

    it('should track navigation patterns', async () => {
      const user = userEvent.setup()
      const onNavigationChange = jest.fn()
      
      render(
        <HierarchicalRoleSelection 
          {...defaultProps}
          onNavigationChange={onNavigationChange}
        />
      )
      
      // Forward navigation
      const organizationCategory = screen.getByTestId('category-organization')
      await user.click(organizationCategory)
      
      expect(onNavigationChange).toHaveBeenCalledWith({
        from: 'category',
        to: 'role',
        direction: 'forward'
      })
      
      // Backward navigation
      const stepIndicator = screen.getByTestId('step-indicator')
      const categoryStep = within(stepIndicator).getByTestId('step-category')
      const categoryButton = within(categoryStep).getByRole('button')
      await user.click(categoryButton)
      
      expect(onNavigationChange).toHaveBeenCalledWith({
        from: 'role',
        to: 'category',
        direction: 'backward'
      })
    })
  })
})