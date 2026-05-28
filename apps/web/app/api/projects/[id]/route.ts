export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await requireOrg();

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        organizationId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Proyek tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PROJECT_GET]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data proyek" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await requireOrg();
    const body = await req.json();

    const { name, clientName, location, startDate, endDate, status, periodType, description } = body;

    const project = await prisma.project.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!project) {
      return NextResponse.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(clientName !== undefined && { clientName }),
        ...(location !== undefined && { location }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
        ...(periodType && { periodType }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PROJECT_PATCH]", error);
    return NextResponse.json(
      { error: "Gagal menyimpan perubahan" },
      { status: 500 }
    );
  }
}
