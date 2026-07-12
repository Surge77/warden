import { eq } from 'drizzle-orm';

import { settings } from '@/db/schema';
import type { AppDatabase } from '@/db/client';

export type { AppDatabase };

export const SETTING_KEYS = {
  dailyReminder: 'daily_reminder_enabled',
  appLock: 'app_lock_enabled',
} as const;

export interface SettingsRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  getBool(key: string): Promise<boolean>;
  setBool(key: string, value: boolean): Promise<void>;
}

export function createSettingsRepository(db: AppDatabase): SettingsRepository {
  return {
    async get(key) {
      const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
      return row?.value ?? null;
    },

    async set(key, value) {
      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value } });
    },

    async getBool(key) {
      const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
      return row?.value === '1';
    },

    async setBool(key, value) {
      await this.set(key, value ? '1' : '0');
    },
  };
}
