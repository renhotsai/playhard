/**
 * TanStack Form Field Integration Hook for Hierarchical Role Selection
 * 
 * This hook provides seamless integration between the hierarchical role selection
 * component and TanStack Form fields. It handles bi-directional data flow,
 * validation synchronization, and state management.
 * 
 * Use this hook when you need fine-grained control over the form field
 * integration or when building custom form components.
 */

import { useCallback, useEffect, useState } from 'react'
import type { FieldApi } from '@tanstack/react-form'
import {
  validateFormCompletion,
  validateHierarchicalForm,
  type HierarchicalValidationResult
} from '@/lib/hierarchical-validation'
import type {
  RoleType,
  RoleCategory,
  SelectionStep
} from '@/types/hierarchical-roles'

// ============================================================================
// Field Value Type
// ============================================================================

export interface HierarchicalFieldValue {
  selectedCategory: RoleCategory | null
  selectedRole: RoleType | null
  selectedOrganization: string | null
  currentStep: SelectionStep
}

// ============================================================================
// Hook Options
// ============================================================================

interface UseHierarchicalFormFieldOptions {
  /** The TanStack Form field instance */
  field: FieldApi<any, any, any, any, HierarchicalFieldValue>
  
  /** Validation options */
  validation?: {
    /** Enable real-time validation */
    realtime?: boolean
    /** Validation debounce delay in ms */
    debounceMs?: number
    /** Custom validation function */
    customValidator?: (value: HierarchicalFieldValue) => HierarchicalValidationResult
  }
  
  /** Callbacks */
  callbacks?: {
    /** Called when validation state changes */
    onValidationChange?: (validation: HierarchicalValidationResult) => void
    /** Called when step changes */
    onStepChange?: (step: SelectionStep) => void
    /** Called when selection is complete */
    onComplete?: (value: HierarchicalFieldValue) => void
  }
}

// ============================================================================
// Hook Return Type
// ============================================================================

interface UseHierarchicalFormFieldReturn {
  /** Current field value */
  value: HierarchicalFieldValue
  
  /** Change handler for hierarchical component */
  onChange: (data: HierarchicalFieldValue) => void
  
  /** Current validation state */
  validation: HierarchicalValidationResult
  
  /** Field state helpers */
  fieldState: {
    hasError: boolean
    isValid: boolean
    isTouched: boolean
    isValidating: boolean
  }
  
  /** Action helpers */
  actions: {
    reset: () => void
    validate: () => void
    touch: () => void
    setStep: (step: SelectionStep) => void
  }
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

export function useHierarchicalFormField({
  field,
  validation = {},
  callbacks = {}
}: UseHierarchicalFormFieldOptions): UseHierarchicalFormFieldReturn {
  
  const {
    realtime = true,
    debounceMs = 300,
    customValidator = validateHierarchicalForm
  } = validation
  
  const {
    onValidationChange,
    onStepChange,
    onComplete
  } = callbacks
  
  // Internal validation state
  const [validationState, setValidationState] = useState<HierarchicalValidationResult>({
    isValid: false,
    errors: {},
    step: 'category'
  })
  
  // Debounced validation timeout
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // Get current field value with safe defaults
  const currentValue: HierarchicalFieldValue = {
    selectedCategory: null,
    selectedRole: null,
    selectedOrganization: null,
    currentStep: 'category' as SelectionStep,
    ...field.state.value
  }
  
  // Validation function
  const validateValue = useCallback((value: HierarchicalFieldValue) => {
    const result = customValidator(value)
    setValidationState(result)
    onValidationChange?.(result)
    
    // Trigger TanStack Form field validation
    field.validate('change')
    
    return result
  }, [customValidator, onValidationChange, field])
  
  // Debounced validation
  const performDebouncedValidation = useCallback((value: HierarchicalFieldValue) => {
    if (validationTimeout) {
      clearTimeout(validationTimeout)
    }
    
    const timeout = setTimeout(() => {
      validateValue(value)
    }, debounceMs)
    
    setValidationTimeout(timeout)
  }, [validateValue, debounceMs, validationTimeout])
  
  // Change handler for hierarchical component
  const onChange = useCallback((data: HierarchicalFieldValue) => {
    // Update field value
    field.handleChange(data)
    
    // Track step changes
    if (data.currentStep !== currentValue.currentStep) {
      onStepChange?.(data.currentStep)
    }
    
    // Check if selection is complete
    const isComplete = data.selectedRole !== null && 
      (data.selectedCategory === 'system' || data.selectedOrganization !== null)
    
    if (isComplete) {
      onComplete?.(data)
    }
    
    // Perform validation
    if (realtime) {
      performDebouncedValidation(data)
    }
  }, [
    field,
    currentValue.currentStep,
    onStepChange,
    onComplete,
    realtime,
    performDebouncedValidation
  ])
  
  // Validate on field value changes
  useEffect(() => {
    if (realtime && field.state.value) {
      performDebouncedValidation(field.state.value)
    }
  }, [field.state.value, realtime, performDebouncedValidation])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout)
      }
    }
  }, [validationTimeout])
  
  // Field state helpers
  const fieldState = {
    hasError: field.state.meta.errors.length > 0 || !validationState.isValid,
    isValid: field.state.meta.errors.length === 0 && validationState.isValid,
    isTouched: field.state.meta.isTouched,
    isValidating: field.state.meta.isValidating
  }
  
  // Action helpers
  const actions = {
    reset: () => {
      field.handleChange({
        selectedCategory: null,
        selectedRole: null,
        selectedOrganization: null,
        currentStep: 'category' as SelectionStep
      })
      setValidationState({
        isValid: false,
        errors: {},
        step: 'category'
      })
    },
    
    validate: () => {
      validateValue(currentValue)
    },
    
    touch: () => {
      field.handleBlur()
    },
    
    setStep: (step: SelectionStep) => {
      onChange({
        ...currentValue,
        currentStep: step
      })
    }
  }
  
  return {
    value: currentValue,
    onChange,
    validation: validationState,
    fieldState,
    actions
  }
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Simple hook for basic hierarchical field integration
 */
export function useSimpleHierarchicalField(
  field: FieldApi<any, any, any, any, HierarchicalFieldValue>
) {
  return useHierarchicalFormField({
    field,
    validation: { realtime: true },
  })
}

/**
 * Hook with custom validation integration
 */
export function useValidatedHierarchicalField(
  field: FieldApi<any, any, any, any, HierarchicalFieldValue>,
  onValidationChange: (validation: HierarchicalValidationResult) => void
) {
  return useHierarchicalFormField({
    field,
    validation: { realtime: true },
    callbacks: { onValidationChange }
  })
}

/**
 * Hook for multi-step forms with step tracking
 */
export function useSteppedHierarchicalField(
  field: FieldApi<any, any, any, any, HierarchicalFieldValue>,
  onStepChange: (step: SelectionStep) => void,
  onComplete: (value: HierarchicalFieldValue) => void
) {
  return useHierarchicalFormField({
    field,
    validation: { realtime: true },
    callbacks: { onStepChange, onComplete }
  })
}

export default useHierarchicalFormField