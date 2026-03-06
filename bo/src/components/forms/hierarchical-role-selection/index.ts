/**
 * Hierarchical Role Selection Components
 * 
 * A complete set of components for implementing step-by-step role selection
 * with progressive disclosure UX pattern.
 */

// Main orchestrator component
export { HierarchicalRoleSelection } from './hierarchical-role-selection'

// Individual step components
export { CategorySelection } from './category-selection'
export { RoleSelectionStep } from './role-selection-step'
export { StepIndicator } from './step-indicator'
export { OrganizationSelection } from './organization-selection'

// Hook for state management
export { useHierarchicalSelection } from '../../../hooks/use-hierarchical-selection'

// Types and interfaces
export type {
  HierarchicalRoleSelectionProps,
  CategorySelectionProps,
  RoleSelectionStepProps,
  StepIndicatorProps,
  HierarchicalSelectionState,
  RoleSelectionData,
  CategoryOption,
  RoleOption,
  RoleCategory,
  RoleType,
  SelectionStep,
  HierarchicalValidationResult,
  SelectionError,
  StateTransition
} from '../../../types/hierarchical-roles'

// Utility functions
export {
  getCategoryOptions,
  getRolesByCategory,
  getAllRoleOptions,
  getRoleOption,
  filterRolesByQuery,
  getStateTransitions,
  canTransitionToStep,
  getNextStep,
  getPreviousStep,
  getStepProgress,
  createInitialState,
  updateStateForCategorySelection,
  updateStateForRoleSelection,
  updateStateForOrganizationSelection,
  resetState,
  isStateValidForSubmission,
  getStepTitle,
  getStepDescription,
  getRoleDisplayName,
  getCategoryDisplayName,
  generateBreadcrumbs,
  getRoleSpecificSuccessMessage,
  validateStepCompletion
} from '../../../lib/role-selection-utils'

// Validation functions
export {
  validateCategorySelection,
  validateRoleSelection,
  validateOrganizationSelection,
  validateRoleCategoryAlignment,
  validateStepProgression,
  validateFormCompletion,
  doesRoleRequireOrganization,
  isSystemRole,
  getRoleCategory,
  formatValidationError,
  hierarchicalValidationRules,
  createDebouncedValidator,
  validateHierarchicalForm,
  roleCategorySchema,
  roleTypeSchema,
  selectionStepSchema,
  organizationIdSchema,
  hierarchicalSelectionSchema,
  hierarchicalFormSubmissionSchema
} from '../../../lib/hierarchical-validation'