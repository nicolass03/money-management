CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "expense_tags" (
	"expense_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "expense_tags_expense_id_tag_id_pk" PRIMARY KEY("expense_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "recurring_expense_tags" (
	"recurring_expense_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "recurring_expense_tags_recurring_expense_id_tag_id_pk" PRIMARY KEY("recurring_expense_id","tag_id")
);
--> statement-breakpoint
INSERT INTO "tags" ("name", "created_at")
SELECT DISTINCT lower(trim("category")), NOW()::text
FROM (
	SELECT "category" FROM "expenses"
	UNION
	SELECT "category" FROM "recurring_expenses"
) AS categories
WHERE trim("category") <> '';
--> statement-breakpoint
INSERT INTO "expense_tags" ("expense_id", "tag_id")
SELECT e."id", t."id"
FROM "expenses" e
INNER JOIN "tags" t ON t."name" = lower(trim(e."category"));
--> statement-breakpoint
INSERT INTO "recurring_expense_tags" ("recurring_expense_id", "tag_id")
SELECT r."id", t."id"
FROM "recurring_expenses" r
INNER JOIN "tags" t ON t."name" = lower(trim(r."category"));
--> statement-breakpoint
ALTER TABLE "expense_tags" ADD CONSTRAINT "expense_tags_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense_tags" ADD CONSTRAINT "expense_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense_tags" ADD CONSTRAINT "recurring_expense_tags_recurring_expense_id_recurring_expenses_id_fk" FOREIGN KEY ("recurring_expense_id") REFERENCES "public"."recurring_expenses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense_tags" ADD CONSTRAINT "recurring_expense_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "category";
--> statement-breakpoint
ALTER TABLE "recurring_expenses" DROP COLUMN "category";
