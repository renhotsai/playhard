/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// Import component - this will fail until component is implemented (TDD approach)
import { RoleSelectionStep } from '@/components/forms/hierarchical-role-selection/role-selection-step'
import type {
  RoleSelectionStepProps,
  RoleOption,
  RoleCategory,
  RoleType
} from '@/types/hierarchical-roles'

// Mock shadcn/ui components to ensure they render correctly in tests
jest.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ value, onValueChange, children, className, ...props }: any) => (
    <div 
      role="radiogroup"
      className={className}
      data-testid="radio-group"
      aria-label={props['aria-label']}
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          checked: child.props.value === value,
          onChange: () => onValueChange?.(child.props.value)
        })
      )}
    </div>
  ),
  RadioGroupItem: ({ value, checked, onChange, disabled, className, ...props }: any) => (
    <input
      type="radio"
      value={value}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={className}
      data-testid={props['data-testid'] || `radio-${value}`}
      aria-labelledby={props['aria-labelledby']}
      {...props}
    />
  )
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, className, ...props }: any) => (
    <label htmlFor={htmlFor} className={className} {...props}>
      {children}
    </label>
  )
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span 
      className={`badge badge-${variant} ${className}`} 
      data-testid="badge"
      data-variant={variant}
      {...props}
    >
      {children}
    </span>
  )
}))

jest.mock('@/components/ui/input', () => ({
  Input: ({ className, placeholder, value, onChange, disabled, ...props }: any) => (
    <input
      className={className}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      data-testid="search-input"
      {...props}
    />
  )
}))

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, ...props }: any) => (
    <div 
      className={`skeleton ${className}`} 
      data-testid="skeleton"
      {...props}
    />
  )
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Shield: ({ className, ...props }: any) => (
    <svg className={className} data-testid="shield-icon" {...props} />
  ),
  Building2: ({ className, ...props }: any) => (
    <svg className={className} data-testid="building2-icon" {...props} />
  ),
  Users: ({ className, ...props }: any) => (
    <svg className={className} data-testid="users-icon" {...props} />
  ),
  Crown: ({ className, ...props }: any) => (
    <svg className={className} data-testid="crown-icon" {...props} />
  ),
  UserCheck: ({ className, ...props }: any) => (
    <svg className={className} data-testid="user-check-icon" {...props} />
  ),
  Headphones: ({ className, ...props }: any) => (
    <svg className={className} data-testid="headphones-icon" {...props} />
  ),
  Gamepad2: ({ className, ...props }: any) => (
    <svg className={className} data-testid="gamepad2-icon" {...props} />
  ),
  Search: ({ className, ...props }: any) => (
    <svg className={className} data-testid="search-icon" {...props} />
  )
}))

