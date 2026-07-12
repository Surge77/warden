import { expenses } from '@/db/schema';
import { createReminderRepository } from '@/services/reminder-repository';
import { makeTestDb } from '../helpers/test-db';

import type { AppDatabase } from '@/db/client';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 15);

async function insertExpense(db: AppDatabase): Promise<number> {
  const rows = await db
    .insert(expenses)
    .values({ amount: 129900, spentAt: NOW, itemName: 'Headphones' })
    .returning({ id: expenses.id });
  return rows[0]!.id;
}

describe('ReminderRepository', () => {
  it('replaceForExpense stores the plan and returns rows with ids', async () => {
    const db = makeTestDb();
    const repo = createReminderRepository(db);
    const expenseId = await insertExpense(db);

    const rows = await repo.replaceForExpense(expenseId, [
      { kind: 'return', fireAtMs: NOW + 28 * DAY_MS },
      { kind: 'expiry', fireAtMs: NOW + 358 * DAY_MS },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.kind)).toEqual(['return', 'expiry']);
    expect(rows.every((r) => r.id > 0)).toBe(true);
    expect(rows.every((r) => r.notificationId === null)).toBe(true);
  });

  it('replaceForExpense wipes previous reminders for that expense only', async () => {
    const db = makeTestDb();
    const repo = createReminderRepository(db);
    const a = await insertExpense(db);
    const b = await insertExpense(db);

    await repo.replaceForExpense(a, [{ kind: 'return', fireAtMs: NOW + DAY_MS }]);
    await repo.replaceForExpense(b, [{ kind: 'expiry', fireAtMs: NOW + DAY_MS }]);
    await repo.replaceForExpense(a, [{ kind: 'nudge', fireAtMs: NOW + 2 * DAY_MS }]);

    expect((await repo.listForExpense(a)).map((r) => r.kind)).toEqual(['nudge']);
    expect((await repo.listForExpense(b)).map((r) => r.kind)).toEqual(['expiry']);
  });

  it('setNotificationId attaches the OS id to one reminder', async () => {
    const db = makeTestDb();
    const repo = createReminderRepository(db);
    const expenseId = await insertExpense(db);

    const [row] = await repo.replaceForExpense(expenseId, [
      { kind: 'return', fireAtMs: NOW + DAY_MS },
    ]);
    await repo.setNotificationId(row!.id, 'os-notif-123');

    const [updated] = await repo.listForExpense(expenseId);
    expect(updated?.notificationId).toBe('os-notif-123');
  });

  it('removeForExpense returns the removed rows so OS notifications can be cancelled', async () => {
    const db = makeTestDb();
    const repo = createReminderRepository(db);
    const expenseId = await insertExpense(db);

    const [row] = await repo.replaceForExpense(expenseId, [
      { kind: 'expiry', fireAtMs: NOW + DAY_MS },
    ]);
    await repo.setNotificationId(row!.id, 'os-1');

    const removed = await repo.removeForExpense(expenseId);
    expect(removed.map((r) => r.notificationId)).toEqual(['os-1']);
    expect(await repo.listForExpense(expenseId)).toEqual([]);
  });

  it('listAll returns reminders across all expenses ordered by fire time', async () => {
    const db = makeTestDb();
    const repo = createReminderRepository(db);
    const a = await insertExpense(db);
    const b = await insertExpense(db);

    await repo.replaceForExpense(a, [{ kind: 'expiry', fireAtMs: NOW + 5 * DAY_MS }]);
    await repo.replaceForExpense(b, [{ kind: 'return', fireAtMs: NOW + DAY_MS }]);

    const all = await repo.listAll();
    expect(all.map((r) => r.kind)).toEqual(['return', 'expiry']);
  });
});
