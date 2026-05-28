"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigationStore } from "@/stores/navigation-store";
import { useRouter } from "next/navigation";
import { ProjectCard as ProjectCardType } from "@/types";

interface ProjectCardProps {
  project: ProjectCardType;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [hovered, setHovered] = useState(false);
  const { setActiveProject } = useNavigationStore();
  const router = useRouter();

  function handleClick() {
    setActiveProject({
      id: project.id,
      name: project.name,
      code: project.code,
    });
    router.push(`/projects/${project.id}`);
  }

  const actualProgress = project.status === 'planning' ? null : project.actualProgress;

  return (
    <motion.div
      className="relative bg-white border border-zinc-200/80 rounded-2xl overflow-hidden cursor-pointer p-4 flex flex-col justify-between w-full gap-3"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.18 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={handleClick}
      animate={{
        boxShadow: hovered
          ? "0 8px 28px rgba(0,0,0,0.10)"
          : "0 1px 4px rgba(0,0,0,0.05)",
        borderColor: hovered
          ? "hsl(220 13% 82%)"
          : "hsl(220 13% 91%)",
      }}
    >


      {/* TOP: Nama + Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-base text-foreground leading-snug line-clamp-2" style={{ maxWidth: "calc(100% - 80px)" }}>
            {project.name}
          </h3>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            {project.code}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* MIDDLE: Nilai Kontrak + Progress Bar */}
      <div>
        <motion.p
          className="font-display text-2xl font-bold tracking-tight leading-none text-foreground"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {formatRupiah(project.contractValue)}
        </motion.p>

        {/* Progress Bar */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-zinc-400">progress aktual</span>
            <span className="text-[10px] font-semibold text-blue-600">
              {actualProgress !== null && !isNaN(actualProgress)
                ? `${actualProgress.toFixed(1)}%`
                : "—"
              }
            </span>
          </div>
          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: actualProgress !== null && !isNaN(actualProgress) ? `${actualProgress}%` : "0%" }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* BOTTOM: Footer */}
      <div className="mt-1 -mx-4 -mb-4 bg-blue-600 px-4 py-3 flex items-center justify-between transition-colors">
        <p className="text-xs text-blue-100 truncate flex items-center">
          <span className="truncate max-w-[160px] inline-block">
            {project.clientName}
          </span>
        </p>

        <motion.span
          animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -6 }}
          transition={{ duration: 0.15 }}
          className="text-xs font-medium text-white flex items-center gap-1 shrink-0 ml-2"
        >
          Buka <ArrowRight size={11} />
        </motion.span>
      </div>
    </motion.div>
  );
}

// ─── Sub Components ───────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { style: string; label: string }> = {
    planning: { style: "bg-zinc-100 text-zinc-500", label: "Perencanaan" },
    active: { style: "bg-blue-50 text-blue-600", label: "Aktif" },
    on_hold: { style: "bg-zinc-100 text-zinc-600", label: "Ditunda" },
    completed: { style: "bg-zinc-100 text-zinc-600", label: "Selesai" },
  };
  const { style, label } = map[status] ?? map.planning;

  return (
    <span className={cn(
      "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
      style
    )}>
      {label}
    </span>
  );
}

// ─── Helper Functions ─────────────────────────





function formatRupiah(value: number): string {
  return `Rp. ${value.toLocaleString("id-ID")}`;
}
