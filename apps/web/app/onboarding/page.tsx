"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { HardHat, Building2, Users } from "lucide-react";
import { motion } from "framer-motion";

const companySizes = [
  { value: "<10", label: "< 10 orang", desc: "Usaha kecil / perorangan" },
  { value: "10-50", label: "10 – 50 orang", desc: "Kontraktor menengah" },
  { value: "50-200", label: "50 – 200 orang", desc: "Kontraktor besar" },
  { value: "200+", label: "> 200 orang", desc: "Perusahaan besar" },
];

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [size, setSize] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !size) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          size,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal membuat organisasi");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <HardHat className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Selamat datang di Rebar!
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Hai {user?.firstName || ""}! Mari setup perusahaan Anda dulu.
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: CV. Maju Jaya Konstruksi"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors text-sm"
                />
              </div>
              <button
                type="button"
                disabled={!companyName.trim()}
                onClick={() => setStep(2)}
                className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Lanjut →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  Ukuran Perusahaan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {companySizes.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSize(opt.value)}
                      className={`p-4 rounded-xl border text-left transition-all duration-150 ${
                        size === opt.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {opt.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-secondary text-foreground rounded-xl font-semibold text-sm hover:bg-secondary/80 transition-colors"
                >
                  ← Kembali
                </button>
                <button
                  type="submit"
                  disabled={!size || loading}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? "Menyimpan..." : "Mulai Sekarang 🚀"}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
