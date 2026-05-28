"use client";

import { ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface NotesPopoverProps {
  value: string;
  onChange: (val: string) => void;
  itemName: string;
  isLocked: boolean;
  children: ReactNode;
}

export function NotesPopover({ value, onChange, itemName, isLocked, children }: NotesPopoverProps) {
  // We use local state to manage the textarea content and only call onChange on save
  // Actually, we could just rely on standard controlled component behavior. Let's make it simpler.
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end" sideOffset={8}>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Catatan</p>
            <p className="text-sm font-medium truncate mt-0.5">{itemName}</p>
          </div>
          
          <div className="relative">
            <textarea
              className="w-full h-24 p-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-primary focus:bg-white resize-none transition-colors"
              placeholder={isLocked ? "Tidak ada catatan" : "Tambahkan catatan untuk item ini..."}
              maxLength={300}
              value={value}
              onChange={(e) => !isLocked && onChange(e.target.value)}
              disabled={isLocked}
            />
            {!isLocked && (
              <div className="absolute bottom-2 right-2 text-[10px] text-zinc-400 font-medium">
                {value.length}/300
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
