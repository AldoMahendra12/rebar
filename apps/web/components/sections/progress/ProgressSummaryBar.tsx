"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressSummary, useSaveProgress } from "@/hooks/use-progress";
import { ProgressItemLocal } from "@/app/(dashboard)/projects/[id]/progress/page";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProgressSummaryBarProps {
  projectId: string;
  periodDate: string;
  summary: ProgressSummary;
  localData: Map<string, ProgressItemLocal>;
  isLocked: boolean;
  isDirty: boolean;
  onSaved: () => void;
}

export function ProgressSummaryBar({
  projectId,
  periodDate,
  summary,
  localData,
  isLocked,
  isDirty,
  onSaved,
}: ProgressSummaryBarProps) {
  const { mutate: saveProgress, isPending } = useSaveProgress(projectId, periodDate);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isSubmitPending, setIsSubmitPending] = useState(false);

  const handleSaveDraft = () => {
    if (!isDirty) return;
    
    // Only send dirty items for draft
    const itemsToSave = Array.from(localData.values()).filter(i => i.isDirty);
    
    saveProgress({ items: itemsToSave, action: "draft" }, {
      onSuccess: () => {
        onSaved();
      }
    });
  };

  // Auto-save every 30 seconds if dirty
  useEffect(() => {
    if (!isDirty || isLocked) return;
    
    const timer = setTimeout(() => {
      handleSaveDraft();
    }, 30000);
    
    return () => clearTimeout(timer);
  }, [isDirty, localData, isLocked]);

  // Ctrl+S / Cmd+S shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && !isLocked) {
          handleSaveDraft();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, isLocked, localData]);

  const handleSubmit = () => {
    setIsSubmitPending(true);
    
    // For submit, we send everything to lock it
    const allItems = Array.from(localData.values());
    
    saveProgress({ items: allItems, action: "submit" }, {
      onSuccess: () => {
        onSaved();
        setIsSubmitDialogOpen(false);
        setIsSubmitPending(false);
      },
      onError: () => {
        setIsSubmitPending(false);
      }
    });
  };

  const hasAnyFilledItem = Array.from(localData.values()).some(i => i.actualPercentage !== null);

  return (
    <div className="fixed bottom-0 left-[260px] right-0 z-30 bg-white border-t border-zinc-200 px-6 py-4 flex items-center justify-between gap-6 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transform transition-transform duration-300">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-0.5">Rencana</p>
          <p className="text-sm font-mono text-zinc-600">{summary.weightedPlannedThisPeriod.toFixed(2)}%</p>
        </div>
        
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-0.5">Aktual</p>
          <p className="text-sm font-mono font-semibold text-foreground">
            {/* Realistically compute from localData, but using server summary for simplicity here */}
            {summary.weightedActualThisPeriod.toFixed(2)}%
          </p>
        </div>

        <div className="w-px h-8 bg-zinc-200" />

        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-0.5">Kum. Rencana</p>
          <p className="text-sm font-mono text-zinc-600">{summary.weightedPlannedCumulative.toFixed(2)}%</p>
        </div>
        
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-0.5">Kum. Aktual</p>
          <p className={`text-sm font-mono font-semibold ${
            summary.weightedActualCumulative >= 100 ? "text-emerald-600" :
            summary.weightedActualCumulative >= summary.weightedPlannedCumulative ? "text-blue-600" : "text-red-500"
          }`}>
            {summary.weightedActualCumulative.toFixed(2)}%
          </p>
        </div>

        <div className="w-px h-8 bg-zinc-200" />

        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-0.5">Deviasi</p>
          <p className={`text-sm font-semibold ${
            summary.deviation > 0 ? "text-emerald-600" :
            summary.deviation < 0 ? "text-red-500" : "text-zinc-600"
          }`}>
            {summary.deviation > 0 ? "+" : ""}{summary.deviation.toFixed(2)}%
          </p>
        </div>

        <div className="ml-4">
          <p className="text-[10px] text-zinc-400 font-medium mb-1.5">{summary.completedItems}/{summary.totalLeafItems} item diisi</p>
          <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${summary.totalLeafItems > 0 ? (summary.completedItems / summary.totalLeafItems) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isLocked ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium px-4 py-2 bg-zinc-50 rounded-lg">
            <Lock className="w-4 h-4" />
            Periode terkunci — hanya baca
          </div>
        ) : (
          <>
            <Button 
              variant="ghost" 
              onClick={handleSaveDraft} 
              disabled={!isDirty || isPending}
              className="gap-2"
            >
              {isPending && !isSubmitPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              ) : (
                <Save className="w-4 h-4 text-zinc-500" />
              )}
              {isPending && !isSubmitPending ? "Menyimpan..." : "Simpan Draft"}
            </Button>

            <Button 
              onClick={() => setIsSubmitDialogOpen(true)}
              disabled={!hasAnyFilledItem || isPending}
              className="gap-2 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Submit & Kunci
            </Button>
          </>
        )}
      </div>

      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Progress Periode Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Setelah disubmit, data akan dikunci dan tidak bisa diubah kecuali PM/Admin membuka kunci. Pastikan semua input sudah sesuai dengan kondisi lapangan.
              
              <div className="mt-4 p-3 bg-zinc-50 border border-zinc-100 rounded-lg space-y-1.5 text-sm text-zinc-700">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Item diisi:</span>
                  <span className="font-medium">{summary.completedItems} dari {summary.totalLeafItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Bobot tertimbang:</span>
                  <span className="font-medium font-mono">{summary.weightedActualThisPeriod.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Kumulatif aktual:</span>
                  <span className="font-medium font-mono">{summary.weightedActualCumulative.toFixed(2)}%</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitPending}>Batal</AlertDialogCancel>
            <Button onClick={handleSubmit} disabled={isSubmitPending} variant="default" className="bg-foreground text-background hover:bg-foreground/90">
              {isSubmitPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyubmit...
                </>
              ) : (
                "Ya, Submit & Kunci"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
