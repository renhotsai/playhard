/**
 * Advanced Organization Management Hook
 * Optimized TanStack Query implementation with caching, prefetching, and search
 */

import { useQuery, useQueryClient, usePrefetchQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { queryKeys } from '@/lib/query-keys';

// Types
interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt?: Date;
  memberCount?: number;
  members?: Array<unknown>;
  _count?: {
    members: number;
  };
}

interface OrganizationsResponse {
  success: boolean;
  data: Organization[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface UseOrganizationsAdvancedOptions {
  /** Enable search functionality */
  enableSearch?: boolean;
  /** Enable prefetching */
  enablePrefetch?: boolean;
  /** Search query */
  searchQuery?: string;
  /** Page size for pagination */
  pageSize?: number;
  /** Current page */
  page?: number;
  /** Select specific fields only */
  select?: (data: OrganizationsResponse) => unknown;
  /** Custom stale time */
  staleTime?: number;
  /** Custom cache time */
  cacheTime?: number;
}

/**
 * Fetch organizations from API
 */
async function fetchOrganizations(
  page = 1, 
  limit = 50,
  search?: string
): Promise<OrganizationsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (search && search.trim()) {
    params.append('search', search.trim());
  }

  const response = await fetch(`/api/organizations?${params.toString()}`, {
    credentials: 'include',
    headers: {
      'Cache-Control': 'max-age=300', // 5 minutes client cache
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch organizations: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Normalize response format
  if (data.data && Array.isArray(data.data)) {
    return {
      success: true,
      data: data.data,
      pagination: data.pagination,
    };
  }
  
  if (data.organizations && Array.isArray(data.organizations)) {
    return {
      success: true,
      data: data.organizations,
    };
  }
  
  if (Array.isArray(data)) {
    return {
      success: true,
      data,
    };
  }
  
  throw new Error('Invalid response format from organizations API');
}

/**
 * Advanced Organizations Hook with caching, search, and prefetching
 */
export function useOrganizationsAdvanced(options: UseOrganizationsAdvancedOptions = {}) {
  const {
    enableSearch = false,
    searchQuery = '',
    pageSize = 50,
    page = 1,
    select,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes (gcTime in v5)
  } = options;

  const queryClient = useQueryClient();

  // Main organizations query
  const query = useQuery({
    queryKey: enableSearch && searchQuery 
      ? queryKeys.organizations.selector.search(searchQuery)
      : queryKeys.organizations.selector.simple(),
    queryFn: () => fetchOrganizations(page, pageSize, searchQuery),
    staleTime,
    gcTime: cacheTime, // v5 uses gcTime instead of cacheTime
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    select,
    // Network mode for better offline handling
    networkMode: 'online',
    // Placeholder data from cache while refetching
    placeholderData: (previousData) => previousData,
  });

  // Prefetch next page for better UX
  usePrefetchQuery({
    queryKey: queryKeys.organizations.selector.prefetch(),
    queryFn: () => fetchOrganizations(page + 1, pageSize, searchQuery),
    staleTime: staleTime / 2, // Prefetch with shorter stale time
  });

  // Memoized computed values
  const computedValues = useMemo(() => {
    const organizations = query.data?.data || [];
    const totalCount = query.data?.pagination?.total || organizations.length;
    const hasNextPage = query.data?.pagination?.hasNext || false;
    const hasPreviousPage = query.data?.pagination?.hasPrev || false;

    return {
      organizations,
      totalCount,
      hasNextPage,
      hasPreviousPage,
      isEmpty: organizations.length === 0,
      isFirstPage: page === 1,
    };
  }, [query.data, page]);

  // Cache management functions
  const invalidateOrganizations = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.organizations.selector.all(),
    });
  }, [queryClient]);

  const prefetchOrganization = useCallback((orgId: string) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.organizations.detail(orgId),
      queryFn: () => fetchOrganizationDetails(orgId),
      staleTime: staleTime / 2,
    });
  }, [queryClient, staleTime]);

  const setOrganizationData = useCallback((orgId: string, data: Organization) => {
    queryClient.setQueryData(
      queryKeys.organizations.detail(orgId),
      data
    );
    
    // Also update the list cache
    queryClient.setQueryData(
      queryKeys.organizations.selector.simple(),
      (oldData: OrganizationsResponse | undefined) => {
        if (!oldData) return oldData;
        
        const updatedOrgs = oldData.data.map(org => 
          org.id === orgId ? { ...org, ...data } : org
        );
        
        return {
          ...oldData,
          data: updatedOrgs,
        };
      }
    );
  }, [queryClient]);

  // Search functionality
  const searchOrganizations = useCallback(async (query: string) => {
    if (!query.trim()) {
      return computedValues.organizations;
    }

    const searchResults = await queryClient.fetchQuery({
      queryKey: queryKeys.organizations.selector.search(query),
      queryFn: () => fetchOrganizations(1, 100, query),
      staleTime: 2 * 60 * 1000, // 2 minutes for search results
    });

    return searchResults.data || [];
  }, [queryClient, computedValues.organizations]);

  return {
    // Core query data
    ...query,
    
    // Computed values
    ...computedValues,
    
    // Cache management
    invalidate: invalidateOrganizations,
    prefetchOrganization,
    setOrganizationData,
    
    // Search functionality
    searchOrganizations,
    
    // Pagination info
    pagination: query.data?.pagination,
    
    // Query client access
    queryClient,
  };
}

/**
 * Simple Organizations Hook for basic dropdowns
 * Optimized for minimal data transfer and maximum cache efficiency
 */
export function useOrganizationsSimple() {
  return useQuery({
    queryKey: queryKeys.organizations.selector.simple(),
    queryFn: () => fetchOrganizations(1, 100), // Get all for dropdown
    staleTime: 10 * 60 * 1000, // 10 minutes - longer stale time for simple dropdowns
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    // Transform data for dropdown use
    select: (data: OrganizationsResponse) => ({
      success: data.success,
      organizations: data.data.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        memberCount: org._count?.members || org.memberCount || 0,
      })),
    }),
    // Enable background updates
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes in background
    refetchIntervalInBackground: true,
  });
}

/**
 * Prefetch organizations for better performance
 */
export function usePrefetchOrganizations() {
  return usePrefetchQuery({
    queryKey: queryKeys.organizations.selector.prefetch(),
    queryFn: () => fetchOrganizations(1, 50),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Helper function to fetch individual organization details
async function fetchOrganizationDetails(orgId: string): Promise<Organization> {
  const response = await fetch(`/api/organizations/${orgId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch organization details: ${response.status}`);
  }

  return response.json();
}

export type { Organization, OrganizationsResponse, UseOrganizationsAdvancedOptions };