import { useQuery } from '@tanstack/react-query';
import { venuesApi, Venue } from '@/data/venues';

export function useVenues() {
  return useQuery({
    queryKey: ['venues'],
    queryFn: venuesApi.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useActiveVenues() {
  return useQuery({
    queryKey: ['venues', 'active'],
    queryFn: venuesApi.getActive,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useVenue(id: string) {
  return useQuery({
    queryKey: ['venues', id],
    queryFn: () => venuesApi.getById(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!id,
  });
}

export function useMainVenue() {
  return useQuery({
    queryKey: ['venues', 'main'],
    queryFn: venuesApi.getMainBranch,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}