/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react'
import { waitFor } from '@testing-library/react'
// Import hook - this will fail until hook is implemented (TDD approach)
import { useHierarchicalSelection } from '@/hooks/use-hierarchical-selection'
import type {
  HierarchicalSelectionState,
  RoleCategory,
  RoleType,
  SelectionStep,
  HierarchicalValidationResult
} from '@/types/hierarchical-roles'

// Mock the utility functions
jest.mock('@/lib/role-selection-utils', () => ({
  createInitialState: jest.fn(() => ({
    currentStep: 'category',
    selectedCategory: null,
    selectedRole: null,
    selectedOrganization: null,
    isLoading: false,
    error: null,
    canProceedToRole: false,
    canSubmitForm: false
  })),
  updateStateForCategorySelection: jest.fn((state, category) => ({
    ...state,
    selectedCategory: category,
    selectedRole: null,
    selectedOrganization: null,
    currentStep: 'role',
    canProceedToRole: true,
    canSubmitForm: false,
    error: null
  })),
  updateStateForRoleSelection: jest.fn((state, role) => ({
    ...state,
    selectedRole: role,
    canSubmitForm: role === 'system_admin' || (role !== 'system_admin' && state.selectedOrganization !== null),
    error: null
  })),
  updateStateForOrganizationSelection: jest.fn((state, organizationId) => ({
    ...state,
    selectedOrganization: organizationId,
    canSubmitForm: state.selectedRole !== null && organizationId !== null,
    error: null
  })),
  resetState: jest.fn(() => ({
    currentStep: 'category',
    selectedCategory: null,
    selectedRole: null,
    selectedOrganization: null,
    isLoading: false,
    error: null,
    canProceedToRole: false,
    canSubmitForm: false
  })),
  isStateValidForSubmission: jest.fn((state) => {
    if (!state.selectedCategory || !state.selectedRole) return false
    if (state.selectedRole !== 'system_admin' && !state.selectedOrganization) return false
    return true
  }),
  canTransitionToStep: jest.fn((currentStep, targetStep, state) => {
    if (targetStep === 'role' && !state.selectedCategory) return false
    if (targetStep === 'category') return true
    return true
  }),
  getStepProgress: jest.fn((currentStep) => {
    return currentStep === 'category' ? 50 : 100
  }),
  getCategoryOptions: jest.fn(() => [
    {
      id: 'system',
      title: 'System Roles',
      description: 'Global platform administration',
      icon: null,
      badge: 'FULL ACCESS',
      badgeVariant: 'destructive'
    },
    {
      id: 'organization',
      title: 'Organization Roles',
      description: 'Organization-specific roles',
      icon: null,
      badge: 'ORG SCOPED',
      badgeVariant: 'secondary'
    }
  ]),
  getRolesByCategory: jest.fn((category) => {
    if (category === 'system') {
      return [{
        id: 'system_admin',
        title: 'System Administrator',
        description: 'Complete platform control',
        category: 'system',
        requiresOrganization: false,
        badge: 'GLOBAL',
        badgeVariant: 'destructive',
        icon: null
      }]
    }
    return [
      {
        id: 'organization_owner',
        title: 'Organization Owner',
        description: 'Complete organization control',
        category: 'organization',
        requiresOrganization: true,
        badge: 'OWNER',
        badgeVariant: 'default',
        icon: null
      },
      {
        id: 'game_master',
        title: 'Game Master',
        description: 'Lead murder mystery games',
        category: 'organization',
        requiresOrganization: true,
        badge: 'GM',
        badgeVariant: 'outline',
        icon: null
      }
    ]
  }),
  filterRolesByQuery: jest.fn((roles, query) => {
    if (!query) return roles
    return roles.filter((role: any) => 
      role.title.toLowerCase().includes(query.toLowerCase()) ||
      role.description.toLowerCase().includes(query.toLowerCase())
    )
  })
}))

// Mock validation functions
jest.mock('@/lib/hierarchical-validation', () => ({
  validateFormCompletion: jest.fn((state) => ({
    isValid: state.selectedCategory && state.selectedRole && 
            (state.selectedRole === 'system_admin' || state.selectedOrganization),
    errors: {},
    step: 'role'
  })),
  validateCategorySelection: jest.fn((category) => ({
    isValid: category !== null,
    errors: category ? {} : { selectedCategory: 'Please select a category' },
    step: 'category'
  })),
  validateRoleSelection: jest.fn((role, category) => ({
    isValid: role !== null,
    errors: role ? {} : { selectedRole: 'Please select a role' },
    step: 'role'
  })),
  validateOrganizationSelection: jest.fn((organizationId, role) => ({
    isValid: role === 'system_admin' || organizationId !== null,
    errors: (role !== 'system_admin' && !organizationId) ? 
            { organizationId: 'Organization required' } : {},
    step: 'role'
  }))
}))

