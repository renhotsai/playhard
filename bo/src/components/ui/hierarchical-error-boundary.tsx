/**
 * Hierarchical Error Boundary Component
 * 
 * React error boundary specifically designed for hierarchical role selection components.
 * Provides graceful error handling, recovery options, and detailed error reporting.
 * 
 * Task: T022
 * Feature: Error boundary for hierarchical selection components
 * Date: September 17, 2025
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// Error types specific to hierarchical role selection
export type HierarchicalErrorType = 
  | 'VALIDATION_ERROR'
  | 'STATE_ERROR'
  | 'RENDER_ERROR'
  | 'API_ERROR'
  | 'PERMISSION_ERROR'
  | 'COMPONENT_ERROR'
  | 'UNKNOWN_ERROR'

export interface HierarchicalError {
  type: HierarchicalErrorType
  message: string
  component?: string
  step?: string
  timestamp: Date
  stack?: string
  context?: Record<string, any>
}

interface HierarchicalErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: HierarchicalError, retry: () => void) => ReactNode
  onError?: (error: HierarchicalError, errorInfo: ErrorInfo) => void
  resetKeys?: Array<string | number>
  level?: 'component' | 'step' | 'form'
  context?: Record<string, any>
  className?: string
}

interface HierarchicalErrorBoundaryState {
  hasError: boolean
  error: HierarchicalError | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

/**
 * HierarchicalErrorBoundary Component
 * 
 * Catches errors in hierarchical role selection components and provides
 * recovery mechanisms with detailed error information.
 */
