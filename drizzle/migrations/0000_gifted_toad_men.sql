CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"amount" integer NOT NULL,
	"category" text NOT NULL,
	"type" text NOT NULL,
	"date" text NOT NULL,
	"is_recurring" boolean DEFAULT false,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"amount" integer NOT NULL,
	"source" text NOT NULL,
	"date" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"amount" integer NOT NULL,
	"note" text,
	"date" text NOT NULL,
	"created_at" text NOT NULL
);
