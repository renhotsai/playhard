/**
 * Validation Contract: Hierarchical Role Selection
 * 
 * This file defines the validation rules, schemas, and contracts for
 * hierarchical role selection. These ensure data integrity and provide
 * clear validation feedback at each step.
 */

import { z } from 'zod';
import type { 
  RoleType, 
  RoleCategory, 
  SelectionStep,
  HierarchicalSelectionState,
  ValidationResult,
  SelectionError 
} from './hierarchical-role-selection.interface';

// ============================================================================
// Zod Validation Schemas
// ============================================================================

/**
 * Role category validation schema
 */
export const roleCategorySchema = z.enum(['system', 'organization'], {
  errorMap: () => ({ message: 'Please select either System or Organization roles' })
});

/**
 * Role type validation schema
 */
export const roleTypeSchema = z.enum([
  'system_admin',
  'organization_owner',
  'organization_admin', 
  'game_master',
  'game_staff',
  'game_player'
], {
  errorMap: () => ({ message: 'Please select a valid role' })
});

/**
 * Selection step validation schema
 */
export const selectionStepSchema = z.enum(['category', 'role'], {
  errorMap: () => ({ message: 'Invalid selection step' })
});

/**
 * Organization ID validation schema
 */
export const organizationIdSchema = z.string().min(1, {
  message: 'Organization ID cannot be empty'
}).uuid({
  message: 'Organization ID must be a valid UUID'
});

/**
 * Complete hierarchical selection validation schema
 */
export const hierarchicalSelectionSchema = z.object({
  currentStep: selectionStepSchema,
  selectedCategory: roleCategorySchema.nullable(),
  selectedRole: roleTypeSchema.nullable(),
  selectedOrganization: organizationIdSchema.nullable(),
  isLoading: z.boolean(),
  error: z.string().nullable(),
  canProceedToRole: z.boolean(),
  canSubmitForm: z.boolean()
});

/**
 * Form submission validation schema
 */
export const formSubmissionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  roleType: roleTypeSchema,
  selectedSection: z.enum(['system', 'organization']),
  organizationId: organizationIdSchema.optional()
}).refine((data) => {
  // Organization is required for organization roles
  if (data.selectedSection === 'organization') {
    return data.organizationId !== undefined && data.organizationId.length > 0;
  }
  return true;
}, {
  message: 'Organization is required for organization roles',
  path: ['organizationId']
});

// ============================================================================
// Validation Rule Interfaces
// ============================================================================

/**
 * Step-specific validation rules
 */
export interface StepValidationRules {
  category: {
    required: boolean;
    validate: (category: RoleCategory | null) => ValidationResult;
  };
  role: {
    required: boolean;
    validate: (role: RoleType | null, category: RoleCategory) => ValidationResult;
  };
  organization: {
    required: boolean;
    validate: (orgId: string | null, requiresOrg: boolean) => ValidationResult;
  };
}

/**
 * Cross-step validation rules
 */
