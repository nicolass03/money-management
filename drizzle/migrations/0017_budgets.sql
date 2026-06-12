CREATE TABLE "budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" "currency_code" DEFAULT 'usd' NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "budgets_amount_positive" CHECK ("amount" > 0),
	CONSTRAINT "budgets_end_requires_start" CHECK ("end_date" IS NULL OR "start_date" IS NOT NULL),
	CONSTRAINT "budgets_end_after_start" CHECK ("end_date" IS NULL OR "end_date" >= "start_date"),
	CONSTRAINT "budgets_dates_both_or_neither" CHECK (("start_date" IS NULL AND "end_date" IS NULL) OR ("start_date" IS NOT NULL AND "end_date" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "budget_tags" (
	"budget_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "budget_tags_budget_id_tag_id_pk" PRIMARY KEY("budget_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "budget_id" integer;
--> statement-breakpoint
ALTER TABLE "budget_tags" ADD CONSTRAINT "budget_tags_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "budget_tags" ADD CONSTRAINT "budget_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_budget_exclusive" CHECK (NOT ("budget_id" IS NOT NULL AND ("recurring_id" IS NOT NULL OR "planned_expense_id" IS NOT NULL)));
