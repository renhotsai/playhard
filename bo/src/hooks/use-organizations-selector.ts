/**
 * Organization Selector Hook (Legacy)
 * Custom TanStack Query hook for fetching organizations in form selectors
 * 
 * @deprecated Use useOrganizationsSimple from @/hooks/use-organizations-advanced instead
 * This hook is kept for backward compatibility with existing components
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

interface Organization {
  id: string;
  name: string;
  slug: string;
  _count?: {
    members: number;
  };
}

interface OrganizationsResponse {
  success: boolean;
  organizations: Organization[];
  data?: Organization[]; // Alternative format
}

/**
 * Fetch organizations for form dropdowns and selectors
 * Handles different response formats and provides consistent data structure
 * 
 * @deprecated Use useOrganizationsSimple from @/hooks/use-organizations-advanced for better performance
 */
export function useOrganizationsSelector() {
  return useQuery({
    queryKey: queryKeys.organizations.selector.simple(), // Updated to use new key structure
    queryFn: async (): Promise<OrganizationsResponse> => {
      const response = await fetch('/api/organizations?limit=100', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'max-age=300', // 5 minutes client cache
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch organizations: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      if (data.data && Array.isArray(data.data)) {
        return {
          success: true,
          organizations: data.data
        };
      } else if (data.organizations) {
        return {
          success: true,
          organizations: data.organizations
        };
      } else if (Array.isArray(data)) {
        return {
          success: true,
          organizations: data
        };
      }
      
      throw new Error('Invalid response format');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (v5 uses gcTime)
    retry: 3, // Increased retry attempts
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Prevent excessive refetching
    refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes
    refetchIntervalInBackground: true,
    // Network mode for better offline handling
    networkMode: 'online',
  });
}