describe('RoleSelectionStep Component Contract Tests', () => {
  const mockSystemRoles: RoleOption[] = [
    {
      id: 'system_admin',
      title: 'System Administrator',
      description: 'Complete platform control with global administrative privileges',
      category: 'system',
      requiresOrganization: false,
      badge: 'GLOBAL',
      badgeVariant: 'destructive',
      icon: () => <svg data-testid="shield-icon" />
    }
  ]

  const mockOrganizationRoles: RoleOption[] = [
    {
      id: 'organization_owner',
      title: 'Organization Owner',
      description: 'Complete ownership and control of the organization',
      category: 'organization',
      requiresOrganization: true,
      badge: 'OWNER',
      badgeVariant: 'default',
      icon: () => <svg data-testid="crown-icon" />
    },
    {
      id: 'organization_admin',
      title: 'Organization Administrator',
      description: 'Administrative privileges within the organization',
      category: 'organization',
      requiresOrganization: true,
      badge: 'ADMIN',
      badgeVariant: 'secondary',
      icon: () => <svg data-testid="user-check-icon" />
    },
    {
      id: 'game_master',
      title: 'Game Master (GM)',
      description: 'Lead murder mystery games and guide player experiences',
      category: 'organization',
      requiresOrganization: true,
      badge: 'GM',
      badgeVariant: 'outline',
      icon: () => <svg data-testid="gamepad2-icon" />
    },
    {
      id: 'game_staff',
      title: 'Game Staff',
      description: 'Support game operations and provide customer service',
      category: 'organization',
      requiresOrganization: true,
      badge: 'STAFF',
      badgeVariant: 'outline',
      icon: () => <svg data-testid="headphones-icon" />
    },
    {
      id: 'game_player',
      title: 'Game Player',
      description: 'Participate in murder mystery games and solve puzzles',
      category: 'organization',
      requiresOrganization: true,
      badge: 'PLAYER',
      badgeVariant: 'outline',
      icon: () => <svg data-testid="users-icon" />
    }
  ]

  const defaultProps: RoleSelectionStepProps = {
    roles: mockOrganizationRoles,
    category: 'organization',
    onSelect: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Interface & Props Contract', () => {
    it('should accept all required props according to RoleSelectionStepProps interface', () => {
      const mockOnSelect = jest.fn()
      const testProps: RoleSelectionStepProps = {
        roles: mockOrganizationRoles,
        category: 'organization',
        selectedRole: 'organization_owner',
        onSelect: mockOnSelect,
        disabled: false,
        loading: false,
        error: 'Test error message',
        searchQuery: 'admin',
        onSearchChange: jest.fn(),
        showSearch: true,
        className: 'test-custom-class',
        'data-testid': 'custom-test-id'
      }

      const { container } = render(<RoleSelectionStep {...testProps} />)
      
      // Component should render without errors
      expect(container.firstChild).toBeInTheDocument()
      
      // Should have custom test ID
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument()
      
      // Should apply custom className
      expect(container.firstChild).toHaveClass('test-custom-class')
    })

    it('should handle minimal props (only required roles, category, and onSelect)', () => {
      const mockOnSelect = jest.fn()
      
      render(
        <RoleSelectionStep 
          roles={mockOrganizationRoles} 
          category="organization"
          onSelect={mockOnSelect} 
        />
      )
      
      expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
    })

    it('should use default data-testid when not provided', () => {
      render(<RoleSelectionStep {...defaultProps} />)
      
      expect(screen.getByTestId('role-selection-step')).toBeInTheDocument()
    })
  })

  describe('Role Display & Structure', () => {
    it('should render all provided role options', () => {
      render(<RoleSelectionStep {...defaultProps} />)
      
      // Check all organization roles are rendered
      const roleOptions = mockOrganizationRoles.map(role =>
        screen.getByTestId(`role-option-${role.id}`)
      )
      
      roleOptions.forEach(option => {
        expect(option).toBeInTheDocument()
      })
      
      expect(roleOptions).toHaveLength(5)
    })

    it('should display role titles and descriptions correctly', () => {
      render(<RoleSelectionStep {...defaultProps} />)
      
      mockOrganizationRoles.forEach(role => {
        expect(screen.getByText(role.title)).toBeInTheDocument()
        expect(screen.getByText(role.description)).toBeInTheDocument()
      })
    })

    it('should display role badges with correct variants', () => {
      render(<RoleSelectionStep {...defaultProps} />)
      
      const badges = screen.getAllByTestId('badge')
      expect(badges).toHaveLength(5)
      
      // Check specific badges
      const ownerBadge = badges.find(badge => badge.textContent === 'OWNER')
      expect(ownerBadge).toHaveAttribute('data-variant', 'default')
      
      const adminBadge = badges.find(badge => badge.textContent === 'ADMIN')
      expect(adminBadge).toHaveAttribute('data-variant', 'secondary')
      
      const gmBadge = badges.find(badge => badge.textContent === 'GM')
      expect(gmBadge).toHaveAttribute('data-variant', 'outline')
    })

    it('should render role icons correctly', () => {
      render(<RoleSelectionStep {...defaultProps} />)
      
      // Check specific icons are rendered
      expect(screen.getByTestId('crown-icon')).toBeInTheDocument()
      expect(screen.getByTestId('user-check-icon')).toBeInTheDocument()
      expect(screen.getByTestId('gamepad2-icon')).toBeInTheDocument()
      expect(screen.getByTestId('headphones-icon')).toBeInTheDocument()
      expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    })

    it('should use radio group layout for single selection', () => {
      render(<RoleSelectionStep {...defaultProps} />)
      
      const radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toBeInTheDocument()
      expect(radioGroup).toHaveAttribute('aria-label', 'Select organization role')
      
      const radioInputs = screen.getAllByRole('radio')
      expect(radioInputs).toHaveLength(5)
    })
  })

  describe('Category-Based Role Filtering', () => {
    it('should display only system roles when category is system', () => {
      render(
        <RoleSelectionStep 
          roles={mockSystemRoles}
          category="system"
          onSelect={jest.fn()}
        />
      )
      
      expect(screen.getByText('System Administrator')).toBeInTheDocument()
      expect(screen.getByTestId('role-option-system_admin')).toBeInTheDocument()
      
      // Should not show organization roles
      expect(screen.queryByText('Organization Owner')).not.toBeInTheDocument()
      expect(screen.queryByText('Game Master (GM)')).not.toBeInTheDocument()
    })

    it('should display only organization roles when category is organization', () => {
      render(<RoleSelectionStep {...defaultProps} />)
      
      // Should show all organization roles
      expect(screen.getByText('Organization Owner')).toBeInTheDocument()
      expect(screen.getByText('Organization Administrator')).toBeInTheDocument()
      expect(screen.getByText('Game Master (GM)')).toBeInTheDocument()
      expect(screen.getByText('Game Staff')).toBeInTheDocument()
      expect(screen.getByText('Game Player')).toBeInTheDocument()
      
      // Should not show system roles
      expect(screen.queryByText('System Administrator')).not.toBeInTheDocument()
    })

    it('should update aria-label based on category', () => {
      const { rerender } = render(
        <RoleSelectionStep 
          roles={mockSystemRoles}
          category="system"
          onSelect={jest.fn()}
        />
      )
      
      let radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toHaveAttribute('aria-label', 'Select system role')
      
      rerender(
        <RoleSelectionStep 
          roles={mockOrganizationRoles}
          category="organization"
          onSelect={jest.fn()}
        />
      )
      
      radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toHaveAttribute('aria-label', 'Select organization role')
    })
  })

  describe('Selection Behavior', () => {
    it('should call onSelect with correct role when clicked', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      
      render(
        <RoleSelectionStep 
          roles={mockOrganizationRoles}
          category="organization"
          onSelect={mockOnSelect}
        />
      )
      
      // Click organization owner
      const ownerRadio = screen.getByTestId('radio-organization_owner')
      await user.click(ownerRadio)
      
      expect(mockOnSelect).toHaveBeenCalledWith('organization_owner')
      
      // Click game master
      const gmRadio = screen.getByTestId('radio-game_master')
      await user.click(gmRadio)
      
      expect(mockOnSelect).toHaveBeenCalledWith('game_master')
    })

    it('should highlight selected role visually', () => {
      const { rerender } = render(
        <RoleSelectionStep 
          {...defaultProps}
          selectedRole="organization_owner"
        />
      )
      
      // Organization owner should be selected
      const ownerRadio = screen.getByTestId('radio-organization_owner')
      expect(ownerRadio).toBeChecked()
      
      // Others should not be selected
      const adminRadio = screen.getByTestId('radio-organization_admin')
      expect(adminRadio).not.toBeChecked()
      
      // Change selection
      rerender(
        <RoleSelectionStep 
          {...defaultProps}
          selectedRole="game_master"
        />
      )
      
      // Game master should now be selected
      const gmRadio = screen.getByTestId('radio-game_master')
      expect(gmRadio).toBeChecked()
      expect(ownerRadio).not.toBeChecked()
    })

    it('should show no selection when selectedRole is null', () => {
      render(<RoleSelectionStep {...defaultProps} selectedRole={null} />)
      
      const radioInputs = screen.getAllByRole('radio')
      radioInputs.forEach(radio => {
        expect(radio).not.toBeChecked()
      })
    })

    it('should handle rapid successive clicks correctly', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      
      render(
        <RoleSelectionStep 
          roles={mockOrganizationRoles}
          category="organization"
          onSelect={mockOnSelect}
        />
      )
      
      const ownerRadio = screen.getByTestId('radio-organization_owner')
      const adminRadio = screen.getByTestId('radio-organization_admin')
      const gmRadio = screen.getByTestId('radio-game_master')
      
      // Rapid clicks
      await user.click(ownerRadio)
      await user.click(adminRadio)
      await user.click(gmRadio)
      
      expect(mockOnSelect).toHaveBeenCalledTimes(3)
      expect(mockOnSelect).toHaveBeenNthCalledWith(1, 'organization_owner')
      expect(mockOnSelect).toHaveBeenNthCalledWith(2, 'organization_admin')
      expect(mockOnSelect).toHaveBeenNthCalledWith(3, 'game_master')
    })
  })

  describe('Search Functionality', () => {
    it('should show search input when showSearch is true', () => {
      render(<RoleSelectionStep {...defaultProps} showSearch={true} />)
      
      const searchInput = screen.getByTestId('search-input')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('placeholder', 'Search roles...')
    })

    it('should hide search input when showSearch is false or undefined', () => {
      render(<RoleSelectionStep {...defaultProps} showSearch={false} />)
      
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument()
    })

    it('should call onSearchChange when search input changes', async () => {
      const user = userEvent.setup()
      const mockOnSearchChange = jest.fn()
      
      render(
        <RoleSelectionStep 
          {...defaultProps} 
          showSearch={true}
          onSearchChange={mockOnSearchChange}
        />
      )
      
      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'admin')
      
      expect(mockOnSearchChange).toHaveBeenCalledWith('admin')
    })

    it('should reflect search query in input value', () => {
      render(
        <RoleSelectionStep 
          {...defaultProps} 
          showSearch={true}
          searchQuery="master"
        />
      )
      
      const searchInput = screen.getByTestId('search-input')
      expect(searchInput).toHaveValue('master')
    })

    it('should filter roles based on search query', () => {
      const filteredRoles = mockOrganizationRoles.filter(role =>
        role.title.toLowerCase().includes('admin')
      )
      
      render(
        <RoleSelectionStep 
          roles={filteredRoles}
          category="organization"
          onSelect={jest.fn()}
          showSearch={true}
          searchQuery="admin"
        />
      )
      
      // Should only show admin role
      expect(screen.getByText('Organization Administrator')).toBeInTheDocument()
      expect(screen.queryByText('Organization Owner')).not.toBeInTheDocument()
      expect(screen.queryByText('Game Master (GM)')).not.toBeInTheDocument()
    })

    it('should show no results message when search yields no matches', () => {
      render(
        <RoleSelectionStep 
          roles={[]}
          category="organization"
          onSelect={jest.fn()}
          showSearch={true}
          searchQuery="nonexistent"
        />
      )
      
      expect(screen.getByTestId('no-results')).toBeInTheDocument()
      expect(screen.getByText('No roles found matching "nonexistent"')).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should disable all role options when disabled prop is true', () => {
      render(<RoleSelectionStep {...defaultProps} disabled={true} />)
      
      const radioInputs = screen.getAllByRole('radio')
      radioInputs.forEach(radio => {
        expect(radio).toBeDisabled()
      })
    })

    it('should not call onSelect when disabled', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      
      render(
        <RoleSelectionStep 
          roles={mockOrganizationRoles}
          category="organization"
          onSelect={mockOnSelect}
          disabled={true}
        />
      )
      
      const ownerRadio = screen.getByTestId('radio-organization_owner')
      await user.click(ownerRadio)
      
      expect(mockOnSelect).not.toHaveBeenCalled()
    })

    it('should disable search input when disabled', () => {
      render(
        <RoleSelectionStep 
          {...defaultProps} 
          disabled={true}
          showSearch={true}
        />
      )
      
      const searchInput = screen.getByTestId('search-input')
      expect(searchInput).toBeDisabled()
    })

    it('should show visual disabled state', () => {
      render(<RoleSelectionStep {...defaultProps} disabled={true} />)
      
      const container = screen.getByTestId('role-selection-step')
      expect(container).toHaveClass('disabled')
    })
  })

  describe('Loading State', () => {
    it('should show loading skeletons when loading prop is true', () => {
      render(<RoleSelectionStep {...defaultProps} loading={true} />)
      
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons.length).toBeGreaterThan(0)
      
      // Should show loading state instead of actual roles
      expect(screen.queryByText('Organization Owner')).not.toBeInTheDocument()
    })

    it('should disable interactions when in loading state', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      
      render(
        <RoleSelectionStep 
          roles={mockOrganizationRoles}
          category="organization"
          onSelect={mockOnSelect}
          loading={true}
        />
      )
      
      // Should not be able to interact with roles during loading
      expect(mockOnSelect).not.toHaveBeenCalled()
    })

    it('should show loading indicator', () => {
      render(<RoleSelectionStep {...defaultProps} loading={true} />)
      
      const loadingIndicator = screen.getByTestId('loading-indicator')
      expect(loadingIndicator).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Failed to load roles'
      
      render(
        <RoleSelectionStep 
          {...defaultProps} 
          error={errorMessage}
        />
      )
      
      const errorElement = screen.getByTestId('error-message')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement).toHaveTextContent(errorMessage)
    })

    it('should not display error container when no error', () => {
      render(<RoleSelectionStep {...defaultProps} />)
      
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
    })

    it('should apply error styling when error is present', () => {
      render(
        <RoleSelectionStep 
          {...defaultProps} 
          error="Error message"
        />
      )
      
      const container = screen.getByTestId('role-selection-step')
      expect(container).toHaveClass('error')
    })

    it('should still allow selection if error is present but not disabled', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      
      render(
        <RoleSelectionStep 
          roles={mockOrganizationRoles}
          category="organization"
          onSelect={mockOnSelect}
          error="Error message"
        />
      )
      
      const ownerRadio = screen.getByTestId('radio-organization_owner')
      await user.click(ownerRadio)
      
      expect(mockOnSelect).toHaveBeenCalledWith('organization_owner')
    })
  })

  describe('Empty Roles Handling', () => {
    it('should handle empty roles array gracefully', () => {
      render(
        <RoleSelectionStep 
          roles={[]}
          category="organization"
          onSelect={jest.fn()}
        />
      )
      
      const container = screen.getByTestId('role-selection-step')
      expect(container).toBeInTheDocument()
      
      // Should show empty state message
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('No roles available for this category')).toBeInTheDocument()
    })

    it('should not show radio group when roles array is empty', () => {
      render(
        <RoleSelectionStep 
          roles={[]}
          category="organization"
          onSelect={jest.fn()}
        />
      )
      
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<RoleSelectionStep {...defaultProps} />)
      
      // Main radio group
      const radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toHaveAttribute('aria-label', 'Select organization role')
      
      // Individual role options
      const ownerRadio = screen.getByTestId('radio-organization_owner')
      expect(ownerRadio).toHaveAttribute('aria-labelledby', 'role-label-organization_owner')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      
      render(
        <RoleSelectionStep 
          roles={mockOrganizationRoles}
          category="organization"
          onSelect={mockOnSelect}
        />
      )
      
      // Tab to radio group
      await user.tab()
      const firstRadio = screen.getByTestId('radio-organization_owner')
      expect(firstRadio).toHaveFocus()
      
      // Use arrow keys to navigate
      await user.keyboard('{ArrowDown}')
      const secondRadio = screen.getByTestId('radio-organization_admin')
      expect(secondRadio).toHaveFocus()
      
      // Space should select
      await user.keyboard(' ')
      expect(mockOnSelect).toHaveBeenCalledWith('organization_admin')
    })

    it('should announce selection state to screen readers', () => {
      render(
        <RoleSelectionStep 
          {...defaultProps}
          selectedRole="organization_owner"
        />
      )
      
      const ownerRadio = screen.getByTestId('radio-organization_owner')
      expect(ownerRadio).toHaveAttribute('aria-checked', 'true')
      
      const adminRadio = screen.getByTestId('radio-organization_admin')
      expect(adminRadio).toHaveAttribute('aria-checked', 'false')
    })

    it('should properly indicate disabled state to screen readers', () => {
      render(<RoleSelectionStep {...defaultProps} disabled={true} />)
      
      const radioInputs = screen.getAllByRole('radio')
      radioInputs.forEach(radio => {
        expect(radio).toHaveAttribute('aria-disabled', 'true')
      })
    })

    it('should have proper heading hierarchy for role labels', () => {
      render(<RoleSelectionStep {...defaultProps} />)
      
      const roleLabels = screen.getAllByTestId(/^role-label-/)
      roleLabels.forEach(label => {
        expect(label).toHaveAttribute('id')
      })
    })
  })

  describe('Integration with Form Systems', () => {
    it('should work correctly when controlled by external state', () => {
      const { rerender } = render(
        <RoleSelectionStep 
          {...defaultProps}
          selectedRole={null}
        />
      )
      
      // No selection initially
      const radioInputs = screen.getAllByRole('radio')
      radioInputs.forEach(radio => {
        expect(radio).not.toBeChecked()
      })
      
      // External state update
      rerender(
        <RoleSelectionStep 
          {...defaultProps}
          selectedRole="game_master"
        />
      )
      
      const gmRadio = screen.getByTestId('radio-game_master')
      expect(gmRadio).toBeChecked()
    })

    it('should maintain consistency with TanStack Form integration', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      
      render(
        <RoleSelectionStep 
          roles={mockOrganizationRoles}
          category="organization"
          onSelect={mockOnSelect}
        />
      )
      
      const ownerRadio = screen.getByTestId('radio-organization_owner')
      await user.click(ownerRadio)
      
      // Should call onSelect with proper data structure expected by TanStack Form
      expect(mockOnSelect).toHaveBeenCalledWith('organization_owner')
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
    })
  })

  describe('Performance Considerations', () => {
    it('should handle large numbers of roles efficiently', () => {
      const manyRoles: RoleOption[] = Array.from({ length: 100 }, (_, i) => ({
        id: `role_${i}` as RoleType,
        title: `Role ${i}`,
        description: `Description for role ${i}`,
        category: 'organization',
        requiresOrganization: true,
        badge: `BADGE${i}`,
        badgeVariant: 'outline',
        icon: () => <svg data-testid={`icon-${i}`} />
      }))
      
      const start = performance.now()
      render(
        <RoleSelectionStep 
          roles={manyRoles}
          category="organization"
          onSelect={jest.fn()}
        />
      )
      const end = performance.now()
      
      // Should render efficiently (less than 100ms for 100 items)
      expect(end - start).toBeLessThan(100)
      
      // Should render all roles
      const radioInputs = screen.getAllByRole('radio')
      expect(radioInputs).toHaveLength(100)
    })
  })
})