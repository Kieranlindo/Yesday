import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.');

// One connection pool per server process. `prepare: false` keeps it compatible with Supabase's pooler.
const g = globalThis as unknown as { __yesdaySql?: ReturnType<typeof postgres> };
const client = g.__yesdaySql ?? postgres(url, { prepare: false, max: 5 });
if (process.env.NODE_ENV !== 'production') g.__yesdaySql = client;

export const db = drizzle(client, { schema });
export { schema };
