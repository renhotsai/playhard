/**
 * Component Interface Contract: Hierarchical Role Selection
 * 
 * This file defines the TypeScript interfaces and contracts for the hierarchical
 * role selection component system. These interfaces ensure type safety and
 * consistent API design across all components.
 */

// ============================================================================
// Core Type Definitions
// ============================================================================

export type SelectionStep = 'category' | 'role';
export type RoleCategory = 'system' | 'organization';

export type RoleType = 
  | 'system_admin'                    // System roles
  | 'organization_owner'              // Organization roles
  | 'organization_admin'
  | 'game_master'
  | 'game_staff'
  | 'game_player';

export type RoleSection = 'system' | 'organization';

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
 */
export interface HierarchicalRoleSelectionProps {
  // Integration with TanStack Form
  value?: RoleType;
  onRoleChange: (data: RoleSelectionData) => void;
  
  // Form state integration
  selectedOrganization?: string;
  onOrganizationChange: (organizationId: string | null) => void;
  
  // Error handling
  error?: string;
  
  // Loading states
  isSubmitting?: boolean;
  
  // Configuration
  className?: string;
  disabled?: boolean;
  
  // Feature flags
  enableStepIndicator?: boolean;
  allowCategoryChange?: boolean;
}

/**
 * Category selection step component interface
 */
export interface CategorySelectionProps {
  selectedCategory: RoleCategory | null;
  onCategorySelect: (category: RoleCategory) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Role selection step component interface
 */
export interface RoleSelectionProps {
  category: RoleCategory;
  selectedRole: RoleType | null;
  onRoleSelect: (role: RoleType) => void;
  selectedOrganization?: string;
  onOrganizationChange: (organizationId: string | null) => void;
  onBack: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Step indicator component interface
 */
export interface StepIndicatorProps {
  currentStep: SelectionStep;
  completedSteps: SelectionStep[];
  onStepClick?: (step: SelectionStep) => void;
  className?: string;
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
// Validation Interfaces
// ============================================================================

/**
 * Validation rules for each step
 */
export interface ValidationRules {
  categorySelection: (category: RoleCategory | null) => boolean;
  roleSelection: (role: RoleType | null, category: RoleCategory) => boolean;
  organizationSelection: (org: string | null, requiresOrg: boolean) => boolean;
  formCompletion: (state: HierarchicalSelectionState) => boolean;
}

/**
 * Validation result structure
 */
export interface ValidationResult {
  isValid: boolean;
  errors: SelectionError[];
  warnings?: string[];
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
// Configuration Interfaces
// ============================================================================

/**
 * Feature configuration for hierarchical selection
 */
export interface FeatureConfiguration {
  enableHierarchicalSelection: boolean;
  fallbackToLegacyUI: boolean;
  allowUserToggle: boolean;
  enableStepIndicator: boolean;
  enableKeyboardNavigation: boolean;
  maxOrganizationsToLoad: number;
}

/**
 * Theme and styling configuration
 */
export interface StyleConfiguration {
  showCategoryIcons: boolean;
  showRoleBadges: boolean;
  compactMode: boolean;
  animateTransitions: boolean;
}

// ============================================================================
// Integration Interfaces
// ============================================================================

/**
 * Integration with TanStack Form
 */
export interface FormIntegration {
  fieldName: string;
  validation: any; // Zod schema
  transform: (data: RoleSelectionData) => any;
}

/**
 * Integration with existing role systems
 */
export interface LegacyRoleIntegration {
  legacyRoleType?: 'systemRole' | 'organizationRole';
  legacyRole?: string;
  migrateLegacyData: (legacy: any) => HierarchicalSelectionState;
  convertToLegacyFormat: (modern: HierarchicalSelectionState) => any;
}

// ============================================================================
// Accessibility Interfaces
// ============================================================================

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  announceStepChanges: boolean;
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
}

/**
 * ARIA attributes for components
 */
export interface AriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-current'?: 'step' | 'page' | 'location' | 'date' | 'time' | 'true' | 'false';
  role?: string;
}