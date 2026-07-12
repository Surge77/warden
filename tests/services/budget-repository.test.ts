import { createCategoryRepository } from '@/services/category-repository';
import { budgetStatuses, createBudgetRepository } from '@/services/budget-repository';
import type { Budget, CategoryTotal } from '@/types';
import { makeTestDb } from '../helpers/test-db';

async function setup() {
  const db = makeTestDb();
  const cats = createCategoryRepository(db);
  const food = await cats.add('Food', '#EF4444');
  const travel = await cats.add('Travel', '#3B82F6');
  return { db, repo: createBudgetRepository(db), food, travel };
}

describe('BudgetRepository', () => {
  it('sets a limit and lists it back', async () => {
    const { repo, food } = await setup();
    await repo.setLimit(food.id, 500_000);
    expect(await repo.list()).toEqual([{ categoryId: food.id, limitMinor: 500_000 }]);
  });

  it('replaces the limit when set twice for the same category', async () => {
    const { repo, food } = await setup();
    await repo.setLimit(food.id, 500_000);
    await repo.setLimit(food.id, 750_000);
    expect(await repo.list()).toEqual([{ categoryId: food.id, limitMinor: 750_000 }]);
  });

  it('removes the budget when limit is zero or negative', async () => {
    const { repo, food } = await setup();
    await repo.setLimit(food.id, 500_000);
    await repo.setLimit(food.id, 0);
    expect(await repo.list()).toEqual([]);
  });

  it('remove deletes only the targeted category budget', async () => {
    const { repo, food, travel } = await setup();
    await repo.setLimit(food.id, 100);
    await repo.setLimit(travel.id, 200);
    await repo.remove(food.id);
    expect(await repo.list()).toEqual([{ categoryId: travel.id, limitMinor: 200 }]);
  });
});

describe('budgetStatuses', () => {
  const limits: Budget[] = [
    { categoryId: 1, limitMinor: 1000 },
    { categoryId: 2, limitMinor: 500 },
  ];

  it('computes spent and ratio per budget', () => {
    const totals: CategoryTotal[] = [
      { categoryId: 1, categoryName: 'Food', totalMinor: 800 },
      { categoryId: 3, categoryName: 'Other', totalMinor: 999 },
    ];
    const statuses = budgetStatuses(limits, totals);
    expect(statuses).toEqual([
      { categoryId: 1, limitMinor: 1000, spentMinor: 800, ratio: 0.8 },
      { categoryId: 2, limitMinor: 500, spentMinor: 0, ratio: 0 },
    ]);
  });

  it('reports over-budget as ratio > 1', () => {
    const totals: CategoryTotal[] = [{ categoryId: 2, categoryName: null, totalMinor: 750 }];
    const [, second] = budgetStatuses(limits, totals);
    expect(second?.ratio).toBe(1.5);
  });
});
