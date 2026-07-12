import { DEFAULT_CATEGORIES } from '@/services/category-rules';
import { categories } from './schema';
import type { AppDatabase } from '@/db/client';

/** Insert default categories once; idempotent via name UNIQUE + DO NOTHING. */
export async function seedCategories(db: AppDatabase): Promise<void> {
  for (const cat of DEFAULT_CATEGORIES) {
    await db
      .insert(categories)
      .values({ name: cat.name, color: cat.color })
      .onConflictDoNothing({ target: categories.name });
  }
}
