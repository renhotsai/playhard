/**
 * Role Selection Utility Functions
 * 
 * Provides utility functions specific to the hierarchical role selection enhancement.
 * Includes helpers for step navigation, category management, and role filtering.
 * 
 * Feature: Step-by-step role selection utilities
 * Date: September 17, 2025
 */

import { 
  type RoleType, 
  type RoleCategory, 
  type SelectionStep,
  type CategoryOption,
  type RoleOption,
  type HierarchicalSelectionState,
  type StateTransition,
  isSystemRole,
  requiresOrganization,
  getRoleCategory
} from '@/types/hierarchical-roles';
import { type RoleDefinition, getRoleDefinition } from '@/types/role-sections';
import { 
  Shield, 
  Building2, 
  Users, 
  Crown, 
  UserCheck, 
  Headphones, 
  Gamepad2 
} from 'lucide-react';

// ============================================================================
// Category Management
// ============================================================================

/**
 * Get category options for selection
 */
export const getCategoryOptions = (): CategoryOption[] => [
  {
    id: 'system',
    title: 'System Roles',
    description: 'Global platform administration with full system access',
    icon: Shield,
    badge: 'FULL ACCESS',
    badgeVariant: 'destructive'
  },
  {
    id: 'organization',
    title: 'Organization Roles', 
    description: 'Organization-specific roles for managing businesses and games',
    icon: Building2,
    badge: 'ORG SCOPED',
    badgeVariant: 'secondary'
  }
];

/**
 * Get category option by ID
 */
export const getCategoryOption = (categoryId: RoleCategory): CategoryOption | undefined => {
  return getCategoryOptions().find(option => option.id === categoryId);
};

// ============================================================================
// Role Management
// ============================================================================

/**
 * Get role options for a specific category
 */
export const getRolesByCategory = (category: RoleCategory): RoleOption[] => {
  const allRoles = getAllRoleOptions();
  return allRoles.filter(role => role.category === category);
};

/**
 * Get all available role options with metadata
 */
export const getAllRoleOptions = (): RoleOption[] => [
  // System Roles
  {
    id: 'super_admin',
    title: 'Super Administrator',
    description: 'Complete platform control across all organizations and users',
    category: 'system',
    requiresOrganization: false,
    badge: 'SUPER ADMIN',
    badgeVariant: 'destructive',
    icon: Shield
  },
  {
    id: 'platform_manager',
    title: 'Platform Manager',
    description: 'Business operations, analytics, and organization oversight',
    category: 'system',
    requiresOrganization: false,
    badge: 'PLATFORM MGR',
    badgeVariant: 'default',
    icon: Building2
  },
  {
    id: 'support_agent',
    title: 'Support Agent',
    description: 'Customer support, issue resolution, and basic user management',
    category: 'system',
    requiresOrganization: false,
    badge: 'SUPPORT',
    badgeVariant: 'secondary',
    icon: Headphones
  },
  {
    id: 'developer',
    title: 'Developer',
    description: 'System maintenance, API access, and debugging tools',
    category: 'system',
    requiresOrganization: false,
    badge: 'DEVELOPER',
    badgeVariant: 'outline',
    icon: Users
  },
  
  // Organization Roles
  {
    id: 'organization_owner',
    title: 'Organization Owner',
    description: 'Complete ownership and control of the organization',
    category: 'organization',
    requiresOrganization: true,
    badge: 'OWNER',
    badgeVariant: 'default',
    icon: Crown
  },
  {
    id: 'organization_admin',
    title: 'Organization Administrator',
    description: 'Administrative privileges within the organization',
    category: 'organization',
    requiresOrganization: true,
    badge: 'ADMIN',
    badgeVariant: 'secondary',
    icon: UserCheck
  },
  {
    id: 'game_master',
    title: 'Game Master (GM)',
    description: 'Lead murder mystery games and guide player experiences',
    category: 'organization',
    requiresOrganization: true,
    badge: 'GM',
    badgeVariant: 'outline',
    icon: Gamepad2
  },
  {
    id: 'game_staff',
    title: 'Game Staff',
    description: 'Support game operations and provide customer service',
    category: 'organization',
    requiresOrganization: true,
    badge: 'STAFF',
    badgeVariant: 'outline',
    icon: Headphones
  },
  {
    id: 'game_player',
    title: 'Game Player',
    description: 'Participate in murder mystery games and solve puzzles',
    category: 'organization',
    requiresOrganization: true,
    badge: 'PLAYER',
    badgeVariant: 'outline',
    icon: Users
  }
];

