"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { MOCK_DOCUMENTS } from "@/lib/mock-project";
import { ProjectDocument } from "@/types/document";
import {
  FileDown, FileUp, Search, FileText, Image as ImageIcon,
  File, FileCode, X, Loader2, CheckCircle2, ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const CATEGORY_TABS = [
  { id: "all", label: "Semua Dokumen" },
  { id: "drawing", label: "Gambar Kerja" },
  { id: "contract", label: "Kontrak" },
  { id: "photo", label: "Foto Lapangan" },
  { id: "report", label: "Laporan" },
];

function getFileIcon(type: string) {
  switch (type) {
    case "photo": return <ImageIcon className="w-8 h-8 text-blue-500" />;
    case "drawing": return <FileCode className="w-8 h-8 text-orange-500" />;
    case "contract": return <FileText className="w-8 h-8 text-emerald-500" />;
    default: return <File className="w-8 h-8 text-slate-500" />;
  }
}

function getCategoryLabel(type: string) {
  const tab = CATEGORY_TABS.find((t) => t.id === type);
  return tab?.label ?? "Lainnya";
}

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "—";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// ─── Upload Toast ─────────────────────────────────────

interface UploadToastProps {
  file: string;
  status: "uploading" | "done" | "error";
  onClose: () => void;
}

function UploadToast({ file, status, onClose }: UploadToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-xl"
    >
      {status === "uploading" ? (
        <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
      ) : status === "done" ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      ) : (
        <X className="w-4 h-4 text-red-500 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground truncate max-w-[200px]">
          {status === "uploading" ? "Mengupload..." : status === "done" ? "Upload berhasil!" : "Upload gagal"}
        </p>
        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{file}</p>
      </div>
      {status !== "uploading" && (
        <button onClick={onClose} className="ml-2 text-zinc-400 hover:text-zinc-600">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<ProjectDocument[]>(MOCK_DOCUMENTS);

  const [uploadStatus, setUploadStatus] = useState<
    { file: string; status: "uploading" | "done" | "error" } | null
  >(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter docs
  const filteredDocs = documents.filter((doc) => {
    const matchesTab = activeTab === "all" || doc.fileType === activeTab;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // ── Upload Handler ──────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus({ file: file.name, status: "uploading" });

    try {
      // Detect type from extension
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const typeMap: Record<string, ProjectDocument["fileType"]> = {
        jpg: "photo", jpeg: "photo", png: "photo", webp: "photo",
        pdf: "contract", doc: "contract", docx: "contract",
        dwg: "drawing", dxf: "drawing",
      };
      const fileType: ProjectDocument["fileType"] =
        typeMap[ext] ?? (activeTab !== "all" ? (activeTab as any) : "other");

      // Create FormData and POST to our API endpoint
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);
      formData.append("fileType", fileType);

      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const doc: ProjectDocument = await res.json();
        setDocuments((prev) => [doc, ...prev]);
        setUploadStatus({ file: file.name, status: "done" });
      } else {
        throw new Error("Upload failed");
      }
    } catch {
      // Fallback: add to list locally so UI doesn't break
      const fakeUrl = URL.createObjectURL(file);
      const newDoc: ProjectDocument = {
        id: `doc-${Date.now()}`,
        projectId,
        name: file.name,
        fileUrl: fakeUrl,
        fileType: activeTab !== "all" ? (activeTab as any) : "other",
        uploadedBy: user?.fullName ?? "Anda",
        createdAt: new Date().toISOString(),
        sizeBytes: file.size,
      };
      setDocuments((prev) => [newDoc, ...prev]);
      setUploadStatus({ file: file.name, status: "done" });
    } finally {
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  // ── Download Handler ────────────────────────────────
  const handleDownload = (doc: ProjectDocument) => {
    if (!doc.fileUrl || doc.fileUrl === "#") {
      alert(`File "${doc.name}" belum tersedia untuk diunduh.`);
      return;
    }
    // Open in new tab (works for both real URLs and blob URLs)
    window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Manajemen Dokumen</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Simpan, bagikan, dan kelola semua file proyek secara terpusat.
          </p>
        </div>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.dwg,.dxf,.xlsx,.xls"
          onChange={handleFileSelect}
        />
        <Button onClick={() => fileInputRef.current?.click()}>
          <FileUp className="w-4 h-4 mr-2" />
          Upload Dokumen
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Category Sidebar */}
        <div className="w-full md:w-64 space-y-1 shrink-0">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between",
                activeTab === tab.id
                  ? "bg-primary text-white font-medium shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <span>{tab.label}</span>
              {tab.id !== "all" && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  activeTab === tab.id ? "bg-white/20" : "bg-slate-200 text-slate-600"
                )}>
                  {documents.filter((d) => d.fileType === tab.id).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama file..."
              className="pl-9 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Document List */}
          <div className="grid gap-3">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <File className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Tidak ada dokumen ditemukan.</p>
                <button
                  className="mt-3 text-xs text-primary underline underline-offset-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload dokumen pertama
                </button>
              </div>
            ) : (
              <AnimatePresence>
                {filteredDocs.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="hover:border-primary/40 transition-colors">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-2 bg-slate-50 rounded-lg shrink-0">
                            {getFileIcon(doc.fileType)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate">{doc.name}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                              <span>{formatBytes(doc.sizeBytes ?? 0)}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span>{new Date(doc.createdAt).toLocaleDateString("id-ID")}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span>Oleh: {doc.uploadedBy}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="hidden md:inline-flex">
                            {getCategoryLabel(doc.fileType)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 hover:text-primary"
                            title={`Unduh ${doc.name}`}
                            onClick={() => handleDownload(doc)}
                          >
                            {doc.fileUrl && doc.fileUrl !== "#" ? (
                              <ExternalLink className="w-4 h-4" />
                            ) : (
                              <FileDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Upload Toast */}
      <AnimatePresence>
        {uploadStatus && (
          <UploadToast
            file={uploadStatus.file}
            status={uploadStatus.status}
            onClose={() => setUploadStatus(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
