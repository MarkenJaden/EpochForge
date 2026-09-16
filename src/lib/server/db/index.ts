import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString =
	process.env.DATABASE_URL || 'postgresql://epochforge:epochforge_secret@localhost:5432/epochforge';

// Disable prefetch as it is not supported for "Transaction" pool mode if pgbouncer is used
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
export * from './schema';