/**
 * Get role option by ID
 */
export const getRoleOption = (roleId: RoleType): RoleOption | undefined => {
  return getAllRoleOptions().find(role => role.id === roleId);
};

/**
 * Filter roles by search query
 */
export const filterRolesByQuery = (
  roles: RoleOption[], 
  query: string
): RoleOption[] => {
  if (!query.trim()) return roles;
  
  const lowercaseQuery = query.toLowerCase();
  return roles.filter(role => 
    role.title.toLowerCase().includes(lowercaseQuery) ||
    role.description.toLowerCase().includes(lowercaseQuery)
  );
};

// ============================================================================
// Step Navigation
// ============================================================================

/**
 * Get available state transitions
 */
export const getStateTransitions = (): StateTransition[] => [
  {
    from: 'category',
    to: 'role',
    trigger: 'categorySelected',
    validation: (state) => state.selectedCategory !== null
  },
  {
    from: 'role',
    to: 'category',
    trigger: 'backToCategory',
    validation: () => true
  }
];

/**
 * Check if step transition is valid
 */
export const canTransitionToStep = (
  currentStep: SelectionStep,
  targetStep: SelectionStep,
  state: HierarchicalSelectionState
): boolean => {
  const transitions = getStateTransitions();
  const transition = transitions.find(
    t => t.from === currentStep && t.to === targetStep
  );
  
  return transition ? transition.validation(state) : false;
};

/**
 * Get next step in the flow
 */
export const getNextStep = (currentStep: SelectionStep): SelectionStep | null => {
  switch (currentStep) {
    case 'category':
      return 'role';
    case 'role':
      return null; // Final step
    default:
      return null;
  }
};

/**
 * Get previous step in the flow
 */
export const getPreviousStep = (currentStep: SelectionStep): SelectionStep | null => {
  switch (currentStep) {
    case 'role':
      return 'category';
    case 'category':
      return null; // First step
    default:
      return null;
  }
};

/**
 * Calculate step progress percentage
 */
export const getStepProgress = (currentStep: SelectionStep): number => {
  switch (currentStep) {
    case 'category':
      return 50;
    case 'role':
      return 100;
    default:
      return 0;
  }
};

// ============================================================================
// State Management Helpers
// ============================================================================

/**
 * Create initial hierarchical selection state
 */
export const createInitialState = (): HierarchicalSelectionState => ({
  currentStep: 'category',
  selectedCategory: null, // Start without category selection for step-by-step flow
  selectedRole: null,
  selectedOrganization: null,
  isLoading: false,
  error: null,
  canProceedToRole: false,
  canSubmitForm: false
});

/**
 * Update state for category selection
 */
export const updateStateForCategorySelection = (
  state: HierarchicalSelectionState,
  category: RoleCategory
): HierarchicalSelectionState => ({
  ...state,
  selectedCategory: category,
  selectedRole: null, // Reset role when category changes
  selectedOrganization: null, // Reset organization when category changes
  currentStep: 'role', // Stay on role step, show roles for selected category
  canProceedToRole: true,
  canSubmitForm: false,
  error: null
});

/**
 * Update state for role selection
 */
export const updateStateForRoleSelection = (
  state: HierarchicalSelectionState,
  role: RoleType
): HierarchicalSelectionState => {
  const requiresOrg = requiresOrganization(role);
  
  return {
    ...state,
    selectedRole: role,
    // Clear organization if new role doesn't require it
    selectedOrganization: requiresOrg ? state.selectedOrganization : null,
    canSubmitForm: !requiresOrg || (requiresOrg && state.selectedOrganization !== null),
    error: null
  };
};

