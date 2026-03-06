/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// Import component - this will fail until component is implemented (TDD approach)
import { RoleSectionGroup } from '@/components/forms/role-section-group'
import {
  type RoleSectionGroupProps,
  type RoleSectionConfig,
  type RoleType,
  type RoleDefinition,
  DEFAULT_ROLE_SECTIONS,
  ROLE_SECTION_TEST_IDS,
  ROLE_SECTION_ARIA
} from '@/types/role-sections'

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

describe('RoleSectionGroup Component Contract Tests', () => {
  // Get predefined section configurations from DEFAULT_ROLE_SECTIONS
  const systemSectionConfig = DEFAULT_ROLE_SECTIONS.find(s => s.section === 'system')!
  const organizationSectionConfig = DEFAULT_ROLE_SECTIONS.find(s => s.section === 'organization')!

  const defaultProps: RoleSectionGroupProps = {
    config: systemSectionConfig,
    onRoleSelect: jest.fn(),
    'data-testid': 'test-role-section-group'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Interface & Props Contract', () => {
    it('should accept all required props according to RoleSectionGroupProps interface', () => {
      const mockOnRoleSelect = jest.fn()
      const testProps: RoleSectionGroupProps = {
        config: systemSectionConfig,
        selectedValue: 'system_admin',
        onRoleSelect: mockOnRoleSelect,
        disabled: false,
        className: 'test-custom-class',
        'data-testid': 'custom-test-id'
      }

      const { container } = render(<RoleSectionGroup {...testProps} />)
      
      // Component should render without errors
      expect(container.firstChild).toBeInTheDocument()
      
      // Should have custom test ID
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument()
      
      // Should apply custom className
      expect(container.firstChild).toHaveClass('test-custom-class')
    })

    it('should handle minimal props (only required config and onRoleSelect)', () => {
      const mockOnRoleSelect = jest.fn()
      
      render(<RoleSectionGroup config={systemSectionConfig} onRoleSelect={mockOnRoleSelect} />)
      
      expect(screen.getByTestId('test-role-section-group')).toBeInTheDocument()
    })

    it('should use default data-testid when not provided', () => {
      render(<RoleSectionGroup config={systemSectionConfig} onRoleSelect={jest.fn()} />)
      
      expect(screen.getByTestId('test-role-section-group')).toBeInTheDocument()
    })
  })

  describe('Section Rendering with Config', () => {
    it('should render section title and description from config', () => {
      render(<RoleSectionGroup {...defaultProps} />)
      
      expect(screen.getByText(systemSectionConfig.title)).toBeInTheDocument()
      expect(screen.getByText(systemSectionConfig.description)).toBeInTheDocument()
    })

    it('should render all roles defined in the section config', () => {
      render(<RoleSectionGroup config={organizationSectionConfig} onRoleSelect={jest.fn()} />)
      
      organizationSectionConfig.roles.forEach(role => {
        expect(screen.getByText(role.label)).toBeInTheDocument()
        expect(screen.getByText(role.description)).toBeInTheDocument()
      })
    })

    it('should use card-based layout for section structure', () => {
      render(<RoleSectionGroup {...defaultProps} />)
      
      expect(screen.getByTestId('card')).toBeInTheDocument()
      expect(screen.getByTestId('card-header')).toBeInTheDocument()
      expect(screen.getByTestId('card-title')).toBeInTheDocument()
      expect(screen.getByTestId('card-description')).toBeInTheDocument()
      expect(screen.getByTestId('card-content')).toBeInTheDocument()
    })
  })

  describe('System Section Configuration', () => {
    beforeEach(() => {
      render(<RoleSectionGroup config={systemSectionConfig} onRoleSelect={jest.fn()} />)
    })

    it('should render "System Roles" section with correct title and description', () => {
      expect(screen.getByText('System Roles')).toBeInTheDocument()
      expect(screen.getByText('Global platform administration roles with full system access')).toBeInTheDocument()
    })

    it('should contain exactly one role option (System Administrator)', () => {
      const radioInputs = screen.getAllByRole('radio')
      expect(radioInputs).toHaveLength(1)
      expect(radioInputs[0]).toHaveValue('system_admin')
    })

    it('should display System Administrator role with correct details', () => {
      expect(screen.getByText('System Administrator')).toBeInTheDocument()
      expect(screen.getByText('Complete system control across all organizations and users')).toBeInTheDocument()
      
      // Should have FULL ACCESS badge with destructive variant
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveTextContent('FULL ACCESS')
      expect(badge).toHaveAttribute('data-variant', 'destructive')
    })

    it('should have proper test ID for system section', () => {
      const systemSection = screen.getByTestId('test-role-section-group')
      expect(systemSection).toBeInTheDocument()
    })
  })

  describe('Organization Section Configuration', () => {
    const expectedOrgRoles = [
      { 
        id: 'organization_owner' as RoleType, 
        label: 'Organization Owner', 
        description: 'Complete organization ownership and management privileges',
        badge: { text: 'OWNER', variant: 'default' }
      },
      { 
        id: 'organization_admin' as RoleType, 
        label: 'Organization Administrator', 
        description: 'Administrative privileges for organization management',
        badge: { text: 'ADMIN', variant: 'secondary' }
      },
      { 
        id: 'game_master' as RoleType, 
        label: 'Game Master', 
        description: 'Lead murder mystery games and guide player experiences',
        badge: { text: 'GM', variant: 'default' }
      },
      { 
        id: 'game_staff' as RoleType, 
        label: 'Game Staff', 
        description: 'Support game operations and assist with customer service',
        badge: { text: 'STAFF', variant: 'outline' }
      },
      { 
        id: 'game_player' as RoleType, 
        label: 'Game Player', 
        description: 'Participate in murder mystery games and solve puzzles',
        badge: { text: 'PLAYER', variant: 'outline' }
      }
    ]

    beforeEach(() => {
      render(<RoleSectionGroup config={organizationSectionConfig} onRoleSelect={jest.fn()} />)
    })

    it('should render "Organization Roles" section with correct title and description', () => {
      expect(screen.getByText('Organization Roles')).toBeInTheDocument()
      expect(screen.getByText('Organization-specific roles for business and game management')).toBeInTheDocument()
    })

    it('should contain exactly five role options', () => {
      const radioInputs = screen.getAllByRole('radio')
      expect(radioInputs).toHaveLength(5)
      
      const expectedValues = ['organization_owner', 'organization_admin', 'game_master', 'game_staff', 'game_player']
      radioInputs.forEach((input, index) => {
        expect(input).toHaveValue(expectedValues[index])
      })
    })

    it('should display all organization roles with correct details', () => {
      expectedOrgRoles.forEach(role => {
        expect(screen.getByText(role.label)).toBeInTheDocument()
        expect(screen.getByText(role.description)).toBeInTheDocument()
        
        // Check badge
        const badgeElements = screen.getAllByTestId('badge')
        expect(badgeElements.some(badge => 
          badge.textContent === role.badge.text && 
          badge.getAttribute('data-variant') === role.badge.variant
        )).toBe(true)
      })
    })
  })

  describe('Role Selection Handling', () => {
    it('should call onRoleSelect with correct RoleType when a role is selected', async () => {
      const user = userEvent.setup()
      const mockOnRoleSelect = jest.fn()
      
      render(<RoleSectionGroup config={organizationSectionConfig} onRoleSelect={mockOnRoleSelect} />)
      
      // Test selecting organization owner
      const orgOwnerRadio = screen.getByRole('radio', { name: /organization owner/i })
      await user.click(orgOwnerRadio)
      
      expect(mockOnRoleSelect).toHaveBeenCalledWith('organization_owner')
      expect(mockOnRoleSelect).toHaveBeenCalledTimes(1)
    })

    it('should call onRoleSelect for each different role selection', async () => {
      const user = userEvent.setup()
      const mockOnRoleSelect = jest.fn()
      
      render(<RoleSectionGroup config={organizationSectionConfig} onRoleSelect={mockOnRoleSelect} />)
      
      // Test multiple role selections
      const rolesToTest: RoleType[] = ['organization_owner', 'game_master', 'game_staff']
      
      for (const roleType of rolesToTest) {
        const roleRadio = screen.getByRole('radio', { name: new RegExp(roleType.replace('_', ' '), 'i') })
        await user.click(roleRadio)
        
        expect(mockOnRoleSelect).toHaveBeenCalledWith(roleType)
      }
      
      expect(mockOnRoleSelect).toHaveBeenCalledTimes(3)
    })

    it('should handle rapid successive clicks correctly', async () => {
      const user = userEvent.setup()
      const mockOnRoleSelect = jest.fn()
      
      render(<RoleSectionGroup config={organizationSectionConfig} onRoleSelect={mockOnRoleSelect} />)
      
      const orgOwnerRadio = screen.getByRole('radio', { name: /organization owner/i })
      const gameMasterRadio = screen.getByRole('radio', { name: /game master/i })
      
      // Rapid clicks
      await user.click(orgOwnerRadio)
      await user.click(gameMasterRadio)
      await user.click(orgOwnerRadio)
      
      expect(mockOnRoleSelect).toHaveBeenCalledTimes(3)
      expect(mockOnRoleSelect).toHaveBeenNthCalledWith(1, 'organization_owner')
      expect(mockOnRoleSelect).toHaveBeenNthCalledWith(2, 'game_master')
      expect(mockOnRoleSelect).toHaveBeenNthCalledWith(3, 'organization_owner')
    })
  })

  describe('Selected Value Prop', () => {
    it('should reflect selectedValue prop correctly for system roles', () => {
      render(
        <RoleSectionGroup 
          config={systemSectionConfig} 
          selectedValue="system_admin"
          onRoleSelect={jest.fn()}
        />
      )
      
      const systemAdminRadio = screen.getByRole('radio', { name: /system administrator/i })
      expect(systemAdminRadio).toBeChecked()
    })

    it('should reflect selectedValue prop correctly for organization roles', () => {
      const { rerender } = render(
        <RoleSectionGroup 
          config={organizationSectionConfig} 
          selectedValue="game_master"
          onRoleSelect={jest.fn()}
        />
      )
      
      // Game master should be checked
      const gameMasterRadio = screen.getByRole('radio', { name: /game master/i })
      expect(gameMasterRadio).toBeChecked()
      
      // Others should not be checked
      const orgOwnerRadio = screen.getByRole('radio', { name: /organization owner/i })
      expect(orgOwnerRadio).not.toBeChecked()
      
      // Change selectedValue
      rerender(
        <RoleSectionGroup 
          config={organizationSectionConfig} 
          selectedValue="organization_admin"
          onRoleSelect={jest.fn()}
        />
      )
      
      // Organization admin should now be checked
      const orgAdminRadio = screen.getByRole('radio', { name: /organization administrator/i })
      expect(orgAdminRadio).toBeChecked()
      
      // Game master should no longer be checked
      expect(gameMasterRadio).not.toBeChecked()
    })

    it('should handle no selectedValue (undefined) correctly', () => {
      render(
        <RoleSectionGroup 
          config={organizationSectionConfig} 
          selectedValue={undefined}
          onRoleSelect={jest.fn()}
        />
      )
      
      const allRadioInputs = screen.getAllByRole('radio')
      allRadioInputs.forEach(radio => {
        expect(radio).not.toBeChecked()
      })
    })

    it('should handle selectedValue that does not match section roles', () => {
      // Render system section but pass organization role as selectedValue
      render(
        <RoleSectionGroup 
          config={systemSectionConfig} 
          selectedValue="organization_owner"
          onRoleSelect={jest.fn()}
        />
      )
      
      const systemAdminRadio = screen.getByRole('radio', { name: /system administrator/i })
      expect(systemAdminRadio).not.toBeChecked()
    })
  })

  describe('Disabled State', () => {
    it('should disable all role options when disabled prop is true', () => {
      render(
        <RoleSectionGroup 
          config={organizationSectionConfig} 
          disabled={true}
          onRoleSelect={jest.fn()}
        />
      )
      
      const allRadioInputs = screen.getAllByRole('radio')
      allRadioInputs.forEach(radio => {
        expect(radio).toBeDisabled()
      })
    })

    it('should not call onRoleSelect when disabled', async () => {
      const user = userEvent.setup()
      const mockOnRoleSelect = jest.fn()
      
      render(
        <RoleSectionGroup 
          config={organizationSectionConfig} 
          disabled={true}
          onRoleSelect={mockOnRoleSelect}
        />
      )
      
      const orgOwnerRadio = screen.getByRole('radio', { name: /organization owner/i })
      await user.click(orgOwnerRadio)
      
      expect(mockOnRoleSelect).not.toHaveBeenCalled()
    })

    it('should still render all content when disabled', () => {
      render(
        <RoleSectionGroup 
          config={organizationSectionConfig} 
          disabled={true}
          onRoleSelect={jest.fn()}
        />
      )
      
      // Should still show title and description
      expect(screen.getByText('Organization Roles')).toBeInTheDocument()
      expect(screen.getByText('Organization-specific roles for business and game management')).toBeInTheDocument()
      
      // Should still show all role options
      expect(screen.getAllByRole('radio')).toHaveLength(5)
    })

    it('should enable all role options when disabled prop is false', () => {
      render(
        <RoleSectionGroup 
          config={organizationSectionConfig} 
          disabled={false}
          onRoleSelect={jest.fn()}
        />
      )
      
      const allRadioInputs = screen.getAllByRole('radio')
      allRadioInputs.forEach(radio => {
        expect(radio).not.toBeDisabled()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for section group', () => {
      render(
        <RoleSectionGroup 
          config={systemSectionConfig} 
          onRoleSelect={jest.fn()}
          data-testid="system-section"
        />
      )
      
      const sectionGroup = screen.getByTestId('system-section')
      expect(sectionGroup).toHaveAttribute('role', ROLE_SECTION_ARIA.sectionGroup)
      expect(sectionGroup).toHaveAttribute(
        'aria-labelledby', 
        ROLE_SECTION_ARIA.sectionLabelledBy('system')
      )
    })

    it('should have proper heading hierarchy with correct IDs', () => {
      render(
        <RoleSectionGroup 
          config={organizationSectionConfig} 
          onRoleSelect={jest.fn()}
        />
      )
      
      const sectionTitle = screen.getByTestId('card-title')
      expect(sectionTitle).toHaveAttribute('id', ROLE_SECTION_ARIA.sectionLabelledBy('organization'))
    })

    it('should support keyboard navigation within the radio group', async () => {
      const user = userEvent.setup()
      const mockOnRoleSelect = jest.fn()
      
      render(<RoleSectionGroup config={organizationSectionConfig} onRoleSelect={mockOnRoleSelect} />)
      
      // Focus first radio button
      const firstRadio = screen.getAllByRole('radio')[0]
      await user.tab()
      expect(firstRadio).toHaveFocus()
      
      // Use arrow keys to navigate
      await user.keyboard('{ArrowDown}')
      const secondRadio = screen.getAllByRole('radio')[1]
      expect(secondRadio).toHaveFocus()
      
      // Space should select
      await user.keyboard(' ')
      expect(mockOnRoleSelect).toHaveBeenCalledWith('organization_admin')
    })

    it('should have proper radio group labeling', () => {
      render(<RoleSectionGroup config={systemSectionConfig} onRoleSelect={jest.fn()} />)
      
      const radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toBeInTheDocument()
    })
  })

  describe('Custom Configuration', () => {
    it('should render custom section configuration correctly', () => {
      const customConfig: RoleSectionConfig = {
        section: 'system',
        title: 'Custom System Roles',
        description: 'Custom description for testing',
        roles: [
          {
            id: 'system_admin',
            label: 'Custom Admin Label',
            description: 'Custom admin description',
            section: 'system',
            badge: {
              text: 'CUSTOM',
              variant: 'secondary'
            }
          }
        ]
      }
      
      render(<RoleSectionGroup config={customConfig} onRoleSelect={jest.fn()} />)
      
      expect(screen.getByText('Custom System Roles')).toBeInTheDocument()
      expect(screen.getByText('Custom description for testing')).toBeInTheDocument()
      expect(screen.getByText('Custom Admin Label')).toBeInTheDocument()
      expect(screen.getByText('Custom admin description')).toBeInTheDocument()
      
      const badge = screen.getByTestId('badge')
      expect(badge).toHaveTextContent('CUSTOM')
      expect(badge).toHaveAttribute('data-variant', 'secondary')
    })

    it('should handle empty roles array gracefully', () => {
      const emptyConfig: RoleSectionConfig = {
        section: 'system',
        title: 'Empty Section',
        description: 'Section with no roles',
        roles: []
      }
      
      render(<RoleSectionGroup config={emptyConfig} onRoleSelect={jest.fn()} />)
      
      expect(screen.getByText('Empty Section')).toBeInTheDocument()
      expect(screen.getByText('Section with no roles')).toBeInTheDocument()
      expect(screen.queryAllByRole('radio')).toHaveLength(0)
    })
  })

  describe('Component Integration', () => {
    it('should maintain visual consistency with shadcn/ui design system', () => {
      render(<RoleSectionGroup config={systemSectionConfig} onRoleSelect={jest.fn()} />)
      
      // Should use shadcn/ui Card components
      expect(screen.getByTestId('card')).toBeInTheDocument()
      
      // Should use shadcn/ui RadioGroup
      expect(screen.getByTestId('radio-group')).toBeInTheDocument()
      
      // Should use shadcn/ui Badge components
      expect(screen.getByTestId('badge')).toBeInTheDocument()
    })

    it('should handle re-renders correctly without losing state', () => {
      const mockOnRoleSelect = jest.fn()
      const { rerender } = render(
        <RoleSectionGroup 
          config={systemSectionConfig} 
          selectedValue="system_admin"
          onRoleSelect={mockOnRoleSelect}
        />
      )
      
      const systemAdminRadio = screen.getByRole('radio', { name: /system administrator/i })
      expect(systemAdminRadio).toBeChecked()
      
      // Re-render with same props
      rerender(
        <RoleSectionGroup 
          config={systemSectionConfig} 
          selectedValue="system_admin"
          onRoleSelect={mockOnRoleSelect}
        />
      )
      
      // Should maintain checked state
      expect(systemAdminRadio).toBeChecked()
    })

    it('should clean up properly on unmount', () => {
      const { unmount } = render(<RoleSectionGroup config={systemSectionConfig} onRoleSelect={jest.fn()} />)
      
      // Component should unmount without errors
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Role Badge Display', () => {
    it('should display role badges with correct variants', () => {
      render(<RoleSectionGroup config={organizationSectionConfig} onRoleSelect={jest.fn()} />)
      
      const badges = screen.getAllByTestId('badge')
      
      // Check each expected badge
      const expectedBadges = [
        { text: 'OWNER', variant: 'default' },
        { text: 'ADMIN', variant: 'secondary' },
        { text: 'GM', variant: 'default' },
        { text: 'STAFF', variant: 'outline' },
        { text: 'PLAYER', variant: 'outline' }
      ]
      
      expectedBadges.forEach(expectedBadge => {
        const badge = badges.find(b => 
          b.textContent === expectedBadge.text && 
          b.getAttribute('data-variant') === expectedBadge.variant
        )
        expect(badge).toBeInTheDocument()
      })
    })

    it('should handle roles without badges gracefully', () => {
      const configWithoutBadges: RoleSectionConfig = {
        section: 'system',
        title: 'No Badge Section',
        description: 'Section with roles without badges',
        roles: [
          {
            id: 'system_admin',
            label: 'Admin Without Badge',
            description: 'Admin without badge',
            section: 'system'
            // No badge property
          }
        ]
      }
      
      render(<RoleSectionGroup config={configWithoutBadges} onRoleSelect={jest.fn()} />)
      
      expect(screen.getByText('Admin Without Badge')).toBeInTheDocument()
      // Should not crash when no badge is present
    })
  })
})