DROP INDEX IF EXISTS "expenses_recurring_due_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "expenses_planned_expense_id_unique";
--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "created_at" SET DATA TYPE timestamptz USING "created_at"::timestamptz;
--> statement-breakpoint
ALTER TABLE "recurring_expenses" ALTER COLUMN "anchor_date" SET DATA TYPE date USING "anchor_date"::date;
--> statement-breakpoint
ALTER TABLE "recurring_expenses" ALTER COLUMN "last_payment_date" SET DATA TYPE date USING "last_payment_date"::date;
--> statement-breakpoint
ALTER TABLE "recurring_expenses" ALTER COLUMN "created_at" SET DATA TYPE timestamptz USING "created_at"::timestamptz;
--> statement-breakpoint
ALTER TABLE "recurring_expenses" ALTER COLUMN "updated_at" SET DATA TYPE timestamptz USING "updated_at"::timestamptz;
--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "date" SET DATA TYPE date USING "date"::date;
--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "scheduled_date" SET DATA TYPE date USING "scheduled_date"::date;
--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "created_at" SET DATA TYPE timestamptz USING "created_at"::timestamptz;
--> statement-breakpoint
ALTER TABLE "planned_expenses" ALTER COLUMN "date" SET DATA TYPE date USING "date"::date;
--> statement-breakpoint
ALTER TABLE "planned_expenses" ALTER COLUMN "created_at" SET DATA TYPE timestamptz USING "created_at"::timestamptz;
--> statement-breakpoint
ALTER TABLE "planned_expenses" ALTER COLUMN "updated_at" SET DATA TYPE timestamptz USING "updated_at"::timestamptz;
--> statement-breakpoint
ALTER TABLE "income_pay_schedules" ALTER COLUMN "anchor_date" SET DATA TYPE date USING "anchor_date"::date;
--> statement-breakpoint
ALTER TABLE "income_pay_schedules" ALTER COLUMN "created_at" SET DATA TYPE timestamptz USING "created_at"::timestamptz;
--> statement-breakpoint
ALTER TABLE "income_pay_schedules" ALTER COLUMN "updated_at" SET DATA TYPE timestamptz USING "updated_at"::timestamptz;
--> statement-breakpoint
ALTER TABLE "income" ALTER COLUMN "date" SET DATA TYPE date USING "date"::date;
--> statement-breakpoint
ALTER TABLE "income" ALTER COLUMN "created_at" SET DATA TYPE timestamptz USING "created_at"::timestamptz;
--> statement-breakpoint
ALTER TABLE "savings" ALTER COLUMN "date" SET DATA TYPE date USING "date"::date;
--> statement-breakpoint
ALTER TABLE "savings" ALTER COLUMN "created_at" SET DATA TYPE timestamptz USING "created_at"::timestamptz;
--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "projection_start_date" SET DATA TYPE date USING "projection_start_date"::date;
--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "updated_at" SET DATA TYPE timestamptz USING "updated_at"::timestamptz;
--> statement-breakpoint
CREATE UNIQUE INDEX "expenses_recurring_due_unique" ON "expenses" ("recurring_id", COALESCE("scheduled_date", "date")) WHERE "recurring_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "expenses_planned_expense_id_unique" ON "expenses" ("planned_expense_id") WHERE "planned_expense_id" IS NOT NULL;
