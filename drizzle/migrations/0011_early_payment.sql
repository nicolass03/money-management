ALTER TABLE "expenses" ADD COLUMN "scheduled_date" text;
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "planned_expense_id" integer;
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_planned_expense_id_planned_expenses_id_fk" FOREIGN KEY ("planned_expense_id") REFERENCES "public"."planned_expenses"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
DROP INDEX "expenses_recurring_id_date_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "expenses_recurring_due_unique" ON "expenses" ("recurring_id", COALESCE("scheduled_date", "date")) WHERE "recurring_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "expenses_planned_expense_id_unique" ON "expenses" ("planned_expense_id") WHERE "planned_expense_id" IS NOT NULL;
