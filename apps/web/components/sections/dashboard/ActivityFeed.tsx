"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Activity, RotateCw, TrendingUp, FileUp, FileText, Receipt, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigationStore } from "@/stores/navigation-store";

interface ActivityItem {
  id: string;
  type: "progress_input" | "document_upload" | "report_generated" | "cost_recorded";
  projectName: string;
  projectCode: string;
  projectId: string;
  description: string;
  userName: string;
  userAvatar: string | null;
  createdAt: string;
}

const fetchActivity = async (): Promise<ActivityItem[]> => {
  const res = await fetch("/api/dashboard/activity");
  if (!res.ok) throw new Error("Failed");
  return res.json();
};

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Baru saja";
  if (hours < 1) return `${mins} menit lalu`;
  if (days < 1) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;

  const d = new Date(isoDate);
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

const activityTypeConfig = {
  progress_input: { bg: "bg-blue-500", Icon: TrendingUp },
  document_upload: { bg: "bg-purple-500", Icon: FileUp },
  report_generated: { bg: "bg-emerald-500", Icon: FileText },
  cost_recorded: { bg: "bg-amber-500", Icon: Receipt },
};

function ActivityAvatar({ name, avatar, type }: { name: string; avatar: string | null; type: ActivityItem["type"] }) {
  const { bg, Icon } = activityTypeConfig[type];
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="relative shrink-0">
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${bg} border-2 border-white flex items-center justify-center`}>
        <Icon className="w-2 h-2 text-white" />
      </div>
    </div>
  );
}

function SkeletonItem() {
  return (
    <div className="flex gap-3 px-5 py-3 items-center">
      <div className="w-7 h-7 rounded-full bg-zinc-200 animate-shimmer shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-28 bg-zinc-200 rounded animate-shimmer" />
        <div className="h-2.5 w-40 bg-zinc-100 rounded animate-shimmer" />
      </div>
    </div>
  );
}

export function ActivityFeed() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setActiveProject } = useNavigationStore();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: fetchActivity,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
  };

  const handleClick = (item: ActivityItem) => {
    setActiveProject({ id: item.projectId, name: item.projectName, code: item.projectCode });
    router.push(`/projects/${item.projectId}`);
  };

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-foreground">Aktivitas Terbaru</span>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-md hover:bg-zinc-100 transition-colors"
          title="Refresh"
        >
          <motion.div animate={{ rotate: isFetching ? 360 : 0 }} transition={{ duration: 0.8, repeat: isFetching ? Infinity : 0 }}>
            <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
          </motion.div>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <>
          {[1, 2, 3, 4, 5].map((i) => <SkeletonItem key={i} />)}
        </>
      ) : !data || data.length === 0 ? (
        <div className="px-5 py-10 flex flex-col items-center text-center">
          <Inbox className="w-8 h-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-500 mt-3">Belum ada aktivitas</p>
          <p className="text-xs text-zinc-400 mt-1">Aktivitas tim akan muncul di sini</p>
        </div>
      ) : (
        <motion.ul
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          <AnimatePresence>
            {data.map((item, i) => (
              <motion.li
                key={item.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
                }}
                onClick={() => handleClick(item)}
                className={cn(
                  "flex gap-3 px-5 py-3 cursor-pointer hover:bg-zinc-50/60 transition-colors",
                  i < data.length - 1 && "border-b border-zinc-50"
                )}
              >
                <ActivityAvatar name={item.userName} avatar={item.userAvatar} type={item.type} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{item.userName}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{relativeTime(item.createdAt)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description} · {item.projectName}</p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
