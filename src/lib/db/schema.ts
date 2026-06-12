import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const payFrequencies = ["weekly", "biweekly", "monthly", "yearly"] as const;
export type PayFrequency = (typeof payFrequencies)[number];

export const currencies = ["eur", "usd", "cop"] as const;
export type CurrencyCode = (typeof currencies)[number];

export const incomeSources = ["scheduled", "manual"] as const;
export type IncomeSource = (typeof incomeSources)[number];

export const payFrequencyEnum = pgEnum("pay_frequency", payFrequencies);
export const currencyCodeEnum = pgEnum("currency_code", currencies);
export const incomeSourceEnum = pgEnum("income_source", incomeSources);

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

// Shares pay-schedule shape with income_pay_schedules; kept separate for domain FK clarity.
// pay_schedules merge deferred unless more schedule kinds are added.
export const recurringExpenses = pgTable("recurring_expenses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  anchorDate: date("anchor_date").notNull(),
  frequency: payFrequencyEnum("frequency").notNull(),
  amount: integer("amount").notNull(),
  currency: currencyCodeEnum("currency").notNull().default("usd"),
  isSubscription: boolean("is_subscription").notNull().default(false),
  lastPaymentDate: date("last_payment_date"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const recurringExpenseTags = pgTable(
  "recurring_expense_tags",
  {
    recurringExpenseId: integer("recurring_expense_id")
      .notNull()
      .references(() => recurringExpenses.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.recurringExpenseId, table.tagId] }),
  ],
);

export const plannedExpenses = pgTable("planned_expenses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: date("date").notNull(),
  amount: integer("amount").notNull(),
  currency: currencyCodeEnum("currency").notNull().default("usd"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

// Ledger row: materialized charge. Snapshot columns (isSubscription, amountOverridden)
// preserve values at insert time even if the recurring template changes later.
export const expenses = pgTable(
  "expenses",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    amount: integer("amount").notNull(),
    currency: currencyCodeEnum("currency").notNull().default("usd"),
    date: date("date").notNull(),
    scheduledDate: date("scheduled_date"),
    recurringId: integer("recurring_id").references(() => recurringExpenses.id, {
      onDelete: "cascade",
    }),
    plannedExpenseId: integer("planned_expense_id").references(
      () => plannedExpenses.id,
      { onDelete: "set null" },
    ),
    budgetId: integer("budget_id").references(() => budgets.id, {
      onDelete: "set null",
    }),
    amountOverridden: boolean("amount_overridden").notNull().default(false),
    isSubscription: boolean("is_subscription").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => [
    uniqueIndex("expenses_recurring_due_unique")
      .on(table.recurringId, sql`COALESCE(${table.scheduledDate}, ${table.date})`)
      .where(sql`${table.recurringId} IS NOT NULL`),
    uniqueIndex("expenses_planned_expense_id_unique")
      .on(table.plannedExpenseId)
      .where(sql`${table.plannedExpenseId} IS NOT NULL`),
    check(
      "expenses_budget_exclusive",
      sql`NOT (${table.budgetId} IS NOT NULL AND (${table.recurringId} IS NOT NULL OR ${table.plannedExpenseId} IS NOT NULL))`,
    ),
  ],
);

export const expenseTags = pgTable(
  "expense_tags",
  {
    expenseId: integer("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.expenseId, table.tagId] })],
);

export const plannedExpenseTags = pgTable(
  "planned_expense_tags",
  {
    plannedExpenseId: integer("planned_expense_id")
      .notNull()
      .references(() => plannedExpenses.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.plannedExpenseId, table.tagId] }),
  ],
);

export const budgets = pgTable(
  "budgets",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    amount: integer("amount").notNull(),
    currency: currencyCodeEnum("currency").notNull().default("usd"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => [
    check("budgets_amount_positive", sql`${table.amount} > 0`),
    check(
      "budgets_end_requires_start",
      sql`${table.endDate} IS NULL OR ${table.startDate} IS NOT NULL`,
    ),
    check(
      "budgets_end_after_start",
      sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`,
    ),
    check(
      "budgets_dates_both_or_neither",
      sql`(${table.startDate} IS NULL AND ${table.endDate} IS NULL) OR (${table.startDate} IS NOT NULL AND ${table.endDate} IS NOT NULL)`,
    ),
  ],
);

export const budgetTags = pgTable(
  "budget_tags",
  {
    budgetId: integer("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.budgetId, table.tagId] })],
);

// Income-side pay schedule template; see recurring_expenses for expense-side equivalent.
export const incomePaySchedules = pgTable("income_pay_schedules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  anchorDate: date("anchor_date").notNull(),
  frequency: payFrequencyEnum("frequency").notNull(),
  amount: integer("amount").notNull(),
  currency: currencyCodeEnum("currency").notNull().default("usd"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

// Ledger row: scheduled income copies name/amount/currency from the pay schedule at sync time.
export const income = pgTable("income", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  currency: currencyCodeEnum("currency").notNull().default("usd"),
  source: incomeSourceEnum("source").notNull(),
  date: date("date").notNull(),
  scheduleId: integer("schedule_id").references(() => incomePaySchedules.id),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const savings = pgTable("savings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  currency: currencyCodeEnum("currency").notNull().default("usd"),
  note: text("note"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const exchangeRateSnapshots = pgTable("exchange_rate_snapshots", {
  id: serial("id").primaryKey(),
  baseCurrency: currencyCodeEnum("base_currency").notNull().default("usd"),
  ratesJson: jsonb("rates_json").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: "string" }).notNull(),
});

// Singleton preferences row (id = 1). Multi-user tenancy deferred: add user_id + RLS when needed.
export const userSettings = pgTable("user_settings", {
  id: integer("id").primaryKey(),
  displayCurrency: currencyCodeEnum("display_currency").notNull().default("usd"),
  primaryScheduleId: integer("primary_schedule_id").references(
    () => incomePaySchedules.id,
  ),
  projectionInitialFreeMoney: integer("projection_initial_free_money")
    .notNull()
    .default(0),
  projectionStartDate: date("projection_start_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type RecurringExpense = typeof recurringExpenses.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type IncomePaySchedule = typeof incomePaySchedules.$inferSelect;
export type Income = typeof income.$inferSelect;
export type Saving = typeof savings.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type ExchangeRateSnapshot = typeof exchangeRateSnapshots.$inferSelect;

export type PlannedExpense = typeof plannedExpenses.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type ExpenseWithTags = Expense & { tags: string[] };
export type RecurringExpenseWithTags = RecurringExpense & { tags: string[] };
export type PlannedExpenseWithTags = PlannedExpense & { tags: string[] };
export type BudgetWithTags = Budget & { tags: string[]; spent: number };
