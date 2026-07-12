import * as schema from '@/db/schema';
import { createExpenseRepository } from '@/services/expense-repository';
import { isoDateToEpochMs, monthRange } from '@/lib/date';
import { makeTestDb } from '../helpers/test-db';

function makeRepo() {
  const db = makeTestDb();
  // Seed one category for FK references.
  void db.insert(schema.categories).values({ name: 'Food', color: '#EF4444' }).run();
  return { repo: createExpenseRepository(db), db };
}

const baseExpense = (overrides = {}) => ({
  amountMinor: 45000,
  merchant: 'Swiggy',
  categoryId: 1,
  spentAt: isoDateToEpochMs('2024-05-12'),
  ...overrides,
});

describe('ExpenseRepository', () => {
  it('creates and reads back an expense', async () => {
    const { repo } = makeRepo();
    const created = await repo.create(baseExpense());
    expect(created.id).toBeGreaterThan(0);
    expect(created.amountMinor).toBe(45000);
    expect(created.currency).toBe('INR');

    const fetched = await repo.getById(created.id);
    expect(fetched?.merchant).toBe('Swiggy');
  });

  it('returns null for a missing id', async () => {
    const { repo } = makeRepo();
    expect(await repo.getById(999)).toBeNull();
  });

  it('lists expenses newest-first', async () => {
    const { repo } = makeRepo();
    await repo.create(baseExpense({ spentAt: isoDateToEpochMs('2024-01-01'), merchant: 'Old' }));
    await repo.create(baseExpense({ spentAt: isoDateToEpochMs('2024-06-01'), merchant: 'New' }));
    const list = await repo.list();
    expect(list.map((e) => e.merchant)).toEqual(['New', 'Old']);
  });

  it('filters by month', async () => {
    const { repo } = makeRepo();
    await repo.create(baseExpense({ spentAt: isoDateToEpochMs('2024-05-10') }));
    await repo.create(baseExpense({ spentAt: isoDateToEpochMs('2024-06-10') }));
    const may = await repo.list({ month: '2024-05' });
    expect(may).toHaveLength(1);
  });

  it('filters by search across merchant and note', async () => {
    const { repo } = makeRepo();
    await repo.create(baseExpense({ merchant: 'Uber', note: null }));
    await repo.create(baseExpense({ merchant: 'Shop', note: 'cab fare' }));
    expect(await repo.list({ search: 'uber' })).toHaveLength(1);
    expect(await repo.list({ search: 'cab' })).toHaveLength(1);
  });

  it('treats LIKE metacharacters in search as literals', async () => {
    const { repo } = makeRepo();
    await repo.create(baseExpense({ merchant: '50% off store' }));
    await repo.create(baseExpense({ merchant: 'Regular shop' }));
    // '%' must match the literal percent, not act as a wildcard over all rows.
    expect(await repo.list({ search: '50%' })).toHaveLength(1);
    expect(await repo.list({ search: '%' })).toHaveLength(1);
  });

  it('filters by category', async () => {
    const { repo, db } = makeRepo();
    db.insert(schema.categories).values({ name: 'Transport', color: '#3B82F6' }).run();
    await repo.create(baseExpense({ categoryId: 1 }));
    await repo.create(baseExpense({ categoryId: 2 }));
    expect(await repo.list({ categoryId: 2 })).toHaveLength(1);
  });

  it('updates an expense', async () => {
    const { repo } = makeRepo();
    const created = await repo.create(baseExpense());
    const updated = await repo.update(created.id, { amountMinor: 50000, note: 'edited' });
    expect(updated.amountMinor).toBe(50000);
    expect(updated.note).toBe('edited');
  });

  it('throws when updating a missing expense', async () => {
    const { repo } = makeRepo();
    await expect(repo.update(999, { amountMinor: 1 })).rejects.toThrow();
  });

  it('removes an expense', async () => {
    const { repo } = makeRepo();
    const created = await repo.create(baseExpense());
    await repo.remove(created.id);
    expect(await repo.getById(created.id)).toBeNull();
  });

  it('aggregates monthly totals by category', async () => {
    const { repo, db } = makeRepo();
    db.insert(schema.categories).values({ name: 'Transport', color: '#3B82F6' }).run();
    await repo.create(baseExpense({ categoryId: 1, amountMinor: 10000 }));
    await repo.create(baseExpense({ categoryId: 1, amountMinor: 15000 }));
    await repo.create(baseExpense({ categoryId: 2, amountMinor: 30000 }));

    const totals = await repo.monthlyByCategory('2024-05');
    const food = totals.find((t) => t.categoryName === 'Food');
    const transport = totals.find((t) => t.categoryName === 'Transport');
    expect(food?.totalMinor).toBe(25000);
    expect(transport?.totalMinor).toBe(30000);
  });

  it('returns every expense when no filter is supplied', async () => {
    const { repo } = makeRepo();
    await repo.create(baseExpense({ merchant: 'A' }));
    await repo.create(baseExpense({ merchant: 'B' }));
    await repo.create(baseExpense({ merchant: 'C' }));
    expect(await repo.list()).toHaveLength(3);
  });

  it('returns an empty list when no expenses exist', async () => {
    const { repo } = makeRepo();
    expect(await repo.list()).toEqual([]);
  });

  it('applies month, category and search filters together', async () => {
    const { repo, db } = makeRepo();
    db.insert(schema.categories).values({ name: 'Transport', color: '#3B82F6' }).run();
    // Target row: May + category 2 + matches search.
    await repo.create(
      baseExpense({ spentAt: isoDateToEpochMs('2024-05-10'), categoryId: 2, merchant: 'Uber' }),
    );
    // Same month + search but wrong category.
    await repo.create(
      baseExpense({ spentAt: isoDateToEpochMs('2024-05-11'), categoryId: 1, merchant: 'Uber' }),
    );
    // Right category + search but wrong month.
    await repo.create(
      baseExpense({ spentAt: isoDateToEpochMs('2024-06-10'), categoryId: 2, merchant: 'Uber' }),
    );
    // Right month + category but no search match.
    await repo.create(
      baseExpense({ spentAt: isoDateToEpochMs('2024-05-12'), categoryId: 2, merchant: 'Ola' }),
    );

    const result = await repo.list({ month: '2024-05', categoryId: 2, search: 'uber' });
    expect(result).toHaveLength(1);
    expect(result[0]?.merchant).toBe('Uber');
  });

  it('includes an expense at the exact start-of-month boundary', async () => {
    const { repo } = makeRepo();
    const { start } = monthRange('2024-05');
    await repo.create(baseExpense({ spentAt: start, merchant: 'BoundaryStart' }));
    const may = await repo.list({ month: '2024-05' });
    expect(may.map((e) => e.merchant)).toEqual(['BoundaryStart']);
  });

  it('excludes an expense at the first ms of the next month', async () => {
    const { repo } = makeRepo();
    const { end } = monthRange('2024-05');
    await repo.create(baseExpense({ spentAt: end, merchant: 'NextMonth' }));
    expect(await repo.list({ month: '2024-05' })).toHaveLength(0);
    // It is included in the following month instead.
    expect(await repo.list({ month: '2024-06' })).toHaveLength(1);
  });

  it('matches search case-insensitively', async () => {
    const { repo } = makeRepo();
    await repo.create(baseExpense({ merchant: 'STARBUCKS' }));
    expect(await repo.list({ search: 'starbucks' })).toHaveLength(1);
    expect(await repo.list({ search: 'StArBuCkS' })).toHaveLength(1);
  });

  it('reports uncategorized expenses as a null-category row in monthly totals', async () => {
    const { repo } = makeRepo();
    await repo.create(baseExpense({ categoryId: null, amountMinor: 12000 }));
    const totals = await repo.monthlyByCategory('2024-05');
    const uncategorized = totals.find((t) => t.categoryId === null);
    expect(uncategorized).toBeDefined();
    expect(uncategorized?.categoryName).toBeNull();
    expect(uncategorized?.totalMinor).toBe(12000);
  });

  it('returns an empty array for a month with no expenses', async () => {
    const { repo } = makeRepo();
    await repo.create(baseExpense({ spentAt: isoDateToEpochMs('2024-05-10') }));
    expect(await repo.monthlyByCategory('2024-08')).toEqual([]);
  });

  it('leaves unspecified fields unchanged on a partial update', async () => {
    const { repo } = makeRepo();
    const created = await repo.create(
      baseExpense({ merchant: 'Original', note: 'keep me', amountMinor: 45000 }),
    );
    const updated = await repo.update(created.id, { amountMinor: 99000 });
    expect(updated.amountMinor).toBe(99000);
    expect(updated.merchant).toBe('Original');
    expect(updated.note).toBe('keep me');
    expect(updated.currency).toBe('INR');
    expect(updated.spentAt).toBe(created.spentAt);
  });

  it('breaks spentAt ties by id descending', async () => {
    const { repo } = makeRepo();
    const sameInstant = isoDateToEpochMs('2024-05-12');
    const first = await repo.create(baseExpense({ spentAt: sameInstant, merchant: 'First' }));
    const second = await repo.create(baseExpense({ spentAt: sameInstant, merchant: 'Second' }));
    const list = await repo.list();
    expect(list.map((e) => e.id)).toEqual([second.id, first.id]);
    expect(list.map((e) => e.merchant)).toEqual(['Second', 'First']);
  });
});

describe('warranty fields', () => {
  it('persists and reads back itemName, returnWindowDays, warrantyMonths', async () => {
    const { repo } = makeRepo();
    const created = await repo.create(
      baseExpense({ itemName: 'Headphones', returnWindowDays: 30, warrantyMonths: 12 }),
    );
    const fetched = await repo.getById(created.id);
    expect(fetched?.itemName).toBe('Headphones');
    expect(fetched?.returnWindowDays).toBe(30);
    expect(fetched?.warrantyMonths).toBe(12);
  });

  it('defaults warranty fields to null when omitted', async () => {
    const { repo } = makeRepo();
    const created = await repo.create(baseExpense());
    expect(created.itemName).toBeNull();
    expect(created.returnWindowDays).toBeNull();
    expect(created.warrantyMonths).toBeNull();
  });

  it('updates warranty fields via patch', async () => {
    const { repo } = makeRepo();
    const created = await repo.create(baseExpense());
    const updated = await repo.update(created.id, { warrantyMonths: 24, itemName: 'TV' });
    expect(updated.warrantyMonths).toBe(24);
    expect(updated.itemName).toBe('TV');
  });
});
