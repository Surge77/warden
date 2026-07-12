import { asc, eq } from 'drizzle-orm';

import { reminders } from '@/db/schema';
import type { ReminderRow } from '@/db/schema';
import type { AppDatabase } from '@/db/client';
import type { ReminderPlanEntry } from '@/lib/warranty';

export interface ReminderRepository {
  /** Replace the full reminder set for an expense with a fresh plan. */
  replaceForExpense(expenseId: number, plan: ReminderPlanEntry[]): Promise<ReminderRow[]>;
  listForExpense(expenseId: number): Promise<ReminderRow[]>;
  /** Attach the OS notification identifier once scheduling succeeds. */
  setNotificationId(reminderId: number, notificationId: string): Promise<void>;
  /** Delete all reminders for an expense; returns removed rows so callers can cancel OS notifications. */
  removeForExpense(expenseId: number): Promise<ReminderRow[]>;
  listAll(): Promise<ReminderRow[]>;
}

export function createReminderRepository(db: AppDatabase): ReminderRepository {
  return {
    async replaceForExpense(expenseId, plan) {
      await db.delete(reminders).where(eq(reminders.expenseId, expenseId));
      if (plan.length === 0) return [];
      return db
        .insert(reminders)
        .values(plan.map((entry) => ({ expenseId, kind: entry.kind, fireAt: entry.fireAtMs })))
        .returning();
    },

    async listForExpense(expenseId) {
      return db
        .select()
        .from(reminders)
        .where(eq(reminders.expenseId, expenseId))
        .orderBy(asc(reminders.fireAt));
    },

    async setNotificationId(reminderId, notificationId) {
      await db.update(reminders).set({ notificationId }).where(eq(reminders.id, reminderId));
    },

    async removeForExpense(expenseId) {
      return db.delete(reminders).where(eq(reminders.expenseId, expenseId)).returning();
    },

    async listAll() {
      return db.select().from(reminders).orderBy(asc(reminders.fireAt));
    },
  };
}
