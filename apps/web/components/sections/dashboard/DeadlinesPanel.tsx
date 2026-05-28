"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CalendarClock, Clock, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigationStore } from "@/stores/navigation-store";

interface DeadlineProject {
  id: string;
  name: string;
  code: string;
  endDate: string;
  daysRemaining: number;
  status: string;
}

interface OpenPeriod {
  label: string;
  deadlineDate: string;
  daysUntilDeadline: number;
  projectsNotSubmitted: number;
  projectsNotSubmittedNames: string[];
}

interface DeadlinesData {
  upcomingDeadlines: DeadlineProject[];
  openPeriod: OpenPeriod | null;
}

const fetchDeadlines = async (): Promise<DeadlinesData> => {
  const res = await fetch("/api/dashboard/deadlines");
  if (!res.ok) throw new Error("Failed");
  return res.json();
};

function DaysBadge({ days }: { days: number }) {
  let cls = "bg-zinc-100 text-zinc-600";
  let label = `${days} hari`;

  if (days < 0) {
    cls = "bg-red-500/15 text-red-700 font-semibold";
    label = `Tlb ${Math.abs(days)}h`;
  } else if (days === 0) {
    cls = "bg-red-500/10 text-red-600";
    label = "Hari ini!";
  } else if (days <= 7) {
    cls = "bg-red-500/10 text-red-600";
  } else if (days <= 14) {
    cls = "bg-orange-500/10 text-orange-600";
  } else if (days <= 30) {
    cls = "bg-amber-500/10 text-amber-600";
  }

  return (
    <span className={cn("text-xs rounded-full px-2 py-0.5 shrink-0", cls)}>{label}</span>
  );
}

function SkeletonDeadline() {
  return (
    <div className="flex justify-between items-center px-5 py-2.5">
      <div className="space-y-1.5">
        <div className="h-3.5 w-36 bg-zinc-200 rounded animate-shimmer" />
        <div className="h-3 w-24 bg-zinc-100 rounded animate-shimmer" />
      </div>
      <div className="h-5 w-14 bg-zinc-200 rounded-full animate-shimmer" />
    </div>
  );
}

function UrgencyText({ days }: { days: number }) {
  if (days < 0) return <span className="text-red-500 font-medium">Deadline sudah lewat</span>;
  if (days === 0) return <span className="text-red-500 font-medium">Hari ini!</span>;
  if (days <= 7) return <span className="text-red-500">{days} hari lagi</span>;
  if (days <= 14) return <span className="text-orange-500">{days} hari lagi</span>;
  return <span className="text-muted-foreground">{days} hari lagi</span>;
}

export function DeadlinesPanel() {
  const router = useRouter();
  const { setActiveProject } = useNavigationStore();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-deadlines"],
    queryFn: fetchDeadlines,
  });

  const handleClick = (project: DeadlineProject) => {
    setActiveProject({ id: project.id, name: project.name, code: project.code });
    router.push(`/projects/${project.id}`);
  };

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col">
      {/* SECTION 1: DEADLINE TERDEKAT */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
        <CalendarClock className="w-4 h-4 text-zinc-500" />
        <h2 className="text-sm font-semibold text-foreground">Deadline Terdekat</h2>
      </div>

      {isLoading ? (
        <>
          <SkeletonDeadline />
          <SkeletonDeadline />
          <SkeletonDeadline />
          <SkeletonDeadline />
        </>
      ) : (
        <motion.ul
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          {(data?.upcomingDeadlines ?? []).map((project, i) => (
            <motion.li
              key={project.id}
              variants={{
                hidden: { opacity: 0, y: 6 },
                show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
              }}
              onClick={() => handleClick(project)}
              className={cn(
                "flex items-center justify-between px-5 py-2.5 cursor-pointer hover:bg-zinc-50/60 transition-colors",
                i < (data?.upcomingDeadlines.length ?? 0) - 1 && "border-b border-zinc-50"
              )}
            >
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {project.code} · {format(new Date(project.endDate), "dd MMM yyyy", { locale: idLocale })}
                </p>
              </div>
              <DaysBadge days={project.daysRemaining} />
            </motion.li>
          ))}
        </motion.ul>
      )}

      {/* Divider */}
      <div className="border-t-2 border-zinc-100 mx-5 mt-2" />

      {/* SECTION 2: PERIODE INPUT TERBUKA */}
      <div className="px-5 py-4 flex-1">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-3 w-32 bg-zinc-200 rounded animate-shimmer" />
            <div className="h-4 w-48 bg-zinc-100 rounded animate-shimmer" />
            <div className="h-3 w-36 bg-zinc-100 rounded animate-shimmer" />
          </div>
        ) : !data?.openPeriod ? (
          <p className="text-xs text-zinc-400">Tidak ada periode input yang terbuka</p>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Periode Input Aktif</span>
              </div>

              <p className="text-sm font-medium text-foreground">{data.openPeriod.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Deadline:{" "}
                {format(new Date(data.openPeriod.deadlineDate), "dd MMM yyyy", { locale: idLocale })}
                {" · "}
                <UrgencyText days={data.openPeriod.daysUntilDeadline} />
              </p>

              {/* Submission progress */}
              {(() => {
                const total = (data.openPeriod.projectsNotSubmitted || 0) + 2; // estimate
                const submitted = total - data.openPeriod.projectsNotSubmitted;
                return (
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(submitted / total) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {submitted}/{total} proyek sudah input
                    </p>
                  </div>
                );
              })()}

              {/* Warning: proyek belum submit */}
              {data.openPeriod.projectsNotSubmitted > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  className="bg-amber-50 rounded-lg px-3 py-2.5 mt-3"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    <span className="text-xs font-medium text-amber-700">
                      {data.openPeriod.projectsNotSubmitted} proyek belum input:
                    </span>
                  </div>
                  <ul className="space-y-0.5 mt-1">
                    {data.openPeriod.projectsNotSubmittedNames.slice(0, 3).map((name) => (
                      <li key={name} className="text-xs text-amber-600 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                        {name}
                      </li>
                    ))}
                    {data.openPeriod.projectsNotSubmittedNames.length > 3 && (
                      <li className="text-xs text-amber-500">
                        +{data.openPeriod.projectsNotSubmittedNames.length - 3} lagi
                      </li>
                    )}
                  </ul>
                  <button className="w-full mt-2 text-xs font-medium text-amber-700 border border-amber-200 rounded-md py-1.5 hover:bg-amber-100 transition-colors">
                    Ingatkan Tim
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
