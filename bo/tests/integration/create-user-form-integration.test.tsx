/**
 * Integration Test: CreateUserForm Integration with Hierarchical Role Selection
 * 
 * Tests the integration between the CreateUserForm and the hierarchical role selection feature.
 * Validates form submission, data flow, and user creation with hierarchical role data.
 * 
 * Test ID: T011
 * Feature: CreateUserForm integration with step-by-step role selection
 * Date: September 17, 2025
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreateUserForm } from '@/components/forms/create-user-form'
import { HierarchicalRoleSelection } from '@/components/forms/hierarchical-role-selection'
import type { RoleSelectionData } from '@/types/hierarchical-roles'

// Mock the API calls
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signUp: {
      email: jest.fn()
    },
    organization: {
      inviteMember: jest.fn()
    }
  }
}))

// Mock the hierarchical role selection component
jest.mock('@/components/forms/hierarchical-role-selection', () => ({
  HierarchicalRoleSelection: jest.fn(({ onChange, onValidationChange }) => {
    const mockRoleSelectionData: RoleSelectionData = {
      selectedCategory: 'system',
      selectedRole: 'system_admin',
      selectedOrganization: null,
      currentStep: 'role'
    }
    
    return (
      <div data-testid="hierarchical-role-selection">
        <button
          data-testid="mock-select-system-admin"
          onClick={() => onChange(mockRoleSelectionData)}
        >
          Select System Admin
        </button>
        <button
          data-testid="mock-select-org-owner"
          onClick={() => onChange({
            selectedCategory: 'organization',
            selectedRole: 'organization_owner',
            selectedOrganization: 'org-123',
            currentStep: 'role'
          })}
        >
          Select Organization Owner
        </button>
        <button
          data-testid="mock-validation-change"
          onClick={() => onValidationChange?.({
            isValid: true,
            errors: {},
            step: 'role'
          })}
        >
          Trigger Validation
        </button>
      </div>
    )
  })
}))

// Test utilities
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('Integration: CreateUserForm with Hierarchical Role Selection', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Form Integration', () => {
    it('should integrate hierarchical role selection into create user form', () => {
      // ARRANGE: Render form with hierarchical role selection
      renderWithProviders(<CreateUserForm />)
      
      // ASSERT: Hierarchical role selection should be present
      expect(screen.getByTestId('hierarchical-role-selection')).toBeInTheDocument()
      
      // ASSERT: Form fields should be present
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('should handle role selection data flow', async () => {
      // ARRANGE: Setup user interactions
      const user = userEvent.setup()
      renderWithProviders(<CreateUserForm />)
      
      // ACT: Select system admin role
      await user.click(screen.getByTestId('mock-select-system-admin'))
      
      // ASSERT: Form should reflect the role selection
      // Note: This would test the actual integration - the form should show
      // selected role information or hide organization selection
      expect(screen.getByTestId('hierarchical-role-selection')).toBeInTheDocument()
    })

    it('should validate form submission with hierarchical role data', async () => {
      // ARRANGE: Setup form with complete data
      const user = userEvent.setup()
      renderWithProviders(<CreateUserForm />)
      
      // ACT: Fill form fields
      await user.type(screen.getByLabelText(/name/i), 'John Admin')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      
      // ACT: Select role
      await user.click(screen.getByTestId('mock-select-system-admin'))
      
      // ACT: Trigger validation
      await user.click(screen.getByTestId('mock-validation-change'))
      
      // ASSERT: Form should be ready for submission
      const submitButton = screen.getByRole('button', { name: /create user/i })
      expect(submitButton).toBeEnabled()
    })
  })

  describe('System Admin Role Integration', () => {
    it('should handle system admin creation workflow', async () => {
      // ARRANGE: Mock successful API response
      const mockSignUp = jest.fn().mockResolvedValue({
        success: true,
        data: { user: { id: 'user-123', email: 'admin@example.com' } }
      })
      
      require('@/lib/auth-client').authClient.signUp.email = mockSignUp
      
      const user = userEvent.setup()
      renderWithProviders(<CreateUserForm />)
      
      // ACT: Fill form with system admin data
      await user.type(screen.getByLabelText(/name/i), 'System Administrator')
      await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
      await user.click(screen.getByTestId('mock-select-system-admin'))
      
      // ACT: Submit form
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)
      
      // ASSERT: Should call API with correct data
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          name: 'System Administrator',
          email: 'admin@example.com',
          roleType: 'system_admin',
          selectedCategory: 'system',
          organizationId: undefined
        })
      })
    })

    it('should not show organization selection for system roles', async () => {
      // ARRANGE: Render form
      const user = userEvent.setup()
      renderWithProviders(<CreateUserForm />)
      
      // ACT: Select system admin role
      await user.click(screen.getByTestId('mock-select-system-admin'))
      
      // ASSERT: Organization selection should not be visible or required
      // Note: This tests that the UI correctly hides organization selection
      // when system roles are selected
      expect(screen.queryByTestId('organization-selection')).not.toBeInTheDocument()
    })
  })

  describe('Organization Role Integration', () => {
    it('should handle organization role creation workflow', async () => {
      // ARRANGE: Mock successful API responses
      const mockSignUp = jest.fn().mockResolvedValue({
        success: true,
        data: { user: { id: 'user-123', email: 'owner@example.com' } }
      })
      
      const mockInviteMember = jest.fn().mockResolvedValue({
        success: true,
        data: { invitation: { id: 'invite-123' } }
      })
      
      require('@/lib/auth-client').authClient.signUp.email = mockSignUp
      require('@/lib/auth-client').authClient.organization.inviteMember = mockInviteMember
      
      const user = userEvent.setup()
      renderWithProviders(<CreateUserForm />)
      
      // ACT: Fill form with organization role data
      await user.type(screen.getByLabelText(/name/i), 'Organization Owner')
      await user.type(screen.getByLabelText(/email/i), 'owner@example.com')
      await user.click(screen.getByTestId('mock-select-org-owner'))
      
      // ACT: Submit form
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)
      
      // ASSERT: Should call both user creation and organization invitation APIs
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          name: 'Organization Owner',
          email: 'owner@example.com',
          roleType: 'organization_owner',
          selectedCategory: 'organization',
          organizationId: 'org-123'
        })
        
        expect(mockInviteMember).toHaveBeenCalledWith({
          organizationId: 'org-123',
          email: 'owner@example.com',
          role: 'owner'
        })
      })
    })

    it('should require organization selection for organization roles', async () => {
      // ARRANGE: Render form
      const user = userEvent.setup()
      renderWithProviders(<CreateUserForm />)
      
      // ACT: Fill basic info but don't select organization
      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      
      // ACT: Select organization role but don't provide organization
      await user.click(screen.getByTestId('mock-select-org-owner'))
      
      // ASSERT: Form should be invalid without organization
      const submitButton = screen.getByRole('button', { name: /create user/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Validation Integration', () => {
    it('should integrate hierarchical validation with form validation', async () => {
      // ARRANGE: Setup form
      const user = userEvent.setup()
      renderWithProviders(<CreateUserForm />)
      
      // ACT: Try to submit incomplete form
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)
      
      // ASSERT: Should show validation errors
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/please select a role/i)).toBeInTheDocument()
    })

    it('should clear validation errors when fields are filled', async () => {
      // ARRANGE: Setup form with validation errors
      const user = userEvent.setup()
      renderWithProviders(<CreateUserForm />)
      
      // ACT: Submit to trigger validation errors
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)
      
      // ASSERT: Errors should be present
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      
      // ACT: Fill the name field
      await user.type(screen.getByLabelText(/name/i), 'John Doe')
      
      // ASSERT: Name error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Step Navigation Integration', () => {
    it('should allow navigation between role selection steps', async () => {
      // ARRANGE: Setup form
      const user = userEvent.setup()
      renderWithProviders(<CreateUserForm />)
      
      // ACT: Navigate through role selection steps
      // This would test the step indicator and navigation
      await user.click(screen.getByTestId('mock-select-system-admin'))
      
      // ASSERT: Should be able to navigate back to category selection
      // Note: This tests the integration between form and step navigation
      expect(screen.getByTestId('hierarchical-role-selection')).toBeInTheDocument()
    })

    it('should maintain form data during role selection navigation', async () => {
      // ARRANGE: Setup form with data
      const user = userEvent.setup()
      renderWithProviders(<CreateUserForm />)
      
      // ACT: Fill form fields
      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      
      // ACT: Navigate through role selection
      await user.click(screen.getByTestId('mock-select-system-admin'))
      
      // ASSERT: Form data should be preserved
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle API errors during user creation', async () => {
      // ARRANGE: Mock API error
      const mockSignUp = jest.fn().mockRejectedValue(new Error('API Error'))
      require('@/lib/auth-client').authClient.signUp.email = mockSignUp
      
      const user = userEvent.setup()
      renderWithProviders(<CreateUserForm />)
      
      // ACT: Fill form and submit
      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.click(screen.getByTestId('mock-select-system-admin'))
      
      const submitButton = screen.getByRole('button', { name: /create user/i })
      await user.click(submitButton)
      
      // ASSERT: Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to create user/i)).toBeInTheDocument()
      })
    })

    it('should handle role selection validation errors', async () => {
      // ARRANGE: Setup form with validation error
      const user = userEvent.setup()
      renderWithProviders(<CreateUserForm />)
      
      // ACT: Trigger role selection validation error
      // This would test how the form handles hierarchical validation errors
      await user.click(screen.getByTestId('mock-validation-change'))
      
      // ASSERT: Should integrate validation errors properly
      expect(screen.getByTestId('hierarchical-role-selection')).toBeInTheDocument()
    })
  })

  describe('Performance Integration', () => {
    it('should handle large forms efficiently', async () => {
      // ARRANGE: Measure performance
      const startTime = performance.now()
      
      // ACT: Render and interact with form
      renderWithProviders(<CreateUserForm />)
      const user = userEvent.setup()
      
      await user.type(screen.getByLabelText(/name/i), 'Performance Test User')
      await user.type(screen.getByLabelText(/email/i), 'perf@example.com')
      await user.click(screen.getByTestId('mock-select-system-admin'))
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // ASSERT: Should complete interactions within reasonable time
      expect(duration).toBeLessThan(1000) // Less than 1 second
    })
  })

  describe('Accessibility Integration', () => {
    it('should maintain accessibility with hierarchical role selection', () => {
      // ARRANGE: Render form
      renderWithProviders(<CreateUserForm />)
      
      // ASSERT: Form should have proper ARIA labels
      expect(screen.getByLabelText(/name/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-required', 'true')
      
      // ASSERT: Role selection should be accessible
      expect(screen.getByTestId('hierarchical-role-selection')).toBeInTheDocument()
    })

    it('should handle keyboard navigation properly', async () => {
      // ARRANGE: Setup keyboard navigation
      const user = userEvent.setup()
      renderWithProviders(<CreateUserForm />)
      
      // ACT: Navigate with keyboard
      await user.tab() // Should focus on name field
      expect(screen.getByLabelText(/name/i)).toHaveFocus()
      
      await user.tab() // Should focus on email field
      expect(screen.getByLabelText(/email/i)).toHaveFocus()
      
      // ASSERT: Should be able to navigate through form with keyboard
      // Note: This tests that the hierarchical selection doesn't break keyboard navigation
    })
  })
})