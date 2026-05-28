"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Save, Loader2, CheckCircle2, AlertTriangle,
  Trash2, Archive, Building, Calendar, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { MOCK_PROJECT } from "@/lib/mock-project";

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    clientName: "",
    location: "",
    startDate: "",
    endDate: "",
    status: "active",
    periodType: "weekly",
    description: "",
  });

  // Load project data
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setForm({
            name: data.name ?? "",
            clientName: data.clientName ?? "",
            location: data.location ?? "",
            startDate: data.startDate?.slice(0, 10) ?? "",
            endDate: data.endDate?.slice(0, 10) ?? "",
            status: data.status ?? "active",
            periodType: data.periodType ?? "weekly",
            description: data.description ?? "",
          });
          return;
        }
      } catch {}
      // Fallback to mock
      setForm({
        name: MOCK_PROJECT.name,
        clientName: MOCK_PROJECT.clientName,
        location: MOCK_PROJECT.location,
        startDate: MOCK_PROJECT.startDate?.slice(0, 10) ?? "",
        endDate: MOCK_PROJECT.endDate?.slice(0, 10) ?? "",
        status: MOCK_PROJECT.status,
        periodType: MOCK_PROJECT.periodType,
        description: MOCK_PROJECT.description ?? "",
      });
    };
    load();
  }, [id]);

  const handleChange = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setSaved(false);
      setError(null);
    };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal menyimpan");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Pengaturan Proyek</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ubah informasi dasar proyek ini.
        </p>
      </div>

      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="w-4 h-4 text-primary" />
            Informasi Proyek
          </CardTitle>
          <CardDescription>
            Data ini akan tampil di laporan, S-Curve, dan dokumen resmi.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Nama */}
          <div className="space-y-2">
            <Label htmlFor="proj-name">
              Nama Proyek <span className="text-red-500">*</span>
            </Label>
            <Input
              id="proj-name"
              value={form.name}
              onChange={handleChange("name")}
              placeholder="Nama lengkap proyek"
            />
          </div>

          {/* Klien + Lokasi */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proj-client">Nama Klien</Label>
              <Input
                id="proj-client"
                value={form.clientName}
                onChange={handleChange("clientName")}
                placeholder="PT. Nama Klien"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-location">Lokasi</Label>
              <Input
                id="proj-location"
                value={form.location}
                onChange={handleChange("location")}
                placeholder="Kota, Provinsi"
              />
            </div>
          </div>

          {/* Tanggal */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proj-start" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Tanggal Mulai
              </Label>
              <Input
                id="proj-start"
                type="date"
                value={form.startDate}
                onChange={handleChange("startDate")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-end" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Tanggal Selesai
              </Label>
              <Input
                id="proj-end"
                type="date"
                value={form.endDate}
                onChange={handleChange("endDate")}
              />
            </div>
          </div>

          {/* Status + Periode */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Status Proyek</Label>
              <Select
                value={form.status}
                onValueChange={(v: string) => { setForm((p) => ({ ...p, status: v })); setSaved(false); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Perencanaan</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="on_hold">Ditunda</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                Tipe Periode Progress
              </Label>
              <Select
                value={form.periodType}
                onValueChange={(v: string) => { setForm((p) => ({ ...p, periodType: v })); setSaved(false); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-2">
            <Label htmlFor="proj-desc">Deskripsi Singkat</Label>
            <Input
              id="proj-desc"
              value={form.description}
              onChange={handleChange("description")}
              placeholder="Deskripsi singkat proyek (opsional)"
            />
          </div>
        </CardContent>

        <CardFooter className="border-t border-border pt-5 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="err"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-red-600"
              >
                <AlertTriangle className="w-4 h-4" />
                {error}
              </motion.div>
            ) : saved ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-emerald-600 font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                Perubahan berhasil disimpan!
              </motion.div>
            ) : (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground"
              >
                Perubahan akan langsung tercermin di semua laporan.
              </motion.p>
            )}
          </AnimatePresence>

          <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Simpan Perubahan</>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-600">
            <AlertTriangle className="w-4 h-4" />
            Zona Berbahaya
          </CardTitle>
          <CardDescription>
            Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50 flex items-center gap-2"
            onClick={() => alert("Fitur arsip akan segera tersedia.")}
          >
            <Archive className="w-4 h-4" />
            Arsipkan Proyek
          </Button>
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-2"
            onClick={() => {
              if (confirm("Yakin ingin menghapus proyek ini? Tindakan tidak dapat dibatalkan.")) {
                alert("Fitur hapus memerlukan konfirmasi tambahan — akan segera diimplementasi.");
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
            Hapus Proyek
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
