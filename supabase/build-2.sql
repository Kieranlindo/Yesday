-- Yesday Build 2: saved packages, couples' plans, and custom tours.
-- Paste all of this into Supabase's SQL Editor and press Run, once. Safe to run again.
-- It also lifts every venue's deposit to at least 20%.
begin;

CREATE TABLE IF NOT EXISTS "packages" (
	"couple_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"codes" text[] DEFAULT '{}'::text[] NOT NULL,
	"wedding_date" date NOT NULL,
	"guests" integer NOT NULL,
	"evening_guests" integer DEFAULT 0 NOT NULL,
	"kids" integer DEFAULT 0 NOT NULL,
	"total_pence" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "packages_couple_id_venue_id_pk" PRIMARY KEY("couple_id","venue_id")
);

CREATE TABLE IF NOT EXISTS "plans" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"last_name" text,
	"wedding_date" date,
	"flex_dow" integer,
	"flex_months" text[] DEFAULT '{}'::text[] NOT NULL,
	"guests" integer DEFAULT 80 NOT NULL,
	"evening_guests" integer DEFAULT 30 NOT NULL,
	"area" text DEFAULT 'London' NOT NULL,
	"budget_pence" integer,
	"styles" text[] DEFAULT '{}'::text[] NOT NULL,
	"needs" text[] DEFAULT '{}'::text[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "venues" ALTER COLUMN "deposit_percent" SET DEFAULT 20;
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "package_codes" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "total_pence" integer;
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "note" text;
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "hold_until" timestamp with time zone;
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "verdict" text;
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "feedback" text;
DO $$ BEGIN ALTER TABLE "packages" ADD CONSTRAINT "packages_couple_id_users_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "packages" ADD CONSTRAINT "packages_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "plans" ADD CONSTRAINT "plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "tours_couple_idx" ON "tours" USING btree ("couple_id","starts_at");
UPDATE "venues" SET "deposit_percent" = 20 WHERE "deposit_percent" < 20;

commit;
