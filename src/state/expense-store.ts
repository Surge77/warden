import { create } from 'zustand';

import { db, schema } from '@/db/client';
import { budgetStatuses, createBudgetRepository } from '@/services/budget-repository';
import { createCategoryRepository } from '@/services/category-repository';
import { createExpenseRepository } from '@/services/expense-repository';
import { createMerchantMemory } from '@/services/merchant-memory';
import type {
  Budget,
  BudgetStatus,
  Category,
  CategoryTotal,
  Expense,
  ExpenseFilter,
  NewExpense,
} from '@/types';

const repo = createExpenseRepository(db);
const categoryRepo = createCategoryRepository(db);
const budgetRepo = createBudgetRepository(db);
const memory = createMerchantMemory(db);

/** Learned merchant→category association, recorded on every save with both present. */
function learnFrom(e: Partial<NewExpense>) {
  if (e.merchant && e.categoryId != null) {
    void memory.learn(e.merchant, e.categoryId).catch(() => {});
  }
}

interface ExpenseState {
  expenses: Expense[];
  categories: Category[];
  monthTotals: CategoryTotal[];
  budgets: Budget[];
  budgetStatuses: BudgetStatus[];
  loadCategories: () => Promise<void>;
  addCategory: (name: string, color: string) => Promise<void>;
  loadExpenses: (filter?: ExpenseFilter) => Promise<void>;
  loadMonth: (month: string) => Promise<void>;
  loadBudgets: () => Promise<void>;
  setBudget: (categoryId: number, limitMinor: number) => Promise<void>;
  suggestCategoryId: (merchant: string) => Promise<number | null>;
  addExpense: (e: NewExpense) => Promise<Expense>;
  editExpense: (id: number, patch: Partial<NewExpense>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  categories: [],
  monthTotals: [],
  budgets: [],
  budgetStatuses: [],

  async loadCategories() {
    const rows = await db.select().from(schema.categories);
    set({ categories: rows });
  },

  async addCategory(name, color) {
    await categoryRepo.add(name, color);
    await get().loadCategories();
  },

  async loadExpenses(filter) {
    set({ expenses: await repo.list(filter) });
  },

  async loadMonth(month) {
    const monthTotals = await repo.monthlyByCategory(month);
    set({ monthTotals, budgetStatuses: budgetStatuses(get().budgets, monthTotals) });
  },

  async loadBudgets() {
    const budgets = await budgetRepo.list();
    set({ budgets, budgetStatuses: budgetStatuses(budgets, get().monthTotals) });
  },

  async setBudget(categoryId, limitMinor) {
    await budgetRepo.setLimit(categoryId, limitMinor);
    await get().loadBudgets();
  },

  suggestCategoryId(merchant) {
    return memory.recall(merchant);
  },

  async addExpense(e) {
    const created = await repo.create(e);
    learnFrom(e);
    await get().loadExpenses();
    return created;
  },

  async editExpense(id, patch) {
    await repo.update(id, patch);
    learnFrom(patch);
    await get().loadExpenses();
  },

  async deleteExpense(id) {
    await repo.remove(id);
    await get().loadExpenses();
  },
}));
