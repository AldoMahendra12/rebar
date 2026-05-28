"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, BarChart2, CheckCircle2, AlertTriangle, Loader2, Download, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SCurveChart } from "@/components/sections/scurve/SCurveChart";
import { ProgressSpreadsheet } from "@/components/sections/scurve/ProgressSpreadsheet";
import { cn } from "@/lib/utils";

interface Period {
  periodDate: string;
  periodLabel: string;
  plannedPeriod: number;
  actualPeriod: number;
  plannedCumulative: number;
  actualCumulative: number;
  deviation: number;
}

interface WbsProgress {
  id: string;
  code: string;
  name: string;
  unit: string;
  weight: number;
  plans: { periodDate: string; planned: number }[];
  actuals: { periodDate: string; actual: number; isLocked?: boolean }[];
  totalPlanned: number;
  totalActual: number;
}

interface SCurveDataPayload {
  periods: Period[];
  plannedToDate: number;
  actualToDate: number;
  deviation: number;
  estimatedCompletion: string | null;
  status: "on_track" | "behind" | "ahead";
  wbsProgress: WbsProgress[];
  periodType: "weekly" | "monthly";
}

export default function SCurvePage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<SCurveDataPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayLabel, setTodayLabel] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}/scurve`);
      if (!res.ok) {
        throw new Error("Gagal mengambil data S-Curve dari database");
      }
      const json: SCurveDataPayload = await res.json();
      setData(json);

      // Determine today's period label (latest period with actuals entered)
      const activePeriods = json.periods.filter((p) => p.actualCumulative > 0);
      if (activePeriods.length > 0) {
        setTodayLabel(activePeriods[activePeriods.length - 1].periodLabel);
      } else if (json.periods.length > 0) {
        setTodayLabel(json.periods[0].periodLabel);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Memuat data S-Curve dan spreadsheet...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 space-y-4 text-center max-w-xl mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Gagal Memuat Halaman S-Curve</h3>
        <p className="text-sm text-muted-foreground">{error || "Data S-Curve tidak dapat diakses."}</p>
        <Link
          href={`/projects/${params.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-zinc-200 text-foreground hover:bg-zinc-50 rounded-lg text-sm transition-colors"
        >
          Kembali ke Detail Proyek
        </Link>
      </div>
    );
  }

  const fmtDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  const statusLabel = {
    on_track: "On Track",
    behind: "Behind Schedule",
    ahead: "Ahead of Schedule",
  }[data.status];

  const StatusIcon = {
    on_track: TrendingUp,
    behind: TrendingDown,
    ahead: TrendingUp,
  }[data.status];

  const currentPeriod = data.periods.find(p => p.periodLabel === todayLabel) || data.periods[0];

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Link
          href={`/projects/${params.id}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Detail Proyek
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm font-medium text-foreground">S-Curve & Analitik</span>
      </div>

      {/* Analytics Summary Panels & Chart */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Chart Area */}
        <div className="flex-1 min-w-0">
          <SCurveChart
            data={{
              periods: data.periods,
              plannedToDate: data.plannedToDate,
              actualToDate: data.actualToDate,
              deviation: data.deviation,
              estimatedCompletion: data.estimatedCompletion,
              status: data.status,
            }}
            todayLabel={todayLabel}
            periodType={data.periodType}
          />
        </div>

        {/* Right: Metrics Panel */}
        <div className="w-full lg:w-[300px] shrink-0">
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm sticky top-6">
            
            {/* Section 1 - Status */}
            <div className="flex items-center gap-4 mb-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                data.status === "on_track" ? "bg-emerald-500/10 text-emerald-500" :
                data.status === "behind" ? "bg-red-500/10 text-red-500" :
                "bg-blue-500/10 text-blue-500"
              )}>
                <StatusIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Status Proyek</p>
                <p className={cn(
                  "font-display text-lg font-semibold leading-tight",
                  data.status === "on_track" ? "text-emerald-600" :
                  data.status === "behind" ? "text-red-600" :
                  "text-blue-600"
                )}>
                  {statusLabel}
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-100 my-4" />

            {/* Section 2 - Numbers */}
            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
              <div>
                <p className="text-2xs uppercase tracking-wider text-zinc-400 mb-1">Rencana</p>
                <p className="font-display text-2xl font-semibold text-foreground">{data.plannedToDate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wider text-zinc-400 mb-1">Aktual</p>
                <p className="font-display text-2xl font-semibold text-foreground">{data.actualToDate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wider text-zinc-400 mb-1">Deviasi</p>
                <p className={cn(
                  "font-display text-2xl font-semibold",
                  data.deviation < 0 ? "text-red-500" : "text-emerald-500"
                )}>
                  {data.deviation > 0 ? "+" : ""}{data.deviation.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-2xs uppercase tracking-wider text-zinc-400 mb-1">Est. Selesai</p>
                <p className="font-display text-lg font-semibold text-foreground mt-1">{fmtDate(data.estimatedCompletion)}</p>
              </div>
            </div>

            <div className="border-t border-zinc-100 my-4" />

            {/* Section 3 - Period Detail */}
            <div>
              <p className="text-xs font-medium text-zinc-400 mb-2">Periode {todayLabel}</p>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-zinc-500">Rencana: {currentPeriod?.plannedPeriod?.toFixed(2) || 0}%</span>
                <span className="font-medium text-foreground">Aktual: {currentPeriod?.actualPeriod?.toFixed(2) || 0}%</span>
              </div>
              <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden flex">
                <div 
                  className="bg-zinc-400 h-full" 
                  style={{ width: `${Math.min(100, (currentPeriod?.plannedPeriod || 0) * 10)}%` }} 
                />
                <div 
                  className="bg-primary h-full" 
                  style={{ width: `${Math.min(100, (currentPeriod?.actualPeriod || 0) * 10)}%` }} 
                />
              </div>
            </div>

            <div className="border-t border-zinc-100 my-4" />

            {/* Section 4 - Actions */}
            <div className="space-y-2">
              <button className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" />
                Export PNG
              </button>
              <button className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-white border border-zinc-300 text-foreground hover:bg-zinc-50 transition-colors text-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <FileText className="w-4 h-4" />
                Buat Laporan
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Spreadsheet Input */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Data Distribusi Progres</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Input persentase progres per item WBS</p>
          </div>
        </div>
        <ProgressSpreadsheet
          initialWbsProgress={data.wbsProgress}
          projectId={params.id}
          periods={data.periods.map((p) => ({
            periodDate: p.periodDate,
            periodLabel: p.periodLabel,
          }))}
          onDataChanged={fetchData}
        />
      </div>
    </div>
  );
}
