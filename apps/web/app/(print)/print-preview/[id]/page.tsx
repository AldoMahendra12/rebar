"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { MOCK_PROJECT, MOCK_SCURVE_DATA, MOCK_WBS } from "@/lib/mock-project";
import { formatRupiah } from "@/lib/utils";
import { Printer, AlertCircle, TrendingDown, Minus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { ProjectDetail } from "@/types/wbs";

function PrintTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded p-2 text-xs shadow">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "plannedCumulative" ? "Rencana" : "Aktual"}: {p.value?.toFixed(2)}%
        </p>
      ))}
    </div>
  );
}

export default function PrintPreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const type = searchParams.get("type") || "weekly";
  const period = searchParams.get("period") || "Periode Laporan";

  const [isReady, setIsReady] = useState(false);
  const [project, setProject] = useState<ProjectDetail>(MOCK_PROJECT);
  const [sCurve, setSCurve] = useState(MOCK_SCURVE_DATA);

  useEffect(() => {
    const projectId = params.id as string;

    // Fetch real project data
    const fetchData = async () => {
      try {
        const [projRes, scurveRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/scurve`),
        ]);
        if (projRes.ok) {
          const data = await projRes.json();
          setProject(data);
        }
        if (scurveRes.ok) {
          const data = await scurveRes.json();
          setSCurve(data);
        }
      } catch {
        // Keep mock fallback on error
      } finally {
        setIsReady(true);
      }
    };

    fetchData();
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrint = () => window.print();

  const leafWbs = MOCK_WBS.filter((w) => w.isLeaf);
  const level1Wbs = MOCK_WBS.filter((w) => w.level === 1);
  const totalRAB = leafWbs.reduce((sum, i) => sum + (i.totalPrice ?? 0), 0);

  // Build parent subtotals
  const parentTotals: Record<string, number> = {};
  MOCK_WBS.forEach((item) => {
    if (item.level === 2 && item.parentId) {
      const children = leafWbs.filter((l) => l.parentId === item.id);
      parentTotals[item.id] = children.reduce((s, c) => s + (c.totalPrice ?? 0), 0);
    }
  });

  // S-Curve chart data (last 12 periods for readability)
  const chartData = (sCurve.periods ?? []).slice(-12).map((p) => ({
    period: p.periodLabel,
    plannedCumulative: p.plannedCumulative,
    actualCumulative: p.actualCumulative > 0 ? p.actualCumulative : null,
  }));

  const todayPeriod = chartData.find((d) => d.actualCumulative !== null && d.actualCumulative > 0);
  const todayLabel = todayPeriod?.period;

  const deviation = sCurve.deviation;
  const isOnTrack = Math.abs(deviation) <= 2;
  const isAhead = deviation > 2;
  const StatusIcon = isAhead ? TrendingUp : isOnTrack ? Minus : TrendingDown;
  const statusText = isAhead ? "Lebih Cepat" : isOnTrack ? "Sesuai Rencana" : "Terlambat";
  const statusColor = isAhead ? "#10b981" : isOnTrack ? "#6b7280" : "#ef4444";

  // Type labels
  const typeLabels: Record<string, string> = {
    weekly: "Laporan Mingguan",
    monthly: "Laporan Bulanan",
    executive: "Executive Summary",
  };

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm animate-pulse">Menyusun laporan PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 min-h-screen py-8 print:bg-white print:py-0">
      {/* Floating Print Bar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3 print:hidden bg-white shadow-xl rounded-xl border border-slate-200 p-3">
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Pilih A4, Margin: None, aktifkan Background Graphics</span>
        </div>
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
          <Printer className="w-4 h-4 mr-2" />
          Cetak / Simpan PDF
        </Button>
      </div>

      {/* A4 Paper */}
      <div className="max-w-[794px] mx-auto bg-white shadow-2xl print:shadow-none">
        <div className="p-[16mm] print:p-[12mm]">

          {/* ── HEADER ── */}
          <div className="flex justify-between items-start pb-5 mb-7 border-b-[3px] border-slate-800">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
                {typeLabels[type] || "Laporan Proyek"}
              </p>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">{period}</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Dicetak: {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="text-right">
              <div className="font-black text-blue-700 text-xl tracking-tight">REBAR</div>
              <div className="text-xs text-slate-500 mt-0.5">Platform Manajemen Proyek Konstruksi</div>
            </div>
          </div>

          {/* ── PROJECT INFO + STATUS ── */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Informasi Proyek</p>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{project.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{project.location}</p>
              <div className="mt-3 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-sm">
                <span className="text-slate-400">Klien</span>
                <span className="font-medium text-slate-800">{project.clientName}</span>
                <span className="text-slate-400">Kode Proyek</span>
                <span className="font-mono text-slate-800">{project.code}</span>
                <span className="text-slate-400">Nilai Kontrak</span>
                <span className="font-bold text-blue-700">{formatRupiah(project.contractValue)}</span>
                <span className="text-slate-400">Periode</span>
                <span className="text-slate-800">
                  {new Date(project.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  {" – "}
                  {new Date(project.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Kemajuan Pekerjaan</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Rencana s.d. Periode Ini</span>
                    <span className="font-bold text-slate-700">{sCurve.plannedToDate.toFixed(2)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full">
                    <div className="h-2 bg-slate-500 rounded-full" style={{ width: `${Math.min(sCurve.plannedToDate, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Aktual Lapangan</span>
                    <span className="font-bold" style={{ color: statusColor }}>{sCurve.actualToDate.toFixed(2)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full">
                    <div className="h-2 rounded-full" style={{ width: `${Math.min(sCurve.actualToDate, 100)}%`, backgroundColor: statusColor }} />
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs">
                    <StatusIcon className="w-3.5 h-3.5" style={{ color: statusColor }} />
                    <span className="font-semibold" style={{ color: statusColor }}>{statusText}</span>
                  </div>
                  <span className="text-sm font-black" style={{ color: statusColor }}>
                    {deviation > 0 ? "+" : ""}{deviation.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── S-CURVE CHART ── */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 pb-2 border-b border-slate-200">
              Kurva S — Progress Kumulatif
            </h3>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    interval={1}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<PrintTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                    formatter={(v: string) => (v === "plannedCumulative" ? "Rencana (%)" : "Aktual (%)")}
                    iconType="circle"
                    iconSize={6}
                  />
                  {todayLabel && (
                    <ReferenceLine
                      x={todayLabel}
                      stroke="#f59e0b"
                      strokeDasharray="4 2"
                      strokeWidth={1.5}
                      label={{ value: "Hari Ini", fontSize: 9, fill: "#f59e0b", position: "top" }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="plannedCumulative"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actualCumulative"
                    stroke={deviation < -2 ? "#ef4444" : "#3b82f6"}
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── WBS SUMMARY TABLE ── */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 pb-2 border-b border-slate-200">
              Ringkasan Pekerjaan (WBS)
            </h3>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-left px-3 py-2 font-semibold w-16">Kode</th>
                  <th className="text-left px-3 py-2 font-semibold">Uraian Pekerjaan</th>
                  <th className="text-right px-3 py-2 font-semibold w-28">Bobot (%)</th>
                  <th className="text-right px-3 py-2 font-semibold w-36">Nilai Anggaran</th>
                </tr>
              </thead>
              <tbody>
                {level1Wbs.map((parent, pi) => {
                  const children2 = MOCK_WBS.filter((w) => w.level === 2 && w.parentId === parent.id);
                  const parentTotal = children2.reduce((s, c) => {
                    const grandTotal = leafWbs.filter((l) => l.parentId === c.id).reduce((x, l) => x + (l.totalPrice ?? 0), 0);
                    return s + grandTotal;
                  }, 0);
                  const parentWeight = totalRAB > 0 ? (parentTotal / totalRAB) * 100 : 0;

                  return [
                    <tr key={parent.id} className="bg-slate-100 border-b border-slate-300">
                      <td className="px-3 py-2 font-bold font-mono text-slate-700">{parent.code}</td>
                      <td className="px-3 py-2 font-bold text-slate-800 uppercase text-[11px] tracking-wide" colSpan={1}>{parent.name}</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-700">{parentWeight.toFixed(2)}%</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-800">{formatRupiah(parentTotal)}</td>
                    </tr>,
                    ...children2.flatMap((l2) => {
                      const l3s = leafWbs.filter((l) => l.parentId === l2.id);
                      const l2Total = l3s.reduce((s, l) => s + (l.totalPrice ?? 0), 0);
                      const l2Weight = totalRAB > 0 ? (l2Total / totalRAB) * 100 : 0;
                      return [
                        <tr key={l2.id} className="border-b border-slate-100 bg-slate-50">
                          <td className="px-3 py-1.5 font-mono text-slate-500 pl-5">{l2.code}</td>
                          <td className="px-3 py-1.5 text-slate-700 font-medium">{l2.name}</td>
                          <td className="px-3 py-1.5 text-right text-slate-600">{l2Weight.toFixed(2)}%</td>
                          <td className="px-3 py-1.5 text-right text-slate-600">{formatRupiah(l2Total)}</td>
                        </tr>,
                        ...l3s.map((l3) => {
                          const w = totalRAB > 0 ? ((l3.totalPrice ?? 0) / totalRAB) * 100 : 0;
                          return (
                            <tr key={l3.id} className="border-b border-slate-50">
                              <td className="px-3 py-1 font-mono text-slate-400 pl-9">{l3.code}</td>
                              <td className="px-3 py-1 text-slate-600 pl-8">{l3.name}</td>
                              <td className="px-3 py-1 text-right text-slate-500">{w.toFixed(2)}%</td>
                              <td className="px-3 py-1 text-right text-slate-500">{formatRupiah(l3.totalPrice ?? 0)}</td>
                            </tr>
                          );
                        }),
                      ];
                    }),
                  ];
                })}
                <tr className="bg-blue-700 text-white font-bold text-sm">
                  <td colSpan={2} className="px-3 py-3 text-right">TOTAL ANGGARAN (RAB)</td>
                  <td className="px-3 py-3 text-right">100.00%</td>
                  <td className="px-3 py-3 text-right">{formatRupiah(totalRAB)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── KPI SUMMARY ROW ── */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: "Rencana", value: `${sCurve.plannedToDate.toFixed(1)}%`, color: "#64748b" },
              { label: "Aktual", value: `${sCurve.actualToDate.toFixed(1)}%`, color: statusColor },
              { label: "Deviasi", value: `${deviation > 0 ? "+" : ""}${deviation.toFixed(1)}%`, color: statusColor },
              { label: "Est. Selesai", value: sCurve.estimatedCompletion ? new Date(sCurve.estimatedCompletion).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-", color: "#1e40af" },
            ].map((kpi) => (
              <div key={kpi.label} className="border border-slate-200 rounded-lg p-3 text-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{kpi.label}</p>
                <p className="text-lg font-black" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* ── FOOTER ── */}
          <div className="mt-8 pt-5 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-700 mb-1">Rebar Construct Nusantara</p>
              <p>Jl. Sudirman No. 123, Jakarta</p>
              <p>contact@rebarconstruct.co.id</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 mb-10">Mengetahui,</p>
              <p className="font-bold text-slate-800 border-t border-slate-400 pt-1 px-4 inline-block">Project Manager</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-700">Dibuat oleh Sistem Rebar</p>
              <p>{new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <p className="mt-1 text-[10px] text-slate-300">Dokumen ini bersifat rahasia</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
