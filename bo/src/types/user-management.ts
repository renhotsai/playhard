/**
 * User Management Types
 * Based on Prisma generated types to avoid duplication
 */

import type { 
  User, 
  Member, 
  Organization, 
  Team,
  TeamMember,
  Invitation,
  Prisma
} from '@/generated/prisma';

// System Admin User List Types
export type SystemUserWithOrganizations = Prisma.UserGetPayload<{
  include: {
    members: {
      include: {
        organization: {
          select: {
            id: true;
            name: true;
            slug: true;
          };
        };
      };
    };
    _count: {
      select: {
        sessions: true;
      };
    };
  };
}>;

// Organization Member List Types
export type OrganizationMemberWithDetails = Prisma.MemberGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
        createdAt: true;
      };
    };
    teammembers: {
      include: {
        team: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
  };
}>;

// Organization with member count for dropdowns
export type OrganizationOption = Prisma.OrganizationGetPayload<{
  select: {
    id: true;
    name: true;
    slug: true;
    _count: {
      select: {
        members: true;
      };
    };
  };
}>;

// Team options for member assignment
export type TeamOption = Pick<Team, 'id' | 'name'>;

// Enhanced user creation form data types with murder mystery roles
export interface CreateUserFormData {
  // Basic user info
  name: string;
  email: string;
  
  // User type determines the creation flow
  userType: 'system_admin' | 'organization_user';
  
  // Organization assignment (required when userType is 'organization_user')
  organizationId?: string;
  organizationRole?: 'owner' | 'admin' | 'gm' | 'staff' | 'player';
  
  // Team assignment (optional)
  teamIds?: string[];
}

// Legacy CreateUserFormData for backward compatibility
export interface LegacyCreateUserFormData {
  // Basic user info
  name: string;
  email: string;
  
  // System role - expanded to include all system admin roles
  systemRole: 'super_admin' | 'admin' | 'owner' | 'member';
  
  // Organization assignment (for non-admin users)
  organizationId?: string;
  organizationRole?: 'owner' | 'admin' | 'member';
  
  // Team assignment
  teamIds?: string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export type SystemUsersResponse = ApiResponse<SystemUserWithOrganizations[]>;
export type OrganizationMembersResponse = ApiResponse<OrganizationMemberWithDetails[]>;
export type OrganizationsResponse = ApiResponse<OrganizationOption[]>;
export type TeamsResponse = ApiResponse<TeamOption[]>;

// Form validation types
export interface UserCreationError {
  field: keyof CreateUserFormData;
  message: string;
}

export interface UserCreationResult {
  success: boolean;
  userId?: string;
  invitationId?: string;
  error?: string;
  errors?: UserCreationError[];
}

// Permission check types
export interface UserPermissionContext {
  isSystemAdmin: boolean;
  organizationRole?: 'owner' | 'admin' | 'member';
  organizationId?: string;
}

// Role creation matrix
export interface RoleCreationPermissions {
  canCreateSystemAdmin: boolean;
  canCreateOrganizationOwner: boolean;
  canCreateOrganizationAdmin: boolean;
  canCreateOrganizationMember: boolean;
  availableOrganizations: OrganizationOption[];
}

// Table column definitions
export interface UserTableColumn {
  id: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface MemberTableColumn {
  id: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

// Search and filter types
export interface SystemUserFilters {
  role?: 'super_admin' | 'admin' | 'owner' | 'member';
  organizationId?: string;
  search?: string;
}

export interface OrganizationMemberFilters {
  role?: 'owner' | 'admin' | 'gm' | 'staff' | 'player';
  teamId?: string;
  search?: string;
}

// Murder mystery specific types
export interface CreateUserRequest {
  email: string;
  name: string;
  userType: 'system_admin' | 'organization_user';
  organizationId?: string;
  organizationRole?: 'owner' | 'admin' | 'gm' | 'staff' | 'player';
}

export interface CreateUserResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  invitation?: {
    id: string;
    status: 'sent' | 'pending' | 'accepted' | 'expired';
    expiresAt: string;
  };
  error?: {
    message: string;
    field?: string;
    code?: string;
  };
}

// Role categorization types
export interface RoleCategory {
  label: string;
  description: string;
  roles: string[];
}

export interface RoleCategories {
  business: RoleCategory;
  game: RoleCategory;
}

// Enhanced permission context with murder mystery roles
export interface EnhancedUserPermissionContext {
  isSystemAdmin: boolean;
  organizationRole?: 'owner' | 'admin' | 'gm' | 'staff' | 'player';
  organizationId?: string;
  roleCategory?: 'business' | 'game';
}

// Enhanced role creation permissions
export interface EnhancedRoleCreationPermissions {
  canCreateSystemAdmin: boolean;
  canCreateOrganizationOwner: boolean;
  canCreateOrganizationAdmin: boolean;
  canCreateGameMaster: boolean;
  canCreateGameStaff: boolean;
  canCreateGamePlayer: boolean;
  availableOrganizations: OrganizationOption[];
}

// Form state types for murder mystery roles
export interface UserCreationFormState {
  data: CreateUserFormData;
  errors: Partial<Record<keyof CreateUserFormData, string>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  selectedRoleCategory?: 'business' | 'game';
}

// Enhanced organization member filters
export interface EnhancedOrganizationMemberFilters {
  role?: 'owner' | 'admin' | 'gm' | 'staff' | 'player';
  roleCategory?: 'business' | 'game';
  teamId?: string;
  search?: string;
}

// Role display information
export interface RoleDisplayInfo {
  value: string;
  label: string;
  description: string;
  category: 'business' | 'game';
  icon?: string;
}

// Murder mystery specific validation types
export interface MurderMysteryFormValidation {
  userType: {
    isValid: boolean;
    error?: string;
  };
  organizationFields: {
    isRequired: boolean;
    organizationId: {
      isValid: boolean;
      error?: string;
    };
    organizationRole: {
      isValid: boolean;
      error?: string;
    };
  };
  roleCategory: {
    category?: 'business' | 'game';
    isValid: boolean;
    error?: string;
  };
}