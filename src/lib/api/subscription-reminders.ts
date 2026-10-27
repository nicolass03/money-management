import type { SubscriptionReminder } from "@/lib/types/domain";
import { localTodayIso } from "@/lib/date/local-today";
import { apiFetch } from "./client";

export async function getSubscriptionReminders(): Promise<
  SubscriptionReminder[]
> {
  const params = new URLSearchParams({ asOf: localTodayIso() });
  return apiFetch<SubscriptionReminder[]>(
    `/api/v1/subscription-reminders?${params.toString()}`,
  );
}

export async function dismissSubscriptionReminder(id: string): Promise<void> {
  await apiFetch(`/api/v1/subscription-reminders/${id}/dismiss`, {
    method: "POST",
  });
}
