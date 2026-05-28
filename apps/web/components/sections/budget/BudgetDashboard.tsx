"use client";

import { useMemo, useState } from "react";
import { CostActual, BudgetItem } from "@/types/budget";
import { formatRupiah } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, AlertTriangle } from "lucide-react";
import { CostActualModal } from "./CostActualModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface BudgetDashboardProps {
  projectId: string;
  budgetItems: BudgetItem[];
  costActuals: CostActual[];
  onActualAdded: (actual: CostActual) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  material: "Material",
  labor: "Tenaga Kerja",
  equipment: "Alat",
  subcon: "Subkontraktor",
  overhead: "Overhead",
};

export function BudgetDashboard({
  projectId,
  budgetItems,
  costActuals,
  onActualAdded,
}: BudgetDashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate totals
  const totalBudget = useMemo(
    () => budgetItems.reduce((sum, item) => sum + item.budgetedAmount, 0),
    [budgetItems]
  );

  const totalActual = useMemo(
    () => costActuals.reduce((sum, item) => sum + item.amount, 0),
    [costActuals]
  );

  const remainingBudget = totalBudget - totalActual;
  const utilization = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  // Prepare data for chart
  const chartData = useMemo(() => {
    return budgetItems.map((budget) => {
      const actualForCat = costActuals
        .filter((c) => c.budgetItemId === budget.id)
        .reduce((sum, c) => sum + c.amount, 0);

      const percentUsed = budget.budgetedAmount > 0 
        ? (actualForCat / budget.budgetedAmount) * 100 
        : 0;

      return {
        name: CATEGORY_LABELS[budget.category] || budget.category,
        Budget: budget.budgetedAmount,
        Actual: actualForCat,
        percentUsed,
        isOverBudget: percentUsed > 100,
      };
    });
  }, [budgetItems, costActuals]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Anggaran (RAB)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalBudget)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatRupiah(totalActual)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {utilization.toFixed(1)}% terpakai
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sisa Anggaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatRupiah(remainingBudget)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <Button onClick={() => setIsModalOpen(true)} className="w-full" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Catat Pengeluaran
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Budget vs Actual (Per Kategori)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickMargin={10} />
                  <YAxis 
                    tickFormatter={(value) => `Rp ${value / 1000000}M`}
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatRupiah(Number(value))}
                    cursor={{fill: 'transparent'}}
                  />
                  <Legend />
                  <Bar dataKey="Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Actual" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isOverBudget ? '#ef4444' : '#f97316'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Riwayat Pengeluaran Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {costActuals.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <Receipt className="mb-2 h-8 w-8 opacity-20" />
                <p>Belum ada catatan pengeluaran.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {costActuals.slice(0, 8).map((actual) => {
                  const budget = budgetItems.find((b) => b.id === actual.budgetItemId);
                  return (
                    <div key={actual.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-sm">{actual.description}</p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-2">
                          <span>{new Date(actual.transactionDate).toLocaleDateString("id-ID")}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {budget ? CATEGORY_LABELS[budget.category] : "Lainnya"}
                          </span>
                        </div>
                      </div>
                      <div className="font-semibold text-orange-600">
                        {formatRupiah(actual.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CostActualModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        budgetItems={budgetItems}
        onActualAdded={onActualAdded}
      />
    </div>
  );
}
