import type { SubscriptionReminder } from "@/lib/types/domain";
import { apiFetch } from "./client";

export async function getSubscriptionReminders(): Promise<
  SubscriptionReminder[]
> {
  return apiFetch<SubscriptionReminder[]>("/api/v1/subscription-reminders");
}

export async function dismissSubscriptionReminder(id: string): Promise<void> {
  await apiFetch(`/api/v1/subscription-reminders/${id}/dismiss`, {
    method: "POST",
  });
}
