"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart2, TrendingUp, TrendingDown, Minus,
  FolderOpen, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, Activity,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { MOCK_PROJECT, MOCK_SCURVE_DATA } from "@/lib/mock-project";
import { cn } from "@/lib/utils";

// Simulate multiple projects for portfolio view
const PORTFOLIO_PROJECTS = [
  {
    id: "prj-001",
    name: "Gedung Perkantoran Tower A",
    code: "PRJ-001",
    clientName: "PT. Maju Bersama Tbk",
    location: "Jakarta Selatan",
    contractValue: 18_500_000_000,
    status: "active",
    planned: 62.4,
    actual: 58.1,
    deviation: -4.3,
  },
  {
    id: "prj-002",
    name: "Jembatan Bypass Surabaya",
    code: "PRJ-002",
    clientName: "Dinas PU Jawa Timur",
    location: "Surabaya",
    contractValue: 32_000_000_000,
    status: "active",
    planned: 45.0,
    actual: 47.8,
    deviation: 2.8,
  },
  {
    id: "prj-003",
    name: "Renovasi Kantor Pusat",
    code: "PRJ-003",
    clientName: "PT. Nusantara Indah",
    location: "Bandung",
    contractValue: 4_200_000_000,
    status: "completed",
    planned: 100,
    actual: 100,
    deviation: 0,
  },
  {
    id: "prj-004",
    name: "Perumahan Grand Residence",
    code: "PRJ-004",
    clientName: "PT. Properti Jaya",
    location: "Tangerang",
    contractValue: 9_800_000_000,
    status: "active",
    planned: 30.2,
    actual: 22.5,
    deviation: -7.7,
  },
];

