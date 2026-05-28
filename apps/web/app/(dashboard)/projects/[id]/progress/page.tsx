"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProgressPeriods, useProgressData } from "@/hooks/use-progress";
import { Loader2, ListTree, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProgressHeader } from "@/components/sections/progress/ProgressHeader";
import { PeriodSelector } from "@/components/sections/progress/PeriodSelector";
import { ProgressTable } from "@/components/sections/progress/ProgressTable";
import { ProgressSummaryBar } from "@/components/sections/progress/ProgressSummaryBar";

export interface ProgressItemLocal {
  wbsItemId: string;
  actualPercentage: number | null;
  notes: string | null;
  isDirty: boolean;
}

export default function ProgressInputPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryPeriod = searchParams.get("period");
  
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(queryPeriod);
  const [localData, setLocalData] = useState<Map<string, ProgressItemLocal>>(new Map());
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { data: periodsRaw, isLoading: loadingPeriods } = useProgressPeriods(params.id);
  // Guard: API might return error object instead of array in edge cases
  const periods = Array.isArray(periodsRaw) ? periodsRaw : [];
  
  // Auto-select current or latest period if none selected
  useEffect(() => {
    if (!selectedPeriod && periods && periods.length > 0) {
      const current = periods.find(p => p.isCurrent);
      if (current) {
        setSelectedPeriod(current.periodDate);
        router.replace(`/projects/${params.id}/progress?period=${current.periodDate}`);
      } else {
        setSelectedPeriod(periods[periods.length - 1].periodDate);
        router.replace(`/projects/${params.id}/progress?period=${periods[periods.length - 1].periodDate}`);
      }
    }
  }, [selectedPeriod, periods, params.id, router]);

  const { data: progressData, isLoading: loadingData } = useProgressData(params.id, selectedPeriod);

  // Sync server data to local state
  useEffect(() => {
    if (progressData?.items) {
      const newLocalData = new Map<string, ProgressItemLocal>();
      progressData.items.forEach(item => {
        if (item.isLeaf) {
          newLocalData.set(item.wbsItemId, {
            wbsItemId: item.wbsItemId,
            actualPercentage: item.actualThisPeriod,
            notes: item.notes,
            isDirty: false,
          });
        }
      });
      setLocalData(newLocalData);
      setIsDirty(false);
    }
  }, [progressData]);

  if (loadingPeriods || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Memuat data progress...</p>
      </div>
    );
  }

  // Empty state: No WBS
  if (progressData?.items.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
          <ListTree className="w-8 h-8 text-zinc-400" />
        </div>
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">WBS Belum Disetup</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Setup struktur WBS (Rincian Anggaran Biaya) terlebih dahulu sebelum dapat mengisi progress pekerjaan lapangan.
        </p>
        <Link href={`/projects/${params.id}/wbs`}>
          <Button size="lg">Buka WBS Builder</Button>
        </Link>
      </div>
    );
  }

  // Determine if all plans are 0 (Empty Planning)
  const hasPlanning = (progressData?.summary?.totalLeafItems ?? 0) > 0 && (progressData?.items?.some(i => i.plannedCumulative > 0) ?? false);
  if (!hasPlanning && progressData?.items && progressData.items.length > 0 && selectedPeriod) {
    // Check if the project really has no planning at all, this is a bit naive but serves the purpose
    const hasAnyPlan = progressData.items.some(i => i.plannedCumulative > 0);
    if (!hasAnyPlan) {
      return (
        <div className="flex flex-col h-full items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
            <CalendarRange className="w-8 h-8 text-zinc-400" />
          </div>
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">Rencana Progress Belum Dibuat</h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            Buat rencana distribusi S-Curve (Progress Planning) terlebih dahulu sebelum mengisi aktual progres lapangan.
          </p>
          <Link href={`/projects/${params.id}/s-curve`}>
            <Button size="lg">Buka Distribusi S-Curve</Button>
          </Link>
        </div>
      );
    }
  }

  const handlePeriodChange = (date: string) => {
    setSelectedPeriod(date);
    router.push(`/projects/${params.id}/progress?period=${date}`);
  };

  const handleLocalDataChange = (itemId: string, updates: Partial<ProgressItemLocal>) => {
    setLocalData(prev => {
      const next = new Map(prev);
      const existing = next.get(itemId);
      if (existing) {
        next.set(itemId, { ...existing, ...updates, isDirty: true });
      }
      return next;
    });
    setIsDirty(true);
  };

  const activePeriodObj = periods?.find(p => p.periodDate === selectedPeriod);
  const isPeriodLocked = progressData?.period?.isLocked || false;

  return (
    <div className="flex flex-col h-full relative min-h-[calc(100vh-64px)]">
      <ProgressHeader 
        projectId={params.id}
        periodLabel={activePeriodObj?.periodLabel || "Memuat..."}
        isLocked={isPeriodLocked}
        isDirty={isDirty}
        lastSaved={lastSaved}
        periodDate={selectedPeriod || undefined}
      />
      
      {periods && periods.length > 0 && (
        <PeriodSelector 
          periods={periods}
          selectedPeriod={selectedPeriod}
          onSelect={handlePeriodChange}
        />
      )}

      {progressData && (
        <ProgressTable 
          projectId={params.id}
          periodDate={selectedPeriod!}
          data={progressData}
          localData={localData}
          isLocked={isPeriodLocked}
          onChange={handleLocalDataChange}
        />
      )}

      {progressData && (
        <ProgressSummaryBar 
          projectId={params.id}
          periodDate={selectedPeriod!}
          summary={progressData.summary}
          localData={localData}
          isLocked={isPeriodLocked}
          isDirty={isDirty}
          onSaved={() => {
            setIsDirty(false);
            setLastSaved(new Date());
            setLocalData(prev => {
              const next = new Map(prev);
              Array.from(next.keys()).forEach(k => {
                const v = next.get(k)!;
                next.set(k, { ...v, isDirty: false });
              });
              return next;
            });
          }}
        />
      )}
    </div>
  );
}
