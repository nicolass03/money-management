import { and, desc, eq, isNull, or } from "drizzle-orm";
import {
  fetchExchangeRates,
  isRatesStale,
  parseCachedRates,
  serializeRates,
} from "@/lib/currency/fetch-rates";
import type { ExchangeRates } from "@/lib/currency/convert";
import {
  attachTagsToExpenses,
  attachTagsToPlannedExpenses,
  attachTagsToRecurringExpenses,
  getAllTagNames,
  setExpenseTags,
  setPlannedExpenseTags,
  setRecurringExpenseTags,
} from "@/lib/expenses/tags";
import { deleteScheduledIncome, syncScheduledIncome } from "@/lib/income/sync-scheduled-income";
import { db } from "./index";
import {
  expenses,
  income,
  incomePaySchedules,
  plannedExpenses,
  recurringExpenses,
  savings,
  userSettings,
  type CurrencyCode,
  type ExpenseWithTags,
  type PayFrequency,
  type PlannedExpenseWithTags,
  type RecurringExpenseWithTags,
} from "./schema";

export { getAllTagNames };

const SETTINGS_ID = 1;

export async function getExpenses() {
  return db.select().from(expenses).orderBy(desc(expenses.date));
}

export async function getExpensesWithTags(): Promise<ExpenseWithTags[]> {
  const rows = await getExpenses();
  return attachTagsToExpenses(rows);
}

export async function getExpenseById(id: number) {
  const [expense] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, id));
  return expense ?? null;
}

export async function createExpense(data: {
  name: string;
  amount: number;
  currency: CurrencyCode;
  tags: string[];
  date: string;
  isSubscription: boolean;
}) {
  const now = new Date().toISOString();
  const [expense] = await db
    .insert(expenses)
    .values({
      name: data.name,
      amount: data.amount,
      currency: data.currency,
      date: data.date,
      recurringId: null,
      amountOverridden: false,
      isSubscription: data.isSubscription,
      createdAt: now,
    })
    .returning();

  await setExpenseTags(expense.id, data.tags);
  return expense;
}

export async function updateExpenseAmount(id: number, amount: number) {
  const [expense] = await db
    .update(expenses)
    .set({
      amount,
      amountOverridden: true,
    })
    .where(eq(expenses.id, id))
    .returning();
  return expense ?? null;
}

export async function deleteExpense(id: number) {
  await db.delete(expenses).where(eq(expenses.id, id));
}

export async function getIncome() {
  return db.select().from(income).orderBy(desc(income.date));
}

export async function getIncomeById(id: number) {
  const [entry] = await db.select().from(income).where(eq(income.id, id));
  return entry ?? null;
}

export async function createIncome(data: {
  name: string;
  amount: number;
  currency: CurrencyCode;
  source: string;
  date: string;
}) {
  const now = new Date().toISOString();
  const [entry] = await db
    .insert(income)
    .values({
      name: data.name,
      amount: data.amount,
      currency: data.currency,
      source: data.source,
      date: data.date,
      scheduleId: null,
      createdAt: now,
    })
    .returning();
  return entry;
}

export async function updateIncome(
  id: number,
  data: {
    name: string;
    amount: number;
    currency: CurrencyCode;
    source: string;
    date: string;
  },
) {
  const [entry] = await db
    .update(income)
    .set({
      name: data.name,
      amount: data.amount,
      currency: data.currency,
      source: data.source,
      date: data.date,
    })
    .where(eq(income.id, id))
    .returning();
  return entry ?? null;
}

export async function deleteIncome(id: number) {
  await db.delete(income).where(eq(income.id, id));
}

export async function getIncomePaySchedules() {
  return db
    .select()
    .from(incomePaySchedules)
    .orderBy(incomePaySchedules.name);
}

export async function getIncomePayScheduleById(id: number) {
  const [schedule] = await db
    .select()
    .from(incomePaySchedules)
    .where(eq(incomePaySchedules.id, id));
  return schedule ?? null;
}

export async function getRecurringExpenses() {
  return db
    .select()
    .from(recurringExpenses)
    .orderBy(recurringExpenses.name);
}

export async function getRecurringExpensesWithTags(): Promise<RecurringExpenseWithTags[]> {
  const rows = await getRecurringExpenses();
  return attachTagsToRecurringExpenses(rows);
}

