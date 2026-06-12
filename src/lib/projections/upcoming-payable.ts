import type {
  CurrencyCode,
  ExpenseWithTags,
  PlannedExpenseWithTags,
  RecurringExpenseWithTags,
} from "@/lib/types/domain";
import { getPayDatesInRange, scheduleToInput } from "@/lib/income/pay-periods";
import {
  addDays,
  buildPlannedMaterializedSet,
  buildRecurringMaterializedSet,
  isPlannedExpenseMaterialized,
  isRecurringOccurrenceMaterialized,
} from "./materialization";

export interface PayableFutureItem {
  key: string;
  sourceType: "recurring" | "planned";
  recurringId?: string;
  plannedExpenseId?: string;
  scheduledDate: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  tags: string[];
  isSubscription: boolean;
}

interface GetUpcomingPayableItemsInput {
  expenses: ExpenseWithTags[];
  recurringExpenses: RecurringExpenseWithTags[];
  plannedExpenses: PlannedExpenseWithTags[];
  today?: string;
  horizonDays?: number;
}

export function getUpcomingPayableItems({
  expenses,
  recurringExpenses,
  plannedExpenses,
  today = new Date().toISOString().slice(0, 10),
  horizonDays = 30,
}: GetUpcomingPayableItemsInput): PayableFutureItem[] {
  const windowStart = today;
  const windowEnd = addDays(today, horizonDays);
  const recurringMaterialized = buildRecurringMaterializedSet(expenses);
  const plannedMaterialized = buildPlannedMaterializedSet(expenses);
  const items: PayableFutureItem[] = [];

  for (const recurring of recurringExpenses) {
    if (recurring.lastPaymentDate && windowStart > recurring.lastPaymentDate) {
      continue;
    }

    const dueDates = getPayDatesInRange(
      scheduleToInput(recurring),
      addDays(windowStart, 1),
      windowEnd,
    );

    for (const dueDate of dueDates) {
      if (dueDate <= today) {
        continue;
      }

      if (
        recurring.lastPaymentDate &&
        dueDate > recurring.lastPaymentDate
      ) {
        continue;
      }

      if (
        isRecurringOccurrenceMaterialized(
          recurringMaterialized,
          recurring.id,
          dueDate,
        )
      ) {
        continue;
      }

      items.push({
        key: `recurring:${recurring.id}:${dueDate}`,
        sourceType: "recurring",
        recurringId: recurring.id,
        scheduledDate: dueDate,
        name: recurring.name,
        amount: recurring.amount,
        currency: recurring.currency,
        tags: recurring.tags,
        isSubscription: recurring.isSubscription,
      });
    }
  }

  for (const planned of plannedExpenses) {
    if (planned.date <= today || planned.date > windowEnd) {
      continue;
    }

    if (isPlannedExpenseMaterialized(plannedMaterialized, planned.id)) {
      continue;
    }

    items.push({
      key: `planned:${planned.id}:${planned.date}`,
      sourceType: "planned",
      plannedExpenseId: planned.id,
      scheduledDate: planned.date,
      name: planned.name,
      amount: planned.amount,
      currency: planned.currency,
      tags: planned.tags,
      isSubscription: false,
    });
  }

  return items.sort((a, b) => {
    const byDate = a.scheduledDate.localeCompare(b.scheduledDate);
    if (byDate !== 0) {
      return byDate;
    }
    return a.name.localeCompare(b.name);
  });
}
