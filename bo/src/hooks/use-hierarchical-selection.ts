'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import type {
  HierarchicalSelectionState,
  RoleCategory,
  RoleType,
  SelectionStep,
  CategoryOption,
  RoleOption,
  HierarchicalValidationResult,
  SelectionEventHandlers,
  SelectionError,
  UseHierarchicalSelectionReturn
} from '@/types/hierarchical-roles'
import {
  createInitialState,
  updateStateForCategorySelection,
  updateStateForRoleSelection,
  updateStateForOrganizationSelection,
  resetState,
  isStateValidForSubmission,
  canTransitionToStep,
  getStepProgress,
  getCategoryOptions,
  getRolesByCategory,
  filterRolesByQuery,
  getPreviousStep,
  getAllRoleOptions
} from '@/lib/role-selection-utils'
import {
  validateFormCompletion,
  validateCategorySelection,
  validateRoleSelection,
  validateOrganizationSelection
} from '@/lib/hierarchical-validation'

interface UseHierarchicalSelectionOptions {
  // Initial state
  initialState?: Partial<HierarchicalSelectionState>
  
  // Callbacks
  onChange?: (data: Partial<HierarchicalSelectionState>) => void
  onCategoryChange?: (category: RoleCategory) => void
  onRoleChange?: (role: RoleType) => void
  onOrganizationChange?: (organizationId: string | null) => void
  onStepChange?: (step: SelectionStep) => void
  onReset?: () => void
  onError?: (error: Error) => void
  onSearchChange?: (query: string) => void
}

// Interface extended to include backwards compatibility properties
export interface ExtendedUseHierarchicalSelectionReturn extends UseHierarchicalSelectionReturn {
  // Additional features (backwards compatibility)
  selectCategory: (category: RoleCategory) => void
  selectRole: (role: RoleType) => void
  selectOrganization: (organizationId: string | null) => void
  navigateToStep: (step: SelectionStep) => void
  getCurrentRoles: () => RoleOption[]
  getFilteredRoles: () => RoleOption[]
  validation: HierarchicalValidationResult
  progress: number
  isComplete: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
}

/**
 * useHierarchicalSelection Hook
 * 
 * Manages state and logic for the hierarchical role selection process.
 * Provides actions, validation, and computed properties for the UI components.
 */