export async function getRecurringExpenseById(id: number) {
  const [recurring] = await db
    .select()
    .from(recurringExpenses)
    .where(eq(recurringExpenses.id, id));
  return recurring ?? null;
}

export async function getPlannedExpenses() {
  return db
    .select()
    .from(plannedExpenses)
    .orderBy(plannedExpenses.date);
}

export async function getPlannedExpensesWithTags(): Promise<PlannedExpenseWithTags[]> {
  const rows = await getPlannedExpenses();
  return attachTagsToPlannedExpenses(rows);
}

export async function getPlannedExpenseById(id: number) {
  const [planned] = await db
    .select()
    .from(plannedExpenses)
    .where(eq(plannedExpenses.id, id));
  return planned ?? null;
}

async function ensureUserSettings() {
  const [existing] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.id, SETTINGS_ID));

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const [created] = await db
    .insert(userSettings)
    .values({
      id: SETTINGS_ID,
      displayCurrency: "usd",
      updatedAt: now,
    })
    .returning();
  return created;
}

export async function getUserSettings() {
  return ensureUserSettings();
}

export async function updateUserSettings(data: {
  displayCurrency?: CurrencyCode;
  primaryScheduleId?: number | null;
  projectionInitialFreeMoney?: number;
  projectionStartDate?: string | null;
}) {
  const now = new Date().toISOString();
  const [updated] = await db
    .update(userSettings)
    .set({
      ...data,
      updatedAt: now,
    })
    .where(eq(userSettings.id, SETTINGS_ID))
    .returning();
  return updated;
}

export async function saveExchangeRates(rates: ExchangeRates) {
  const now = new Date().toISOString();
  await ensureUserSettings();
  const [updated] = await db
    .update(userSettings)
    .set({
      exchangeRatesJson: serializeRates(rates),
      updatedAt: now,
    })
    .where(eq(userSettings.id, SETTINGS_ID))
    .returning();
  return updated;
}

export async function getExchangeRates(
  options: { forceRefresh?: boolean } = {},
): Promise<ExchangeRates> {
  const settings = await ensureUserSettings();
  const cached = parseCachedRates(settings.exchangeRatesJson);

  if (
    cached &&
    !options.forceRefresh &&
    !isRatesStale(cached.fetchedAt)
  ) {
    return cached;
  }

  try {
    const fresh = await fetchExchangeRates();
    await saveExchangeRates(fresh);
    return fresh;
  } catch {
    if (cached) {
      return cached;
    }
    throw new Error("unable to fetch exchange rates");
  }
}

