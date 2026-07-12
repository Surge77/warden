import { budgets, categories, expenses, merchantMemory, reminders } from '@/db/schema';
import type { AppDatabase } from '@/db/client';

export type { AppDatabase };

export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: 'warden';
  version: number;
  exportedAt: number;
  categories: unknown[];
  expenses: unknown[];
  budgets: unknown[];
  merchantMemory: unknown[];
  reminders: unknown[];
}

export async function exportBackup(db: AppDatabase, now: number): Promise<string> {
  const data: BackupFile = {
    app: 'warden',
    version: BACKUP_VERSION,
    exportedAt: now,
    categories: await db.select().from(categories),
    expenses: await db.select().from(expenses),
    budgets: await db.select().from(budgets),
    merchantMemory: await db.select().from(merchantMemory),
    reminders: await db.select().from(reminders),
  };
  return JSON.stringify(data);
}

/** Throws with a user-safe message when the payload is not a Warden backup. */
export function parseBackup(json: string): BackupFile {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('Not a valid backup file.');
  }
  if (
    typeof raw !== 'object' ||
    raw === null ||
    (raw as BackupFile).app !== 'warden' ||
    typeof (raw as BackupFile).version !== 'number'
  ) {
    throw new Error('Not a Warden backup.');
  }
  const b = raw as BackupFile;
  if (b.version > BACKUP_VERSION) {
    throw new Error('Backup was made by a newer app version. Update Warden first.');
  }
  for (const key of ['categories', 'expenses', 'budgets', 'merchantMemory', 'reminders'] as const) {
    if (!Array.isArray(b[key])) throw new Error('Backup file is damaged.');
  }
  return b;
}

/** Replace-all restore. Caller confirms with the user first — this wipes current data. */
export async function restoreBackup(db: AppDatabase, backup: BackupFile): Promise<void> {
  await db.delete(reminders);
  await db.delete(merchantMemory);
  await db.delete(budgets);
  await db.delete(expenses);
  await db.delete(categories);
  if (backup.categories.length > 0) {
    await db.insert(categories).values(backup.categories as (typeof categories.$inferInsert)[]);
  }
  if (backup.expenses.length > 0) {
    await db.insert(expenses).values(backup.expenses as (typeof expenses.$inferInsert)[]);
  }
  if (backup.budgets.length > 0) {
    await db.insert(budgets).values(backup.budgets as (typeof budgets.$inferInsert)[]);
  }
  if (backup.merchantMemory.length > 0) {
    await db
      .insert(merchantMemory)
      .values(backup.merchantMemory as (typeof merchantMemory.$inferInsert)[]);
  }
  if (backup.reminders.length > 0) {
    // OS notification schedules do not survive a restore — clear ids so the app reschedules.
    const rows = (backup.reminders as (typeof reminders.$inferInsert)[]).map((r) => ({
      ...r,
      notificationId: null,
    }));
    await db.insert(reminders).values(rows);
  }
}
