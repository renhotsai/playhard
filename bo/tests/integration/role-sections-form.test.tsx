/**
 * Integration Test: Role Sections Form Submission
 * 
 * Tests the complete role section form submission flow with two-tier selection.
 * These tests MUST fail until the components are properly implemented.
 * 
 * TDD Phase: RED - Write failing tests first
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RoleSelectionSections } from '@/components/role-selection-sections';
import { 
  type RoleType,
  type RoleSection 
} from '@/types/role-sections';

// Mock the authentication
vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: 'admin123', role: 'admin' } },
    isPending: false
  }))
}));

// Mock API endpoints
const mockCreateUser = vi.fn();
const mockListOrganizations = vi.fn();

vi.mock('@/hooks/use-api', () => ({
  useCreateUser: () => ({
    mutate: mockCreateUser,
    isPending: false,
    error: null
  }),
  useOrganizations: () => ({
    data: [
      { id: 'org1', name: 'Test Organization Alpha', slug: 'test-alpha' },
      { id: 'org2', name: 'Test Organization Beta', slug: 'test-beta' }
    ],
    isLoading: false,
    error: null
  })
}));

// Mock form utilities
vi.mock('@/lib/form-validators', () => ({
  roleSectionsValidators: {
    email: { required: 'Email is required' },
    name: { required: 'Name is required' },
    roleType: { required: 'Role type is required' },
    organizationId: { required: 'Organization is required for this role' }
  }
}));

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('Role Sections Form Integration', () => {
  const user = userEvent.setup();
  let mockOnSubmit: ReturnType<typeof vi.fn>;
  let mockOnRoleChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
    mockOnRoleChange = vi.fn();
    mockCreateUser.mockClear();
    mockListOrganizations.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('System Admin Role Selection Flow', () => {
    it('completes system admin selection and form submission', async () => {
      render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      // Step 1: Select system section
      const systemSection = screen.getByLabelText(/system roles/i);
      await user.click(systemSection);

      // Step 2: Verify system admin role is available
      expect(screen.getByText('System Administrator')).toBeInTheDocument();
      expect(screen.getByText(/complete system control/i)).toBeInTheDocument();

      // Step 3: Select system admin role
      const systemAdminRole = screen.getByLabelText(/system administrator/i);
      await user.click(systemAdminRole);

      // Step 4: Verify role change callback
      await waitFor(() => {
        expect(mockOnRoleChange).toHaveBeenCalledWith({
          roleType: 'system_admin',
          section: 'system',
          requiresOrganization: false
        });
      });

      // Step 5: Verify no organization selection is shown
      expect(screen.queryByText(/select organization/i)).not.toBeInTheDocument();

      // Step 6: Fill in user details
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);

      await user.type(emailInput, 'admin@example.com');
      await user.type(nameInput, 'Test System Admin');

      // Step 7: Submit form
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Step 8: Verify form submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'admin@example.com',
          name: 'Test System Admin',
          roleType: 'system_admin',
          organizationId: undefined
        });
      });
    });

    it('validates required fields for system admin', async () => {
      render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      // Select system admin without filling required fields
      const systemSection = screen.getByLabelText(/system roles/i);
      await user.click(systemSection);

      const systemAdminRole = screen.getByLabelText(/system administrator/i);
      await user.click(systemAdminRole);

      // Try to submit without required fields
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Verify validation errors
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      // Verify form was not submitted
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Organization Role Selection Flow', () => {
    it('completes organization owner selection and form submission', async () => {
      render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      // Step 1: Select organization section
      const organizationSection = screen.getByLabelText(/organization roles/i);
      await user.click(organizationSection);

      // Step 2: Verify organization roles are available
      expect(screen.getByText('Organization Owner')).toBeInTheDocument();
      expect(screen.getByText('Game Master')).toBeInTheDocument();

      // Step 3: Select organization owner role
      const ownerRole = screen.getByLabelText(/organization owner/i);
      await user.click(ownerRole);

      // Step 4: Verify role change callback
      await waitFor(() => {
        expect(mockOnRoleChange).toHaveBeenCalledWith({
          roleType: 'organization_owner',
          section: 'organization',
          requiresOrganization: true
        });
      });

      // Step 5: Verify organization selection appears
      expect(screen.getByText(/select organization/i)).toBeInTheDocument();

      // Step 6: Select organization
      const organizationSelect = screen.getByRole('combobox', { name: /organization/i });
      await user.click(organizationSelect);
      
      const orgOption = screen.getByText('Test Organization Alpha');
      await user.click(orgOption);

      // Step 7: Fill in user details
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);

      await user.type(emailInput, 'owner@example.com');
      await user.type(nameInput, 'Test Organization Owner');

      // Step 8: Submit form
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Step 9: Verify form submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'owner@example.com',
          name: 'Test Organization Owner',
          roleType: 'organization_owner',
          organizationId: 'org1'
        });
      });
    });

    it('validates organization requirement for organization roles', async () => {
      render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      // Select organization role without selecting organization
      const organizationSection = screen.getByLabelText(/organization roles/i);
      await user.click(organizationSection);

      const ownerRole = screen.getByLabelText(/organization owner/i);
      await user.click(ownerRole);

      // Fill in user details but skip organization
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);

      await user.type(emailInput, 'owner@example.com');
      await user.type(nameInput, 'Test Organization Owner');

      // Try to submit without organization
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Verify validation error for organization
      await waitFor(() => {
        expect(screen.getByText(/organization is required for this role/i)).toBeInTheDocument();
      });

      // Verify form was not submitted
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('tests game master role selection flow', async () => {
      render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      // Select game master role
      const organizationSection = screen.getByLabelText(/organization roles/i);
      await user.click(organizationSection);

      const gameMasterRole = screen.getByLabelText(/game master/i);
      await user.click(gameMasterRole);

      // Verify role-specific content
      expect(screen.getByText(/lead murder mystery games/i)).toBeInTheDocument();
      
      // Verify role change with correct parameters
      await waitFor(() => {
        expect(mockOnRoleChange).toHaveBeenCalledWith({
          roleType: 'game_master',
          section: 'organization',
          requiresOrganization: true
        });
      });
    });
  });

  describe('Section Switching Flow', () => {
    it('handles switching between system and organization sections', async () => {
      render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      // Start with system section
      const systemSection = screen.getByLabelText(/system roles/i);
      await user.click(systemSection);

      const systemAdminRole = screen.getByLabelText(/system administrator/i);
      await user.click(systemAdminRole);

      // Switch to organization section
      const organizationSection = screen.getByLabelText(/organization roles/i);
      await user.click(organizationSection);

      // Verify role selection is cleared
      await waitFor(() => {
        expect(mockOnRoleChange).toHaveBeenLastCalledWith({
          roleType: null,
          section: 'organization',
          requiresOrganization: false
        });
      });

      // Select organization role
      const ownerRole = screen.getByLabelText(/organization owner/i);
      await user.click(ownerRole);

      // Verify new role selection
      await waitFor(() => {
        expect(mockOnRoleChange).toHaveBeenLastCalledWith({
          roleType: 'organization_owner',
          section: 'organization',
          requiresOrganization: true
        });
      });
    });

    it('clears form validation when switching sections', async () => {
      render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      // Start with organization section and create validation errors
      const organizationSection = screen.getByLabelText(/organization roles/i);
      await user.click(organizationSection);

      const ownerRole = screen.getByLabelText(/organization owner/i);
      await user.click(ownerRole);

      // Try to submit to generate validation errors
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Verify validation errors exist
      await waitFor(() => {
        expect(screen.getByText(/organization is required for this role/i)).toBeInTheDocument();
      });

      // Switch to system section
      const systemSection = screen.getByLabelText(/system roles/i);
      await user.click(systemSection);

      // Verify organization validation error is cleared
      await waitFor(() => {
        expect(screen.queryByText(/organization is required for this role/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API submission errors gracefully', async () => {
      mockCreateUser.mockRejectedValueOnce(new Error('Server error'));

      render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      // Complete valid form submission
      const systemSection = screen.getByLabelText(/system roles/i);
      await user.click(systemSection);

      const systemAdminRole = screen.getByLabelText(/system administrator/i);
      await user.click(systemAdminRole);

      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(emailInput, 'admin@example.com');
      await user.type(nameInput, 'Test Admin');

      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });
    });

    it('handles organization loading states', async () => {
      // Mock loading state
      vi.mocked(require('@/hooks/use-api').useOrganizations).mockReturnValueOnce({
        data: null,
        isLoading: true,
        error: null
      });

      render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      // Select organization role
      const organizationSection = screen.getByLabelText(/organization roles/i);
      await user.click(organizationSection);

      const ownerRole = screen.getByLabelText(/organization owner/i);
      await user.click(ownerRole);

      // Verify loading state in organization selector
      expect(screen.getByText(/loading organizations/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains proper focus management during role selection', async () => {
      render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      // Tab through the interface
      await user.tab();
      expect(screen.getByLabelText(/system roles/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/organization roles/i)).toHaveFocus();

      // Select system section and verify focus moves to roles
      await user.keyboard('{Enter}');
      await user.tab();
      expect(screen.getByLabelText(/system administrator/i)).toHaveFocus();
    });

    it('announces role selection changes to screen readers', async () => {
      render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const systemSection = screen.getByLabelText(/system roles/i);
      await user.click(systemSection);

      // Verify aria-live region announces section change
      expect(screen.getByRole('status')).toHaveTextContent(/system roles selected/i);

      const systemAdminRole = screen.getByLabelText(/system administrator/i);
      await user.click(systemAdminRole);

      // Verify role selection announcement
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/system administrator selected/i);
      });
    });
  });

  describe('Performance Integration', () => {
    it('handles rapid role switching efficiently', async () => {
      render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const startTime = performance.now();

      // Rapidly switch between sections and roles
      for (let i = 0; i < 10; i++) {
        const systemSection = screen.getByLabelText(/system roles/i);
        await user.click(systemSection);

        const organizationSection = screen.getByLabelText(/organization roles/i);
        await user.click(organizationSection);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle rapid switching within reasonable time
      expect(totalTime).toBeLessThan(1000); // <1 second for 20 section switches
    });

    it('debounces validation during form input', async () => {
      const mockValidate = vi.fn();
      
      render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
            onValidate={mockValidate}
          />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);

      // Type rapidly
      await user.type(emailInput, 'test@example.com');

      // Verify validation is debounced
      await waitFor(() => {
        // Should not validate on every keystroke
        expect(mockValidate).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });
});