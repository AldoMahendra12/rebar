import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";

export async function GET() {
  try {
    await requireOrg();

    // Mock data for upcoming deadlines and open period
    const mockUpcomingDeadlines = [
      {
        id: "prj-003",
        name: "Renovasi Interior Hotel Z",
        code: "RNV-003",
        endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        daysRemaining: -2,
        status: "active",
      },
      {
        id: "prj-002",
        name: "Pembangunan Pabrik Baja",
        code: "PB-002",
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days from now
        daysRemaining: 5,
        status: "active",
      },
      {
        id: "prj-004",
        name: "Jalan Tol Seksi 4",
        code: "JT-004",
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(), // 12 days from now
        daysRemaining: 12,
        status: "active",
      },
      {
        id: "prj-001",
        name: "Gedung Perkantoran Tower A",
        code: "PRJ-001",
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days from now
        daysRemaining: 45,
        status: "active",
      },
    ];

    const mockOpenPeriod = {
      label: "Minggu 21",
      deadlineDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days from now (Friday)
      daysUntilDeadline: 2,
      projectsNotSubmitted: 2,
      projectsNotSubmittedNames: ["Pembangunan Pabrik Baja", "Renovasi Interior Hotel Z"],
    };

    return NextResponse.json({
      upcomingDeadlines: mockUpcomingDeadlines,
      openPeriod: mockOpenPeriod,
    });
  } catch (error) {
    return NextResponse.json({
      upcomingDeadlines: [],
      openPeriod: null,
    });
  }
}
