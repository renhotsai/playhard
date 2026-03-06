/**
 * Hierarchical Role Selection Type Definitions
 * 
 * Defines TypeScript interfaces for the hierarchical role selection enhancement.
 * These types enable step-by-step role selection with progressive disclosure UX.
 * 
 * Feature: Step-by-step role selection (Category → Role)
 * Date: September 17, 2025
 */

import React from 'react';
import { RoleType, RoleSection } from './role-sections';

// ============================================================================
// Core Type Definitions
// ============================================================================

export type SelectionStep = 'category' | 'role';
export type RoleCategory = 'system' | 'organization';

// Re-export from role-sections for convenience
export type { RoleType, RoleSection } from './role-sections';

// ============================================================================
// State Management Interfaces
// ============================================================================

/**
 * Core state structure for hierarchical role selection
 */
export interface HierarchicalSelectionState {
  // Navigation state
  currentStep: SelectionStep;
  
  // Selection state
  selectedCategory: RoleCategory | null;
  selectedRole: RoleType | null;
  selectedOrganization: string | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Validation state
  canProceedToRole: boolean;
  canSubmitForm: boolean;
}

/**
 * Data structure passed to parent component on role selection changes
 */
export interface RoleSelectionData {
  roleType: RoleType | null;
  category: RoleCategory;
  requiresOrganization: boolean;
  step: SelectionStep;
}

/**
 * State transition definition for step navigation
 */
export interface StateTransition {
  from: SelectionStep;
  to: SelectionStep;
  trigger: 'categorySelected' | 'backToCategory' | 'roleSelected';
  validation: (state: HierarchicalSelectionState) => boolean;
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

/**
 * Main hierarchical role selection component interface
 * Optimized for TanStack Form integration
 */
export interface HierarchicalRoleSelectionProps {
  // TanStack Form field integration
  value?: {
    selectedCategory: RoleCategory | null;
    selectedRole: RoleType | null;
    selectedOrganization: string | null;
    currentStep: SelectionStep;
  };
  
  // Form change handlers
  onChange?: (data: {
    selectedCategory: RoleCategory | null;
    selectedRole: RoleType | null;
    selectedOrganization: string | null;
    currentStep: SelectionStep;
    searchQuery?: string;
  }) => void;
  
  // Validation integration
  onValidationChange?: (validation: HierarchicalValidationResult) => void;
  
  // Form state
  error?: string | null;
  disabled?: boolean;
  loading?: boolean;
  
  // UI configuration
  showSearch?: boolean;
  showProgress?: boolean;
  className?: string;
  