/**
 * Update state for organization selection
 */
export const updateStateForOrganizationSelection = (
  state: HierarchicalSelectionState,
  organizationId: string | null
): HierarchicalSelectionState => ({
  ...state,
  selectedOrganization: organizationId,
  canSubmitForm: state.selectedRole !== null && (
    !requiresOrganization(state.selectedRole) || organizationId !== null
  ),
  error: null
});

/**
 * Reset state to initial values
 */
export const resetState = (): HierarchicalSelectionState => createInitialState();

/**
 * Check if state is valid for submission
 */
export const isStateValidForSubmission = (state: HierarchicalSelectionState): boolean => {
  if (!state.selectedCategory || !state.selectedRole) {
    return false;
  }
  
  // Check if role requires organization and organization is selected
  if (requiresOrganization(state.selectedRole) && !state.selectedOrganization) {
    return false;
  }
  
  return true;
};

// ============================================================================
// UI Helpers
// ============================================================================

/**
 * Get step title for display
 */
export const getStepTitle = (step: SelectionStep): string => {
  switch (step) {
    case 'category':
      return 'Choose Role Category';
    case 'role':
      return 'Select Specific Role';
    default:
      return 'Role Selection';
  }
};

/**
 * Get step description for display
 */
export const getStepDescription = (step: SelectionStep, category?: RoleCategory): string => {
  switch (step) {
    case 'category':
      return 'Select whether you want to create a System or Organization role';
    case 'role':
      if (category === 'system') {
        return 'Select a system-wide administrative role';
      } else if (category === 'organization') {
        return 'Select a role specific to an organization';
      }
      return 'Select a specific role for the user';
    default:
      return 'Complete the role selection process';
  }
};

/**
 * Get role type display name
 */
export const getRoleDisplayName = (roleType: RoleType): string => {
  const role = getRoleOption(roleType);
  return role?.title || roleType;
};

/**
 * Get category display name
 */
export const getCategoryDisplayName = (category: RoleCategory): string => {
  const categoryOption = getCategoryOption(category);
  return categoryOption?.title || category;
};

/**
 * Generate breadcrumb items for navigation
 */
export const generateBreadcrumbs = (
  currentStep: SelectionStep,
  selectedCategory?: RoleCategory | null
) => {
  const breadcrumbs = [
    {
      step: 'category' as SelectionStep,
      title: 'Category',
      isActive: currentStep === 'category',
      isCompleted: selectedCategory !== null
    }
  ];
  
  if (selectedCategory) {
    breadcrumbs.push({
      step: 'role' as SelectionStep,
      title: `${getCategoryDisplayName(selectedCategory)} Roles`,
      isActive: currentStep === 'role',
      isCompleted: false
    });
  }
  
  return breadcrumbs;
};

// ============================================================================
// Success Messages
// ============================================================================

/**
 * Get role-specific success message for user creation
 */
export const getRoleSpecificSuccessMessage = (
  roleType: RoleType,
  userName: string,
  organizationName?: string
): string => {
  const role = getRoleOption(roleType);
  if (!role) return `User ${userName} created successfully.`;
  
  const baseMessage = `${userName} has been created as a ${role.title}`;
  
  if (role.requiresOrganization && organizationName) {
    return `${baseMessage} for ${organizationName}. An invitation email has been sent.`;
  }
  
  return `${baseMessage}. An invitation email has been sent.`;
};

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate step completion
 */
export const validateStepCompletion = (
  step: SelectionStep,
  state: HierarchicalSelectionState
): { isValid: boolean; error?: string } => {
  switch (step) {
    case 'category':
      if (!state.selectedCategory) {
        return { isValid: false, error: 'Please select a role category' };
      }
      return { isValid: true };
      
    case 'role':
      if (!state.selectedRole) {
        return { isValid: false, error: 'Please select a specific role' };
      }
      
      if (requiresOrganization(state.selectedRole) && !state.selectedOrganization) {
        return { isValid: false, error: 'Please select an organization for this role' };
      }
      
      return { isValid: true };
      
    default:
      return { isValid: false, error: 'Invalid step' };
  }
};