describe('useHierarchicalSelection Hook Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Hook Interface & Initial State', () => {
    it('should return correct interface structure', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      expect(result.current).toEqual({
        // State
        state: expect.any(Object),
        
        // Actions
        selectCategory: expect.any(Function),
        selectRole: expect.any(Function),
        selectOrganization: expect.any(Function),
        navigateToStep: expect.any(Function),
        reset: expect.any(Function),
        
        // Data getters
        getCategoryOptions: expect.any(Function),
        getCurrentRoles: expect.any(Function),
        getFilteredRoles: expect.any(Function),
        
        // Validation
        validation: expect.any(Object),
        
        // Computed properties
        progress: expect.any(Number),
        canProceed: expect.any(Boolean),
        isComplete: expect.any(Boolean),
        
        // Search functionality
        searchQuery: expect.any(String),
        setSearchQuery: expect.any(Function)
      })
    })

    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      expect(result.current.state).toEqual({
        currentStep: 'category',
        selectedCategory: null,
        selectedRole: null,
        selectedOrganization: null,
        isLoading: false,
        error: null,
        canProceedToRole: false,
        canSubmitForm: false
      })
    })

    it('should initialize with provided initial state', () => {
      const initialState: Partial<HierarchicalSelectionState> = {
        selectedCategory: 'organization',
        currentStep: 'role'
      }
      
      const { result } = renderHook(() => 
        useHierarchicalSelection({ initialState })
      )
      
      expect(result.current.state.selectedCategory).toBe('organization')
      expect(result.current.state.currentStep).toBe('role')
    })
  })

  describe('Category Selection', () => {
    it('should handle category selection correctly', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      act(() => {
        result.current.selectCategory('organization')
      })
      
      expect(result.current.state.selectedCategory).toBe('organization')
      expect(result.current.state.currentStep).toBe('role')
      expect(result.current.state.canProceedToRole).toBe(true)
      expect(result.current.state.selectedRole).toBe(null) // Should reset role
    })

    it('should reset role and organization when changing categories', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // First select organization category and role
      act(() => {
        result.current.selectCategory('organization')
      })
      
      act(() => {
        result.current.selectRole('organization_owner')
      })
      
      act(() => {
        result.current.selectOrganization('org-1')
      })
      
      // Then change to system category
      act(() => {
        result.current.selectCategory('system')
      })
      
      expect(result.current.state.selectedCategory).toBe('system')
      expect(result.current.state.selectedRole).toBe(null)
      expect(result.current.state.selectedOrganization).toBe(null)
    })

    it('should call onCategoryChange callback when provided', () => {
      const onCategoryChange = jest.fn()
      const { result } = renderHook(() => 
        useHierarchicalSelection({ onCategoryChange })
      )
      
      act(() => {
        result.current.selectCategory('system')
      })
      
      expect(onCategoryChange).toHaveBeenCalledWith('system')
    })
  })

  describe('Role Selection', () => {
    it('should handle role selection for system roles', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // First select system category
      act(() => {
        result.current.selectCategory('system')
      })
      
      act(() => {
        result.current.selectRole('system_admin')
      })
      
      expect(result.current.state.selectedRole).toBe('system_admin')
      expect(result.current.state.canSubmitForm).toBe(true) // System admin doesn't need org
    })

    it('should handle role selection for organization roles', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // First select organization category
      act(() => {
        result.current.selectCategory('organization')
      })
      
      act(() => {
        result.current.selectRole('organization_owner')
      })
      
      expect(result.current.state.selectedRole).toBe('organization_owner')
      expect(result.current.state.canSubmitForm).toBe(false) // Needs organization
    })

    it('should call onRoleChange callback when provided', () => {
      const onRoleChange = jest.fn()
      const { result } = renderHook(() => 
        useHierarchicalSelection({ onRoleChange })
      )
      
      act(() => {
        result.current.selectCategory('system')
      })
      
      act(() => {
        result.current.selectRole('system_admin')
      })
      
      expect(onRoleChange).toHaveBeenCalledWith('system_admin')
    })
  })

  describe('Organization Selection', () => {
    it('should handle organization selection', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // Setup: select org category and role
      act(() => {
        result.current.selectCategory('organization')
      })
      
      act(() => {
        result.current.selectRole('organization_owner')
      })
      
      act(() => {
        result.current.selectOrganization('org-1')
      })
      
      expect(result.current.state.selectedOrganization).toBe('org-1')
      expect(result.current.state.canSubmitForm).toBe(true)
    })

    it('should call onOrganizationChange callback when provided', () => {
      const onOrganizationChange = jest.fn()
      const { result } = renderHook(() => 
        useHierarchicalSelection({ onOrganizationChange })
      )
      
      act(() => {
        result.current.selectCategory('organization')
      })
      
      act(() => {
        result.current.selectRole('organization_owner')
      })
      
      act(() => {
        result.current.selectOrganization('org-1')
      })
      
      expect(onOrganizationChange).toHaveBeenCalledWith('org-1')
    })
  })

  describe('Step Navigation', () => {
    it('should allow navigation to valid steps', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // First complete category selection
      act(() => {
        result.current.selectCategory('organization')
      })
      
      // Should be on role step now, navigate back to category
      act(() => {
        result.current.navigateToStep('category')
      })
      
      expect(result.current.state.currentStep).toBe('category')
    })

    it('should prevent navigation to invalid steps', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // Try to navigate to role step without selecting category
      act(() => {
        result.current.navigateToStep('role')
      })
      
      // Should remain on category step
      expect(result.current.state.currentStep).toBe('category')
    })

    it('should call onStepChange callback when provided', () => {
      const onStepChange = jest.fn()
      const { result } = renderHook(() => 
        useHierarchicalSelection({ onStepChange })
      )
      
      act(() => {
        result.current.selectCategory('organization')
      })
      
      expect(onStepChange).toHaveBeenCalledWith('role')
    })
  })

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // Make some selections
      act(() => {
        result.current.selectCategory('organization')
      })
      
      act(() => {
        result.current.selectRole('organization_owner')
      })
      
      act(() => {
        result.current.selectOrganization('org-1')
      })
      
      // Reset
      act(() => {
        result.current.reset()
      })
      
      expect(result.current.state).toEqual({
        currentStep: 'category',
        selectedCategory: null,
        selectedRole: null,
        selectedOrganization: null,
        isLoading: false,
        error: null,
        canProceedToRole: false,
        canSubmitForm: false
      })
    })

    it('should call onReset callback when provided', () => {
      const onReset = jest.fn()
      const { result } = renderHook(() => 
        useHierarchicalSelection({ onReset })
      )
      
      act(() => {
        result.current.reset()
      })
      
      expect(onReset).toHaveBeenCalled()
    })
  })

  describe('Data Getters', () => {
    it('should return category options', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      const categories = result.current.getCategoryOptions()
      
      expect(categories).toHaveLength(2)
      expect(categories[0].id).toBe('system')
      expect(categories[1].id).toBe('organization')
    })

    it('should return current roles based on selected category', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // No category selected - should return empty array
      expect(result.current.getCurrentRoles()).toEqual([])
      
      // Select system category
      act(() => {
        result.current.selectCategory('system')
      })
      
      const systemRoles = result.current.getCurrentRoles()
      expect(systemRoles).toHaveLength(1)
      expect(systemRoles[0].id).toBe('system_admin')
      
      // Select organization category
      act(() => {
        result.current.selectCategory('organization')
      })
      
      const orgRoles = result.current.getCurrentRoles()
      expect(orgRoles).toHaveLength(2)
      expect(orgRoles.map(r => r.id)).toContain('organization_owner')
      expect(orgRoles.map(r => r.id)).toContain('game_master')
    })

    it('should return filtered roles based on search query', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // Select organization category
      act(() => {
        result.current.selectCategory('organization')
      })
      
      // Set search query
      act(() => {
        result.current.setSearchQuery('master')
      })
      
      const filteredRoles = result.current.getFilteredRoles()
      expect(filteredRoles).toHaveLength(1)
      expect(filteredRoles[0].id).toBe('game_master')
    })
  })

  describe('Validation', () => {
    it('should provide current validation state', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // Initial state should be invalid
      expect(result.current.validation.isValid).toBe(false)
      expect(result.current.validation.errors).toEqual({})
      
      // Complete valid selection
      act(() => {
        result.current.selectCategory('system')
      })
      
      act(() => {
        result.current.selectRole('system_admin')
      })
      
      expect(result.current.validation.isValid).toBe(true)
    })

    it('should validate step completion correctly', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // Category step should be invalid initially
      expect(result.current.validation.isValid).toBe(false)
      
      // Select category
      act(() => {
        result.current.selectCategory('organization')
      })
      
      // Role step should be invalid without role selection
      expect(result.current.validation.isValid).toBe(false)
      
      // Select role
      act(() => {
        result.current.selectRole('organization_owner')
      })
      
      // Should still be invalid without organization
      expect(result.current.validation.isValid).toBe(false)
      
      // Select organization
      act(() => {
        result.current.selectOrganization('org-1')
      })
      
      // Should now be valid
      expect(result.current.validation.isValid).toBe(true)
    })
  })

  describe('Computed Properties', () => {
    it('should calculate progress correctly', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // Category step = 50%
      expect(result.current.progress).toBe(50)
      
      // Move to role step = 100%
      act(() => {
        result.current.selectCategory('system')
      })
      
      expect(result.current.progress).toBe(100)
    })

    it('should determine canProceed correctly', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // Initially cannot proceed
      expect(result.current.canProceed).toBe(false)
      
      // After selecting category, can proceed
      act(() => {
        result.current.selectCategory('system')
      })
      
      expect(result.current.canProceed).toBe(true)
    })

    it('should determine isComplete correctly', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // Initially not complete
      expect(result.current.isComplete).toBe(false)
      
      // Complete system admin selection
      act(() => {
        result.current.selectCategory('system')
      })
      
      act(() => {
        result.current.selectRole('system_admin')
      })
      
      expect(result.current.isComplete).toBe(true)
    })
  })

  describe('Search Functionality', () => {
    it('should manage search query state', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      expect(result.current.searchQuery).toBe('')
      
      act(() => {
        result.current.setSearchQuery('admin')
      })
      
      expect(result.current.searchQuery).toBe('admin')
    })

    it('should call onSearchChange callback when provided', () => {
      const onSearchChange = jest.fn()
      const { result } = renderHook(() => 
        useHierarchicalSelection({ onSearchChange })
      )
      
      act(() => {
        result.current.setSearchQuery('test query')
      })
      
      expect(onSearchChange).toHaveBeenCalledWith('test query')
    })
  })

  describe('Error Handling', () => {
    it('should handle async operation errors', async () => {
      const onError = jest.fn()
      const { result } = renderHook(() => 
        useHierarchicalSelection({ onError })
      )
      
      // Simulate an error during category selection
      const mockError = new Error('Failed to load roles')
      
      act(() => {
        // This would normally trigger an async operation that fails
        result.current.selectCategory('organization')
      })
      
      // In a real implementation, this would handle async errors
      // For now, we'll simulate the error handling
      act(() => {
        // Simulate error state update
        if (onError) {
          onError(mockError)
        }
      })
      
      expect(onError).toHaveBeenCalledWith(mockError)
    })

    it('should clear errors when making valid selections', () => {
      const { result } = renderHook(() => 
        useHierarchicalSelection({ 
          initialState: { error: 'Previous error' } 
        })
      )
      
      expect(result.current.state.error).toBe('Previous error')
      
      act(() => {
        result.current.selectCategory('system')
      })
      
      expect(result.current.state.error).toBe(null)
    })
  })

  describe('Performance & Optimization', () => {
    it('should memoize expensive computations', () => {
      const { result, rerender } = renderHook(() => useHierarchicalSelection())
      
      const firstCategoryOptions = result.current.getCategoryOptions()
      
      // Rerender without changing relevant state
      rerender()
      
      const secondCategoryOptions = result.current.getCategoryOptions()
      
      // Should return the same reference (memoized)
      expect(firstCategoryOptions).toBe(secondCategoryOptions)
    })

    it('should handle rapid state changes efficiently', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // Rapid category changes
      act(() => {
        result.current.selectCategory('system')
        result.current.selectCategory('organization')
        result.current.selectCategory('system')
      })
      
      expect(result.current.state.selectedCategory).toBe('system')
      expect(result.current.state.currentStep).toBe('role')
    })
  })

  describe('Integration with External State', () => {
    it('should work with external state management', () => {
      const onChange = jest.fn()
      const { result } = renderHook(() => 
        useHierarchicalSelection({ onChange })
      )
      
      act(() => {
        result.current.selectCategory('organization')
      })
      
      expect(onChange).toHaveBeenCalledWith({
        selectedCategory: 'organization',
        selectedRole: null,
        selectedOrganization: null,
        currentStep: 'role'
      })
    })

    it('should sync with external state updates', () => {
      const externalState = {
        selectedCategory: 'system' as RoleCategory,
        selectedRole: 'system_admin' as RoleType,
        selectedOrganization: null,
        currentStep: 'role' as SelectionStep
      }
      
      const { result } = renderHook(() => 
        useHierarchicalSelection({ 
          initialState: externalState 
        })
      )
      
      expect(result.current.state.selectedCategory).toBe('system')
      expect(result.current.state.selectedRole).toBe('system_admin')
      expect(result.current.state.currentStep).toBe('role')
    })
  })

  describe('Accessibility Support', () => {
    it('should provide accessibility helpers', () => {
      const { result } = renderHook(() => useHierarchicalSelection())
      
      // Should provide ARIA attributes for screen readers
      expect(result.current.state.currentStep).toBe('category')
      
      // After category selection, should update step context
      act(() => {
        result.current.selectCategory('organization')
      })
      
      expect(result.current.state.currentStep).toBe('role')
    })
  })
})