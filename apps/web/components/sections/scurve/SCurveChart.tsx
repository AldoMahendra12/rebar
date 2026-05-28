"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { SCurveData } from "@/types/wbs";
import { cn } from "@/lib/utils";

interface SCurveChartProps {
  data: SCurveData;
  todayLabel: string;
  showActual?: boolean;
  showPlanned?: boolean;
  periodType?: "weekly" | "monthly";
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white/95 backdrop-blur-sm p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-foreground mb-2 pb-2 border-b border-zinc-100">{label}</p>
      <div className="space-y-1.5">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-zinc-500">{p.name}</span>
            </div>
            <span className="font-semibold text-foreground">{p.value.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeviationTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white/95 backdrop-blur-sm p-3 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-foreground mb-2 pb-2 border-b border-zinc-100">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-zinc-500">Deviasi</span>
        <span className={cn(
          "font-semibold",
          val >= 0 ? "text-emerald-500" : "text-red-500"
        )}>
          {val > 0 ? "+" : ""}{val.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export function SCurveChart({
  data,
  todayLabel,
  showActual = true,
  showPlanned = true,
  periodType = "weekly",
}: SCurveChartProps) {
  const [view, setView] = useState<"scurve" | "deviation">("scurve");

  // Only show periods with some data (reduce clutter)
  const chartData = useMemo(() => {
    // For weekly: show every 2nd tick label
    return data.periods.map((p, i) => ({
      ...p,
      labelShort: periodType === "weekly"
        ? (i % 2 === 0 ? p.periodLabel : "")
        : p.periodLabel,
      isToday: p.periodLabel === todayLabel,
    }));
  }, [data.periods, todayLabel, periodType]);

  const todayIndex = chartData.findIndex((p) => p.isToday);

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView("scurve")}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
            view === "scurve"
              ? "bg-foreground text-background shadow-sm"
              : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-zinc-100"
          )}
        >
          S-Curve Kumulatif
        </button>
        <button
          onClick={() => setView("deviation")}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
            view === "deviation"
              ? "bg-foreground text-background shadow-sm"
              : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-zinc-100"
          )}
        >
          Deviasi Per Periode
        </button>
      </div>

      {/* Chart */}
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {view === "scurve" ? (
          <div className="pt-4">
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e4e4e7" vertical={false} />
                <XAxis
                  dataKey="periodLabel"
                  tick={{ fontSize: 11, fill: "#71717a", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  interval={periodType === "weekly" ? 3 : 0}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#71717a", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d4d4d8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "24px" }}
                  formatter={(value: string) => (
                    <span className="text-zinc-600 font-medium ml-1 mr-4">{value}</span>
                  )}
                  iconType="circle"
                  iconSize={8}
                />

                {/* Today reference line */}
                {todayIndex >= 0 && (
                  <ReferenceLine
                    x={todayLabel}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: "Hari Ini",
                      position: "top",
                      fontSize: 10,
                      fontWeight: 600,
                      fill: "#f59e0b",
                    }}
                  />
                )}

                {showPlanned && (
                  <Line
                    type="monotone"
                    dataKey="plannedCumulative"
                    name="Rencana"
                    stroke="#a1a1aa" // zinc-400
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{ r: 4, fill: "#a1a1aa", strokeWidth: 0 }}
                  />
                )}

                {showActual && (
                  <Line
                    type="monotone"
                    dataKey="actualCumulative"
                    name="Aktual"
                    stroke={
                      data.status === "behind"
                        ? "#ef4444" // red-500
                        : data.status === "ahead"
                          ? "#3b82f6" // blue-500
                          : "#10b981" // emerald-500
                    }
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    connectNulls={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="pt-4">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={chartData.filter((p) => p.actualPeriod > 0 || p.plannedPeriod > 0)}
                margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#e4e4e7" vertical={false} />
                <XAxis
                  dataKey="periodLabel"
                  tick={{ fontSize: 11, fill: "#71717a", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  interval={periodType === "weekly" ? 3 : 0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#71717a", fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  dx={-10}
                />
                <Tooltip content={<DeviationTooltip />} cursor={{ fill: '#f4f4f5' }} />
                <ReferenceLine y={0} stroke="#a1a1aa" strokeWidth={1} />
                <Bar dataKey="deviation" name="Deviasi" radius={[4, 4, 4, 4]} maxBarSize={40}>
                  {chartData
                    .filter((p) => p.actualPeriod > 0 || p.plannedPeriod > 0)
                    .map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.deviation >= 0 ? "#10b981" : "#ef4444"}
                        fillOpacity={0.9}
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </div>
  );
}
