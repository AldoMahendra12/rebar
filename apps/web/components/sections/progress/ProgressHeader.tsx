"use client";

import { Lock, Unlock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLockProgress } from "@/hooks/use-progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@clerk/nextjs";

interface ProgressHeaderProps {
  projectId: string;
  periodLabel: string;
  isLocked: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
}

export function ProgressHeader({
  projectId,
  periodLabel,
  isLocked,
  isDirty,
  lastSaved,
  periodDate,
}: ProgressHeaderProps & { periodDate?: string }) {
  const { mutate: toggleLock, isPending } = useLockProgress(projectId, periodDate || null);

  const handleUnlock = () => {
    if (periodDate) toggleLock(false);
  };

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-100">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Input Progress</h1>
        <p className="text-sm text-muted-foreground">{periodLabel}</p>
      </div>
      
      <div className="flex items-center gap-3">
        {isLocked ? (
          <>
            <div className="flex items-center gap-1.5 bg-zinc-100 text-zinc-500 rounded-full px-3 py-1 text-sm font-medium">
              <Lock className="w-3.5 h-3.5" />
              Periode Terkunci
            </div>
            {/* Realistically we should check if user is PM/Admin/Owner before showing unlock button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                  <Unlock className="w-3.5 h-3.5" />
                  Buka Kunci
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Buka Kunci Periode?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Yakin ingin membuka kunci periode ini? Data aktual akan dapat diubah kembali.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUnlock}>Buka Kunci</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <div className="flex items-center gap-3">
            {/* Status indicator for auto-save */}
            {isDirty && <span className="text-xs text-amber-500 font-medium">Perubahan belum disimpan</span>}
            {!isDirty && lastSaved && (
              <span className="text-xs text-zinc-400">
                Tersimpan {lastSaved.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {/* The save/submit buttons are in the summary bar according to Step 4, but if we need them here: */}
          </div>
        )}
      </div>
    </div>
  );
}
