import dayjs from 'dayjs';

import { minorToRupees } from '@/lib/money';
import type { Category, Expense } from '@/types';

const HEADER = ['Date', 'Merchant', 'Category', 'Amount', 'Note'];
const ISO_DATE = 'YYYY-MM-DD';

/** Wrap a field in double quotes (doubling internal quotes) when it contains a comma, quote, or newline. */
function escapeField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function categoryName(categoryId: number | null, categories: readonly Category[]): string {
  if (categoryId === null) return '';
  return categories.find((c) => c.id === categoryId)?.name ?? '';
}

function toRow(expense: Expense, categories: readonly Category[]): string {
  const fields = [
    dayjs(expense.spentAt).format(ISO_DATE),
    expense.merchant ?? '',
    categoryName(expense.categoryId, categories),
    minorToRupees(expense.amountMinor).toFixed(2),
    expense.note ?? '',
  ];
  return fields.map(escapeField).join(',');
}

/** Render expenses as an RFC-4180-style CSV string (header row + one row per expense). */
export function toCsv(expenses: readonly Expense[], categories: readonly Category[]): string {
  const rows = [HEADER.join(','), ...expenses.map((e) => toRow(e, categories))];
  return rows.join('\n');
}
