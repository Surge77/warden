import { exportBackup, parseBackup, restoreBackup } from '@/services/backup';
import { createCategoryRepository } from '@/services/category-repository';
import { createExpenseRepository } from '@/services/expense-repository';
import { createBudgetRepository } from '@/services/budget-repository';
import { makeTestDb } from '../helpers/test-db';

const NOW = 1_700_000_000_000;

async function seededDb() {
  const db = makeTestDb();
  const cats = createCategoryRepository(db);
  const expenses = createExpenseRepository(db);
  const budgets = createBudgetRepository(db);
  const food = await cats.add('Food', '#EF4444');
  await expenses.create({ amountMinor: 12_345, spentAt: NOW, merchant: 'Zomato', categoryId: food.id });
  await budgets.setLimit(food.id, 500_000);
  return db;
}

describe('backup', () => {
  it('export → parse → restore round-trips all data into an empty db', async () => {
    const source = await seededDb();
    const json = await exportBackup(source, NOW);

    const target = makeTestDb();
    await restoreBackup(target, parseBackup(json));

    const restored = createExpenseRepository(target);
    const list = await restored.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.merchant).toBe('Zomato');
    expect(list[0]?.amountMinor).toBe(12_345);
    expect(await createBudgetRepository(target).list()).toHaveLength(1);
    expect(await createCategoryRepository(target).list()).toHaveLength(1);
  });

  it('restore replaces existing data instead of merging', async () => {
    const source = await seededDb();
    const json = await exportBackup(source, NOW);

    const target = await seededDb(); // already has one expense
    await restoreBackup(target, parseBackup(json));
    expect(await createExpenseRepository(target).list()).toHaveLength(1);
  });

  it('rejects malformed JSON', () => {
    expect(() => parseBackup('{not json')).toThrow('Not a valid backup file.');
  });

  it('rejects JSON that is not a receiptly backup', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'other', version: 1 }))).toThrow(
      'Not a Receiptly backup.',
    );
  });

  it('rejects backups from a newer app version', () => {
    const payload = JSON.stringify({
      app: 'receiptly',
      version: 99,
      exportedAt: NOW,
      categories: [],
      expenses: [],
      budgets: [],
      merchantMemory: [],
    });
    expect(() => parseBackup(payload)).toThrow(/newer app version/);
  });

  it('rejects backups with missing sections', () => {
    const payload = JSON.stringify({ app: 'receiptly', version: 1, categories: [] });
    expect(() => parseBackup(payload)).toThrow('Backup file is damaged.');
  });
});
