'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Check, Circle, ChevronRight } from 'lucide-react'
import type {
  StepIndicatorProps,
  SelectionStep,
  RoleCategory
} from '@/types/hierarchical-roles'

/**
 * StepIndicator Component
 * 
 * Displays progress through the hierarchical role selection steps.
 * Shows completion status and allows navigation between completed steps.
 */
export function StepIndicator({
  currentStep,
  completedSteps,
  selectedCategory = null,
  progress,
  onStepClick,
  disabled = false,
  className,
  'data-testid': dataTestId = 'step-indicator',
  ...props
}: StepIndicatorProps) {
  // Step configuration
  const steps = [
    {
      id: 'category' as SelectionStep,
      title: 'Choose Role Category',
      shortTitle: 'Category'
    },
    {
      id: 'role' as SelectionStep,
      title: selectedCategory 
        ? `Select ${selectedCategory === 'system' ? 'System' : 'Organization'} Role`
        : 'Select Specific Role',
      shortTitle: `Role${selectedCategory ? ` (${selectedCategory})` : ''}`
    }
  ]

  // Calculate progress if not provided
  const calculatedProgress = progress ?? (currentStep === 'category' ? 50 : 100)

  // Check if we're on mobile (simplified check)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const getStepStatus = (stepId: SelectionStep) => {
    if (completedSteps.includes(stepId)) return 'completed'
    if (currentStep === stepId) return 'current'
    return 'pending'
  }

  const isStepClickable = (stepId: SelectionStep) => {
    if (disabled) return false
    if (stepId === currentStep) return false // Current step is not clickable
    return completedSteps.includes(stepId) // Only completed steps are clickable
  }

  const getStepAriaLabel = (step: any, status: string) => {
    const statusText = status === 'completed' ? 'completed' : 
                     status === 'current' ? 'current step' : 'pending'
    return `${step.title}, ${statusText}`
  }

  const handleStepClick = (stepId: SelectionStep) => {
    if (isStepClickable(stepId) && onStepClick) {
      onStepClick(stepId)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent, stepId: SelectionStep) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleStepClick(stepId)
    }
  }

  return (
    <nav
      className={cn(
        'w-full',
        disabled && 'disabled opacity-50 pointer-events-none',
        isMobile && 'mobile',
        className
      )}
      data-testid={dataTestId}
      role="navigation"
      aria-label="Role selection steps"
      {...props}
    >
      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            data-testid="progress-bar"
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${calculatedProgress}%` }}
            role="progressbar"
            aria-valuenow={calculatedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress: ${calculatedProgress}%`}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between space-x-2 sm:space-x-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id)
          const isClickable = isStepClickable(step.id)
          const isLast = index === steps.length - 1

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div
                data-testid={`step-${step.id}`}
                role="button"
                tabIndex={isClickable && !disabled ? 0 : -1}
                onClick={() => handleStepClick(step.id)}
                onKeyDown={(e) => handleKeyDown(e, step.id)}
                aria-label={getStepAriaLabel(step, status)}
                aria-current={status === 'current' ? 'step' : undefined}
                aria-disabled={disabled || !isClickable}
                className={cn(
                  'flex flex-col items-center space-y-2 flex-1',
                  status === 'current' && 'current',
                  status === 'completed' && 'completed',
                  status === 'pending' && 'pending',
                  isClickable && !disabled && 'clickable cursor-pointer',
                  disabled && 'disabled opacity-50 cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-2'
                )}
              >
                {/* Step indicator */}
                <div
                  data-testid={`step-indicator-${step.id}`}
                  className={cn(
                    'relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                    // Completed step
                    status === 'completed' && [
                      'bg-primary border-primary text-primary-foreground',
                      isClickable && 'hover:bg-primary/90'
                    ],
                    // Current step
                    status === 'current' && [
                      'border-primary bg-background text-primary',
                      'ring-4 ring-primary/20'
                    ],
                    // Pending step
                    status === 'pending' && [
                      'border-muted-foreground/30 bg-background text-muted-foreground'
                    ]
                  )}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5" data-testid="check-icon" />
                  ) : (
                    <Circle className="w-5 h-5" data-testid="circle-icon" />
                  )}
                </div>

                {/* Step label */}
                <div className="text-center min-w-0">
                  <h3
                    data-testid={`title-${step.id}`}
                    id={`step-title-${step.id}`}
                    className={cn(
                      'text-sm font-medium',
                      status === 'current' && 'text-primary',
                      status === 'completed' && 'text-foreground',
                      status === 'pending' && 'text-muted-foreground'
                    )}
                  >
                    {isMobile ? step.shortTitle : step.title}
                  </h3>
                </div>
              </div>

              {/* Connector */}
              {!isLast && (
                <div
                  data-testid="step-connector"
                  className={cn(
                    'flex-1 h-0.5 mx-4 transition-colors duration-200',
                    status === 'completed' ? 'bg-primary' : 'bg-muted'
                  )}
                  role="presentation"
                  aria-hidden="true"
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground mx-auto -mt-2" />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Live region for step announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="announcement"
      >
        {currentStep === 'category' ? 'Step 1: Choose role category' : 
         currentStep === 'role' ? 'Step 2: Select specific role' : ''}
      </div>
    </nav>
  )
}