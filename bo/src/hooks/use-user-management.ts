/**
 * TanStack Query hooks for user management
 * Fully typed with Prisma types and consistent API patterns
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  SystemUserWithOrganizations,
  OrganizationMemberWithDetails,
  OrganizationOption,
  TeamOption,
  SystemUsersResponse,
  OrganizationMembersResponse,
  OrganizationsResponse,
  TeamsResponse,
  CreateUserFormData,
  UserCreationResult,
  SystemUserFilters,
  OrganizationMemberFilters
} from '@/types/user-management';

// Query keys for cache management
export const userManagementKeys = {
  all: ['userManagement'] as const,
  
  // System admin queries
  systemUsers: () => [...userManagementKeys.all, 'systemUsers'] as const,
  systemUsersList: (filters: SystemUserFilters) => [...userManagementKeys.systemUsers(), 'list', filters] as const,
  
  // Organization queries
  organizations: () => [...userManagementKeys.all, 'organizations'] as const,
  organizationsList: () => [...userManagementKeys.organizations(), 'list'] as const,
  
  // Organization members queries
  orgMembers: (orgId: string) => [...userManagementKeys.all, 'orgMembers', orgId] as const,
  orgMembersList: (orgId: string, filters: OrganizationMemberFilters) => 
    [...userManagementKeys.orgMembers(orgId), 'list', filters] as const,
  
  // Teams queries
  teams: (orgId: string) => [...userManagementKeys.all, 'teams', orgId] as const,
  teamsList: (orgId: string) => [...userManagementKeys.teams(orgId), 'list'] as const,
};

// System Admin Hooks

/**
 * Fetch all system users (admin only)
 */
export function useSystemUsers(filters: SystemUserFilters = {}) {
  return useQuery({
    queryKey: userManagementKeys.systemUsersList(filters),
    queryFn: async (): Promise<SystemUserWithOrganizations[]> => {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.organizationId) params.append('organizationId', filters.organizationId);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const result: SystemUsersResponse = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch users');
      }
      
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Create new user (admin only)
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateUserFormData): Promise<UserCreationResult> => {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all user lists to refresh data
      queryClient.invalidateQueries({ queryKey: userManagementKeys.systemUsers() });
    },
  });
}

/**
 * Delete user (admin only)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string): Promise<{ success: boolean; message: string }> => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all user lists to refresh data
      queryClient.invalidateQueries({ queryKey: userManagementKeys.systemUsers() });
    },
  });
}

/**
 * Fetch organizations for admin user creation
 */
export function useOrganizations() {
  return useQuery({
    queryKey: userManagementKeys.organizationsList(),
    queryFn: async (): Promise<OrganizationOption[]> => {
      const response = await fetch('/api/admin/users/create');
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      
      const result: OrganizationsResponse = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch organizations');
      }
      
      return result.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (organizations change less frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Organization Admin Hooks

/**
 * Fetch organization members
 */
export function useOrganizationMembers(
  organizationId: string,
  filters: OrganizationMemberFilters = {}
) {
  return useQuery({
    queryKey: userManagementKeys.orgMembersList(organizationId, filters),
    queryFn: async (): Promise<OrganizationMemberWithDetails[]> => {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.teamId) params.append('teamId', filters.teamId);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/organizations/members?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch organization members');
      }
      
      const result: OrganizationMembersResponse = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch organization members');
      }
      
      return result.data || [];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Invite member to organization
 */
export function useInviteMember(organizationId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      role: 'owner' | 'admin' | 'member';
      teamIds?: string[];
    }): Promise<UserCreationResult> => {
      const response = await fetch('/api/organizations/members/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to invite member');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate organization member lists
      queryClient.invalidateQueries({ 
        queryKey: userManagementKeys.orgMembers(organizationId) 
      });
    },
  });
}

/**
 * Fetch teams for organization
 */
export function useOrganizationTeams(organizationId: string) {
  return useQuery({
    queryKey: userManagementKeys.teamsList(organizationId),
    queryFn: async (): Promise<TeamOption[]> => {
      const response = await fetch('/api/organizations/members/invite');
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      
      const result: TeamsResponse = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch teams');
      }
      
      return result.data || [];
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Helper hooks for common operations

/**
 * Get role creation permissions for current user
 */
export function useRoleCreationPermissions() {
  return useQuery({
    queryKey: ['roleCreationPermissions'],
    queryFn: async () => {
      // This would typically come from session/auth context
      // For now, return based on current user's role
      return {
        canCreateSystemAdmin: true, // Will be determined by actual auth state
        canCreateOrganizationOwner: true,
        canCreateOrganizationAdmin: true,
        canCreateOrganizationMember: true,
        availableOrganizations: [] as OrganizationOption[]
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Organization member invitation mutation
 */
export function useInviteOrganizationMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberData: {
      name: string;
      email: string;
      role: 'owner' | 'admin' | 'member';
      teamIds?: string[];
    }) => {
      const response = await fetch('/api/organizations/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to invite member');
      }
      
      const result: UserCreationResult = await response.json();
      return result;
    },
    onSuccess: () => {
      // Invalidate organization members list
      queryClient.invalidateQueries({ 
        queryKey: userManagementKeys.organizationMembersList() 
      });
    }
  });
}

/**
 * Utility hook to invalidate all user management queries
 */
export function useInvalidateUserManagement() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: userManagementKeys.all });
  };
}