import './env';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
await migrate(drizzle(sql), { migrationsFolder: './drizzle' });
await sql.end();
console.log('Database is up to date.');
