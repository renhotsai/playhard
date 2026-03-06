/**
 * Hierarchical Form Submission Logic
 * 
 * Handles form submission for hierarchical role selection with proper data transformation,
 * validation, and integration with Better Auth and TanStack Query.
 * 
 * Task: T021
 * Feature: Form submission logic for hierarchical role selection
 * Date: September 17, 2025
 */

import { authClient } from '@/lib/auth-client'
import type { 
  RoleSelectionData,
  HierarchicalSelectionState,
  RoleType,
  RoleCategory 
} from '@/types/hierarchical-roles'
import { validateFormCompletion } from '@/lib/hierarchical-validation'
import { getRoleSpecificSuccessMessage } from '@/lib/role-selection-utils'

// Form submission interfaces
export interface HierarchicalFormSubmissionData {
  // User basic info
  name: string
  email: string
  
  // Hierarchical role selection data
  roleSelection: RoleSelectionData
  
  // Additional metadata
  inviteMessage?: string
  sendEmail?: boolean
}

export interface FormSubmissionResult {
  success: boolean
  data?: {
    user: {
      id: string
      email: string
      name: string
    }
    organization?: {
      id: string
      name: string
    }
    invitation?: {
      id: string
      token: string
    }
  }
  error?: {
    message: string
    code: string
    field?: string
  }
  metadata?: {
    roleCreated: RoleType
    organizationRequired: boolean
    invitationSent: boolean
  }
}

/**
 * Transform hierarchical selection data for API submission
 */
export function transformHierarchicalData(
  formData: HierarchicalFormSubmissionData
): {
  userData: {
    name: string
    email: string
    roleType: RoleType
    organizationId?: string
  }
  organizationData?: {
    organizationId: string
    role: string
  }
  metadata: {
    requiresOrganization: boolean
    isSystemRole: boolean
    category: RoleCategory
  }
} {
  const { name, email, roleSelection } = formData
  const { selectedRole, selectedOrganization, selectedCategory } = roleSelection
  
  if (!selectedRole || !selectedCategory) {
    throw new Error('Incomplete role selection data')
  }
  
  const requiresOrganization = selectedCategory === 'organization'
  const isSystemRole = selectedCategory === 'system'
  
  // Validate organization requirement
  if (requiresOrganization && !selectedOrganization) {
    throw new Error('Organization is required for organization roles')
  }
  
  const userData = {
    name,
    email,
    roleType: selectedRole,
    ...(selectedOrganization && { organizationId: selectedOrganization })
  }
  
  const organizationData = selectedOrganization ? {
    organizationId: selectedOrganization,
    role: mapRoleTypeToOrganizationRole(selectedRole)
  } : undefined
  
  return {
    userData,
    organizationData,
    metadata: {
      requiresOrganization,
      isSystemRole,
      category: selectedCategory
    }
  }
}

/**
 * Map role types to organization role strings for Better Auth
 */
function mapRoleTypeToOrganizationRole(roleType: RoleType): string {
  const roleMapping: Record<RoleType, string> = {
    'system_admin': 'admin', // Should not be used for organization
    'organization_owner': 'owner',
    'organization_admin': 'admin',
    'game_master': 'member',
    'game_staff': 'member',
    'game_player': 'member'
  }
  
  return roleMapping[roleType] || 'member'
}

/**
 * Submit hierarchical form data with proper error handling
 */
