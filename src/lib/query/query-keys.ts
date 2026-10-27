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
  upcomingPayableAll: () => ["upcomingPayable"] as const,
  recurringExpenses: () => ["recurringExpenses"] as const,
  subscriptionReminders: () => ["subscriptionReminders"] as const,
  plannedExpenses: () => ["plannedExpenses"] as const,
  budgets: () => ["budgets"] as const,
  budgetExpenses: (budgetId: string) => ["budgetExpenses", budgetId] as const,
  budgetExpensesAll: () => ["budgetExpenses"] as const,
  income: () => ["income"] as const,
  schedules: () => ["schedules"] as const,
  accounts: () => ["accounts"] as const,
  transfers: () => ["transfers"] as const,
  recurringTransfers: () => ["recurringTransfers"] as const,
  projections: () => ["projections", localTodayIso()] as const,
  projectionsAll: () => ["projections"] as const,
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
  | "preferenceChange"
  | "accountChange"
  | "transferChange"
  | "moneyContextRefresh"
  | "subscriptionReminderChange";

type QueryKey = readonly unknown[];

// Built once at module load, so keys here must be date-agnostic prefixes (`*All`): a key that
// embeds `localTodayIso()` would stop matching after midnight in a long-lived tab.
const invalidationMap: Record<InvalidationEvent, QueryKey[]> = {
  expenseChange: [
    queryKeys.expenses(),
    queryKeys.projectionsAll(),
    queryKeys.projectionPeriodItemsAll(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayableAll(),
    queryKeys.reportSummaries(),
    queryKeys.accounts(),
  ],
  recurringChange: [
    queryKeys.recurringExpenses(),
    queryKeys.subscriptionReminders(),
    queryKeys.expenses(),
    queryKeys.projectionsAll(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayableAll(),
    // Materialized recurring charges land on an account, so balances can change.
    queryKeys.accounts(),
  ],
  plannedChange: [
    queryKeys.plannedExpenses(),
    queryKeys.expenses(),
    queryKeys.projectionsAll(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayableAll(),
    queryKeys.accounts(),
  ],
  budgetChange: [
    queryKeys.budgets(),
    queryKeys.budgetExpensesAll(),
    queryKeys.expenses(),
    queryKeys.projectionsAll(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayableAll(),
  ],
  incomeChange: [
    queryKeys.income(),
    queryKeys.projectionsAll(),
    queryKeys.reportSummaries(),
    queryKeys.accounts(),
  ],
  scheduleChange: [
    queryKeys.schedules(),
    queryKeys.income(),
    queryKeys.projectionsAll(),
    queryKeys.projectionPeriodItemsAll(),
    queryKeys.settings(),
    queryKeys.expensePeriodViews(),
    queryKeys.accounts(),
  ],
  settingsChange: [
    queryKeys.settings(),
    queryKeys.moneyContext(),
    queryKeys.projectionsAll(),
    queryKeys.projectionPeriodItemsAll(),
    queryKeys.income(),
    queryKeys.expenses(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayableAll(),
    // Account balances only count activity from the projection start date onward.
    queryKeys.accounts(),
  ],
  // Language / theme only change the settings row — no derived data.
  preferenceChange: [queryKeys.settings()],
  accountChange: [
    queryKeys.accounts(),
    queryKeys.projectionsAll(),
    queryKeys.expenses(),
    queryKeys.income(),
  ],
  // Transfers only move money between accounts: balances change, spend/income/projections don't.
  transferChange: [
    queryKeys.transfers(),
    queryKeys.recurringTransfers(),
    queryKeys.accounts(),
  ],
  moneyContextRefresh: [queryKeys.moneyContext()],
  subscriptionReminderChange: [queryKeys.subscriptionReminders()],
};

export function keysForEvent(event: InvalidationEvent): QueryKey[] {
  return invalidationMap[event];
}
