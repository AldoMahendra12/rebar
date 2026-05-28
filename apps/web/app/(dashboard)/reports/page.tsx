"use client";

import Link from "next/link";
import { FolderKanban, FileText, ArrowRight } from "lucide-react";
import { MOCK_PROJECT } from "@/lib/mock-project";

export default function GlobalReportsPage() {
  // In a real app, this would fetch all active projects for the organization.
  // For the mockup, we just show the mock project.
  const projects = [MOCK_PROJECT];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Laporan & Ekspor</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pilih proyek untuk mulai membuat atau mengunduh laporan PDF.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div key={project.id} className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all flex flex-col">
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 mb-4">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-secondary text-muted-foreground border border-border">
                  {project.code}
                </span>
              </div>
              <h3 className="font-bold text-foreground mb-1 line-clamp-1">{project.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Klien: {project.clientName}
              </p>
            </div>
            <div className="p-3 border-t border-border bg-secondary/30 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <FileText className="w-3.5 h-3.5" />
                <span>Siap di-generate</span>
              </div>
              <Link 
                href={`/projects/${project.id}/reports`}
                className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                Buat Laporan <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
