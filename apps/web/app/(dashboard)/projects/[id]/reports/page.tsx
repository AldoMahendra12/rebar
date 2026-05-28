"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Printer, FileDown, History, RefreshCw, Trash2, Loader2 } from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface HistoryEntry {
  id: string;
  label: string;
  date: string;
  type: string;
  period: string;
}

const INITIAL_HISTORY: HistoryEntry[] = [
  { id: "h1", label: "Laporan Mingguan W11", date: "17 Mar 2025", type: "weekly", period: "Minggu ke-11 (Maret 2025)" },
  { id: "h2", label: "Laporan Bulanan Feb", date: "28 Feb 2025", type: "monthly", period: "Februari 2025" },
];

export default function ProjectReportsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [reportType, setReportType] = useState("weekly");
  const [period, setPeriod] = useState("Minggu ke-12 (Maret 2025)");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(INITIAL_HISTORY);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Give it a brief moment to show loading state then open
    await new Promise((r) => setTimeout(r, 500));
    setIsGenerating(false);

    // Add to history
    const typeLabels: Record<string, string> = {
      weekly: "Laporan Mingguan",
      monthly: "Laporan Bulanan",
      executive: "Executive Summary",
    };
    const newEntry: HistoryEntry = {
      id: `h-${Date.now()}`,
      label: `${typeLabels[reportType]} — ${period}`,
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      type: reportType,
      period,
    };
    setHistory((prev) => [newEntry, ...prev]);

    // Open print preview
    window.open(
      `/print-preview/${projectId}?type=${reportType}&period=${encodeURIComponent(period)}`,
      "_blank"
    );
  };

  const handleRerun = (entry: HistoryEntry) => {
    window.open(
      `/print-preview/${projectId}?type=${entry.type}&period=${encodeURIComponent(entry.period)}`,
      "_blank"
    );
  };

  const handleDelete = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Generate Laporan Proyek</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pilih tipe laporan dan periode untuk menghasilkan dokumen PDF yang siap dicetak.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Generator Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Parameter Laporan
            </CardTitle>
            <CardDescription>Sesuaikan data yang ingin ditampilkan di laporan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Tipe Laporan</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe laporan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Laporan Mingguan (Weekly Report)</SelectItem>
                  <SelectItem value="monthly">Laporan Bulanan (Monthly Report)</SelectItem>
                  <SelectItem value="executive">Executive Summary (Ringkasan Klien)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Periode Cetak</Label>
              <Input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Contoh: Minggu ke-12 (Maret 2025)"
              />
              <p className="text-xs text-muted-foreground">
                Periode ini akan ditampilkan sebagai judul rentang waktu pada dokumen PDF.
              </p>
            </div>

            <div className="pt-4 border-t border-border flex gap-3">
              <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyiapkan...</>
                ) : (
                  <><Printer className="w-4 h-4 mr-2" />Preview & Cetak PDF</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="bg-secondary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              Riwayat Ekspor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence>
                {history.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Belum ada laporan yang dibuat.
                  </p>
                )}
                {history.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm border-l-2 border-primary pl-3 group"
                  >
                    <p className="font-semibold text-foreground leading-snug">{entry.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{entry.date}</p>
                    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => handleRerun(entry)}
                        title="Buka ulang laporan ini"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Ulangi
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(entry.id)}
                        title="Hapus dari riwayat"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Hapus
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
