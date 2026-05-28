import { NextRequest, NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProjectSchema } from "@/lib/validations/project";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const { organizationId, userId } = await requireOrg();

    const body = await req.json();
    const validated = createProjectSchema.parse(body);

    // Cek apakah kode proyek sudah dipakai di org ini
    const existingCode = await prisma.project.findFirst({
      where: { organizationId, code: validated.code },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "Kode proyek sudah digunakan. Pilih kode lain." },
        { status: 409 }
      );
    }

    // Cek batas subscription
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { subscriptionTier: true, subscriptionStatus: true },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization tidak ditemukan" },
        { status: 404 }
      );
    }

    const activeProjectCount = await prisma.project.count({
      where: { organizationId, status: { in: ["active", "planning"] } },
    });

    const projectLimits: Record<string, number> = {
      trial: 3,
      starter: 3,
      pro: 15,
      business: Infinity,
      enterprise: Infinity,
    };

    const limit = projectLimits[org.subscriptionTier] ?? 3;

    if (activeProjectCount >= limit) {
      return NextResponse.json(
        {
          error: `Batas proyek untuk paket ${org.subscriptionTier} adalah ${limit} proyek. Upgrade untuk menambah lebih banyak.`,
          code: "PROJECT_LIMIT_REACHED",
          currentTier: org.subscriptionTier,
        },
        { status: 403 }
      );
    }

    // Buat proyek
    const project = await prisma.project.create({
      data: {
        organizationId,
        name: validated.name,
        code: validated.code,
        clientName: validated.clientName,
        location: validated.location,
        description: validated.description ?? null,
        contractValue: validated.contractValue,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        periodType: validated.periodType,
        status: "planning",
      },
    });

    return NextResponse.json(
      {
        success: true,
        project: {
          id: project.id,
          name: project.name,
          code: project.code,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Data tidak valid", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "USER_NOT_ONBOARDED") {
      return NextResponse.json(
        { error: "Akun belum terdaftar. Silakan selesaikan onboarding terlebih dahulu.", code: "USER_NOT_ONBOARDED" },
        { status: 403 }
      );
    }

    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Gagal membuat proyek: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { organizationId } = await requireOrg();

    const projects = await prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        code: true,
        clientName: true,
        location: true,
        contractValue: true,
        startDate: true,
        endDate: true,
        status: true,
        periodType: true,
        createdAt: true,
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat proyek" }, { status: 500 });
  }
}
