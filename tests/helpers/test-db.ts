import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import * as schema from '@/db/schema';
import type { AppDatabase } from '@/db/client';

const MIGRATIONS = ['0000_violet_marrow.sql', '0001_overconfident_ultron.sql'];

/** In-memory DB with all migrations applied — mirrors the on-device schema. */
export function makeTestDb(): AppDatabase {
  const sqlite = new Database(':memory:');
  for (const file of MIGRATIONS) {
    const ddl = readFileSync(join(__dirname, '../../drizzle', file), 'utf8').replace(
      /-->.*statement-breakpoint/g,
      '',
    );
    sqlite.exec(ddl);
  }
  return drizzle(sqlite, { schema }) as unknown as AppDatabase;
}
