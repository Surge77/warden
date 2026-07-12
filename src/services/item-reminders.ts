import * as Notifications from 'expo-notifications';

import { planReminders } from '@/lib/warranty';
import type { ReminderKind } from '@/lib/warranty';
import { createReminderRepository } from '@/services/reminder-repository';
import type { AppDatabase } from '@/db/client';
import type { Expense } from '@/types';

const CHANNEL_ID = 'item-deadlines';

export interface ReminderContent {
  title: string;
  body: string;
}

/** Notification copy per reminder kind. Pure — unit-tested. */
export function reminderContent(kind: ReminderKind, itemName: string | null): ReminderContent {
  const name = itemName ?? 'your item';
  switch (kind) {
    case 'return':
      return {
        title: 'Return window closing',
        body: `Last days to return ${name}. Decide now — after this it's yours.`,
      };
    case 'nudge':
      return {
        title: 'Warranty ends in a month',
        body: `Test ${name} now, while a claim is still possible.`,
      };
    case 'expiry':
      return {
        title: 'Warranty expiring',
        body: `${name} goes out of warranty in days. Anything wrong? Claim now.`,
      };
  }
}

/**
 * Reconcile OS notifications + reminder rows with an item's current warranty
 * fields. Cancels stale schedules, plans fresh ones, records OS ids.
 * Safe to call without notification permission — rows are still written,
 * OS scheduling is skipped.
 */
export async function syncItemReminders(
  db: AppDatabase,
  expense: Expense,
  nowMs: number,
): Promise<void> {
  const repo = createReminderRepository(db);
  await cancelOsNotifications(await repo.listForExpense(expense.id));

  const plan = planReminders(
    {
      purchaseDateMs: expense.spentAt,
      returnWindowDays: expense.returnWindowDays,
      warrantyMonths: expense.warrantyMonths,
    },
    nowMs,
  );
  const rows = await repo.replaceForExpense(expense.id, plan);
  if (rows.length === 0) return;

  // First save prompts for permission; later calls are no-op prompts.
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Return & warranty deadlines',
    importance: Notifications.AndroidImportance.HIGH,
  });

  for (const row of rows) {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: reminderContent(row.kind, expense.itemName),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(row.fireAt),
        channelId: CHANNEL_ID,
      },
    });
    await repo.setNotificationId(row.id, notificationId);
  }
}

/** Cancel and forget all reminders for a deleted item. */
export async function cancelItemReminders(db: AppDatabase, expenseId: number): Promise<void> {
  const removed = await createReminderRepository(db).removeForExpense(expenseId);
  await cancelOsNotifications(removed);
}

async function cancelOsNotifications(rows: readonly { notificationId: string | null }[]) {
  for (const row of rows) {
    if (row.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(row.notificationId).catch(() => {});
    }
  }
}
