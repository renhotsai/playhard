/**
 * Centralized Form Validation Utilities
 * 
 * Provides reusable validation functions for forms across the application.
 * Eliminates code duplication and ensures consistent validation logic.
 * 
 * Usage:
 * import { validators } from '@/lib/form-validators';
 * 
 * const nameError = validators.name(value);
 * const emailError = validators.email(value);
 */

// Common validation utilities
export const validators = {
  // Required field validation
  required: (value: string, fieldName = "This field") => {
    if (!value || value.trim().length === 0) {
      return `${fieldName} is required`;
    }
    return undefined;
  },

  // Name validation
  name: (value: string) => {
    if (!value || value.trim().length === 0) {
      return "Name is required";
    }
    if (value.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    if (value.trim().length > 100) {
      return "Name cannot exceed 100 characters";
    }
    return undefined;
  },

  // Email validation
  email: (value: string) => {
    if (!value || value.trim().length === 0) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return "Please enter a valid email address";
    }
    if (value.trim().length > 255) {
      return "Email cannot exceed 255 characters";
    }
    return undefined;
  },

  // Optional email validation (allows empty)
  optionalEmail: (value: string) => {
    if (!value || value.trim().length === 0) {
      return undefined; // Optional field
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return "Please enter a valid email address";
    }
    if (value.trim().length > 255) {
      return "Email cannot exceed 255 characters";
    }
    return undefined;
  },

  // Phone number validation
  phone: (value: string) => {
    if (!value || value.trim().length === 0) {
      return undefined; // Optional field
    }
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(value.trim())) {
      return "Please enter a valid phone number";
    }
    if (value.trim().length < 7) {
      return "Phone number must be at least 7 digits";
    }
    if (value.trim().length > 20) {
      return "Phone number cannot exceed 20 characters";
    }
    return undefined;
  },

  // Username validation
  username: (value: string) => {
    if (!value || value.trim().length === 0) {
      return "Username is required";
    }
    if (value.trim().length < 3) {
      return "Username must be at least 3 characters";
    }
    if (value.trim().length > 30) {
      return "Username cannot exceed 30 characters";
    }
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(value.trim())) {
      return "Username can only contain letters, numbers, hyphens, and underscores";
    }
    return undefined;
  },

  // Password validation
  password: (value: string) => {
    if (!value || value.length === 0) {
      return "Password is required";
    }
    if (value.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (value.length > 128) {
      return "Password cannot exceed 128 characters";
    }
    if (!/(?=.*[a-z])/.test(value)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(value)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*\d)/.test(value)) {
      return "Password must contain at least one number";
    }
    return undefined;
  },

  // Organization name validation
  organizationName: (value: string) => {
    if (!value || value.trim().length === 0) {
      return "Organization name is required";
    }
    if (value.trim().length < 2) {
      return "Organization name must be at least 2 characters";
    }
    if (value.trim().length > 100) {
      return "Organization name cannot exceed 100 characters";
    }
    return undefined;
  },

  // Store/Address validation
  address: (value: string) => {
    if (!value || value.trim().length === 0) {
      return "Address is required";
    }
    if (value.trim().length < 5) {
      return "Address must be at least 5 characters";
    }
    if (value.trim().length > 500) {
      return "Address cannot exceed 500 characters";
    }
    return undefined;
  },

  // URL validation
  url: (value: string) => {
    if (!value || value.trim().length === 0) {
      return undefined; // Optional field
    }
    try {
      new URL(value.trim());
      return undefined;
    } catch {
      return "Please enter a valid URL";
    }
  },

  // Number validation
  number: (value: string | number, min?: number, max?: number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
      return "Please enter a valid number";
    }
    if (min !== undefined && num < min) {
      return `Number must be at least ${min}`;
    }
    if (max !== undefined && num > max) {
      return `Number cannot exceed ${max}`;
    }
    return undefined;
  },

  // Positive integer validation
  positiveInteger: (value: string | number) => {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(num) || !Number.isInteger(num)) {
      return "Please enter a valid integer";
    }
    if (num <= 0) {
      return "Number must be positive";
    }
    return undefined;
  },

  // Date validation
  date: (value: string | Date) => {
    if (!value) {
      return undefined; // Optional field
    }
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) {
      return "Please enter a valid date";
    }
    return undefined;
  },

  // Future date validation
  futureDate: (value: string | Date) => {
    const dateError = validators.date(value);
    if (dateError) return dateError;
    
    if (!value) return undefined;
    
    const date = typeof value === 'string' ? new Date(value) : value;
    const now = new Date();
    if (date <= now) {
      return "Date must be in the future";
    }
    return undefined;
  },

  // Text length validation
  textLength: (value: string, minLength: number, maxLength: number, fieldName = "This field") => {
    if (!value) {
      return `${fieldName} is required`;
    }
    if (value.length < minLength) {
      return `${fieldName} must be at least ${minLength} characters`;
    }
    if (value.length > maxLength) {
      return `${fieldName} cannot exceed ${maxLength} characters`;
    }
    return undefined;
  },
};

