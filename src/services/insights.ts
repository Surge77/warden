import type { Expense } from '@/types';

export interface WeeklyInsight {
  totalMinor: number;
  prevTotalMinor: number;
  /** Positive = spent more than previous week. Null when previous week had no spending. */
  changeRatio: number | null;
  topCategoryId: number | null;
  topCategoryMinor: number;
  count: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Summarize the trailing 7 days vs the 7 days before that.
 * Pure over an expense list so it works off the already-loaded store.
 */
export function weeklyInsight(expenses: readonly Expense[], now: number): WeeklyInsight {
  const weekStart = now - WEEK_MS;
  const prevStart = now - 2 * WEEK_MS;

  const week = expenses.filter((e) => e.spentAt >= weekStart && e.spentAt <= now);
  const prev = expenses.filter((e) => e.spentAt >= prevStart && e.spentAt < weekStart);

  const totalMinor = sum(week);
  const prevTotalMinor = sum(prev);

  const byCategory = new Map<number | null, number>();
  for (const e of week) {
    byCategory.set(e.categoryId, (byCategory.get(e.categoryId) ?? 0) + e.amountMinor);
  }
  let topCategoryId: number | null = null;
  let topCategoryMinor = 0;
  for (const [id, amount] of byCategory) {
    if (amount > topCategoryMinor) {
      topCategoryMinor = amount;
      topCategoryId = id;
    }
  }

  return {
    totalMinor,
    prevTotalMinor,
    changeRatio: prevTotalMinor > 0 ? (totalMinor - prevTotalMinor) / prevTotalMinor : null,
    topCategoryId,
    topCategoryMinor,
    count: week.length,
  };
}

function sum(list: readonly Expense[]): number {
  return list.reduce((acc, e) => acc + e.amountMinor, 0);
}