export async function createIncomePaySchedule(data: {
  name: string;
  anchorDate: string;
  frequency: PayFrequency;
  amount: number;
  currency: CurrencyCode;
}) {
  const now = new Date().toISOString();
  const [schedule] = await db
    .insert(incomePaySchedules)
    .values({
      name: data.name,
      anchorDate: data.anchorDate,
      frequency: data.frequency,
      amount: data.amount,
      currency: data.currency,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  await syncScheduledIncome(schedule);
  return schedule;
}

export async function updateIncomePaySchedule(
  id: number,
  data: {
    name: string;
    anchorDate: string;
    frequency: PayFrequency;
    amount: number;
    currency: CurrencyCode;
  },
) {
  const [schedule] = await db
    .update(incomePaySchedules)
    .set({
      name: data.name,
      anchorDate: data.anchorDate,
      frequency: data.frequency,
      amount: data.amount,
      currency: data.currency,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(incomePaySchedules.id, id))
    .returning();

  if (schedule) {
    await syncScheduledIncome(schedule);
  }

  return schedule ?? null;
}

export async function deleteIncomePaySchedule(id: number) {
  await deleteScheduledIncome(id);
  await db.update(income).set({ scheduleId: null }).where(eq(income.scheduleId, id));
  await db
    .update(userSettings)
    .set({ primaryScheduleId: null })
    .where(eq(userSettings.primaryScheduleId, id));
  await db.delete(incomePaySchedules).where(eq(incomePaySchedules.id, id));
}

export async function createRecurringExpense(data: {
  name: string;
  anchorDate: string;
  frequency: PayFrequency;
  amount: number;
  currency: CurrencyCode;
  tags: string[];
  isSubscription: boolean;
  lastPaymentDate: string | null;
}) {
  const now = new Date().toISOString();
  const [recurring] = await db
    .insert(recurringExpenses)
    .values({
      name: data.name,
      anchorDate: data.anchorDate,
      frequency: data.frequency,
      amount: data.amount,
      currency: data.currency,
      isSubscription: data.isSubscription,
      lastPaymentDate: data.lastPaymentDate,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await setRecurringExpenseTags(recurring.id, data.tags);
  return recurring;
}

export async function updateRecurringExpense(
  id: number,
  data: {
    name: string;
    anchorDate: string;
    frequency: PayFrequency;
    amount: number;
    currency: CurrencyCode;
    tags: string[];
    isSubscription: boolean;
    lastPaymentDate: string | null;
  },
) {
  const [recurring] = await db
    .update(recurringExpenses)
    .set({
      name: data.name,
      anchorDate: data.anchorDate,
      frequency: data.frequency,
      amount: data.amount,
      currency: data.currency,
      isSubscription: data.isSubscription,
      lastPaymentDate: data.lastPaymentDate,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(recurringExpenses.id, id))
    .returning();

  if (recurring) {
    await setRecurringExpenseTags(id, data.tags);
  }

  return recurring ?? null;
}

export async function deleteRecurringExpense(id: number) {
  await db.delete(expenses).where(eq(expenses.recurringId, id));
  await db.delete(recurringExpenses).where(eq(recurringExpenses.id, id));
}

export async function createPlannedExpense(data: {
  name: string;
  date: string;
  amount: number;
  currency: CurrencyCode;
  tags: string[];
}) {
  const now = new Date().toISOString();
  const [planned] = await db
    .insert(plannedExpenses)
    .values({
      name: data.name,
      date: data.date,
      amount: data.amount,
      currency: data.currency,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await setPlannedExpenseTags(planned.id, data.tags);
  return planned;
}

export async function updatePlannedExpense(
  id: number,
  data: {
    name: string;
    date: string;
    amount: number;
    currency: CurrencyCode;
    tags: string[];
  },
) {
  const [planned] = await db
    .update(plannedExpenses)
    .set({
      name: data.name,
      date: data.date,
      amount: data.amount,
      currency: data.currency,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(plannedExpenses.id, id))
    .returning();

  if (planned) {
    await setPlannedExpenseTags(id, data.tags);
  }

  return planned ?? null;
}

export async function deletePlannedExpense(id: number) {
  await db.delete(plannedExpenses).where(eq(plannedExpenses.id, id));
}

export async function getExpenseByRecurringAndDueDate(
  recurringId: number,
  dueDate: string,
) {
  const [expense] = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.recurringId, recurringId),
        or(
          eq(expenses.scheduledDate, dueDate),
          and(isNull(expenses.scheduledDate), eq(expenses.date, dueDate)),
        ),
      ),
    );
  return expense ?? null;
}

export async function getExpenseByPlannedId(plannedExpenseId: number) {
  const [expense] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.plannedExpenseId, plannedExpenseId));
  return expense ?? null;
}

export async function createEarlyPaidExpense(data: {
  name: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  scheduledDate: string;
  recurringId?: number | null;
  plannedExpenseId?: number | null;
  amountOverridden: boolean;
  isSubscription: boolean;
}) {
  const now = new Date().toISOString();
  const [expense] = await db
    .insert(expenses)
    .values({
      name: data.name,
      amount: data.amount,
      currency: data.currency,
      date: data.date,
      scheduledDate: data.scheduledDate,
      recurringId: data.recurringId ?? null,
      plannedExpenseId: data.plannedExpenseId ?? null,
      amountOverridden: data.amountOverridden,
      isSubscription: data.isSubscription,
      createdAt: now,
    })
    .returning();
  return expense;
}

export async function getSavings() {
  return db.select().from(savings).orderBy(desc(savings.date));
}

export interface MoneyContext {
  displayCurrency: CurrencyCode;
  rates: ExchangeRates;
}

export async function getMoneyContext(
  options: { forceRefreshRates?: boolean } = {},
): Promise<MoneyContext> {
  const [settings, rates] = await Promise.all([
    getUserSettings(),
    getExchangeRates({ forceRefresh: options.forceRefreshRates }),
  ]);

  return {
    displayCurrency: settings.displayCurrency,
    rates,
  };
}