const fmtIDR = (v: number) => {
  if (v >= 1e12) return `Rp ${(v / 1e12).toFixed(1)} T`;
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1)} M`;
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(0)} Jt`;
  return `Rp ${v.toLocaleString("id-ID")}`;
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold mb-2 text-foreground">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-500">{p.name === "planned" ? "Rencana" : "Aktual"}:</span>
          <span className="font-semibold text-foreground">{p.value?.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

function DeviationBar({ value }: { value: number }) {
  const color = value > 2 ? "#10b981" : value >= -2 ? "#6b7280" : "#ef4444";
  const label = value > 2 ? "Lebih Cepat" : value >= -2 ? "On Track" : "Terlambat";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(Math.abs(value) * 5, 100)}%`,
            background: color,
            marginLeft: value < 0 ? "auto" : "0",
          }}
        />
      </div>
      <span className="text-xs font-semibold w-20 text-right" style={{ color }}>
        {value > 0 ? "+" : ""}{value.toFixed(1)}% {label === "Terlambat" && "⚠"}
      </span>
    </div>
  );
}

export default function AnalyticsPage() {
  const totalValue = PORTFOLIO_PROJECTS.reduce((s, p) => s + p.contractValue, 0);
  const activeProjects = PORTFOLIO_PROJECTS.filter((p) => p.status === "active").length;
  const completedProjects = PORTFOLIO_PROJECTS.filter((p) => p.status === "completed").length;
  const atRisk = PORTFOLIO_PROJECTS.filter((p) => p.deviation < -5).length;
  const avgDeviation = PORTFOLIO_PROJECTS.reduce((s, p) => s + p.deviation, 0) / PORTFOLIO_PROJECTS.length;

  // Portfolio S-Curve (use MOCK data as reference)
  const portfolioChart = (MOCK_SCURVE_DATA.periods ?? []).slice(-16).map((p) => ({
    period: p.periodLabel,
    planned: p.plannedCumulative,
    actual: p.actualCumulative > 0 ? p.actualCumulative : undefined,
  }));

  // Bar chart: deviation per project
  const deviationChart = PORTFOLIO_PROJECTS.map((p) => ({
    name: p.code,
    deviation: p.deviation,
  }));

  const kpiCards = [
    {
      label: "Total Nilai Portfolio",
      value: fmtIDR(totalValue),
      icon: BarChart2,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      sub: `${PORTFOLIO_PROJECTS.length} proyek`,
    },
    {
      label: "Proyek Aktif",
      value: activeProjects.toString(),
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      sub: `${completedProjects} selesai`,
    },
    {
      label: "Deviasi Rata-rata",
      value: `${avgDeviation > 0 ? "+" : ""}${avgDeviation.toFixed(1)}%`,
      icon: avgDeviation < -2 ? TrendingDown : avgDeviation > 2 ? TrendingUp : Minus,
      color: avgDeviation < -2 ? "text-red-600" : avgDeviation > 2 ? "text-emerald-600" : "text-zinc-500",
      bg: avgDeviation < -2 ? "bg-red-500/10" : avgDeviation > 2 ? "bg-emerald-500/10" : "bg-zinc-100",
      sub: "dari semua proyek",
    },
    {
      label: "Proyek Berisiko",
      value: atRisk.toString(),
      icon: AlertTriangle,
      color: atRisk > 0 ? "text-amber-600" : "text-zinc-400",
      bg: atRisk > 0 ? "bg-amber-500/10" : "bg-zinc-100",
      sub: "deviasi < -5%",
    },
  ];

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Analytics & Portfolio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan kinerja seluruh proyek dalam organisasi Anda secara real-time.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            className="card-base p-5 flex items-start gap-4"
          >
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", card.bg)}>
              <card.icon className={cn("w-5 h-5", card.color)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
              <p className={cn("text-2xl font-bold leading-tight mt-0.5", card.color)}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* Portfolio S-Curve */}
        <div className="card-base p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Kurva S Portfolio</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Kumulatif rencana vs aktual seluruh proyek</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={portfolioChart} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 16 }}
                formatter={(v: string) => (v === "planned" ? "Rencana" : "Aktual")}
                iconType="circle"
                iconSize={7}
              />
              <Line
                type="monotone"
                dataKey="planned"
                stroke="#cbd5e1"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Deviation Bar Chart */}
        <div className="card-base p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">Deviasi Per Proyek</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Selisih aktual vs rencana (%)</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deviationChart} layout="vertical" margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                width={55}
              />
              <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)}%`, "Deviasi"]} />
              <Bar dataKey="deviation" radius={[0, 4, 4, 0]}>
                {deviationChart.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.deviation < -2 ? "#ef4444" : entry.deviation > 2 ? "#10b981" : "#94a3b8"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Project List Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.2 }}
        className="card-base overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-foreground">Perbandingan Kinerja Proyek</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Progress aktual vs rencana per proyek aktif</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Proyek</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nilai Kontrak</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rencana</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Aktual</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-52">Deviasi</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {PORTFOLIO_PROJECTS.map((prj, i) => {
                const deviation = prj.deviation;
                const statusConfig = {
                  active: { label: "Aktif", cls: "bg-blue-500/10 text-blue-600" },
                  completed: { label: "Selesai", cls: "bg-emerald-500/10 text-emerald-600" },
                  on_hold: { label: "Ditunda", cls: "bg-amber-500/10 text-amber-600" },
                }[prj.status] ?? { label: prj.status, cls: "bg-zinc-100 text-zinc-600" };

                return (
                  <motion.tr
                    key={prj.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.04 }}
                    className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">{prj.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{prj.clientName} · {prj.location}</p>
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-foreground">{fmtIDR(prj.contractValue)}</td>
                    <td className="px-5 py-4 text-right text-sm font-mono text-muted-foreground">{prj.planned.toFixed(1)}%</td>
                    <td className="px-5 py-4 text-right text-sm font-mono font-bold text-foreground">{prj.actual.toFixed(1)}%</td>
                    <td className="px-5 py-4 w-52">
                      <DeviationBar value={deviation} />
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold", statusConfig.cls)}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/projects/${prj.id}/s-curve`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        S-Curve <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
