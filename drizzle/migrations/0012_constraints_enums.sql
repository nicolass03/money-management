CREATE TYPE "pay_frequency" AS ENUM('weekly', 'biweekly', 'monthly', 'yearly');
--> statement-breakpoint
CREATE TYPE "currency_code" AS ENUM('eur', 'usd', 'cop');
--> statement-breakpoint
CREATE TYPE "income_source" AS ENUM('scheduled', 'manual');
--> statement-breakpoint
UPDATE "income" SET "source" = 'scheduled' WHERE "schedule_id" IS NOT NULL;
--> statement-breakpoint
UPDATE "income" SET "source" = 'manual' WHERE "schedule_id" IS NULL AND "source" != 'scheduled';
--> statement-breakpoint
ALTER TABLE "recurring_expenses" ALTER COLUMN "frequency" SET DATA TYPE "pay_frequency" USING "frequency"::"pay_frequency";
--> statement-breakpoint
ALTER TABLE "recurring_expenses" ALTER COLUMN "currency" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "recurring_expenses" ALTER COLUMN "currency" SET DATA TYPE "currency_code" USING "currency"::"currency_code";
--> statement-breakpoint
ALTER TABLE "recurring_expenses" ALTER COLUMN "currency" SET DEFAULT 'usd'::"currency_code";
--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "currency" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "currency" SET DATA TYPE "currency_code" USING "currency"::"currency_code";
--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "currency" SET DEFAULT 'usd'::"currency_code";
--> statement-breakpoint
ALTER TABLE "planned_expenses" ALTER COLUMN "currency" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "planned_expenses" ALTER COLUMN "currency" SET DATA TYPE "currency_code" USING "currency"::"currency_code";
--> statement-breakpoint
ALTER TABLE "planned_expenses" ALTER COLUMN "currency" SET DEFAULT 'usd'::"currency_code";
--> statement-breakpoint
ALTER TABLE "income_pay_schedules" ALTER COLUMN "frequency" SET DATA TYPE "pay_frequency" USING "frequency"::"pay_frequency";
--> statement-breakpoint
ALTER TABLE "income_pay_schedules" ALTER COLUMN "currency" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "income_pay_schedules" ALTER COLUMN "currency" SET DATA TYPE "currency_code" USING "currency"::"currency_code";
--> statement-breakpoint
ALTER TABLE "income_pay_schedules" ALTER COLUMN "currency" SET DEFAULT 'usd'::"currency_code";
--> statement-breakpoint
ALTER TABLE "income" ALTER COLUMN "currency" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "income" ALTER COLUMN "currency" SET DATA TYPE "currency_code" USING "currency"::"currency_code";
--> statement-breakpoint
ALTER TABLE "income" ALTER COLUMN "currency" SET DEFAULT 'usd'::"currency_code";
--> statement-breakpoint
ALTER TABLE "income" ALTER COLUMN "source" SET DATA TYPE "income_source" USING "source"::"income_source";
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_single_origin_chk" CHECK (NOT ("recurring_id" IS NOT NULL AND "planned_expense_id" IS NOT NULL));
--> statement-breakpoint
ALTER TABLE "income" ADD CONSTRAINT "income_scheduled_consistency_chk" CHECK (
  ("source" = 'scheduled' AND "schedule_id" IS NOT NULL)
  OR ("source" = 'manual' AND "schedule_id" IS NULL)
);