  // Testing
  'data-testid'?: string;
}

/**
 * Category selection step component interface
 */
export interface CategorySelectionProps {
  categories: CategoryOption[];
  selectedCategory?: RoleCategory | null;
  onSelect: (category: RoleCategory) => void;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * Role selection step component interface
 */
export interface RoleSelectionStepProps {
  /** List of roles to display */
  roles: RoleOption[];
  /** Category of roles being displayed */
  category: RoleCategory;
  /** Currently selected role */
  selectedRole?: RoleType | null;
  /** Callback when role is selected */
  onSelect: (role: RoleType) => void;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Whether component is loading */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Search query value */
  searchQuery?: string;
  /** Callback when search changes */
  onSearchChange?: (query: string) => void;
  /** Whether to show search input */
  showSearch?: boolean;
  /** Custom className */
  className?: string;
  /** Test ID */
  'data-testid'?: string;
}

/**
 * Step indicator component interface
 */
export interface StepIndicatorProps {
  currentStep: SelectionStep;
  completedSteps: SelectionStep[];
  selectedCategory?: RoleCategory | null;
  progress?: number;
  onStepClick?: (step: SelectionStep) => void;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

// ============================================================================
// Data Structure Interfaces
// ============================================================================

/**
 * Category option definition
 */
export interface CategoryOption {
  id: RoleCategory;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'default' | 'destructive' | 'secondary';
  disabled?: boolean;
}

/**
 * Role option definition for specific categories
 */
export interface RoleOption {
  id: RoleType;
  title: string;
  description: string;
  category: RoleCategory;
  requiresOrganization: boolean;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline';
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Organization option for role selection
 */
export interface OrganizationOption {
  id: string;
  name: string;
  slug: string;
  description?: string;
  memberCount?: number;
  disabled?: boolean;
}

// ============================================================================
// Error Handling Interfaces
// ============================================================================

/**
 * Selection-specific error structure
 */
export interface SelectionError {
  type: 'validation' | 'network' | 'permission';
  step: SelectionStep;
  field?: string;
  message: string;
  code?: string;
}

/**
 * Error state management interface
 */
export interface ErrorStateManagement {
  currentError: SelectionError | null;
  errorHistory: SelectionError[];
  clearError: () => void;
  setError: (error: SelectionError) => void;
}

// ============================================================================
// Loading State Interfaces
// ============================================================================

/**
 * Loading states for different aspects of the component
 */
export interface LoadingStates {
  categories: boolean;      // Loading category options
  roles: boolean;          // Loading role options
  organizations: boolean;   // Loading organization list
  submission: boolean;     // Form submission in progress
}

// ============================================================================
// Event Handler Interfaces
// ============================================================================

/**
 * Event handlers for role selection flow
 */
export interface SelectionEventHandlers {
  onCategorySelect: (category: RoleCategory) => void;
  onRoleSelect: (role: RoleType) => void;
  onOrganizationSelect: (organizationId: string) => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onReset: () => void;
}

// ============================================================================
// Hook Return Interface
// ============================================================================

/**
 * Return type for useHierarchicalSelection hook
 */
export interface UseHierarchicalSelectionReturn {
  // State
  state: HierarchicalSelectionState;
  
  // Event handlers
  handlers: SelectionEventHandlers;
  
  // Computed state
  availableRoles: RoleOption[];
  categoryOptions: CategoryOption[];
  
  // Validation
  isValid: boolean;
  validationErrors: SelectionError[];
  
  // Navigation
  canGoBack: boolean;
  canProceed: boolean;
  
  // Actions
  reset: () => void;
  goToStep: (step: SelectionStep) => void;
}

// ============================================================================
// Category Card Interfaces
// ============================================================================

/**
 * Category card component props
 */
export interface CategoryCardProps {
  option: CategoryOption;
  isSelected: boolean;
  onClick: (category: RoleCategory) => void;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// Accessibility Interfaces
// ============================================================================

/**
 * ARIA attributes for hierarchical selection components
 */
export interface HierarchicalAriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-current'?: 'step' | 'page' | 'location' | 'date' | 'time' | 'true' | 'false';
  'aria-live'?: 'polite' | 'assertive' | 'off';
  role?: string;
}

// ============================================================================
// Form Integration Types
// ============================================================================

/**
 * Form data structure for hierarchical selection
 */
export interface HierarchicalFormData {
  name: string;
  email: string;
  roleType: RoleType;
  selectedSection: RoleSection;
  organizationId?: string;
  
  // Hierarchical specific fields
  selectedCategory: RoleCategory;
  currentStep: SelectionStep;
}

/**
 * Validation result for hierarchical form
 */
export interface HierarchicalValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  step?: SelectionStep; // Optional for backward compatibility
}

// ============================================================================
// Utility Type Guards
// ============================================================================

/**
 * Type guard to check if role is system role
 */
export const isSystemRole = (role: RoleType): role is 'super_admin' | 'platform_manager' | 'support_agent' | 'developer' => {
  return ['super_admin', 'platform_manager', 'support_agent', 'developer'].includes(role as any);
};

/**
 * Type guard to check if role requires organization
 */
export const requiresOrganization = (role: RoleType): boolean => {
  return !isSystemRole(role);
};

/**
 * Get category for a given role type
 */
export const getRoleCategory = (role: RoleType): RoleCategory => {
  return isSystemRole(role) ? 'system' : 'organization';
};