// Async validation utilities (for database checks, etc.)
export const asyncValidators = {
  // Check if email is unique (placeholder - implement with actual API call)
  uniqueEmail: async (email: string): Promise<string | undefined> => {
    if (!email) return undefined;
    
    try {
      // This would be an actual API call in practice
      const response = await fetch(`/api/validation/email?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const result = await response.json();
        return result.isUnique ? undefined : "Email address is already in use";
      }
      return undefined; // Don't show error if check fails
    } catch {
      return undefined; // Don't show error if check fails
    }
  },

  // Check if username is unique (placeholder - implement with actual API call)
  uniqueUsername: async (username: string): Promise<string | undefined> => {
    if (!username) return undefined;
    
    try {
      const response = await fetch(`/api/validation/username?username=${encodeURIComponent(username)}`);
      if (response.ok) {
        const result = await response.json();
        return result.isUnique ? undefined : "Username is already taken";
      }
      return undefined; // Don't show error if check fails
    } catch {
      return undefined; // Don't show error if check fails
    }
  },
};

// Validation helper functions
export const validationHelpers = {
  // Combine multiple validation results
  combineErrors: (...errors: (string | undefined)[]): string | undefined => {
    const validErrors = errors.filter(Boolean);
    return validErrors.length > 0 ? validErrors[0] : undefined;
  },

  // Validate multiple fields at once
  validateFields: (fields: Record<string, { value: unknown; validators: ((value: unknown) => string | undefined)[] }>) => {
    const errors: Record<string, string | undefined> = {};
    let hasErrors = false;

    Object.entries(fields).forEach(([fieldName, { value, validators }]) => {
      const error = validationHelpers.combineErrors(
        ...validators.map(validator => validator(value))
      );
      errors[fieldName] = error;
      if (error) hasErrors = true;
    });

    return { errors, hasErrors };
  },

  // Debounced validation (useful for real-time validation)
  debounce: <T extends (...args: unknown[]) => unknown>(func: T, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      return new Promise<ReturnType<T>>((resolve) => {
        timeoutId = setTimeout(() => {
          resolve(func(...args) as ReturnType<T>);
        }, delay);
      });
    };
  },
};

// User management specific validators
export const userManagementValidators = {
  // System role validation
  systemRole: (value: string) => {
    if (!value) return "System role is required";
    if (!['super_admin', 'admin', 'owner', 'member'].includes(value)) {
      return "Invalid system role";
    }
    return undefined;
  },

  // Organization role validation with murder mystery roles
  organizationRole: (value: string, isRequired = false) => {
    if (!value) {
      return isRequired ? "Organization role is required" : undefined;
    }
    // Include murder mystery game roles
    if (!['owner', 'admin', 'gm', 'staff', 'player'].includes(value)) {
      return "Invalid organization role";
    }
    return undefined;
  },

  // Organization selection validation
  organizationSelection: (value: string, isRequired = false) => {
    if (!value) {
      return isRequired ? "Please select an organization" : undefined;
    }
    return undefined;
  },

  // Role creation permission validation
  roleCreationPermission: (
    creatorSystemRole: string,
    creatorOrgRole: string | undefined,
    targetRole: string,
    targetOrgRole?: string
  ) => {
    // Super admin can create anyone
    if (creatorSystemRole === 'super_admin') return undefined;
    
    // Admin can create everyone except super_admin
    if (creatorSystemRole === 'admin') {
      if (targetRole === 'super_admin') {
        return "Only super admins can create super administrators";
      }
      return undefined;
    }
    
    // Owner can create admin and member, but not super_admin or admin system roles
    if (creatorSystemRole === 'owner') {
      if (['super_admin', 'admin'].includes(targetRole)) {
        return "You don't have permission to create system administrators";
      }
      return undefined;
    }
    
    // Member cannot create system admin roles
    if (['super_admin', 'admin', 'owner'].includes(targetRole)) {
      return "You don't have permission to create system administrators";
    }
    
    // Organization role creation rules
    if (targetOrgRole) {
      if (creatorOrgRole === 'owner') {
        if (!['admin', 'member'].includes(targetOrgRole)) {
          return "Organization owners can only create admins and members";
        }
      } else if (creatorOrgRole === 'admin') {
        if (targetOrgRole !== 'member') {
          return "Organization admins can only create members";
        }
      } else {
        return "You don't have permission to create users in this organization";
      }
    }
    
    return undefined;
  }
};

// Common validation patterns for forms
export const formPatterns = {
  // User creation form
  userForm: {
    name: [validators.name],
    email: [validators.email],
    username: [validators.username],
    phone: [validators.phone],
  },

  // Admin user creation form
  adminUserCreationForm: {
    name: [validators.name],
    email: [validators.email],
    systemRole: [userManagementValidators.systemRole],
    organizationRole: [(value: string, allValues: Record<string, unknown>) => 
      userManagementValidators.organizationRole(value, allValues?.systemRole === 'member')],
    organizationSelection: [(value: string, allValues: Record<string, unknown>) => 
      userManagementValidators.organizationSelection(value, allValues?.systemRole === 'member')],
  },

  // Organization member invitation form
  organizationMemberInvitationForm: {
    name: [validators.name],
    email: [validators.email],
    role: [(value: string) => userManagementValidators.organizationRole(value, true)],
  },

  // Organization form
  organizationForm: {
    name: [validators.organizationName],
    email: [validators.optionalEmail],
    phone: [validators.phone],
    address: [validators.address],
  },

  // Store form
  storeForm: {
    name: [validators.name],
    address: [validators.address],
    phone: [validators.phone],
    email: [validators.optionalEmail],
  },

  // Login form
  loginForm: {
    email: [validators.email],
    password: [(value: string) => validators.required(value, "Password")],
  },

  // Password change form
  passwordForm: {
    currentPassword: [(value: string) => validators.required(value, "Current password")],
    newPassword: [validators.password],
    confirmPassword: (newPassword: string) => [
      (value: string) => validators.required(value, "Confirm password"),
      (value: string) => value !== newPassword ? "Passwords do not match" : undefined,
    ],
  },
};

// Enhanced murder mystery role validation (using role constants)
import { 
  USER_TYPE_VALUES, 
  ORGANIZATION_ROLE_VALUES, 
  isValidRole,
  isBusinessRole,
  isGameRole,
  getRoleDisplayName 
} from './roles';

export const murderMysteryValidators = {
  // User type validation (system_admin or organization_user)
  userType: (value: string) => {
    if (!value) return "User type is required";
    if (!USER_TYPE_VALUES.includes(value as typeof USER_TYPE_VALUES[number])) {
      return "Invalid user type";
    }
    return undefined;
  },

  // Enhanced organization role validation with murder mystery roles
  organizationRoleEnhanced: (value: string, isRequired = false) => {
    if (!value) {
      return isRequired ? "Organization role is required" : undefined;
    }
    if (!isValidRole(value) || !ORGANIZATION_ROLE_VALUES.includes(value as typeof ORGANIZATION_ROLE_VALUES[number])) {
      return "Invalid organization role";
    }
    return undefined;
  },

  // Organization ID validation (UUID format)
  organizationId: (value: string, isRequired = false) => {
    if (!value) {
      return isRequired ? "Organization is required" : undefined;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      return "Invalid organization ID format";
    }
    return undefined;
  },

  // Role category validation (business vs game roles)
  roleCategory: (role: string) => {
    if (!role) return undefined;
    
    if (isBusinessRole(role)) {
      return undefined; // Business roles are valid
    }
    if (isGameRole(role)) {
      return undefined; // Game roles are valid
    }
    return "Role must be either a business role or game role";
  },

  // Cross-field validation for create user form
  createUserFormValidation: (formData: {
    email: string;
    name: string;
    userType: string;
    organizationId?: string;
    organizationRole?: string;
  }) => {
    const errors: Record<string, string | undefined> = {};

    // Basic field validation
    errors.email = validators.email(formData.email);
    errors.name = validators.name(formData.name);
    errors.userType = murderMysteryValidators.userType(formData.userType);

    // Cross-field validation for organization users
    if (formData.userType === 'organization_user') {
      errors.organizationId = murderMysteryValidators.organizationId(
        formData.organizationId || '', 
        true
      );
      errors.organizationRole = murderMysteryValidators.organizationRoleEnhanced(
        formData.organizationRole || '', 
        true
      );
    }

    // Remove undefined errors
    Object.keys(errors).forEach(key => {
      if (errors[key] === undefined) {
        delete errors[key];
      }
    });

    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  }
};

// Enhanced form patterns with murder mystery roles
export const enhancedFormPatterns = {
  // Admin create user form with murder mystery roles
  adminCreateUserForm: {
    email: [validators.email],
    name: [validators.name],
    userType: [murderMysteryValidators.userType],
    organizationId: [(value: string, allValues: Record<string, unknown>) => 
      murderMysteryValidators.organizationId(value, allValues?.userType === 'organization_user')],
    organizationRole: [(value: string, allValues: Record<string, unknown>) => 
      murderMysteryValidators.organizationRoleEnhanced(value, allValues?.userType === 'organization_user')],
  },

  // Murder mystery role-specific validation
  gameRoleForm: {
    email: [validators.email],
    name: [validators.name],
    organizationId: [(value: string) => murderMysteryValidators.organizationId(value, true)],
    gameRole: [(value: string) => {
      if (!value) return "Game role is required";
      if (!isGameRole(value)) return "Invalid game role";
      return undefined;
    }],
  },

  // Business role-specific validation
  businessRoleForm: {
    email: [validators.email],
    name: [validators.name],
    organizationId: [(value: string) => murderMysteryValidators.organizationId(value, true)],
    businessRole: [(value: string) => {
      if (!value) return "Business role is required";
      if (!isBusinessRole(value)) return "Invalid business role";
      return undefined;
    }],
  },
};

// Role Sections Enhancement Validators (for new two-section role selection)
import { 
  type RoleType,
  isSystemRole,
  isOrganizationRole,
  validateRoleSelection,
  getRoleDefinition
} from '@/types/role-sections';

export const roleSectionsValidators = {
  // Role type validation for two-section selection
  roleType: (value: RoleType | string) => {
    if (!value) return "Role selection is required";
    
    const validation = validateRoleSelection(value as RoleType);
    if (!validation.isValid) {
      return validation.errors[0] || "Invalid role selection";
    }
    
    return undefined;
  },

  // Organization field validation based on role section
  organizationFieldForRole: (organizationId: string, roleType: RoleType | string) => {
    if (!roleType) return undefined; // No validation if no role selected yet
    
    if (isOrganizationRole(roleType as RoleType)) {
      // Organization is required for organization roles
      if (!organizationId) {
        return "Organization is required for organization roles";
      }
      
      // UUID format validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(organizationId)) {
        return "Invalid organization ID format";
      }
    }
    
    return undefined;
  },

  // Cross-field validation for create user form with role sections
  createUserFormValidationSections: (formData: {
    email: string;
    name: string;
    roleType: RoleType | string;
    organizationId?: string;
  }) => {
    const errors: Record<string, string | undefined> = {};

    // Basic field validation
    errors.email = validators.email(formData.email);
    errors.name = validators.name(formData.name);
    errors.roleType = roleSectionsValidators.roleType(formData.roleType);

    // Cross-field validation for role-organization relationship
    if (formData.roleType) {
      errors.organizationId = roleSectionsValidators.organizationFieldForRole(
        formData.organizationId || '', 
        formData.roleType
      );
    }

    // Remove undefined errors
    Object.keys(errors).forEach(key => {
      if (errors[key] === undefined) {
        delete errors[key];
      }
    });

    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  },

  // Role display helper for form summary
  getRoleDisplayInfo: (roleType: RoleType | string) => {
    if (!roleType) return null;
    
    const roleDefinition = getRoleDefinition(roleType as RoleType);
    if (!roleDefinition) return null;
    
    return {
      label: roleDefinition.label,
      description: roleDefinition.description,
      section: roleDefinition.section,
      badge: roleDefinition.badge,
      isSystemRole: isSystemRole(roleType as RoleType),
      isOrganizationRole: isOrganizationRole(roleType as RoleType)
    };
  }
};

// Enhanced form patterns with role sections
export const roleSectionsFormPatterns = {
  // Admin create user form with role sections
  adminCreateUserFormSections: {
    email: [validators.email],
    name: [validators.name],
    roleType: [roleSectionsValidators.roleType],
    organizationId: [(value: string, allValues: Record<string, unknown>) => 
      roleSectionsValidators.organizationFieldForRole(value, allValues?.roleType as RoleType)],
  },

  // Role-specific validation patterns
  systemRoleForm: {
    email: [validators.email],
    name: [validators.name],
    roleType: [(value: string) => {
      const error = roleSectionsValidators.roleType(value);
      if (error) return error;
      if (!isSystemRole(value as RoleType)) return "Must be a system role";
      return undefined;
    }],
  },

  organizationRoleForm: {
    email: [validators.email],
    name: [validators.name],
    roleType: [(value: string) => {
      const error = roleSectionsValidators.roleType(value);
      if (error) return error;
      if (!isOrganizationRole(value as RoleType)) return "Must be an organization role";
      return undefined;
    }],
    organizationId: [(value: string) => murderMysteryValidators.organizationId(value, true)],
  },
};

// TanStack Form specific validation utilities
export const tanstackFormUtils = {
  // Cross-field validator factory for conditional validation
  createConditionalValidator: <T>(
    condition: (formData: T) => boolean,
    validator: (value: unknown) => string | undefined,
    message?: string
  ) => {
    return ({ value, formApi }: { value: unknown; formApi: { getFieldValue: (path: string) => T } }) => {
      const formData = formApi.getFieldValue('') as T; // Get entire form state
      if (condition(formData)) {
        return validator(value) || message;
      }
      return undefined;
    };
  },

  // Async validator with debouncing
  createAsyncValidator: <T>(
    asyncFn: (value: T) => Promise<string | undefined>,
    debounceMs = 500
  ) => {
    const debouncedFn = validationHelpers.debounce(asyncFn, debounceMs);
    return ({ value }: { value: T }) => debouncedFn(value);
  },

  // Enhanced form state validator for create user form
  createUserFormValidator: (formData: {
    email: string;
    name: string;
    userType: string;
    organizationId?: string;
    organizationRole?: string;
  }) => {
    const errors: Record<string, string> = {};
    
    // Basic validation
    const emailError = validators.email(formData.email);
    if (emailError) errors.email = emailError;
    
    const nameError = validators.name(formData.name);
    if (nameError) errors.name = nameError;
    
    const userTypeError = murderMysteryValidators.userType(formData.userType);
    if (userTypeError) errors.userType = userTypeError;
    
    // Conditional validation for organization users
    if (formData.userType === 'organization_user') {
      const orgIdError = murderMysteryValidators.organizationId(formData.organizationId || '', true);
      if (orgIdError) errors.organizationId = orgIdError;
      
      const roleError = murderMysteryValidators.organizationRoleEnhanced(formData.organizationRole || '', true);
      if (roleError) errors.organizationRole = roleError;
    }
    
    return {
      errors,
      isValid: Object.keys(errors).length === 0,
      hasErrors: Object.keys(errors).length > 0
    };
  },

  // Enhanced form state validator for role sections create user form
  createUserFormValidatorSections: (formData: {
    email: string;
    name: string;
    roleType: RoleType | string;
    organizationId?: string;
  }) => {
    const errors: Record<string, string> = {};
    
    // Basic validation
    const emailError = validators.email(formData.email);
    if (emailError) errors.email = emailError;
    
    const nameError = validators.name(formData.name);
    if (nameError) errors.name = nameError;
    
    const roleTypeError = roleSectionsValidators.roleType(formData.roleType);
    if (roleTypeError) errors.roleType = roleTypeError;
    
    // Conditional validation for organization roles
    if (formData.roleType && isOrganizationRole(formData.roleType as RoleType)) {
      const orgIdError = roleSectionsValidators.organizationFieldForRole(
        formData.organizationId || '', 
        formData.roleType
      );
      if (orgIdError) errors.organizationId = orgIdError;
    }
    
    return {
      errors,
      isValid: Object.keys(errors).length === 0,
      hasErrors: Object.keys(errors).length > 0
    };
  }
};