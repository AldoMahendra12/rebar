"use client";

import { useUser } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useCreateProjectModal } from "@/hooks/use-create-project-modal";

export function PageHeader() {
  const { user } = useUser();
  const router = useRouter();
  const { open } = useCreateProjectModal();

  const hour = new Date().getHours();
  let greeting = "Selamat malam,";
  if (hour >= 6 && hour < 12) greeting = "Selamat pagi,";
  else if (hour >= 12 && hour < 15) greeting = "Selamat siang,";
  else if (hour >= 15 && hour < 18) greeting = "Selamat sore,";

  const today = format(new Date(), "EEEE, dd MMMM yyyy", { locale: id });

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start justify-between"
    >
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {greeting} {user?.firstName || "Pengguna"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
      </div>

      <button
        onClick={open}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-white bg-[linear-gradient(180deg,#3b82f6_0%,#2563eb_100%)] border border-[#1d4ed8] shadow-[0_1px_2px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] rounded-lg hover:brightness-105 active:scale-[0.98] transition-all"
      >
        <Plus className="w-[15px] h-[15px]" />
        Buat Proyek
      </button>
    </motion.div>
  );
}
