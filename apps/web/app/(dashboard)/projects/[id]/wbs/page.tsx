import { WbsTable } from "@/components/sections/wbs/WbsTable";
import { MOCK_WBS, MOCK_PROJECT } from "@/lib/mock-project";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";
import Link from "next/link";
import { ChevronLeft, BarChart2 } from "lucide-react";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  return {
    title: `Rencana Anggaran Biaya — ${params.id} | Rebar`,
  };
}

export default async function WbsPage({ params }: Props) {
  let project = MOCK_PROJECT;
  let wbs = MOCK_WBS;
  let isFallback = true;

  try {
    const { organizationId } = await requireOrg();
    const dbProject = await prisma.project.findFirst({
      where: { id: params.id, organizationId },
    });

    if (dbProject) {
      project = {
        id: dbProject.id,
        name: dbProject.name,
        code: dbProject.code,
        clientName: dbProject.clientName,
        location: dbProject.location,
        contractValue: Number(dbProject.contractValue),
        startDate: dbProject.startDate.toISOString().split("T")[0],
        endDate: dbProject.endDate.toISOString().split("T")[0],
        status: dbProject.status,
        periodType: dbProject.periodType as "weekly" | "monthly",
        description: dbProject.description || undefined,
      };
      isFallback = false;

      // Fetch real WBS
      const dbWbs = await prisma.wbsItem.findMany({
        where: { projectId: params.id, organizationId },
        orderBy: { sortOrder: "asc" },
      });

      if (dbWbs.length > 0) {
        wbs = dbWbs.map((item) => ({
          id: item.id,
          projectId: item.projectId,
          parentId: item.parentId,
          code: item.code,
          name: item.name,
          level: item.level as 1 | 2 | 3,
          unit: item.unit || "",
          volume: item.volume ? Number(item.volume) : null,
          unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
          totalPrice: item.totalPrice ? Number(item.totalPrice) : null,
          weight: item.weight ? Number(item.weight) : null,
          sortOrder: item.sortOrder,
          isLeaf: item.isLeaf,
        }));
      }
    }
  } catch {
    console.log("Using mock fallback WBS data due to authentication/database check");
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Fallback Banner */}
      {isFallback && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs">
          <span>💡 Menggunakan data demo pekerjaan interaktif untuk demonstrasi mockup.</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${params.id}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {project.name}
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-semibold text-foreground">Rencana Anggaran Biaya</span>
        </div>

        <Link
          href={`/projects/${params.id}/s-curve`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors"
        >
          <BarChart2 className="w-4 h-4" />
          Lihat S-Curve & Rencana
        </Link>
      </div>

      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Rencana Anggaran Biaya</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {project.name} · {project.code} · Klik cell untuk mengedit langsung
        </p>
      </div>

      {/* Info bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Klien", value: project.clientName },
          { label: "Lokasi", value: project.location },
          { label: "Nilai Kontrak", value: `Rp ${(project.contractValue / 1e9).toFixed(2)}M` },
          { label: "Period Type", value: project.periodType === "weekly" ? "Mingguan" : "Bulanan" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-sm font-semibold text-foreground truncate mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      {/* WBS Table */}
      <WbsTable
        initialRows={wbs}
        projectId={project.id}
      />
    </div>
  );
}
