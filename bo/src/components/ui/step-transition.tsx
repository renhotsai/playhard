/**
 * Step Transition Component
 * 
 * Provides smooth animations for step-by-step navigation in hierarchical role selection.
 * Supports slide transitions, fade effects, and height animations for dynamic content.
 * 
 * Task: T020
 * Feature: Step transition animations for hierarchical role selection
 * Date: September 17, 2025
 */

'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import type { SelectionStep } from '@/types/hierarchical-roles'

// Animation variants for different transition types
const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
}

const fadeVariants: Variants = {
  enter: {
    opacity: 0,
    scale: 0.95
  },
  center: {
    opacity: 1,
    scale: 1
  },
  exit: {
    opacity: 0,
    scale: 0.95
  }
}

const heightVariants: Variants = {
  enter: {
    height: 0,
    opacity: 0
  },
  center: {
    height: 'auto',
    opacity: 1
  },
  exit: {
    height: 0,
    opacity: 0
  }
}

export type TransitionType = 'slide' | 'fade' | 'height'
export type TransitionDirection = 'forward' | 'backward'

interface StepTransitionProps {
  currentStep: SelectionStep
  children: React.ReactNode
  type?: TransitionType
  direction?: TransitionDirection
  duration?: number
  className?: string
  'data-testid'?: string
}

/**
 * StepTransition Component
 * 
 * Animates transitions between different steps in the hierarchical role selection.
 * Provides smooth visual feedback during step navigation.
 */
export function StepTransition({
  currentStep,
  children,
  type = 'slide',
  direction = 'forward',
  duration = 0.3,
  className,
  'data-testid': dataTestId = 'step-transition',
  ...props
}: StepTransitionProps) {
  const [previousStep, setPreviousStep] = useState<SelectionStep>(currentStep)
  const [animationDirection, setAnimationDirection] = useState(1)

  // Update animation direction based on step progression
  useEffect(() => {
    const stepOrder: SelectionStep[] = ['category', 'role']
    const currentIndex = stepOrder.indexOf(currentStep)
    const previousIndex = stepOrder.indexOf(previousStep)
    
    if (currentIndex > previousIndex) {
      setAnimationDirection(1) // Forward
    } else if (currentIndex < previousIndex) {
      setAnimationDirection(-1) // Backward
    }
    
    setPreviousStep(currentStep)
  }, [currentStep, previousStep])

  // Select animation variants based on type
  const getVariants = (): Variants => {
    switch (type) {
      case 'slide':
        return slideVariants
      case 'fade':
        return fadeVariants
      case 'height':
        return heightVariants
      default:
        return slideVariants
    }
  }

  const variants = getVariants()

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        type === 'height' && 'overflow-visible',
        className
      )}
      data-testid={dataTestId}
      {...props}
    >
      <AnimatePresence
        mode="wait"
        custom={animationDirection}
        initial={false}
      >
        <motion.div
          key={currentStep}
          custom={animationDirection}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration,
            ease: [0.25, 0.25, 0, 1], // Custom easing for smooth animation
            layout: type === 'height'
          }}
          className={cn(
            'w-full',
            type === 'slide' && 'absolute top-0 left-0 right-0',
            type === 'fade' && 'relative',
            type === 'height' && 'overflow-hidden'
          )}
          data-testid={`step-content-${currentStep}`}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Specialized components for different step transitions

interface CategoryToRoleTransitionProps {
  showRole: boolean
  categoryContent: React.ReactNode
  roleContent: React.ReactNode
  className?: string
}

/**
 * CategoryToRoleTransition Component
 * 
 * Specialized transition for category to role step navigation.
 * Provides optimized animation for the most common transition.
 */
