import { FALLBACK_SLICE_COLOR, toPieSlices } from '@/lib/chart';
import type { Category, CategoryTotal } from '@/types';

const CATEGORIES: Category[] = [
  { id: 1, name: 'Food', color: '#EF4444', createdAt: 0 },
  { id: 2, name: 'Transport', color: '#3B82F6', createdAt: 0 },
];

describe('toPieSlices', () => {
  it('maps totals to slices with resolved category colors', () => {
    const totals: CategoryTotal[] = [
      { categoryId: 1, categoryName: 'Food', totalMinor: 25000 },
      { categoryId: 2, categoryName: 'Transport', totalMinor: 30000 },
    ];
    expect(toPieSlices(totals, CATEGORIES)).toEqual([
      { value: 25000, color: '#EF4444', label: 'Food' },
      { value: 30000, color: '#3B82F6', label: 'Transport' },
    ]);
  });

  it('uses fallback color/label for uncategorized totals', () => {
    const totals: CategoryTotal[] = [{ categoryId: null, categoryName: null, totalMinor: 500 }];
    const [slice] = toPieSlices(totals, CATEGORIES);
    expect(slice).toEqual({ value: 500, color: FALLBACK_SLICE_COLOR, label: 'Uncategorized' });
  });

  it('drops zero and negative totals', () => {
    const totals: CategoryTotal[] = [
      { categoryId: 1, categoryName: 'Food', totalMinor: 0 },
      { categoryId: 2, categoryName: 'Transport', totalMinor: 100 },
    ];
    expect(toPieSlices(totals, CATEGORIES)).toHaveLength(1);
  });
});
