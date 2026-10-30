-- Yesday: one-off setup for the Supabase database.
-- Paste all of this into Supabase's SQL Editor and press Run, once. It creates the tables and adds the 11 sample venues.
begin;

CREATE TYPE "public"."booking_status" AS ENUM('held', 'confirmed', 'cancelled', 'completed');
CREATE TYPE "public"."chapter" AS ENUM('venue', 'ceremony', 'breakfast', 'drinks', 'evening', 'styling', 'stay');
CREATE TYPE "public"."date_state" AS ENUM('blocked', 'booked');
CREATE TYPE "public"."payment_kind" AS ENUM('deposit', 'instalment', 'balance', 'refund', 'fee_credit');
CREATE TYPE "public"."payment_status" AS ENUM('scheduled', 'paid', 'failed', 'refunded');
CREATE TYPE "public"."cancellation_policy" AS ENUM('Flexible', 'Moderate', 'Strict');
CREATE TYPE "public"."role" AS ENUM('couple', 'venue', 'admin');
CREATE TYPE "public"."tour_status" AS ENUM('booked', 'done', 'cancelled');
CREATE TYPE "public"."price_unit" AS ENUM('flat', 'pp', 'eve', 'table', 'room');
CREATE TYPE "public"."venue_status" AS ENUM('draft', 'live', 'paused');
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

CREATE TABLE "likes" (
	"user_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "likes_user_id_venue_id_pk" PRIMARY KEY("user_id","venue_id")
);

CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_id" uuid,
	"body" text NOT NULL,
	"kind" text DEFAULT 'text' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

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

CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"couple_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

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

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'couple' NOT NULL,
	"first_name" text NOT NULL,
	"partner_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "venue_dates" (
	"venue_id" uuid NOT NULL,
	"day" date NOT NULL,
	"state" date_state NOT NULL,
	"price_pence" integer,
	"note" text,
	CONSTRAINT "venue_dates_venue_id_day_pk" PRIMARY KEY("venue_id","day")
);

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

CREATE TABLE "venue_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"url" text NOT NULL,
	"width" integer,
	"height" integer,
	"alt" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);

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

ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_couple_id_users_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "likes" ADD CONSTRAINT "likes_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "threads" ADD CONSTRAINT "threads_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "threads" ADD CONSTRAINT "threads_couple_id_users_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tours" ADD CONSTRAINT "tours_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tours" ADD CONSTRAINT "tours_couple_id_users_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "venue_dates" ADD CONSTRAINT "venue_dates_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "venue_options" ADD CONSTRAINT "venue_options_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "venue_photos" ADD CONSTRAINT "venue_photos_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "venues" ADD CONSTRAINT "venues_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
CREATE UNIQUE INDEX "bookings_one_per_date" ON "bookings" USING btree ("venue_id","wedding_date") WHERE status in ('held', 'confirmed');
CREATE INDEX "bookings_couple_idx" ON "bookings" USING btree ("couple_id");
CREATE INDEX "messages_thread_idx" ON "messages" USING btree ("thread_id","created_at");
CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");
CREATE UNIQUE INDEX "threads_pair_key" ON "threads" USING btree ("venue_id","couple_id");
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree (lower("email"));
CREATE UNIQUE INDEX "venue_options_code_key" ON "venue_options" USING btree ("venue_id","code");
CREATE INDEX "venue_photos_venue_idx" ON "venue_photos" USING btree ("venue_id","position");
CREATE INDEX "venues_area_idx" ON "venues" USING btree ("area","status");
-- Record that the first migration has run, so later updates start from the right place.
create schema if not exists drizzle;
create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint);
insert into drizzle.__drizzle_migrations (hash, created_at) values ('359620f8415235b794a5f1693345fe520065bf6233824b4cbf45839141ca3005', 1793386274108);

