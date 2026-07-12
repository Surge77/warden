import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { toCsv } from '@/lib/csv';
import type { Category, Expense } from '@/types';

dayjs.extend(customParseFormat);

const HEADER = 'Date,Merchant,Category,Amount,Note';

// Build epoch ms from an ISO date in the local zone so dayjs(ms).format('YYYY-MM-DD')
// round-trips back to the same date regardless of the machine's timezone.
function epochForIso(iso: string): number {
  return dayjs(`${iso} 12:00`, 'YYYY-MM-DD HH:mm').valueOf();
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return { id: 1, name: 'Food', color: '#FF0000', createdAt: 0, ...overrides };
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 1,
    amountMinor: 24950,
    currency: 'INR',
    merchant: 'Cafe',
    categoryId: 1,
    spentAt: epochForIso('2026-06-23'),
    note: 'Lunch',
    imageUri: null,
    rawOcrText: null,
    itemName: null,
    returnWindowDays: null,
    warrantyMonths: null,
    createdAt: 0,
    ...overrides,
  };
}

describe('toCsv', () => {
  it('emits the header row', () => {
    const csv = toCsv([], []);

    expect(csv).toBe(HEADER);
  });

  it('maps a normal expense row correctly', () => {
    const expense = makeExpense();
    const categories = [makeCategory()];

    const csv = toCsv([expense], categories);

    expect(csv).toBe(`${HEADER}\n2026-06-23,Cafe,Food,249.50,Lunch`);
  });

  it('looks up category name by id and leaves it empty when not found', () => {
    const expense = makeExpense({ categoryId: 99 });

    const csv = toCsv([expense], [makeCategory()]);

    expect(csv).toBe(`${HEADER}\n2026-06-23,Cafe,,249.50,Lunch`);
  });

  it('quotes fields containing a comma', () => {
    const expense = makeExpense({ merchant: 'Cafe, Bar & Co' });

    const csv = toCsv([expense], [makeCategory()]);

    expect(csv).toBe(`${HEADER}\n2026-06-23,"Cafe, Bar & Co",Food,249.50,Lunch`);
  });

  it('escapes embedded double quotes by doubling them', () => {
    const expense = makeExpense({ merchant: 'The "Best" Cafe' });

    const csv = toCsv([expense], [makeCategory()]);

    expect(csv).toBe(`${HEADER}\n2026-06-23,"The ""Best"" Cafe",Food,249.50,Lunch`);
  });

  it('quotes fields containing a newline', () => {
    const expense = makeExpense({ note: 'line1\nline2' });

    const csv = toCsv([expense], [makeCategory()]);

    expect(csv).toBe(`${HEADER}\n2026-06-23,Cafe,Food,249.50,"line1\nline2"`);
  });

  it('renders empty fields for null merchant, note, and category', () => {
    const expense = makeExpense({ merchant: null, note: null, categoryId: null });

    const csv = toCsv([expense], [makeCategory()]);

    expect(csv).toBe(`${HEADER}\n2026-06-23,,,249.50,`);
  });

  it('returns only the header for an empty expense list', () => {
    const csv = toCsv([], [makeCategory()]);

    expect(csv).toBe(HEADER);
    expect(csv.split('\n')).toHaveLength(1);
  });
});
