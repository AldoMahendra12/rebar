"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, GripVertical, ChevronRight, ChevronLeft } from "lucide-react";
import { WbsRow } from "@/types/wbs";
import { cn } from "@/lib/utils";
import { fmtIDR } from "@/lib/scurve";

interface WbsTableRowProps {
  row: WbsRow;
  allRows: WbsRow[];
  onUpdate: (id: string, field: keyof WbsRow, value: string | number | null) => void;
  onAddChild: (parentId: string, level: number) => void;
  onAddSibling: (row: WbsRow) => void;
  onDelete: (id: string) => void;
  focusedCell: { rowId: string; field: string } | null;
  onFocus: (rowId: string, field: string) => void;
}

const EDITABLE_FIELDS = ["name", "unit", "volume", "unitPrice"] as const;

export function WbsTableRow({
  row,
  allRows,
  onUpdate,
  onAddChild,
  onAddSibling,
  onDelete,
  focusedCell,
  onFocus,
}: WbsTableRowProps) {
  const [hovered, setHovered] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const unitRef = useRef<HTMLInputElement>(null);
  const volumeRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  const hasChildren = allRows.some((r) => r.parentId === row.id);
  const isFocused = focusedCell?.rowId === row.id;

  // Level specific styling
  const isLevel1 = row.level === 1;
  const isLevel2 = row.level === 2;
  const isLevel3 = row.level === 3;

  const indent = isLevel1 ? 0 : isLevel2 ? 24 : 48;

  function getRef(field: string) {
    switch (field) {
      case "name": return nameRef;
      case "unit": return unitRef;
      case "volume": return volumeRef;
      case "unitPrice": return priceRef;
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, field: string) {
    if (e.key === "Tab") {
      e.preventDefault();
      const idx = EDITABLE_FIELDS.indexOf(field as typeof EDITABLE_FIELDS[number]);
      if (idx < EDITABLE_FIELDS.length - 1) {
        const nextField = EDITABLE_FIELDS[idx + 1];
        if (row.isLeaf || nextField === "name") {
          onFocus(row.id, nextField);
          getRef(nextField)?.current?.focus();
        }
      } else {
        // Move to next row's name
        onAddSibling(row);
      }
    }
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  }

  function cellClass(field: string) {
    const isEditing = focusedCell?.rowId === row.id && focusedCell?.field === field;
    return cn(
      "w-full bg-transparent outline-none transition-all",
      isEditing 
        ? "bg-white border border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] rounded-md px-2 py-1 text-foreground"
        : "text-foreground hover:underline hover:decoration-zinc-300 hover:decoration-dashed",
      !row.isLeaf && field !== "name" && "opacity-0 pointer-events-none"
    );
  }

  const codeColors = {
    1: "text-primary font-bold",
    2: "text-zinc-500",
    3: "text-zinc-400",
  };

  const nameColors = {
    1: "text-foreground font-semibold",
    2: "text-foreground font-medium",
    3: "text-foreground",
  };

  return (
    <motion.tr
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "border-b border-zinc-200 transition-colors duration-100 relative",
        isLevel1 && "bg-zinc-50/60 border-t-2",
        !isLevel1 && "bg-white",
        hovered && "bg-blue-50/40",
        isFocused && "bg-primary/3"
      )}
    >
      {/* Selection Indicator */}
      {isFocused && (
        <td className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary z-10" />
      )}

      {/* Code */}
      <td className="px-4 py-3 w-[80px]">
        <span className={cn("font-mono text-xs", codeColors[row.level])}>
          {row.code}
        </span>
      </td>

      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center" style={{ paddingLeft: indent }}>
          {isLevel2 && <div className="w-1 h-1 rounded-full bg-zinc-300 mr-2 shrink-0" />}
          {isLevel3 && <div className="w-1 h-1 rounded-full bg-zinc-200 mr-2 shrink-0" />}
          
          <input
            ref={nameRef}
            value={row.name}
            onChange={(e) => onUpdate(row.id, "name", e.target.value)}
            onFocus={() => onFocus(row.id, "name")}
            onKeyDown={(e) => handleKeyDown(e, "name")}
            placeholder={row.isLeaf ? "Nama pekerjaan..." : "Nama group..."}
            className={cn(
              cellClass("name"),
              nameColors[row.level],
              "text-sm placeholder:text-zinc-400 placeholder:font-normal"
            )}
          />
        </div>
      </td>

      {/* Unit */}
      <td className="px-4 py-3 w-[90px]">
        <input
          ref={unitRef}
          value={row.unit}
          onChange={(e) => onUpdate(row.id, "unit", e.target.value)}
          onFocus={() => onFocus(row.id, "unit")}
          onKeyDown={(e) => handleKeyDown(e, "unit")}
          disabled={!row.isLeaf}
          placeholder={row.isLeaf ? "m³" : ""}
          className={cn(cellClass("unit"), "text-center text-sm")}
        />
      </td>

      {/* Volume */}
      <td className="px-4 py-3 w-[110px]">
        <input
          ref={volumeRef}
          type="number"
          value={row.volume ?? ""}
          onChange={(e) =>
            onUpdate(row.id, "volume", e.target.value === "" ? null : parseFloat(e.target.value))
          }
          onFocus={() => onFocus(row.id, "volume")}
          onKeyDown={(e) => handleKeyDown(e, "volume")}
          disabled={!row.isLeaf}
          placeholder="0"
          className={cn(cellClass("volume"), "text-right font-mono text-sm")}
        />
      </td>

      {/* Unit Price */}
      <td className="px-4 py-3 w-[140px]">
        <input
          ref={priceRef}
          type="number"
          value={row.unitPrice ?? ""}
          onChange={(e) =>
            onUpdate(row.id, "unitPrice", e.target.value === "" ? null : parseFloat(e.target.value))
          }
          onFocus={() => onFocus(row.id, "unitPrice")}
          onKeyDown={(e) => handleKeyDown(e, "unitPrice")}
          disabled={!row.isLeaf}
          placeholder="0"
          className={cn(cellClass("unitPrice"), "text-right font-mono text-sm")}
        />
      </td>

      {/* Total Price */}
      <td className="px-4 py-3 w-[150px] text-right">
        {row.isLeaf && row.totalPrice != null ? (
          <span className="font-mono text-sm font-medium text-foreground">
            {fmtIDR(row.totalPrice)}
          </span>
        ) : !row.isLeaf && hasChildren ? (
          <span className="text-xs text-zinc-400 italic">subtotal</span>
        ) : (
          <span className="text-zinc-300 text-sm">-</span>
        )}
      </td>

      {/* Bobot % */}
      <td className="px-4 py-3 w-[90px] text-right">
        {row.isLeaf && row.weight != null ? (
          <span
            className={cn(
              "font-mono text-sm font-medium",
              row.weight > 20 ? "text-primary" : "text-foreground"
            )}
          >
            {row.weight.toFixed(2)}%
          </span>
        ) : (
          <span className="text-zinc-300 text-sm">-</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 w-[80px]">
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 justify-end"
            >
              {row.level < 3 && (
                <button
                  onClick={() => onAddChild(row.id, row.level + 1)}
                  title="Tambah sub-item"
                  className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <button
                title="Pindahkan baris (Drag)"
                className="p-1 rounded cursor-grab text-zinc-300 hover:text-zinc-500 transition-colors"
              >
                <GripVertical className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(row.id)}
                title="Hapus"
                className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </td>
    </motion.tr>
  );
}
