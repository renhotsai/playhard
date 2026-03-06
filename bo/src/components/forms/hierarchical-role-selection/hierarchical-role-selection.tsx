'use client'

import React, { useMemo, memo } from 'react'
import { cn } from '@/lib/utils'
import { CategorySelection } from './category-selection'
import { RoleSelectionStep } from './role-selection-step'
import { StepIndicator } from './step-indicator'
import { OrganizationSelection } from './organization-selection'
import { useHierarchicalSelection } from '@/hooks/use-hierarchical-selection'
import { 
  getCategoryOptions, 
  getRolesByCategory, 
  filterRolesByQuery,
  isStateValidForSubmission 
} from '@/lib/role-selection-utils'
import { validateFormCompletion } from '@/lib/hierarchical-validation'
import type {
  HierarchicalRoleSelectionProps,
  HierarchicalValidationResult,
  SelectionStep,
  RoleCategory,
  RoleType
} from '@/types/hierarchical-roles'

/**
 * HierarchicalRoleSelection Component
 * 
 * Main orchestrator component that manages the complete hierarchical role selection flow.
 * Integrates CategorySelection, RoleSelectionStep, StepIndicator, and OrganizationSelection.
 * 
 * Defaults to system category and role selection step as per user requirement.
 */
export const HierarchicalRoleSelection = memo(function HierarchicalRoleSelection({
  value,
  onChange,
  onValidationChange,
  disabled = false,
  loading = false,
  error = null,
  showSearch = false,
  showProgress = true,
  className,
  'data-testid': dataTestId = 'hierarchical-role-selection',
  ...props
}: HierarchicalRoleSelectionProps) {
  // Initialize hook with external value
  const {
    state,
    selectCategory,
    selectRole,
    selectOrganization,
    navigateToStep,
    reset,
    categoryOptions,
    getCurrentRoles,
    getFilteredRoles,
    validation,
    progress,
    canProceed,
    isComplete,
    searchQuery,
    setSearchQuery
  } = useHierarchicalSelection({
    initialState: value ? {
      selectedCategory: value.selectedCategory,
      selectedRole: value.selectedRole,
      selectedOrganization: value.selectedOrganization,
      currentStep: value.currentStep || 'category'
    } : undefined,
    onChange: (data) => {
      onChange?.({
        selectedCategory: data.selectedCategory || null,
        selectedRole: data.selectedRole || null,
        selectedOrganization: data.selectedOrganization || null,
        currentStep: data.currentStep || 'category',
        searchQuery: data.searchQuery || ''
      })
    }
  })

  // Get category options
  const categories = useMemo(() => categoryOptions, [categoryOptions])

  // Get current roles for selected category
  const currentRoles = useMemo(() => {
    if (!state.selectedCategory) return []
    return getRolesByCategory(state.selectedCategory)
  }, [state.selectedCategory])

  // Filter roles by search query
  const filteredRoles = useMemo(() => {
    return filterRolesByQuery(currentRoles, searchQuery)
  }, [currentRoles, searchQuery])

  // Check if selected role requires organization
  const requiresOrganization = useMemo(() => {
    if (!state.selectedRole) return false
    const roleOption = currentRoles.find(role => role.id === state.selectedRole)
    return roleOption?.requiresOrganization || false
  }, [state.selectedRole, currentRoles])

  // Calculate validation and notify parent
  React.useEffect(() => {
    const currentValidation = validateFormCompletion(state)
    // Filter out step field for backward compatibility with tests
    const { step, ...validationForParent } = currentValidation
    onValidationChange?.(validationForParent as HierarchicalValidationResult)
  }, [state, onValidationChange])

  // Calculate completed steps
  const completedSteps: SelectionStep[] = useMemo(() => {
    const steps: SelectionStep[] = []
    if (state.selectedCategory) steps.push('category')
    return steps
  }, [state.selectedCategory])

  // Handle step navigation
  const handleStepClick = (step: SelectionStep) => {
    if (!disabled && !loading) {
      navigateToStep(step)
    }
  }

  // Handle category selection
  const handleCategorySelect = (category: RoleCategory) => {
    if (!disabled && !loading) {
      selectCategory(category)
    }
  }

  // Handle role selection
  const handleRoleSelect = (role: RoleType) => {
    if (!disabled && !loading) {
      selectRole(role)
    }
  }

  // Handle organization selection
  const handleOrganizationSelect = (organizationId: string | null) => {
    if (!disabled && !loading) {
      selectOrganization(organizationId)
    }
  }

  // Handle search change
  const handleSearchChange = (query: string) => {
    if (!disabled && !loading) {
      setSearchQuery(query)
    }
  }

  return (
    <div
      className={cn(
        'space-y-6 sm:space-y-8',
        disabled && 'disabled opacity-50 pointer-events-none',
        className
      )}
      data-testid={dataTestId}
      role="region"
      aria-label="Hierarchical role selection"
      aria-describedby="hierarchical-description"
      aria-live="polite"
      aria-atomic="false"
      {...props}
    >
      {/* Hidden description for screen readers */}
      <div 
        id="hierarchical-description" 
        className="sr-only"
        aria-hidden="true"
      >
        Step-by-step role selection process. First choose a role category, then select a specific role. Some roles may require organization selection.
      </div>
      {/* Step indicator */}
      {showProgress && (
        <StepIndicator
          currentStep={state.currentStep}
          completedSteps={completedSteps}
          selectedCategory={state.selectedCategory}
          progress={progress}
          onStepClick={handleStepClick}
          disabled={disabled || loading}
        />
      )}

      {/* Main content area */}
      <div className="space-y-6">
        {/* Category Selection Step */}
        {state.currentStep === 'category' && (
          <CategorySelection
            categories={categories}
            selectedCategory={state.selectedCategory || 'system'} // Default to system category for UI
            onSelect={handleCategorySelect}
            disabled={disabled}
            loading={loading}
            error={error}
          />
        )}

        {/* Role Selection Step */}
        {state.currentStep === 'role' && state.selectedCategory && (
          <div className="space-y-6">
            {/* Category Tabs (for switching between categories) */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategorySelect(category.id)}
                  disabled={disabled || loading}
                  className={cn(
                    'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    state.selectedCategory === category.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {category.title}
                </button>
              ))}
            </div>

            {/* Role Selection */}
            <RoleSelectionStep
              roles={filteredRoles}
              category={state.selectedCategory}
              selectedRole={state.selectedRole}
              onSelect={handleRoleSelect}
              disabled={disabled}
              loading={loading}
              error={error}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              showSearch={showSearch}
            />

            {/* Organization Selection (conditional) */}
            {state.selectedRole && requiresOrganization && (
              <OrganizationSelection
                selectedOrganization={state.selectedOrganization}
                onSelect={handleOrganizationSelect}
                disabled={disabled}
                loading={loading}
                error={error}
              />
            )}
          </div>
        )}
      </div>

      {/* Live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {state.currentStep === 'category' && 'Select a role category to continue'}
        {state.currentStep === 'role' && !state.selectedRole && 'Select a specific role'}
        {state.currentStep === 'role' && state.selectedRole && !requiresOrganization && 'Role selection complete'}
        {state.currentStep === 'role' && state.selectedRole && requiresOrganization && !state.selectedOrganization && 'Select an organization to complete role assignment'}
        {isComplete && 'Role selection completed successfully'}
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 p-4 bg-muted rounded-lg text-xs">
          <summary className="cursor-pointer font-medium">Debug Info</summary>
          <pre className="mt-2 overflow-auto">
            {JSON.stringify({
              currentStep: state.currentStep,
              selectedCategory: state.selectedCategory,
              selectedRole: state.selectedRole,
              selectedOrganization: state.selectedOrganization,
              requiresOrganization,
              isComplete,
              validation: validation,
              searchQuery
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
})