"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectCard } from "./ProjectCard";
import { FilterBar } from "./FilterBar";
import { EmptyState } from "./EmptyState";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { ProjectCard as ProjectCardType } from "@/types";

interface ProjectGridProps {
  projects: ProjectCardType[];
  isLoading?: boolean;
}

export type SortOption = "deadline" | "deviation" | "contractValue" | "name";
export type StatusFilter = "all" | "active" | "planning" | "on_hold" | "completed";

export function ProjectGrid({ projects, isLoading = false }: ProjectGridProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let result = [...projects];

    // Search filter
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

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "deadline":
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case "deviation":
          return a.deviation - b.deviation; // most behind first
        case "contractValue":
          return b.contractValue - a.contractValue;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [projects, statusFilter, sortBy, searchQuery]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div>
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

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              hasProjects={projects.length > 0}
              filterActive={statusFilter !== "all" || searchQuery !== ""}
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
