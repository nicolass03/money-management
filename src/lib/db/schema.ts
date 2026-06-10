import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const payFrequencies = ["biweekly", "monthly"] as const;
export type PayFrequency = (typeof payFrequencies)[number];

export const currencies = ["eur", "usd", "cop"] as const;
export type CurrencyCode = (typeof currencies)[number];

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: text("created_at").notNull(),
});

export const recurringExpenses = pgTable("recurring_expenses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  anchorDate: text("anchor_date").notNull(),
  frequency: text("frequency", { enum: payFrequencies }).notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency", { enum: currencies }).notNull().default("usd"),
  isSubscription: boolean("is_subscription").notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
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

export const expenses = pgTable(
  "expenses",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency", { enum: currencies }).notNull().default("usd"),
    date: text("date").notNull(),
    recurringId: integer("recurring_id").references(() => recurringExpenses.id, {
      onDelete: "cascade",
    }),
    amountOverridden: boolean("amount_overridden").notNull().default(false),
    isSubscription: boolean("is_subscription").notNull().default(false),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("expenses_recurring_id_date_unique")
      .on(table.recurringId, table.date)
      .where(sql`${table.recurringId} IS NOT NULL`),
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

export const incomePaySchedules = pgTable("income_pay_schedules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  anchorDate: text("anchor_date").notNull(),
  frequency: text("frequency", { enum: payFrequencies }).notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency", { enum: currencies }).notNull().default("usd"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const income = pgTable("income", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency", { enum: currencies }).notNull().default("usd"),
  source: text("source").notNull(),
  date: text("date").notNull(),
  scheduleId: integer("schedule_id").references(() => incomePaySchedules.id),
  createdAt: text("created_at").notNull(),
});

export const savings = pgTable("savings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  note: text("note"),
  date: text("date").notNull(),
  createdAt: text("created_at").notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: integer("id").primaryKey(),
  displayCurrency: text("display_currency", { enum: currencies })
    .notNull()
    .default("usd"),
  primaryScheduleId: integer("primary_schedule_id").references(
    () => incomePaySchedules.id,
  ),
  projectionInitialFreeMoney: integer("projection_initial_free_money")
    .notNull()
    .default(0),
  projectionStartDate: text("projection_start_date"),
  exchangeRatesJson: text("exchange_rates_json"),
  updatedAt: text("updated_at").notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type RecurringExpense = typeof recurringExpenses.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type IncomePaySchedule = typeof incomePaySchedules.$inferSelect;
export type Income = typeof income.$inferSelect;
export type Saving = typeof savings.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;

export type ExpenseWithTags = Expense & { tags: string[] };
export type RecurringExpenseWithTags = RecurringExpense & { tags: string[] };
