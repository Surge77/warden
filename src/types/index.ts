export interface Category {
  id: number;
  name: string;
  color: string;
  createdAt: number;
}

export interface Expense {
  id: number;
  amountMinor: number;
  currency: string;
  merchant: string | null;
  categoryId: number | null;
  spentAt: number;
  note: string | null;
  imageUri: string | null;
  rawOcrText: string | null;
  createdAt: number;
}

export interface NewExpense {
  amountMinor: number;
  currency?: string;
  merchant?: string | null;
  categoryId?: number | null;
  spentAt: number;
  note?: string | null;
  imageUri?: string | null;
  rawOcrText?: string | null;
}

export interface ExpenseFilter {
  month?: string; // 'YYYY-MM'
  categoryId?: number;
  search?: string; // matches merchant or note
}

export interface CategoryTotal {
  categoryId: number | null;
  categoryName: string | null;
  totalMinor: number;
}

export interface Budget {
  categoryId: number;
  limitMinor: number;
}

export interface BudgetStatus extends Budget {
  spentMinor: number;
  /** spent / limit; >= 1 means over budget. */
  ratio: number;
}

export interface FieldConfidence {
  amount: number;
  date: number;
  merchant: number;
}

export interface ParsedReceipt {
  amountMinor: number | null;
  date: string | null; // ISO yyyy-mm-dd
  merchant: string | null;
  /** Warranty length stated on the receipt, when detected (e.g. "1 YEAR WARRANTY"). */
  warrantyMonths: number | null;
  confidence: FieldConfidence;
}
