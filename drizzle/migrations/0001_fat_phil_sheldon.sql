CREATE TABLE "income_pay_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"anchor_date" text NOT NULL,
	"frequency" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "income" ADD COLUMN "schedule_id" integer;--> statement-breakpoint
ALTER TABLE "income" ADD CONSTRAINT "income_schedule_id_income_pay_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."income_pay_schedules"("id") ON DELETE no action ON UPDATE no action;