"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5 minutes cache time
            staleTime: 5 * 60 * 1000,
            // 10 minutes garbage collection time
            gcTime: 10 * 60 * 1000,
            // Retry failed requests 1 time
            retry: 1,
            // Refetch on window focus in production
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}