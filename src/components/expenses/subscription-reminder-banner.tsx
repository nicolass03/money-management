"use client";

import { useTranslation } from "react-i18next";
import { useSubscriptionReminders } from "@/hooks/use-queries";
import { useDismissReminder } from "@/lib/mutations/subscription-reminders";
import type { SubscriptionReminderKind } from "@/lib/types/domain";
import { formatDate } from "@/lib/utils";

const DAYS_BY_KIND: Record<SubscriptionReminderKind, number> = {
  five_day: 5,
  two_day: 2,
};

export function SubscriptionReminderBanner() {
  const { t } = useTranslation(["expenses", "common"]);
  const reminders = useSubscriptionReminders();
  const dismiss = useDismissReminder();

  const items = reminders.data ?? [];
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-2">
      {items.map((reminder) => (
        <div
          key={reminder.id}
          className="flex items-start justify-between gap-4 border border-accent/40 bg-accent/5 px-4 py-3"
        >
          <p className="font-mono text-xs text-text sm:text-sm">
            {t("expenses:reminderBanner", {
              name: reminder.name,
              days: DAYS_BY_KIND[reminder.kind],
              date: formatDate(reminder.chargeDate),
            })}
          </p>
          <button
            type="button"
            aria-label={t("expenses:dismissReminder")}
            onClick={() => dismiss.mutate(reminder.id)}
            className="shrink-0 font-mono text-sm text-muted transition-colors hover:text-accent"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
