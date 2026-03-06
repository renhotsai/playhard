/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// Import component - this will fail until component is implemented (TDD approach)
import { CategorySelection } from '@/components/forms/hierarchical-role-selection/category-selection'
import type {
  CategorySelectionProps,
  CategoryOption,
  RoleCategory
} from '@/types/hierarchical-roles'

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

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, variant, size, onClick, disabled, ...props }: any) => (
    <button
      className={`button ${variant} ${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      data-testid="button"
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
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

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Shield: ({ className, ...props }: any) => (
    <svg className={className} data-testid="shield-icon" {...props} />
  ),
  Building2: ({ className, ...props }: any) => (
    <svg className={className} data-testid="building2-icon" {...props} />
  ),
  ChevronRight: ({ className, ...props }: any) => (
    <svg className={className} data-testid="chevron-right-icon" {...props} />
  )
}))

describe('CategorySelection Component Contract Tests', () => {
  const mockCategories: CategoryOption[] = [
    {
      id: 'system',
      title: 'System Roles',
      description: 'Global platform administration with full system access',
      icon: () => <svg data-testid="shield-icon" />,
      badge: 'FULL ACCESS',
      badgeVariant: 'destructive'
    },
    {
      id: 'organization',
      title: 'Organization Roles',
      description: 'Organization-specific roles for managing businesses and games',
      icon: () => <svg data-testid="building2-icon" />,
      badge: 'ORG SCOPED',
      badgeVariant: 'secondary'
    }
  ]

  const defaultProps: CategorySelectionProps = {
    categories: mockCategories,
    onSelect: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Interface & Props Contract', () => {
    it('should accept all required props according to CategorySelectionProps interface', () => {
      const mockOnSelect = jest.fn()
      const testProps: CategorySelectionProps = {
        categories: mockCategories,
        selectedCategory: 'system',
        onSelect: mockOnSelect,
        disabled: false,
        loading: false,
        error: 'Test error message',
        className: 'test-custom-class',
        'data-testid': 'custom-test-id'
      }

      const { container } = render(<CategorySelection {...testProps} />)
      
      // Component should render without errors
      expect(container.firstChild).toBeInTheDocument()
      
      // Should have custom test ID
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument()
      
      // Should apply custom className
      expect(container.firstChild).toHaveClass('test-custom-class')
    })

    it('should handle minimal props (only required categories and onSelect)', () => {
      const mockOnSelect = jest.fn()
      
      render(<CategorySelection categories={mockCategories} onSelect={mockOnSelect} />)
      
      expect(screen.getByTestId('category-selection')).toBeInTheDocument()
    })

    it('should use default data-testid when not provided', () => {
      render(<CategorySelection {...defaultProps} />)
      
      expect(screen.getByTestId('category-selection')).toBeInTheDocument()
    })
  })

  describe('Category Display & Structure', () => {
    it('should render all provided category options', () => {
      render(<CategorySelection {...defaultProps} />)
      
      // Check both categories are rendered
      const systemCard = screen.getByTestId('category-system')
      const organizationCard = screen.getByTestId('category-organization')
      
      expect(systemCard).toBeInTheDocument()
      expect(organizationCard).toBeInTheDocument()
      
      // Should have exactly 2 card components
      const cards = screen.getAllByTestId('card')
      expect(cards).toHaveLength(2)
    })

    it('should display category titles and descriptions correctly', () => {
      render(<CategorySelection {...defaultProps} />)
      
      // System category
      expect(screen.getByText('System Roles')).toBeInTheDocument()
      expect(screen.getByText('Global platform administration with full system access')).toBeInTheDocument()
      
      // Organization category
      expect(screen.getByText('Organization Roles')).toBeInTheDocument()
      expect(screen.getByText('Organization-specific roles for managing businesses and games')).toBeInTheDocument()
    })

    it('should display category badges with correct variants', () => {
      render(<CategorySelection {...defaultProps} />)
      
      const badges = screen.getAllByTestId('badge')
      expect(badges).toHaveLength(2)
      
      // System badge
      const systemBadge = badges.find(badge => badge.textContent === 'FULL ACCESS')
      expect(systemBadge).toBeInTheDocument()
      expect(systemBadge).toHaveAttribute('data-variant', 'destructive')
      
      // Organization badge
      const orgBadge = badges.find(badge => badge.textContent === 'ORG SCOPED')
      expect(orgBadge).toBeInTheDocument()
      expect(orgBadge).toHaveAttribute('data-variant', 'secondary')
    })

    it('should render category icons correctly', () => {
      render(<CategorySelection {...defaultProps} />)
      
      // Check icons are rendered
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument()
      expect(screen.getByTestId('building2-icon')).toBeInTheDocument()
    })

    it('should use card-based layout for visual separation', () => {
      render(<CategorySelection {...defaultProps} />)
      
      const cards = screen.getAllByTestId('card')
      expect(cards).toHaveLength(2)
      
      // Each category should have card structure
      const cardHeaders = screen.getAllByTestId('card-header')
      expect(cardHeaders).toHaveLength(2)
      
      const cardTitles = screen.getAllByTestId('card-title')
      expect(cardTitles).toHaveLength(2)
      
      const cardDescriptions = screen.getAllByTestId('card-description')
      expect(cardDescriptions).toHaveLength(2)
    })
  })

  describe('Selection Behavior', () => {
    it('should call onSelect with correct category when clicked', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      
      render(<CategorySelection categories={mockCategories} onSelect={mockOnSelect} />)
      
      // Click system category
      const systemCard = screen.getByTestId('category-system')
      await user.click(systemCard)
      
      expect(mockOnSelect).toHaveBeenCalledWith('system')
      
      // Click organization category
      const organizationCard = screen.getByTestId('category-organization')
      await user.click(organizationCard)
      
      expect(mockOnSelect).toHaveBeenCalledWith('organization')
    })

    it('should highlight selected category visually', () => {
      const { rerender } = render(
        <CategorySelection 
          {...defaultProps} 
          selectedCategory="system"
        />
      )
      
      // System category should be selected
      const systemCard = screen.getByTestId('category-system')
      expect(systemCard).toHaveClass('selected')
      
      // Organization category should not be selected
      const organizationCard = screen.getByTestId('category-organization')
      expect(organizationCard).not.toHaveClass('selected')
      
      // Change selection
      rerender(
        <CategorySelection 
          {...defaultProps} 
          selectedCategory="organization"
        />
      )
      
      // Organization should now be selected
      expect(organizationCard).toHaveClass('selected')
      expect(systemCard).not.toHaveClass('selected')
    })

    it('should show no selection when selectedCategory is null', () => {
      render(<CategorySelection {...defaultProps} selectedCategory={null} />)
      
      const systemCard = screen.getByTestId('category-system')
      const organizationCard = screen.getByTestId('category-organization')
      
      expect(systemCard).not.toHaveClass('selected')
      expect(organizationCard).not.toHaveClass('selected')
    })

    it('should handle rapid successive clicks correctly', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      
      render(<CategorySelection categories={mockCategories} onSelect={mockOnSelect} />)
      
      const systemCard = screen.getByTestId('category-system')
      const organizationCard = screen.getByTestId('category-organization')
      
      // Rapid clicks
      await user.click(systemCard)
      await user.click(organizationCard)
      await user.click(systemCard)
      
      expect(mockOnSelect).toHaveBeenCalledTimes(3)
      expect(mockOnSelect).toHaveBeenNthCalledWith(1, 'system')
      expect(mockOnSelect).toHaveBeenNthCalledWith(2, 'organization')
      expect(mockOnSelect).toHaveBeenNthCalledWith(3, 'system')
    })
  })

  describe('Disabled State', () => {
    it('should disable all category options when disabled prop is true', () => {
      render(<CategorySelection {...defaultProps} disabled={true} />)
      
      const systemCard = screen.getByTestId('category-system')
      const organizationCard = screen.getByTestId('category-organization')
      
      expect(systemCard).toHaveClass('disabled')
      expect(organizationCard).toHaveClass('disabled')
    })

    it('should not call onSelect when disabled', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      
      render(
        <CategorySelection 
          categories={mockCategories}
          onSelect={mockOnSelect}
          disabled={true}
        />
      )
      
      const systemCard = screen.getByTestId('category-system')
      await user.click(systemCard)
      
      expect(mockOnSelect).not.toHaveBeenCalled()
    })

    it('should show visual disabled state with reduced opacity', () => {
      render(<CategorySelection {...defaultProps} disabled={true} />)
      
      const container = screen.getByTestId('category-selection')
      expect(container).toHaveClass('disabled')
    })
  })

  describe('Loading State', () => {
    it('should show loading state when loading prop is true', () => {
      render(<CategorySelection {...defaultProps} loading={true} />)
      
      const container = screen.getByTestId('category-selection')
      expect(container).toHaveClass('loading')
      
      // Categories should be disabled during loading
      const systemCard = screen.getByTestId('category-system')
      const organizationCard = screen.getByTestId('category-organization')
      
      expect(systemCard).toHaveClass('disabled')
      expect(organizationCard).toHaveClass('disabled')
    })

    it('should not call onSelect when in loading state', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      
      render(
        <CategorySelection 
          categories={mockCategories}
          onSelect={mockOnSelect}
          loading={true}
        />
      )
      
      const systemCard = screen.getByTestId('category-system')
      await user.click(systemCard)
      
      expect(mockOnSelect).not.toHaveBeenCalled()
    })

    it('should show loading skeleton or spinner', () => {
      render(<CategorySelection {...defaultProps} loading={true} />)
      
      // Should show some kind of loading indicator
      const loadingIndicator = screen.getByTestId('loading-indicator')
      expect(loadingIndicator).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Please select a category to continue'
      
      render(
        <CategorySelection 
          {...defaultProps} 
          error={errorMessage}
        />
      )
      
      const errorElement = screen.getByTestId('error-message')
      expect(errorElement).toBeInTheDocument()
      expect(errorElement).toHaveTextContent(errorMessage)
    })

    it('should not display error container when no error', () => {
      render(<CategorySelection {...defaultProps} />)
      
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
    })

    it('should apply error styling when error is present', () => {
      render(
        <CategorySelection 
          {...defaultProps} 
          error="Error message"
        />
      )
      
      const container = screen.getByTestId('category-selection')
      expect(container).toHaveClass('error')
    })

    it('should show error state but still allow selection if not disabled', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      
      render(
        <CategorySelection 
          categories={mockCategories}
          onSelect={mockOnSelect}
          error="Error message"
        />
      )
      
      const systemCard = screen.getByTestId('category-system')
      await user.click(systemCard)
      
      expect(mockOnSelect).toHaveBeenCalledWith('system')
    })
  })

  describe('Empty Categories Handling', () => {
    it('should handle empty categories array gracefully', () => {
      render(<CategorySelection categories={[]} onSelect={jest.fn()} />)
      
      const container = screen.getByTestId('category-selection')
      expect(container).toBeInTheDocument()
      
      // Should show empty state message
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('No categories available')).toBeInTheDocument()
    })

    it('should not show any cards when categories array is empty', () => {
      render(<CategorySelection categories={[]} onSelect={jest.fn()} />)
      
      const cards = screen.queryAllByTestId('card')
      expect(cards).toHaveLength(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<CategorySelection {...defaultProps} />)
      
      // Main container should have proper role
      const container = screen.getByTestId('category-selection')
      expect(container).toHaveAttribute('role', 'group')
      expect(container).toHaveAttribute('aria-label', 'Select role category')
      
      // Category cards should be clickable buttons or have button role
      const systemCard = screen.getByTestId('category-system')
      const organizationCard = screen.getByTestId('category-organization')
      
      expect(systemCard).toHaveAttribute('role', 'button')
      expect(systemCard).toHaveAttribute('aria-label', 'Select System Roles category')
      
      expect(organizationCard).toHaveAttribute('role', 'button')
      expect(organizationCard).toHaveAttribute('aria-label', 'Select Organization Roles category')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      
      render(<CategorySelection categories={mockCategories} onSelect={mockOnSelect} />)
      
      // Tab to first category
      await user.tab()
      const systemCard = screen.getByTestId('category-system')
      expect(systemCard).toHaveFocus()
      
      // Enter should select
      await user.keyboard('{Enter}')
      expect(mockOnSelect).toHaveBeenCalledWith('system')
      
      // Tab to next category
      await user.tab()
      const organizationCard = screen.getByTestId('category-organization')
      expect(organizationCard).toHaveFocus()
      
      // Space should also select
      await user.keyboard(' ')
      expect(mockOnSelect).toHaveBeenCalledWith('organization')
    })

    it('should announce selection state to screen readers', () => {
      render(<CategorySelection {...defaultProps} selectedCategory="system" />)
      
      const systemCard = screen.getByTestId('category-system')
      expect(systemCard).toHaveAttribute('aria-selected', 'true')
      
      const organizationCard = screen.getByTestId('category-organization')
      expect(organizationCard).toHaveAttribute('aria-selected', 'false')
    })

    it('should properly indicate disabled state to screen readers', () => {
      render(<CategorySelection {...defaultProps} disabled={true} />)
      
      const systemCard = screen.getByTestId('category-system')
      const organizationCard = screen.getByTestId('category-organization')
      
      expect(systemCard).toHaveAttribute('aria-disabled', 'true')
      expect(organizationCard).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('Custom Categories', () => {
    it('should render custom categories when provided', () => {
      const customCategories: CategoryOption[] = [
        {
          id: 'custom' as RoleCategory,
          title: 'Custom Category',
          description: 'Custom category description',
          icon: () => <svg data-testid="custom-icon" />,
          badge: 'CUSTOM',
          badgeVariant: 'outline'
        }
      ]
      
      render(
        <CategorySelection 
          categories={customCategories}
          onSelect={jest.fn()}
        />
      )
      
      expect(screen.getByText('Custom Category')).toBeInTheDocument()
      expect(screen.getByText('Custom category description')).toBeInTheDocument()
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
      
      const customBadge = screen.getByTestId('badge')
      expect(customBadge).toHaveTextContent('CUSTOM')
      expect(customBadge).toHaveAttribute('data-variant', 'outline')
    })

    it('should handle categories with different badge variants', () => {
      const variantCategories: CategoryOption[] = [
        {
          id: 'test1' as RoleCategory,
          title: 'Test 1',
          description: 'Test description 1',
          icon: () => <svg />,
          badge: 'TEST1',
          badgeVariant: 'default'
        },
        {
          id: 'test2' as RoleCategory,
          title: 'Test 2',
          description: 'Test description 2',
          icon: () => <svg />,
          badge: 'TEST2',
          badgeVariant: 'destructive'
        }
      ]
      
      render(
        <CategorySelection 
          categories={variantCategories}
          onSelect={jest.fn()}
        />
      )
      
      const badges = screen.getAllByTestId('badge')
      expect(badges[0]).toHaveAttribute('data-variant', 'default')
      expect(badges[1]).toHaveAttribute('data-variant', 'destructive')
    })
  })

  describe('Integration with Form Systems', () => {
    it('should work correctly when controlled by external state', () => {
      const { rerender } = render(
        <CategorySelection 
          {...defaultProps} 
          selectedCategory={null}
        />
      )
      
      // No selection initially
      const systemCard = screen.getByTestId('category-system')
      const organizationCard = screen.getByTestId('category-organization')
      
      expect(systemCard).not.toHaveClass('selected')
      expect(organizationCard).not.toHaveClass('selected')
      
      // External state update
      rerender(
        <CategorySelection 
          {...defaultProps} 
          selectedCategory="organization"
        />
      )
      
      expect(organizationCard).toHaveClass('selected')
      expect(systemCard).not.toHaveClass('selected')
    })

    it('should maintain consistency with TanStack Form integration', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      
      render(<CategorySelection categories={mockCategories} onSelect={mockOnSelect} />)
      
      const systemCard = screen.getByTestId('category-system')
      await user.click(systemCard)
      
      // Should call onSelect with proper data structure expected by TanStack Form
      expect(mockOnSelect).toHaveBeenCalledWith('system')
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
    })
  })
})