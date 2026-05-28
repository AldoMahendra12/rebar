import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";

interface Props {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Props) {
  try {
    const { organizationId } = await requireOrg();
    const project = await prisma.project.findFirst({
      where: { id: params.id, organizationId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    // Return 404 for any auth/db error
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
