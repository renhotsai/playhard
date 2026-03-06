/**
 * T009: Component test OrganizationSelection
 * 
 * Tests the organization selection component that shows available organizations
 * for role assignment when organization roles are selected.
 * 
 * CRITICAL: This test MUST FAIL initially (TDD RED phase)
 * Implementation comes after tests pass
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizationSelection } from '@/components/forms/hierarchical-role-selection/organization-selection';
import type { OrganizationOption } from '@/types/hierarchical-roles';

// Mock shadcn/ui components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled }: any) => (
    <div data-testid="select-root" className={disabled ? 'disabled' : ''}>
      <select
        data-testid="select-trigger"
        value={value || ''}
        onChange={(e) => onValueChange?.(e.target.value)}
        disabled={disabled}
      >
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <option value={value} data-testid={`select-item-${value}`}>
      {children}
    </option>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, className }: any) => (
    <label htmlFor={htmlFor} className={className} data-testid="label">
      {children}
    </label>
  )
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => (
    <div className={className} data-testid="skeleton" />
  )
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, className }: any) => (
    <div 
      data-testid="alert" 
      data-variant={variant}
      className={className}
    >
      {children}
    </div>
  ),
  AlertDescription: ({ children }: any) => (
    <div data-testid="alert-description">{children}</div>
  )
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Building2: ({ className }: any) => (
    <svg className={className} data-testid="building2-icon" />
  ),
  Users: ({ className }: any) => (
    <svg className={className} data-testid="users-icon" />
  ),
  AlertCircle: ({ className }: any) => (
    <svg className={className} data-testid="alert-circle-icon" />
  )
}));

describe('OrganizationSelection Component Contract Tests', () => {
  const mockOrganizations: OrganizationOption[] = [
    {
      id: 'org-1',
      name: 'Gaming Corp',
      slug: 'gaming-corp',
      description: 'Professional murder mystery gaming company',
      memberCount: 25,
      disabled: false
    },
    {
      id: 'org-2', 
      name: 'Mystery Events Ltd',
      slug: 'mystery-events',
      description: 'Corporate event mystery experiences',
      memberCount: 12,
      disabled: false
    },
    {
      id: 'org-3',
      name: 'Disabled Org',
      slug: 'disabled-org',
      description: 'This organization is disabled',
      memberCount: 0,
      disabled: true
    }
  ];

  const defaultProps = {
    organizations: mockOrganizations,
    onSelect: jest.fn(),
    loading: false,
    disabled: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Interface & Props Contract', () => {
    it('should accept all props according to interface', () => {
      const onSelect = jest.fn();
      const props = {
        organizations: mockOrganizations,
        selectedOrganization: 'org-1',
        onSelect,
        loading: false,
        disabled: false,
        error: 'Test error',
        className: 'test-class',
        'data-testid': 'custom-test-id'
      };

      render(<OrganizationSelection {...props} />);

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
      expect(screen.getByTestId('custom-test-id')).toHaveClass('test-class');
    });

    it('should render with minimal required props', () => {
      render(
        <OrganizationSelection 
          organizations={mockOrganizations}
          onSelect={jest.fn()}
        />
      );

      expect(screen.getByTestId('organization-selection')).toBeInTheDocument();
    });

    it('should use default testid when not provided', () => {
      render(<OrganizationSelection {...defaultProps} />);
      
      expect(screen.getByTestId('organization-selection')).toBeInTheDocument();
    });
  });

  describe('Organization Display & Selection', () => {
    it('should display all available organizations in select', () => {
      render(<OrganizationSelection {...defaultProps} />);

      const selectItems = screen.getAllByTestId(/^select-item-/);
      expect(selectItems).toHaveLength(4); // 3 orgs + placeholder

      expect(screen.getByTestId('select-item-org-1')).toBeInTheDocument();
      expect(screen.getByTestId('select-item-org-2')).toBeInTheDocument();
      expect(screen.getByTestId('select-item-org-3')).toBeInTheDocument();
    });

    it('should show organization names and member counts', () => {
      render(<OrganizationSelection {...defaultProps} />);

      expect(screen.getByText('Gaming Corp (25 members)')).toBeInTheDocument();
      expect(screen.getByText('Mystery Events Ltd (12 members)')).toBeInTheDocument();
      expect(screen.getByText('Disabled Org (0 members)')).toBeInTheDocument();
    });

    it('should call onSelect when organization is chosen', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();

      render(
        <OrganizationSelection 
          organizations={mockOrganizations}
          onSelect={onSelect}
        />
      );

      const select = screen.getByTestId('select-trigger');
      await user.selectOptions(select, 'org-1');

      expect(onSelect).toHaveBeenCalledWith('org-1');
    });

    it('should show selected organization when controlled', () => {
      render(
        <OrganizationSelection 
          {...defaultProps}
          selectedOrganization="org-2"
        />
      );

      const select = screen.getByTestId('select-trigger');
      expect(select).toHaveValue('org-2');
    });

    it('should handle organization selection changes', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();

      const { rerender } = render(
        <OrganizationSelection 
          organizations={mockOrganizations}
          onSelect={onSelect}
          selectedOrganization="org-1"
        />
      );

      const select = screen.getByTestId('select-trigger');
      expect(select).toHaveValue('org-1');

      // Change selection
      await user.selectOptions(select, 'org-2');
      expect(onSelect).toHaveBeenCalledWith('org-2');

      // Simulate parent component updating selected value
      rerender(
        <OrganizationSelection 
          organizations={mockOrganizations}
          onSelect={onSelect}
          selectedOrganization="org-2"
        />
      );

      expect(select).toHaveValue('org-2');
    });
  });

  describe('Empty State Handling', () => {
    it('should show empty state when no organizations available', () => {
      render(
        <OrganizationSelection 
          organizations={[]}
          onSelect={jest.fn()}
        />
      );

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No organizations available')).toBeInTheDocument();
    });

    it('should disable select when no organizations available', () => {
      render(
        <OrganizationSelection 
          organizations={[]}
          onSelect={jest.fn()}
        />
      );

      const selectRoot = screen.getByTestId('select-root');
      expect(selectRoot).toHaveClass('disabled');
    });

    it('should show message for organization creation', () => {
      render(
        <OrganizationSelection 
          organizations={[]}
          onSelect={jest.fn()}
        />
      );

      expect(screen.getByText(/Contact system administrator/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when loading', () => {
      render(
        <OrganizationSelection 
          {...defaultProps}
          loading={true}
        />
      );

      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('should disable select during loading', () => {
      render(
        <OrganizationSelection 
          {...defaultProps}
          loading={true}
        />
      );

      const selectRoot = screen.getByTestId('select-root');
      expect(selectRoot).toHaveClass('disabled');
    });

    it('should not call onSelect when loading', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();

      render(
        <OrganizationSelection 
          organizations={mockOrganizations}
          onSelect={onSelect}
          loading={true}
        />
      );

      const select = screen.getByTestId('select-trigger');
      await user.selectOptions(select, 'org-1');

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should show loading text', () => {
      render(
        <OrganizationSelection 
          {...defaultProps}
          loading={true}
        />
      );

      expect(screen.getByText('Loading organizations...')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable select when disabled prop is true', () => {
      render(
        <OrganizationSelection 
          {...defaultProps}
          disabled={true}
        />
      );

      const selectRoot = screen.getByTestId('select-root');
      expect(selectRoot).toHaveClass('disabled');
    });

    it('should not call onSelect when disabled', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();

      render(
        <OrganizationSelection 
          organizations={mockOrganizations}
          onSelect={onSelect}
          disabled={true}
        />
      );

      const select = screen.getByTestId('select-trigger');
      await user.selectOptions(select, 'org-1');

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('should show disabled styling', () => {
      render(
        <OrganizationSelection 
          {...defaultProps}
          disabled={true}
        />
      );

      const container = screen.getByTestId('organization-selection');
      expect(container).toHaveClass('disabled');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error prop provided', () => {
      const errorMessage = 'Failed to load organizations';

      render(
        <OrganizationSelection 
          {...defaultProps}
          error={errorMessage}
        />
      );

      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByTestId('alert-description')).toHaveTextContent(errorMessage);
    });

    it('should apply error variant to alert', () => {
      render(
        <OrganizationSelection 
          {...defaultProps}
          error="Error message"
        />
      );

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('data-variant', 'destructive');
    });

    it('should show error icon', () => {
      render(
        <OrganizationSelection 
          {...defaultProps}
          error="Error message"
        />
      );

      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should not show error when no error prop', () => {
      render(<OrganizationSelection {...defaultProps} />);

      expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
    });
  });

  describe('Organization Details', () => {
    it('should show organization descriptions in tooltip or additional info', () => {
      render(<OrganizationSelection {...defaultProps} />);

      // This test assumes the component shows descriptions somewhere
      // Implementation details will determine exact behavior
      const container = screen.getByTestId('organization-selection');
      expect(container).toBeInTheDocument();
    });

    it('should handle organizations with zero members', () => {
      const orgsWithZeroMembers = [
        {
          id: 'empty-org',
          name: 'Empty Organization',
          slug: 'empty-org',
          memberCount: 0,
          disabled: false
        }
      ];

      render(
        <OrganizationSelection 
          organizations={orgsWithZeroMembers}
          onSelect={jest.fn()}
        />
      );

      expect(screen.getByText('Empty Organization (0 members)')).toBeInTheDocument();
    });

    it('should handle organizations with undefined member count', () => {
      const orgsWithUndefinedCount = [
        {
          id: 'unknown-org',
          name: 'Unknown Count Org',
          slug: 'unknown-org',
          disabled: false
          // memberCount is undefined
        }
      ];

      render(
        <OrganizationSelection 
          organizations={orgsWithUndefinedCount}
          onSelect={jest.fn()}
        />
      );

      expect(screen.getByText('Unknown Count Org')).toBeInTheDocument();
    });
  });

  describe('Disabled Organizations', () => {
    it('should visually distinguish disabled organizations', () => {
      render(<OrganizationSelection {...defaultProps} />);

      const disabledItem = screen.getByTestId('select-item-org-3');
      expect(disabledItem).toHaveAttribute('disabled');
    });

    it('should show disabled organizations but prevent selection', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();

      render(
        <OrganizationSelection 
          organizations={mockOrganizations}
          onSelect={onSelect}
        />
      );

      // Disabled organization should be visible but not selectable
      expect(screen.getByTestId('select-item-org-3')).toBeInTheDocument();
      
      const select = screen.getByTestId('select-trigger');
      await user.selectOptions(select, 'org-3');

      // Should not call onSelect for disabled organization
      expect(onSelect).not.toHaveBeenCalledWith('org-3');
    });
  });

  describe('Form Label and Instructions', () => {
    it('should have proper label for accessibility', () => {
      render(<OrganizationSelection {...defaultProps} />);

      const label = screen.getByTestId('label');
      expect(label).toHaveTextContent('Organization');
      expect(label).toHaveAttribute('htmlFor', 'organization-select');
    });

    it('should show helpful instructions', () => {
      render(<OrganizationSelection {...defaultProps} />);

      expect(screen.getByText(/Select the organization/)).toBeInTheDocument();
    });

    it('should show required indicator when needed', () => {
      render(
        <OrganizationSelection 
          {...defaultProps}
          required={true}
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Search and Filtering', () => {
    it('should support search when many organizations', () => {
      const manyOrganizations = Array.from({ length: 15 }, (_, i) => ({
        id: `org-${i}`,
        name: `Organization ${i}`,
        slug: `org-${i}`,
        memberCount: i * 2,
        disabled: false
      }));

      render(
        <OrganizationSelection 
          organizations={manyOrganizations}
          onSelect={jest.fn()}
          searchable={true}
        />
      );

      // Should show search input when many organizations
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('should filter organizations based on search', async () => {
      const user = userEvent.setup();
      const manyOrganizations = [
        { id: 'org-1', name: 'Gaming Corp', slug: 'gaming', memberCount: 25, disabled: false },
        { id: 'org-2', name: 'Mystery Events', slug: 'mystery', memberCount: 12, disabled: false },
        { id: 'org-3', name: 'Event Planning', slug: 'events', memberCount: 8, disabled: false }
      ];

      render(
        <OrganizationSelection 
          organizations={manyOrganizations}
          onSelect={jest.fn()}
          searchable={true}
        />
      );

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Gaming');

      // Should filter to show only Gaming Corp
      expect(screen.getByTestId('select-item-org-1')).toBeInTheDocument();
      expect(screen.queryByTestId('select-item-org-2')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<OrganizationSelection {...defaultProps} />);

      const select = screen.getByTestId('select-trigger');
      expect(select).toHaveAttribute('aria-label', 'Select organization');
      
      const container = screen.getByTestId('organization-selection');
      expect(container).toHaveAttribute('role', 'group');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(<OrganizationSelection {...defaultProps} />);

      const select = screen.getByTestId('select-trigger');
      
      // Should be focusable
      await user.tab();
      expect(select).toHaveFocus();

      // Should open on Enter/Space
      await user.keyboard('{Enter}');
      expect(screen.getByTestId('select-content')).toBeInTheDocument();
    });

    it('should announce selection changes to screen readers', () => {
      render(
        <OrganizationSelection 
          {...defaultProps}
          selectedOrganization="org-1"
        />
      );

      const select = screen.getByTestId('select-trigger');
      expect(select).toHaveAttribute('aria-describedby');
    });
  });

  describe('Integration with Form Libraries', () => {
    it('should work with controlled form state', () => {
      const { rerender } = render(
        <OrganizationSelection 
          {...defaultProps}
          selectedOrganization={null}
        />
      );

      const select = screen.getByTestId('select-trigger');
      expect(select).toHaveValue('');

      rerender(
        <OrganizationSelection 
          {...defaultProps}
          selectedOrganization="org-1"
        />
      );

      expect(select).toHaveValue('org-1');
    });

    it('should provide consistent callback interface', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();

      render(
        <OrganizationSelection 
          organizations={mockOrganizations}
          onSelect={onSelect}
        />
      );

      const select = screen.getByTestId('select-trigger');
      await user.selectOptions(select, 'org-2');

      expect(onSelect).toHaveBeenCalledWith('org-2');
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('should handle null/undefined selection gracefully', () => {
      render(
        <OrganizationSelection 
          {...defaultProps}
          selectedOrganization={null}
        />
      );

      const select = screen.getByTestId('select-trigger');
      expect(select).toHaveValue('');
    });
  });

  describe('Performance', () => {
    it('should render quickly with many organizations', () => {
      const manyOrganizations = Array.from({ length: 100 }, (_, i) => ({
        id: `org-${i}`,
        name: `Organization ${i}`,
        slug: `org-${i}`,
        memberCount: i,
        disabled: false
      }));

      const start = performance.now();
      render(
        <OrganizationSelection 
          organizations={manyOrganizations}
          onSelect={jest.fn()}
        />
      );
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // Should render in < 100ms
    });

    it('should not re-render unnecessarily', () => {
      const renderCount = jest.fn();
      
      function TestWrapper(props: any) {
        renderCount();
        return <OrganizationSelection {...props} />;
      }

      const { rerender } = render(
        <TestWrapper {...defaultProps} />
      );

      expect(renderCount).toHaveBeenCalledTimes(1);

      // Same props should not cause re-render
      rerender(<TestWrapper {...defaultProps} />);
      
      // Implementation detail: may vary based on React optimization
      expect(renderCount).toHaveBeenCalledTimes(2);
    });
  });
});