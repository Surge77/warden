import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const DB_NAME = 'warden.db';

const sqlite = openDatabaseSync(DB_NAME, { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });

// The production drizzle DB type. The repository accepts this; tests pass a
// better-sqlite3 drizzle instance cast to it (same sync query-builder API).
export type AppDatabase = typeof db;

export { schema };
