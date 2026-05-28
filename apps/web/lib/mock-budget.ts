export interface BudgetSummary {
  totalBudget: number;
  totalCost: number;
  remainingBudget: number;
  margin: number;
  marginPercentage: number;
}

export interface BudgetCategory {
  id: string;
  name: string;
  budget: number;
  cost: number;
  color: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  status: "paid" | "pending" | "rejected";
  vendor: string;
}

export const MOCK_BUDGET_SUMMARY: BudgetSummary = {
  totalBudget: 4500000000, // 4.5 M
  totalCost: 1250000000,   // 1.25 M
  remainingBudget: 3250000000,
  margin: 675000000,       // 15% planned margin
  marginPercentage: 15,
};

export const MOCK_BUDGET_CATEGORIES: BudgetCategory[] = [
  { id: "cat-1", name: "Material & Bahan", budget: 2000000000, cost: 750000000, color: "bg-blue-500" },
  { id: "cat-2", name: "Upah Tenaga Kerja", budget: 1200000000, cost: 300000000, color: "bg-emerald-500" },
  { id: "cat-3", name: "Sewa Alat Berat", budget: 500000000, cost: 150000000, color: "bg-amber-500" },
  { id: "cat-4", name: "Subkontraktor", budget: 800000000, cost: 50000000, color: "bg-purple-500" },
];

export const MOCK_EXPENSES: ExpenseRecord[] = [
  {
    id: "exp-1",
    date: "2025-03-20",
    description: "Pembelian Semen & Besi Beton",
    category: "Material & Bahan",
    amount: 150000000,
    status: "paid",
    vendor: "PT Bangun Perkasa",
  },
  {
    id: "exp-2",
    date: "2025-03-21",
    description: "Pembayaran Mandor Mingguan W3",
    category: "Upah Tenaga Kerja",
    amount: 35000000,
    status: "paid",
    vendor: "Internal (Mandor Jono)",
  },
  {
    id: "exp-3",
    date: "2025-03-22",
    description: "Sewa Excavator 1 Minggu",
    category: "Sewa Alat Berat",
    amount: 15000000,
    status: "pending",
    vendor: "CV Alat Konstruksi Jaya",
  },
  {
    id: "exp-4",
    date: "2025-03-25",
    description: "DP Subkon Elektrikal",
    category: "Subkontraktor",
    amount: 50000000,
    status: "paid",
    vendor: "PT Sinar Terang Listrik",
  },
];
