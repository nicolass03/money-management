CREATE UNIQUE INDEX "income_scheduled_schedule_date_unique" ON "income" ("schedule_id", "date") WHERE "source" = 'scheduled';
--> statement-breakpoint
CREATE INDEX "income_schedule_id_idx" ON "income" ("schedule_id");
--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" ("date" DESC);
--> statement-breakpoint
CREATE INDEX "income_date_idx" ON "income" ("date" DESC);
--> statement-breakpoint
CREATE INDEX "savings_date_idx" ON "savings" ("date" DESC);
--> statement-breakpoint
CREATE INDEX "expenses_recurring_id_date_idx" ON "expenses" ("recurring_id", "date") WHERE "recurring_id" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "user_settings_primary_schedule_id_idx" ON "user_settings" ("primary_schedule_id");
