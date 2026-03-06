/**
 * Dual-Tier Permission System
 * System Admin (user.role = 'admin') + Organization roles (member.role)
 * Based on Better Auth admin plugin and organization plugin
 */

// System-level Role Helper Functions (Better Auth admin plugin)
export const isSystemAdmin = (userRole?: string | null): boolean => {
  return userRole === 'admin' || userRole === 'super_admin';
};

export const isSystemMember = (userRole?: string | null): boolean => {
  return userRole === 'member' || userRole === null || userRole === undefined;
};

// Organization Role Helper Functions (Better Auth organization plugin)  
export const isOrganizationOwner = (memberRole?: string | null): boolean => {
  return memberRole === 'owner';
};

export const isOrganizationAdmin = (memberRole?: string | null): boolean => {
  return memberRole === 'admin';
};

export const isOrganizationMember = (memberRole?: string | null): boolean => {
  return memberRole === 'member';
};

// Check if user has admin privileges within organization
export const hasOrganizationAdminAccess = (memberRole?: string | null): boolean => {
  return isOrganizationOwner(memberRole) || isOrganizationAdmin(memberRole);
};

// Dual-tier permission checks (System Admin OR Organization role)
export const canManageUsers = (userRole?: string | null, memberRole?: string | null): boolean => {
  return isSystemAdmin(userRole) || hasOrganizationAdminAccess(memberRole);
};

export const canManageOrganization = (userRole?: string | null, memberRole?: string | null): boolean => {
  return isSystemAdmin(userRole) || isOrganizationOwner(memberRole);
};

export const canReadOrganization = (userRole?: string | null, memberRole?: string | null): boolean => {
  return isSystemAdmin(userRole) || (memberRole !== null && memberRole !== undefined);
};

export const canCreateOrganization = (userRole?: string | null): boolean => {
  return isSystemAdmin(userRole);
};

export const canImpersonateUsers = (userRole?: string | null): boolean => {
  return isSystemAdmin(userRole);
};

export const canAccessAllOrganizations = (userRole?: string | null): boolean => {
  return isSystemAdmin(userRole);
};

export const canManageSystemUsers = (userRole?: string | null): boolean => {
  return isSystemAdmin(userRole);
};

export const canBanUsers = (userRole?: string | null): boolean => {
  return isSystemAdmin(userRole);
};

export const canSetUserRoles = (userRole?: string | null): boolean => {
  return isSystemAdmin(userRole);
};

// Game-specific role helpers (mapped to Better Auth organization roles)
export const isGameMaster = (memberRole?: string | null): boolean => {
  return memberRole === 'supervisor'; // Game masters map to supervisor role
};

export const isGameStaff = (memberRole?: string | null): boolean => {
  return memberRole === 'employee'; // Game staff map to employee role
};

export const isGamePlayer = (memberRole?: string | null): boolean => {
  return memberRole === 'employee'; // Game players also map to employee role
};

// Role type mapping for new 6-role system
export type RoleType = 'system_admin' | 'organization_owner' | 'organization_admin' | 'game_master' | 'game_staff' | 'game_player';

export function mapRoleToDescription(roleType: RoleType): string {
  const descriptions: Record<RoleType, string> = {
    'system_admin': 'System Administrator - Full platform access',
    'organization_owner': 'Organization Owner - Full organization management',
    'organization_admin': 'Organization Admin - Organization user management',
    'game_master': 'Game Master - Game session supervision',
    'game_staff': 'Game Staff - Game session support',
    'game_player': 'Game Player - Game session participation'
  };
  
  return descriptions[roleType];
}

export function getRoleHierarchyLevel(roleType: RoleType): number {
  const hierarchy: Record<RoleType, number> = {
    'system_admin': 6,        // Highest level
    'organization_owner': 5,
    'organization_admin': 4,
    'game_master': 3,
    'game_staff': 2,
    'game_player': 1          // Lowest level
  };
  
  return hierarchy[roleType];
}

// Check if a role can create another role (hierarchical permissions)
export function canCreateRole(creatorRole: RoleType, targetRole: RoleType): boolean {
  const creatorLevel = getRoleHierarchyLevel(creatorRole);
  const targetLevel = getRoleHierarchyLevel(targetRole);
  
  // System admin can create any role except other system admins
  if (creatorRole === 'system_admin') {
    return targetRole !== 'system_admin';
  }
  
  // Others can only create roles below their level
  return creatorLevel > targetLevel;
}