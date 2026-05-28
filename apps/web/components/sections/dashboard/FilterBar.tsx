"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { SortOption, StatusFilter } from "./ProjectGrid";
import { motion } from "framer-motion";

interface FilterBarProps {
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  totalCount: number;
  filteredCount: number;
}

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "planning", label: "Perencanaan" },
  { value: "on_hold", label: "Ditunda" },
  { value: "completed", label: "Selesai" },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "name", label: "Nama" },
  { value: "deadline", label: "Deadline" },
  { value: "deviation", label: "Deviasi" },
  { value: "contractValue", label: "Nilai Kontrak" },
];

export function FilterBar({
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-full">
          {statusOptions.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onStatusChange(opt.value)}
                className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="filter-active"
                    className="absolute inset-0 bg-white shadow-sm border border-zinc-200/50 rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex items-center gap-2 border-b border-transparent focus-within:border-zinc-300 transition-colors w-full sm:w-64 pb-1">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Cari proyek..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto">
        {/* Count */}
        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 hidden lg:block">
          {filteredCount} {filteredCount !== totalCount ? `/ ${totalCount}` : ''} proyek
        </span>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer hover:text-zinc-600 transition-colors"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Urutkan: {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
