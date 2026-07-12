import { and, desc, eq, gte, lt, or, sql } from 'drizzle-orm';

import { categories, expenses } from '@/db/schema';
import type { ExpenseRow } from '@/db/schema';
import type { AppDatabase } from '@/db/client';
import { monthRange } from '@/lib/date';
import type { CategoryTotal, Expense, ExpenseFilter, NewExpense } from '@/types';

export type { AppDatabase };

export interface ExpenseRepository {
  create(e: NewExpense): Promise<Expense>;
  list(filter?: ExpenseFilter): Promise<Expense[]>;
  getById(id: number): Promise<Expense | null>;
  update(id: number, patch: Partial<NewExpense>): Promise<Expense>;
  remove(id: number): Promise<void>;
  monthlyByCategory(month: string): Promise<CategoryTotal[]>;
}

export function createExpenseRepository(db: AppDatabase): ExpenseRepository {
  return {
    async create(e) {
      const [row] = await db
        .insert(expenses)
        .values({
          amount: e.amountMinor,
          currency: e.currency ?? 'INR',
          merchant: e.merchant ?? null,
          categoryId: e.categoryId ?? null,
          spentAt: e.spentAt,
          note: e.note ?? null,
          imageUri: e.imageUri ?? null,
          rawOcrText: e.rawOcrText ?? null,
          itemName: e.itemName ?? null,
          returnWindowDays: e.returnWindowDays ?? null,
          warrantyMonths: e.warrantyMonths ?? null,
        })
        .returning();
      if (!row) throw new Error('Insert returned no row');
      return toExpense(row);
    },

    async list(filter) {
      const where = buildWhere(filter);
      const rows = await db
        .select()
        .from(expenses)
        .where(where)
        .orderBy(desc(expenses.spentAt), desc(expenses.id));
      return rows.map(toExpense);
    },

    async getById(id) {
      const [row] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
      return row ? toExpense(row) : null;
    },

    async update(id, patch) {
      const [row] = await db
        .update(expenses)
        .set(toUpdateSet(patch))
        .where(eq(expenses.id, id))
        .returning();
      if (!row) throw new Error(`Expense ${id} not found`);
      return toExpense(row);
    },

    async remove(id) {
      await db.delete(expenses).where(eq(expenses.id, id));
    },

    async monthlyByCategory(month) {
      const { start, end } = monthRange(month);
      const rows = await db
        .select({
          categoryId: expenses.categoryId,
          categoryName: categories.name,
          totalMinor: sql<number>`sum(${expenses.amount})`,
        })
        .from(expenses)
        .leftJoin(categories, eq(expenses.categoryId, categories.id))
        .where(and(gte(expenses.spentAt, start), lt(expenses.spentAt, end)))
        .groupBy(expenses.categoryId);
      // sql<number> is a compile-time cast only — SUM() over zero rows is NULL
      // at runtime, so the ?? 0 fallback is load-bearing, not cosmetic.
      return rows.map((r) => ({
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        totalMinor: Number(r.totalMinor ?? 0),
      }));
    },
  };
}

function buildWhere(filter?: ExpenseFilter) {
  if (!filter) return undefined;
  const clauses = [];
  if (filter.month) {
    const { start, end } = monthRange(filter.month);
    clauses.push(gte(expenses.spentAt, start), lt(expenses.spentAt, end));
  }
  if (filter.categoryId !== undefined) {
    clauses.push(eq(expenses.categoryId, filter.categoryId));
  }
  if (filter.search) {
    // Escape LIKE metacharacters so a literal % or _ in the search text isn't
    // treated as a wildcard; ESCAPE '\' makes the backslash the escape char.
    const term = `%${filter.search.replace(/[\\%_]/g, '\\$&')}%`;
    clauses.push(
      or(
        sql`${expenses.merchant} like ${term} escape '\\'`,
        sql`${expenses.note} like ${term} escape '\\'`,
      ),
    );
  }
  return clauses.length > 0 ? and(...clauses) : undefined;
}

function toUpdateSet(e: Partial<NewExpense>) {
  return {
    ...(e.amountMinor !== undefined ? { amount: e.amountMinor } : {}),
    ...(e.currency !== undefined ? { currency: e.currency } : {}),
    ...(e.merchant !== undefined ? { merchant: e.merchant } : {}),
    ...(e.categoryId !== undefined ? { categoryId: e.categoryId } : {}),
    ...(e.spentAt !== undefined ? { spentAt: e.spentAt } : {}),
    ...(e.note !== undefined ? { note: e.note } : {}),
    ...(e.imageUri !== undefined ? { imageUri: e.imageUri } : {}),
    ...(e.rawOcrText !== undefined ? { rawOcrText: e.rawOcrText } : {}),
    ...(e.itemName !== undefined ? { itemName: e.itemName } : {}),
    ...(e.returnWindowDays !== undefined ? { returnWindowDays: e.returnWindowDays } : {}),
    ...(e.warrantyMonths !== undefined ? { warrantyMonths: e.warrantyMonths } : {}),
  };
}

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amountMinor: row.amount,
    currency: row.currency,
    merchant: row.merchant,
    categoryId: row.categoryId,
    spentAt: row.spentAt,
    note: row.note,
    imageUri: row.imageUri,
    rawOcrText: row.rawOcrText,
    itemName: row.itemName,
    returnWindowDays: row.returnWindowDays,
    warrantyMonths: row.warrantyMonths,
    createdAt: row.createdAt,
  };
}
