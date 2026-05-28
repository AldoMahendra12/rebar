"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";

interface SCurvePoint {
  period: string;
  periodDate: string;
  planned: number;
  actual: number | null;
}

const fetchPortfolioSCurve = async (type: string): Promise<SCurvePoint[]> => {
  const res = await fetch(`/api/dashboard/portfolio-scurve?type=${type}`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const planned = payload.find((p: any) => p.dataKey === "planned")?.value;
  const actual = payload.find((p: any) => p.dataKey === "actual")?.value;
  const deviation = actual != null && planned != null ? (actual - planned).toFixed(1) : null;

  return (
    <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {planned != null && (
        <div className="flex items-center gap-2">
          <span className="w-3 h-px bg-zinc-400 inline-block" style={{ borderTop: "1.5px dashed #94a3b8" }} />
          <span className="text-muted-foreground">Rencana:</span>
          <span className="font-medium">{planned}%</span>
        </div>
      )}
      {actual != null && (
        <div className="flex items-center gap-2 mt-0.5">
          <span className="w-3 h-0.5 bg-primary inline-block rounded" />
          <span className="text-muted-foreground">Aktual:</span>
          <span className="font-medium text-primary">{actual}%</span>
        </div>
      )}
      {deviation != null && (
        <div className={cn("mt-1.5 font-semibold", Number(deviation) < 0 ? "text-red-500" : "text-emerald-500")}>
          Deviasi: {Number(deviation) > 0 ? "+" : ""}{deviation}%
        </div>
      )}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex justify-between mb-4">
        <div className="space-y-2">
          <div className="h-3.5 w-36 bg-zinc-200 rounded animate-shimmer" />
          <div className="h-3 w-48 bg-zinc-100 rounded animate-shimmer" />
        </div>
        <div className="h-7 w-28 bg-zinc-100 rounded-lg animate-shimmer" />
      </div>
      <div className="flex gap-3 mb-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-8 w-24 bg-zinc-100 rounded-lg animate-shimmer" />)}
      </div>
      <div className="h-[220px] bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-50 rounded-lg animate-shimmer" />
    </div>
  );
}

export function PortfolioSCurve() {
  const [viewType, setViewType] = useState<"weekly" | "monthly">("weekly");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-portfolio-scurve", viewType],
    queryFn: () => fetchPortfolioSCurve(viewType),
  });

  if (isLoading || !data) return <ChartSkeleton />;

  // Find the last period with actual data to mark "today"
  const lastActualPeriod = [...data].reverse().find((d) => d.actual != null)?.period;
  const latestData = data.find((d) => d.period === lastActualPeriod);
  const plannedNow = latestData?.planned ?? 0;
  const actualNow = latestData?.actual ?? 0;
  const deviationNow = (actualNow - plannedNow).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white border border-border rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Portfolio S-Curve</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Gabungan semua proyek aktif</p>
        </div>
        {/* Toggle */}
        <div className="flex items-center bg-zinc-100 rounded-md p-0.5 gap-0.5">
          {(["weekly", "monthly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setViewType(t)}
              className={cn(
                "text-xs px-2.5 py-1 rounded transition-all",
                viewType === t
                  ? "bg-white shadow-sm text-foreground font-medium"
                  : "text-zinc-500 hover:text-foreground"
              )}
            >
              {t === "weekly" ? "Mingguan" : "Bulanan"}
            </button>
          ))}
        </div>
      </div>

      {/* Metric pills */}
      <div className="flex gap-3 mb-4">
        <div className="bg-zinc-50 rounded-lg px-3 py-1.5">
          <p className="text-xs text-zinc-400">Rencana</p>
          <p className="text-sm font-semibold text-foreground">{plannedNow.toFixed(1)}%</p>
        </div>
        <div className="bg-zinc-50 rounded-lg px-3 py-1.5">
          <p className="text-xs text-zinc-400">Aktual</p>
          <p className="text-sm font-semibold text-primary">{actualNow.toFixed(1)}%</p>
        </div>
        <div className="bg-zinc-50 rounded-lg px-3 py-1.5">
          <p className="text-xs text-zinc-400">Deviasi</p>
          <p className={cn("text-sm font-semibold", Number(deviationNow) < 0 ? "text-red-500" : "text-emerald-500")}>
            {Number(deviationNow) > 0 ? "+" : ""}{deviationNow}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -10 }}>
          <defs>
            <linearGradient id="portfolioActualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickMargin={6}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          {lastActualPeriod && (
            <ReferenceLine
              x={lastActualPeriod}
              stroke="#f59e0b"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{ value: "Hari ini", fill: "#f59e0b", fontSize: 9, position: "insideTopRight" }}
            />
          )}
          <Area dataKey="actual" fill="url(#portfolioActualGrad)" stroke="none" />
          <Line
            dataKey="planned"
            stroke="#cbd5e1"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 3, fill: "#94a3b8", strokeWidth: 0 }}
            connectNulls
          />
          <Line
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "white" }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex gap-6 justify-center mt-2">
        <div className="flex items-center gap-1.5">
          <svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
          <span className="text-xs text-zinc-500">Rencana</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke="#3b82f6" strokeWidth="2" /></svg>
          <span className="text-xs text-zinc-500">Aktual</span>
        </div>
      </div>
    </motion.div>
  );
}
