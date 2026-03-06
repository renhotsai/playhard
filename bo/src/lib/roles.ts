/**
 * Murder Mystery Role Constants
 * 
 * Defines the 5-tier role system for the admin create user page:
 * - System Level: Global platform access
 * - Business Level: Organization management 
 * - Game Level: Murder mystery gameplay
 */

// System Level Roles
export const SYSTEM_ROLES = {
  ADMIN: 'admin',
} as const;

// Organization Business Roles
export const BUSINESS_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
} as const;

// Murder Mystery Game Roles
export const GAME_ROLES = {
  GM: 'gm',           // Game Master - leads murder mystery games
  STAFF: 'staff',     // Staff - supports game operations
  PLAYER: 'player',   // Player - participates in games
} as const;

// Combined Organization Roles (Business + Game)
export const ORGANIZATION_ROLES = {
  ...BUSINESS_ROLES,
  ...GAME_ROLES,
} as const;

// All roles combined
export const ALL_ROLES = {
  ...SYSTEM_ROLES,
  ...ORGANIZATION_ROLES,
} as const;

// User type categories
export const USER_TYPES = {
  SYSTEM_ADMIN: 'system_admin',
  ORGANIZATION_USER: 'organization_user',
} as const;

// Type definitions
export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];
export type BusinessRole = typeof BUSINESS_ROLES[keyof typeof BUSINESS_ROLES];
export type GameRole = typeof GAME_ROLES[keyof typeof GAME_ROLES];
export type OrganizationRole = typeof ORGANIZATION_ROLES[keyof typeof ORGANIZATION_ROLES];
export type UserRole = typeof ALL_ROLES[keyof typeof ALL_ROLES];
export type UserType = typeof USER_TYPES[keyof typeof USER_TYPES];

// Role arrays for iteration and validation
export const SYSTEM_ROLE_VALUES = Object.values(SYSTEM_ROLES);
export const BUSINESS_ROLE_VALUES = Object.values(BUSINESS_ROLES);
export const GAME_ROLE_VALUES = Object.values(GAME_ROLES);
export const ORGANIZATION_ROLE_VALUES = Object.values(ORGANIZATION_ROLES);
export const ALL_ROLE_VALUES = Object.values(ALL_ROLES);
export const USER_TYPE_VALUES = Object.values(USER_TYPES);

// Role display names for UI
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [SYSTEM_ROLES.ADMIN]: 'System Administrator',
  [BUSINESS_ROLES.OWNER]: 'Organization Owner',
  [BUSINESS_ROLES.ADMIN]: 'Organization Admin',
  [GAME_ROLES.GM]: 'Game Master (GM)',
  [GAME_ROLES.STAFF]: 'Game Staff',
  [GAME_ROLES.PLAYER]: 'Game Player',
};

// Role descriptions for UI tooltips
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [SYSTEM_ROLES.ADMIN]: 'Full system access across all organizations',
  [BUSINESS_ROLES.OWNER]: 'Full control over specific organizations',
  [BUSINESS_ROLES.ADMIN]: 'Administrative access within specific organizations',
  [GAME_ROLES.GM]: 'Lead murder mystery games within organizations',
  [GAME_ROLES.STAFF]: 'Support murder mystery game operations',
  [GAME_ROLES.PLAYER]: 'Participate in murder mystery games',
};

// Role category groupings for UI
export const ROLE_CATEGORIES = {
  business: {
    label: 'Business Roles',
    description: 'Organization management and administration',
    roles: BUSINESS_ROLE_VALUES,
  },
  game: {
    label: 'Game Roles',
    description: 'Murder mystery gameplay and operations',
    roles: GAME_ROLE_VALUES,
  },
} as const;

// Utility functions
export function isSystemRole(role: string): role is SystemRole {
  return SYSTEM_ROLE_VALUES.includes(role as SystemRole);
}

export function isBusinessRole(role: string): role is BusinessRole {
  return BUSINESS_ROLE_VALUES.includes(role as BusinessRole);
}

export function isGameRole(role: string): role is GameRole {
  return GAME_ROLE_VALUES.includes(role as GameRole);
}

export function isOrganizationRole(role: string): role is OrganizationRole {
  return ORGANIZATION_ROLE_VALUES.includes(role as OrganizationRole);
}

export function isValidRole(role: string): role is UserRole {
  return ALL_ROLE_VALUES.includes(role as UserRole);
}

export function getRoleDisplayName(role: UserRole): string {
  return ROLE_DISPLAY_NAMES[role] || role;
}

export function getRoleDescription(role: UserRole): string {
  return ROLE_DESCRIPTIONS[role] || '';
}

export function getRoleCategory(role: OrganizationRole): 'business' | 'game' | null {
  if (isBusinessRole(role)) return 'business';
  if (isGameRole(role)) return 'game';
  return null;
}