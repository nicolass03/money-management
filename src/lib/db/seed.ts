import { count, eq } from "drizzle-orm";
import {
  setExpenseTags,
  setRecurringExpenseTags,
} from "@/lib/expenses/tags";
import { syncScheduledIncome } from "@/lib/income/sync-scheduled-income";
import { db } from "./index";
import {
  expenses,
  income,
  incomePaySchedules,
  recurringExpenses,
  savings,
  userSettings,
} from "./schema";

const now = new Date().toISOString();

async function tableHasRows(
  table:
    | typeof expenses
    | typeof income
    | typeof savings
    | typeof incomePaySchedules
    | typeof recurringExpenses,
) {
  const [row] = await db.select({ value: count() }).from(table);
  return row.value > 0;
}

async function hasExistingUserData() {
  return (
    (await tableHasRows(expenses)) ||
    (await tableHasRows(income)) ||
    (await tableHasRows(savings)) ||
    (await tableHasRows(incomePaySchedules)) ||
    (await tableHasRows(recurringExpenses))
  );
}

export async function seedDatabase(): Promise<boolean> {
  if (await hasExistingUserData()) {
    return false;
  }

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.id, 1));
  if (!settings) {
    await db.insert(userSettings).values({
      id: 1,
      displayCurrency: "usd",
      updatedAt: now,
    });
  }

  const [expenseCount] = await db.select({ value: count() }).from(expenses);
  if (expenseCount.value === 0) {
    const seededExpenses = await db
      .insert(expenses)
      .values([
        {
          name: "Groceries",
          amount: 8450,
          currency: "usd",
          date: "2026-06-01",
          amountOverridden: false,
          isSubscription: false,
          createdAt: now,
        },
        {
          name: "Gas",
          amount: 5200,
          currency: "usd",
          date: "2026-06-03",
          amountOverridden: false,
          isSubscription: false,
          createdAt: now,
        },
        {
          name: "Electric bill",
          amount: 7800,
          currency: "usd",
          date: "2026-06-05",
          amountOverridden: false,
          isSubscription: false,
          createdAt: now,
        },
      ])
      .returning();

    await setExpenseTags(seededExpenses[0].id, ["food"]);
    await setExpenseTags(seededExpenses[1].id, ["transport"]);
    await setExpenseTags(seededExpenses[2].id, ["utilities"]);
  }

  const [recurringCount] = await db
    .select({ value: count() })
    .from(recurringExpenses);
  if (recurringCount.value === 0) {
    const seededRecurring = await db
      .insert(recurringExpenses)
      .values([
        {
          name: "Netflix",
          anchorDate: "2026-06-01",
          frequency: "monthly",
          amount: 1599,
          currency: "usd",
          isSubscription: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: "Spotify",
          anchorDate: "2026-06-01",
          frequency: "monthly",
          amount: 1099,
          currency: "usd",
          isSubscription: true,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .returning();

    await setRecurringExpenseTags(seededRecurring[0].id, [
      "entertainment",
      "streaming",
    ]);
    await setRecurringExpenseTags(seededRecurring[1].id, [
      "entertainment",
      "streaming",
    ]);
  }

  const [scheduleCount] = await db
    .select({ value: count() })
    .from(incomePaySchedules);
  if (scheduleCount.value === 0) {
    const [schedule] = await db
      .insert(incomePaySchedules)
      .values({
        name: "Salary",
        anchorDate: "2026-06-11",
        frequency: "biweekly",
        amount: 450000,
        currency: "usd",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    await syncScheduledIncome(schedule);
  }

  const [savingsCount] = await db.select({ value: count() }).from(savings);
  if (savingsCount.value === 0) {
    await db.insert(savings).values([
      {
        name: "Emergency fund",
        amount: 50000,
        currency: "usd",
        note: "Monthly contribution",
        date: "2026-06-01",
        createdAt: now,
      },
    ]);
  }

  return true;
}
