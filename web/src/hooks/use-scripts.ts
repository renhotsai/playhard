import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scriptsApi, bookingApi } from "@/lib/api-config";
import type { Script } from "@/data/scripts";

export const QUERY_KEYS = {
  scripts: ["scripts"] as const,
  script: (id: string) => ["scripts", id] as const,
  monthlyRecommended: ["scripts", "monthly-recommended"] as const,
  search: (filters: Record<string, unknown>) => ["scripts", "search", filters] as const,
  timeSlots: (scriptId: string) => ["scripts", scriptId, "time-slots"] as const,
  bookingInfo: ["booking", "info"] as const,
};

export function useScripts(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.scripts,
    queryFn: scriptsApi.getAll,
    enabled,
  });
}

export function useScript(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.script(id),
    queryFn: () => scriptsApi.getById(id),
    enabled: !!id,
  });
}

export function useMonthlyRecommended() {
  return useQuery({
    queryKey: QUERY_KEYS.monthlyRecommended,
    queryFn: scriptsApi.getMonthlyRecommended,
  });
}

export function useScriptsSearch(
  filters: { category?: string; difficulty?: string; playerCount?: string },
  enabled?: boolean
) {
  return useQuery({
    queryKey: QUERY_KEYS.search(filters),
    queryFn: () => scriptsApi.search(filters),
    enabled: enabled ?? !!(filters.category || filters.difficulty || filters.playerCount),
  });
}

export function useScriptTimeSlots(scriptId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.timeSlots(scriptId),
    queryFn: () => scriptsApi.getTimeSlots(scriptId),
    enabled: !!scriptId,
  });
}

export function useBookingInfo() {
  return useQuery({
    queryKey: QUERY_KEYS.bookingInfo,
    queryFn: bookingApi.getBookingInfo,
  });
}

export function useSubmitBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingApi.submitBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scripts });
    },
  });
}

// Legacy crud hooks (kept for compatibility, will be replaced by bo API routes)
export function useCreateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_script: Omit<Script, "id" | "createdAt" | "updatedAt">) =>
      Promise.reject(new Error("Use bo backoffice to manage scripts")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.scripts });
    },
  });
}
