"use client";

import { useQuery } from "@tanstack/react-query";
import { FolderKanban, Banknote, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Fetcher function
const fetchKPI = async () => {
  const res = await fetch("/api/dashboard/kpi");
  if (!res.ok) throw new Error("Failed to fetch KPI");
  return res.json();
};

function formatRupiah(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}Md`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}Rb`;
  return `Rp ${value}`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function KpiSkeleton() {
  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="h-3 w-24 bg-zinc-200 rounded animate-shimmer mb-3" />
      <div className="h-9 w-16 bg-zinc-200 rounded animate-shimmer mt-3" />
      <div className="h-3 w-32 bg-zinc-200 rounded animate-shimmer mt-2" />
    </div>
  );
}

export function KpiBar() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-kpi"],
    queryFn: fetchKPI,
  });

  if (isLoading || error || !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
    );
  }

  const {
    activeProjects,
    completedOrOnHold,
    totalContractValue,
    portfolioProgress,
    projectsNeedingAttention,
  } = data;

  const hasAttention = projectsNeedingAttention > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* CARD 1: PROYEK AKTIF */}
      <motion.div
        variants={cardVariants}
        className="bg-white border border-border rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] relative overflow-hidden group"
      >
        <div className="flex justify-between items-start mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Proyek Aktif
          </p>
          <FolderKanban className="w-[18px] h-[18px] text-zinc-300 transition-colors group-hover:text-primary" />
        </div>
        {/* We use a simple render for now instead of count-up library to keep it lightweight */}
        <p className="font-display text-3xl font-semibold text-foreground">
          {activeProjects}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {completedOrOnHold} proyek selesai/on-hold
        </p>
      </motion.div>

      {/* CARD 2: NILAI KONTRAK */}
      <motion.div
        variants={cardVariants}
        className="bg-white border border-border rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] relative overflow-hidden group"
      >
        <div className="flex justify-between items-start mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Nilai Kontrak
          </p>
          <Banknote className="w-[18px] h-[18px] text-zinc-300 transition-colors group-hover:text-emerald-500" />
        </div>
        <p className="font-display text-3xl font-semibold text-foreground">
          {formatRupiah(totalContractValue)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Total estimasi portofolio saat ini
        </p>
      </motion.div>

      {/* CARD 3: PROGRESS PORTFOLIO */}
      <motion.div
        variants={cardVariants}
        className="bg-white border border-border rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] relative overflow-hidden group"
      >
        <div className="flex justify-between items-start mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Progress Portofolio
          </p>
          <TrendingUp className="w-[18px] h-[18px] text-zinc-300 transition-colors group-hover:text-blue-500" />
        </div>
        <p className="font-display text-3xl font-semibold text-foreground">
          {portfolioProgress.toFixed(1)}%
        </p>
        
        <div className="mt-2.5 space-y-1">
          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${portfolioProgress}%` }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="h-full bg-primary"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Rata-rata kumulatif aktual
          </p>
        </div>
      </motion.div>

      {/* CARD 4: PERLU PERHATIAN */}
      <motion.div
        variants={cardVariants}
        className={cn(
          "border rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] relative overflow-hidden group transition-colors",
          hasAttention
            ? "bg-red-50/30 border-red-200"
            : "bg-white border-border"
        )}
      >
        <div className="flex justify-between items-start mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Perlu Perhatian
          </p>
          {hasAttention ? (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <AlertTriangle className="w-[18px] h-[18px] text-red-400" />
            </motion.div>
          ) : (
            <CheckCircle className="w-[18px] h-[18px] text-emerald-300" />
          )}
        </div>
        
        <p
          className={cn(
            "font-display text-3xl font-semibold",
            hasAttention ? "text-red-500" : "text-emerald-600"
          )}
        >
          {projectsNeedingAttention}
        </p>
        <p
          className={cn(
            "text-sm mt-1",
            hasAttention ? "text-red-500" : "text-emerald-600"
          )}
        >
          {hasAttention
            ? `${projectsNeedingAttention} proyek terlambat`
            : "Semua proyek on track ✓"}
        </p>
      </motion.div>
    </motion.div>
  );
}
