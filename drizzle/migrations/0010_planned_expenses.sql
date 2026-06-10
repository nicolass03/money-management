CREATE TABLE "planned_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"date" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planned_expense_tags" (
	"planned_expense_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "planned_expense_tags_planned_expense_id_tag_id_pk" PRIMARY KEY("planned_expense_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "planned_expense_tags" ADD CONSTRAINT "planned_expense_tags_planned_expense_id_planned_expenses_id_fk" FOREIGN KEY ("planned_expense_id") REFERENCES "public"."planned_expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_expense_tags" ADD CONSTRAINT "planned_expense_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
