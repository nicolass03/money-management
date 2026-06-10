import { convertAmount, type ExchangeRates } from "@/lib/currency/convert";
import type { CurrencyCode } from "@/lib/db/schema";
import type {
  ExpenseWithTags,
  Income,
  IncomePaySchedule,
  PlannedExpenseWithTags,
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
import {
  buildPlannedMaterializedSet,
  buildRecurringMaterializedSet,
  isPlannedExpenseMaterialized,
  isRecurringOccurrenceMaterialized,
  recurringDueDate,
} from "./materialization";

export interface ProjectionExpenseItem {
  id?: number;
  recurringId?: number;
  plannedExpenseId?: number;
  name: string;
  date: string;
  scheduledDate?: string;
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
  plannedExpenses: PlannedExpenseWithTags[];
  displayCurrency: CurrencyCode;
  rates: ExchangeRates;
  initialFreeMoney?: number;
  projectionStartDate?: string | null;
  today?: string;
}

function isOnOrAfterStartDate(date: string, startDate?: string | null): boolean {
  return !startDate || date >= startDate;
}

function effectivePeriodStart(
  period: PayPeriod,
  projectionStartDate?: string | null,
): string {
  if (
    projectionStartDate &&
    projectionStartDate > period.startDate &&
    projectionStartDate <= period.endDate
  ) {
    return projectionStartDate;
  }
  return period.startDate;
}

function isOpeningPartialPeriod(
  period: PayPeriod,
  projectionStartDate?: string | null,
): boolean {
  return Boolean(
    projectionStartDate &&
      projectionStartDate > period.startDate &&
      projectionStartDate <= period.endDate,
  );
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
  maxDate?: string | null,
): number {
  return entries
    .filter(
      (entry) =>
        isDateInPeriod(entry.date, period) &&
        isOnOrAfterStartDate(entry.date, minDate) &&
        (!maxDate || entry.date <= maxDate),
    )
    .reduce(
      (sum, entry) =>
        sum + toDisplay(entry.amount, entry.currency, displayCurrency, rates),
      0,
    );
}

export function getExpenseItemsInPeriod(
  expenseList: ExpenseWithTags[],
  recurringList: RecurringExpenseWithTags[],
  plannedList: PlannedExpenseWithTags[],
  period: PayPeriod,
  displayCurrency: CurrencyCode,
  rates: ExchangeRates,
  today: string,
): ProjectionExpenseItem[] {
  const items: ProjectionExpenseItem[] = [];
  const recurringMaterialized = buildRecurringMaterializedSet(expenseList);
  const plannedMaterialized = buildPlannedMaterializedSet(expenseList);

  for (const expense of expenseList) {
    if (!isDateInPeriod(expense.date, period)) {
      continue;
    }

    const recurringSource =
      expense.recurringId != null
        ? recurringList.find((r) => r.id === expense.recurringId)
        : undefined;

    const dueDate =
      expense.scheduledDate ??
      (expense.recurringId != null ? recurringDueDate(expense) : undefined);

    items.push({
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

  for (const planned of plannedList) {
    if (!isDateInPeriod(planned.date, period)) {
      continue;
    }

    if (planned.date <= today) {
      continue;
    }

    if (isPlannedExpenseMaterialized(plannedMaterialized, planned.id)) {
      continue;
    }

    items.push({
      plannedExpenseId: planned.id,
      name: planned.name,
      date: planned.date,
      amount: planned.amount,
      currency: planned.currency,
      convertedAmount: toDisplay(
        planned.amount,
        planned.currency,
        displayCurrency,
        rates,
      ),
      tags: planned.tags,
      isSubscription: false,
      projected: true,
    });
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
  plannedExpenses,
  displayCurrency,
  rates,
  today = new Date().toISOString().slice(0, 10),
}: {
  primarySchedule: IncomePaySchedule;
  expenses: ExpenseWithTags[];
  recurringExpenses: RecurringExpenseWithTags[];
  plannedExpenses: PlannedExpenseWithTags[];
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
    plannedExpenses,
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
  plannedExpenses,
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

  let runningBalance = initialFreeMoney;

  return periods.map((period) => {
    const isPast = period.payDate < today;
    const periodStartDate = effectivePeriodStart(period, projectionStartDate);
    const openingPartial = isOpeningPartialPeriod(period, projectionStartDate);
    const minActivityDate = openingPartial
      ? projectionStartDate!
      : periodStartDate;

    const incomeTotal = openingPartial
      ? 0
      : sumIncomeInPeriod(
          incomeEntries,
          period,
          displayCurrency,
          rates,
          period.startDate,
        );

    const expenseItems = getExpenseItemsInPeriod(
      expenses,
      recurringExpenses,
      plannedExpenses,
      period,
      displayCurrency,
      rates,
      today,
    ).filter((item) => isOnOrAfterStartDate(item.date, minActivityDate));

    const expenseTotal = expenseItems.reduce(
      (sum, item) => sum + item.convertedAmount,
      0,
    );
    const periodFree = incomeTotal - expenseTotal;
    runningBalance += periodFree;

    const cumulativeFree = openingPartial
      ? initialFreeMoney
      : runningBalance;

    return {
      payDate: period.payDate,
      startDate: periodStartDate,
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
