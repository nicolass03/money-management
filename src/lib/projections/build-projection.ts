import { convertAmount, type ExchangeRates } from "@/lib/currency/convert";
import {
  budgetOverlapsPeriod,
  getBudgetProjectionAmount,
  getBudgetProjectionPeriodDate,
  isBudgetProjectionProjected,
  isDatedBudget,
} from "@/lib/budgets/budget-status";
import type {
  BudgetWithTags,
  CurrencyCode,
  ExpenseWithTags,
  Income,
  IncomePaySchedule,
  PlannedExpenseWithTags,
  ProjectionExpenseItem,
  ProjectionRow,
  RecurringExpenseWithTags,
} from "@/lib/types/domain";

export type { ProjectionExpenseItem, ProjectionRow };
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

interface BuildProjectionInput {
  primarySchedule: IncomePaySchedule;
  incomeEntries: Income[];
  expenses: ExpenseWithTags[];
  recurringExpenses: RecurringExpenseWithTags[];
  plannedExpenses: PlannedExpenseWithTags[];
  budgets?: BudgetWithTags[];
  displayCurrency: CurrencyCode;
  rates: ExchangeRates;
  initialFreeMoney?: number;
  projectionStartDate?: string | null;
  today?: string;
}

interface GetExpenseItemsOptions {
  includeBudgetSummaries?: boolean;
}

function sumBudgetSpent(
  budgetId: string,
  expenseList: ExpenseWithTags[],
): number {
  return expenseList
    .filter((expense) => expense.budgetId === budgetId)
    .reduce((sum, expense) => sum + expense.amount, 0);
}

function buildDatedBudgetIdSet(budgets: BudgetWithTags[]): Set<string> {
  return new Set(
    budgets.filter((budget) => isDatedBudget(budget)).map((budget) => budget.id),
  );
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
  budgets: BudgetWithTags[] = [],
  options: GetExpenseItemsOptions = {},
): ProjectionExpenseItem[] {
  const items: ProjectionExpenseItem[] = [];
  const recurringMaterialized = buildRecurringMaterializedSet(expenseList);
  const plannedMaterialized = buildPlannedMaterializedSet(expenseList);
  const datedBudgetIds = buildDatedBudgetIdSet(budgets);

  for (const expense of expenseList) {
    if (!isDateInPeriod(expense.date, period)) {
      continue;
    }

    if (expense.budgetId != null && datedBudgetIds.has(expense.budgetId)) {
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
      budgetId: expense.budgetId ?? undefined,
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

  if (!options.includeBudgetSummaries) {
    for (const budget of budgets) {
      if (!isDatedBudget(budget)) {
        continue;
      }

      const spent = budget.spent ?? sumBudgetSpent(budget.id, expenseList);
      const projectionAmount = getBudgetProjectionAmount(budget, spent, today);
      if (projectionAmount <= 0 && today > budget.endDate!) {
        continue;
      }

      const anchorDate = getBudgetProjectionPeriodDate(budget, today);
      if (!anchorDate || !isDateInPeriod(anchorDate, period)) {
        continue;
      }

      if (projectionAmount <= 0) {
        continue;
      }

      items.push({
        budgetId: budget.id,
        name: budget.name,
        date: anchorDate,
        amount: projectionAmount,
        currency: budget.currency,
        convertedAmount: toDisplay(
          projectionAmount,
          budget.currency,
          displayCurrency,
          rates,
        ),
        budgetTotal: budget.amount,
        budgetSpent: spent,
        isBudgetSummary: false,
        tags: budget.tags,
        isSubscription: false,
        projected: isBudgetProjectionProjected(budget, today),
      });
    }
  }

  if (options.includeBudgetSummaries) {
    for (const budget of budgets) {
      if (!isDatedBudget(budget)) {
        continue;
      }

      if (!budgetOverlapsPeriod(budget, period)) {
        continue;
      }

      const spent = budget.spent ?? sumBudgetSpent(budget.id, expenseList);
      const convertedSpent = toDisplay(
        spent,
        budget.currency,
        displayCurrency,
        rates,
      );

      items.push({
        budgetId: budget.id,
        name: budget.name,
        date: budget.startDate!,
        amount: spent,
        currency: budget.currency,
        convertedAmount: convertedSpent,
        budgetTotal: budget.amount,
        budgetSpent: spent,
        isBudgetSummary: true,
        tags: budget.tags,
        isSubscription: false,
        projected: false,
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
  plannedExpenses,
  budgets = [],
  displayCurrency,
  rates,
  today = new Date().toISOString().slice(0, 10),
}: {
  primarySchedule: IncomePaySchedule;
  expenses: ExpenseWithTags[];
  recurringExpenses: RecurringExpenseWithTags[];
  plannedExpenses: PlannedExpenseWithTags[];
  budgets?: BudgetWithTags[];
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
    budgets,
    { includeBudgetSummaries: true },
  );

  return { period, items, isPast };
}

export function buildProjectionRows({
  primarySchedule,
  incomeEntries,
  expenses,
  recurringExpenses,
  plannedExpenses,
  budgets = [],
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
      budgets,
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