export class HierarchicalErrorBoundary extends Component<
  HierarchicalErrorBoundaryProps,
  HierarchicalErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: HierarchicalErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<HierarchicalErrorBoundaryState> {
    return {
      hasError: true,
      error: {
        type: HierarchicalErrorBoundary.categorizeError(error),
        message: error.message,
        component: HierarchicalErrorBoundary.extractComponentName(error),
        timestamp: new Date(),
        stack: error.stack
      }
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const hierarchicalError: HierarchicalError = {
      type: HierarchicalErrorBoundary.categorizeError(error),
      message: error.message,
      component: HierarchicalErrorBoundary.extractComponentName(error),
      timestamp: new Date(),
      stack: error.stack,
      context: this.props.context
    }

    this.setState({
      error: hierarchicalError,
      errorInfo
    })

    // Call error handler if provided
    this.props.onError?.(hierarchicalError, errorInfo)

    // Log error for debugging
    console.error('Hierarchical Role Selection Error:', {
      error: hierarchicalError,
      errorInfo,
      componentStack: errorInfo.componentStack
    })
  }

  componentDidUpdate(prevProps: HierarchicalErrorBoundaryProps) {
    const { resetKeys } = this.props
    const { hasError } = this.state
    
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary()
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  private static categorizeError(error: Error): HierarchicalErrorType {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    if (message.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION_ERROR'
    }
    if (message.includes('state') || message.includes('hook')) {
      return 'STATE_ERROR'
    }
    if (message.includes('render') || stack.includes('render')) {
      return 'RENDER_ERROR'
    }
    if (message.includes('api') || message.includes('fetch') || message.includes('network')) {
      return 'API_ERROR'
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'PERMISSION_ERROR'
    }
    if (stack.includes('hierarchical') || stack.includes('role')) {
      return 'COMPONENT_ERROR'
    }
    
    return 'UNKNOWN_ERROR'
  }

  private static extractComponentName(error: Error): string {
    const stack = error.stack || ''
    const hierarchicalMatch = stack.match(/(Hierarchical\w+|CategorySelection|RoleSelection\w+|StepIndicator)/i)
    return hierarchicalMatch?.[1] || 'Unknown Component'
  }

  private resetErrorBoundary = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    })
  }

  private handleRetry = () => {
    // Add delay for retry to prevent rapid retry loops
    this.retryTimeoutId = setTimeout(() => {
      this.resetErrorBoundary()
    }, 300)
  }

  private getErrorSeverity(): 'low' | 'medium' | 'high' {
    if (!this.state.error) return 'low'
    
    switch (this.state.error.type) {
      case 'PERMISSION_ERROR':
      case 'API_ERROR':
        return 'high'
      case 'STATE_ERROR':
      case 'COMPONENT_ERROR':
        return 'medium'
      default:
        return 'low'
    }
  }

  private getErrorTitle(): string {
    if (!this.state.error) return 'An error occurred'
    
    switch (this.state.error.type) {
      case 'VALIDATION_ERROR':
        return 'Form Validation Error'
      case 'STATE_ERROR':
        return 'Component State Error'
      case 'RENDER_ERROR':
        return 'Display Error'
      case 'API_ERROR':
        return 'Connection Error'
      case 'PERMISSION_ERROR':
        return 'Permission Denied'
      case 'COMPONENT_ERROR':
        return 'Component Error'
      default:
        return 'Unexpected Error'
    }
  }

  private getErrorDescription(): string {
    if (!this.state.error) return 'Something went wrong'
    
    switch (this.state.error.type) {
      case 'VALIDATION_ERROR':
        return 'There was an issue with the form data. Please check your selections and try again.'
      case 'STATE_ERROR':
        return 'The component state became invalid. Retrying should fix this issue.'
      case 'RENDER_ERROR':
        return 'There was a problem displaying the component. Please refresh the page.'
      case 'API_ERROR':
        return 'Unable to connect to the server. Please check your connection and try again.'
      case 'PERMISSION_ERROR':
        return 'You do not have permission to perform this action. Please contact your administrator.'
      case 'COMPONENT_ERROR':
        return 'A component in the role selection process encountered an error.'
      default:
        return 'An unexpected error occurred. Please try again or refresh the page.'
    }
  }

  private renderDefaultErrorFallback() {
    const { error } = this.state
    const { level = 'component', className } = this.props
    const severity = this.getErrorSeverity()
    const [showDetails, setShowDetails] = React.useState(false)

    return (
      <Card className={cn(
        'border-destructive/20 bg-destructive/5',
        severity === 'high' && 'border-destructive/50 bg-destructive/10',
        className
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>{this.getErrorTitle()}</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {this.getErrorDescription()}
          </p>
          
          {error && (
            <div className="text-sm">
              <p className="font-medium">Error in: {error.component}</p>
              {error.step && (
                <p className="text-muted-foreground">Step: {error.step}</p>
              )}
              <p className="text-muted-foreground">
                Time: {error.timestamp.toLocaleTimeString()}
              </p>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={this.handleRetry}
              size="sm"
              variant="outline"
              className="h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
            
            {process.env.NODE_ENV === 'development' && (
              <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                <CollapsibleTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8">
                    <ChevronDown className={cn(
                      "h-3 w-3 mr-1 transition-transform",
                      showDetails && "rotate-180"
                    )} />
                    Details
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="p-3 bg-muted rounded-md text-xs font-mono">
                    <div className="space-y-2">
                      <div>
                        <strong>Error:</strong> {error?.message}
                      </div>
                      <div>
                        <strong>Type:</strong> {error?.type}
                      </div>
                      <div>
                        <strong>Retry Count:</strong> {this.state.retryCount}
                      </div>
                      {error?.stack && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-muted-foreground">
                            Stack Trace
                          </summary>
                          <pre className="mt-2 text-xs overflow-auto max-h-32">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
          
          {severity === 'high' && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-xs text-destructive font-medium">
                This is a critical error. If it persists, please contact support.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.handleRetry)
      }
      return this.renderDefaultErrorFallback()
    }

    return children
  }
}

// Higher-order component for easy wrapping
export function withHierarchicalErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<HierarchicalErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <HierarchicalErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </HierarchicalErrorBoundary>
  )
  
  WrappedComponent.displayName = `withHierarchicalErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for error reporting within components
export function useHierarchicalErrorReporting() {
  const reportError = React.useCallback((
    error: Error | string,
    context?: Record<string, any>
  ) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    
    console.error('Hierarchical Role Selection Error Reported:', {
      error: errorObj,
      context,
      timestamp: new Date()
    })
    
    // You can integrate with error reporting services here
    // e.g., Sentry, LogRocket, etc.
  }, [])
  
  return { reportError }
}

// Error boundary specifically for step components
export function StepErrorBoundary({ 
  children, 
  step, 
  ...props 
}: HierarchicalErrorBoundaryProps & { step: string }) {
  return (
    <HierarchicalErrorBoundary
      {...props}
      context={{ step, ...props.context }}
      level="step"
    >
      {children}
    </HierarchicalErrorBoundary>
  )
}

// Error boundary for the entire form
export function FormErrorBoundary({ 
  children, 
  ...props 
}: HierarchicalErrorBoundaryProps) {
  return (
    <HierarchicalErrorBoundary
      {...props}
      level="form"
    >
      {children}
    </HierarchicalErrorBoundary>
  )
}