import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const expenses = sqliteTable(
  'expenses',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    // Stored in minor units (paise) — never floats, to avoid currency drift.
    amount: integer('amount').notNull(),
    currency: text('currency').notNull().default('INR'),
    merchant: text('merchant'),
    categoryId: integer('category_id').references(() => categories.id),
    spentAt: integer('spent_at').notNull(),
    note: text('note'),
    imageUri: text('image_uri'),
    rawOcrText: text('raw_ocr_text'),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index('idx_expenses_spent_at').on(table.spentAt),
    index('idx_expenses_category_id').on(table.categoryId),
  ],
);

export const budgets = sqliteTable('budgets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id')
    .notNull()
    .unique()
    .references(() => categories.id),
  // Monthly limit in minor units (paise), same convention as expenses.amount.
  limitMinor: integer('limit_minor').notNull(),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// Learned merchant→category overrides; beats keyword rules once a user corrects a merchant.
export const merchantMemory = sqliteTable('merchant_memory', {
  // Normalized (lowercased, trimmed) merchant name.
  merchant: text('merchant').primaryKey(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type CategoryRow = typeof categories.$inferSelect;
export type ExpenseRow = typeof expenses.$inferSelect;
export type NewExpenseRow = typeof expenses.$inferInsert;
export type BudgetRow = typeof budgets.$inferSelect;
