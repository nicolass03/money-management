import type { QueryClient } from "@tanstack/react-query";
import {
  keysForEvent,
  queryKeys,
  type InvalidationEvent,
} from "./query-keys";

export async function invalidateAfter(
  queryClient: QueryClient,
  event: InvalidationEvent,
): Promise<void> {
  const keys = keysForEvent(event);
  await Promise.all(
    keys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
  );
}

export async function invalidateAll(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries();
}

export async function invalidateBudgetExpenses(
  queryClient: QueryClient,
  budgetId: string,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.budgetExpenses(budgetId),
  });
}
