/**
 * Integration Test: Form Validation for Hierarchical Role Selection
 * 
 * Tests the complete validation flow of the hierarchical role selection feature.
 * Validates step-by-step validation, cross-step validation, and form submission readiness.
 * 
 * Test ID: T010
 * Feature: Step-by-step role selection with validation
 * Date: September 17, 2025
 */

import { renderHook, act } from '@testing-library/react'
import { 
  validateCategorySelection,
  validateRoleSelection,
  validateOrganizationSelection,
  validateFormCompletion,
  validateHierarchicalForm
} from '@/lib/hierarchical-validation'
import type { 
  HierarchicalSelectionState,
  RoleCategory,
  RoleType 
} from '@/types/hierarchical-roles'

describe('Integration: Form Validation for Hierarchical Role Selection', () => {
  
  describe('Step-by-Step Validation Flow', () => {
    it('should validate category selection step', () => {
      // ARRANGE: Test category validation
      const validCategory: RoleCategory = 'system'
      const invalidCategory = null
      
      // ACT & ASSERT: Valid category should pass
      const validResult = validateCategorySelection(validCategory)
      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toEqual({})
      expect(validResult.step).toBe('category')
      
      // ACT & ASSERT: Invalid category should fail
      const invalidResult = validateCategorySelection(invalidCategory)
      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors.selectedCategory).toBe('Please select a role category')
      expect(invalidResult.step).toBe('category')
    })

    it('should validate role selection step', () => {
      // ARRANGE: Test role validation with category context
      const systemCategory: RoleCategory = 'system'
      const orgCategory: RoleCategory = 'organization'
      const systemRole: RoleType = 'system_admin'
      const orgRole: RoleType = 'organization_owner'
      
      // ACT & ASSERT: Valid system role should pass
      const validSystemResult = validateRoleSelection(systemRole, systemCategory)
      expect(validSystemResult.isValid).toBe(true)
      expect(validSystemResult.errors).toEqual({})
      
      // ACT & ASSERT: Valid organization role should pass
      const validOrgResult = validateRoleSelection(orgRole, orgCategory)
      expect(validOrgResult.isValid).toBe(true)
      expect(validOrgResult.errors).toEqual({})
      
      // ACT & ASSERT: Mismatched role-category should fail
      const mismatchResult = validateRoleSelection(systemRole, orgCategory)
      expect(mismatchResult.isValid).toBe(false)
      expect(mismatchResult.errors.selectedRole).toBe('Selected role does not match the chosen category')
      
      // ACT & ASSERT: No role selected should fail
      const noRoleResult = validateRoleSelection(null, systemCategory)
      expect(noRoleResult.isValid).toBe(false)
      expect(noRoleResult.errors.selectedRole).toBe('Please select a specific role')
    })

    it('should validate organization selection requirement', () => {
      // ARRANGE: Test organization validation based on role requirements
      const systemRole: RoleType = 'system_admin'
      const orgRole: RoleType = 'organization_owner'
      const organizationId = 'org-123'
      
      // ACT & ASSERT: System role doesn't require organization
      const systemResult = validateOrganizationSelection(null, systemRole)
      expect(systemResult.isValid).toBe(true)
      expect(systemResult.errors).toEqual({})
      
      // ACT & ASSERT: Organization role with organization should pass
      const orgWithIdResult = validateOrganizationSelection(organizationId, orgRole)
      expect(orgWithIdResult.isValid).toBe(true)
      expect(orgWithIdResult.errors).toEqual({})
      
      // ACT & ASSERT: Organization role without organization should fail
      const orgWithoutIdResult = validateOrganizationSelection(null, orgRole)
      expect(orgWithoutIdResult.isValid).toBe(false)
      expect(orgWithoutIdResult.errors.organizationId).toBe('Organization selection is required for this role')
    })
  })

  describe('Complete Form Validation', () => {
    it('should validate complete form state for system admin', () => {
      // ARRANGE: Complete system admin selection
      const completeSystemState: HierarchicalSelectionState = {
        currentStep: 'role',
        selectedCategory: 'system',
        selectedRole: 'system_admin',
        selectedOrganization: null,
        isLoading: false,
        error: null,
        canProceedToRole: true,
        canSubmitForm: true
      }
      
      // ACT: Validate complete form
      const result = validateFormCompletion(completeSystemState)
      
      // ASSERT: Should be valid for submission
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
      expect(result.step).toBe('role')
    })

    it('should validate complete form state for organization owner', () => {
      // ARRANGE: Complete organization owner selection
      const completeOrgState: HierarchicalSelectionState = {
        currentStep: 'role',
        selectedCategory: 'organization',
        selectedRole: 'organization_owner',
        selectedOrganization: 'org-123',
        isLoading: false,
        error: null,
        canProceedToRole: true,
        canSubmitForm: true
      }
      
      // ACT: Validate complete form
      const result = validateFormCompletion(completeOrgState)
      
      // ASSERT: Should be valid for submission
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
      expect(result.step).toBe('role')
    })

    it('should reject incomplete form state', () => {
      // ARRANGE: Incomplete form state
      const incompleteState: HierarchicalSelectionState = {
        currentStep: 'category',
        selectedCategory: null,
        selectedRole: null,
        selectedOrganization: null,
        isLoading: false,
        error: null,
        canProceedToRole: false,
        canSubmitForm: false
      }
      
      // ACT: Validate incomplete form
      const result = validateFormCompletion(incompleteState)
      
      // ASSERT: Should be invalid
      expect(result.isValid).toBe(false)
      expect(result.errors.selectedCategory).toBe('Please select a role category')
      expect(result.errors.selectedRole).toBe('Please select a specific role')
      expect(result.step).toBe('category')
    })

    it('should reject organization role without organization', () => {
      // ARRANGE: Organization role without organization selection
      const invalidOrgState: HierarchicalSelectionState = {
        currentStep: 'role',
        selectedCategory: 'organization',
        selectedRole: 'organization_owner',
        selectedOrganization: null,
        isLoading: false,
        error: null,
        canProceedToRole: true,
        canSubmitForm: false
      }
      
      // ACT: Validate form with missing organization
      const result = validateFormCompletion(invalidOrgState)
      
      // ASSERT: Should be invalid due to missing organization
      expect(result.isValid).toBe(false)
      expect(result.errors.organizationId).toBe('Organization selection is required for this role')
    })
  })

  describe('Batch Validation', () => {
    it('should validate hierarchical form with partial data', () => {
      // ARRANGE: Partial form data
      const partialData = {
        selectedCategory: 'system' as RoleCategory,
        selectedRole: undefined,
        selectedOrganization: null
      }
      
      // ACT: Validate batch form data
      const result = validateHierarchicalForm(partialData)
      
      // ASSERT: Should be invalid due to missing role
      expect(result.isValid).toBe(false)
      expect(result.step).toBe('role')
    })

    it('should validate hierarchical form with complete system data', () => {
      // ARRANGE: Complete system form data
      const completeSystemData = {
        selectedCategory: 'system' as RoleCategory,
        selectedRole: 'system_admin' as RoleType,
        selectedOrganization: null
      }
      
      // ACT: Validate batch form data
      const result = validateHierarchicalForm(completeSystemData)
      
      // ASSERT: Should be valid
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
      expect(result.step).toBe('role')
    })

    it('should validate hierarchical form with complete organization data', () => {
      // ARRANGE: Complete organization form data
      const completeOrgData = {
        selectedCategory: 'organization' as RoleCategory,
        selectedRole: 'organization_owner' as RoleType,
        selectedOrganization: 'org-123'
      }
      
      // ACT: Validate batch form data
      const result = validateHierarchicalForm(completeOrgData)
      
      // ASSERT: Should be valid
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
      expect(result.step).toBe('role')
    })
  })

  describe('Real-time Validation Scenarios', () => {
    it('should handle category change validation', () => {
      // ARRANGE: User changes category after selecting role
      const initialState: HierarchicalSelectionState = {
        currentStep: 'role',
        selectedCategory: 'system',
        selectedRole: 'system_admin',
        selectedOrganization: null,
        isLoading: false,
        error: null,
        canProceedToRole: true,
        canSubmitForm: true
      }
      
      // User changes to organization category
      const changedState: HierarchicalSelectionState = {
        ...initialState,
        selectedCategory: 'organization',
        selectedRole: null, // Should be reset
        selectedOrganization: null,
        canSubmitForm: false
      }
      
      // ACT: Validate after category change
      const result = validateFormCompletion(changedState)
      
      // ASSERT: Should be invalid due to missing role
      expect(result.isValid).toBe(false)
      expect(result.errors.selectedRole).toBe('Please select a specific role')
    })

    it('should handle role change validation with organization requirement', () => {
      // ARRANGE: User selects organization role
      const stateWithOrgRole: HierarchicalSelectionState = {
        currentStep: 'role',
        selectedCategory: 'organization',
        selectedRole: 'organization_owner',
        selectedOrganization: null,
        isLoading: false,
        error: null,
        canProceedToRole: true,
        canSubmitForm: false
      }
      
      // ACT: Validate role that requires organization
      const result = validateFormCompletion(stateWithOrgRole)
      
      // ASSERT: Should be invalid due to missing organization
      expect(result.isValid).toBe(false)
      expect(result.errors.organizationId).toBe('Organization selection is required for this role')
    })
  })

  describe('Error Message Formatting', () => {
    it('should provide clear error messages for each validation failure', () => {
      // ARRANGE: Test various validation failures
      const testCases = [
        {
          state: { selectedCategory: null, selectedRole: null, selectedOrganization: null },
          expectedErrors: ['Please select a role category', 'Please select a specific role']
        },
        {
          state: { selectedCategory: 'organization', selectedRole: 'organization_owner', selectedOrganization: null },
          expectedErrors: ['Organization selection is required for this role']
        }
      ]
      
      testCases.forEach(({ state, expectedErrors }) => {
        // ACT: Validate partial state
        const partialState = {
          currentStep: 'category' as const,
          isLoading: false,
          error: null,
          canProceedToRole: false,
          canSubmitForm: false,
          ...state
        }
        
        const result = validateFormCompletion(partialState)
        
        // ASSERT: Error messages should be clear and helpful
        expect(result.isValid).toBe(false)
        const errorMessages = Object.values(result.errors)
        expectedErrors.forEach(expectedError => {
          expect(errorMessages).toContain(expectedError)
        })
      })
    })
  })

  describe('Performance Validation', () => {
    it('should validate large form state efficiently', () => {
      // ARRANGE: Large validation operation
      const startTime = performance.now()
      
      // ACT: Perform 1000 validations
      for (let i = 0; i < 1000; i++) {
        const state: HierarchicalSelectionState = {
          currentStep: 'role',
          selectedCategory: 'system',
          selectedRole: 'system_admin',
          selectedOrganization: null,
          isLoading: false,
          error: null,
          canProceedToRole: true,
          canSubmitForm: true
        }
        validateFormCompletion(state)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // ASSERT: Should complete within reasonable time (less than 100ms for 1000 validations)
      expect(duration).toBeLessThan(100)
    })
  })
})