export function useHierarchicalSelection(
  options: UseHierarchicalSelectionOptions = {}
): ExtendedUseHierarchicalSelectionReturn {
  const {
    initialState,
    onChange,
    onCategoryChange,
    onRoleChange,
    onOrganizationChange,
    onStepChange,
    onReset,
    onError,
    onSearchChange
  } = options

  // Internal state - always use latest initialState if provided (controlled component)
  const [state, setState] = useState<HierarchicalSelectionState>(() => ({
    ...createInitialState(),
    ...initialState
  }))
  
  
  const [searchQuery, setSearchQuery] = useState('')

  // Update state and trigger callbacks
  const updateState = useCallback((
    newState: HierarchicalSelectionState,
    skipOnChange = false
  ) => {
    setState(newState)
    
    if (!skipOnChange && onChange) {
      onChange({
        selectedCategory: newState.selectedCategory,
        selectedRole: newState.selectedRole,
        selectedOrganization: newState.selectedOrganization,
        currentStep: newState.currentStep,
        searchQuery
      })
    }
  }, [onChange, searchQuery])

  // Actions
  const selectCategory = useCallback((category: RoleCategory) => {
    try {
      const newState = updateStateForCategorySelection(state, category)
      updateState(newState)
      
      onCategoryChange?.(category)
      onStepChange?.(newState.currentStep)
    } catch (error) {
      onError?.(error as Error)
    }
  }, [state, updateState, onCategoryChange, onStepChange, onError])

  const selectRole = useCallback((role: RoleType) => {
    try {
      const newState = updateStateForRoleSelection(state, role)
      updateState(newState)
      
      onRoleChange?.(role)
    } catch (error) {
      onError?.(error as Error)
    }
  }, [state, updateState, onRoleChange, onError])

  const selectOrganization = useCallback((organizationId: string | null) => {
    try {
      const newState = updateStateForOrganizationSelection(state, organizationId)
      updateState(newState)
      
      onOrganizationChange?.(organizationId)
    } catch (error) {
      onError?.(error as Error)
    }
  }, [state, updateState, onOrganizationChange, onError])

  const navigateToStep = useCallback((step: SelectionStep) => {
    try {
      if (canTransitionToStep(state.currentStep, step, state)) {
        const newState = { ...state, currentStep: step }
        updateState(newState)
        onStepChange?.(step)
      }
    } catch (error) {
      onError?.(error as Error)
    }
  }, [state, updateState, onStepChange, onError])

  const reset = useCallback(() => {
    try {
      const newState = resetState()
      updateState(newState)
      setSearchQuery('')
      onReset?.()
    } catch (error) {
      onError?.(error as Error)
    }
  }, [updateState, onReset, onError])

  // Data getters (memoized for performance)
  const memoizedGetCategoryOptions = useMemo(() => getCategoryOptions, [])
  
  const getCurrentRoles = useCallback((): RoleOption[] => {
    if (!state.selectedCategory) return []
    return getRolesByCategory(state.selectedCategory)
  }, [state.selectedCategory])

  const getFilteredRoles = useCallback((): RoleOption[] => {
    const currentRoles = getCurrentRoles()
    return filterRolesByQuery(currentRoles, searchQuery)
  }, [getCurrentRoles, searchQuery])

  // Search functionality
  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query)
    onSearchChange?.(query)
  }, [onSearchChange])

  // Validation (computed)
  const validation = useMemo((): HierarchicalValidationResult => {
    return validateFormCompletion(state)
  }, [state])

  // Event handlers (matching required interface)
  const handlers = useMemo((): SelectionEventHandlers => ({
    onCategorySelect: selectCategory,
    onRoleSelect: selectRole,
    onOrganizationSelect: (organizationId: string) => selectOrganization(organizationId),
    onStepBack: () => {
      const previousStep = getPreviousStep(state.currentStep)
      if (previousStep) {
        navigateToStep(previousStep)
      }
    },
    onStepForward: () => {
      if (state.currentStep === 'category' && state.selectedCategory) {
        navigateToStep('role')
      }
    },
    onReset: reset
  }), [selectCategory, selectRole, selectOrganization, navigateToStep, reset, state.currentStep])

  // Computed state (matching required interface)
  const availableRoles = useMemo(() => getFilteredRoles(), [getFilteredRoles])
  const categoryOptions = useMemo(() => getCategoryOptions(), [])

  // Validation state (matching required interface)
  const isValid = useMemo(() => isStateValidForSubmission(state), [state])
  const validationErrors = useMemo((): SelectionError[] => {
    const errors: SelectionError[] = []
    
    if (!validation.isValid) {
      if (validation.errors.category) {
        errors.push({
          type: 'validation',
          step: 'category',
          field: 'category',
          message: validation.errors.category
        })
      }
      if (validation.errors.role) {
        errors.push({
          type: 'validation',
          step: 'role', 
          field: 'role',
          message: validation.errors.role
        })
      }
      if (validation.errors.organization) {
        errors.push({
          type: 'validation',
          step: 'role',
          field: 'organization',
          message: validation.errors.organization
        })
      }
    }
    
    return errors
  }, [validation])

  // Navigation state (matching required interface)
  const canGoBack = useMemo(() => {
    return getPreviousStep(state.currentStep) !== null
  }, [state.currentStep])

  // Step navigation (matching required interface)
  const goToStep = useCallback((step: SelectionStep) => {
    navigateToStep(step)
  }, [navigateToStep])

  // Computed properties
  const progress = useMemo(() => getStepProgress(state.currentStep), [state.currentStep])
  
  const canProceed = useMemo(() => {
    return state.canProceedToRole
  }, [state.canProceedToRole])
  
  const isComplete = useMemo(() => {
    return isStateValidForSubmission(state)
  }, [state])

  // Effect to sync state with external changes (controlled component behavior)
  useEffect(() => {
    if (initialState) {
      setState(prevState => {
        const hasChanges = 
          prevState.selectedCategory !== (initialState.selectedCategory ?? prevState.selectedCategory) ||
          prevState.selectedRole !== (initialState.selectedRole ?? prevState.selectedRole) ||
          prevState.selectedOrganization !== (initialState.selectedOrganization ?? prevState.selectedOrganization) ||
          prevState.currentStep !== (initialState.currentStep ?? prevState.currentStep);
          
        if (hasChanges) {
          return {
            ...prevState,
            selectedCategory: initialState.selectedCategory ?? prevState.selectedCategory,
            selectedRole: initialState.selectedRole ?? prevState.selectedRole,
            selectedOrganization: initialState.selectedOrganization ?? prevState.selectedOrganization,
            currentStep: initialState.currentStep ?? prevState.currentStep
          };
        }
        return prevState;
      });
    }
  }, [
    initialState?.selectedCategory,
    initialState?.selectedRole, 
    initialState?.selectedOrganization,
    initialState?.currentStep
  ])
  


  return {
    // Required interface properties
    state,
    handlers,
    availableRoles,
    categoryOptions,
    isValid,
    validationErrors,
    canGoBack,
    canProceed,
    reset,
    goToStep,
    
    // Backwards compatibility properties
    selectCategory,
    selectRole,
    selectOrganization,
    navigateToStep,
    getCurrentRoles,
    getFilteredRoles,
    validation,
    progress,
    isComplete,
    searchQuery,
    setSearchQuery: handleSetSearchQuery
  }
}