/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// Import component - this will fail until component is implemented (TDD approach)
import { RoleOption } from '@/components/forms/role-option'
import {
  type RoleOptionProps,
  type RoleDefinition,
  type RoleType,
  DEFAULT_ROLE_SECTIONS,
  ROLE_SECTION_TEST_IDS
} from '@/types/role-sections'

// Mock shadcn/ui components to ensure they render correctly in tests
jest.mock('@/components/ui/radio-group', () => ({
  RadioGroupItem: ({ value, checked, disabled, className, ...props }: any) => (
    <input
      type="radio"
      value={value}
      checked={checked}
      disabled={disabled}
      className={className}
      data-testid="radio-group-item"
      {...props}
    />
  )
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, className, ...props }: any) => (
    <label htmlFor={htmlFor} className={className} data-testid="label" {...props}>
      {children}
    </label>
  )
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant = 'default', className, ...props }: any) => (
    <span 
      className={className} 
      data-testid="badge" 
      data-variant={variant}
      {...props}
    >
      {children}
    </span>
  )
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Shield: ({ className, ...props }: any) => (
    <svg className={className} data-testid="shield-icon" {...props}>
      <title>Shield</title>
    </svg>
  ),
  Crown: ({ className, ...props }: any) => (
    <svg className={className} data-testid="crown-icon" {...props}>
      <title>Crown</title>
    </svg>
  ),
  User: ({ className, ...props }: any) => (
    <svg className={className} data-testid="user-icon" {...props}>
      <title>User</title>
    </svg>
  )
}))