-- Sample venues
\restrict ZxceSrepfpnpH6tfdjO7x7rVQQNC63dGPFHvgbIGcEz8hVKrkXcptGN15Dwj7NN
INSERT INTO public.venues VALUES
	('a0e6edc8-9411-49da-9872-7f93ed378012', 'old-royal-naval-college', NULL, 'live', true, 'Old Royal Naval College', 'Greenwich, London', 'London', 'Historic', 'Wren’s riverside masterpiece in Greenwich. Marry in the chapel, then dine beneath the Painted Hall’s ceiling, often called Britain’s Sistine Chapel.', 'https://ornc.org/venue-hire/weddings/', 300, 450, 1250000, 'Painted Hall and Chapel', 'Ceremony in the Chapel', 'Licensed for civil ceremonies. Includes chairs, an aisle runner and a table for the registrar.', 'Your spaces at Old Royal Naval College for the day and evening, with tables, chairs, linen and the events team.', '{"Seasonal British","Bespoke menus"}', '{catering,veg,halal,outdoor,parking}', '[]', '{"fire": "Not allowed", "drinks": "Packages from the venue", "finish": "Midnight", "candles": "In glass holders", "limiter": "Yes", "confetti": "Petals, outdoors only", "suppliers": "Welcome, if they’re insured"}', 'Moderate', 25, 'Eleanor', NULL, '2026-10-30 18:52:52.857759+00'),
	('57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'banqueting-house', NULL, 'live', true, 'Banqueting House', 'Whitehall, London', 'London', 'Palace', 'The last surviving part of the Palace of Whitehall, with a Rubens ceiling above the Main Hall. Up to 300 for dinner, in the heart of royal London.', 'https://www.hrp.org.uk/banqueting-house/hire-a-venue/weddings/', 300, 450, 1500000, 'Main Hall and Undercroft', 'Ceremony in the Undercroft', 'The vaulted Undercroft is licensed for up to 150. Larger ceremonies can be held in the Main Hall, for up to 400.', 'Your spaces at Banqueting House for the day and evening, with tables, chairs, linen and the events team.', '{"Bespoke menus","Seasonal British"}', '{catering,veg,halal}', '[]', '{"fire": "Not allowed", "drinks": "Packages from the venue", "finish": "Midnight", "candles": "In glass holders", "limiter": "Yes", "confetti": "Petals, outdoors only", "suppliers": "Welcome, if they’re insured"}', 'Strict', 25, 'Imogen', NULL, '2026-10-30 18:52:52.857759+00'),
	('05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'syon-park', NULL, 'live', true, 'Syon Park', 'Brentford, London', 'London', 'Country house', 'The London home of the Dukes of Northumberland, with 200 acres of parkland and the domed Great Conservatory for your ceremony.', 'https://syonpark.co.uk/weddings-private-events/', 250, 380, 300000, 'Great Conservatory', 'Ceremony in the Great Conservatory', 'Licensed for civil ceremonies. Includes chairs, an aisle runner and a table for the registrar.', 'Your spaces at Syon Park for the day and evening, with tables, chairs, linen and the events team.', '{"Seasonal British","Bespoke menus"}', '{catering,veg,halal,outdoor,parking}', '[]', '{"fire": "Not allowed", "drinks": "Packages from the venue", "finish": "Midnight", "candles": "In glass holders", "limiter": "Yes", "confetti": "Petals, outdoors only", "suppliers": "Welcome, if they’re insured"}', 'Moderate', 15, 'Harriet', NULL, '2026-10-30 18:52:52.857759+00'),
	('2321b671-cb5f-488e-9988-09bfabd2bf36', 'natural-history-museum', NULL, 'live', true, 'Natural History Museum', 'South Kensington, London', 'London', 'Museum', 'Say yes beneath Hope, the blue whale, in Hintze Hall. Twelve licensed spaces, from the grand hall to the glass Darwin Centre atrium.', 'https://www.nhm.ac.uk/business-services/venue-hire/weddings-private-events.html', 450, 680, 1300000, 'Hintze Hall', 'Ceremony in Hintze Hall', 'Twelve spaces are licensed. Hintze Hall takes up to 450 for the ceremony, beneath Hope the blue whale.', 'Your spaces at Natural History Museum for the day and evening, with tables, chairs, linen and the events team.', '{"Bespoke menus","Seasonal British"}', '{catering,veg,halal}', '[]', '{"fire": "Not allowed", "drinks": "Packages from the venue", "finish": "Midnight", "candles": "In glass holders", "limiter": "Yes", "confetti": "Petals, outdoors only", "suppliers": "Welcome, if they’re insured"}', 'Strict', 20, 'Florence', NULL, '2026-10-30 18:52:52.857759+00'),
	('05512700-0018-492d-be6d-5616c5470e68', 'dartmouth-house', NULL, 'live', true, 'Dartmouth House', 'Mayfair, London', 'London', 'City', 'A Georgian townhouse in Mayfair with a marble courtyard that feels like a French château. Exclusive use at weekends.', 'https://dartmouthhouse.co.uk/events/weddings/', 150, 230, 280000, 'Exclusive use at weekends', 'Ceremony in the house', 'Licensed for civil ceremonies for up to 100 guests. Includes chairs and a table for the registrar.', 'Your spaces at Dartmouth House for the day and evening, with tables, chairs, linen and the events team.', '{"Modern British","Bespoke menus"}', '{catering,veg,halal,outdoor}', '[]', '{"fire": "Not allowed", "drinks": "Packages from the venue", "finish": "Midnight", "candles": "In glass holders", "limiter": "Yes", "confetti": "Petals, outdoors only", "suppliers": "Welcome, if they’re insured"}', 'Moderate', 15, 'Clara', NULL, '2026-10-30 18:52:52.857759+00'),
	('2e8b22f9-e677-4e46-ac62-295cc54fe416', 'kew-gardens', NULL, 'live', true, 'Kew Gardens', 'Richmond, London', 'London', 'Garden', 'Marry in the Nash Conservatory, then dine among the palms of the Temperate House, the world’s largest surviving Victorian glasshouse.', 'https://www.kew.org/venue-hire/luxury-weddings', 230, 350, 300000, 'Nash Conservatory and Temperate House', 'Ceremony in the Nash Conservatory', 'Up to 200 guests, with floor-to-ceiling windows on three sides. Includes chairs and a table for the registrar.', 'Your spaces at Kew Gardens for the day and evening, with tables, chairs, linen and the events team.', '{"Seasonal British",Plant-led}', '{catering,veg,halal,outdoor}', '[]', '{"fire": "Not allowed", "drinks": "Packages from the venue", "finish": "Midnight", "candles": "In glass holders", "limiter": "Yes", "confetti": "Petals, outdoors only", "suppliers": "Welcome, if they’re insured"}', 'Moderate', 25, 'Rosie', NULL, '2026-10-30 18:52:52.857759+00'),
	('14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'shoreditch-town-hall', NULL, 'live', true, 'Shoreditch Town Hall', 'Shoreditch, London', 'London', 'City', 'A grand Victorian civic hall in the heart of Shoreditch, with a sprung-floor Assembly Hall that dances until late.', 'https://shoreditchtownhall.com/event-hire/spaces-for-hire.html', 400, 600, 800000, 'Assembly Hall', 'Ceremony in the Large Committee Room', 'Several rooms are licensed, from the intimate Mayor’s Parlour to The Ditch. Includes chairs and a table for the registrar.', 'Your spaces at Shoreditch Town Hall for the day and evening, with tables, chairs, linen and the events team.', '{"Street food","Modern British","Bring your own caterer"}', '{catering,outside,veg,halal,late}', '[]', '{"fire": "Not allowed", "drinks": "Packages from the venue", "finish": "Late, by arrangement", "candles": "LED only", "limiter": "No", "confetti": "Not inside the building", "suppliers": "Any caterer you like"}', 'Moderate', 15, 'Maya', NULL, '2026-10-30 18:52:52.857759+00'),
	('78f2fde8-7b08-4df1-822e-7697b5e7b078', 'horniman-museum-and-gardens', NULL, 'live', true, 'Horniman Museum and Gardens', 'Forest Hill, London', 'London', 'Garden', 'A Victorian cast-iron conservatory and a hilltop bandstand with views over London. Three licensed spaces in 16 acres of gardens.', 'https://www.horniman.ac.uk/hire/weddings-and-civil-ceremonies/', 120, 180, 120000, 'Conservatory and Bandstand', 'Ceremony in the Conservatory', 'All three spaces are licensed, including the Victorian Conservatory and the Bandstand with views across London.', 'Your spaces at Horniman Museum and Gardens for the day and evening, with tables, chairs, linen and the events team.', '{"Seasonal British","Sharing feasts"}', '{catering,veg,halal,outdoor}', '[]', '{"fire": "Not allowed", "drinks": "Packages from the venue", "finish": "Midnight", "candles": "In glass holders", "limiter": "Yes", "confetti": "Petals, outdoors only", "suppliers": "Welcome, if they’re insured"}', 'Flexible', 15, 'Jess', NULL, '2026-10-30 18:52:52.857759+00'),
	('1adefe2e-9eb7-4ca8-9705-208252e174fa', 'fulham-palace', NULL, 'live', true, 'Fulham Palace', 'Fulham, London', 'London', 'Palace', 'The former home of the Bishops of London, on the Thames. Tudor courtyard, a walled garden and 13 acres of botanical gardens.', 'https://www.fulhampalace.org/venue-hire/weddings-civil-ceremonies/', 180, 270, 500000, 'Great Hall and gardens', 'Ceremony in the Palace', 'Four rooms are licensed for up to 120, and the private chapel seats 90 for a blessing.', 'Your spaces at Fulham Palace for the day and evening, with tables, chairs, linen and the events team.', '{"Seasonal British","Bespoke menus"}', '{catering,veg,halal,outdoor,late}', '[["Getting there", "Putney Bridge on the District line, a 15-minute walk through Bishop’s Park. Buses 74, 220 and 430 stop five minutes away."], ["Parking", "Metered parking on Bishop’s Avenue. Extra restrictions apply on Fulham FC home match days, so check the fixtures for your date."], ["Accessibility", "Blue Badge spaces in the gated car park, booked ahead. Putney Bridge station has no lift, so guests who need step-free access are best dropped at the gate."], ["If it rains", "Four rooms in the palace are licensed, so a garden ceremony can move indoors on the day."]]', '{"fire": "Not allowed", "drinks": "Packages from the venue", "finish": "Midnight, later by arrangement", "candles": "In glass holders", "limiter": "No", "confetti": "Petals, outdoors only", "suppliers": "Welcome, if they’re insured"}', 'Moderate', 20, 'Sophie', '/people/sophie.jpg', '2026-10-30 18:52:52.857759+00'),
	('58cb67f8-f6af-4903-9849-44debc3375f3', 'pembroke-lodge', NULL, 'live', true, 'Pembroke Lodge', 'Richmond Park, London', 'London', 'Country house', 'A Georgian mansion in Richmond Park with wisteria at the door and licensed oak gazebos for outdoor ceremonies. Up to 140 for dinner.', 'https://www.pembroke-lodge.co.uk/weddings/', 140, 210, 300000, 'Belvedere Suite', 'Ceremony under the Oak Gazebo', 'Licensed outdoor gazebos and indoor suites, with ceremonies led by Richmond Register Office.', 'Your spaces at Pembroke Lodge for the day and evening, with tables, chairs, linen and the events team.', '{"Modern British","Afternoon tea"}', '{catering,veg,outdoor,parking}', '[]', '{"fire": "Not allowed", "drinks": "Packages from the venue", "finish": "Midnight", "candles": "In glass holders", "limiter": "Yes", "confetti": "Petals, outdoors only", "suppliers": "Welcome, if they’re insured"}', 'Moderate', 20, 'Lily', NULL, '2026-10-30 18:52:52.857759+00'),
	('c9995099-8711-403d-9f38-c4f0757c1b09', 'mandarin-oriental-hyde-park', NULL, 'draft', true, 'Mandarin Oriental Hyde Park', 'Knightsbridge, London', 'London', 'Hotel', 'A Knightsbridge landmark overlooking Hyde Park. The ballroom opens onto the park, guests can arrive through the Royal Entrance, and the hotel will fly flags with your names as you arrive.', 'https://www.mandarinoriental.com/en/london/hyde-park/celebrate', 250, 380, 950000, 'Private ballroom', 'Ceremony in the Carlyle Suite', 'Licensed for civil ceremonies for up to 200 guests. Includes chairs, an aisle runner and a table for the registrar.', 'The ballroom for the day and evening, overlooking Hyde Park, with its own terrace and a wedding planner from the hotel.', '{"Bespoke menus",Asian,Kosher,Halal}', '{catering,halal,veg,suite,rooms,parking}', '[]', '{"fire": "Not allowed", "drinks": "Packages chosen with the sommelier", "finish": "Midnight, under the late licence", "candles": "In glass holders", "limiter": "No", "confetti": "Petals only, on the terrace", "suppliers": "From the hotel’s recommended list"}', 'Moderate', 25, 'Charlotte', NULL, '2026-10-30 18:52:52.857759+00');
INSERT INTO public.venue_dates VALUES
	('57db0f4b-89f6-4f7e-8410-01fb486cf21d', '2027-06-05', 'booked', NULL, 'Booked outside Yesday'),
	('2e8b22f9-e677-4e46-ac62-295cc54fe416', '2027-09-18', 'booked', NULL, 'Booked outside Yesday'),
	('2e8b22f9-e677-4e46-ac62-295cc54fe416', '2027-06-12', 'booked', NULL, 'Booked outside Yesday'),
	('1adefe2e-9eb7-4ca8-9705-208252e174fa', '2027-09-25', 'booked', NULL, 'Booked outside Yesday');
INSERT INTO public.venue_options VALUES
	('5e5a6e74-b228-4b55-97a4-18a8da3b8da7', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'cer_none', 'ceremony', 'Celebration only', 'You’re marrying somewhere else first, and joining your guests here afterwards.', 0, 'flat', false, true, 2),
	('579d6863-68ca-4b3a-8973-9ff8a64043fa', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'hire', 'venue', 'Venue hire', 'Your spaces at Old Royal Naval College for the day and evening, with tables, chairs, linen and the events team.', 1250000, 'flat', true, true, 0),
	('af49f8ba-620d-4bf9-bd30-dfe2268a4d4f', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'cer_room', 'ceremony', 'Ceremony in the Chapel', 'Licensed for civil ceremonies. Includes chairs, an aisle runner and a table for the registrar.', 60000, 'flat', false, true, 1),
	('8e784f57-4499-4edb-9173-dee8adc7bacb', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'cer_garden', 'ceremony', 'Garden ceremony', 'Outdoors in the gardens, with an indoor room kept ready in case it rains.', 75000, 'flat', false, true, 2),
	('21ebea97-f107-4188-b64a-681dcd12ab55', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'cer_none', 'ceremony', 'Celebration only', 'You’re marrying somewhere else first, and joining your guests here afterwards.', 0, 'flat', false, true, 3),
	('00f39e39-35d9-4a6f-aa6b-b8890864aef8', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'quartet', 'ceremony', 'String quartet', 'For your walk down the aisle and the drinks reception.', 55000, 'flat', false, true, 4),
	('6f9e8649-f6cb-49cf-a2c4-0ca33ebfb3fb', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'can3', 'ceremony', 'Three canapés each', 'Passed round during the drinks reception. Chosen at your tasting.', 900, 'pp', false, true, 5),
	('901f5515-ca55-48cb-9876-96bb442a7e6b', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'can5', 'ceremony', 'Five canapés each', 'A more generous reception, ideal if dinner is after 4pm.', 1400, 'pp', false, true, 6),
	('eb0f1295-cbf9-4473-a54a-c7b49a7b5b0b', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'dinner3', 'breakfast', 'Three-course dinner', 'Seasonal starter, a choice of two mains and dessert. Halal and vegetarian versions of every course.', 12000, 'pp', false, true, 7),
	('44eecf25-8f65-425a-81e8-3761f3b12728', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'feast', 'breakfast', 'Sharing feast', 'Platters down the middle of each table: slow-roast lamb, chicken, grains and salads, with a dessert table to finish.', 11400, 'pp', false, true, 8),
	('0d308ac8-4721-4fa4-b06a-61626eff071f', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'd_none', 'drinks', 'Pay at the bar', 'No package. Guests buy their own drinks from the venue bar.', 0, 'pp', false, true, 9),
	('03f743a8-7120-4882-b20a-c02c4ad80e2d', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'd_classic', 'drinks', 'Classic', 'A welcome drink, half a bottle of wine each with dinner, and sparkling wine for the toast.', 2800, 'pp', false, true, 10),
	('e1b0bac9-9fb9-4cb4-8c8a-c8d3a2d6ca9b', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'd_sig', 'drinks', 'Signature', 'Prosecco on arrival, premium wines with dinner, and champagne for the toast.', 3800, 'pp', false, true, 11),
	('f80e12cd-cb75-4683-855d-32e9c22c1d95', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'd_pres', 'drinks', 'Prestige', 'Champagne all afternoon, wines chosen by a sommelier, and cocktails after dinner.', 5200, 'pp', false, true, 12),
	('5e783a3c-3d2b-4752-bbfa-1d2df73e205d', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'buffet', 'evening', 'Evening buffet', 'Stone-baked pizzas or a grazing table from 8pm, for every evening guest.', 1500, 'eve', false, true, 13),
	('24c03083-77c6-4c31-bbfb-9b9d2b0a15bf', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'dj', 'evening', 'DJ, 7pm to midnight', 'The resident DJ with sound system and dance-floor lighting. Send your playlist in the app.', 65000, 'flat', false, true, 14),
	('be93956d-cb92-4ef2-9450-f30e14b3eb28', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'band', 'evening', 'Live band', 'A four-piece band for two 45-minute sets, with a DJ playlist in between.', 180000, 'flat', false, true, 15),
	('df2046a4-6160-4c2b-8b51-ab7af7be7ecf', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'dhol', 'evening', 'Dhol drummers', 'Two drummers for your grand entrance, about 20 minutes.', 45000, 'flat', false, true, 16),
	('6174d9e2-e576-40d3-8b21-3451795d85f6', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'lights', 'styling', 'Uplighting and fairy lights', 'Warm-white uplighters in the ceremony room and hall, with a fairy-light canopy over the dance floor.', 40000, 'flat', false, true, 17),
	('ad1fa2e2-ad9f-4bf1-bdc6-5b29242f752e', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'florals', 'styling', 'Table flowers and a ceremony arch', 'Seasonal flowers for every table and an arch for your ceremony, by the venue’s florist.', 95000, 'flat', false, true, 18),
	('094d03fe-c5aa-4540-93b8-7eca9d41581e', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'candles', 'styling', 'Candles and table styling', 'Candlesticks, glass holders and linen napkins in your colours.', 30000, 'flat', false, true, 19),
	('8ee44b55-fb80-47c5-bbc5-5bf8e82b6d81', 'a0e6edc8-9411-49da-9872-7f93ed378012', 'rooms', 'stay', 'Hold rooms for your guests', 'We’ll hold rooms nearby at a wedding rate. Guests book and pay for themselves.', 0, 'flat', false, true, 20),
	('fd8feead-9380-49bd-9dd2-19bfcf5efe6b', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'hire', 'venue', 'Venue hire', 'Your spaces at Banqueting House for the day and evening, with tables, chairs, linen and the events team.', 1500000, 'flat', true, true, 0),
	('d53184cf-da86-498c-a553-0b2a9da49063', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'quartet', 'ceremony', 'String quartet', 'For your walk down the aisle and the drinks reception.', 55000, 'flat', false, true, 3),
	('b41d2b2f-5a6d-41a2-9ad7-a8aa77aebb7c', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'cer_room', 'ceremony', 'Ceremony in the Undercroft', 'The vaulted Undercroft is licensed for up to 150. Larger ceremonies can be held in the Main Hall, for up to 400.', 60000, 'flat', false, true, 1),
	('1a057d8e-92a8-48c5-8feb-94566ff54896', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'cer_none', 'ceremony', 'Celebration only', 'You’re marrying somewhere else first, and joining your guests here afterwards.', 0, 'flat', false, true, 2),
	('b9cfa87f-1d86-4adb-85d2-e31152f59bcf', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'quartet', 'ceremony', 'String quartet', 'For your walk down the aisle and the drinks reception.', 55000, 'flat', false, true, 3),
	('96b796c3-87dd-400d-a4d1-bf0d071ba7c3', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'can3', 'ceremony', 'Three canapés each', 'Passed round during the drinks reception. Chosen at your tasting.', 900, 'pp', false, true, 4),
	('02d65300-7b63-4170-82c4-631d6dd7369e', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'can5', 'ceremony', 'Five canapés each', 'A more generous reception, ideal if dinner is after 4pm.', 1400, 'pp', false, true, 5),
	('bbfa180c-a42c-4fbd-982f-f23477459e06', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'dinner3', 'breakfast', 'Three-course dinner', 'Seasonal starter, a choice of two mains and dessert. Halal and vegetarian versions of every course.', 14000, 'pp', false, true, 6),
	('5d044bc6-3422-43e4-8e1c-1973a513d9e1', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'feast', 'breakfast', 'Sharing feast', 'Platters down the middle of each table: slow-roast lamb, chicken, grains and salads, with a dessert table to finish.', 13400, 'pp', false, true, 7),
	('a0b7ae4d-c1c5-4c56-98a8-3ff381ca9485', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'd_none', 'drinks', 'Pay at the bar', 'No package. Guests buy their own drinks from the venue bar.', 0, 'pp', false, true, 8),
	('90b8b25d-412e-464e-978b-1a676783b7ee', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'd_classic', 'drinks', 'Classic', 'A welcome drink, half a bottle of wine each with dinner, and sparkling wine for the toast.', 2800, 'pp', false, true, 9),
	('246297fb-7877-4c22-9c94-62639899d520', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'd_sig', 'drinks', 'Signature', 'Prosecco on arrival, premium wines with dinner, and champagne for the toast.', 3800, 'pp', false, true, 10),
	('996c319f-8cf7-4c5a-acec-3e8a930d560a', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'd_pres', 'drinks', 'Prestige', 'Champagne all afternoon, wines chosen by a sommelier, and cocktails after dinner.', 5200, 'pp', false, true, 11),
	('26781cdc-acec-4b7e-9aca-7578419ce920', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'buffet', 'evening', 'Evening buffet', 'Stone-baked pizzas or a grazing table from 8pm, for every evening guest.', 1500, 'eve', false, true, 12),
	('e9f2800b-25cd-4612-b616-a5e5fe20dd12', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'dj', 'evening', 'DJ, 7pm to midnight', 'The resident DJ with sound system and dance-floor lighting. Send your playlist in the app.', 65000, 'flat', false, true, 13),
	('1464d652-da2f-4997-b916-9779e95c5e62', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'band', 'evening', 'Live band', 'A four-piece band for two 45-minute sets, with a DJ playlist in between.', 180000, 'flat', false, true, 14),
	('4371602a-b5db-4754-ae44-18a687c49fbd', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'dhol', 'evening', 'Dhol drummers', 'Two drummers for your grand entrance, about 20 minutes.', 45000, 'flat', false, true, 15),
	('1a34bdd2-332f-412f-9880-a951dcb23241', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'lights', 'styling', 'Uplighting and fairy lights', 'Warm-white uplighters in the ceremony room and hall, with a fairy-light canopy over the dance floor.', 40000, 'flat', false, true, 16),
	('52e51b7d-8dd4-4bef-b08b-20da3f3373f6', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'florals', 'styling', 'Table flowers and a ceremony arch', 'Seasonal flowers for every table and an arch for your ceremony, by the venue’s florist.', 95000, 'flat', false, true, 17),
	('10f4a249-8de1-4e6b-8922-1db3b7f11f18', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'candles', 'styling', 'Candles and table styling', 'Candlesticks, glass holders and linen napkins in your colours.', 30000, 'flat', false, true, 18),
	('6b689fca-ad06-405d-84d3-23e2bd4c5412', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', 'rooms', 'stay', 'Hold rooms for your guests', 'We’ll hold rooms nearby at a wedding rate. Guests book and pay for themselves.', 0, 'flat', false, true, 19),
	('55da9ae4-f19b-4f0b-a74f-ce71c46fe431', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'hire', 'venue', 'Venue hire', 'Your spaces at Syon Park for the day and evening, with tables, chairs, linen and the events team.', 300000, 'flat', true, true, 0),
	('f6dc4419-114d-47f6-b7c1-8f8ecc093437', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'cer_room', 'ceremony', 'Ceremony in the Great Conservatory', 'Licensed for civil ceremonies. Includes chairs, an aisle runner and a table for the registrar.', 60000, 'flat', false, true, 1),
	('62cdc81f-4106-460a-8ef3-387d29a762b4', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'cer_garden', 'ceremony', 'Garden ceremony', 'Outdoors in the gardens, with an indoor room kept ready in case it rains.', 75000, 'flat', false, true, 2),
	('f94ca10c-1fd9-4e9c-8a62-6fb5552ff71a', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'cer_none', 'ceremony', 'Celebration only', 'You’re marrying somewhere else first, and joining your guests here afterwards.', 0, 'flat', false, true, 3),
	('8c94fa34-4466-4ab4-8686-61cc04022eb1', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'quartet', 'ceremony', 'String quartet', 'For your walk down the aisle and the drinks reception.', 55000, 'flat', false, true, 4),
	('bda22aa8-44ed-4908-a40e-084851fdd97f', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'can3', 'ceremony', 'Three canapés each', 'Passed round during the drinks reception. Chosen at your tasting.', 900, 'pp', false, true, 5),
	('115e3eb0-90aa-4f56-a401-ee928b0ed9b4', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'can5', 'ceremony', 'Five canapés each', 'A more generous reception, ideal if dinner is after 4pm.', 1400, 'pp', false, true, 6);
INSERT INTO public.venue_options VALUES
	('0574ba04-4a88-4f41-8d94-3ebd92a2bc1c', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'dinner3', 'breakfast', 'Three-course dinner', 'Seasonal starter, a choice of two mains and dessert. Halal and vegetarian versions of every course.', 11000, 'pp', false, true, 7),
	('87de54f1-b191-46eb-b7de-4a714bfbe44e', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'feast', 'breakfast', 'Sharing feast', 'Platters down the middle of each table: slow-roast lamb, chicken, grains and salads, with a dessert table to finish.', 10400, 'pp', false, true, 8),
	('1af89f9e-b9c4-424f-b49a-8948e9c6a964', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'd_none', 'drinks', 'Pay at the bar', 'No package. Guests buy their own drinks from the venue bar.', 0, 'pp', false, true, 9),
	('3620076a-b323-43b7-b859-c023e91b5641', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'd_classic', 'drinks', 'Classic', 'A welcome drink, half a bottle of wine each with dinner, and sparkling wine for the toast.', 2800, 'pp', false, true, 10),
	('4f151352-89c1-4351-9065-eaedc07017d3', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'd_sig', 'drinks', 'Signature', 'Prosecco on arrival, premium wines with dinner, and champagne for the toast.', 3800, 'pp', false, true, 11),
	('62f3e64d-d8e4-4651-b3ff-bf44d9e14c3c', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'd_pres', 'drinks', 'Prestige', 'Champagne all afternoon, wines chosen by a sommelier, and cocktails after dinner.', 5200, 'pp', false, true, 12),
	('2c2ac881-c8e2-4835-b964-c45774ce443b', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'buffet', 'evening', 'Evening buffet', 'Stone-baked pizzas or a grazing table from 8pm, for every evening guest.', 1500, 'eve', false, true, 13),
	('dd7030a2-a275-482c-b3d7-67df6dfdec7c', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'dj', 'evening', 'DJ, 7pm to midnight', 'The resident DJ with sound system and dance-floor lighting. Send your playlist in the app.', 65000, 'flat', false, true, 14),
	('b71973e7-9f7b-47c7-bbf6-120d1fe46e0b', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'band', 'evening', 'Live band', 'A four-piece band for two 45-minute sets, with a DJ playlist in between.', 180000, 'flat', false, true, 15),
	('3cd5898d-d54b-4e03-9235-abae7153b121', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'dhol', 'evening', 'Dhol drummers', 'Two drummers for your grand entrance, about 20 minutes.', 45000, 'flat', false, true, 16),
	('959928ca-429d-4722-b26e-03e160d4b331', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'lights', 'styling', 'Uplighting and fairy lights', 'Warm-white uplighters in the ceremony room and hall, with a fairy-light canopy over the dance floor.', 40000, 'flat', false, true, 17),
	('d87a777e-f987-4583-9297-f15e4183849b', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'florals', 'styling', 'Table flowers and a ceremony arch', 'Seasonal flowers for every table and an arch for your ceremony, by the venue’s florist.', 95000, 'flat', false, true, 18),
	('72e6cee3-264f-472f-b9df-742de8ce533f', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'candles', 'styling', 'Candles and table styling', 'Candlesticks, glass holders and linen napkins in your colours.', 30000, 'flat', false, true, 19),
	('40e3d19b-0136-48a2-8514-634b884f3874', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', 'rooms', 'stay', 'Hold rooms for your guests', 'We’ll hold rooms nearby at a wedding rate. Guests book and pay for themselves.', 0, 'flat', false, true, 20),
	('7656dd2e-e2c4-4dcd-b40c-ec735ee4ab44', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'hire', 'venue', 'Venue hire', 'Your spaces at Natural History Museum for the day and evening, with tables, chairs, linen and the events team.', 1300000, 'flat', true, true, 0),
	('5741beb0-4e30-4fec-aba1-b3038b4aa7be', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'cer_room', 'ceremony', 'Ceremony in Hintze Hall', 'Twelve spaces are licensed. Hintze Hall takes up to 450 for the ceremony, beneath Hope the blue whale.', 60000, 'flat', false, true, 1),
	('414adc53-7b0d-4f45-9ad2-7526248bc67a', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'can3', 'ceremony', 'Three canapés each', 'Passed round during the drinks reception. Chosen at your tasting.', 900, 'pp', false, true, 4),
	('16f22df1-5665-4162-b4d3-f36fb97c021d', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'can5', 'ceremony', 'Five canapés each', 'A more generous reception, ideal if dinner is after 4pm.', 1400, 'pp', false, true, 5),
	('4dccc624-179e-4976-b27a-6a64c44bbc7c', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'dinner3', 'breakfast', 'Three-course dinner', 'Seasonal starter, a choice of two mains and dessert. Halal and vegetarian versions of every course.', 13000, 'pp', false, true, 6),
	('4644bd13-31ea-476d-92de-32dddd2addfa', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'feast', 'breakfast', 'Sharing feast', 'Platters down the middle of each table: slow-roast lamb, chicken, grains and salads, with a dessert table to finish.', 12400, 'pp', false, true, 7),
	('18691c42-a885-4f7f-94eb-c25c7601624d', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'd_none', 'drinks', 'Pay at the bar', 'No package. Guests buy their own drinks from the venue bar.', 0, 'pp', false, true, 8),
	('e2451ed6-e4a6-4144-a5f0-e232058427e8', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'd_classic', 'drinks', 'Classic', 'A welcome drink, half a bottle of wine each with dinner, and sparkling wine for the toast.', 2800, 'pp', false, true, 9),
	('29a9e900-9ef0-4844-988c-54a0f9e4114c', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'd_sig', 'drinks', 'Signature', 'Prosecco on arrival, premium wines with dinner, and champagne for the toast.', 3800, 'pp', false, true, 10),
	('41101f55-bd83-4be0-b08e-2abb16b723f5', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'd_pres', 'drinks', 'Prestige', 'Champagne all afternoon, wines chosen by a sommelier, and cocktails after dinner.', 5200, 'pp', false, true, 11),
	('90db8cde-4315-4eeb-85e0-92534ca12321', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'buffet', 'evening', 'Evening buffet', 'Stone-baked pizzas or a grazing table from 8pm, for every evening guest.', 1500, 'eve', false, true, 12),
	('70e55001-2880-4db2-adbc-b167440a3594', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'dj', 'evening', 'DJ, 7pm to midnight', 'The resident DJ with sound system and dance-floor lighting. Send your playlist in the app.', 65000, 'flat', false, true, 13),
	('90e769e4-96fd-4351-a4a5-3d52dbf2039b', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'band', 'evening', 'Live band', 'A four-piece band for two 45-minute sets, with a DJ playlist in between.', 180000, 'flat', false, true, 14),
	('4ca3ee05-2f21-40b3-a329-d6c5f8e747a2', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'dhol', 'evening', 'Dhol drummers', 'Two drummers for your grand entrance, about 20 minutes.', 45000, 'flat', false, true, 15),
	('d740a4f0-eae9-49cc-b72e-e3f5eaa690d1', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'lights', 'styling', 'Uplighting and fairy lights', 'Warm-white uplighters in the ceremony room and hall, with a fairy-light canopy over the dance floor.', 40000, 'flat', false, true, 16),
	('be46bde1-9446-456c-aa11-f2bf30761ad1', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'florals', 'styling', 'Table flowers and a ceremony arch', 'Seasonal flowers for every table and an arch for your ceremony, by the venue’s florist.', 95000, 'flat', false, true, 17),
	('e7438554-421e-4530-a913-026a016fa862', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'candles', 'styling', 'Candles and table styling', 'Candlesticks, glass holders and linen napkins in your colours.', 30000, 'flat', false, true, 18),
	('0a9bbbfb-014c-4db8-aa06-356a7cfc234f', '2321b671-cb5f-488e-9988-09bfabd2bf36', 'rooms', 'stay', 'Hold rooms for your guests', 'We’ll hold rooms nearby at a wedding rate. Guests book and pay for themselves.', 0, 'flat', false, true, 19),
	('1630b45a-7a5d-428a-81b7-091e5dff9049', '05512700-0018-492d-be6d-5616c5470e68', 'hire', 'venue', 'Venue hire', 'Your spaces at Dartmouth House for the day and evening, with tables, chairs, linen and the events team.', 280000, 'flat', true, true, 0),
	('e04c2bd5-6742-46cd-b2d3-2071cc25c47c', '05512700-0018-492d-be6d-5616c5470e68', 'cer_room', 'ceremony', 'Ceremony in the house', 'Licensed for civil ceremonies for up to 100 guests. Includes chairs and a table for the registrar.', 60000, 'flat', false, true, 1),
	('d2d17a24-ef3c-499a-b590-ce9c52eca9a9', '05512700-0018-492d-be6d-5616c5470e68', 'cer_garden', 'ceremony', 'Garden ceremony', 'Outdoors in the gardens, with an indoor room kept ready in case it rains.', 75000, 'flat', false, true, 2),
	('de70c8d1-d6d8-46e0-9ea4-64aaae4c3627', '05512700-0018-492d-be6d-5616c5470e68', 'cer_none', 'ceremony', 'Celebration only', 'You’re marrying somewhere else first, and joining your guests here afterwards.', 0, 'flat', false, true, 3),
	('cdea8477-7aa6-4cbd-bc4e-7e8bd04eed6d', '05512700-0018-492d-be6d-5616c5470e68', 'quartet', 'ceremony', 'String quartet', 'For your walk down the aisle and the drinks reception.', 55000, 'flat', false, true, 4),
	('37bec056-05fd-4f89-a66a-976fe1e87f78', '05512700-0018-492d-be6d-5616c5470e68', 'can3', 'ceremony', 'Three canapés each', 'Passed round during the drinks reception. Chosen at your tasting.', 900, 'pp', false, true, 5),
	('75556988-b0dc-4eff-88c5-0b9367fd4308', '05512700-0018-492d-be6d-5616c5470e68', 'can5', 'ceremony', 'Five canapés each', 'A more generous reception, ideal if dinner is after 4pm.', 1400, 'pp', false, true, 6),
	('4fabbd02-c0a6-48dc-a23b-7b9edfd8e8ec', '05512700-0018-492d-be6d-5616c5470e68', 'dinner3', 'breakfast', 'Three-course dinner', 'Seasonal starter, a choice of two mains and dessert. Halal and vegetarian versions of every course.', 12000, 'pp', false, true, 7),
	('423a4a34-64d7-418e-affb-cc04d01ebc04', '05512700-0018-492d-be6d-5616c5470e68', 'feast', 'breakfast', 'Sharing feast', 'Platters down the middle of each table: slow-roast lamb, chicken, grains and salads, with a dessert table to finish.', 11400, 'pp', false, true, 8),
	('03197e37-f37f-4f1f-b30e-4657f501b934', '05512700-0018-492d-be6d-5616c5470e68', 'd_none', 'drinks', 'Pay at the bar', 'No package. Guests buy their own drinks from the venue bar.', 0, 'pp', false, true, 9),
	('a2465cde-9a91-4319-a6cf-113cf1b04880', '05512700-0018-492d-be6d-5616c5470e68', 'd_classic', 'drinks', 'Classic', 'A welcome drink, half a bottle of wine each with dinner, and sparkling wine for the toast.', 2800, 'pp', false, true, 10),
	('fbaad838-494e-460a-966d-4b7c3c254506', '05512700-0018-492d-be6d-5616c5470e68', 'd_sig', 'drinks', 'Signature', 'Prosecco on arrival, premium wines with dinner, and champagne for the toast.', 3800, 'pp', false, true, 11),
	('9139400f-9749-4730-aa40-4d7bf401ccd7', '05512700-0018-492d-be6d-5616c5470e68', 'd_pres', 'drinks', 'Prestige', 'Champagne all afternoon, wines chosen by a sommelier, and cocktails after dinner.', 5200, 'pp', false, true, 12),
	('dab5853d-4ec8-4947-9627-b74fe1935bc9', '05512700-0018-492d-be6d-5616c5470e68', 'buffet', 'evening', 'Evening buffet', 'Stone-baked pizzas or a grazing table from 8pm, for every evening guest.', 1500, 'eve', false, true, 13),
	('15ec548f-bac0-485e-bee1-73dfbdebe053', '05512700-0018-492d-be6d-5616c5470e68', 'dj', 'evening', 'DJ, 7pm to midnight', 'The resident DJ with sound system and dance-floor lighting. Send your playlist in the app.', 65000, 'flat', false, true, 14),
	('83619779-10cf-42b5-a2af-a4b3a6e926a3', '05512700-0018-492d-be6d-5616c5470e68', 'band', 'evening', 'Live band', 'A four-piece band for two 45-minute sets, with a DJ playlist in between.', 180000, 'flat', false, true, 15),
	('83dfa41d-339a-4163-a9f8-7b190fb71889', '05512700-0018-492d-be6d-5616c5470e68', 'dhol', 'evening', 'Dhol drummers', 'Two drummers for your grand entrance, about 20 minutes.', 45000, 'flat', false, true, 16),
	('d1a5edc8-e095-4ceb-b7a1-86ba62f26953', '05512700-0018-492d-be6d-5616c5470e68', 'lights', 'styling', 'Uplighting and fairy lights', 'Warm-white uplighters in the ceremony room and hall, with a fairy-light canopy over the dance floor.', 40000, 'flat', false, true, 17);
INSERT INTO public.venue_options VALUES
	('57d4862a-d7fd-4748-bb56-05c89d7a36b2', '05512700-0018-492d-be6d-5616c5470e68', 'florals', 'styling', 'Table flowers and a ceremony arch', 'Seasonal flowers for every table and an arch for your ceremony, by the venue’s florist.', 95000, 'flat', false, true, 18),
	('25ed3bbb-8351-473b-8add-f68c85df98b8', '05512700-0018-492d-be6d-5616c5470e68', 'candles', 'styling', 'Candles and table styling', 'Candlesticks, glass holders and linen napkins in your colours.', 30000, 'flat', false, true, 19),
	('48aee8fa-69b9-4b57-b786-0b36831aace9', '05512700-0018-492d-be6d-5616c5470e68', 'rooms', 'stay', 'Hold rooms for your guests', 'We’ll hold rooms nearby at a wedding rate. Guests book and pay for themselves.', 0, 'flat', false, true, 20),
	('cb779b8a-b5db-4d5b-ba31-fbe9ed3847d5', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'hire', 'venue', 'Venue hire', 'Your spaces at Kew Gardens for the day and evening, with tables, chairs, linen and the events team.', 300000, 'flat', true, true, 0),
	('50d5fa73-c55b-4a44-bcf7-68e7931a837c', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'cer_room', 'ceremony', 'Ceremony in the Nash Conservatory', 'Up to 200 guests, with floor-to-ceiling windows on three sides. Includes chairs and a table for the registrar.', 60000, 'flat', false, true, 1),
	('840cb58e-31b5-440a-be1d-c4afde207b81', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'cer_garden', 'ceremony', 'Garden ceremony', 'Outdoors in the gardens, with an indoor room kept ready in case it rains.', 75000, 'flat', false, true, 2),
	('71afdf4a-fa95-477e-9615-b321073d34cb', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'cer_none', 'ceremony', 'Celebration only', 'You’re marrying somewhere else first, and joining your guests here afterwards.', 0, 'flat', false, true, 3),
	('88b58e6e-93a7-44c6-b60a-d157659982c4', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'quartet', 'ceremony', 'String quartet', 'For your walk down the aisle and the drinks reception.', 55000, 'flat', false, true, 4),
	('6590a0d6-c747-4334-af68-70fe8f556301', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'can3', 'ceremony', 'Three canapés each', 'Passed round during the drinks reception. Chosen at your tasting.', 900, 'pp', false, true, 5),
	('37d129c3-e964-4b47-b0d0-3fc64a75f9a4', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'can5', 'ceremony', 'Five canapés each', 'A more generous reception, ideal if dinner is after 4pm.', 1400, 'pp', false, true, 6),
	('3c2fcaa5-ae98-4197-bd2b-5928fb41bb31', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'dinner3', 'breakfast', 'Three-course dinner', 'Seasonal starter, a choice of two mains and dessert. Halal and vegetarian versions of every course.', 12500, 'pp', false, true, 7),
	('b7e22639-d880-49af-b0a2-3c34cbb324e7', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'feast', 'breakfast', 'Sharing feast', 'Platters down the middle of each table: slow-roast lamb, chicken, grains and salads, with a dessert table to finish.', 11900, 'pp', false, true, 8),
	('beea7d1a-5b72-4274-8c29-5932ccd78c52', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'd_none', 'drinks', 'Pay at the bar', 'No package. Guests buy their own drinks from the venue bar.', 0, 'pp', false, true, 9),
	('32c0e0dd-7614-473f-927f-9e44f1efddf5', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'd_classic', 'drinks', 'Classic', 'A welcome drink, half a bottle of wine each with dinner, and sparkling wine for the toast.', 2800, 'pp', false, true, 10),
	('b15eef66-d4b4-49ec-b159-10d7340a4e9a', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'd_sig', 'drinks', 'Signature', 'Prosecco on arrival, premium wines with dinner, and champagne for the toast.', 3800, 'pp', false, true, 11),
	('aa412022-1fff-4370-ac57-39d1fdd99d7b', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'd_pres', 'drinks', 'Prestige', 'Champagne all afternoon, wines chosen by a sommelier, and cocktails after dinner.', 5200, 'pp', false, true, 12),
	('10caa279-3650-4109-9feb-3d4ea1771b45', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'buffet', 'evening', 'Evening buffet', 'Stone-baked pizzas or a grazing table from 8pm, for every evening guest.', 1500, 'eve', false, true, 13),
	('32ce55b4-cd90-47b2-86e0-6597c5b18006', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'dj', 'evening', 'DJ, 7pm to midnight', 'The resident DJ with sound system and dance-floor lighting. Send your playlist in the app.', 65000, 'flat', false, true, 14),
	('16a2ea43-8bcb-4471-89af-b149e26a48b7', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'band', 'evening', 'Live band', 'A four-piece band for two 45-minute sets, with a DJ playlist in between.', 180000, 'flat', false, true, 15),
	('11eefe14-8569-4c49-9d54-c234c03c70c0', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'dhol', 'evening', 'Dhol drummers', 'Two drummers for your grand entrance, about 20 minutes.', 45000, 'flat', false, true, 16),
	('6e946840-b689-493f-a84b-dca2e03bb2e0', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'lights', 'styling', 'Uplighting and fairy lights', 'Warm-white uplighters in the ceremony room and hall, with a fairy-light canopy over the dance floor.', 40000, 'flat', false, true, 17),
	('380165e8-9496-4f9d-b08c-8662977abd5a', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'florals', 'styling', 'Table flowers and a ceremony arch', 'Seasonal flowers for every table and an arch for your ceremony, by the venue’s florist.', 95000, 'flat', false, true, 18),
	('55c46738-9b57-44af-8935-ee387e5c5a7d', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'candles', 'styling', 'Candles and table styling', 'Candlesticks, glass holders and linen napkins in your colours.', 30000, 'flat', false, true, 19),
	('95920a2e-ee3a-445b-9552-28620f344604', '2e8b22f9-e677-4e46-ac62-295cc54fe416', 'rooms', 'stay', 'Hold rooms for your guests', 'We’ll hold rooms nearby at a wedding rate. Guests book and pay for themselves.', 0, 'flat', false, true, 20),
	('9ebe47d6-05c5-490c-b6fa-5d25b22c508b', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'hire', 'venue', 'Venue hire', 'Your spaces at Shoreditch Town Hall for the day and evening, with tables, chairs, linen and the events team.', 800000, 'flat', true, true, 0),
	('848cea77-ecdf-4976-9f44-644187bf561d', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'cer_room', 'ceremony', 'Ceremony in the Large Committee Room', 'Several rooms are licensed, from the intimate Mayor’s Parlour to The Ditch. Includes chairs and a table for the registrar.', 60000, 'flat', false, true, 1),
	('f068c51b-459d-41f2-9c8b-db1fcfcc3f38', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'cer_none', 'ceremony', 'Celebration only', 'You’re marrying somewhere else first, and joining your guests here afterwards.', 0, 'flat', false, true, 2),
	('c9dce38f-9d34-47d5-a5eb-6623866662c0', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'quartet', 'ceremony', 'String quartet', 'For your walk down the aisle and the drinks reception.', 55000, 'flat', false, true, 3),
	('dc42b1a0-7cd7-4460-8dff-aaa263912b79', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'can3', 'ceremony', 'Three canapés each', 'Passed round during the drinks reception. Chosen at your tasting.', 900, 'pp', false, true, 4),
	('8d005668-cc5e-4d0a-a1c8-e4608d2ebf73', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'can5', 'ceremony', 'Five canapés each', 'A more generous reception, ideal if dinner is after 4pm.', 1400, 'pp', false, true, 5),
	('48580556-d198-4bb4-9efe-6d5369d7209b', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'dinner3', 'breakfast', 'Three-course dinner', 'Seasonal starter, a choice of two mains and dessert. Halal and vegetarian versions of every course.', 9500, 'pp', false, true, 6),
	('b9720269-48c0-4297-98b6-fa8d4a620260', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'feast', 'breakfast', 'Sharing feast', 'Platters down the middle of each table: slow-roast lamb, chicken, grains and salads, with a dessert table to finish.', 8900, 'pp', false, true, 7),
	('4a0d0f80-f58b-4dfa-98ca-6416a8a76d34', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'd_none', 'drinks', 'Pay at the bar', 'No package. Guests buy their own drinks from the venue bar.', 0, 'pp', false, true, 8),
	('f6b15b36-7da8-4dcd-95ee-d6fa6940132f', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'd_classic', 'drinks', 'Classic', 'A welcome drink, half a bottle of wine each with dinner, and sparkling wine for the toast.', 2800, 'pp', false, true, 9),
	('bc2a3152-9f1e-4c41-81e5-32f755664e59', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'd_sig', 'drinks', 'Signature', 'Prosecco on arrival, premium wines with dinner, and champagne for the toast.', 3800, 'pp', false, true, 10),
	('697a31d3-894b-470f-b99d-6de8ec037f51', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'd_pres', 'drinks', 'Prestige', 'Champagne all afternoon, wines chosen by a sommelier, and cocktails after dinner.', 5200, 'pp', false, true, 11),
	('e9bff362-a557-4b65-a9b7-62d15dcd49ff', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'buffet', 'evening', 'Evening buffet', 'Stone-baked pizzas or a grazing table from 8pm, for every evening guest.', 1500, 'eve', false, true, 12),
	('66e1b2ee-6e03-4045-adb5-b2bad7d80ceb', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'dj', 'evening', 'DJ, 7pm to midnight', 'The resident DJ with sound system and dance-floor lighting. Send your playlist in the app.', 65000, 'flat', false, true, 13),
	('99d4ac0e-b50c-4da2-a770-6acaab0c5022', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'band', 'evening', 'Live band', 'A four-piece band for two 45-minute sets, with a DJ playlist in between.', 180000, 'flat', false, true, 14),
	('dfbaf49f-c652-4314-8a88-296f44c6be2c', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'dhol', 'evening', 'Dhol drummers', 'Two drummers for your grand entrance, about 20 minutes.', 45000, 'flat', false, true, 15),
	('2f5f4b61-90e4-47fc-92b8-c20b95acb19a', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'latebar', 'evening', 'Late bar to 1am', 'Keeps the bar open for an extra hour under the venue’s late licence.', 35000, 'flat', false, true, 16),
	('3bc9b716-6cdd-4dd0-975c-1cb006493fed', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'lights', 'styling', 'Uplighting and fairy lights', 'Warm-white uplighters in the ceremony room and hall, with a fairy-light canopy over the dance floor.', 40000, 'flat', false, true, 17),
	('a1efa912-63a9-4bf1-82d8-bcc971767d4f', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'florals', 'styling', 'Table flowers and a ceremony arch', 'Seasonal flowers for every table and an arch for your ceremony, by the venue’s florist.', 95000, 'flat', false, true, 18),
	('5d2df6f3-6c95-4e8e-81f1-6fe62351740a', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'candles', 'styling', 'Candles and table styling', 'Candlesticks, glass holders and linen napkins in your colours.', 30000, 'flat', false, true, 19),
	('28530c7c-2fa5-4458-9e84-ec37bffe46de', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', 'rooms', 'stay', 'Hold rooms for your guests', 'We’ll hold rooms nearby at a wedding rate. Guests book and pay for themselves.', 0, 'flat', false, true, 20),
	('49164fa5-4602-4037-aa5d-42bc38c89732', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'hire', 'venue', 'Venue hire', 'Your spaces at Horniman Museum and Gardens for the day and evening, with tables, chairs, linen and the events team.', 120000, 'flat', true, true, 0),
	('7a5bcd17-b457-4276-904c-5feb01fc3bcc', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'cer_room', 'ceremony', 'Ceremony in the Conservatory', 'All three spaces are licensed, including the Victorian Conservatory and the Bandstand with views across London.', 60000, 'flat', false, true, 1),
	('f47b9f2f-af7f-4753-835e-3ec638ab225e', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'cer_garden', 'ceremony', 'Garden ceremony', 'Outdoors in the gardens, with an indoor room kept ready in case it rains.', 75000, 'flat', false, true, 2),
	('0121595d-714f-457a-aa5e-72e109d5419a', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'cer_none', 'ceremony', 'Celebration only', 'You’re marrying somewhere else first, and joining your guests here afterwards.', 0, 'flat', false, true, 3),
	('b98c4588-a6e8-4ecd-a7d2-764c5862289e', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'quartet', 'ceremony', 'String quartet', 'For your walk down the aisle and the drinks reception.', 55000, 'flat', false, true, 4);
INSERT INTO public.venue_options VALUES
	('7fb1f7b5-ae39-4be6-89dc-124b975eaf77', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'can3', 'ceremony', 'Three canapés each', 'Passed round during the drinks reception. Chosen at your tasting.', 900, 'pp', false, true, 5),
	('a05f35b7-8d9a-404e-90a6-351631999e3d', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'can5', 'ceremony', 'Five canapés each', 'A more generous reception, ideal if dinner is after 4pm.', 1400, 'pp', false, true, 6),
	('381c7cc3-7eb4-4435-b372-7bae8e1671d9', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'dinner3', 'breakfast', 'Three-course dinner', 'Seasonal starter, a choice of two mains and dessert. Halal and vegetarian versions of every course.', 8500, 'pp', false, true, 7),
	('da0e7584-2ec7-4576-9cae-59297f0b5b33', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'feast', 'breakfast', 'Sharing feast', 'Platters down the middle of each table: slow-roast lamb, chicken, grains and salads, with a dessert table to finish.', 7900, 'pp', false, true, 8),
	('d3b2f750-c29b-469d-bc24-fd273afe3a31', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'd_none', 'drinks', 'Pay at the bar', 'No package. Guests buy their own drinks from the venue bar.', 0, 'pp', false, true, 9),
	('6939855f-cce9-4409-86d7-3ebcfbe46490', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'd_classic', 'drinks', 'Classic', 'A welcome drink, half a bottle of wine each with dinner, and sparkling wine for the toast.', 2800, 'pp', false, true, 10),
	('ee6806fb-4c15-4161-9d5a-a36d3ff74e86', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'd_sig', 'drinks', 'Signature', 'Prosecco on arrival, premium wines with dinner, and champagne for the toast.', 3800, 'pp', false, true, 11),
	('d03ba320-e44d-41e0-82e2-2d72546a780d', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'd_pres', 'drinks', 'Prestige', 'Champagne all afternoon, wines chosen by a sommelier, and cocktails after dinner.', 5200, 'pp', false, true, 12),
	('dde7b7ff-02f0-4a43-b4e4-929791901dad', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'buffet', 'evening', 'Evening buffet', 'Stone-baked pizzas or a grazing table from 8pm, for every evening guest.', 1500, 'eve', false, true, 13),
	('0d995052-208a-4210-8fa6-5ee4c00dd2fc', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'dj', 'evening', 'DJ, 7pm to midnight', 'The resident DJ with sound system and dance-floor lighting. Send your playlist in the app.', 65000, 'flat', false, true, 14),
	('0514c07e-0692-4af6-81c9-8b0c61b5d4f9', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'band', 'evening', 'Live band', 'A four-piece band for two 45-minute sets, with a DJ playlist in between.', 180000, 'flat', false, true, 15),
	('ae9c657b-2954-4df2-8f40-519e4d5c9f82', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'dhol', 'evening', 'Dhol drummers', 'Two drummers for your grand entrance, about 20 minutes.', 45000, 'flat', false, true, 16),
	('783b47b7-92ec-490a-8ce8-a221acae7594', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'lights', 'styling', 'Uplighting and fairy lights', 'Warm-white uplighters in the ceremony room and hall, with a fairy-light canopy over the dance floor.', 40000, 'flat', false, true, 17),
	('212e5d23-b6e6-4443-85b2-7e7807415709', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'florals', 'styling', 'Table flowers and a ceremony arch', 'Seasonal flowers for every table and an arch for your ceremony, by the venue’s florist.', 95000, 'flat', false, true, 18),
	('f4427c41-ef9a-4ce5-bf7f-58bb2d0e6e3c', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'candles', 'styling', 'Candles and table styling', 'Candlesticks, glass holders and linen napkins in your colours.', 30000, 'flat', false, true, 19),
	('289965f4-a7df-40fc-b342-b949c03fe52b', '78f2fde8-7b08-4df1-822e-7697b5e7b078', 'rooms', 'stay', 'Hold rooms for your guests', 'We’ll hold rooms nearby at a wedding rate. Guests book and pay for themselves.', 0, 'flat', false, true, 20),
	('73f9c1ff-a4ce-4738-a1fe-c2f7af8d025c', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'hire', 'venue', 'Venue hire', 'Your spaces at Fulham Palace for the day and evening, with tables, chairs, linen and the events team.', 500000, 'flat', true, true, 0),
	('4a324f64-2c5b-4aad-a32e-ef3a455254e6', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'cer_room', 'ceremony', 'Ceremony in the Palace', 'Four rooms are licensed for up to 120, and the private chapel seats 90 for a blessing.', 60000, 'flat', false, true, 1),
	('73967c36-e68b-4a71-8dd7-09f330cb71a5', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'cer_garden', 'ceremony', 'Garden ceremony', 'Outdoors in the gardens, with an indoor room kept ready in case it rains.', 75000, 'flat', false, true, 2),
	('3b4eb310-66fb-4cec-8966-cfc0878b5dcd', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'cer_none', 'ceremony', 'Celebration only', 'You’re marrying somewhere else first, and joining your guests here afterwards.', 0, 'flat', false, true, 3),
	('e1d18184-3079-4e51-8440-bbbf8a88328b', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'quartet', 'ceremony', 'String quartet', 'For your walk down the aisle and the drinks reception.', 55000, 'flat', false, true, 4),
	('73757d17-3046-48f7-8377-4ed41e973f80', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'can3', 'ceremony', 'Three canapés each', 'Passed round during the drinks reception. Chosen at your tasting.', 900, 'pp', false, true, 5),
	('aa032f02-f016-4145-ae09-af8f90b49cb1', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'can5', 'ceremony', 'Five canapés each', 'A more generous reception, ideal if dinner is after 4pm.', 1400, 'pp', false, true, 6),
	('86d05313-4912-43e1-87fb-301b926315d3', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'dinner3', 'breakfast', 'Three-course dinner', 'Seasonal starter, a choice of two mains and dessert. Halal and vegetarian versions of every course.', 10000, 'pp', false, true, 7),
	('6538913d-f9bb-47eb-b400-74410411e34b', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'feast', 'breakfast', 'Sharing feast', 'Platters down the middle of each table: slow-roast lamb, chicken, grains and salads, with a dessert table to finish.', 9400, 'pp', false, true, 8),
	('f455bd66-6246-4c03-b144-284ee82d3e52', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'd_none', 'drinks', 'Pay at the bar', 'No package. Guests buy their own drinks from the venue bar.', 0, 'pp', false, true, 9),
	('f9979263-e3f0-4e83-aba9-12737d165646', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'd_classic', 'drinks', 'Classic', 'A welcome drink, half a bottle of wine each with dinner, and sparkling wine for the toast.', 2800, 'pp', false, true, 10),
	('e9e89ed9-e894-452e-bb6b-9e9191fff9f3', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'd_sig', 'drinks', 'Signature', 'Prosecco on arrival, premium wines with dinner, and champagne for the toast.', 3800, 'pp', false, true, 11),
	('8aa320c3-a82d-4260-a45d-99bf6eab4cda', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'd_pres', 'drinks', 'Prestige', 'Champagne all afternoon, wines chosen by a sommelier, and cocktails after dinner.', 5200, 'pp', false, true, 12),
	('0fa38bb0-838c-4e85-8d09-8110f6c03f55', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'buffet', 'evening', 'Evening buffet', 'Stone-baked pizzas or a grazing table from 8pm, for every evening guest.', 1500, 'eve', false, true, 13),
	('7a8f36ee-8347-424a-af97-ce07a1cd3443', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'dj', 'evening', 'DJ, 7pm to midnight', 'The resident DJ with sound system and dance-floor lighting. Send your playlist in the app.', 65000, 'flat', false, true, 14),
	('1043f4d2-0c1d-48ec-9fe0-6cc84f85e523', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'band', 'evening', 'Live band', 'A four-piece band for two 45-minute sets, with a DJ playlist in between.', 180000, 'flat', false, true, 15),
	('311c5b6c-f457-4bf5-acb7-ea11f08a8f74', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'dhol', 'evening', 'Dhol drummers', 'Two drummers for your grand entrance, about 20 minutes.', 45000, 'flat', false, true, 16),
	('29328e99-5c05-404e-ba04-2408511bc058', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'latebar', 'evening', 'Late bar to 1am', 'Keeps the bar open for an extra hour under the venue’s late licence.', 35000, 'flat', false, true, 17),
	('bb3250d5-329c-4d62-ae6c-37edbf3257c6', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'lights', 'styling', 'Uplighting and fairy lights', 'Warm-white uplighters in the ceremony room and hall, with a fairy-light canopy over the dance floor.', 40000, 'flat', false, true, 18),
	('a7ac6e70-2ced-4d0d-aa16-dbd4d1f1a5cc', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'florals', 'styling', 'Table flowers and a ceremony arch', 'Seasonal flowers for every table and an arch for your ceremony, by the venue’s florist.', 95000, 'flat', false, true, 19),
	('540619b0-e406-4b47-8180-f211ca75fbf2', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'candles', 'styling', 'Candles and table styling', 'Candlesticks, glass holders and linen napkins in your colours.', 30000, 'flat', false, true, 20),
	('e9b8a75d-a13b-40f4-8596-d61dfd233d79', '1adefe2e-9eb7-4ca8-9705-208252e174fa', 'rooms', 'stay', 'Hold rooms for your guests', 'We’ll hold rooms nearby at a wedding rate. Guests book and pay for themselves.', 0, 'flat', false, true, 21),
	('af4df8d3-721f-4603-a9ee-8eb2e6220fef', '58cb67f8-f6af-4903-9849-44debc3375f3', 'hire', 'venue', 'Venue hire', 'Your spaces at Pembroke Lodge for the day and evening, with tables, chairs, linen and the events team.', 300000, 'flat', true, true, 0),
	('b2710802-6718-4e4c-adba-55078effc49d', '58cb67f8-f6af-4903-9849-44debc3375f3', 'cer_room', 'ceremony', 'Ceremony under the Oak Gazebo', 'Licensed outdoor gazebos and indoor suites, with ceremonies led by Richmond Register Office.', 60000, 'flat', false, true, 1),
	('73e5e129-2df0-4718-aca3-18585c07a802', '58cb67f8-f6af-4903-9849-44debc3375f3', 'cer_garden', 'ceremony', 'Garden ceremony', 'Outdoors in the gardens, with an indoor room kept ready in case it rains.', 75000, 'flat', false, true, 2),
	('6ce20bd6-7f99-4eea-aa48-250a0cd5fa87', '58cb67f8-f6af-4903-9849-44debc3375f3', 'cer_none', 'ceremony', 'Celebration only', 'You’re marrying somewhere else first, and joining your guests here afterwards.', 0, 'flat', false, true, 3),
	('0bd09e15-0332-44de-af67-c02c84f7b54a', '58cb67f8-f6af-4903-9849-44debc3375f3', 'quartet', 'ceremony', 'String quartet', 'For your walk down the aisle and the drinks reception.', 55000, 'flat', false, true, 4),
	('07dfad56-f20e-4d74-867d-bcbda894a3fb', '58cb67f8-f6af-4903-9849-44debc3375f3', 'can3', 'ceremony', 'Three canapés each', 'Passed round during the drinks reception. Chosen at your tasting.', 900, 'pp', false, true, 5),
	('a218ff0f-2074-4c17-b532-047d633f8e67', '58cb67f8-f6af-4903-9849-44debc3375f3', 'can5', 'ceremony', 'Five canapés each', 'A more generous reception, ideal if dinner is after 4pm.', 1400, 'pp', false, true, 6),
	('bd883bb9-84ea-4dad-b3b3-ac1ff145fa9e', '58cb67f8-f6af-4903-9849-44debc3375f3', 'dinner3', 'breakfast', 'Three-course dinner', 'Seasonal starter, a choice of two mains and dessert. Halal and vegetarian versions of every course.', 11800, 'pp', false, true, 7),
	('01c48e45-9000-4f5d-ae2d-5de12bbc5fa1', '58cb67f8-f6af-4903-9849-44debc3375f3', 'feast', 'breakfast', 'Sharing feast', 'Platters down the middle of each table: slow-roast lamb, chicken, grains and salads, with a dessert table to finish.', 11200, 'pp', false, true, 8),
	('c8e75beb-5721-4091-910c-010d70a7160d', '58cb67f8-f6af-4903-9849-44debc3375f3', 'd_none', 'drinks', 'Pay at the bar', 'No package. Guests buy their own drinks from the venue bar.', 0, 'pp', false, true, 9),
	('4db519a5-8afc-4ae2-89e0-ab3ef144e8e3', '58cb67f8-f6af-4903-9849-44debc3375f3', 'd_classic', 'drinks', 'Classic', 'A welcome drink, half a bottle of wine each with dinner, and sparkling wine for the toast.', 2800, 'pp', false, true, 10),
	('f931e34c-5f56-45e0-a8bb-188fcb36903e', '58cb67f8-f6af-4903-9849-44debc3375f3', 'd_sig', 'drinks', 'Signature', 'Prosecco on arrival, premium wines with dinner, and champagne for the toast.', 3800, 'pp', false, true, 11);
INSERT INTO public.venue_options VALUES
	('ffbf8664-de59-4417-941f-dc4e7491f611', '58cb67f8-f6af-4903-9849-44debc3375f3', 'd_pres', 'drinks', 'Prestige', 'Champagne all afternoon, wines chosen by a sommelier, and cocktails after dinner.', 5200, 'pp', false, true, 12),
	('459184e9-56b9-4d97-9047-26af793c152f', '58cb67f8-f6af-4903-9849-44debc3375f3', 'buffet', 'evening', 'Evening buffet', 'Stone-baked pizzas or a grazing table from 8pm, for every evening guest.', 1500, 'eve', false, true, 13),
	('bc8a5ebe-f5de-4033-baba-6442dce4b3f7', '58cb67f8-f6af-4903-9849-44debc3375f3', 'dj', 'evening', 'DJ, 7pm to midnight', 'The resident DJ with sound system and dance-floor lighting. Send your playlist in the app.', 65000, 'flat', false, true, 14),
	('78b4b249-280f-4882-9473-5d106fbd7a4f', '58cb67f8-f6af-4903-9849-44debc3375f3', 'band', 'evening', 'Live band', 'A four-piece band for two 45-minute sets, with a DJ playlist in between.', 180000, 'flat', false, true, 15),
	('ee51ddc7-2ed5-4fad-8c53-f9d527eb9ab4', '58cb67f8-f6af-4903-9849-44debc3375f3', 'dhol', 'evening', 'Dhol drummers', 'Two drummers for your grand entrance, about 20 minutes.', 45000, 'flat', false, true, 16),
	('bc10734b-fad9-46f5-ba4f-562cc978e3cd', '58cb67f8-f6af-4903-9849-44debc3375f3', 'lights', 'styling', 'Uplighting and fairy lights', 'Warm-white uplighters in the ceremony room and hall, with a fairy-light canopy over the dance floor.', 40000, 'flat', false, true, 17),
	('fd069a9d-0828-4e46-9364-b706b024b24f', '58cb67f8-f6af-4903-9849-44debc3375f3', 'florals', 'styling', 'Table flowers and a ceremony arch', 'Seasonal flowers for every table and an arch for your ceremony, by the venue’s florist.', 95000, 'flat', false, true, 18),
	('1bd478a2-7912-4a87-9388-c3df3979da75', '58cb67f8-f6af-4903-9849-44debc3375f3', 'candles', 'styling', 'Candles and table styling', 'Candlesticks, glass holders and linen napkins in your colours.', 30000, 'flat', false, true, 19),
	('d3a32714-5abb-4188-9ffc-17972569830f', '58cb67f8-f6af-4903-9849-44debc3375f3', 'rooms', 'stay', 'Hold rooms for your guests', 'We’ll hold rooms nearby at a wedding rate. Guests book and pay for themselves.', 0, 'flat', false, true, 20),
	('6070ac7f-b967-4d49-9bbc-f7e2c5ff84f0', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'hire', 'venue', 'Venue hire', 'The ballroom for the day and evening, overlooking Hyde Park, with its own terrace and a wedding planner from the hotel.', 950000, 'flat', true, true, 0),
	('e2f49bbe-88e7-4875-9597-829c11443ed7', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'cer_room', 'ceremony', 'Ceremony in the Carlyle Suite', 'Licensed for civil ceremonies for up to 200 guests. Includes chairs, an aisle runner and a table for the registrar.', 60000, 'flat', false, true, 1),
	('9284bade-1fb3-409b-8d65-bbe784401b03', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'cer_none', 'ceremony', 'Celebration only', 'You’re marrying somewhere else first, and joining your guests here afterwards.', 0, 'flat', false, true, 2),
	('8e3d3499-abd2-46cf-8478-84950f8466ce', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'quartet', 'ceremony', 'String quartet', 'For your walk down the aisle and the drinks reception.', 55000, 'flat', false, true, 3),
	('ce9ee8d1-9107-4c32-98f8-17390a1e176f', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'can3', 'ceremony', 'Three canapés each', 'Passed round during the drinks reception. Chosen at your tasting.', 900, 'pp', false, true, 4),
	('828775a1-2f9a-469b-ab60-9790db565d45', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'can5', 'ceremony', 'Five canapés each', 'A more generous reception, ideal if dinner is after 4pm.', 1400, 'pp', false, true, 5),
	('5a29bdf9-9255-48f8-a879-5d7d85548794', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'dinner3', 'breakfast', 'Three-course dinner', 'Seasonal starter, a choice of two mains and dessert. Halal and vegetarian versions of every course.', 14000, 'pp', false, true, 6),
	('c5689ba1-e08e-4422-ae03-01328840be5f', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'feast', 'breakfast', 'Sharing feast', 'Platters down the middle of each table: slow-roast lamb, chicken, grains and salads, with a dessert table to finish.', 13400, 'pp', false, true, 7),
	('779b3b95-8352-4b0a-8135-f691a85f4e94', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'd_none', 'drinks', 'Pay at the bar', 'No package. Guests buy their own drinks from the venue bar.', 0, 'pp', false, true, 8),
	('c61489ce-633e-4e6c-acf0-07727ab2433b', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'd_classic', 'drinks', 'Classic', 'A welcome drink, half a bottle of wine each with dinner, and sparkling wine for the toast.', 2800, 'pp', false, true, 9),
	('0ca1ccbe-f5f3-409a-be07-26cb97cd5153', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'd_sig', 'drinks', 'Signature', 'Prosecco on arrival, premium wines with dinner, and champagne for the toast.', 3800, 'pp', false, true, 10),
	('ecce6a24-b621-4b34-84b2-e6b1a1ffca33', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'd_pres', 'drinks', 'Prestige', 'Champagne all afternoon, wines chosen by a sommelier, and cocktails after dinner.', 5200, 'pp', false, true, 11),
	('71de02d0-0e83-43c3-9d2d-b979c8930145', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'buffet', 'evening', 'Evening buffet', 'Stone-baked pizzas or a grazing table from 8pm, for every evening guest.', 1500, 'eve', false, true, 12),
	('e4bb7dde-28c6-4fce-b92f-70442d0fd592', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'dj', 'evening', 'DJ, 7pm to midnight', 'The resident DJ with sound system and dance-floor lighting. Send your playlist in the app.', 65000, 'flat', false, true, 13),
	('6c67b5ae-3c85-403a-871e-2408e9cfe70a', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'band', 'evening', 'Live band', 'A four-piece band for two 45-minute sets, with a DJ playlist in between.', 180000, 'flat', false, true, 14),
	('c61e8f2d-9e7b-4bf7-a276-1b65bc2c0ef9', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'dhol', 'evening', 'Dhol drummers', 'Two drummers for your grand entrance, about 20 minutes.', 45000, 'flat', false, true, 15),
	('68d57173-596f-401f-9f1d-804278695903', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'lights', 'styling', 'Uplighting and fairy lights', 'Warm-white uplighters in the ceremony room and hall, with a fairy-light canopy over the dance floor.', 40000, 'flat', false, true, 16),
	('b24c1f91-0e28-4c72-a873-264223465229', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'florals', 'styling', 'Table flowers and a ceremony arch', 'Seasonal flowers for every table and an arch for your ceremony, by the venue’s florist.', 95000, 'flat', false, true, 17),
	('aac7679d-e66c-4981-8e56-300947058dc0', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'candles', 'styling', 'Candles and table styling', 'Candlesticks, glass holders and linen napkins in your colours.', 30000, 'flat', false, true, 18),
	('ce99da9d-010c-4503-8739-a66af23825d4', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'suite', 'stay', 'Bridal suite for the night', 'Included with your venue hire, with breakfast the next morning.', 0, 'flat', false, true, 19),
	('cacadbbb-c41f-495f-b5c3-079476ce7c9d', 'c9995099-8711-403d-9f38-c4f0757c1b09', 'rooms', 'stay', 'Hold rooms for your guests', 'We’ll hold rooms nearby at a wedding rate. Guests book and pay for themselves.', 0, 'flat', false, true, 20);
INSERT INTO public.venue_photos VALUES
	('98b0b642-f318-4134-8787-6d4ce7f57bca', 'a0e6edc8-9411-49da-9872-7f93ed378012', '/photos/ornc-1.jpg', 1200, 753, 'Old Royal Naval College, photo 1', 0),
	('8792ee50-2605-4f65-8bfc-5b835bb86e33', 'a0e6edc8-9411-49da-9872-7f93ed378012', '/photos/ornc-2.jpg', 1200, 753, 'Old Royal Naval College, photo 2', 1),
	('54909aea-b24e-4ab7-9d45-3c140a8310c0', 'a0e6edc8-9411-49da-9872-7f93ed378012', '/photos/ornc-3.jpg', 1200, 753, 'Old Royal Naval College, photo 3', 2),
	('230d2c45-51b6-4922-aef8-f1cf0d996daf', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', '/photos/bh-1.jpg', 1200, 753, 'Banqueting House, photo 1', 0),
	('cda3ddad-7060-4593-8fd8-694beadae7fa', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', '/photos/bh-2.jpg', 1200, 753, 'Banqueting House, photo 2', 1),
	('8b92bd4a-154c-479f-8fe2-2025f96d0b3b', '57db0f4b-89f6-4f7e-8410-01fb486cf21d', '/photos/bh-3.jpg', 1200, 753, 'Banqueting House, photo 3', 2),
	('592dca7a-8c12-4086-89ed-03585293a3f2', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', '/photos/syon-1.jpg', 1200, 753, 'Syon Park, photo 1', 0),
	('5b9c3713-fbb2-4508-b144-939a15ac0594', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', '/photos/syon-2.jpg', 1200, 753, 'Syon Park, photo 2', 1),
	('2f7a450a-3ae8-458f-98f9-b16884b43552', '05940b4c-ab0f-447e-8712-efe7e8fecfc8', '/photos/syon-3.jpg', 1200, 753, 'Syon Park, photo 3', 2),
	('87e24047-78fd-4c6f-94d9-01b90655f0f9', '2321b671-cb5f-488e-9988-09bfabd2bf36', '/photos/nhm-1.jpg', 1200, 753, 'Natural History Museum, photo 1', 0),
	('a3823232-91d6-4896-9311-2d348ee3d52d', '2321b671-cb5f-488e-9988-09bfabd2bf36', '/photos/nhm-2.jpg', 1200, 753, 'Natural History Museum, photo 2', 1),
	('0f8bb634-ec5f-49bd-9ff5-81c83a85e88d', '2321b671-cb5f-488e-9988-09bfabd2bf36', '/photos/nhm-3.jpg', 1200, 753, 'Natural History Museum, photo 3', 2),
	('0b7248e7-1965-444e-ae92-0738428a841a', '05512700-0018-492d-be6d-5616c5470e68', '/photos/dart-1.jpg', 1200, 753, 'Dartmouth House, photo 1', 0),
	('c9c8b6d2-7f0a-48dc-a6de-18b6a6897c6c', '05512700-0018-492d-be6d-5616c5470e68', '/photos/dart-2.jpg', 1200, 753, 'Dartmouth House, photo 2', 1),
	('dc7e999d-4c9f-47b8-b8eb-1e50094f1fea', '05512700-0018-492d-be6d-5616c5470e68', '/photos/dart-3.jpg', 1200, 753, 'Dartmouth House, photo 3', 2),
	('b1e888c2-8213-424d-a663-21eef713267f', '2e8b22f9-e677-4e46-ac62-295cc54fe416', '/photos/kew-1.jpg', 1200, 753, 'Kew Gardens, photo 1', 0),
	('7550cd5c-7523-48f4-b0f4-2bf063be9013', '2e8b22f9-e677-4e46-ac62-295cc54fe416', '/photos/kew-2.jpg', 1200, 753, 'Kew Gardens, photo 2', 1),
	('0215def5-52e4-447a-aa7f-7a2c7e933337', '2e8b22f9-e677-4e46-ac62-295cc54fe416', '/photos/kew-3.jpg', 1200, 753, 'Kew Gardens, photo 3', 2),
	('0809ad31-070a-4c59-8c7d-b1bae7e211f9', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', '/photos/sth-1.jpg', 1200, 753, 'Shoreditch Town Hall, photo 1', 0),
	('07ac4a01-be6f-41f1-ba99-c01e83f4bc83', '14de04f9-7b0c-42fa-9bd8-1ccd6e4be2c4', '/photos/sth-2.jpg', 1200, 753, 'Shoreditch Town Hall, photo 2', 1),
	('2764c55a-3aaf-434f-909e-7c18cd463330', '78f2fde8-7b08-4df1-822e-7697b5e7b078', '/photos/horn-1.jpg', 1200, 753, 'Horniman Museum and Gardens, photo 1', 0),
	('a2282d93-a19f-4460-9a62-c4c09d5ac262', '78f2fde8-7b08-4df1-822e-7697b5e7b078', '/photos/horn-2.jpg', 1200, 753, 'Horniman Museum and Gardens, photo 2', 1),
	('16a95150-98ae-49d9-a740-e5140263b4f3', '78f2fde8-7b08-4df1-822e-7697b5e7b078', '/photos/horn-3.jpg', 1200, 753, 'Horniman Museum and Gardens, photo 3', 2),
	('fa799f72-0e84-48e5-a47e-0d7a67aa52d9', '1adefe2e-9eb7-4ca8-9705-208252e174fa', '/photos/fulham-1.jpg', 1200, 753, 'Fulham Palace, photo 1', 0),
	('9fcebeb6-3c60-420b-90f7-20b0e7b84fed', '1adefe2e-9eb7-4ca8-9705-208252e174fa', '/photos/fulham-2.jpg', 1200, 753, 'Fulham Palace, photo 2', 1),
	('8de54f49-1de6-4cf5-941b-c453e373feee', '1adefe2e-9eb7-4ca8-9705-208252e174fa', '/photos/fulham-3.jpg', 1200, 753, 'Fulham Palace, photo 3', 2),
	('2ceda446-da81-4135-b254-ad1bb04fef60', '58cb67f8-f6af-4903-9849-44debc3375f3', '/photos/pemb-1.jpg', 1200, 753, 'Pembroke Lodge, photo 1', 0),
	('43ac6c71-66da-42bb-9a76-e733f5b79334', '58cb67f8-f6af-4903-9849-44debc3375f3', '/photos/pemb-2.jpg', 1200, 753, 'Pembroke Lodge, photo 2', 1);
\unrestrict ZxceSrepfpnpH6tfdjO7x7rVQQNC63dGPFHvgbIGcEz8hVKrkXcptGN15Dwj7NN

commit;
