import { localTodayIso } from "@/lib/date/local-today";

export const queryKeys = {
  settings: () => ["settings"] as const,
  // The money context is a single cached resource; forced exchange-rate refreshes go through
  // refreshExchangeRatesMutation (a direct fetch + invalidation), not a distinct query key, so the
  // key must stay stable — baking forceRefresh in would fork the cache into two entries.
  moneyContext: () => ["moneyContext"] as const,
  expenses: () => ["expenses"] as const,
  expensePeriodView: (period: string) =>
    ["expensePeriodView", period, true, localTodayIso()] as const,
  expensePeriodViews: () => ["expensePeriodView"] as const,
  upcomingPayable: (horizonDays?: number) =>
    ["upcomingPayable", horizonDays ?? 30, localTodayIso()] as const,
  recurringExpenses: () => ["recurringExpenses"] as const,
  subscriptionReminders: () => ["subscriptionReminders"] as const,
  plannedExpenses: () => ["plannedExpenses"] as const,
  budgets: () => ["budgets"] as const,
  budgetExpenses: (budgetId: string) => ["budgetExpenses", budgetId] as const,
  income: () => ["income"] as const,
  schedules: () => ["schedules"] as const,
  accounts: () => ["accounts"] as const,
  projections: () => ["projections", localTodayIso()] as const,
  projectionPeriodItems: (payDate: string) =>
    ["projectionPeriodItems", payDate, localTodayIso()] as const,
  projectionPeriodItemsAll: () => ["projectionPeriodItems"] as const,
  tags: () => ["tags"] as const,
  savings: () => ["savings"] as const,
  reportSummaries: () => ["reportSummary"] as const,
  reportSummary: (from: string, to: string) =>
    ["reportSummary", from, to] as const,
};

export type InvalidationEvent =
  | "expenseChange"
  | "recurringChange"
  | "plannedChange"
  | "budgetChange"
  | "incomeChange"
  | "scheduleChange"
  | "settingsChange"
  | "accountChange"
  | "moneyContextRefresh"
  | "subscriptionReminderChange";

type QueryKey = readonly unknown[];

const invalidationMap: Record<InvalidationEvent, QueryKey[]> = {
  expenseChange: [
    queryKeys.expenses(),
    queryKeys.projections(),
    queryKeys.projectionPeriodItemsAll(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayable(),
    queryKeys.reportSummaries(),
    queryKeys.accounts(),
  ],
  recurringChange: [
    queryKeys.recurringExpenses(),
    queryKeys.subscriptionReminders(),
    queryKeys.expenses(),
    queryKeys.projections(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayable(),
    // Materialized recurring charges land on an account, so balances can change.
    queryKeys.accounts(),
  ],
  plannedChange: [
    queryKeys.plannedExpenses(),
    queryKeys.expenses(),
    queryKeys.projections(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayable(),
    queryKeys.accounts(),
  ],
  budgetChange: [
    queryKeys.budgets(),
    queryKeys.expenses(),
    queryKeys.projections(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayable(),
  ],
  incomeChange: [
    queryKeys.income(),
    queryKeys.projections(),
    queryKeys.reportSummaries(),
    queryKeys.accounts(),
  ],
  scheduleChange: [
    queryKeys.schedules(),
    queryKeys.income(),
    queryKeys.projections(),
    queryKeys.projectionPeriodItemsAll(),
    queryKeys.settings(),
    queryKeys.expensePeriodViews(),
    queryKeys.accounts(),
  ],
  settingsChange: [
    queryKeys.settings(),
    queryKeys.moneyContext(),
    queryKeys.projections(),
    queryKeys.projectionPeriodItemsAll(),
    queryKeys.income(),
    queryKeys.expenses(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayable(),
    // Account balances only count activity from the projection start date onward.
    queryKeys.accounts(),
  ],
  accountChange: [
    queryKeys.accounts(),
    queryKeys.projections(),
    queryKeys.expenses(),
    queryKeys.income(),
  ],
  moneyContextRefresh: [queryKeys.moneyContext()],
  subscriptionReminderChange: [queryKeys.subscriptionReminders()],
};

export function keysForEvent(event: InvalidationEvent): QueryKey[] {
  return invalidationMap[event];
}
