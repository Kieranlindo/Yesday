/**
 * Yesday database schema.
 *
 * Money is always stored in pence as integers, never as decimals.
 * Dates of weddings are plain dates (no time or time zone).
 */
import { sql } from 'drizzle-orm';
import {
  pgTable, pgEnum, uuid, text, integer, boolean, timestamp, date, jsonb, primaryKey, index, uniqueIndex,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['couple', 'venue', 'admin']);
export const venueStatusEnum = pgEnum('venue_status', ['draft', 'live', 'paused']);
export const policyEnum = pgEnum('cancellation_policy', ['Flexible', 'Moderate', 'Strict']);
export const unitEnum = pgEnum('price_unit', ['flat', 'pp', 'eve', 'table', 'room']);
export const chapterEnum = pgEnum('chapter', ['venue', 'ceremony', 'breakfast', 'drinks', 'evening', 'styling', 'stay']);
export const dateStateEnum = pgEnum('date_state', ['blocked', 'booked']);
export const tourStatusEnum = pgEnum('tour_status', ['booked', 'done', 'cancelled']);
export const bookingStatusEnum = pgEnum('booking_status', ['held', 'confirmed', 'cancelled', 'completed']);
export const paymentKindEnum = pgEnum('payment_kind', ['deposit', 'instalment', 'balance', 'refund', 'fee_credit']);
export const paymentStatusEnum = pgEnum('payment_status', ['scheduled', 'paid', 'failed', 'refunded']);

/* ---------- people ---------- */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('couple'),
  firstName: text('first_name').notNull(),
  partnerName: text('partner_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex('users_email_key').on(sql`lower(${t.email})`)]);

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(), // sha-256 of the token in the cookie
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [index('sessions_user_idx').on(t.userId)]);

/* ---------- venues ---------- */
export const venues = pgTable('venues', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  status: venueStatusEnum('status').notNull().default('draft'),
  isSample: boolean('is_sample').notNull().default(false),
  name: text('name').notNull(),
  place: text('place').notNull(), // "Fulham, London"
  area: text('area').notNull(), // "London"
  style: text('style'),
  about: text('about').notNull().default(''),
  website: text('website'),
  capacityDinner: integer('capacity_dinner').notNull(),
  capacityEvening: integer('capacity_evening'),
  /** Saturday venue hire in peak season, in pence. Other days are priced from it. */
  hireBasePence: integer('hire_base_pence').notNull(),
  spacesSummary: text('spaces_summary'), // "Great Hall and gardens"
  ceremonyName: text('ceremony_name'),
  ceremonyDetail: text('ceremony_detail'),
  hireDetail: text('hire_detail'),
  cuisine: text('cuisine').array().notNull().default(sql`'{}'::text[]`),
  features: text('features').array().notNull().default(sql`'{}'::text[]`),
  practical: jsonb('practical').$type<[string, string][]>().notNull().default(sql`'[]'::jsonb`),
  rules: jsonb('rules').$type<Record<string, string>>().notNull().default(sql`'{}'::jsonb`),
  policy: policyEnum('policy').notNull().default('Moderate'),
  depositPercent: integer('deposit_percent').notNull().default(15),
  managerName: text('manager_name').notNull(),
  managerPhoto: text('manager_photo'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [index('venues_area_idx').on(t.area, t.status)]);

export const venuePhotos = pgTable('venue_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: text('alt').notNull().default(''),
  position: integer('position').notNull().default(0),
}, t => [index('venue_photos_venue_idx').on(t.venueId, t.position)]);

/** Everything a couple can add to their day, with the price they will see. */
export const venueOptions = pgTable('venue_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  code: text('code').notNull(), // stable key, e.g. "dinner3"
  chapter: chapterEnum('chapter').notNull(),
  name: text('name').notNull(),
  detail: text('detail').notNull().default(''),
  pricePence: integer('price_pence').notNull(),
  unit: unitEnum('unit').notNull().default('flat'),
  required: boolean('required').notNull().default(false),
  active: boolean('active').notNull().default(true),
  position: integer('position').notNull().default(0),
}, t => [uniqueIndex('venue_options_code_key').on(t.venueId, t.code)]);

/** Dates a venue has closed, or that are taken outside Yesday. Free dates have no row. */
export const venueDates = pgTable('venue_dates', {
  venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  day: date('day').notNull(),
  state: dateStateEnum('state').notNull(),
  pricePence: integer('price_pence'), // optional override of the day's hire price
  note: text('note'),
}, t => [primaryKey({ columns: [t.venueId, t.day] })]);

/* ---------- couples ---------- */
export const likes = pgTable('likes', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.userId, t.venueId] })]);

export const tours = pgTable('tours', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  coupleId: uuid('couple_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  weddingDate: date('wedding_date'),
  guests: integer('guests'),
  eveningGuests: integer('evening_guests'),
  toSee: text('to_see').array().notNull().default(sql`'{}'::text[]`),
  status: tourStatusEnum('status').notNull().default('booked'),
  rating: integer('rating'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- bookings and money ---------- */
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'restrict' }),
  coupleId: uuid('couple_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  weddingDate: date('wedding_date').notNull(),
  guests: integer('guests').notNull(),
  eveningGuests: integer('evening_guests').notNull().default(0),
  totalPence: integer('total_pence').notNull(),
  depositPence: integer('deposit_pence').notNull(),
  feePence: integer('fee_pence').notNull(),
  feeRateBasisPoints: integer('fee_rate_bp').notNull(), // 800 = 8%
  policy: policyEnum('policy').notNull(),
  status: bookingStatusEnum('status').notNull().default('held'),
  holdExpiresAt: timestamp('hold_expires_at', { withTimezone: true }),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
}, t => [
  // One live booking per venue per date.
  uniqueIndex('bookings_one_per_date').on(t.venueId, t.weddingDate).where(sql`status in ('held', 'confirmed')`),
  index('bookings_couple_idx').on(t.coupleId),
]);

/** The priced lines of a booking, frozen at the moment of booking. */
export const bookingItems = pgTable('booking_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  code: text('code'),
  name: text('name').notNull(),
  unit: unitEnum('unit').notNull(),
  unitPricePence: integer('unit_price_pence').notNull(),
  quantity: integer('quantity').notNull(),
  linePence: integer('line_pence').notNull(),
  addedByVenue: boolean('added_by_venue').notNull().default(false),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  kind: paymentKindEnum('kind').notNull(),
  amountPence: integer('amount_pence').notNull(),
  dueOn: date('due_on'),
  status: paymentStatusEnum('status').notNull().default('scheduled'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  stripeId: text('stripe_id'),
}, t => [index('payments_booking_idx').on(t.bookingId)]);

/* ---------- messages ---------- */
export const threads = pgTable('threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  coupleId: uuid('couple_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [uniqueIndex('threads_pair_key').on(t.venueId, t.coupleId)]);

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'set null' }),
  body: text('body').notNull(),
  kind: text('kind').notNull().default('text'), // text | event | package
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [index('messages_thread_idx').on(t.threadId, t.createdAt)]);

export type Venue = typeof venues.$inferSelect;
export type VenueOption = typeof venueOptions.$inferSelect;
export type VenuePhoto = typeof venuePhotos.$inferSelect;
export type User = typeof users.$inferSelect;