export interface CrossStepValidationRules {
  categoryRoleAlignment: (category: RoleCategory, role: RoleType) => ValidationResult;
  organizationRequirement: (role: RoleType, orgId: string | null) => ValidationResult;
  stepProgression: (currentStep: SelectionStep, state: HierarchicalSelectionState) => ValidationResult;
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates if a role belongs to the specified category
 */
export const validateRoleCategoryAlignment = (
  category: RoleCategory, 
  role: RoleType
): ValidationResult => {
  const systemRoles: RoleType[] = ['system_admin'];
  const organizationRoles: RoleType[] = [
    'organization_owner',
    'organization_admin',
    'game_master',
    'game_staff',
    'game_player'
  ];

  const isSystemRole = systemRoles.includes(role);
  const isOrganizationRole = organizationRoles.includes(role);

  if (category === 'system' && !isSystemRole) {
    return {
      isValid: false,
      errors: [{
        type: 'validation',
        step: 'role',
        field: 'roleType',
        message: 'Selected role does not belong to System category',
        code: 'CATEGORY_ROLE_MISMATCH'
      }]
    };
  }

  if (category === 'organization' && !isOrganizationRole) {
    return {
      isValid: false,
      errors: [{
        type: 'validation',
        step: 'role',
        field: 'roleType',
        message: 'Selected role does not belong to Organization category',
        code: 'CATEGORY_ROLE_MISMATCH'
      }]
    };
  }

  return { isValid: true, errors: [] };
};

/**
 * Validates organization requirement for role
 */
export const validateOrganizationRequirement = (
  role: RoleType, 
  organizationId: string | null
): ValidationResult => {
  const organizationRoles: RoleType[] = [
    'organization_owner',
    'organization_admin',
    'game_master',
    'game_staff',
    'game_player'
  ];

  const requiresOrganization = organizationRoles.includes(role);

  if (requiresOrganization && !organizationId) {
    return {
      isValid: false,
      errors: [{
        type: 'validation',
        step: 'role',
        field: 'organizationId',
        message: 'Organization selection is required for this role',
        code: 'ORGANIZATION_REQUIRED'
      }]
    };
  }

  return { isValid: true, errors: [] };
};

/**
 * Validates step progression logic
 */
export const validateStepProgression = (
  targetStep: SelectionStep,
  currentState: HierarchicalSelectionState
): ValidationResult => {
  if (targetStep === 'role' && !currentState.selectedCategory) {
    return {
      isValid: false,
      errors: [{
        type: 'validation',
        step: 'category',
        field: 'selectedCategory',
        message: 'Please select a category before choosing a role',
        code: 'CATEGORY_REQUIRED_FOR_ROLE'
      }]
    };
  }

  return { isValid: true, errors: [] };
};

/**
 * Validates complete form state for submission
 */
export const validateFormCompletion = (
  state: HierarchicalSelectionState
): ValidationResult => {
  const errors: SelectionError[] = [];

  // Check category selection
  if (!state.selectedCategory) {
    errors.push({
      type: 'validation',
      step: 'category',
      field: 'selectedCategory',
      message: 'Please select a role category',
      code: 'CATEGORY_REQUIRED'
    });
  }

  // Check role selection
  if (!state.selectedRole) {
    errors.push({
      type: 'validation',
      step: 'role',
      field: 'selectedRole',
      message: 'Please select a specific role',
      code: 'ROLE_REQUIRED'
    });
  }

  // Validate category-role alignment
  if (state.selectedCategory && state.selectedRole) {
    const alignmentResult = validateRoleCategoryAlignment(
      state.selectedCategory, 
      state.selectedRole
    );
    errors.push(...alignmentResult.errors);
  }

  // Validate organization requirement
  if (state.selectedRole) {
    const orgResult = validateOrganizationRequirement(
      state.selectedRole,
      state.selectedOrganization
    );
    errors.push(...orgResult.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============================================================================
// Real-time Validation Functions
// ============================================================================

/**
 * Validates category selection in real-time
 */
export const validateCategorySelection = (
  category: RoleCategory | null
): ValidationResult => {
  if (!category) {
    return {
      isValid: false,
      errors: [{
        type: 'validation',
        step: 'category',
        field: 'selectedCategory',
        message: 'Please select a role category',
        code: 'CATEGORY_REQUIRED'
      }]
    };
  }

  return { isValid: true, errors: [] };
};

/**
 * Validates role selection in real-time
 */
export const validateRoleSelection = (
  role: RoleType | null,
  category: RoleCategory
): ValidationResult => {
  if (!role) {
    return {
      isValid: false,
      errors: [{
        type: 'validation',
        step: 'role',
        field: 'selectedRole',
        message: 'Please select a specific role',
        code: 'ROLE_REQUIRED'
      }]
    };
  }

  return validateRoleCategoryAlignment(category, role);
};

/**
 * Validates organization selection in real-time
 */
export const validateOrganizationSelection = (
  organizationId: string | null,
  role: RoleType
): ValidationResult => {
  return validateOrganizationRequirement(role, organizationId);
};

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Helper function to determine if a role requires organization
 */
export const doesRoleRequireOrganization = (role: RoleType): boolean => {
  const organizationRoles: RoleType[] = [
    'organization_owner',
    'organization_admin',
    'game_master',
    'game_staff',
    'game_player'
  ];
  
  return organizationRoles.includes(role);
};

/**
 * Helper function to determine if a role is a system role
 */
export const isSystemRole = (role: RoleType): boolean => {
  return role === 'system_admin';
};

/**
 * Helper function to get category for a role
 */
export const getRoleCategory = (role: RoleType): RoleCategory => {
  return isSystemRole(role) ? 'system' : 'organization';
};

/**
 * Helper function to format validation errors for display
 */
export const formatValidationError = (error: SelectionError): string => {
  switch (error.code) {
    case 'CATEGORY_REQUIRED':
      return 'Please select whether you want to create a System or Organization role.';
    case 'ROLE_REQUIRED':
      return 'Please select a specific role from the available options.';
    case 'ORGANIZATION_REQUIRED':
      return 'This role requires an organization. Please select an organization.';
    case 'CATEGORY_ROLE_MISMATCH':
      return 'The selected role does not match the chosen category. Please verify your selection.';
    case 'CATEGORY_REQUIRED_FOR_ROLE':
      return 'Please select a category first before choosing a specific role.';
    default:
      return error.message;
  }
};

// ============================================================================
// Validation Rule Configuration
// ============================================================================

/**
 * Complete validation rule set for hierarchical selection
 */
export const hierarchicalValidationRules: StepValidationRules & CrossStepValidationRules = {
  // Step-specific rules
  category: {
    required: true,
    validate: validateCategorySelection
  },
  role: {
    required: true,
    validate: validateRoleSelection
  },
  organization: {
    required: false, // Conditional based on role
    validate: validateOrganizationSelection
  },
  
  // Cross-step rules
  categoryRoleAlignment: validateRoleCategoryAlignment,
  organizationRequirement: validateOrganizationRequirement,
  stepProgression: validateStepProgression
};