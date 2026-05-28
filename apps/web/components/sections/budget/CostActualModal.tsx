"use client";

import { useState } from "react";
import { CostActual, BudgetItem } from "@/types/budget";
import { formatRupiah } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CostActualModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  budgetItems: BudgetItem[];
  onActualAdded: (actual: CostActual) => void;
}

export function CostActualModal({
  isOpen,
  onClose,
  projectId,
  budgetItems,
  onActualAdded,
}: CostActualModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    budgetItemId: "",
    amount: "",
    description: "",
    transactionDate: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.budgetItemId || !formData.amount || !formData.description) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetItemId: formData.budgetItemId,
          amount: Number(formData.amount),
          description: formData.description,
          transactionDate: new Date(formData.transactionDate).toISOString(),
        }),
      });

      if (response.ok) {
        const newActual = await response.json();
        onActualAdded(newActual);
        onClose();
        // Reset form
        setFormData({
          budgetItemId: "",
          amount: "",
          description: "",
          transactionDate: new Date().toISOString().split("T")[0],
        });
      }
    } catch (error) {
      console.error("Failed to submit actual cost:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      material: "Material",
      labor: "Tenaga Kerja",
      equipment: "Alat",
      subcon: "Subkontraktor",
      overhead: "Overhead",
    };
    return labels[cat] || cat;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Catat Pengeluaran Baru</DialogTitle>
          <DialogDescription>
            Masukkan detail pengeluaran lapangan. Pastikan kategori sesuai dengan anggaran.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Kategori Anggaran</Label>
            <Select
              value={formData.budgetItemId}
              onValueChange={(val: string) => setFormData({ ...formData, budgetItemId: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori anggaran..." />
              </SelectTrigger>
              <SelectContent>
                {budgetItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {getCategoryLabel(item.category)} - {item.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi Pengeluaran</Label>
            <Input
              id="description"
              placeholder="Contoh: Pembelian semen 50 sak"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              placeholder="1500000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Tanggal Transaksi</Label>
            <Input
              id="date"
              type="date"
              value={formData.transactionDate}
              onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Pengeluaran"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
