import type { Income, IncomePaySchedule } from "@/lib/db/schema";
import { getUpcomingPayDates, scheduleToInput } from "@/lib/income/pay-periods";

export function isManualIncome(entry: Income): boolean {
  return entry.source !== "scheduled" && entry.scheduleId == null;
}

export function filterIncomeEntriesForDisplay(
  entries: Income[],
  schedules: IncomePaySchedule[],
  today = new Date().toISOString().slice(0, 10),
): Income[] {
  const manual = entries.filter(isManualIncome);

  const scheduledByKey = new Map<string, Income>();
  for (const entry of entries) {
    if (entry.scheduleId != null && entry.source === "scheduled") {
      scheduledByKey.set(`${entry.scheduleId}:${entry.date}`, entry);
    }
  }

  const nextScheduled: Income[] = [];
  for (const schedule of schedules) {
    const [nextDate] = getUpcomingPayDates(scheduleToInput(schedule), 1, today);
    if (!nextDate) {
      continue;
    }

    const entry = scheduledByKey.get(`${schedule.id}:${nextDate}`);
    if (entry) {
      nextScheduled.push(entry);
    }
  }

  return [...manual, ...nextScheduled].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.id - a.id;
  });
}