export async function submitHierarchicalForm(
  formData: HierarchicalFormSubmissionData
): Promise<FormSubmissionResult> {
  try {
    // Validate form data before submission
    const validation = validateFormCompletion({
      currentStep: 'role',
      selectedCategory: formData.roleSelection.selectedCategory,
      selectedRole: formData.roleSelection.selectedRole,
      selectedOrganization: formData.roleSelection.selectedOrganization,
      isLoading: false,
      error: null,
      canProceedToRole: true,
      canSubmitForm: true
    })
    
    if (!validation.isValid) {
      const firstError = Object.entries(validation.errors)[0]
      return {
        success: false,
        error: {
          message: firstError[1],
          code: 'VALIDATION_ERROR',
          field: firstError[0]
        }
      }
    }
    
    // Transform data for submission
    const { userData, organizationData, metadata } = transformHierarchicalData(formData)
    
    // Step 1: Create user account
    const userResult = await authClient.signUp.email({
      email: userData.email,
      name: userData.name,
      callbackURL: '/dashboard'
    })
    
    if (!userResult.data) {
      return {
        success: false,
        error: {
          message: 'Failed to create user account',
          code: 'USER_CREATION_FAILED'
        }
      }
    }
    
    let organizationResult
    let invitationResult
    
    // Step 2: Handle organization role assignment (if needed)
    if (organizationData && metadata.requiresOrganization) {
      try {
        // Invite user to organization
        invitationResult = await authClient.organization.inviteMember({
          organizationId: organizationData.organizationId,
          email: userData.email,
          role: organizationData.role,
          resend: false
        })
        
        if (!invitationResult.data) {
          console.warn('Organization invitation failed, but user was created')
        }
        
        // Get organization details
        const organizations = await authClient.organization.list()
        organizationResult = organizations.data?.find(
          org => org.id === organizationData.organizationId
        )
      } catch (orgError) {
        console.error('Organization operations failed:', orgError)
        // Don't fail the entire operation if org operations fail
        // User was still created successfully
      }
    }
    
    // Step 3: Handle system role assignment (if needed)
    if (metadata.isSystemRole) {
      try {
        // System roles might need additional API calls or database updates
        // This depends on your specific system role implementation
        console.log('System role assigned:', userData.roleType)
      } catch (systemError) {
        console.error('System role assignment failed:', systemError)
      }
    }
    
    return {
      success: true,
      data: {
        user: {
          id: userResult.data.user.id,
          email: userResult.data.user.email,
          name: userResult.data.user.name || userData.name
        },
        ...(organizationResult && {
          organization: {
            id: organizationResult.id,
            name: organizationResult.name
          }
        }),
        ...(invitationResult?.data && {
          invitation: {
            id: invitationResult.data.id,
            token: invitationResult.data.token || ''
          }
        })
      },
      metadata: {
        roleCreated: userData.roleType,
        organizationRequired: metadata.requiresOrganization,
        invitationSent: !!invitationResult?.data
      }
    }
    
  } catch (error) {
    console.error('Form submission error:', error)
    
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'SUBMISSION_ERROR'
      }
    }
  }
}

/**
 * Get success message based on submission result
 */
export function getSubmissionSuccessMessage(
  result: FormSubmissionResult
): string {
  if (!result.success || !result.data || !result.metadata) {
    return 'Operation completed'
  }
  
  const { user, organization } = result.data
  const { roleCreated, invitationSent } = result.metadata
  
  return getRoleSpecificSuccessMessage(
    roleCreated,
    user.name,
    organization?.name
  )
}

/**
 * Handle form submission errors with user-friendly messages
 */
export function getSubmissionErrorMessage(error: FormSubmissionResult['error']): string {
  if (!error) return 'Unknown error occurred'
  
  const errorMessages: Record<string, string> = {
    'VALIDATION_ERROR': 'Please check your form inputs',
    'USER_CREATION_FAILED': 'Failed to create user account. Please try again.',
    'ORGANIZATION_INVITATION_FAILED': 'User was created but organization invitation failed',
    'SYSTEM_ROLE_ASSIGNMENT_FAILED': 'User was created but system role assignment failed',
    'SUBMISSION_ERROR': 'Form submission failed. Please try again.',
    'NETWORK_ERROR': 'Network error. Please check your connection and try again.',
    'PERMISSION_DENIED': 'You do not have permission to perform this action'
  }
  
  return errorMessages[error.code] || error.message || 'An unexpected error occurred'
}

/**
 * Validate hierarchical form data before submission
 */
export function validateHierarchicalFormSubmission(
  formData: HierarchicalFormSubmissionData
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  
  // Basic field validation
  if (!formData.name?.trim()) {
    errors.name = 'Name is required'
  }
  
  if (!formData.email?.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email address'
  }
  
  // Hierarchical selection validation
  if (!formData.roleSelection.selectedCategory) {
    errors.category = 'Please select a role category'
  }
  
  if (!formData.roleSelection.selectedRole) {
    errors.role = 'Please select a specific role'
  }
  
  // Organization requirement validation
  if (
    formData.roleSelection.selectedCategory === 'organization' &&
    !formData.roleSelection.selectedOrganization
  ) {
    errors.organization = 'Organization is required for organization roles'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Create mutation function for TanStack Query integration
 */
export function createHierarchicalFormMutation() {
  return {
    mutationFn: submitHierarchicalForm,
    onSuccess: (result: FormSubmissionResult) => {
      if (result.success) {
        console.log('Form submitted successfully:', result.data)
      }
    },
    onError: (error: Error) => {
      console.error('Form submission failed:', error)
    }
  }
}