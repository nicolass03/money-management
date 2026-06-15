import type { Income } from "@/lib/types/domain";

export function isManualIncome(entry: Income): boolean {
  return entry.source !== "scheduled" && entry.scheduleId == null;
}

/**
 * Income entries for display. Scheduled income is now materialized by the daily cron
 * (one actual row per pay date), so every returned row — manual or scheduled — is a real
 * registry the user can edit/delete. Deleted scheduled rows are tombstoned server-side and
 * never reach the client, so no client-side filtering is required beyond sorting.
 */
export function filterIncomeEntriesForDisplay(entries: Income[]): Income[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}
