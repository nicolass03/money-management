ALTER TABLE "recurring_expenses" ADD COLUMN "is_subscription" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "is_subscription" boolean DEFAULT false NOT NULL;
