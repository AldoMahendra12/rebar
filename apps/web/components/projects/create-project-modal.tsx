"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  X,
  AlertCircle,
  CalendarDays,
  CalendarRange,
  Check,
  Loader2,
  XCircle,
  Info,
  ChevronRight,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { step1Schema, step2Schema, step3Schema } from "@/lib/validations/project";
import type { CreateProjectInput } from "@/lib/validations/project";
import { useCreateProject } from "@/hooks/use-create-project";
import { useNavigationStore } from "@/stores/navigation-store";
import type { z } from "zod";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRupiah(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} Miliar`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} Juta`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)} Ribu`;
  return `Rp ${value}`;
}

function formatRupiahDisplay(raw: string): string {
  const num = raw.replace(/\D/g, "");
  if (!num) return "";
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function calcDuration(start: string, end: string): string | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (e <= s) return null;
  const days = Math.ceil((e.getTime() - s.getTime()) / 86400000);
  const months = Math.round(days / 30);
  return months > 1 ? `${months} bulan (${days} hari)` : `${days} hari`;
}

// ─── FormField wrapper ────────────────────────────────────────────────────────

function FormField({
  label,
  required,
  optional,
  error,
  helper,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
        {optional && (
          <span className="text-xs font-normal text-muted-foreground bg-zinc-100 px-1.5 py-0.5 rounded">
            Opsional
          </span>
        )}
      </label>
      {children}
      {helper && !error && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500 flex items-center gap-1"
        >
          <AlertCircle size={12} />
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Step Indicators ─────────────────────────────────────────────────────────

const STEPS = [
  { label: "Informasi Proyek", sub: "Isi informasi dasar proyek" },
  { label: "Detail Kontrak", sub: "Isi nilai dan jadwal kontrak" },
  { label: "Undang Tim", sub: "Tambahkan anggota tim ke proyek ini" },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const isDone = i < current - 1;
        const isActive = i === current - 1;
        return (
          <motion.div
            key={i}
            layout
            animate={{
              width: isActive ? 24 : 16,
              backgroundColor: isDone || isActive ? "#3b82f6" : isDone ? "#93c5fd" : "#e4e4e7",
              opacity: isDone ? 0.5 : 1,
            }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="h-1.5 rounded-full"
          />
        );
      })}
    </div>
  );
}

// ─── SUCCESS STATE ────────────────────────────────────────────────────────────

function SuccessState({ projectName }: { projectName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center justify-center px-8 py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
        className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center"
      >
        <motion.div
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        >
          <Check className="w-8 h-8 text-emerald-500" strokeWidth={2.5} />
        </motion.div>
      </motion.div>

      <h2 className="font-display text-lg font-semibold text-foreground mt-4">
        Proyek Berhasil Dibuat!
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Mengarahkan ke WBS Builder…
      </p>

      <div className="w-48 mt-6 h-1 bg-zinc-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, ease: "linear" }}
          className="h-full bg-primary rounded-full"
        />
      </div>
    </motion.div>
  );
}

// ─── STEP 1 ───────────────────────────────────────────────────────────────────

function Step1({
  onNext,
  defaultValues,
}: {
  onNext: (data: Step1Data) => void;
  defaultValues?: Partial<Step1Data>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { periodType: undefined, ...defaultValues } as any,
    mode: "onBlur",
  });

  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const description = watch("description") ?? "";
  const nameValue = watch("name");

  // Auto-generate code on name change (debounced)
  useEffect(() => {
    if (codeManuallyEdited) return;
    if (!nameValue || nameValue.length < 3) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsGeneratingCode(true);
      try {
        const res = await fetch("/api/projects/generate-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nameValue }),
        });
        const { code } = await res.json();
        if (code) setValue("code", code, { shouldValidate: false });
      } finally {
        setIsGeneratingCode(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nameValue, codeManuallyEdited, setValue]);

  return (
    <form onSubmit={handleSubmit(onNext)} className="px-6 py-5 space-y-4">
      {/* Nama Proyek */}
      <FormField label="Nama Proyek" required error={errors.name?.message}>
        <input
          {...register("name")}
          placeholder="contoh: Gedung Perkantoran Sudirman"
          className={cn(
            "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors",
            errors.name ? "border-red-300 bg-red-50/30" : "border-zinc-300"
          )}
        />
      </FormField>

      {/* Kode Proyek */}
      <FormField
        label="Kode Proyek"
        required
        error={errors.code?.message}
        helper="Kode unik untuk identifikasi proyek. Auto-generate dari nama."
      >
        <div className="relative">
          <input
            {...register("code", {
              onChange: () => setCodeManuallyEdited(true),
            })}
            placeholder="GPS-001"
            className={cn(
              "w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors uppercase pr-9",
              errors.code ? "border-red-300 bg-red-50/30" : "border-zinc-300"
            )}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              target.value = target.value.toUpperCase();
            }}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {isGeneratingCode ? (
              <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
            ) : watch("code") && !errors.code ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : null}
          </div>
        </div>
      </FormField>

      {/* Nama Klien */}
      <FormField label="Nama Klien" required error={errors.clientName?.message}>
        <input
          {...register("clientName")}
          placeholder="PT. Maju Jaya Indonesia"
          className={cn(
            "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors",
            errors.clientName ? "border-red-300 bg-red-50/30" : "border-zinc-300"
          )}
        />
      </FormField>

      {/* Lokasi */}
      <FormField label="Lokasi Proyek" required error={errors.location?.message}>
        <input
          {...register("location")}
          placeholder="Jl. Sudirman No.1, Jakarta Selatan"
          className={cn(
            "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors",
            errors.location ? "border-red-300 bg-red-50/30" : "border-zinc-300"
          )}
        />
      </FormField>

      {/* Deskripsi */}
      <FormField label="Deskripsi" optional error={errors.description?.message}>
        <div className="relative">
          <textarea
            {...register("description")}
            placeholder="Deskripsi singkat tentang proyek ini..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
          />
          <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            {description.length}/500
          </span>
        </div>
      </FormField>

      {/* Footer is handled by parent */}
      <button type="submit" id="step1-submit" className="hidden" />
    </form>
  );
}

// ─── STEP 2 ───────────────────────────────────────────────────────────────────

function Step2({
  onNext,
  onBack,
  defaultValues,
}: {
  onNext: (data: Step2Data) => void;
  onBack: () => void;
  defaultValues?: Partial<Step2Data>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { periodType: "weekly", ...defaultValues },
    mode: "onBlur",
  });

  const [rawValue, setRawValue] = useState(
    defaultValues?.contractValue ? String(defaultValues.contractValue) : ""
  );

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const periodType = watch("periodType");
  const contractValue = watch("contractValue");

  const duration = calcDuration(startDate, endDate);

  const handleValueInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setRawValue(digits);
    setValue("contractValue", Number(digits), { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="px-6 py-5 space-y-5">
      {/* Nilai Kontrak */}
      <FormField label="Nilai Kontrak" required error={errors.contractValue?.message}>
        <div
          className={cn(
            "flex items-center border rounded-lg overflow-hidden",
            errors.contractValue ? "border-red-300" : "border-zinc-300"
          )}
        >
          <span className="px-3 py-2 bg-zinc-50 border-r border-zinc-300 text-sm text-zinc-500 shrink-0">
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={formatRupiahDisplay(rawValue)}
            onChange={handleValueInput}
            placeholder="0"
            className="flex-1 px-3 py-2 text-sm font-mono focus:outline-none"
          />
        </div>
        {contractValue > 0 && !errors.contractValue && (
          <p className="text-xs text-primary mt-0.5">
            = {formatRupiah(contractValue)}
          </p>
        )}
      </FormField>

      {/* Tanggal */}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Tanggal Mulai" required error={errors.startDate?.message}>
          <input
            type="date"
            {...register("startDate")}
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              errors.startDate ? "border-red-300 bg-red-50/30" : "border-zinc-300"
            )}
          />
        </FormField>

        <FormField label="Tanggal Selesai" required error={errors.endDate?.message}>
          <input
            type="date"
            {...register("endDate")}
            min={startDate ? new Date(new Date(startDate).getTime() + 86400000).toISOString().split("T")[0] : undefined}
            className={cn(
              "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              errors.endDate ? "border-red-300 bg-red-50/30" : "border-zinc-300"
            )}
          />
        </FormField>
      </div>

      {/* Duration chip */}
      <AnimatePresence>
        {duration && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 text-blue-600 text-xs rounded-lg px-3 py-2 flex items-center gap-2"
          >
            <CalendarDays size={14} />
            Durasi: {duration}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tipe Periode */}
      <FormField label="Tipe Periode Pelaporan" required error={errors.periodType?.message}>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              value: "weekly" as const,
              icon: CalendarDays,
              title: "Mingguan",
              sub: "Input progress setiap minggu",
              tag: "Proyek jangka pendek",
            },
            {
              value: "monthly" as const,
              icon: CalendarRange,
              title: "Bulanan",
              sub: "Input progress setiap bulan",
              tag: "Proyek jangka panjang",
            },
          ].map(({ value, icon: Icon, title, sub, tag }) => {
            const selected = periodType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setValue("periodType", value, { shouldValidate: true })}
                className={cn(
                  "relative p-4 rounded-xl border-2 text-left transition-all",
                  selected
                    ? "border-primary bg-primary/[0.03]"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                {/* Selected checkmark */}
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="absolute top-2.5 right-2.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                    >
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Icon
                  className={cn("w-5 h-5", selected ? "text-primary" : "text-zinc-400")}
                />
                <p className="text-sm font-semibold mt-2">{title}</p>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                <p className="text-[10px] text-zinc-400 mt-2">{tag}</p>
              </button>
            );
          })}
        </div>
      </FormField>

      <button type="submit" id="step2-submit" className="hidden" />
    </form>
  );
}

// ─── STEP 3 ───────────────────────────────────────────────────────────────────

function Step3() {
  return (
    <div className="px-6 py-5 space-y-4">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2.5">
        <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-600">
          Langkah ini opsional. Kamu bisa undang tim nanti dari pengaturan proyek.
        </p>
      </div>

      <FormField label="Anggota Tim" optional>
        <div className="border border-zinc-200 rounded-xl p-6 flex flex-col items-center text-center">
          <Building className="w-8 h-8 text-zinc-300" />
          <p className="text-sm text-zinc-500 mt-2">Undang anggota tim nanti</p>
          <p className="text-xs text-zinc-400 mt-1">
            Fitur undang anggota tersedia setelah proyek dibuat.
          </p>
          <button
            type="button"
            onClick={() => window.open("/settings/team", "_blank")}
            className="mt-3 text-xs text-primary hover:underline flex items-center gap-0.5"
          >
            Kelola Tim dari Pengaturan <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </FormField>
    </div>
  );
}

// ─── MAIN MODAL ───────────────────────────────────────────────────────────────

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const { setActiveProject } = useNavigationStore();
  const mutation = useCreateProject();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [formData, setFormData] = useState<Partial<CreateProjectInput>>({
    periodType: "weekly",
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
    setTimeout(() => {
      setStep(1);
      setFormData({ periodType: "weekly" });
      setIsSuccess(false);
      setApiError(null);
    }, 300);
  }, [isSubmitting, onClose]);

  const goNext = useCallback(() => {
    setDirection("forward");
    setStep((s) => Math.min(s + 1, 3));
  }, []);

  const goBack = useCallback(() => {
    setDirection("backward");
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const handleStep1Next = useCallback(
    (data: Step1Data) => {
      setFormData((prev) => ({ ...prev, ...data }));
      goNext();
    },
    [goNext]
  );

  const handleStep2Next = useCallback(
    (data: Step2Data) => {
      setFormData((prev) => ({ ...prev, ...data }));
      goNext();
    },
    [goNext]
  );

  const handleSubmit = useCallback(
    async (skipMembers = false) => {
      const payload: CreateProjectInput = {
        ...(formData as CreateProjectInput),
        memberIds: skipMembers ? [] : (formData.memberIds ?? []),
      };

      setIsSubmitting(true);
      setApiError(null);

      try {
        const result = await mutation.mutateAsync(payload);
        setIsSuccess(true);

        // After 1.5s close modal and redirect
        setTimeout(() => {
          onClose();
          setTimeout(() => {
            router.push(`/projects/${result.project.id}/wbs`);
          }, 200);
        }, 1500);
      } catch (err: any) {
        setApiError({
          message: err?.message ?? "Gagal membuat proyek. Coba lagi.",
          code: err?.code,
          status: err?.status,
        });
        setIsSubmitting(false);
      }
    },
    [formData, mutation, onClose, router]
  );

  // Slide animation variants
  const slideVariants = {
    enter: (dir: string) => ({
      opacity: 0,
      x: dir === "forward" ? 20 : -20,
    }),
    center: { opacity: 1, x: 0 },
    exit: (dir: string) => ({
      opacity: 0,
      x: dir === "forward" ? -20 : 20,
    }),
  };

  const stepInfo = STEPS[step - 1];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl [&>button]:hidden">
        {isSuccess ? (
          <SuccessState projectName={formData.name ?? "Proyek Baru"} />
        ) : (
          <>
            {/* ── HEADER ── */}
            <div className="px-6 pt-6 pb-4 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <StepIndicator current={step} total={3} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-foreground">
                        {stepInfo.label}
                      </h2>
                      {step === 3 && (
                        <span className="text-xs font-normal text-muted-foreground bg-zinc-100 px-1.5 py-0.5 rounded">
                          Opsional
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {stepInfo.sub}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            </div>

            {/* ── BODY (animated step) ── */}
            <div className="overflow-x-hidden overflow-y-auto" style={{ minHeight: 380, maxHeight: "calc(90vh - 160px)" }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {step === 1 && (
                    <Step1
                      onNext={handleStep1Next}
                      defaultValues={formData as Partial<Step1Data>}
                    />
                  )}
                  {step === 2 && (
                    <Step2
                      onNext={handleStep2Next}
                      onBack={goBack}
                      defaultValues={formData as Partial<Step2Data>}
                    />
                  )}
                  {step === 3 && <Step3 />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── ERROR BANNER ── */}
            <AnimatePresence>
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mx-6 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
                >
                  <div className="flex gap-2 items-start">
                    <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-red-600">{apiError.message}</p>
                      {apiError.code === "PROJECT_LIMIT_REACHED" && (
                        <button
                          onClick={() => router.push("/settings/billing")}
                          className="mt-1.5 text-xs font-medium text-red-600 underline"
                        >
                          Upgrade Paket →
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── FOOTER ── */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-white">
              {/* Back */}
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={isSubmitting}
                    className="text-sm font-medium text-zinc-600 hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    ← Kembali
                  </button>
                )}
              </div>

              {/* Next / Submit */}
              <div className="flex items-center gap-2">
                {step === 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("step1-submit")?.click()
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] border border-[#1d4ed8] shadow-[0_1px_2px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] rounded-lg hover:brightness-105 active:scale-[0.98] transition-all"
                  >
                    Lanjut →
                  </button>
                )}

                {step === 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("step2-submit")?.click()
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] border border-[#1d4ed8] shadow-[0_1px_2px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] rounded-lg hover:brightness-105 active:scale-[0.98] transition-all"
                  >
                    Lanjut →
                  </button>
                )}

                {step === 3 && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSubmit(true)}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
                    >
                      Lewati &amp; Buat Proyek
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmit(false)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] border border-[#1d4ed8] shadow-[0_1px_2px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] rounded-lg hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Membuat proyek…
                        </>
                      ) : (
                        "Buat Proyek"
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
