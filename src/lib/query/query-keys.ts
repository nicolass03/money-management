export const queryKeys = {
  settings: () => ["settings"] as const,
  moneyContext: (forceRefresh?: boolean) =>
    ["moneyContext", forceRefresh ?? false] as const,
  expenses: () => ["expenses"] as const,
  expensePeriodView: (period: string) =>
    ["expensePeriodView", period, true] as const,
  expensePeriodViews: () => ["expensePeriodView"] as const,
  upcomingPayable: (horizonDays?: number) =>
    ["upcomingPayable", horizonDays ?? 30] as const,
  recurringExpenses: () => ["recurringExpenses"] as const,
  subscriptionReminders: () => ["subscriptionReminders"] as const,
  plannedExpenses: () => ["plannedExpenses"] as const,
  budgets: () => ["budgets"] as const,
  budgetExpenses: (budgetId: string) => ["budgetExpenses", budgetId] as const,
  income: () => ["income"] as const,
  schedules: () => ["schedules"] as const,
  projections: () => ["projections"] as const,
  tags: () => ["tags"] as const,
  savings: () => ["savings"] as const,
};

export type InvalidationEvent =
  | "expenseChange"
  | "recurringChange"
  | "plannedChange"
  | "budgetChange"
  | "incomeChange"
  | "scheduleChange"
  | "settingsChange"
  | "moneyContextRefresh"
  | "subscriptionReminderChange";

type QueryKey = readonly unknown[];

const invalidationMap: Record<InvalidationEvent, QueryKey[]> = {
  expenseChange: [
    queryKeys.expenses(),
    queryKeys.projections(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayable(),
  ],
  recurringChange: [
    queryKeys.recurringExpenses(),
    queryKeys.subscriptionReminders(),
    queryKeys.expenses(),
    queryKeys.projections(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayable(),
  ],
  plannedChange: [
    queryKeys.plannedExpenses(),
    queryKeys.expenses(),
    queryKeys.projections(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayable(),
  ],
  budgetChange: [
    queryKeys.budgets(),
    queryKeys.expenses(),
    queryKeys.projections(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayable(),
  ],
  incomeChange: [queryKeys.income(), queryKeys.projections()],
  scheduleChange: [
    queryKeys.schedules(),
    queryKeys.income(),
    queryKeys.projections(),
    queryKeys.settings(),
    queryKeys.expensePeriodViews(),
  ],
  settingsChange: [
    queryKeys.settings(),
    queryKeys.moneyContext(),
    queryKeys.projections(),
    queryKeys.income(),
    queryKeys.expenses(),
    queryKeys.expensePeriodViews(),
    queryKeys.upcomingPayable(),
  ],
  moneyContextRefresh: [queryKeys.moneyContext()],
  subscriptionReminderChange: [queryKeys.subscriptionReminders()],
};

export function keysForEvent(event: InvalidationEvent): QueryKey[] {
  return invalidationMap[event];
}
