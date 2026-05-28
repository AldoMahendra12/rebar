"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Calendar, Building, MapPin, TrendingUp, TrendingDown, Minus,
  ArrowRight, BarChart2, Wallet, Plus, Upload, FileText, Settings
} from "lucide-react";
import { MOCK_PROJECT, MOCK_SCURVE_DATA } from "@/lib/mock-project";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { motion } from "framer-motion";
import { useNavigationStore } from "@/stores/navigation-store";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";

interface Props {
  params: { id: string };
}

const fmtIDR = (v: number) => {
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)} M`;
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)} Jt`;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(v);
};

const statusMap: Record<string, { label: string; cls: string }> = {
  planning: { label: "Perencanaan", cls: "bg-zinc-100 text-zinc-600" },
  active: { label: "Aktif", cls: "bg-blue-500/10 text-blue-600" },
  on_hold: { label: "Ditunda", cls: "bg-amber-500/10 text-amber-600" },
  completed: { label: "Selesai", cls: "bg-emerald-500/10 text-emerald-600" },
};

// Mini S-Curve tooltip
function MiniTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.10)] text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === "planned" ? "Rencana" : "Aktual"}: {p.value?.toFixed(1)}%
        </p>
      ))}
    </div>
  );
}

export default function ProjectOverviewPage({ params }: Props) {
  const project = MOCK_PROJECT;
  const sCurve = MOCK_SCURVE_DATA;
  const { setActiveProject } = useNavigationStore();

  // Ensure sidebar is synced when landing here
  useEffect(() => {
    setActiveProject({ id: project.id, name: project.name, code: project.code });
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const startFormatted = format(new Date(project.startDate), "dd MMM yyyy", { locale: idLocale });
  const endFormatted = format(new Date(project.endDate), "dd MMM yyyy", { locale: idLocale });
  const daysLeft = Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000);
  const status = statusMap[project.status] ?? statusMap.planning;

  const deviation = sCurve.deviation;
  const isOnTrack = Math.abs(deviation) <= 2;
  const isAhead = deviation > 2;

  const DeviationIcon = isAhead ? TrendingUp : isOnTrack ? Minus : TrendingDown;
  const deviationColor = isAhead ? "text-emerald-500" : isOnTrack ? "text-zinc-400" : "text-red-500";
  const deviationBg = isAhead ? "bg-emerald-500/10" : isOnTrack ? "bg-zinc-100" : "bg-red-500/10";
  const deviationText = isAhead ? "text-emerald-600" : isOnTrack ? "text-zinc-600" : "text-red-600";

  // Mini chart data (cumulative only) — uses sCurve.periods
  const chartData = (sCurve.periods ?? []).map((d) => ({
    period: d.periodLabel,
    planned: d.plannedCumulative,
    actual: d.actualCumulative > 0 ? d.actualCumulative : undefined,
  }));

  const quickActions = [
    { label: "Input Progress", icon: Plus, href: `/projects/${project.id}/s-curve` },
    { label: "Catat Biaya", icon: Wallet, href: `/projects/${project.id}/budget` },
    { label: "Upload Dokumen", icon: Upload, href: `/projects/${project.id}/documents` },
    { label: "Buat Laporan", icon: FileText, href: `/projects/${project.id}/reports` },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono text-muted-foreground bg-zinc-100 px-2 py-0.5 rounded">{project.code}</span>
            <span className={`badge-muted ${status.cls}`}>{status.label}</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {project.clientName} · {project.location}
          </p>
        </div>
        <Link
          href={`/projects/${project.id}/settings`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 text-sm font-medium text-foreground hover:bg-zinc-50 transition-colors shrink-0 h-fit"
        >
          <Settings className="w-4 h-4" />
          Edit Info Proyek
        </Link>
      </motion.div>

      {/* ── Mini S-Curve Card ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="card-base p-5"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Kurva S — Progress Proyek</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Kumulatif rencana vs aktual</p>
          </div>
          <Link
            href={`/projects/${project.id}/s-curve`}
            className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            Lihat Detail <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex gap-6">
          {/* Chart */}
          <div className="flex-1 min-w-0">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<MiniTooltip />} />
                <Line dataKey="planned" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                <Line dataKey="actual" stroke={deviation < -2 ? "#ef4444" : "#3b82f6"} strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics panel */}
          <div className="shrink-0 w-36 space-y-3 border-l border-zinc-100 pl-5">
            <div>
              <p className="text-2xs uppercase tracking-wide text-zinc-400">Rencana</p>
              <p className="text-xl font-semibold text-foreground mt-0.5">{sCurve.plannedToDate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-2xs uppercase tracking-wide text-zinc-400">Aktual</p>
              <p className={`text-xl font-semibold mt-0.5 ${deviation < -2 ? "text-red-500" : "text-primary"}`}>{sCurve.actualToDate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-2xs uppercase tracking-wide text-zinc-400">Deviasi</p>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${deviationBg} ${deviationText}`}>
                <DeviationIcon className={`w-3 h-3 ${deviationColor}`} />
                {deviation >= 0 ? "+" : ""}{deviation.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 3 Info Cards ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {/* Informasi Kontrak */}
        <div className="card-base p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Informasi Kontrak</h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-2xs uppercase tracking-wide text-zinc-400">Nilai Kontrak</p>
              <p className="text-base font-semibold text-primary">{fmtIDR(project.contractValue)}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-2xs uppercase tracking-wide text-zinc-400">Mulai</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{startFormatted}</p>
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wide text-zinc-400">Selesai</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{endFormatted}</p>
              </div>
            </div>
            <div>
              <p className="text-2xs uppercase tracking-wide text-zinc-400">Sisa Waktu</p>
              <p className={`text-sm font-semibold mt-0.5 ${daysLeft < 0 ? "text-red-500" : daysLeft <= 30 ? "text-amber-500" : "text-emerald-600"}`}>
                {daysLeft < 0 ? `Terlambat ${Math.abs(daysLeft)} hari` : `${daysLeft} hari`}
              </p>
            </div>
          </div>
        </div>

        {/* Budget Ringkas */}
        <div className="card-base p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Budget</h3>
            </div>
            <Link href={`/projects/${project.id}/budget`} className="text-xs text-primary hover:underline">Lihat →</Link>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Kontrak</span>
              <span className="font-medium">{fmtIDR(project.contractValue)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Terpakai</span>
              <span className="font-medium text-foreground">{fmtIDR(project.contractValue * 0.42)}</span>
            </div>
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "42%" }} />
            </div>
            <p className="text-xs text-muted-foreground">42% dari anggaran terpakai</p>
          </div>
        </div>

        {/* Aktivitas Terakhir */}
        <div className="card-base p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Aktivitas</h3>
            </div>
            <Link href={`/projects/${project.id}/s-curve`} className="text-xs text-primary hover:underline">Lihat →</Link>
          </div>
          <div className="space-y-2.5">
            {[
              { who: "Aldo", period: "Minggu 20", when: "2 hari lalu", pct: "4.2%" },
              { who: "Budi", period: "Minggu 19", when: "9 hari lalu", pct: "3.8%" },
              { who: "Citra", period: "Minggu 18", when: "16 hari lalu", pct: "4.5%" },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">{a.who} — {a.period}</p>
                  <p className="text-2xs text-muted-foreground">{a.when}</p>
                </div>
                <span className="text-xs font-mono text-primary">{a.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        className="flex flex-wrap items-center gap-2"
      >
        <span className="text-xs text-muted-foreground mr-1">Aksi cepat:</span>
        {quickActions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-foreground hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
          >
            <a.icon className="w-3.5 h-3.5 text-muted-foreground" />
            {a.label}
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
