/**
 * Role Section Type Definitions
 * 
 * Defines TypeScript interfaces for the two-section role selection components.
 * These types ensure type safety and consistent API between components.
 * 
 * Enhancement: Two-tier role selection (System Roles vs Organization Roles)
 * Date: September 16, 2025
 */

import React from 'react';

// Core types for role section categorization
export type RoleSection = 'system' | 'organization';

export type SystemRole = 'super_admin' | 'platform_manager' | 'support_agent' | 'developer';

export type OrganizationRole = 
  | 'organization_owner' 
  | 'organization_admin' 
  | 'game_master' 
  | 'game_staff' 
  | 'game_player';

export type RoleType = SystemRole | OrganizationRole;

// Role definition with section metadata
export interface RoleDefinition {
  id: RoleType;
  label: string;
  description: string;
  section: RoleSection;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

// Section configuration
export interface RoleSectionConfig {
  section: RoleSection;
  title: string;
  description: string;
  roles: RoleDefinition[];
}

// Main component props
export interface RoleSelectionSectionsProps {
  /** Currently selected role value */
  value?: RoleType;
  
  /** Callback when role selection changes */
  onValueChange: (value: RoleType) => void;
  
  /** Disable all role selections */
  disabled?: boolean;
  
  /** Error message to display */
  error?: string;
  
  /** Custom role configurations (optional override) */
  sections?: RoleSectionConfig[];
  
  /** Additional CSS classes */
  className?: string;
  
  /** Test ID for testing */
  'data-testid'?: string;
}

// Section group component props  
export interface RoleSectionGroupProps {
  /** Section configuration */
  config: RoleSectionConfig;
  
  /** Currently selected role */
  selectedValue?: RoleType;
  
  /** Role selection handler */
  onRoleSelect: (role: RoleType) => void;
  
  /** Disable this section */
  disabled?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Test ID for testing */
  'data-testid'?: string;
}

// Individual role option props
export interface RoleOptionProps {
  /** Role definition */
  role: RoleDefinition;
  
  /** Whether this role is selected */
  selected: boolean;
  
  /** Selection handler */
  onSelect: (role: RoleType) => void;
  
  /** Disable this option */
  disabled?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Test ID for testing */
  'data-testid'?: string;
}

// Default role configurations
export const DEFAULT_ROLE_SECTIONS: RoleSectionConfig[] = [
  {
    section: 'system',
    title: 'System Roles',
    description: 'Global platform administration roles with full system access',
    roles: [
      {
        id: 'super_admin',
        label: 'Super Administrator',
        description: 'Complete platform control across all organizations and users',
        section: 'system',
        badge: {
          text: 'SUPER ADMIN',
          variant: 'destructive'
        }
      },
      {
        id: 'platform_manager',
        label: 'Platform Manager',
        description: 'Business operations, analytics, and organization oversight',
        section: 'system',
        badge: {
          text: 'PLATFORM MGR',
          variant: 'default'
        }
      },
      {
        id: 'support_agent',
        label: 'Support Agent',
        description: 'Customer support, issue resolution, and basic user management',
        section: 'system',
        badge: {
          text: 'SUPPORT',
          variant: 'secondary'
        }
      },
      {
        id: 'developer',
        label: 'Developer',
        description: 'System maintenance, API access, and debugging tools',
        section: 'system',
        badge: {
          text: 'DEVELOPER',
          variant: 'outline'
        }
      }
    ]
  },
  {
    section: 'organization',
    title: 'Organization Roles', 
    description: 'Organization-specific roles for business and game management',
    roles: [
      {
        id: 'organization_owner',
        label: 'Organization Owner',
        description: 'Complete organization ownership and management privileges',
        section: 'organization',
        badge: {
          text: 'OWNER',
          variant: 'default'
        }
      },
      {
        id: 'organization_admin',
        label: 'Organization Administrator',
        description: 'Administrative privileges for organization management',
        section: 'organization',
        badge: {
          text: 'ADMIN',
          variant: 'secondary'
        }
      },
      {
        id: 'game_master',
        label: 'Game Master',
        description: 'Lead murder mystery games and guide player experiences',
        section: 'organization',
        badge: {
          text: 'GM',
          variant: 'default'
        }
      },
      {
        id: 'game_staff',
        label: 'Game Staff',
        description: 'Support game operations and assist with customer service',
        section: 'organization',
        badge: {
          text: 'STAFF',
          variant: 'outline'
        }
      },
      {
        id: 'game_player',
        label: 'Game Player',
        description: 'Participate in murder mystery games and solve puzzles',
        section: 'organization',
        badge: {
          text: 'PLAYER',
          variant: 'outline'
        }
      }
    ]
  }
];

// Utility functions for role management
export const getRolesBySection = (section: RoleSection): RoleDefinition[] => {
  return DEFAULT_ROLE_SECTIONS
    .find(s => s.section === section)?.roles || [];
};

export const getRoleDefinition = (roleId: RoleType): RoleDefinition | undefined => {
  return DEFAULT_ROLE_SECTIONS
    .flatMap(section => section.roles)
    .find(role => role.id === roleId);
};

export const isSystemRole = (role: RoleType): role is SystemRole => {
  return ['super_admin', 'platform_manager', 'support_agent', 'developer'].includes(role as SystemRole);
};

export const isOrganizationRole = (role: RoleType): role is OrganizationRole => {
  return !isSystemRole(role);
};

// Form integration types
export interface RoleSectionFormState {
  selectedRole?: RoleType;
  selectedSection?: RoleSection;
  validationError?: string;
}

export interface RoleSectionFormActions {
  selectRole: (role: RoleType) => void;
  clearSelection: () => void;
  setError: (error: string) => void;
  clearError: () => void;
}

// Testing utilities
export const ROLE_SECTION_TEST_IDS = {
  container: 'role-selection-sections',
  systemSection: 'role-section-system',
  organizationSection: 'role-section-organization',
  roleOption: (roleId: RoleType) => `role-option-${roleId}`,
  sectionTitle: (section: RoleSection) => `section-title-${section}`,
  errorMessage: 'role-selection-error'
} as const;

// Accessibility constants
export const ROLE_SECTION_ARIA = {
  sectionGroup: 'group',
  sectionLabelledBy: (section: RoleSection) => `${section}-section-heading`,
  roleSelection: 'radiogroup',
  roleSelectionLabel: 'Select user role type'
} as const;

// Enhanced CreateUserFormData for form integration
export interface CreateUserFormData {
  name: string;
  email: string;
  roleType: RoleType;
  selectedSection: RoleSection;
  organizationId?: string;
}

// Enhanced RoleSelectionSections props for form integration
export interface RoleSelectionSectionsPropsEnhanced {
  selectedRole: RoleType | null;
  selectedOrganization: string | null;
  onRoleChange: (selection: {
    roleType: RoleType | null;
    section: RoleSection;
    requiresOrganization: boolean;
  }) => void;
  onOrganizationChange?: (organizationId: string) => void;
  onSubmit: (data: CreateUserFormData) => void;
  validationErrors?: {
    roleType?: string;
    organizationId?: string;
    selectedSection?: string;
  };
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

// Re-export utility functions from utils
export { 
  validateRoleSelection, 
  getRoleSpecificSuccessMessage,
  requiresOrganization,
  getRoleSectionType
} from '@/lib/role-section-utils';