export type BudgetCategory = "material" | "labor" | "equipment" | "subcon" | "overhead";

export interface BudgetItem {
  id: string;
  projectId: string;
  category: BudgetCategory;
  description: string;
  budgetedAmount: number;
}

export interface CostActual {
  id: string;
  budgetItemId: string;
  amount: number;
  description: string;
  transactionDate: string; // ISO String
  receiptUrl?: string | null;
}
