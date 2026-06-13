export const queryKeys = {
  settings: () => ["settings"] as const,
  moneyContext: (forceRefresh?: boolean) =>
    ["moneyContext", forceRefresh ?? false] as const,
  expenses: () => ["expenses"] as const,
  recurringExpenses: () => ["recurringExpenses"] as const,
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
  | "moneyContextRefresh";

type QueryKey = readonly unknown[];

const invalidationMap: Record<InvalidationEvent, QueryKey[]> = {
  expenseChange: [queryKeys.expenses(), queryKeys.projections()],
  recurringChange: [
    queryKeys.recurringExpenses(),
    queryKeys.expenses(),
    queryKeys.projections(),
  ],
  plannedChange: [
    queryKeys.plannedExpenses(),
    queryKeys.expenses(),
    queryKeys.projections(),
  ],
  budgetChange: [
    queryKeys.budgets(),
    queryKeys.expenses(),
    queryKeys.projections(),
  ],
  incomeChange: [queryKeys.income(), queryKeys.projections()],
  scheduleChange: [
    queryKeys.schedules(),
    queryKeys.income(),
    queryKeys.projections(),
    queryKeys.settings(),
  ],
  settingsChange: [
    queryKeys.settings(),
    queryKeys.moneyContext(),
    queryKeys.projections(),
    queryKeys.income(),
    queryKeys.expenses(),
  ],
  moneyContextRefresh: [queryKeys.moneyContext()],
};

export function keysForEvent(event: InvalidationEvent): QueryKey[] {
  return invalidationMap[event];
}
