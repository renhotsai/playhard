/**
 * Hierarchical Role Selection Validation Schemas
 * 
 * Provides validation rules and schemas for the hierarchical role selection feature.
 * Ensures data integrity and clear validation feedback at each step.
 * 
 * Feature: Step-by-step role selection validation
 * Date: September 17, 2025
 */

import { z } from 'zod';
import type { 
  RoleType, 
  RoleCategory, 
  SelectionStep,
  HierarchicalSelectionState,
  SelectionError,
  HierarchicalValidationResult
} from '@/types/hierarchical-roles';

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
  'super_admin',
  'platform_manager',
  'support_agent',
  'developer',
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
 * Form submission validation schema for hierarchical selection
 */
export const hierarchicalFormSubmissionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  roleType: roleTypeSchema,
  selectedSection: z.enum(['system', 'organization']),
  selectedCategory: roleCategorySchema,
  currentStep: selectionStepSchema,
  organizationId: organizationIdSchema.optional()
}).refine((data) => {
  // Organization is required for organization roles
  if (data.selectedCategory === 'organization') {
    return data.organizationId !== undefined && data.organizationId.length > 0;
  }
  return true;
}, {
  message: 'Organization is required for organization roles',
  path: ['organizationId']
});

// ============================================================================
// Step-Specific Validation Functions
// ============================================================================

/**
 * Validates category selection
 */
export const validateCategorySelection = (
  category: RoleCategory | null
): HierarchicalValidationResult => {
  if (!category) {
    return {
      isValid: false,
      errors: {
        selectedCategory: 'Please select a role category'
      },
      step: 'category'
    };
  }

  return {
    isValid: true,
    errors: {},
    step: 'category'
  };
};

/**
 * Validates role selection based on category
 */
export const validateRoleSelection = (
  role: RoleType | null,
  category: RoleCategory
): HierarchicalValidationResult => {
  if (!role) {
    return {
      isValid: false,
      errors: {
        selectedRole: 'Please select a specific role'
      },
      step: 'role'
    };
  }

  // Validate role-category alignment
  const alignmentResult = validateRoleCategoryAlignment(category, role);
  if (!alignmentResult.isValid) {
    return {
      isValid: false,
      errors: {
        selectedRole: 'Selected role does not match the chosen category'
      },
      step: 'role'
    };
  }

  return {
    isValid: true,
    errors: {},
    step: 'role'
  };
};

/**
 * Validates organization selection requirement
 */
export const validateOrganizationSelection = (
  organizationId: string | null,
  role: RoleType
): HierarchicalValidationResult => {
  const requiresOrg = doesRoleRequireOrganization(role);

  if (requiresOrg && !organizationId) {
    return {
      isValid: false,
      errors: {
        organizationId: 'Organization selection is required for this role'
      },
      step: 'role'
    };
  }

  return {
    isValid: true,
    errors: {},
    step: 'role'
  };
};

// ============================================================================
// Cross-Step Validation Functions
// ============================================================================

/**
 * Validates if a role belongs to the specified category
 */
export const validateRoleCategoryAlignment = (
  category: RoleCategory, 
  role: RoleType
): { isValid: boolean; error?: string } => {
  const systemRoles: RoleType[] = ['super_admin', 'platform_manager', 'support_agent', 'developer'];
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
      error: 'Selected role does not belong to System category'
    };
  }

  if (category === 'organization' && !isOrganizationRole) {
    return {
      isValid: false,
      error: 'Selected role does not belong to Organization category'
    };
  }

  return { isValid: true };
};

/**
 * Validates step progression logic
 */
export const validateStepProgression = (
  targetStep: SelectionStep,
  currentState: HierarchicalSelectionState
): HierarchicalValidationResult => {
  if (targetStep === 'role' && !currentState.selectedCategory) {
    return {
      isValid: false,
      errors: {
        selectedCategory: 'Please select a category before choosing a role'
      },
      step: 'category'
    };
  }

  return {
    isValid: true,
    errors: {},
    step: targetStep
  };
};

/**
 * Validates complete form state for submission
 */
export const validateFormCompletion = (
  state: HierarchicalSelectionState
): HierarchicalValidationResult => {
  const errors: Record<string, string> = {};

  // Check category selection
  if (!state.selectedCategory) {
    errors.selectedCategory = 'Please select a role category';
  }

  // Check role selection
  if (!state.selectedRole) {
    errors.selectedRole = 'Please select a specific role';
  }

  // Validate category-role alignment
  if (state.selectedCategory && state.selectedRole) {
    const alignmentResult = validateRoleCategoryAlignment(
      state.selectedCategory, 
      state.selectedRole
    );
    if (!alignmentResult.isValid) {
      errors.selectedRole = alignmentResult.error || 'Role does not match category';
    }
  }

  // Validate organization requirement
  if (state.selectedRole) {
    const orgResult = validateOrganizationSelection(
      state.selectedOrganization,
      state.selectedRole
    );
    if (!orgResult.isValid) {
      Object.assign(errors, orgResult.errors);
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    step: Object.keys(errors).length === 0 ? 'role' : 'category'
  };
};

// ============================================================================
// Utility Functions
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
  const systemRoles: RoleType[] = ['super_admin', 'platform_manager', 'support_agent', 'developer'];
  return systemRoles.includes(role);
};

/**
 * Helper function to get category for a role
 */
export const getRoleCategory = (role: RoleType): RoleCategory => {
  return isSystemRole(role) ? 'system' : 'organization';
};

/**
 * Format validation errors for display
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
// Validation Rules Configuration
// ============================================================================

/**
 * Complete validation rule set for hierarchical selection
 */
export const hierarchicalValidationRules = {
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
  stepProgression: validateStepProgression,
  formCompletion: validateFormCompletion
};

// ============================================================================
// Real-time Validation Helpers
// ============================================================================

/**
 * Debounced validation for real-time feedback
 */
export const createDebouncedValidator = (
  validator: (value: any) => HierarchicalValidationResult,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (value: any, callback: (result: HierarchicalValidationResult) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validator(value);
      callback(result);
    }, delay);
  };
};

/**
 * Batch validation for multiple fields
 */
export const validateHierarchicalForm = (
  data: Partial<HierarchicalSelectionState>
): HierarchicalValidationResult => {
  const errors: Record<string, string> = {};
  let currentStep: SelectionStep = 'category';

  // Validate category if provided
  if (data.selectedCategory !== undefined) {
    const categoryResult = validateCategorySelection(data.selectedCategory);
    if (!categoryResult.isValid) {
      Object.assign(errors, categoryResult.errors);
    } else {
      currentStep = 'role';
    }
  }

  // Validate role if category is valid and role is provided
  if (data.selectedCategory && data.selectedRole !== undefined) {
    const roleResult = validateRoleSelection(data.selectedRole, data.selectedCategory);
    if (!roleResult.isValid) {
      Object.assign(errors, roleResult.errors);
    }
  }

  // Validate organization if role requires it
  if (data.selectedRole) {
    const orgResult = validateOrganizationSelection(
      data.selectedOrganization || null,
      data.selectedRole
    );
    if (!orgResult.isValid) {
      Object.assign(errors, orgResult.errors);
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    step: Object.keys(errors).length > 0 ? currentStep : 'role'
  };
};