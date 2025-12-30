import { QueryClient } from '@tanstack/react-query'

/**
 * Global Tanstack Query client configuration
 *
 * Default settings:
 * - staleTime: 5 minutes (data considered fresh for 5 min)
 * - cacheTime: 30 minutes (unused data kept in cache for 30 min)
 * - refetchOnWindowFocus: false (don't refetch when user returns to tab)
 * - retry: 1 attempt for queries, 0 for mutations
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})
