/**
 * Form Type Definitions
 * 
 * Centralized type definitions for form components and their props.
 * Provides type safety and consistency across form implementations.
 */

import { RoleType, RoleCategory, SelectionStep } from './hierarchical-roles';

/**
 * Core form data structure for user creation
 */
export interface CreateUserFormData {
  name: string;
  email: string;
  roleData: {
    selectedCategory: RoleCategory | null;
    selectedRole: RoleType | null;
    selectedOrganization: string | null;
    currentStep: SelectionStep;
  };
}

/**
 * Initial values for the create user form
 */
export interface CreateUserFormInitialValues {
  name?: string;
  email?: string;
  roleData?: {
    selectedCategory?: RoleCategory | null;
    selectedRole?: RoleType | null;
    selectedOrganization?: string | null;
    currentStep?: SelectionStep;
  };
}

/**
 * Props interface for CreateUserForm component
 */
export interface CreateUserFormProps {
  /** Callback fired when form is successfully submitted */
  onSubmit: (data: CreateUserFormData) => void;
  
  /** Optional callback fired when cancel button is clicked */
  onCancel?: () => void;
  
  /** Whether the form is in loading state */
  loading?: boolean;
  
  /** Whether the form is disabled */
  disabled?: boolean;
  
  /** Form-level error message to display */
  error?: string | null;
  
  /** Initial values to populate the form */
  initialValues?: CreateUserFormInitialValues;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Test ID for component testing */
  'data-testid'?: string;
}

/**
 * Form validation error structure
 */
export interface FormValidationErrors {
  name?: string;
  email?: string;
  roleData?: string;
  [key: string]: string | undefined;
}

/**
 * Form state structure for TanStack Form integration
 */
export interface CreateUserFormState {
  values: CreateUserFormData;
  errors: FormValidationErrors;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValidating: boolean;
  canSubmit: boolean;
}