export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { organizationId } = await requireOrg();

    const projects = await prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    // Calculate KPI stats
    const activeProjects = projects.filter((p) => p.status === "active");
    const totalContractValue = projects.reduce(
      (sum, p) => sum + Number(p.contractValue),
      0
    );

    return NextResponse.json({
      projects,
      kpi: {
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        totalContractValue,
        portfolioProgress: 0, // TODO: calculate from progressActuals
        behindSchedule: 0, // TODO: calculate deviation
        onTrack: 0,
        ahead: 0,
      },
    });
  } catch (error) {
    console.error("[DASHBOARD]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
