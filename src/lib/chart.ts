import type { Category, CategoryTotal } from '@/types';

export const FALLBACK_SLICE_COLOR = '#8FA391';

export interface PieSlice {
  value: number; // minor units; only relative size matters to the chart
  color: string;
  label: string;
}

/**
 * Map monthly category totals to pie slices, resolving each category's color.
 * Drops zero/negative totals. Pure — no rendering.
 */
export function toPieSlices(
  totals: readonly CategoryTotal[],
  categories: readonly Category[],
): PieSlice[] {
  return totals
    .filter((t) => t.totalMinor > 0)
    .map((t) => ({
      value: t.totalMinor,
      color: categories.find((c) => c.id === t.categoryId)?.color ?? FALLBACK_SLICE_COLOR,
      label: t.categoryName ?? 'Uncategorized',
    }));
}
