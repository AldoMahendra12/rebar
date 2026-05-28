"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import {
  MOCK_BUDGET_SUMMARY,
  MOCK_BUDGET_CATEGORIES,
  MOCK_EXPENSES,
} from "@/lib/mock-budget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wallet, TrendingDown, ArrowUpRight, Plus, Search,
  Receipt, FileText, CheckCircle2, Clock, XCircle
} from "lucide-react";
import { motion } from "framer-motion";

export default function BudgetPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExpenses = MOCK_EXPENSES.filter((exp) =>
    exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Lunas</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-transparent">Menunggu</Badge>;
      case "rejected":
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "pending": return <Clock className="w-4 h-4 text-amber-500" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Anggaran & Biaya</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau arus kas, realisasi anggaran, dan pengeluaran proyek.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white">
            <FileText className="w-4 h-4 mr-2" />
            Export Laporan
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Catat Pengeluaran
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Total Anggaran (RAB)</p>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="text-xl lg:text-lg xl:text-xl font-bold text-slate-900 tracking-tighter mt-2">
              {formatRupiah(MOCK_BUDGET_SUMMARY.totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Nilai kontrak yang disetujui</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Realisasi Biaya</p>
              <div className="p-2 bg-red-50 rounded-lg">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <div className="text-xl lg:text-lg xl:text-xl font-bold text-slate-900 tracking-tighter mt-2">
              {formatRupiah(MOCK_BUDGET_SUMMARY.totalCost)}
            </div>
            <div className="flex items-center gap-1 text-xs mt-1 text-slate-500">
              <span className="text-red-500 font-medium">
                {((MOCK_BUDGET_SUMMARY.totalCost / MOCK_BUDGET_SUMMARY.totalBudget) * 100).toFixed(1)}%
              </span>
              <span>dari total anggaran</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Sisa Anggaran</p>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Wallet className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-xl lg:text-lg xl:text-xl font-bold text-slate-900 tracking-tighter mt-2">
              {formatRupiah(MOCK_BUDGET_SUMMARY.remainingBudget)}
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(MOCK_BUDGET_SUMMARY.remainingBudget / MOCK_BUDGET_SUMMARY.totalBudget) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-300">Estimasi Margin</p>
              <div className="p-2 bg-white/10 rounded-lg">
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <div className="text-xl lg:text-lg xl:text-xl font-bold tracking-tighter mt-2">
              {formatRupiah(MOCK_BUDGET_SUMMARY.margin)}
            </div>
            <div className="flex items-center gap-1 text-xs mt-1 text-emerald-400 font-medium">
              +{MOCK_BUDGET_SUMMARY.marginPercentage}% Target Keuntungan
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Breakdown Card */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Distribusi Anggaran</CardTitle>
            <CardDescription>Rincian biaya per kategori pekerjaan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {MOCK_BUDGET_CATEGORIES.map((cat) => {
              const percentage = (cat.cost / cat.budget) * 100;
              const isOverbudget = percentage > 100;
              
              return (
                <div key={cat.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{cat.name}</span>
                    <span className="text-slate-500">{formatRupiah(cat.cost)} / {formatRupiah(cat.budget)}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentage, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${isOverbudget ? "bg-red-500" : cat.color}`}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={isOverbudget ? "text-red-500 font-medium" : "text-slate-400"}>
                      {percentage.toFixed(1)}% Terpakai
                    </span>
                    {isOverbudget && (
                      <span className="text-red-500 font-medium text-[10px] uppercase tracking-wider">Over Budget</span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Expense List */}
        <Card className="lg:col-span-2 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Riwayat Pengeluaran</CardTitle>
                <CardDescription>Daftar transaksi biaya terbaru</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari transaksi..."
                  className="pl-8 w-full sm:w-[250px] h-9 text-sm bg-zinc-50/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-zinc-50 border-b border-zinc-100 uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 font-medium">Tanggal</th>
                  <th className="px-6 py-3 font-medium">Deskripsi & Vendor</th>
                  <th className="px-6 py-3 font-medium">Kategori</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Tidak ada transaksi yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {new Date(exp.date).toLocaleDateString("id-ID", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{exp.description}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{exp.vendor}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="bg-white text-slate-600 font-normal border-zinc-200">
                          {exp.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(exp.status)}
                          {getStatusBadge(exp.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-slate-900">
                        {formatRupiah(exp.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
