import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";

export async function GET() {
  try {
    await requireOrg();

    // Mock Activity Feed data since we don't have extensive history in DB yet
    const mockActivities = [
      {
        id: "act-1",
        type: "progress_input",
        projectName: "Gedung Perkantoran Tower A",
        projectCode: "PRJ-001",
        projectId: "prj-001",
        description: "Input progress Minggu 12",
        userName: "Aldo",
        userAvatar: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
      },
      {
        id: "act-2",
        type: "document_upload",
        projectName: "Gedung Perkantoran Tower A",
        projectCode: "PRJ-001",
        projectId: "prj-001",
        description: "Upload dokumen Laporan Tanah",
        userName: "Budi",
        userAvatar: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        id: "act-3",
        type: "cost_recorded",
        projectName: "Pembangunan Pabrik Baja",
        projectCode: "PB-002",
        projectId: "prj-002",
        description: "Catat pengeluaran Material Beton",
        userName: "Citra",
        userAvatar: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      },
      {
        id: "act-4",
        type: "report_generated",
        projectName: "Pembangunan Pabrik Baja",
        projectCode: "PB-002",
        projectId: "prj-002",
        description: "Generate laporan Bulanan April",
        userName: "Aldo",
        userAvatar: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      },
    ];

    return NextResponse.json(mockActivities);
  } catch (error) {
    return NextResponse.json([]);
  }
}
