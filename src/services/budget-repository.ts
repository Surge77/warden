import { eq } from 'drizzle-orm';

import { budgets } from '@/db/schema';
import type { AppDatabase } from '@/db/client';
import type { Budget, BudgetStatus, CategoryTotal } from '@/types';

export type { AppDatabase };

export interface BudgetRepository {
  /** Insert or replace the monthly limit for a category. Zero or negative removes it. */
  setLimit(categoryId: number, limitMinor: number): Promise<void>;
  list(): Promise<Budget[]>;
  remove(categoryId: number): Promise<void>;
}

export function createBudgetRepository(db: AppDatabase): BudgetRepository {
  return {
    async setLimit(categoryId, limitMinor) {
      if (limitMinor <= 0) {
        await db.delete(budgets).where(eq(budgets.categoryId, categoryId));
        return;
      }
      await db
        .insert(budgets)
        .values({ categoryId, limitMinor })
        .onConflictDoUpdate({ target: budgets.categoryId, set: { limitMinor } });
    },

    async list() {
      const rows = await db.select().from(budgets);
      return rows.map((r) => ({ categoryId: r.categoryId, limitMinor: r.limitMinor }));
    },

    async remove(categoryId) {
      await db.delete(budgets).where(eq(budgets.categoryId, categoryId));
    },
  };
}

/** Join budgets against a month's category totals. Pure — unit-testable without DB. */
export function budgetStatuses(
  limits: readonly Budget[],
  totals: readonly CategoryTotal[],
): BudgetStatus[] {
  return limits.map((b) => {
    const spent = totals.find((t) => t.categoryId === b.categoryId)?.totalMinor ?? 0;
    return {
      categoryId: b.categoryId,
      limitMinor: b.limitMinor,
      spentMinor: spent,
      ratio: spent / b.limitMinor,
    };
  });
}
