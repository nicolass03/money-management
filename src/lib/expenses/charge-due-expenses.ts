import { convertAmount } from "@/lib/currency/convert";
import {
  getExchangeRates,
  getMaterializedRecurringIdsForDueDate,
  getRecurringExpenses,
  getUserSettings,
} from "@/lib/db/queries";
import { db } from "@/lib/db/index";
import { expenses } from "@/lib/db/schema";
import { copyRecurringTagsToExpense } from "@/lib/expenses/tags";
import { getPayDatesInRange, scheduleToInput } from "@/lib/income/pay-periods";

export async function chargeDueExpensesForDate(
  date: string,
): Promise<{ created: number }> {
  const [rates, settings, recurringList, materializedIds] = await Promise.all([
    getExchangeRates(),
    getUserSettings(),
    getRecurringExpenses(),
    getMaterializedRecurringIdsForDueDate(date),
  ]);

  const displayCurrency = settings.displayCurrency;
  const now = new Date().toISOString();
  let created = 0;

  for (const recurring of recurringList) {
    if (recurring.lastPaymentDate && date > recurring.lastPaymentDate) {
      continue;
    }

    const dueDates = getPayDatesInRange(
      scheduleToInput(recurring),
      date,
      date,
    );

    if (dueDates.length === 0 || materializedIds.has(recurring.id)) {
      continue;
    }

    let amount = recurring.amount;
    let currency = recurring.currency;

    if (recurring.currency !== displayCurrency) {
      amount = convertAmount(
        recurring.amount,
        recurring.currency,
        displayCurrency,
        rates,
      );
      currency = displayCurrency;
    }

    await db.transaction(async (tx) => {
      const [expense] = await tx
        .insert(expenses)
        .values({
          name: recurring.name,
          amount,
          currency,
          date,
          recurringId: recurring.id,
          amountOverridden: false,
          isSubscription: recurring.isSubscription,
          createdAt: now,
        })
        .returning();

      await copyRecurringTagsToExpense(recurring.id, expense.id, tx);
    });

    materializedIds.add(recurring.id);
    created += 1;
  }

  return { created };
}
