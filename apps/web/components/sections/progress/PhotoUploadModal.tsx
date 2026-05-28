"use client";

import { useState, useRef } from "react";
import { ProgressPhoto } from "@/hooks/use-progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  periodDate: string;
  wbsItemId: string;
  itemName: string;
  existingPhotos: ProgressPhoto[];
}

export function PhotoUploadModal({
  isOpen,
  onClose,
  projectId,
  periodDate,
  wbsItemId,
  itemName,
  existingPhotos,
}: PhotoUploadModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photos, setPhotos] = useState<ProgressPhoto[]>(existingPhotos);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("wbsItemId", wbsItemId);
        formData.append("file", file);

        const res = await fetch(`/api/projects/${projectId}/progress/${periodDate}/photos`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success && result.photo) {
            setPhotos((prev) => [...prev, result.photo]);
          }
        }
      }
      
      // Invalidate to refresh the table UI
      queryClient.invalidateQueries({ queryKey: ["progress-data", projectId, periodDate] });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Foto Lapangan</DialogTitle>
          <DialogDescription className="truncate">{itemName}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {photos.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-3">Foto Tersimpan</p>
              <div className="grid grid-cols-3 gap-3">
                {photos.map((p) => (
                  <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden group bg-zinc-100">
                    <img src={p.fileUrl} alt={p.fileName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold mb-3">Upload Foto Baru</p>
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                "w-full flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-colors",
                isUploading 
                  ? "border-zinc-200 bg-zinc-50 cursor-not-allowed" 
                  : "border-zinc-300 hover:border-primary hover:bg-primary/5 cursor-pointer"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                  <p className="text-sm font-medium text-zinc-600">Mengunggah...</p>
                </>
              ) : (
                <>
                  <ImagePlus className="w-10 h-10 text-zinc-300 mb-3" />
                  <p className="text-sm font-medium text-foreground">Drag & drop foto atau klik untuk pilih</p>
                  <p className="text-xs text-zinc-500 mt-1">JPG, PNG, WEBP — Maks. 10MB per foto</p>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
          <span className="text-sm text-zinc-500">{photos.length} foto</span>
          <Button onClick={onClose} disabled={isUploading}>
            Selesai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
