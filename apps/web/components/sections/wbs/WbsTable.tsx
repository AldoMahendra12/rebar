"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, AlertTriangle, FileDown, Upload } from "lucide-react";
import { WbsRow } from "@/types/wbs";
import { calculateTotals, calculateWeights, flattenWbsTree, buildWbsTree, fmtIDR } from "@/lib/scurve";
import { WbsTableRow } from "./WbsTableRow";
import { cn } from "@/lib/utils";

interface WbsTableProps {
  initialRows: WbsRow[];
  projectId: string;
}

let idCounter = 1000;
function genId() {
  return `wbs-new-${++idCounter}`;
}

function autoCode(rows: WbsRow[], parentId: string | null, level: number): string {
  const siblings = rows.filter(
    (r) => r.parentId === parentId && r.level === level
  );
  const parent = parentId ? rows.find((r) => r.id === parentId) : null;
  const prefix = parent ? parent.code + "." : "";
  return `${prefix}${siblings.length + 1}`;
}

export function WbsTable({ initialRows, projectId }: WbsTableProps) {
  const [rows, setRows] = useState<WbsRow[]>(() => {
    const withTotals = calculateTotals(initialRows);
    return calculateWeights(withTotals);
  });
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; field: string } | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Recalculate totals + weights whenever rows change
  function recalculate(updatedRows: WbsRow[]): WbsRow[] {
    const withTotals = calculateTotals(updatedRows);
    return calculateWeights(withTotals);
  }

  // Debounced auto-save
  function triggerSave() {
    setHasUnsavedChanges(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        const response = await fetch(`/api/projects/${projectId}/wbs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows }),
        });

        if (response.ok) {
          setSaveState("saved");
          setHasUnsavedChanges(false);
        } else {
          setSaveState("idle");
        }
      } catch (err) {
        console.error("Auto save WBS failed", err);
        setSaveState("idle");
      }
      setTimeout(() => setSaveState("idle"), 2000);
    }, 2000);
  }

  function handleUpdate(id: string, field: keyof WbsRow, value: string | number | null) {
    setRows((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      );
      return recalculate(updated);
    });
    triggerSave();
  }

  function handleAddRoot() {
    setRows((prev) => {
      const newRow: WbsRow = {
        id: genId(),
        projectId,
        parentId: null,
        code: autoCode(prev, null, 1),
        name: "",
        level: 1,
        unit: "",
        volume: null,
        unitPrice: null,
        totalPrice: null,
        weight: null,
        sortOrder: prev.filter((r) => !r.parentId).length,
        isLeaf: false,
        isNew: true,
      };
      return [...prev, newRow];
    });
    triggerSave();
  }

  function handleAddChild(parentId: string, level: number) {
    setRows((prev) => {
      const parent = prev.find((r) => r.id === parentId);
      if (!parent) return prev;

      const isLeaf = level === 3;
      const newRow: WbsRow = {
        id: genId(),
        projectId,
        parentId,
        code: autoCode(prev, parentId, level),
        name: "",
        level: level as 1 | 2 | 3,
        unit: isLeaf ? "m³" : "",
        volume: null,
        unitPrice: null,
        totalPrice: null,
        weight: null,
        sortOrder: prev.filter((r) => r.parentId === parentId).length,
        isLeaf,
        isNew: true,
      };

      // Update parent to be non-leaf
      const updated = prev.map((r) =>
        r.id === parentId ? { ...r, isLeaf: false } : r
      );
      return recalculate([...updated, newRow]);
    });
    triggerSave();
  }

  function handleAddSibling(row: WbsRow) {
    const isLeaf = row.level === 3;
    setRows((prev) => {
      const newRow: WbsRow = {
        id: genId(),
        projectId,
        parentId: row.parentId,
        code: autoCode(prev, row.parentId, row.level),
        name: "",
        level: row.level,
        unit: isLeaf ? "m³" : "",
        volume: null,
        unitPrice: null,
        totalPrice: null,
        weight: null,
        sortOrder: row.sortOrder + 1,
        isLeaf,
        isNew: true,
      };
      return recalculate([...prev, newRow]);
    });
    triggerSave();
  }

  function handleDelete(id: string) {
    setRows((prev) => {
      // Delete children recursively
      function getAllDescendants(rowId: string): string[] {
        const children = prev.filter((r) => r.parentId === rowId);
        return [rowId, ...children.flatMap((c) => getAllDescendants(c.id))];
      }
      const toDelete = new Set(getAllDescendants(id));
      const filtered = prev.filter((r) => !toDelete.has(r.id));
      return recalculate(filtered);
    });
    triggerSave();
  }

  // Flatten rows in tree order for rendering
  const orderedRows = flattenWbsTree(buildWbsTree(rows));

  // Stats
  const leaves = rows.filter((r) => r.isLeaf && r.totalPrice != null);
  const totalValue = leaves.reduce((s, r) => s + (r.totalPrice ?? 0), 0);
  const totalWeight = leaves.reduce((s, r) => s + (r.weight ?? 0), 0);
  const weightValid = Math.abs(totalWeight - 100) < 0.5;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md py-3 border-b border-zinc-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRoot}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 bg-white text-foreground rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
            Item Utama
          </button>
          
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent text-muted-foreground rounded-lg text-sm hover:bg-zinc-100 hover:text-foreground transition-colors group relative"
            title="Coming soon"
          >
            <Upload className="w-4 h-4 opacity-60 group-hover:opacity-100" />
            Import Excel
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Unsaved indicator */}
            <AnimatePresence>
              {hasUnsavedChanges && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-1.5 text-xs text-amber-600"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Ada perubahan belum disimpan
                </motion.div>
              )}
            </AnimatePresence>
            
            {!hasUnsavedChanges && saveState === "saved" && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-emerald-600 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Tersimpan
              </motion.span>
            )}

            <span className="text-xs text-zinc-400 hidden sm:inline-block border-l border-zinc-200 pl-3">
              Ketik dan klik di luar untuk otomatis menyimpan
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide w-[80px]">
                  Kode
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Uraian Pekerjaan
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wide w-[90px]">
                  Sat
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide w-[110px]">
                  Volume
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide w-[140px]">
                  Harga Sat (Rp)
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide w-[150px]">
                  Total Harga (Rp)
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide w-[90px]">
                  Bobot %
                </th>
                <th className="w-[80px]" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {orderedRows.map((row) => (
                  <WbsTableRow
                    key={row.id}
                    row={row}
                    allRows={rows}
                    onUpdate={handleUpdate}
                    onAddChild={handleAddChild}
                    onAddSibling={handleAddSibling}
                    onDelete={handleDelete}
                    focusedCell={focusedCell}
                    onFocus={(rowId, field) => setFocusedCell({ rowId, field })}
                  />
                ))}
              </AnimatePresence>
            </tbody>
            {/* Footer */}
            {leaves.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-zinc-200 bg-zinc-50">
                  <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-foreground">
                    TOTAL
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {fmtIDR(totalValue)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "font-mono text-sm font-bold",
                        weightValid ? "text-emerald-600" : "text-red-500"
                      )}
                    >
                      {totalWeight.toFixed(2)}%
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50"
        >
          <p className="text-sm text-muted-foreground mb-4">Belum ada rincian WBS</p>
          <button
            onClick={handleAddRoot}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] border border-[#1d4ed8] shadow-[0_1px_2px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] rounded-lg hover:brightness-105 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Pekerjaan Utama
          </button>
        </motion.div>
      )}
    </div>
  );
}
