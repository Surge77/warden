import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState } from 'react';

import migrations from '../../drizzle/migrations';
import { db } from './client';
import { seedCategories } from './seed';

interface SetupState {
  ready: boolean;
  error: Error | null;
}

/** Runs schema migrations then seeds default categories. UI gates on `ready`. */
export function useDatabaseSetup(): SetupState {
  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);

  useEffect(() => {
    if (!success || seeded) return;
    seedCategories(db)
      .then(() => setSeeded(true))
      .catch((e: unknown) => setSeedError(e instanceof Error ? e : new Error(String(e))));
  }, [success, seeded]);

  return { ready: success && seeded, error: error ?? seedError };
}
