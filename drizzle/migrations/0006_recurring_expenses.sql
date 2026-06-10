ALTER TABLE "expense_pay_schedules" RENAME TO "recurring_expenses";
--> statement-breakpoint
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_schedule_id_expense_pay_schedules_id_fk";
--> statement-breakpoint
ALTER TABLE "expenses" RENAME COLUMN "schedule_id" TO "recurring_id";
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "amount_overridden" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "type";
--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "is_recurring";
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recurring_id_recurring_expenses_id_fk" FOREIGN KEY ("recurring_id") REFERENCES "public"."recurring_expenses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "expenses_recurring_id_date_unique" ON "expenses" ("recurring_id","date") WHERE "recurring_id" IS NOT NULL;
