import { asc, eq } from 'drizzle-orm';

import { categories } from '@/db/schema';
import type { CategoryRow } from '@/db/schema';
import type { AppDatabase } from '@/db/client';
import type { Category } from '@/types';

export type { AppDatabase };

export interface CategoryRepository {
  list(): Promise<Category[]>;
  add(name: string, color: string): Promise<Category>;
}

export function createCategoryRepository(db: AppDatabase): CategoryRepository {
  return {
    async list() {
      const rows = await db.select().from(categories).orderBy(asc(categories.name));
      return rows.map(toCategory);
    },

    async add(name, color) {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('Category name is required');

      const [existing] = await db
        .select()
        .from(categories)
        .where(eq(categories.name, trimmed))
        .limit(1);
      if (existing) return toCategory(existing);

      const [row] = await db
        .insert(categories)
        .values({ name: trimmed, color })
        .returning();
      if (!row) throw new Error('Insert returned no row');
      return toCategory(row);
    },
  };
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt,
  };
}
