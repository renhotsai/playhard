/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// Import component - this will fail until component is implemented (TDD approach)
import { RoleSelectionSections } from '@/components/forms/role-selection-sections'
import {
  type RoleSelectionSectionsProps,
  type RoleType,
  type RoleSectionConfig,
  DEFAULT_ROLE_SECTIONS,
  ROLE_SECTION_TEST_IDS,
  ROLE_SECTION_ARIA
} from '../../specs/003-implement-admin-create/contracts/role-sections-components'

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

describe('RoleSelectionSections Component Contract Tests', () => {
  const defaultProps: RoleSelectionSectionsProps = {
    onValueChange: jest.fn(),
    'data-testid': ROLE_SECTION_TEST_IDS.container
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Interface & Props Contract', () => {
    it('should accept all required props according to RoleSelectionSectionsProps interface', () => {
      const mockOnValueChange = jest.fn()
      const testProps: RoleSelectionSectionsProps = {
        value: 'system_admin',
        onValueChange: mockOnValueChange,
        disabled: false,
        error: 'Test error message',
        sections: DEFAULT_ROLE_SECTIONS,
        className: 'test-custom-class',
        'data-testid': 'custom-test-id'
      }

      const { container } = render(<RoleSelectionSections {...testProps} />)
      
      // Component should render without errors
      expect(container.firstChild).toBeInTheDocument()
      
      // Should have custom test ID
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument()
      
      // Should apply custom className
      expect(container.firstChild).toHaveClass('test-custom-class')
    })

    it('should handle minimal props (only required onValueChange)', () => {
      const mockOnValueChange = jest.fn()
      
      render(<RoleSelectionSections onValueChange={mockOnValueChange} />)
      
      expect(screen.getByTestId(ROLE_SECTION_TEST_IDS.container)).toBeInTheDocument()
    })

    it('should use default data-testid when not provided', () => {
      render(<RoleSelectionSections onValueChange={jest.fn()} />)
      
      expect(screen.getByTestId(ROLE_SECTION_TEST_IDS.container)).toBeInTheDocument()
    })
  })

  describe('Two-Section Structure', () => {
    it('should render exactly two sections: System Roles and Organization Roles', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      // Check System Roles section
      const systemSection = screen.getByTestId(ROLE_SECTION_TEST_IDS.systemSection)
      expect(systemSection).toBeInTheDocument()
      
      // Check Organization Roles section  
      const organizationSection = screen.getByTestId(ROLE_SECTION_TEST_IDS.organizationSection)
      expect(organizationSection).toBeInTheDocument()
      
      // Should have exactly 2 card components
      const cards = screen.getAllByTestId('card')
      expect(cards).toHaveLength(2)
    })

    it('should render section titles and descriptions correctly', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      // System section
      expect(screen.getByText('System Roles')).toBeInTheDocument()
      expect(screen.getByText('Global platform administration roles with full system access')).toBeInTheDocument()
      
      // Organization section
      expect(screen.getByText('Organization Roles')).toBeInTheDocument()
      expect(screen.getByText('Organization-specific roles for business and game management')).toBeInTheDocument()
    })

    it('should use card-based layout for visual section separation', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      const cards = screen.getAllByTestId('card')
      expect(cards).toHaveLength(2)
      
      // Each section should have card header with title and description
      const cardHeaders = screen.getAllByTestId('card-header')
      expect(cardHeaders).toHaveLength(2)
      
      const cardTitles = screen.getAllByTestId('card-title')
      expect(cardTitles).toHaveLength(2)
      
      const cardDescriptions = screen.getAllByTestId('card-description')
      expect(cardDescriptions).toHaveLength(2)
    })
  })

  describe('System Roles Section', () => {
    it('should contain only System Administrator role', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      const systemSection = screen.getByTestId(ROLE_SECTION_TEST_IDS.systemSection)
      
      // Should contain System Administrator
      const systemAdminOption = within(systemSection).getByTestId(
        ROLE_SECTION_TEST_IDS.roleOption('system_admin')
      )
      expect(systemAdminOption).toBeInTheDocument()
      
      // Should display correct label
      expect(within(systemSection).getByText('System Administrator')).toBeInTheDocument()
      
      // Should display description
      expect(within(systemSection).getByText('Complete system control across all organizations and users')).toBeInTheDocument()
      
      // Should have FULL ACCESS badge
      const badge = within(systemSection).getByTestId('badge')
      expect(badge).toHaveTextContent('FULL ACCESS')
      expect(badge).toHaveAttribute('data-variant', 'destructive')
    })

    it('should have exactly one role option in system section', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      const systemSection = screen.getByTestId(ROLE_SECTION_TEST_IDS.systemSection)
      const radioInputs = within(systemSection).getAllByRole('radio')
      
      expect(radioInputs).toHaveLength(1)
      expect(radioInputs[0]).toHaveValue('system_admin')
    })
  })

  describe('Organization Roles Section', () => {
    const expectedOrgRoles = [
      { id: 'organization_owner', label: 'Organization Owner', badge: 'OWNER' },
      { id: 'organization_admin', label: 'Organization Administrator', badge: 'ADMIN' },
      { id: 'game_master', label: 'Game Master', badge: 'GM' },
      { id: 'game_staff', label: 'Game Staff', badge: 'STAFF' },
      { id: 'game_player', label: 'Game Player', badge: 'PLAYER' }
    ]

    it('should contain all five organization roles', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      const organizationSection = screen.getByTestId(ROLE_SECTION_TEST_IDS.organizationSection)
      
      expectedOrgRoles.forEach(role => {
        const roleOption = within(organizationSection).getByTestId(
          ROLE_SECTION_TEST_IDS.roleOption(role.id as RoleType)
        )
        expect(roleOption).toBeInTheDocument()
        
        // Check label
        expect(within(organizationSection).getByText(role.label)).toBeInTheDocument()
        
        // Check badge
        const badgeElements = within(organizationSection).getAllByTestId('badge')
        expect(badgeElements.some(badge => badge.textContent === role.badge)).toBe(true)
      })
    })

    it('should have exactly five role options in organization section', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      const organizationSection = screen.getByTestId(ROLE_SECTION_TEST_IDS.organizationSection)
      const radioInputs = within(organizationSection).getAllByRole('radio')
      
      expect(radioInputs).toHaveLength(5)
      
      const expectedValues = ['organization_owner', 'organization_admin', 'game_master', 'game_staff', 'game_player']
      radioInputs.forEach((input, index) => {
        expect(input).toHaveValue(expectedValues[index])
      })
    })

    it('should display correct descriptions for organization roles', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      const organizationSection = screen.getByTestId(ROLE_SECTION_TEST_IDS.organizationSection)
      
      const expectedDescriptions = [
        'Complete organization ownership and management privileges',
        'Administrative privileges for organization management',
        'Lead murder mystery games and guide player experiences',
        'Support game operations and assist with customer service',
        'Participate in murder mystery games and solve puzzles'
      ]
      
      expectedDescriptions.forEach(description => {
        expect(within(organizationSection).getByText(description)).toBeInTheDocument()
      })
    })
  })

  describe('Single Selection Behavior (Radio Button Logic)', () => {
    it('should implement radio group behavior across both sections', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      // Should have a single radio group containing all options
      const radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toBeInTheDocument()
      expect(radioGroup).toHaveAttribute('aria-label', ROLE_SECTION_ARIA.roleSelectionLabel)
      
      // All radio inputs should be in the same group
      const allRadioInputs = screen.getAllByRole('radio')
      expect(allRadioInputs).toHaveLength(6) // 1 system + 5 organization roles
    })

    it('should allow only one selection across both sections', async () => {
      const user = userEvent.setup()
      const mockOnValueChange = jest.fn()
      
      render(<RoleSelectionSections onValueChange={mockOnValueChange} />)
      
      // Select system admin
      const systemAdminRadio = screen.getByTestId(ROLE_SECTION_TEST_IDS.roleOption('system_admin'))
      await user.click(systemAdminRadio)
      
      expect(mockOnValueChange).toHaveBeenCalledWith('system_admin')
      
      // Now select organization role - should deselect system admin
      const orgOwnerRadio = screen.getByTestId(ROLE_SECTION_TEST_IDS.roleOption('organization_owner'))
      await user.click(orgOwnerRadio)
      
      expect(mockOnValueChange).toHaveBeenCalledWith('organization_owner')
    })

    it('should reflect controlled value prop correctly', () => {
      const { rerender } = render(
        <RoleSelectionSections 
          {...defaultProps} 
          value="system_admin"
        />
      )
      
      // System admin should be checked
      const systemAdminRadio = screen.getByTestId(ROLE_SECTION_TEST_IDS.roleOption('system_admin'))
      expect(systemAdminRadio).toBeChecked()
      
      // Others should not be checked
      const orgOwnerRadio = screen.getByTestId(ROLE_SECTION_TEST_IDS.roleOption('organization_owner'))
      expect(orgOwnerRadio).not.toBeChecked()
      
      // Change value
      rerender(
        <RoleSelectionSections 
          {...defaultProps} 
          value="game_master"
        />
      )
      
      // Game master should now be checked
      const gameMasterRadio = screen.getByTestId(ROLE_SECTION_TEST_IDS.roleOption('game_master'))
      expect(gameMasterRadio).toBeChecked()
      
      // System admin should no longer be checked
      expect(systemAdminRadio).not.toBeChecked()
    })
  })

  describe('Disabled State', () => {
    it('should disable all role options when disabled prop is true', () => {
      render(<RoleSelectionSections {...defaultProps} disabled={true} />)
      
      const allRadioInputs = screen.getAllByRole('radio')
      allRadioInputs.forEach(radio => {
        expect(radio).toBeDisabled()
      })
    })

    it('should not call onValueChange when disabled', async () => {
      const user = userEvent.setup()
      const mockOnValueChange = jest.fn()
      
      render(
        <RoleSelectionSections 
          onValueChange={mockOnValueChange}
          disabled={true}
        />
      )
      
      const systemAdminRadio = screen.getByTestId(ROLE_SECTION_TEST_IDS.roleOption('system_admin'))
      await user.click(systemAdminRadio)
      
      expect(mockOnValueChange).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Please select a role type'
      
      render(
        <RoleSelectionSections 
          {...defaultProps} 
          error={errorMessage}
        />
      )
      
      const errorElement = screen.getByTestId(ROLE_SECTION_TEST_IDS.errorMessage)
      expect(errorElement).toBeInTheDocument()
      expect(errorElement).toHaveTextContent(errorMessage)
    })

    it('should not display error container when no error', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      expect(screen.queryByTestId(ROLE_SECTION_TEST_IDS.errorMessage)).not.toBeInTheDocument()
    })

    it('should apply error styling when error is present', () => {
      render(
        <RoleSelectionSections 
          {...defaultProps} 
          error="Error message"
        />
      )
      
      const container = screen.getByTestId(ROLE_SECTION_TEST_IDS.container)
      expect(container).toHaveClass('error') // Assuming error class is applied
    })
  })

  describe('Custom Sections Override', () => {
    it('should use custom sections when provided', () => {
      const customSections: RoleSectionConfig[] = [
        {
          section: 'system',
          title: 'Custom System',
          description: 'Custom system description',
          roles: [
            {
              id: 'system_admin',
              label: 'Custom Admin',
              description: 'Custom admin description',
              section: 'system'
            }
          ]
        }
      ]
      
      render(
        <RoleSelectionSections 
          {...defaultProps} 
          sections={customSections}
        />
      )
      
      expect(screen.getByText('Custom System')).toBeInTheDocument()
      expect(screen.getByText('Custom system description')).toBeInTheDocument()
      expect(screen.getByText('Custom Admin')).toBeInTheDocument()
    })

    it('should use DEFAULT_ROLE_SECTIONS when sections prop is not provided', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      // Should show default sections
      expect(screen.getByText('System Roles')).toBeInTheDocument()
      expect(screen.getByText('Organization Roles')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      // Main radio group
      const radioGroup = screen.getByRole('radiogroup')
      expect(radioGroup).toHaveAttribute('aria-label', ROLE_SECTION_ARIA.roleSelectionLabel)
      
      // Section groups
      const systemSection = screen.getByTestId(ROLE_SECTION_TEST_IDS.systemSection)
      expect(systemSection).toHaveAttribute('role', ROLE_SECTION_ARIA.sectionGroup)
      expect(systemSection).toHaveAttribute(
        'aria-labelledby', 
        ROLE_SECTION_ARIA.sectionLabelledBy('system')
      )
      
      const organizationSection = screen.getByTestId(ROLE_SECTION_TEST_IDS.organizationSection)
      expect(organizationSection).toHaveAttribute('role', ROLE_SECTION_ARIA.sectionGroup)
      expect(organizationSection).toHaveAttribute(
        'aria-labelledby', 
        ROLE_SECTION_ARIA.sectionLabelledBy('organization')
      )
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const mockOnValueChange = jest.fn()
      
      render(<RoleSelectionSections onValueChange={mockOnValueChange} />)
      
      // Focus first radio button
      const systemAdminRadio = screen.getByTestId(ROLE_SECTION_TEST_IDS.roleOption('system_admin'))
      await user.tab()
      expect(systemAdminRadio).toHaveFocus()
      
      // Use arrow keys to navigate
      await user.keyboard('{ArrowDown}')
      const orgOwnerRadio = screen.getByTestId(ROLE_SECTION_TEST_IDS.roleOption('organization_owner'))
      expect(orgOwnerRadio).toHaveFocus()
      
      // Space should select
      await user.keyboard(' ')
      expect(mockOnValueChange).toHaveBeenCalledWith('organization_owner')
    })

    it('should have proper heading hierarchy', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      const systemTitle = screen.getByTestId(ROLE_SECTION_TEST_IDS.sectionTitle('system'))
      expect(systemTitle).toHaveAttribute('id', ROLE_SECTION_ARIA.sectionLabelledBy('system'))
      
      const organizationTitle = screen.getByTestId(ROLE_SECTION_TEST_IDS.sectionTitle('organization'))
      expect(organizationTitle).toHaveAttribute('id', ROLE_SECTION_ARIA.sectionLabelledBy('organization'))
    })
  })

  describe('Event Handling', () => {
    it('should call onValueChange with correct role type when selection changes', async () => {
      const user = userEvent.setup()
      const mockOnValueChange = jest.fn()
      
      render(<RoleSelectionSections onValueChange={mockOnValueChange} />)
      
      // Test each role selection
      const rolesToTest: RoleType[] = ['system_admin', 'organization_owner', 'game_master']
      
      for (const roleType of rolesToTest) {
        const roleRadio = screen.getByTestId(ROLE_SECTION_TEST_IDS.roleOption(roleType))
        await user.click(roleRadio)
        
        expect(mockOnValueChange).toHaveBeenCalledWith(roleType)
      }
    })

    it('should handle rapid successive clicks correctly', async () => {
      const user = userEvent.setup()
      const mockOnValueChange = jest.fn()
      
      render(<RoleSelectionSections onValueChange={mockOnValueChange} />)
      
      const systemAdminRadio = screen.getByTestId(ROLE_SECTION_TEST_IDS.roleOption('system_admin'))
      const orgOwnerRadio = screen.getByTestId(ROLE_SECTION_TEST_IDS.roleOption('organization_owner'))
      
      // Rapid clicks
      await user.click(systemAdminRadio)
      await user.click(orgOwnerRadio)
      await user.click(systemAdminRadio)
      
      expect(mockOnValueChange).toHaveBeenCalledTimes(3)
      expect(mockOnValueChange).toHaveBeenNthCalledWith(1, 'system_admin')
      expect(mockOnValueChange).toHaveBeenNthCalledWith(2, 'organization_owner')
      expect(mockOnValueChange).toHaveBeenNthCalledWith(3, 'system_admin')
    })
  })

  describe('Component Integration', () => {
    it('should work correctly with no initial value', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      const allRadioInputs = screen.getAllByRole('radio')
      allRadioInputs.forEach(radio => {
        expect(radio).not.toBeChecked()
      })
    })

    it('should handle undefined value gracefully', () => {
      render(
        <RoleSelectionSections 
          {...defaultProps} 
          value={undefined}
        />
      )
      
      expect(screen.getByTestId(ROLE_SECTION_TEST_IDS.container)).toBeInTheDocument()
      
      const allRadioInputs = screen.getAllByRole('radio')
      allRadioInputs.forEach(radio => {
        expect(radio).not.toBeChecked()
      })
    })

    it('should maintain visual consistency with shadcn/ui design system', () => {
      render(<RoleSelectionSections {...defaultProps} />)
      
      // Cards should use shadcn/ui Card components
      const cards = screen.getAllByTestId('card')
      expect(cards).toHaveLength(2)
      
      // Radio groups should use shadcn/ui RadioGroup
      const radioGroup = screen.getByTestId('radio-group')
      expect(radioGroup).toBeInTheDocument()
      
      // Badges should use shadcn/ui Badge components
      const badges = screen.getAllByTestId('badge')
      expect(badges.length).toBeGreaterThan(0)
    })
  })
})