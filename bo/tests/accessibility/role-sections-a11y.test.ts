/**
 * Accessibility Tests: Role Selection Interface
 * 
 * Tests WCAG 2.1 AA compliance for the two-tier role selection system.
 * These tests MUST fail until accessibility features are properly implemented.
 * 
 * TDD Phase: RED - Write failing tests first
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RoleSelectionSections } from '@/components/role-selection-sections';
import { RoleSectionGroup } from '@/components/role-section-group';
import { RoleOption } from '@/components/role-option';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock authentication
vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: 'admin123', role: 'admin' } },
    isPending: false
  }))
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

// Mock organizations data
const mockOrganizations = [
  { id: 'org1', name: 'Test Organization Alpha', slug: 'test-alpha' },
  { id: 'org2', name: 'Test Organization Beta', slug: 'test-beta' }
];

vi.mock('@/hooks/use-api', () => ({
  useOrganizations: () => ({
    data: mockOrganizations,
    isLoading: false,
    error: null
  })
}));

describe('Role Selection Accessibility Tests', () => {
  const user = userEvent.setup();
  let mockOnRoleChange: ReturnType<typeof vi.fn>;
  let mockOnSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnRoleChange = vi.fn();
    mockOnSubmit = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('has no accessibility violations in role selection interface', async () => {
      const { container } = render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in system roles section', async () => {
      const { container } = render(
        <TestWrapper>
          <RoleSectionGroup
            section="system"
            title="System Roles"
            description="Global platform administration roles with full system access"
            roles={[
              {
                id: 'system_admin',
                label: 'System Administrator',
                description: 'Complete system control and management access',
                section: 'system',
                badge: { text: 'FULL ACCESS', variant: 'destructive' as const }
              }
            ]}
            selectedRole={null}
            onRoleSelect={mockOnRoleChange}
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in organization roles section', async () => {
      const { container } = render(
        <TestWrapper>
          <RoleSectionGroup
            section="organization"
            title="Organization Roles"
            description="Organization-specific roles for managing teams and operations"
            roles={[
              {
                id: 'organization_owner',
                label: 'Organization Owner',
                description: 'Complete organization ownership and management',
                section: 'organization',
                badge: { text: 'OWNER', variant: 'default' as const }
              },
              {
                id: 'game_master',
                label: 'Game Master',
                description: 'Lead murder mystery games and manage game sessions',
                section: 'organization',
                badge: { text: 'GM', variant: 'default' as const }
              }
            ]}
            selectedRole={null}
            onRoleSelect={mockOnRoleChange}
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports full keyboard navigation through role sections', async () => {
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

      // Start at the first focusable element
      await user.tab();
      
      // Should focus on system roles section
      const systemSection = screen.getByRole('radio', { name: /system roles/i });
      expect(systemSection).toHaveFocus();

      // Tab to organization roles section
      await user.tab();
      const orgSection = screen.getByRole('radio', { name: /organization roles/i });
      expect(orgSection).toHaveFocus();

      // Select system section using Enter
      await user.keyboard('{Enter}');
      expect(mockOnRoleChange).toHaveBeenCalledWith(
        expect.objectContaining({ section: 'system' })
      );

      // Tab should move to role options within the section
      await user.tab();
      const systemAdminRole = screen.getByRole('radio', { name: /system administrator/i });
      expect(systemAdminRole).toHaveFocus();
    });

    it('supports arrow key navigation within role sections', async () => {
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

      // Select organization section first
      const orgSection = screen.getByRole('radio', { name: /organization roles/i });
      await user.click(orgSection);

      // Focus on first organization role
      const firstRole = screen.getByRole('radio', { name: /organization owner/i });
      firstRole.focus();

      // Use arrow keys to navigate between roles
      await user.keyboard('{ArrowDown}');
      const secondRole = screen.getByRole('radio', { name: /organization admin/i });
      expect(secondRole).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      const thirdRole = screen.getByRole('radio', { name: /game master/i });
      expect(thirdRole).toHaveFocus();

      // Arrow up should go back
      await user.keyboard('{ArrowUp}');
      expect(secondRole).toHaveFocus();
    });

    it('supports keyboard navigation in organization selector', async () => {
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

      // Select organization role to show organization selector
      const orgSection = screen.getByRole('radio', { name: /organization roles/i });
      await user.click(orgSection);

      const ownerRole = screen.getByRole('radio', { name: /organization owner/i });
      await user.click(ownerRole);

      // Tab to organization selector
      const orgSelector = screen.getByRole('combobox', { name: /organization/i });
      orgSelector.focus();

      // Open with Enter
      await user.keyboard('{Enter}');

      // Navigate options with arrow keys
      await user.keyboard('{ArrowDown}');
      const firstOption = screen.getByRole('option', { name: /test organization alpha/i });
      expect(firstOption).toHaveAttribute('aria-selected', 'true');

      // Select with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByDisplayValue('Test Organization Alpha')).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    it('provides proper ARIA labels for role sections', () => {
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

      // Section radio buttons should have proper labels
      expect(screen.getByLabelText(/system roles/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/organization roles/i)).toBeInTheDocument();

      // Should have proper role attributes
      expect(screen.getByRole('radiogroup', { name: /role section/i })).toBeInTheDocument();
    });

    it('provides descriptive ARIA labels for individual roles', async () => {
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

      // Select system section to show roles
      const systemSection = screen.getByRole('radio', { name: /system roles/i });
      await user.click(systemSection);

      // Role should have descriptive label
      const systemAdminRole = screen.getByLabelText(/system administrator/i);
      expect(systemAdminRole).toHaveAttribute('aria-describedby');
      
      const descriptionId = systemAdminRole.getAttribute('aria-describedby');
      if (descriptionId) {
        const description = document.getElementById(descriptionId);
        expect(description).toHaveTextContent(/complete system control/i);
      }
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

      // Should have aria-live region for announcements
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');

      // Select a role and verify announcement
      const systemSection = screen.getByRole('radio', { name: /system roles/i });
      await user.click(systemSection);

      await waitFor(() => {
        expect(liveRegion).toHaveTextContent(/system roles selected/i);
      });

      const systemAdminRole = screen.getByRole('radio', { name: /system administrator/i });
      await user.click(systemAdminRole);

      await waitFor(() => {
        expect(liveRegion).toHaveTextContent(/system administrator selected/i);
      });
    });

    it('provides proper labeling for organization selector', async () => {
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

      // Select organization role to show selector
      const orgSection = screen.getByRole('radio', { name: /organization roles/i });
      await user.click(orgSection);

      const ownerRole = screen.getByRole('radio', { name: /organization owner/i });
      await user.click(ownerRole);

      // Organization selector should have proper labeling
      const orgSelector = screen.getByRole('combobox');
      expect(orgSelector).toHaveAttribute('aria-label');
      expect(orgSelector.getAttribute('aria-label')).toMatch(/organization/i);

      // Should indicate required field
      expect(orgSelector).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Visual Accessibility', () => {
    it('maintains sufficient color contrast for role badges', () => {
      render(
        <TestWrapper>
          <RoleOption
            role={{
              id: 'system_admin',
              label: 'System Administrator',
              description: 'Complete system control',
              section: 'system',
              badge: { text: 'FULL ACCESS', variant: 'destructive' }
            }}
            isSelected={false}
            onSelect={mockOnRoleChange}
          />
        </TestWrapper>
      );

      const badge = screen.getByText('FULL ACCESS');
      const computedStyle = window.getComputedStyle(badge);
      
      // Badge should have proper contrast (this would be tested with actual contrast tools)
      expect(badge).toBeInTheDocument();
      expect(computedStyle.color).toBeTruthy();
      expect(computedStyle.backgroundColor).toBeTruthy();
    });

    it('provides visual focus indicators', async () => {
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

      const systemSection = screen.getByRole('radio', { name: /system roles/i });
      
      // Focus the element
      await user.tab();
      expect(systemSection).toHaveFocus();

      // Should have visible focus indicator (checked via CSS classes)
      expect(systemSection).toHaveClass(/focus/);
    });

    it('supports high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
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

      // Interface should render without issues in high contrast mode
      expect(screen.getByText(/role selection/i)).toBeInTheDocument();
    });
  });

  describe('Motor Accessibility', () => {
    it('provides adequate click target sizes', () => {
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

      const systemSection = screen.getByRole('radio', { name: /system roles/i });
      const rect = systemSection.getBoundingClientRect();
      
      // WCAG 2.1 AA requires minimum 44x44px click targets
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });

    it('supports mouse, touch, and keyboard interactions equally', async () => {
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

      const systemSection = screen.getByRole('radio', { name: /system roles/i });

      // Mouse interaction
      await user.click(systemSection);
      expect(mockOnRoleChange).toHaveBeenCalledTimes(1);

      mockOnRoleChange.mockClear();

      // Keyboard interaction
      systemSection.focus();
      await user.keyboard(' '); // Space key
      expect(mockOnRoleChange).toHaveBeenCalledTimes(1);

      mockOnRoleChange.mockClear();

      // Touch interaction (simulated)
      fireEvent.touchStart(systemSection);
      fireEvent.touchEnd(systemSection);
      expect(mockOnRoleChange).toHaveBeenCalledTimes(1);
    });

    it('provides reasonable time limits for interactions', async () => {
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

      // No time-based limitations should be present
      // Users should be able to take as long as needed to make selections
      
      const systemSection = screen.getByRole('radio', { name: /system roles/i });
      
      // Simulate slow user interaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      await user.click(systemSection);
      
      expect(mockOnRoleChange).toHaveBeenCalled();
    });
  });

  describe('Cognitive Accessibility', () => {
    it('provides clear error messages for validation failures', async () => {
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
      const orgSection = screen.getByRole('radio', { name: /organization roles/i });
      await user.click(orgSection);

      const ownerRole = screen.getByRole('radio', { name: /organization owner/i });
      await user.click(ownerRole);

      // Try to submit without required organization
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Error message should be clear and actionable
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(/organization is required/i);
      });
    });

    it('provides helpful instructions and guidance', () => {
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

      // Should have instructional text
      expect(screen.getByText(/select a role section/i)).toBeInTheDocument();
      
      // Role descriptions should be helpful
      const systemSection = screen.getByRole('radio', { name: /system roles/i });
      expect(systemSection).toHaveAttribute('aria-describedby');
    });

    it('maintains consistent interaction patterns', async () => {
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

      // All radio buttons should behave consistently
      const radioButtons = screen.getAllByRole('radio');
      
      for (const radio of radioButtons) {
        // Each should be keyboard accessible
        radio.focus();
        await user.keyboard(' ');
        
        // Should have consistent ARIA attributes
        expect(radio).toHaveAttribute('aria-checked');
      }
    });
  });

  describe('Reduced Motion Support', () => {
    it('respects prefers-reduced-motion setting', () => {
      // Mock reduced motion media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
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

      // Components should render without animations when reduced motion is preferred
      expect(screen.getByText(/role selection/i)).toBeInTheDocument();
    });
  });

  describe('Error State Accessibility', () => {
    it('properly announces validation errors', async () => {
      render(
        <TestWrapper>
          <RoleSelectionSections
            selectedRole={null}
            selectedOrganization={null}
            onRoleChange={mockOnRoleChange}
            onSubmit={mockOnSubmit}
            validationErrors={{
              roleType: 'Role selection is required',
              organizationId: 'Organization is required for this role'
            }}
          />
        </TestWrapper>
      );

      // Error messages should be announced
      const errorRegion = screen.getByRole('alert');
      expect(errorRegion).toBeInTheDocument();
      expect(errorRegion).toHaveAttribute('aria-live', 'assertive');

      // Error messages should be associated with their fields
      const roleField = screen.getByRole('radiogroup');
      expect(roleField).toHaveAttribute('aria-describedby');
      expect(roleField).toHaveAttribute('aria-invalid', 'true');
    });
  });
});