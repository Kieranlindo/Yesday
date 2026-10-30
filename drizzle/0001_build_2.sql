CREATE TABLE "packages" (
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
--> statement-breakpoint
CREATE TABLE "plans" (
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
--> statement-breakpoint
ALTER TABLE "venues" ALTER COLUMN "deposit_percent" SET DEFAULT 20;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "package_codes" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "total_pence" integer;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "hold_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "verdict" text;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "feedback" text;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_couple_id_users_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tours_couple_idx" ON "tours" USING btree ("couple_id","starts_at");--> statement-breakpoint
UPDATE "venues" SET "deposit_percent" = 20 WHERE "deposit_percent" < 20;
