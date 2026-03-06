"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";

export interface InviteMemberData {
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  teamIds?: string[];
}

interface InviteMemberResponse {
  success: boolean;
  message: string;
  invitation?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    expiresAt: string;
  };
}

export function useInviteOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteMemberData): Promise<InviteMemberResponse> => {
      const response = await fetch(`/api/organizations/${organizationId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to invite member: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.members(organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.detail(organizationId),
      });
      
      // If teams were assigned, invalidate team queries as well
      if (variables.teamIds && variables.teamIds.length > 0) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.teams.byOrganization(organizationId),
        });
        
        // Invalidate each specific team's members
        variables.teamIds.forEach((teamId) => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.teams.detail(teamId),
          });
        });
      }

      toast.success(data.message || `Successfully invited ${variables.name} to join the organization!`);
    },
    onError: (error: Error) => {
      console.error('Member invitation error:', error);
      toast.error(error.message || 'Failed to send invitation');
    },
  });
}

export function useOrganizationTeams(organizationId: string) {
  return {
    queryKey: queryKeys.teams.byOrganization(organizationId),
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}/teams`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!organizationId,
  };
}