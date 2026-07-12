import { eq, sql } from 'drizzle-orm';

import { merchantMemory } from '@/db/schema';
import type { AppDatabase } from '@/db/client';

export type { AppDatabase };

/** Lowercased, whitespace-collapsed key so "Zomato ", "ZOMATO" hit the same row. */
export function normalizeMerchant(merchant: string): string {
  return merchant.trim().toLowerCase().replace(/\s+/g, ' ');
}

export interface MerchantMemory {
  /** Remember that this merchant belongs to this category (learned from a user save/edit). */
  learn(merchant: string, categoryId: number): Promise<void>;
  /** Recall the learned category for a merchant, or null if never corrected. */
  recall(merchant: string): Promise<number | null>;
}

export function createMerchantMemory(db: AppDatabase): MerchantMemory {
  return {
    async learn(merchant, categoryId) {
      const key = normalizeMerchant(merchant);
      if (!key) return;
      await db
        .insert(merchantMemory)
        .values({ merchant: key, categoryId })
        .onConflictDoUpdate({
          target: merchantMemory.merchant,
          set: { categoryId, updatedAt: sql`(unixepoch() * 1000)` },
        });
    },

    async recall(merchant) {
      const key = normalizeMerchant(merchant);
      if (!key) return null;
      const [row] = await db
        .select()
        .from(merchantMemory)
        .where(eq(merchantMemory.merchant, key))
        .limit(1);
      return row?.categoryId ?? null;
    },
  };
}
