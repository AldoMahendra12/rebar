"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigationStore } from "@/stores/navigation-store";
import { cn } from "@/lib/utils";

interface AttentionProject {
  id: string;
  name: string;
  code: string;
  plannedProgress: number;
  actualProgress: number;
  deviation: number;
  daysRemaining: number;
  status: string;
}

const fetchAttention = async (): Promise<AttentionProject[]> => {
  const res = await fetch("/api/dashboard/attention");
  if (!res.ok) throw new Error("Failed");
  return res.json();
};

function IndicatorBar({ deviation }: { deviation: number }) {
  let color = "bg-amber-400";
  if (deviation <= -10) color = "bg-red-500";
  else if (deviation <= -5) color = "bg-orange-400";
  return <div className={`w-1 h-10 rounded-full shrink-0 ${color}`} />;
}

function DaysBadge({ days }: { days: number }) {
  if (days < 0)
    return (
      <span className="text-xs font-semibold text-red-600">
        Tlb {Math.abs(days)}h
      </span>
    );
  return (
    <span
      className={cn(
        "text-xs",
        days < 0 ? "text-red-600" : "text-muted-foreground"
      )}
    >
      {days} hari lagi
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="flex gap-3 px-5 py-3.5 items-center">
      <div className="w-1 h-10 bg-zinc-200 rounded animate-shimmer shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 bg-zinc-200 rounded animate-shimmer" />
        <div className="h-3 w-24 bg-zinc-100 rounded animate-shimmer" />
      </div>
      <div className="h-6 w-12 bg-zinc-200 rounded-full animate-shimmer" />
    </div>
  );
}

export function AttentionPanel() {
  const router = useRouter();
  const { setActiveProject } = useNavigationStore();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-attention"],
    queryFn: fetchAttention,
  });

  const handleClick = (project: AttentionProject) => {
    setActiveProject({ id: project.id, name: project.name, code: project.code });
    router.push(`/projects/${project.id}`);
  };

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-foreground">Perlu Perhatian</span>
          {data && data.length > 0 && (
            <span className="bg-red-500/10 text-red-600 rounded-full px-2 py-0.5 text-xs font-medium">
              {data.length}
            </span>
          )}
        </div>
        <button
          onClick={() => router.push("/projects?filter=behind")}
          className="text-xs text-primary hover:underline flex items-center gap-0.5"
        >
          Semua Proyek <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : !data || data.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="px-5 py-10 flex flex-col items-center text-center"
        >
          <CheckCircle className="w-8 h-8 text-emerald-300" />
          <p className="text-sm font-medium text-zinc-500 mt-3">
            Semua proyek on track
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Tidak ada proyek yang membutuhkan perhatian
          </p>
        </motion.div>
      ) : (
        <motion.ul
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05 } },
          }}
        >
          <AnimatePresence>
            {data.map((project, i) => (
              <motion.li
                key={project.id}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                }}
                onClick={() => handleClick(project)}
                className={cn(
                  "flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-zinc-50/60 transition-colors",
                  i < data.length - 1 && "border-b border-zinc-50"
                )}
              >
                <IndicatorBar deviation={project.deviation} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate max-w-[160px]">
                    {project.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-muted-foreground">{project.code}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <DaysBadge days={project.daysRemaining} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="bg-red-500/10 text-red-600 rounded-full px-2.5 py-1 text-xs font-semibold">
                    {project.deviation > 0 ? "+" : ""}{project.deviation}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {project.actualProgress}% / {project.plannedProgress}%
                  </span>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
