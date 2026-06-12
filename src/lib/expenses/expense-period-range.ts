import { convertAmount, type ExchangeRates } from "@/lib/currency/convert";
import type {
  BudgetWithTags,
  CurrencyCode,
  ExpenseWithTags,
  IncomePaySchedule,
  PlannedExpenseWithTags,
  RecurringExpenseWithTags,
} from "@/lib/db/schema";
import {
  getPeriodContaining,
  scheduleToInput,
  type PayPeriod,
} from "@/lib/income/pay-periods";
import { recurringDueDate } from "@/lib/projections/materialization";
import {
  getExpenseItemsInPeriod,
  type ProjectionExpenseItem,
} from "@/lib/projections/build-projection";

export type ExpensePeriodKey = "last-period" | "last-month" | "last-3-months";

export const EXPENSE_PERIOD_OPTIONS: { key: ExpensePeriodKey; label: string }[] = [
  { key: "last-period", label: "last period" },
  { key: "last-month", label: "last month" },
  { key: "last-3-months", label: "last 3 months" },
];

export interface ExpensePeriodView {
  period: PayPeriod;
  items: ProjectionExpenseItem[];
  isPayPeriod: boolean;
}

function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const totalMonths = y * 12 + (m - 1) + months;
  const newY = Math.floor(totalMonths / 12);
  const newM = (totalMonths % 12) + 1;
  const daysInMonth = new Date(newY, newM, 0).getDate();
  const newD = Math.min(d, daysInMonth);
  return `${newY}-${String(newM).padStart(2, "0")}-${String(newD).padStart(2, "0")}`;
}

function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate;
}

function toProjectionItem(
  expense: ExpenseWithTags,
  recurringList: RecurringExpenseWithTags[],
  displayCurrency: CurrencyCode,
  rates: ExchangeRates,
): ProjectionExpenseItem {
  const recurringSource =
    expense.recurringId != null
      ? recurringList.find((r) => r.id === expense.recurringId)
      : undefined;

  const dueDate =
    expense.scheduledDate ??
    (expense.recurringId != null ? recurringDueDate(expense) : undefined);

  return {
    id: expense.id,
    recurringId: expense.recurringId ?? undefined,
    plannedExpenseId: expense.plannedExpenseId ?? undefined,
    name: expense.name,
    date: expense.date,
    scheduledDate: dueDate !== expense.date ? dueDate : undefined,
    amount: expense.amount,
    currency: expense.currency,
    originalAmount:
      recurringSource && !expense.amountOverridden
        ? recurringSource.amount
        : undefined,
    originalCurrency:
      recurringSource && !expense.amountOverridden
        ? recurringSource.currency
        : undefined,
    convertedAmount: convertAmount(
      expense.amount,
      expense.currency,
      displayCurrency,
      rates,
    ),
    tags: expense.tags,
    isSubscription: expense.isSubscription,
    projected: false,
  };
}

function getActualExpensesInDateRange(
  expenses: ExpenseWithTags[],
  recurringList: RecurringExpenseWithTags[],
  startDate: string,
  endDate: string,
  displayCurrency: CurrencyCode,
  rates: ExchangeRates,
): ProjectionExpenseItem[] {
  return expenses
    .filter((expense) => isDateInRange(expense.date, startDate, endDate))
    .map((expense) =>
      toProjectionItem(expense, recurringList, displayCurrency, rates),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function resolveExpensePeriodDates(
  periodKey: ExpensePeriodKey,
  primarySchedule: IncomePaySchedule | null,
  today: string = new Date().toISOString().slice(0, 10),
): PayPeriod | null {
  if (periodKey === "last-period") {
    if (!primarySchedule) {
      return null;
    }

    return getPeriodContaining(scheduleToInput(primarySchedule), today);
  }

  const monthsBack = periodKey === "last-month" ? 1 : 3;
  return {
    payDate: today,
    startDate: addMonths(today, -monthsBack),
    endDate: today,
  };
}

export function filterExpensesByPeriod(
  expenses: ExpenseWithTags[],
  periodKey: ExpensePeriodKey,
  primarySchedule: IncomePaySchedule | null,
  today: string,
): ExpenseWithTags[] {
  const period = resolveExpensePeriodDates(periodKey, primarySchedule, today);
  if (!period) {
    return [];
  }

  return expenses.filter((expense) =>
    isDateInRange(expense.date, period.startDate, period.endDate),
  );
}

export function getExpensePeriodView({
  periodKey,
  primarySchedule,
  expenses,
  recurringExpenses,
  plannedExpenses,
  budgets = [],
  displayCurrency,
  rates,
  today = new Date().toISOString().slice(0, 10),
}: {
  periodKey: ExpensePeriodKey;
  primarySchedule: IncomePaySchedule | null;
  expenses: ExpenseWithTags[];
  recurringExpenses: RecurringExpenseWithTags[];
  plannedExpenses: PlannedExpenseWithTags[];
  budgets?: BudgetWithTags[];
  displayCurrency: CurrencyCode;
  rates: ExchangeRates;
  today?: string;
}): ExpensePeriodView | null {
  const period = resolveExpensePeriodDates(periodKey, primarySchedule, today);
  if (!period) {
    return null;
  }

  if (periodKey === "last-period") {
    const items = getExpenseItemsInPeriod(
      expenses,
      recurringExpenses,
      plannedExpenses,
      period,
      displayCurrency,
      rates,
      today,
      budgets,
      { includeBudgetSummaries: true },
    );

    return { period, items, isPayPeriod: true };
  }

  const items = getActualExpensesInDateRange(
    expenses,
    recurringExpenses,
    period.startDate,
    period.endDate,
    displayCurrency,
    rates,
  );

  return { period, items, isPayPeriod: false };
}
