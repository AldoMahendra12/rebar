"use client";

import { CreditCard, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <Card className="border-blue-500/30 bg-blue-500/5 shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-blue-600 flex items-center gap-2">
                <Zap className="w-5 h-5 fill-current" />
                Paket Saat Ini: Professional Plan
              </CardTitle>
              <CardDescription className="mt-1.5">
                Anda berada di paket Professional. Perpanjangan berikutnya pada 15 Juni 2026.
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-800">Rp 499.000</p>
              <p className="text-xs text-muted-foreground">/ bulan</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Proyek aktif tidak terbatas
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Akses penuh S-Curve & Budget
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Kapasitas penyimpanan 10GB
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-4 flex gap-3">
          <Button>Kelola Tagihan & Metode Pembayaran</Button>
          <Button variant="outline">Tingkatkan ke Enterprise</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Penggunaan Bulan Ini</CardTitle>
          <CardDescription>Limit penggunaan sesuai paket Professional Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-700">Penyimpanan Dokumen</span>
              <span className="text-muted-foreground">1.2 GB / 10 GB</span>
            </div>
            <Progress value={12} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-700">Anggota Tim</span>
              <span className="text-muted-foreground">3 / 10 Anggota</span>
            </div>
            <Progress value={30} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="font-medium p-3">Tanggal</th>
                  <th className="font-medium p-3">Deskripsi</th>
                  <th className="font-medium p-3">Nominal</th>
                  <th className="font-medium p-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border last:border-0">
                  <td className="p-3 text-muted-foreground">15 Mei 2026</td>
                  <td className="p-3 font-medium">Rebar Professional Plan - Monthly</td>
                  <td className="p-3">Rp 499.000</td>
                  <td className="p-3 text-right">
                    <Button variant="link" className="h-auto p-0">Download</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
