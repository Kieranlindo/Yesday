import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set. Locally: copy .env.example to .env.local. On Vercel: add it under Settings, Environment Variables, then redeploy.');
if (url.includes('[YOUR-PASSWORD]')) throw new Error('DATABASE_URL still contains [YOUR-PASSWORD]. Replace it with the database password.');

// Anything that isn't on this computer is reached over an encrypted connection.
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);

// One connection pool per server process. `prepare: false` keeps it compatible with Supabase's pooler.
const g = globalThis as unknown as { __yesdaySql?: ReturnType<typeof postgres> };
const client = g.__yesdaySql ?? postgres(url, { prepare: false, max: 5, ssl: local ? false : 'require', connect_timeout: 10 });
if (process.env.NODE_ENV !== 'production') g.__yesdaySql = client;

export const db = drizzle(client, { schema });
export { schema };
