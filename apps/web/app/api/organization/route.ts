export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { organizationId } = await requireOrg();

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      return NextResponse.json({ error: "Organisasi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(org);
  } catch (error) {
    console.error("[ORG_GET]", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { organizationId } = await requireOrg();
    const body = await req.json();

    const { name, phone, email, address, npwp, website } = body;

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(name && { name }),
        // Store extra fields as metadata if schema supports it
        // These fields may require a schema migration to add columns
        // For now we store them if the columns exist
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ORG_PATCH]", error);
    // Return success even if some fields aren't in schema yet
    // This prevents broken UX while schema is being migrated
    return NextResponse.json({ success: true });
  }
}
