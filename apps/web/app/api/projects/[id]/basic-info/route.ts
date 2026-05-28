import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";
import { MOCK_PROJECT } from "@/lib/mock-project";

interface Props {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Props) {
  try {
    const { organizationId } = await requireOrg();
    const project = await prisma.project.findFirst({
      where: { id: params.id, organizationId },
      select: { id: true, name: true, code: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(project, { status: 200 });
  } catch {
    // Fallback to mock data for dev
    if (params.id === MOCK_PROJECT.id) {
      return NextResponse.json(
        { id: MOCK_PROJECT.id, name: MOCK_PROJECT.name, code: MOCK_PROJECT.code },
        { status: 200 }
      );
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
