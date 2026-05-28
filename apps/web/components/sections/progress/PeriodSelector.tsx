"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { ProgressPeriod } from "@/hooks/use-progress";
import { cn } from "@/lib/utils";

interface PeriodSelectorProps {
  periods: ProgressPeriod[];
  selectedPeriod: string | null;
  onSelect: (dateStr: string) => void;
}

export function PeriodSelector({ periods, selectedPeriod, onSelect }: PeriodSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-[68px] z-10 flex items-center bg-white/95 backdrop-blur px-2 py-3 border-b border-zinc-100">
      <button 
        onClick={scrollLeft}
        className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors shrink-0 mx-2"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div 
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto scrollbar-none flex-1 px-2 mask-edges"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {periods.map((p) => {
          const isSelected = p.periodDate === selectedPeriod;
          
          return (
            <button
              key={p.periodDate}
              onClick={() => onSelect(p.periodDate)}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm whitespace-nowrap transition-all duration-200 shrink-0 font-medium",
                isSelected 
                  ? "bg-foreground text-background shadow-sm" 
                  : p.isCurrent
                    ? "border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
              )}
            >
              {p.periodLabel}
              
              {/* Status dot */}
              {p.status !== "empty" && (
                <div className={cn(
                  "absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center",
                  p.status === "draft" && "bg-amber-400",
                  p.status === "submitted" && "bg-blue-500",
                  p.status === "locked" && "bg-zinc-500"
                )}>
                  {p.status === "locked" && <Lock className="w-2 h-2 text-white" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button 
        onClick={scrollRight}
        className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors shrink-0 mx-2"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
