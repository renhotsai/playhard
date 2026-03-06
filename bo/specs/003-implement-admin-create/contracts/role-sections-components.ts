/**
 * Component Contracts: Role Selection Sections Enhancement
 * 
 * Defines TypeScript interfaces for the two-section role selection components.
 * These contracts ensure type safety and consistent API between components.
 * 
 * Date: September 15, 2025
 * Feature: Admin Create User Page - Role Type Sections
 */

// Core types for role section categorization
export type RoleSection = 'system' | 'organization';

export type SystemRole = 'system_admin';

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
        id: 'system_admin',
        label: 'System Administrator',
        description: 'Complete system control across all organizations and users',
        section: 'system',
        badge: {
          text: 'FULL ACCESS',
          variant: 'destructive'
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
  return role === 'system_admin';
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