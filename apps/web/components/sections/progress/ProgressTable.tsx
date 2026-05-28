"use client";

import { useState } from "react";
import { ProgressDataResponse, ProgressItem } from "@/hooks/use-progress";
import { ProgressItemLocal } from "@/app/(dashboard)/projects/[id]/progress/page";
import { cn } from "@/lib/utils";
import { Camera, MessageSquare, MessageSquareDot } from "lucide-react";
import { NotesPopover } from "./NotesPopover";
import { PhotoUploadModal } from "./PhotoUploadModal";

interface ProgressTableProps {
  projectId: string;
  periodDate: string;
  data: ProgressDataResponse;
  localData: Map<string, ProgressItemLocal>;
  isLocked: boolean;
  onChange: (itemId: string, updates: Partial<ProgressItemLocal>) => void;
}

export function ProgressTable({
  projectId,
  periodDate,
  data,
  localData,
  isLocked,
  onChange,
}: ProgressTableProps) {
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  const renderStatus = (item: ProgressItem, localActual: number | null) => {
    if (localActual === null) {
      return <div className="inline-flex px-2 py-0.5 bg-zinc-100 text-zinc-400 rounded text-[10px] uppercase font-bold">—</div>;
    }
    
    // Auto-calculate cumulative based on previous cumulative + this period's actual
    const prevCumulative = (item.actualCumulative ?? 0) - (item.actualThisPeriod ?? 0);
    const newCumulative = prevCumulative + localActual;
    
    if (newCumulative >= 100) {
      return <div className="inline-flex px-2 py-0.5 bg-emerald-500/15 text-emerald-700 rounded text-[10px] uppercase font-bold">100%</div>;
    }
    if (newCumulative >= item.plannedCumulative) {
      return <div className="inline-flex px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded text-[10px] uppercase font-bold">On Track</div>;
    }
    return <div className="inline-flex px-2 py-0.5 bg-red-500/10 text-red-600 rounded text-[10px] uppercase font-bold">Behind</div>;
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 pb-32">
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide w-[70px]">Kode</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide min-w-[180px]">Nama Pekerjaan</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-500 uppercase tracking-wide w-[110px] bg-zinc-100">Rencana (%)</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-500 uppercase tracking-wide w-[110px] bg-zinc-100">Kum. Rencana</th>
                <th className="px-4 py-3 text-right font-semibold text-primary uppercase tracking-wide w-[130px] bg-primary/5">Input Aktual</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-500 uppercase tracking-wide w-[110px] bg-zinc-100">Kum. Aktual</th>
                <th className="px-4 py-3 text-center font-semibold text-zinc-500 uppercase tracking-wide w-[90px]">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-zinc-500 uppercase tracking-wide w-[60px]">Foto</th>
                <th className="px-4 py-3 text-center font-semibold text-zinc-500 uppercase tracking-wide w-[60px]">Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => {
                const isLevel1 = item.level === 1 && !item.isLeaf;
                const isLevel2 = item.level > 1 && !item.isLeaf;
                
                if (isLevel1 || isLevel2) {
                  return (
                    <tr key={item.wbsItemId} className={cn("border-b border-zinc-100", isLevel1 ? "bg-zinc-50/80" : "bg-white")}>
                      <td className="px-4 py-3 font-mono font-bold text-zinc-600">{item.code}</td>
                      <td className="px-4 py-3 font-medium text-foreground" style={{ paddingLeft: isLevel2 ? '20px' : '16px' }}>
                        {isLevel2 && <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full inline-block mr-2" />}
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400">—</td>
                      <td className="px-4 py-3 text-right text-zinc-400">—</td>
                      <td className="px-4 py-3 text-right text-zinc-400 bg-zinc-50">—</td>
                      <td className="px-4 py-3 text-right text-zinc-400">—</td>
                      <td className="px-4 py-3 text-center text-zinc-400">—</td>
                      <td className="px-4 py-3 text-center"></td>
                      <td className="px-4 py-3 text-center"></td>
                    </tr>
                  );
                }

                const localItem = localData.get(item.wbsItemId);
                const actualVal = localItem?.actualPercentage ?? null;
                const notesVal = localItem?.notes ?? null;
                
                const prevCumulative = (item.actualCumulative ?? 0) - (item.actualThisPeriod ?? 0);
                const currentCumulative = actualVal !== null ? prevCumulative + actualVal : null;
                const maxAllowed = Math.max(0, 100 - prevCumulative);

                return (
                  <tr key={item.wbsItemId} className="border-b border-zinc-100 bg-white hover:bg-zinc-50/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-zinc-500">{item.code}</td>
                    <td className="px-4 py-3 text-foreground" style={{ paddingLeft: '40px' }}>{item.name}</td>
                    
                    <td className="px-4 py-3 text-right bg-zinc-50 font-mono text-zinc-500">
                      {item.plannedThisPeriod > 0 ? `${item.plannedThisPeriod.toFixed(2)}%` : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right bg-zinc-50 font-mono text-zinc-500">
                      {item.plannedCumulative > 0 ? `${item.plannedCumulative.toFixed(2)}%` : <span className="text-zinc-300">—</span>}
                    </td>
                    
                    <td className="px-2 py-1.5 text-right">
                      {isLocked ? (
                        <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 font-mono text-zinc-400">
                          {actualVal !== null ? `${actualVal}%` : "—"}
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={100}
                            step="0.01"
                            value={actualVal ?? ""}
                            onChange={(e) => {
                              let val = e.target.value === "" ? null : Number(e.target.value);
                              if (val !== null && val < 0) val = 0;
                              onChange(item.wbsItemId, { actualPercentage: val });
                            }}
                            className={cn(
                              "w-full text-right font-mono px-3 py-1.5 rounded-lg outline-none transition-all",
                              actualVal === null 
                                ? "bg-zinc-50 border border-zinc-200 text-zinc-400 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                                : currentCumulative !== null && currentCumulative > 100
                                  ? "bg-red-50 border border-red-300 text-red-600 focus:ring-2 focus:ring-red-500/20"
                                  : "bg-primary/5 border border-primary/20 text-primary focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                            )}
                            placeholder="—"
                          />
                          {actualVal !== null && currentCumulative !== null && currentCumulative > 100 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 text-[9px] text-red-600 font-sans z-10 text-center leading-tight">
                              Maks: {maxAllowed.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 text-right bg-zinc-50 font-mono font-medium">
                      {currentCumulative !== null ? (
                        <span className={cn(
                          currentCumulative >= 100 ? "text-emerald-600" :
                          currentCumulative >= item.plannedCumulative ? "text-blue-600" : "text-red-500"
                        )}>
                          {currentCumulative.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 text-center">
                      {renderStatus(item, actualVal)}
                    </td>
                    
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => !isLocked && setActivePhotoModal(item.wbsItemId)}
                        disabled={isLocked && item.photos.length === 0}
                        className="inline-flex items-center justify-center p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
                      >
                        {item.photos.length > 0 ? (
                          <div className="relative w-7 h-7 rounded overflow-hidden">
                            <img src={item.photos[0].fileUrl} alt="progress" className="w-full h-full object-cover" />
                            {item.photos.length > 1 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-bold">
                                +{item.photos.length - 1}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Camera className="w-4 h-4 text-zinc-300" />
                        )}
                      </button>
                    </td>
                    
                    <td className="px-4 py-3 text-center relative">
                      <NotesPopover 
                        value={notesVal || ""} 
                        onChange={(notes) => onChange(item.wbsItemId, { notes })}
                        itemName={item.name}
                        isLocked={isLocked}
                      >
                        <button className="inline-flex items-center justify-center p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
                          {notesVal ? (
                            <MessageSquareDot className="w-4 h-4 text-primary" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-zinc-300" />
                          )}
                        </button>
                      </NotesPopover>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            
            <tfoot>
              <tr className="bg-zinc-50 border-t-2 border-zinc-200 font-semibold">
                <td colSpan={2} className="px-4 py-3.5 text-xs uppercase tracking-wide text-zinc-500">
                  BOBOT TERTIMBANG PERIODE INI
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-zinc-600">
                  {data.summary.weightedPlannedThisPeriod.toFixed(2)}%
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-zinc-600">
                  {data.summary.weightedPlannedCumulative.toFixed(2)}%
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-primary">
                  {/* Realistically we should compute local weighted actual here. We'll use the server one for now or compute it simply */}
                  {data.summary.weightedActualThisPeriod.toFixed(2)}%
                </td>
                <td className="px-4 py-3.5 text-right font-mono">
                  <span className={cn(
                    data.summary.weightedActualCumulative >= 100 ? "text-emerald-600" :
                    data.summary.weightedActualCumulative >= data.summary.weightedPlannedCumulative ? "text-blue-600" : "text-red-500"
                  )}>
                    {data.summary.weightedActualCumulative.toFixed(2)}%
                  </span>
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {activePhotoModal && (
        <PhotoUploadModal 
          isOpen={!!activePhotoModal}
          onClose={() => setActivePhotoModal(null)}
          projectId={projectId}
          periodDate={periodDate}
          wbsItemId={activePhotoModal}
          itemName={data.items.find(i => i.wbsItemId === activePhotoModal)?.name || ""}
          existingPhotos={data.items.find(i => i.wbsItemId === activePhotoModal)?.photos || []}
        />
      )}
    </div>
  );
}
