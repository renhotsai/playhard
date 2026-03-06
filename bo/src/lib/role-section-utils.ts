import {
  type RoleType,
  type SystemRole,
  type OrganizationRole,
  type RoleSection,
  type RoleDefinition,
  type RoleSectionConfig,
  DEFAULT_ROLE_SECTIONS,
  getRolesBySection,
  getRoleDefinition,
  isSystemRole,
  isOrganizationRole
} from '@/types/role-sections'

/**
 * Role Section Utility Functions
 * Provides helper functions for working with the two-section role selection system
 */

/**
 * Get the section type for a given role
 */
export function getRoleSectionType(roleId: RoleType): RoleSection {
  return isSystemRole(roleId) ? 'system' : 'organization'
}

/**
 * Get all available role types grouped by section
 */
export function getGroupedRoles(): Record<RoleSection, RoleType[]> {
  const systemRoles = getRolesBySection('system').map(role => role.id)
  const organizationRoles = getRolesBySection('organization').map(role => role.id)
  
  return {
    system: systemRoles,
    organization: organizationRoles
  }
}

/**
 * Check if a role requires organization selection
 */
export function requiresOrganization(roleId: RoleType): boolean {
  return isOrganizationRole(roleId)
}

/**
 * Get role display information
 */
export function getRoleDisplayInfo(roleId: RoleType) {
  const roleDefinition = getRoleDefinition(roleId)
  if (!roleDefinition) {
    return null
  }

  return {
    label: roleDefinition.label,
    description: roleDefinition.description,
    section: roleDefinition.section,
    badge: roleDefinition.badge
  }
}

/**
 * Validate role selection
 */
export function validateRoleSelection(roleId: RoleType): {
  isValid: boolean
  errors: string[]
  section: RoleSection
} {
  const errors: string[] = []
  const section = getRoleSectionType(roleId)
  
  // Check if role exists
  const roleDefinition = getRoleDefinition(roleId)
  if (!roleDefinition) {
    errors.push(`Invalid role: ${roleId}`)
  }
  
  // Additional validation can be added here
  // For example: checking user permissions to assign this role
  
  return {
    isValid: errors.length === 0,
    errors,
    section
  }
}

/**
 * Get section configuration by section type
 */
export function getSectionConfig(section: RoleSection): RoleSectionConfig | null {
  return DEFAULT_ROLE_SECTIONS.find(config => config.section === section) || null
}

/**
 * Get all role types in a specific section
 */
export function getSectionRoleIds(section: RoleSection): RoleType[] {
  const sectionConfig = getSectionConfig(section)
  return sectionConfig ? sectionConfig.roles.map(role => role.id) : []
}

/**
 * Check if two roles are in the same section
 */
export function areInSameSection(roleA: RoleType, roleB: RoleType): boolean {
  return getRoleSectionType(roleA) === getRoleSectionType(roleB)
}

/**
 * Get default role for a section (first role in the section)
 */
export function getDefaultRoleForSection(section: RoleSection): RoleType | null {
  const sectionRoles = getSectionRoleIds(section)
  return sectionRoles.length > 0 ? sectionRoles[0] : null
}

/**
 * Format role for form submission
 */
export function formatRoleForSubmission(roleId: RoleType) {
  const roleDefinition = getRoleDefinition(roleId)
  if (!roleDefinition) {
    throw new Error(`Invalid role: ${roleId}`)
  }

  return {
    roleId,
    section: roleDefinition.section,
    requiresOrganization: requiresOrganization(roleId),
    displayName: roleDefinition.label
  }
}

/**
 * Get available transitions from current role
 * Returns roles that can be selected when switching from the current role
 */
export function getAvailableTransitions(currentRole: RoleType): {
  withinSection: RoleType[]
  crossSection: RoleType[]
  all: RoleType[]
} {
  const currentSection = getRoleSectionType(currentRole)
  const withinSection = getSectionRoleIds(currentSection).filter(role => role !== currentRole)
  
  const otherSection: RoleSection = currentSection === 'system' ? 'organization' : 'system'
  const crossSection = getSectionRoleIds(otherSection)
  
  return {
    withinSection,
    crossSection,
    all: [...withinSection, ...crossSection]
  }
}

/**
 * Role section statistics
 */
export function getRoleSectionStats() {
  const systemRoles = getSectionRoleIds('system')
  const organizationRoles = getSectionRoleIds('organization')
  
  return {
    total: systemRoles.length + organizationRoles.length,
    system: {
      count: systemRoles.length,
      roles: systemRoles
    },
    organization: {
      count: organizationRoles.length,
      roles: organizationRoles
    }
  }
}

/**
 * Generate role-specific success messages for user creation
 */
export function getRoleSpecificSuccessMessage(
  roleType: RoleType, 
  userName: string, 
  organizationName?: string
): { title: string; description: string } {
  const roleDefinition = getRoleDefinition(roleType);
  
  switch (roleType) {
    case 'super_admin':
      return {
        title: 'Super Administrator Created!',
        description: `${userName} has been granted complete platform control with global administrative privileges. They can now manage all organizations, users, and system settings.`
      };
    case 'platform_manager':
      return {
        title: 'Platform Manager Created!',
        description: `${userName} has been assigned platform management access. They can now handle business operations, analytics, and organization oversight.`
      };
    case 'support_agent':
      return {
        title: 'Support Agent Created!',
        description: `${userName} has been granted customer support access. They can now handle customer support, issue resolution, and basic user management.`
      };
    case 'developer':
      return {
        title: 'Developer Created!',
        description: `${userName} has been granted developer access. They can now handle system maintenance, API access, and debugging tools.`
      };
      
    case 'organization_owner':
      return {
        title: 'Organization Owner Created!',
        description: `${userName} has been assigned as an owner ${organizationName ? `of ${organizationName}` : 'of the organization'}. They have full management access to their organization.`
      };
      
    case 'organization_admin':
      return {
        title: 'Organization Admin Created!',
        description: `${userName} has been granted administrative access ${organizationName ? `to ${organizationName}` : 'to the organization'}. They can manage users and settings within their organization.`
      };
      
    case 'game_master':
      return {
        title: 'Game Master Created!',
        description: `${userName} has been registered as a Game Master ${organizationName ? `for ${organizationName}` : 'for the organization'}. They can now create and manage murder mystery game sessions.`
      };
      
    case 'game_staff':
      return {
        title: 'Game Staff Created!',
        description: `${userName} has been added as Game Staff ${organizationName ? `to ${organizationName}` : 'to the organization'}. They can assist with game operations and customer support.`
      };
      
    case 'game_player':
      return {
        title: 'Game Player Created!',
        description: `${userName} has been registered as a Game Player ${organizationName ? `for ${organizationName}` : 'for the organization'}. They can now participate in murder mystery game sessions.`
      };
      
    default:
      return {
        title: 'User Created Successfully!',
        description: `${userName} has been added to the system with ${roleDefinition?.label || roleType} role.`
      };
  }
}