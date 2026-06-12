import type {
  CurrencyCode,
  IncomeSource,
  PayFrequency,
} from "./constants";

export type { CurrencyCode, IncomeSource, PayFrequency };

export type { PayPeriod } from "@/lib/income/pay-periods";

export interface UserSettings {
  id: string;
  displayCurrency: CurrencyCode;
  primaryScheduleId: string | null;
  projectionInitialFreeMoney: number;
  projectionStartDate: string | null;
  updatedAt: string;
}

export interface IncomePaySchedule {
  id: string;
  name: string;
  anchorDate: string;
  frequency: PayFrequency;
  amount: number;
  currency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  source: IncomeSource;
  date: string;
  scheduleId: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  scheduledDate: string | null;
  recurringId: string | null;
  plannedExpenseId: string | null;
  budgetId: string | null;
  amountOverridden: boolean;
  isSubscription: boolean;
  createdAt: string;
}

export type ExpenseWithTags = Expense & { tags: string[] };

export interface RecurringExpense {
  id: string;
  name: string;
  anchorDate: string;
  frequency: PayFrequency;
  amount: number;
  currency: CurrencyCode;
  isSubscription: boolean;
  lastPaymentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RecurringExpenseWithTags = RecurringExpense & { tags: string[] };

export interface PlannedExpense {
  id: string;
  name: string;
  date: string;
  amount: number;
  currency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
}

export type PlannedExpenseWithTags = PlannedExpense & { tags: string[] };

export interface Budget {
  id: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BudgetWithTags = Budget & { tags: string[]; spent: number };

export interface Saving {
  id: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  note: string | null;
  date: string;
  createdAt: string;
}

export interface ProjectionExpenseItem {
  id?: string;
  recurringId?: string;
  plannedExpenseId?: string;
  budgetId?: string;
  budgetTotal?: number;
  budgetSpent?: number;
  isBudgetSummary?: boolean;
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
