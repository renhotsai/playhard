/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// Import component - this will fail until component is implemented (TDD approach)
import { StepIndicator } from '@/components/forms/hierarchical-role-selection/step-indicator'
import type {
  StepIndicatorProps,
  SelectionStep,
  RoleCategory
} from '@/types/hierarchical-roles'

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Check: ({ className, ...props }: any) => (
    <svg className={className} data-testid="check-icon" {...props} />
  ),
  ChevronRight: ({ className, ...props }: any) => (
    <svg className={className} data-testid="chevron-right-icon" {...props} />
  ),
  Circle: ({ className, ...props }: any) => (
    <svg className={className} data-testid="circle-icon" {...props} />
  )
}))

describe('StepIndicator Component Contract Tests', () => {
  const defaultProps: StepIndicatorProps = {
    currentStep: 'category',
    completedSteps: [],
    onStepClick: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Interface & Props Contract', () => {
    it('should accept all required props according to StepIndicatorProps interface', () => {
      const mockOnStepClick = jest.fn()
      const testProps: StepIndicatorProps = {
        currentStep: 'role',
        completedSteps: ['category'],
        selectedCategory: 'organization',
        progress: 75,
        onStepClick: mockOnStepClick,
        disabled: false,
        className: 'test-custom-class',
        'data-testid': 'custom-test-id'
      }

      const { container } = render(<StepIndicator {...testProps} />)
      
      // Component should render without errors
      expect(container.firstChild).toBeInTheDocument()
      
      // Should have custom test ID
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument()
      
      // Should apply custom className
      expect(container.firstChild).toHaveClass('test-custom-class')
    })

    it('should handle minimal props (only required currentStep, completedSteps, and onStepClick)', () => {
      const mockOnStepClick = jest.fn()
      
      render(
        <StepIndicator 
          currentStep="category"
          completedSteps={[]}
          onStepClick={mockOnStepClick}
        />
      )
      
      expect(screen.getByTestId('step-indicator')).toBeInTheDocument()
    })

    it('should use default data-testid when not provided', () => {
      render(<StepIndicator {...defaultProps} />)
      
      expect(screen.getByTestId('step-indicator')).toBeInTheDocument()
    })
  })

  describe('Step Display & Structure', () => {
    it('should render all steps in correct order', () => {
      render(<StepIndicator {...defaultProps} />)
      
      // Should show category step
      const categoryStep = screen.getByTestId('step-category')
      expect(categoryStep).toBeInTheDocument()
      
      // Should show role step
      const roleStep = screen.getByTestId('step-role')
      expect(roleStep).toBeInTheDocument()
      
      // Steps should be in order
      const steps = screen.getAllByTestId(/^step-/)
      expect(steps).toHaveLength(2)
      expect(steps[0]).toHaveAttribute('data-testid', 'step-category')
      expect(steps[1]).toHaveAttribute('data-testid', 'step-role')
    })

    it('should display step labels correctly', () => {
      render(<StepIndicator {...defaultProps} />)
      
      expect(screen.getByText('Choose Role Category')).toBeInTheDocument()
      expect(screen.getByText('Select Specific Role')).toBeInTheDocument()
    })

    it('should show step numbers or indicators', () => {
      render(<StepIndicator {...defaultProps} />)
      
      const categoryIndicator = screen.getByTestId('step-indicator-category')
      const roleIndicator = screen.getByTestId('step-indicator-role')
      
      expect(categoryIndicator).toBeInTheDocument()
      expect(roleIndicator).toBeInTheDocument()
    })

    it('should display progress connector between steps', () => {
      render(<StepIndicator {...defaultProps} />)
      
      const connector = screen.getByTestId('step-connector')
      expect(connector).toBeInTheDocument()
    })
  })

  describe('Current Step Highlighting', () => {
    it('should highlight category step when currentStep is category', () => {
      render(
        <StepIndicator 
          currentStep="category"
          completedSteps={[]}
          onStepClick={jest.fn()}
        />
      )
      
      const categoryStep = screen.getByTestId('step-category')
      expect(categoryStep).toHaveClass('current')
      
      const roleStep = screen.getByTestId('step-role')
      expect(roleStep).not.toHaveClass('current')
    })

    it('should highlight role step when currentStep is role', () => {
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
        />
      )
      
      const roleStep = screen.getByTestId('step-role')
      expect(roleStep).toHaveClass('current')
      
      const categoryStep = screen.getByTestId('step-category')
      expect(categoryStep).not.toHaveClass('current')
    })

    it('should show current step with proper visual styling', () => {
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
        />
      )
      
      const roleStep = screen.getByTestId('step-role')
      expect(roleStep).toHaveAttribute('aria-current', 'step')
    })
  })

  describe('Completed Steps Display', () => {
    it('should mark completed steps with check icons', () => {
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
        />
      )
      
      const categoryStep = screen.getByTestId('step-category')
      expect(categoryStep).toHaveClass('completed')
      
      // Should show check icon for completed step
      const checkIcon = within(categoryStep).getByTestId('check-icon')
      expect(checkIcon).toBeInTheDocument()
    })

    it('should not mark uncompleted steps as completed', () => {
      render(
        <StepIndicator 
          currentStep="category"
          completedSteps={[]}
          onStepClick={jest.fn()}
        />
      )
      
      const categoryStep = screen.getByTestId('step-category')
      const roleStep = screen.getByTestId('step-role')
      
      expect(categoryStep).not.toHaveClass('completed')
      expect(roleStep).not.toHaveClass('completed')
    })

    it('should handle multiple completed steps', () => {
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
        />
      )
      
      const categoryStep = screen.getByTestId('step-category')
      expect(categoryStep).toHaveClass('completed')
      
      const checkIcons = screen.getAllByTestId('check-icon')
      expect(checkIcons).toHaveLength(1)
    })
  })

  describe('Step Navigation', () => {
    it('should call onStepClick with correct step when clicked', async () => {
      const user = userEvent.setup()
      const mockOnStepClick = jest.fn()
      
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={mockOnStepClick}
        />
      )
      
      // Click on category step (completed, should be clickable)
      const categoryStep = screen.getByTestId('step-category')
      await user.click(categoryStep)
      
      expect(mockOnStepClick).toHaveBeenCalledWith('category')
    })

    it('should allow navigation to completed steps', async () => {
      const user = userEvent.setup()
      const mockOnStepClick = jest.fn()
      
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={mockOnStepClick}
        />
      )
      
      const categoryStep = screen.getByTestId('step-category')
      expect(categoryStep).toHaveClass('clickable')
      
      await user.click(categoryStep)
      expect(mockOnStepClick).toHaveBeenCalledWith('category')
    })

    it('should not allow navigation to future steps', async () => {
      const user = userEvent.setup()
      const mockOnStepClick = jest.fn()
      
      render(
        <StepIndicator 
          currentStep="category"
          completedSteps={[]}
          onStepClick={mockOnStepClick}
        />
      )
      
      const roleStep = screen.getByTestId('step-role')
      expect(roleStep).not.toHaveClass('clickable')
      
      await user.click(roleStep)
      expect(mockOnStepClick).not.toHaveBeenCalled()
    })

    it('should show current step as non-clickable', async () => {
      const user = userEvent.setup()
      const mockOnStepClick = jest.fn()
      
      render(
        <StepIndicator 
          currentStep="category"
          completedSteps={[]}
          onStepClick={mockOnStepClick}
        />
      )
      
      const categoryStep = screen.getByTestId('step-category')
      expect(categoryStep).not.toHaveClass('clickable')
      
      await user.click(categoryStep)
      expect(mockOnStepClick).not.toHaveBeenCalled()
    })
  })

  describe('Progress Display', () => {
    it('should show progress bar when progress prop is provided', () => {
      render(
        <StepIndicator 
          {...defaultProps}
          progress={50}
        />
      )
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toBeInTheDocument()
    })

    it('should reflect correct progress percentage', () => {
      render(
        <StepIndicator 
          {...defaultProps}
          progress={75}
        />
      )
      
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveStyle('width: 75%')
    })

    it('should calculate automatic progress when not provided', () => {
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
        />
      )
      
      // Should automatically calculate progress (role step = 100%)
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveStyle('width: 100%')
    })
  })

  describe('Category Context Display', () => {
    it('should show category context in role step when selectedCategory is provided', () => {
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          selectedCategory="organization"
          onStepClick={jest.fn()}
        />
      )
      
      const roleStep = screen.getByTestId('step-role')
      expect(within(roleStep).getByText('Select Organization Role')).toBeInTheDocument()
    })

    it('should show generic role label when no category is selected', () => {
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
        />
      )
      
      const roleStep = screen.getByTestId('step-role')
      expect(within(roleStep).getByText('Select Specific Role')).toBeInTheDocument()
    })

    it('should update role step label based on category', () => {
      const { rerender } = render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          selectedCategory="system"
          onStepClick={jest.fn()}
        />
      )
      
      let roleStep = screen.getByTestId('step-role')
      expect(within(roleStep).getByText('Select System Role')).toBeInTheDocument()
      
      rerender(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          selectedCategory="organization"
          onStepClick={jest.fn()}
        />
      )
      
      roleStep = screen.getByTestId('step-role')
      expect(within(roleStep).getByText('Select Organization Role')).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should disable all step interactions when disabled prop is true', () => {
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
          disabled={true}
        />
      )
      
      const categoryStep = screen.getByTestId('step-category')
      const roleStep = screen.getByTestId('step-role')
      
      expect(categoryStep).toHaveClass('disabled')
      expect(roleStep).toHaveClass('disabled')
    })

    it('should not call onStepClick when disabled', async () => {
      const user = userEvent.setup()
      const mockOnStepClick = jest.fn()
      
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={mockOnStepClick}
          disabled={true}
        />
      )
      
      const categoryStep = screen.getByTestId('step-category')
      await user.click(categoryStep)
      
      expect(mockOnStepClick).not.toHaveBeenCalled()
    })

    it('should show visual disabled state', () => {
      render(
        <StepIndicator 
          {...defaultProps}
          disabled={true}
        />
      )
      
      const container = screen.getByTestId('step-indicator')
      expect(container).toHaveClass('disabled')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
        />
      )
      
      // Main container should have proper role
      const container = screen.getByTestId('step-indicator')
      expect(container).toHaveAttribute('role', 'navigation')
      expect(container).toHaveAttribute('aria-label', 'Role selection steps')
      
      // Steps should have proper roles
      const categoryStep = screen.getByTestId('step-category')
      const roleStep = screen.getByTestId('step-role')
      
      expect(categoryStep).toHaveAttribute('role', 'button')
      expect(roleStep).toHaveAttribute('role', 'button')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const mockOnStepClick = jest.fn()
      
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={mockOnStepClick}
        />
      )
      
      // Tab to first clickable step
      await user.tab()
      const categoryStep = screen.getByTestId('step-category')
      expect(categoryStep).toHaveFocus()
      
      // Enter should trigger click
      await user.keyboard('{Enter}')
      expect(mockOnStepClick).toHaveBeenCalledWith('category')
      
      // Space should also trigger click
      await user.keyboard(' ')
      expect(mockOnStepClick).toHaveBeenCalledWith('category')
    })

    it('should announce step states to screen readers', () => {
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
        />
      )
      
      const categoryStep = screen.getByTestId('step-category')
      const roleStep = screen.getByTestId('step-role')
      
      expect(categoryStep).toHaveAttribute('aria-label', 'Choose Role Category, completed')
      expect(roleStep).toHaveAttribute('aria-label', 'Select Specific Role, current step')
    })

    it('should properly indicate disabled state to screen readers', () => {
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
          disabled={true}
        />
      )
      
      const categoryStep = screen.getByTestId('step-category')
      const roleStep = screen.getByTestId('step-role')
      
      expect(categoryStep).toHaveAttribute('aria-disabled', 'true')
      expect(roleStep).toHaveAttribute('aria-disabled', 'true')
    })

    it('should use proper heading hierarchy', () => {
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
        />
      )
      
      const stepLabels = screen.getAllByRole('heading', { level: 3 })
      expect(stepLabels).toHaveLength(2)
    })
  })

  describe('Visual States', () => {
    it('should show different visual states for different step statuses', () => {
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
        />
      )
      
      const categoryStep = screen.getByTestId('step-category')
      const roleStep = screen.getByTestId('step-role')
      
      // Completed step should have completed styling
      expect(categoryStep).toHaveClass('completed')
      
      // Current step should have current styling
      expect(roleStep).toHaveClass('current')
    })

    it('should show pending state for future steps', () => {
      render(
        <StepIndicator 
          currentStep="category"
          completedSteps={[]}
          onStepClick={jest.fn()}
        />
      )
      
      const roleStep = screen.getByTestId('step-role')
      expect(roleStep).toHaveClass('pending')
    })

    it('should show proper icons for each state', () => {
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
        />
      )
      
      // Completed step should show check icon
      const categoryStep = screen.getByTestId('step-category')
      expect(within(categoryStep).getByTestId('check-icon')).toBeInTheDocument()
      
      // Current step should show circle icon
      const roleStep = screen.getByTestId('step-role')
      expect(within(roleStep).getByTestId('circle-icon')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should handle small screen layouts', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      })
      
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
        />
      )
      
      const container = screen.getByTestId('step-indicator')
      expect(container).toHaveClass('mobile')
    })

    it('should show abbreviated labels on small screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      })
      
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
        />
      )
      
      // Should show shortened labels
      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()
    })
  })

  describe('Integration with Form Systems', () => {
    it('should work correctly when controlled by external state', () => {
      const { rerender } = render(
        <StepIndicator 
          currentStep="category"
          completedSteps={[]}
          onStepClick={jest.fn()}
        />
      )
      
      // Initial state
      const categoryStep = screen.getByTestId('step-category')
      const roleStep = screen.getByTestId('step-role')
      
      expect(categoryStep).toHaveClass('current')
      expect(roleStep).toHaveClass('pending')
      
      // External state update
      rerender(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={jest.fn()}
        />
      )
      
      expect(categoryStep).toHaveClass('completed')
      expect(roleStep).toHaveClass('current')
    })

    it('should maintain consistency with step navigation state', async () => {
      const user = userEvent.setup()
      const mockOnStepClick = jest.fn()
      
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={mockOnStepClick}
        />
      )
      
      const categoryStep = screen.getByTestId('step-category')
      await user.click(categoryStep)
      
      // Should call onStepClick with proper data structure
      expect(mockOnStepClick).toHaveBeenCalledWith('category')
      expect(mockOnStepClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid currentStep gracefully', () => {
      render(
        <StepIndicator 
          currentStep={'invalid' as SelectionStep}
          completedSteps={[]}
          onStepClick={jest.fn()}
        />
      )
      
      const container = screen.getByTestId('step-indicator')
      expect(container).toBeInTheDocument()
    })

    it('should handle invalid completedSteps gracefully', () => {
      render(
        <StepIndicator 
          currentStep="category"
          completedSteps={['invalid' as SelectionStep]}
          onStepClick={jest.fn()}
        />
      )
      
      const container = screen.getByTestId('step-indicator')
      expect(container).toBeInTheDocument()
    })

    it('should handle rapid step navigation correctly', async () => {
      const user = userEvent.setup()
      const mockOnStepClick = jest.fn()
      
      render(
        <StepIndicator 
          currentStep="role"
          completedSteps={['category']}
          onStepClick={mockOnStepClick}
        />
      )
      
      const categoryStep = screen.getByTestId('step-category')
      
      // Rapid clicks
      await user.click(categoryStep)
      await user.click(categoryStep)
      await user.click(categoryStep)
      
      expect(mockOnStepClick).toHaveBeenCalledTimes(3)
      expect(mockOnStepClick).toHaveBeenCalledWith('category')
    })
  })
})