import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dismissSubscriptionReminder } from "@/lib/api/subscription-reminders";
import { invalidateAfter } from "@/lib/query/invalidation";
import { tError } from "@/lib/i18n/errors";
import { mutationError, type FormResult } from "./types";

export async function dismissReminderMutation(
  id: string,
): Promise<FormResult> {
  try {
    await dismissSubscriptionReminder(id);
    return { success: true };
  } catch (error) {
    return mutationError(error, tError("failedDismissReminder"));
  }
}

export function useDismissReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dismissReminderMutation,
    onSuccess: (result) => {
      if (result.success)
        void invalidateAfter(queryClient, "subscriptionReminderChange");
    },
  });
}
