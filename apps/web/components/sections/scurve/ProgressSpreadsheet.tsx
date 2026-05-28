"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Settings, Calculator, Info, PenTool, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WbsProgressRow {
  id: string; // wbsItemId
  code: string;
  name: string;
  unit: string;
  weight: number;
  plans: { periodDate: string; planned: number }[];
  actuals: { periodDate: string; actual: number; isLocked?: boolean }[];
  totalPlanned: number;
  totalActual: number;
}

interface ProgressSpreadsheetProps {
  initialWbsProgress: WbsProgressRow[];
  projectId: string;
  periods: { periodDate: string; periodLabel: string }[];
  onDataChanged?: () => void;
}

export function ProgressSpreadsheet({
  initialWbsProgress,
  projectId,
  periods,
  onDataChanged,
}: ProgressSpreadsheetProps) {
  const [rows, setRows] = useState<WbsProgressRow[]>(initialWbsProgress ?? []);
  const [mode, setMode] = useState<"planned" | "actual">("planned");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRows(initialWbsProgress);
  }, [initialWbsProgress]);

  const handleCellChange = (
    rowId: string,
    periodIndex: number,
    value: string
  ) => {
    const numericVal = parseFloat(value) || 0;
    const clampedVal = Math.max(0, Math.min(100, numericVal));

    setRows((prevRows) => {
      return prevRows.map((row) => {
        if (row.id !== rowId) return row;

        if (mode === "planned") {
          const updatedPlans = [...row.plans];
          updatedPlans[periodIndex] = {
            ...updatedPlans[periodIndex],
            planned: clampedVal,
          };
          const totalPlanned = updatedPlans.reduce((sum, p) => sum + p.planned, 0);

          return {
            ...row,
            plans: updatedPlans,
            totalPlanned: parseFloat(totalPlanned.toFixed(2)),
          };
        } else {
          const updatedActuals = [...row.actuals];
          updatedActuals[periodIndex] = {
            ...updatedActuals[periodIndex],
            actual: clampedVal,
          };
          const totalActual = updatedActuals.reduce((sum, a) => sum + a.actual, 0);

          return {
            ...row,
            actuals: updatedActuals,
            totalActual: parseFloat(totalActual.toFixed(2)),
          };
        }
      });
    });

    triggerAutoSave();
  };

  const triggerAutoSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      setSaveState("saving");

      try {
        const payloadPlans = rows.flatMap((row) =>
          row.plans.map((p) => ({
            wbsItemId: row.id,
            periodDate: p.periodDate,
            percentage: p.planned,
          }))
        );

        const payloadActuals = rows.flatMap((row) =>
          row.actuals.map((a) => ({
            wbsItemId: row.id,
            periodDate: a.periodDate,
            percentage: a.actual,
          }))
        );

        const response = await fetch(`/api/projects/${projectId}/scurve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plans: mode === "planned" ? payloadPlans : undefined,
            actuals: mode === "actual" ? payloadActuals : undefined,
          }),
        });

        if (response.ok) {
          setSaveState("saved");
          if (onDataChanged) onDataChanged();
          setTimeout(() => setSaveState("idle"), 2000);
        } else {
          setSaveState("idle");
        }
      } catch (err) {
        console.error("Auto save failed", err);
        setSaveState("idle");
      }
    }, 1500);
  };

  const distributeRemaining = (rowId: string) => {
    setRows((prevRows) => {
      return prevRows.map((row) => {
        if (row.id !== rowId) return row;

        if (mode === "planned") {
          const currentSum = row.plans.reduce((s, p) => s + p.planned, 0);
          const remaining = 100 - currentSum;
          if (remaining <= 0) return row;

          const emptyPeriodsIdx = row.plans
            .map((p, i) => (p.planned === 0 ? i : -1))
            .filter((i) => i !== -1);

          if (emptyPeriodsIdx.length === 0) return row;

          const share = parseFloat((remaining / emptyPeriodsIdx.length).toFixed(2));
          const updatedPlans = row.plans.map((p, i) => {
            if (emptyPeriodsIdx.includes(i)) {
              return { ...p, planned: share };
            }
            return p;
          });

          const totalPlanned = updatedPlans.reduce((sum, p) => sum + p.planned, 0);
          return {
            ...row,
            plans: updatedPlans,
            totalPlanned: parseFloat(totalPlanned.toFixed(2)),
          };
        }
        return row;
      });
    });
    triggerAutoSave();
  };

  const footerMetrics = useMemo(() => {
    const totalPeriods = periods.length;
    const planWeightedPerPeriod = new Array(totalPeriods).fill(0);
    const actualWeightedPerPeriod = new Array(totalPeriods).fill(0);

    rows.forEach((row) => {
      const w = row.weight / 100;
      row.plans.forEach((p, idx) => {
        planWeightedPerPeriod[idx] += w * p.planned;
      });
      row.actuals.forEach((a, idx) => {
        actualWeightedPerPeriod[idx] += w * a.actual;
      });
    });

    const plannedCumulative = [];
    const actualCumulative = [];
    let pCum = 0;
    let aCum = 0;

    for (let i = 0; i < totalPeriods; i++) {
      pCum += planWeightedPerPeriod[i];
      aCum += actualWeightedPerPeriod[i];

      plannedCumulative.push(parseFloat(Math.min(pCum, 100).toFixed(2)));
      actualCumulative.push(parseFloat(Math.min(aCum, 100).toFixed(2)));
    }

    return {
      planWeightedPerPeriod: planWeightedPerPeriod.map((v) => parseFloat(v.toFixed(2))),
      actualWeightedPerPeriod: actualWeightedPerPeriod.map((v) => parseFloat(v.toFixed(2))),
      plannedCumulative,
      actualCumulative,
    };
  }, [rows, periods]);

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-full w-fit">
          <div
            className={cn(
              "relative px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 text-background"
            )}
          >
            <motion.div
              layoutId="spread-mode-active"
              className="absolute inset-0 bg-foreground rounded-full -z-10"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <Settings className="w-3.5 h-3.5" />
            Distribusi Rencana (% Planned)
          </div>
          <a
            href={`/projects/${projectId}/progress`}
            className="px-4 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1.5"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Input Progress Aktual →
          </a>
        </div>

        {/* Save Status Spinner */}
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {saveState === "saving" && (
              <motion.span
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-amber-600 flex items-center gap-1.5 font-medium"
              >
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                Menyimpan...
              </motion.span>
            )}
            {saveState === "saved" && (
              <motion.span
                key="saved"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-emerald-600 flex items-center gap-1 font-medium"
              >
                <Check className="w-3 h-3" />
                Tersimpan
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Grid Container */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              <BarChart2 className="w-7 h-7 text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">Belum Ada Item WBS</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Tambahkan item WBS (Rincian Anggaran Biaya) terlebih dahulu di menu <strong>WBS/RAB</strong> sebelum mengisi distribusi progress S-Curve.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-w-full">
            <table className="w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr className="bg-zinc-50 [&_th]:border-b [&_th]:border-zinc-200">
                <th className="sticky left-0 z-20 bg-zinc-50 px-4 py-2.5 text-left font-semibold text-zinc-500 uppercase tracking-wide w-[80px] min-w-[80px] max-w-[80px] box-border border-r border-zinc-200">
                  Kode
                </th>
                <th className="sticky left-[80px] z-20 bg-zinc-50 px-4 py-2.5 text-left font-semibold text-zinc-500 uppercase tracking-wide min-w-[200px] border-r border-zinc-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  Uraian Pekerjaan Leaf
                </th>
                <th className="px-3 py-2.5 text-center font-semibold text-zinc-500 uppercase tracking-wide border-r border-zinc-200 w-[50px]">
                  Sat
                </th>
                <th className="px-4 py-2.5 text-right font-semibold text-zinc-500 uppercase tracking-wide border-r border-zinc-200 w-[80px]">
                  Bobot %
                </th>

                {periods.map((p) => (
                  <th
                    key={p.periodLabel}
                    className="px-3 py-2.5 text-center font-semibold text-zinc-500 uppercase tracking-wide border-r border-zinc-200 min-w-[70px]"
                  >
                    {p.periodLabel}
                  </th>
                ))}

                <th className="px-4 py-2.5 text-center font-semibold text-zinc-500 uppercase tracking-wide w-[90px]">
                  Total %
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const total = mode === "planned" ? row.totalPlanned : row.totalActual;
                const isComplete = Math.abs(total - 100) < 0.05;

                return (
                  <tr
                    key={row.id}
                    className="group hover:bg-zinc-50/50 transition-colors [&_td]:border-b [&_td]:border-zinc-100"
                  >
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-zinc-50 px-4 py-2 font-mono text-zinc-500 w-[80px] min-w-[80px] max-w-[80px] box-border border-r border-zinc-200">
                      {row.code}
                    </td>
                    <td className="sticky left-[80px] z-10 bg-white group-hover:bg-zinc-50 px-4 py-2 font-medium text-foreground border-r border-zinc-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] truncate max-w-[220px]">
                      {row.name}
                    </td>
                    <td className="px-3 py-2 text-center text-zinc-500 border-r border-zinc-100">
                      {row.unit}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-foreground border-r border-zinc-100">
                      {row.weight.toFixed(2)}%
                    </td>

                    {periods.map((p, idx) => {
                      const value =
                        mode === "planned"
                          ? row.plans[idx]?.planned ?? 0
                          : row.actuals[idx]?.actual ?? 0;

                      return (
                        <td
                          key={idx}
                          className="p-1 border-r border-zinc-100 text-center relative focus-within:bg-blue-50/30 transition-all"
                        >
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={value === 0 ? "" : value}
                            placeholder="0"
                            onChange={(e) => handleCellChange(row.id, idx, e.target.value)}
                            className="w-full h-full p-1 bg-transparent border border-transparent rounded-md text-center text-foreground font-mono placeholder:text-zinc-300 hover:border-zinc-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                      );
                    })}

                    <td
                      className={cn(
                        "px-4 py-2 text-right font-bold border-l border-zinc-200",
                        mode === "planned"
                          ? isComplete
                            ? "text-emerald-600 bg-emerald-50/30"
                            : "text-red-500 bg-red-50/30"
                          : "text-blue-600 bg-blue-50/30"
                      )}
                    >
                      <div className="flex items-center justify-end gap-2">
                        {mode === "planned" && !isComplete && (
                          <button
                            title="Distribusikan sisa % ke periode kosong"
                            onClick={() => distributeRemaining(row.id)}
                            className="p-1 hover:bg-red-100 text-red-500 rounded transition-colors"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className="font-mono">{total.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Sub-total aggregates footer */}
              <tr className="bg-[#f8f8f9] font-bold [&_td]:border-t-2 [&_td]:border-zinc-200">
                <td colSpan={2} className="sticky left-0 z-10 bg-[#f8f8f9] px-4 py-3 border-r border-zinc-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] text-foreground">
                  Progres Bobot Tertimbang {mode === "planned" ? "Rencana" : "Aktual"}
                </td>
                <td className="border-r border-zinc-200" />
                <td className="px-4 py-3 text-right border-r border-zinc-200 text-foreground font-mono">
                  100.00%
                </td>

                {periods.map((p, idx) => {
                  const val =
                    mode === "planned"
                      ? footerMetrics.planWeightedPerPeriod[idx]
                      : footerMetrics.actualWeightedPerPeriod[idx];
                  return (
                    <td
                      key={idx}
                      className="px-3 py-3 text-center border-r border-zinc-200 text-zinc-600 font-mono"
                    >
                      {val > 0 ? `${val.toFixed(2)}%` : "-"}
                    </td>
                  );
                })}

                <td className="px-4 py-3 text-right text-foreground font-mono">
                  {mode === "planned"
                    ? rows.reduce((s, r) => s + r.weight * (r.totalPlanned / 100), 0).toFixed(1)
                    : rows.reduce((s, r) => s + r.weight * (r.totalActual / 100), 0).toFixed(1)}
                  %
                </td>
              </tr>

              {/* Cumulative footer */}
              <tr className="bg-zinc-200 font-bold [&_td]:border-t [&_td]:border-zinc-300">
                <td colSpan={2} className="sticky left-0 z-10 bg-zinc-200 px-4 py-3 border-r border-zinc-300 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)] text-foreground">
                  Progress Kumulatif {mode === "planned" ? "Rencana" : "Aktual"} (%)
                </td>
                <td className="border-r border-zinc-200" />
                <td className="px-4 py-3 text-right border-r border-zinc-200 text-foreground font-mono">
                  100.00%
                </td>

                {periods.map((p, idx) => {
                  const val =
                    mode === "planned"
                      ? footerMetrics.plannedCumulative[idx]
                      : footerMetrics.actualCumulative[idx];
                  return (
                    <td
                      key={idx}
                      className="px-3 py-3 text-center border-r border-zinc-200 text-primary font-mono text-[13px]"
                    >
                      {val > 0 ? `${val.toFixed(2)}%` : "-"}
                    </td>
                  );
                })}

                <td className="px-4 py-3 text-right text-primary font-mono text-[13px]">
                  100.0%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Excel/Distribution Info Card */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-800 text-sm">
        <Info className="w-5 h-5 shrink-0 text-blue-500" />
        <div className="space-y-1.5">
          <p className="font-semibold text-blue-900">Tips Pengisian Spreadsheet:</p>
          <ul className="space-y-1 text-blue-800/80">
            <li>1. Ubah cell di kolom periode secara langsung untuk memasukkan bobot rencana mingguan/bulanan. Data akan otomatis tersimpan.</li>
            <li>2. Klik tombol kalkulator <Calculator className="w-3.5 h-3.5 inline text-blue-500 mx-1" /> di sebelah &quot;Total %&quot; untuk mendistribusikan sisa persentase secara merata ke seluruh periode kosong.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