describe('RoleOption Component Contract Tests', () => {
  const mockOnSelect = jest.fn()

  // Test data - System role with destructive badge
  const systemAdminRole: RoleDefinition = {
    id: 'system_admin',
    label: 'System Administrator',
    description: 'Complete system control across all organizations and users',
    section: 'system',
    badge: {
      text: 'FULL ACCESS',
      variant: 'destructive'
    }
  }

  // Test data - Organization role with default badge
  const gameMasterRole: RoleDefinition = {
    id: 'game_master',
    label: 'Game Master',
    description: 'Lead murder mystery games and guide player experiences',
    section: 'organization',
    badge: {
      text: 'GM',
      variant: 'default'
    }
  }

  // Test data - Role with secondary badge
  const organizationAdminRole: RoleDefinition = {
    id: 'organization_admin',
    label: 'Organization Administrator',
    description: 'Administrative privileges for organization management',
    section: 'organization',
    badge: {
      text: 'ADMIN',
      variant: 'secondary'
    }
  }

  // Test data - Role with outline badge
  const gameStaffRole: RoleDefinition = {
    id: 'game_staff',
    label: 'Game Staff',
    description: 'Support game operations and assist with customer service',
    section: 'organization',
    badge: {
      text: 'STAFF',
      variant: 'outline'
    }
  }

  // Test data - Role without badge
  const roleWithoutBadge: RoleDefinition = {
    id: 'game_player',
    label: 'Game Player',
    description: 'Participate in murder mystery games and solve puzzles',
    section: 'organization'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render role label correctly', () => {
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
          data-testid="role-option-system-admin"
        />
      )

      expect(screen.getByText('System Administrator')).toBeInTheDocument()
    })

    it('should render role description correctly', () => {
      render(
        <RoleOption
          role={gameMasterRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('Lead murder mystery games and guide player experiences')).toBeInTheDocument()
    })

    it('should render with custom data-testid when provided', () => {
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
          data-testid="custom-test-id"
        />
      )

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument()
    })

    it('should apply custom className when provided', () => {
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
          className="custom-class"
          data-testid="role-option"
        />
      )

      const element = screen.getByTestId('role-option')
      expect(element).toHaveClass('custom-class')
    })
  })

  describe('Radio Button Input', () => {
    it('should render radio button with correct value', () => {
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      const radioInput = screen.getByTestId('radio-group-item')
      expect(radioInput).toHaveAttribute('value', 'system_admin')
      expect(radioInput).toHaveAttribute('type', 'radio')
    })

    it('should show radio button as checked when selected is true', () => {
      render(
        <RoleOption
          role={systemAdminRole}
          selected={true}
          onSelect={mockOnSelect}
        />
      )

      const radioInput = screen.getByTestId('radio-group-item')
      expect(radioInput).toBeChecked()
    })

    it('should show radio button as unchecked when selected is false', () => {
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      const radioInput = screen.getByTestId('radio-group-item')
      expect(radioInput).not.toBeChecked()
    })

    it('should disable radio button when disabled prop is true', () => {
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
          disabled={true}
        />
      )

      const radioInput = screen.getByTestId('radio-group-item')
      expect(radioInput).toBeDisabled()
    })

    it('should enable radio button when disabled prop is false or undefined', () => {
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
          disabled={false}
        />
      )

      const radioInput = screen.getByTestId('radio-group-item')
      expect(radioInput).not.toBeDisabled()
    })
  })

  describe('Badge Rendering', () => {
    it('should render badge with correct text for system admin role', () => {
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveTextContent('FULL ACCESS')
      expect(badge).toHaveAttribute('data-variant', 'destructive')
    })

    it('should render badge with default variant', () => {
      render(
        <RoleOption
          role={gameMasterRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveTextContent('GM')
      expect(badge).toHaveAttribute('data-variant', 'default')
    })

    it('should render badge with secondary variant', () => {
      render(
        <RoleOption
          role={organizationAdminRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveTextContent('ADMIN')
      expect(badge).toHaveAttribute('data-variant', 'secondary')
    })

    it('should render badge with outline variant', () => {
      render(
        <RoleOption
          role={gameStaffRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveTextContent('STAFF')
      expect(badge).toHaveAttribute('data-variant', 'outline')
    })

    it('should not render badge when role has no badge property', () => {
      render(
        <RoleOption
          role={roleWithoutBadge}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.queryByTestId('badge')).not.toBeInTheDocument()
    })
  })

  describe('Selection Handling', () => {
    it('should call onSelect with correct role type when clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
          data-testid="role-option"
        />
      )

      const roleOption = screen.getByTestId('role-option')
      await user.click(roleOption)

      expect(mockOnSelect).toHaveBeenCalledWith('system_admin')
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
    })

    it('should call onSelect when radio button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <RoleOption
          role={gameMasterRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      const radioInput = screen.getByTestId('radio-group-item')
      await user.click(radioInput)

      expect(mockOnSelect).toHaveBeenCalledWith('game_master')
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
    })

    it('should call onSelect when label is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <RoleOption
          role={organizationAdminRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      const label = screen.getByText('Organization Administrator')
      await user.click(label)

      expect(mockOnSelect).toHaveBeenCalledWith('organization_admin')
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
    })

    it('should not call onSelect when disabled and clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
          disabled={true}
          data-testid="role-option"
        />
      )

      const roleOption = screen.getByTestId('role-option')
      await user.click(roleOption)

      expect(mockOnSelect).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper label association with radio input', () => {
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      const label = screen.getByTestId('label')
      const radioInput = screen.getByTestId('radio-group-item')
      
      // Check that label is properly associated
      expect(label).toHaveAttribute('htmlFor')
      expect(radioInput).toHaveAttribute('id')
    })

    it('should have accessible name from label text', () => {
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      const radioInput = screen.getByRole('radio')
      expect(radioInput).toHaveAccessibleName(/System Administrator/i)
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      const radioInput = screen.getByRole('radio')
      await user.tab()
      
      expect(radioInput).toHaveFocus()
    })

    it('should support space key selection', async () => {
      const user = userEvent.setup()
      
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      const radioInput = screen.getByRole('radio')
      radioInput.focus()
      await user.keyboard(' ')

      expect(mockOnSelect).toHaveBeenCalledWith('system_admin')
    })
  })

  describe('Different Role Types', () => {
    it('should handle system_admin role correctly', () => {
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('System Administrator')).toBeInTheDocument()
      expect(screen.getByText('Complete system control across all organizations and users')).toBeInTheDocument()
      expect(screen.getByTestId('badge')).toHaveTextContent('FULL ACCESS')
    })

    it('should handle organization_owner role correctly', () => {
      const organizationOwnerRole = DEFAULT_ROLE_SECTIONS
        .find(section => section.section === 'organization')
        ?.roles.find(role => role.id === 'organization_owner')!

      render(
        <RoleOption
          role={organizationOwnerRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('Organization Owner')).toBeInTheDocument()
      expect(screen.getByText('Complete organization ownership and management privileges')).toBeInTheDocument()
      expect(screen.getByTestId('badge')).toHaveTextContent('OWNER')
    })

    it('should handle game_master role correctly', () => {
      render(
        <RoleOption
          role={gameMasterRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('Game Master')).toBeInTheDocument()
      expect(screen.getByText('Lead murder mystery games and guide player experiences')).toBeInTheDocument()
      expect(screen.getByTestId('badge')).toHaveTextContent('GM')
    })

    it('should handle game_staff role correctly', () => {
      render(
        <RoleOption
          role={gameStaffRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('Game Staff')).toBeInTheDocument()
      expect(screen.getByText('Support game operations and assist with customer service')).toBeInTheDocument()
      expect(screen.getByTestId('badge')).toHaveTextContent('STAFF')
    })

    it('should handle game_player role correctly', () => {
      const gamePlayerRole = DEFAULT_ROLE_SECTIONS
        .find(section => section.section === 'organization')
        ?.roles.find(role => role.id === 'game_player')!

      render(
        <RoleOption
          role={gamePlayerRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('Game Player')).toBeInTheDocument()
      expect(screen.getByText('Participate in murder mystery games and solve puzzles')).toBeInTheDocument()
      expect(screen.getByTestId('badge')).toHaveTextContent('PLAYER')
    })
  })

  describe('Icon Rendering', () => {
    it('should render icon when role has icon property', () => {
      const roleWithIcon: RoleDefinition = {
        ...systemAdminRole,
        icon: ({ className }: { className?: string }) => (
          <svg className={className} data-testid="role-icon">
            <title>Role Icon</title>
          </svg>
        )
      }

      render(
        <RoleOption
          role={roleWithIcon}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByTestId('role-icon')).toBeInTheDocument()
    })

    it('should not render icon when role has no icon property', () => {
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.queryByTestId('role-icon')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle undefined onSelect gracefully', () => {
      // This test ensures the component doesn't crash with undefined onSelect
      expect(() => {
        render(
          <RoleOption
            role={systemAdminRole}
            selected={false}
            onSelect={undefined as any}
          />
        )
      }).not.toThrow()
    })

    it('should handle invalid role data gracefully', () => {
      const invalidRole = {
        id: 'invalid_role' as RoleType,
        label: '',
        description: '',
        section: 'system' as const
      }

      expect(() => {
        render(
          <RoleOption
            role={invalidRole}
            selected={false}
            onSelect={mockOnSelect}
          />
        )
      }).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long role labels', () => {
      const roleWithLongLabel: RoleDefinition = {
        ...systemAdminRole,
        label: 'This is a very long role label that might cause layout issues in some scenarios'
      }

      render(
        <RoleOption
          role={roleWithLongLabel}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('This is a very long role label that might cause layout issues in some scenarios')).toBeInTheDocument()
    })

    it('should handle very long role descriptions', () => {
      const roleWithLongDescription: RoleDefinition = {
        ...systemAdminRole,
        description: 'This is a very long role description that explains in great detail what this role does and what responsibilities it entails for the user who will be assigned this role'
      }

      render(
        <RoleOption
          role={roleWithLongDescription}
          selected={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText(/This is a very long role description/)).toBeInTheDocument()
    })

    it('should handle rapid selection changes', async () => {
      const user = userEvent.setup()
      
      render(
        <RoleOption
          role={systemAdminRole}
          selected={false}
          onSelect={mockOnSelect}
          data-testid="role-option"
        />
      )

      const roleOption = screen.getByTestId('role-option')
      
      // Rapidly click multiple times
      await user.click(roleOption)
      await user.click(roleOption)
      await user.click(roleOption)

      expect(mockOnSelect).toHaveBeenCalledTimes(3)
      expect(mockOnSelect).toHaveBeenCalledWith('system_admin')
    })
  })
})