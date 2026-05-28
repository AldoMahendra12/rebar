"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Plus, LayoutGrid, List } from "lucide-react";
import { ProjectCard } from "@/components/sections/dashboard/ProjectCard";
import { FilterBar } from "@/components/sections/dashboard/FilterBar";
import { EmptyState } from "@/components/sections/dashboard/EmptyState";
import { DashboardSkeleton } from "@/components/sections/dashboard/DashboardSkeleton";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { SortOption, StatusFilter } from "@/components/sections/dashboard/ProjectGrid";
import { useCreateProjectModal } from "@/hooks/use-create-project-modal";

function formatRupiah(v: number): string {
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)}Md`;
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)}M`;
  return `Rp ${v}`;
}

const statusLabel: Record<string, string> = {
  active: "Aktif",
  planning: "Perencanaan",
  on_hold: "Ditunda",
  completed: "Selesai",
};

const statusCls: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-600",
  planning: "bg-zinc-100 text-zinc-600",
  on_hold: "bg-amber-500/10 text-amber-600",
  completed: "bg-emerald-500/10 text-emerald-600",
};

export default function ProjectsPage() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const { open } = useCreateProjectModal();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    filterParam === "behind" ? "active" : "all"
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    filterParam === "behind" ? "deviation" : "name"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const projects = MOCK_PROJECTS;

  const filtered = useMemo(() => {
    let result = [...projects];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (filterParam === "behind") {
      result = result.filter((p) => p.deviation < 0);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "deadline": return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case "deviation": return a.deviation - b.deviation;
        case "contractValue": return b.contractValue - a.contractValue;
        default: return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [projects, statusFilter, sortBy, searchQuery, filterParam]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-100">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">
            Semua Proyek
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projects.length} proyek terdaftar
            {filterParam === "behind" && (
              <span className="ml-2 text-xs text-red-500 font-medium">(filter: terlambat)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded transition-all",
                viewMode === "grid" ? "bg-white shadow-sm text-foreground" : "text-zinc-500 hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded transition-all",
                viewMode === "list" ? "bg-white shadow-sm text-foreground" : "text-zinc-500 hover:text-foreground"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={open}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] border border-[#1d4ed8] shadow-[0_1px_2px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] rounded-lg hover:brightness-105 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Buat Proyek
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalCount={projects.length}
        filteredCount={filtered.length}
      />

      {/* Content */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState
              hasProjects={projects.length > 0}
              filterActive={statusFilter !== "all" || searchQuery !== ""}
            />
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div
            key="grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } }
            }}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((project) => (
                <motion.div 
                  key={project.id} 
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
                  }}
                  layout
                >
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* LIST VIEW */
          <motion.div
            key="list"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-border rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-2.5 border-b border-zinc-100 bg-zinc-50">
              {["Proyek", "Status", "Progress", "Deviasi", "Deadline"].map((h) => (
                <span key={h} className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{h}</span>
              ))}
            </div>
            {/* Table Rows */}
            <AnimatePresence>
              {filtered.map((project, i) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 items-center cursor-pointer hover:bg-zinc-50 transition-colors",
                    i < filtered.length - 1 && "border-b border-zinc-50"
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.code} · {project.clientName}</p>
                  </div>
                  <span className={cn("inline-flex text-xs font-medium rounded-full px-2 py-0.5 w-fit", statusCls[project.status])}>
                    {statusLabel[project.status] ?? project.status}
                  </span>
                  <div>
                    <p className="text-xs text-foreground font-medium">{project.actualProgress}%</p>
                    <div className="h-1 w-full max-w-[80px] bg-zinc-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${project.actualProgress}%` }} />
                    </div>
                  </div>
                  <span className={cn("text-xs font-semibold", project.deviation < 0 ? "text-red-500" : project.deviation > 0 ? "text-emerald-500" : "text-zinc-400")}>
                    {project.deviation > 0 ? "+" : ""}{project.deviation}%
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(project.endDate), "dd MMM yyyy", { locale: idLocale })}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
