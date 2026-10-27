import type { QueryClient } from "@tanstack/react-query";
import { keysForEvent, type InvalidationEvent } from "./query-keys";

export async function invalidateAfter(
  queryClient: QueryClient,
  event: InvalidationEvent,
): Promise<void> {
  const keys = keysForEvent(event);
  await Promise.all(
    keys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
  );
}
