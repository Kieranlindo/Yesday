CREATE TYPE "public"."booking_status" AS ENUM('held', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."chapter" AS ENUM('venue', 'ceremony', 'breakfast', 'drinks', 'evening', 'styling', 'stay');--> statement-breakpoint
CREATE TYPE "public"."date_state" AS ENUM('blocked', 'booked');--> statement-breakpoint
CREATE TYPE "public"."payment_kind" AS ENUM('deposit', 'instalment', 'balance', 'refund', 'fee_credit');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('scheduled', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."cancellation_policy" AS ENUM('Flexible', 'Moderate', 'Strict');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('couple', 'venue', 'admin');--> statement-breakpoint
CREATE TYPE "public"."tour_status" AS ENUM('booked', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."price_unit" AS ENUM('flat', 'pp', 'eve', 'table', 'room');--> statement-breakpoint
CREATE TYPE "public"."venue_status" AS ENUM('draft', 'live', 'paused');--> statement-breakpoint
CREATE TABLE "booking_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"unit" "price_unit" NOT NULL,
	"unit_price_pence" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_pence" integer NOT NULL,
	"added_by_venue" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"couple_id" uuid NOT NULL,
	"wedding_date" date NOT NULL,
	"guests" integer NOT NULL,
	"evening_guests" integer DEFAULT 0 NOT NULL,
	"total_pence" integer NOT NULL,
	"deposit_pence" integer NOT NULL,
	"fee_pence" integer NOT NULL,
	"fee_rate_bp" integer NOT NULL,
	"policy" "cancellation_policy" NOT NULL,
	"status" "booking_status" DEFAULT 'held' NOT NULL,
	"hold_expires_at" timestamp with time zone,
	"stripe_payment_intent_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"user_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "likes_user_id_venue_id_pk" PRIMARY KEY("user_id","venue_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_id" uuid,
	"body" text NOT NULL,
	"kind" text DEFAULT 'text' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"kind" "payment_kind" NOT NULL,
	"amount_pence" integer NOT NULL,
	"due_on" date,
	"status" "payment_status" DEFAULT 'scheduled' NOT NULL,
	"paid_at" timestamp with time zone,
	"stripe_id" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"couple_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"couple_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"wedding_date" date,
	"guests" integer,
	"evening_guests" integer,
	"to_see" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "tour_status" DEFAULT 'booked' NOT NULL,
	"rating" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'couple' NOT NULL,
	"first_name" text NOT NULL,
	"partner_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venue_dates" (
	"venue_id" uuid NOT NULL,
	"day" date NOT NULL,
	"state" date_state NOT NULL,
	"price_pence" integer,
	"note" text,
	CONSTRAINT "venue_dates_venue_id_day_pk" PRIMARY KEY("venue_id","day")
);
--> statement-breakpoint
CREATE TABLE "venue_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"code" text NOT NULL,
	"chapter" "chapter" NOT NULL,
	"name" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"price_pence" integer NOT NULL,
	"unit" "price_unit" DEFAULT 'flat' NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venue_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"url" text NOT NULL,
	"width" integer,
	"height" integer,
	"alt" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"owner_id" uuid,
	"status" "venue_status" DEFAULT 'draft' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"place" text NOT NULL,
	"area" text NOT NULL,
	"style" text,
	"about" text DEFAULT '' NOT NULL,
	"website" text,
	"capacity_dinner" integer NOT NULL,
	"capacity_evening" integer,
	"hire_base_pence" integer NOT NULL,
	"spaces_summary" text,
	"ceremony_name" text,
	"ceremony_detail" text,
	"hire_detail" text,
	"cuisine" text[] DEFAULT '{}'::text[] NOT NULL,
	"features" text[] DEFAULT '{}'::text[] NOT NULL,
	"practical" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"policy" "cancellation_policy" DEFAULT 'Moderate' NOT NULL,
	"deposit_percent" integer DEFAULT 15 NOT NULL,
	"manager_name" text NOT NULL,
	"manager_photo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "venues_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_couple_id_users_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_couple_id_users_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_couple_id_users_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_dates" ADD CONSTRAINT "venue_dates_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_options" ADD CONSTRAINT "venue_options_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_photos" ADD CONSTRAINT "venue_photos_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_one_per_date" ON "bookings" USING btree ("venue_id","wedding_date") WHERE status in ('held', 'confirmed');--> statement-breakpoint
CREATE INDEX "bookings_couple_idx" ON "bookings" USING btree ("couple_id");--> statement-breakpoint
CREATE INDEX "messages_thread_idx" ON "messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "threads_pair_key" ON "threads" USING btree ("venue_id","couple_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "venue_options_code_key" ON "venue_options" USING btree ("venue_id","code");--> statement-breakpoint
CREATE INDEX "venue_photos_venue_idx" ON "venue_photos" USING btree ("venue_id","position");--> statement-breakpoint
CREATE INDEX "venues_area_idx" ON "venues" USING btree ("area","status");