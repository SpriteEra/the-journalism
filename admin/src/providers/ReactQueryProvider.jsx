import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { hydrateReferenceData, persistReferenceData } from "../lib/persistedQueries";

/**
 * One shared cache for the whole panel:
 *  - everything is treated as fresh for 2 minutes (no refetch when you move between pages) and kept in memory for 30 minutes
 *  - reference data (categories, states, districts) also survives a reload (see lib/persistedQueries.js)
 *  - a failed request is retried once, never on a 4xx
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 2 * 60_000,
      gcTime: 30 * 60_000,
      retry: (count, err) => count < 1 && !(err?.response?.status >= 400 && err.response.status < 500),
    },
  },
});

hydrateReferenceData(queryClient);
persistReferenceData(queryClient);

export const ReactQueryProvider = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
