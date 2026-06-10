ALTER TABLE "user_settings" ALTER COLUMN "display_currency" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "display_currency" SET DATA TYPE "currency_code" USING "display_currency"::"currency_code";
--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "display_currency" SET DEFAULT 'usd'::"currency_code";
--> statement-breakpoint
CREATE TABLE "exchange_rate_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"base_currency" "currency_code" DEFAULT 'usd' NOT NULL,
	"rates_json" jsonb NOT NULL,
	"fetched_at" timestamptz NOT NULL
);
--> statement-breakpoint
INSERT INTO "exchange_rate_snapshots" ("base_currency", "rates_json", "fetched_at")
SELECT
	lower(exchange_rates_json::jsonb ->> 'base')::"currency_code",
	(exchange_rates_json::jsonb -> 'rates'),
	(exchange_rates_json::jsonb ->> 'fetchedAt')::timestamptz
FROM "user_settings"
WHERE "id" = 1
  AND "exchange_rates_json" IS NOT NULL
  AND exchange_rates_json::jsonb ->> 'fetchedAt' IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "exchange_rates_json";
