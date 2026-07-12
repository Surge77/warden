import { weeklyInsight } from '@/services/insights';
import type { Expense } from '@/types';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 100 * DAY;

function expense(daysAgo: number, amountMinor: number, categoryId: number | null = 1): Expense {
  return {
    id: Math.floor(Math.random() * 1e9),
    amountMinor,
    currency: 'INR',
    merchant: null,
    categoryId,
    spentAt: NOW - daysAgo * DAY,
    note: null,
    imageUri: null,
    rawOcrText: null,
    itemName: null,
    returnWindowDays: null,
    warrantyMonths: null,
    createdAt: NOW,
  };
}

describe('weeklyInsight', () => {
  it('sums only the trailing 7 days and compares with the week before', () => {
    const list = [
      expense(1, 100),
      expense(6, 200),
      expense(8, 300), // previous week
      expense(20, 999), // outside both windows
    ];
    const insight = weeklyInsight(list, NOW);
    expect(insight.totalMinor).toBe(300);
    expect(insight.prevTotalMinor).toBe(300);
    expect(insight.changeRatio).toBe(0);
    expect(insight.count).toBe(2);
  });

  it('reports the top category of the week', () => {
    const list = [expense(1, 100, 1), expense(2, 500, 2), expense(3, 200, 2)];
    const insight = weeklyInsight(list, NOW);
    expect(insight.topCategoryId).toBe(2);
    expect(insight.topCategoryMinor).toBe(700);
  });

  it('changeRatio is null when previous week had no spending', () => {
    const insight = weeklyInsight([expense(2, 100)], NOW);
    expect(insight.changeRatio).toBeNull();
  });

  it('positive changeRatio when spending rose', () => {
    const insight = weeklyInsight([expense(1, 300), expense(9, 200)], NOW);
    expect(insight.changeRatio).toBeCloseTo(0.5);
  });

  it('empty list yields zeroes', () => {
    const insight = weeklyInsight([], NOW);
    expect(insight).toEqual({
      totalMinor: 0,
      prevTotalMinor: 0,
      changeRatio: null,
      topCategoryId: null,
      topCategoryMinor: 0,
      count: 0,
    });
  });
});
