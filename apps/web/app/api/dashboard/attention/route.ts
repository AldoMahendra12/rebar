import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";

export async function GET() {
  try {
    const { organizationId } = await requireOrg();

    // Ideally, we calculate deviation dynamically or pull from a materialized view.
    // Since this is a demo, we will use mock data for the projects needing attention.
    // In production, we would query active projects, sum actuals vs planned, and filter deviation <= -3%.

    const mockAttentionProjects = [
      {
        id: "prj-002",
        name: "Pembangunan Pabrik Baja",
        code: "PB-002",
        plannedProgress: 75.0,
        actualProgress: 68.5,
        deviation: -6.5,
        daysRemaining: 120,
        status: "active",
      },
    ];

    return NextResponse.json(mockAttentionProjects);
  } catch (error) {
    return NextResponse.json([
      {
        id: "prj-001",
        name: "Gedung Perkantoran Tower A",
        code: "PRJ-001",
        plannedProgress: 62.0,
        actualProgress: 58.0,
        deviation: -4.0,
        daysRemaining: 215,
        status: "active",
      },
    ]);
  }
}
