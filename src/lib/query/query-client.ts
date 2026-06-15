import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";

let sharedQueryClient: QueryClient | null = null;

export function createQueryClient(): QueryClient {
  sharedQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status === 401) {
            return false;
          }
          return failureCount < 1;
        },
      },
    },
  });
  return sharedQueryClient;
}

export function getQueryClient(): QueryClient {
  if (!sharedQueryClient) {
    throw new Error("QueryClient not initialized — call createQueryClient() first");
  }
  return sharedQueryClient;
}

/** Cancel in-flight fetches and remove all cached API data (required on logout / user switch). */
export async function clearAppDataCache(): Promise<void> {
  if (!sharedQueryClient) return;
  await sharedQueryClient.cancelQueries();
  sharedQueryClient.clear();
}