export function CategoryToRoleTransition({
  showRole,
  categoryContent,
  roleContent,
  className
}: CategoryToRoleTransitionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Category Content - always visible but animated */}
      <motion.div
        animate={{
          opacity: showRole ? 0.6 : 1,
          scale: showRole ? 0.95 : 1
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          'transition-all duration-200',
          showRole && 'pointer-events-none'
        )}
      >
        {categoryContent}
      </motion.div>
      
      {/* Role Content - animated entrance */}
      <AnimatePresence>
        {showRole && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.25, 0, 1]
            }}
            className="space-y-4"
          >
            {roleContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Progress indicator animation
interface ProgressTransitionProps {
  progress: number
  className?: string
}

/**
 * ProgressTransition Component
 * 
 * Animated progress bar for step completion visualization.
 */
export function ProgressTransition({
  progress,
  className
}: ProgressTransitionProps) {
  return (
    <div className={cn('w-full bg-muted rounded-full h-2', className)}>
      <motion.div
        className="h-full bg-primary rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{
          duration: 0.5,
          ease: [0.25, 0.25, 0, 1]
        }}
      />
    </div>
  )
}

// Step indicator animation
interface StepIndicatorTransitionProps {
  steps: Array<{
    id: string
    title: string
    completed: boolean
    current: boolean
  }>
  className?: string
}

/**
 * StepIndicatorTransition Component
 * 
 * Animated step indicators with completion states.
 */
export function StepIndicatorTransition({
  steps,
  className
}: StepIndicatorTransitionProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <motion.div
            className={cn(
              'flex flex-col items-center space-y-2',
              step.current && 'current',
              step.completed && 'completed'
            )}
            animate={{
              scale: step.current ? 1.1 : 1,
              opacity: step.completed || step.current ? 1 : 0.6
            }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={cn(
                'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium',
                step.completed && 'bg-primary border-primary text-primary-foreground',
                step.current && 'border-primary text-primary',
                !step.completed && !step.current && 'border-muted-foreground text-muted-foreground'
              )}
              animate={{
                backgroundColor: step.completed ? 'hsl(var(--primary))' : 'transparent',
                borderColor: step.completed || step.current ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
              }}
              transition={{ duration: 0.3 }}
            >
              {step.completed ? '✓' : index + 1}
            </motion.div>
            <span className={cn(
              'text-xs font-medium',
              step.current && 'text-primary',
              step.completed && 'text-foreground',
              !step.completed && !step.current && 'text-muted-foreground'
            )}>
              {step.title}
            </span>
          </motion.div>
          
          {index < steps.length - 1 && (
            <motion.div
              className="flex-1 h-0.5 mx-2"
              animate={{
                backgroundColor: step.completed ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Enhanced loading transitions
interface LoadingTransitionProps {
  isLoading: boolean
  children: React.ReactNode
  loadingContent?: React.ReactNode
  className?: string
}

/**
 * LoadingTransition Component
 * 
 * Smooth loading state transitions for async operations.
 */
export function LoadingTransition({
  isLoading,
  children,
  loadingContent,
  className
}: LoadingTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn('flex items-center justify-center p-8', className)}
        >
          {loadingContent || (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Error state transitions
interface ErrorTransitionProps {
  hasError: boolean
  error?: string
  children: React.ReactNode
  onRetry?: () => void
  className?: string
}

/**
 * ErrorTransition Component
 * 
 * Animated error state handling with retry functionality.
 */
export function ErrorTransition({
  hasError,
  error,
  children,
  onRetry,
  className
}: ErrorTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {hasError ? (
        <motion.div
          key="error"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'flex flex-col items-center justify-center p-8 text-center space-y-4',
            className
          )}
        >
          <div className="text-destructive">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{error || 'Something went wrong'}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Export animation utilities
export const transitionConfig = {
  spring: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30
  },
  smooth: {
    duration: 0.3,
    ease: [0.25, 0.25, 0, 1] as [number, number, number, number]
  },
  quick: {
    duration: 0.15,
    ease: [0.25, 0.25, 0, 1] as [number, number, number, number]
  }
}