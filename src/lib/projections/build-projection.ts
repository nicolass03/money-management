import { convertAmount, type ExchangeRates } from "@/lib/currency/convert";
import type { CurrencyCode } from "@/lib/db/schema";
import type {
  ExpenseWithTags,
  Income,
  IncomePaySchedule,
  RecurringExpenseWithTags,
} from "@/lib/db/schema";
import {
  getPayDatesInRange,
  getPeriodContaining,
  getProjectionPeriods,
  isDateInPeriod,
  scheduleToInput,
  type PayPeriod,
} from "@/lib/income/pay-periods";

export interface ProjectionExpenseItem {
  id?: number;
  recurringId?: number;
  name: string;
  date: string;
  amount: number;
  currency: CurrencyCode;
  originalAmount?: number;
  originalCurrency?: CurrencyCode;
  convertedAmount: number;
  tags: string[];
  isSubscription: boolean;
  projected: boolean;
}

export interface ProjectionRow {
  payDate: string;
  startDate: string;
  endDate: string;
  incomeTotal: number;
  expenseTotal: number;
  periodFree: number;
  cumulativeFree: number;
  expenseItems: ProjectionExpenseItem[];
  isPast: boolean;
}

interface BuildProjectionInput {
  primarySchedule: IncomePaySchedule;
  incomeEntries: Income[];
  expenses: ExpenseWithTags[];
  recurringExpenses: RecurringExpenseWithTags[];
  displayCurrency: CurrencyCode;
  rates: ExchangeRates;
  initialFreeMoney?: number;
  projectionStartDate?: string | null;
  today?: string;
}

function isOnOrAfterStartDate(date: string, startDate?: string | null): boolean {
  return !startDate || date >= startDate;
}

function toDisplay(
  amount: number,
  currency: CurrencyCode,
  displayCurrency: CurrencyCode,
  rates: ExchangeRates,
): number {
  return convertAmount(amount, currency, displayCurrency, rates);
}

function sumIncomeInPeriod(
  entries: Income[],
  period: PayPeriod,
  displayCurrency: CurrencyCode,
  rates: ExchangeRates,
  minDate?: string | null,
): number {
  return entries
    .filter(
      (entry) =>
        isDateInPeriod(entry.date, period) &&
        isOnOrAfterStartDate(entry.date, minDate),
    )
    .reduce(
      (sum, entry) =>
        sum + toDisplay(entry.amount, entry.currency, displayCurrency, rates),
      0,
    );
}

function materializedKey(recurringId: number, date: string): string {
  return `${recurringId}:${date}`;
}

export function getExpenseItemsInPeriod(
  expenseList: ExpenseWithTags[],
  recurringList: RecurringExpenseWithTags[],
  period: PayPeriod,
  displayCurrency: CurrencyCode,
  rates: ExchangeRates,
  today: string,
): ProjectionExpenseItem[] {
  const items: ProjectionExpenseItem[] = [];
  const materialized = new Set<string>();

  for (const expense of expenseList) {
    if (!isDateInPeriod(expense.date, period)) {
      continue;
    }

    if (expense.recurringId != null) {
      materialized.add(materializedKey(expense.recurringId, expense.date));
    }

    const recurringSource =
      expense.recurringId != null
        ? recurringList.find((r) => r.id === expense.recurringId)
        : undefined;

    items.push({
      id: expense.id,
      recurringId: expense.recurringId ?? undefined,
      name: expense.name,
      date: expense.date,
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
      convertedAmount: toDisplay(
        expense.amount,
        expense.currency,
        displayCurrency,
        rates,
      ),
      tags: expense.tags,
      isSubscription: expense.isSubscription,
      projected: false,
    });
  }

  for (const recurring of recurringList) {
    const dueDates = getPayDatesInRange(
      scheduleToInput(recurring),
      period.startDate,
      period.endDate,
    );

    for (const dueDate of dueDates) {
      if (dueDate <= today) {
        continue;
      }

      if (materialized.has(materializedKey(recurring.id, dueDate))) {
        continue;
      }

      items.push({
        recurringId: recurring.id,
        name: recurring.name,
        date: dueDate,
        amount: recurring.amount,
        currency: recurring.currency,
        convertedAmount: toDisplay(
          recurring.amount,
          recurring.currency,
          displayCurrency,
          rates,
        ),
        tags: recurring.tags,
        isSubscription: recurring.isSubscription,
        projected: true,
      });
    }
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export interface CurrentPeriodExpenses {
  period: PayPeriod;
  items: ProjectionExpenseItem[];
  isPast: boolean;
}

export function getCurrentPeriodExpenses({
  primarySchedule,
  expenses,
  recurringExpenses,
  displayCurrency,
  rates,
  today = new Date().toISOString().slice(0, 10),
}: {
  primarySchedule: IncomePaySchedule;
  expenses: ExpenseWithTags[];
  recurringExpenses: RecurringExpenseWithTags[];
  displayCurrency: CurrencyCode;
  rates: ExchangeRates;
  today?: string;
}): CurrentPeriodExpenses {
  const scheduleInput = scheduleToInput(primarySchedule);
  const period = getPeriodContaining(scheduleInput, today);
  const isPast = period.payDate < today;
  const items = getExpenseItemsInPeriod(
    expenses,
    recurringExpenses,
    period,
    displayCurrency,
    rates,
    today,
  );

  return { period, items, isPast };
}

export function buildProjectionRows({
  primarySchedule,
  incomeEntries,
  expenses,
  recurringExpenses,
  displayCurrency,
  rates,
  initialFreeMoney = 0,
  projectionStartDate = null,
  today = new Date().toISOString().slice(0, 10),
}: BuildProjectionInput): ProjectionRow[] {
  const scheduleInput = scheduleToInput(primarySchedule);
  const periods = getProjectionPeriods(
    scheduleInput,
    today,
    projectionStartDate,
  );

  let cumulativeFree = initialFreeMoney;

  return periods.map((period) => {
    const isPast = period.payDate < today;
    const incomeTotal = sumIncomeInPeriod(
      incomeEntries,
      period,
      displayCurrency,
      rates,
      projectionStartDate,
    );

    const expenseItems = getExpenseItemsInPeriod(
      expenses,
      recurringExpenses,
      period,
      displayCurrency,
      rates,
      today,
    ).filter((item) => isOnOrAfterStartDate(item.date, projectionStartDate));

    const expenseTotal = expenseItems.reduce(
      (sum, item) => sum + item.convertedAmount,
      0,
    );
    const periodFree = incomeTotal - expenseTotal;
    cumulativeFree += periodFree;

    return {
      payDate: period.payDate,
      startDate: period.startDate,
      endDate: period.endDate,
      incomeTotal,
      expenseTotal,
      periodFree,
      cumulativeFree,
      expenseItems,
      isPast,
    };
  });
}
