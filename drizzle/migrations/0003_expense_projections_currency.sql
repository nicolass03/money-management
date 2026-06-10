CREATE TABLE "expense_pay_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"anchor_date" text NOT NULL,
	"frequency" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"category" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"display_currency" text DEFAULT 'usd' NOT NULL,
	"primary_schedule_id" integer,
	"exchange_rates_json" text,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "currency" text DEFAULT 'usd' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "schedule_id" integer;--> statement-breakpoint
ALTER TABLE "income" ADD COLUMN "currency" text DEFAULT 'usd' NOT NULL;--> statement-breakpoint
ALTER TABLE "income_pay_schedules" ADD COLUMN "currency" text DEFAULT 'usd' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_schedule_id_expense_pay_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."expense_pay_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_primary_schedule_id_income_pay_schedules_id_fk" FOREIGN KEY ("primary_schedule_id") REFERENCES "public"."income_pay_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
INSERT INTO "user_settings" ("id", "display_currency", "updated_at") VALUES (1, 'usd', NOW()::text) ON CONFLICT ("id") DO NOTHING;
