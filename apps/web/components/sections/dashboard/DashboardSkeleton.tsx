import { cn } from "@/lib/utils";

// Minimal skeleton matching Fintrixity redesign
function ProjectCardSkeleton() {
  return (
    <div
      className="relative bg-white border border-zinc-100 rounded-2xl overflow-hidden p-6 flex flex-col justify-between"
      style={{ aspectRatio: "1.586 / 1", width: "100%" }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-zinc-200 animate-shimmer" />

      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 bg-zinc-200 rounded animate-shimmer" />
          <div className="h-3 w-16 bg-zinc-100 rounded animate-shimmer" />
        </div>
        <div className="h-6 w-20 bg-zinc-100 rounded-full animate-shimmer shrink-0" />
      </div>

      {/* Middle */}
      <div className="space-y-2">
        <div className="flex items-end gap-3">
          <div className="h-10 w-24 bg-zinc-200 rounded animate-shimmer" />
          <div className="h-6 w-16 bg-zinc-100 rounded-full animate-shimmer mb-0.5" />
        </div>
        <div className="h-3 w-24 bg-zinc-100 rounded animate-shimmer" />
      </div>

      {/* Bottom */}
      <div className="border-t border-zinc-100 pt-3 flex items-center justify-between">
        <div className="h-3 w-40 bg-zinc-100 rounded animate-shimmer" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Bar Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 overflow-hidden relative"
          >
            <div className="w-9 h-9 rounded-lg bg-secondary animate-pulse mb-3" />
            <div className="h-7 w-24 bg-secondary animate-pulse rounded-md mb-2" />
            <div className="h-4 w-20 bg-secondary animate-pulse rounded-md mb-1" />
            <div className="h-3 w-16 bg-secondary/60 animate-pulse rounded-md" />
            {/* Shimmer overlay */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex gap-3">
        <div className="h-9 w-56 bg-card border border-border rounded-lg animate-pulse" />
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-20 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Project Grid Skeleton (Fintrixity Redesign) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
