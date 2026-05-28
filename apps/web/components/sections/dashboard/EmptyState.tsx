"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Filter, SearchX, FilterX } from "lucide-react";
import { useCreateProjectModal } from "@/hooks/use-create-project-modal";

interface EmptyStateProps {
  hasProjects: boolean;
  filterActive: boolean;
}

export function EmptyState({ hasProjects, filterActive }: EmptyStateProps) {
  const { open } = useCreateProjectModal();

  if (hasProjects && filterActive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mb-4">
          <Filter className="w-5 h-5 text-zinc-400" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Tidak ada proyek ditemukan
        </h3>
        <p className="text-sm text-muted-foreground">
          Coba ubah filter atau kata kunci pencarian
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50"
    >
      <div className="mb-6">
        {/* Simple construction illustration */}
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 100H100" stroke="#e4e4e7" strokeWidth="4" strokeLinecap="round" />
          <path d="M40 100V40H80V100" stroke="#e4e4e7" strokeWidth="4" strokeLinejoin="round" />
          <path d="M40 60H80" stroke="#e4e4e7" strokeWidth="4" />
          <path d="M40 80H80" stroke="#e4e4e7" strokeWidth="4" />
          <path d="M55 40V20L65 30L75 20V40" stroke="#d4d4d8" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      </div>

      <h3 className="text-base font-semibold text-foreground mb-1.5">
        Belum ada proyek
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Mulai dengan membuat proyek pertama
      </p>

      <button
        onClick={open}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] border border-[#1d4ed8] shadow-[0_1px_2px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] rounded-lg hover:brightness-105 active:scale-[0.98] transition-all"
      >
        <Plus className="w-4 h-4" />
        Buat Proyek Pertama
      </button>
    </motion.div>
  );
}
