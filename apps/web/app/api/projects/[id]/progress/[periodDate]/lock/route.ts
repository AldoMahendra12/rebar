export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; periodDate: string } }
) {
  try {
    const { organizationId, role } = await requireOrg();
    
    // Only PM, Admin, or Owner can unlock
    const allowedRoles = ["pm", "admin", "owner"];
    if (!allowedRoles.includes(role.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized to modify lock status" }, { status: 403 });
    }

    const body: { locked: boolean } = await req.json();
    const pDate = new Date(params.periodDate);

    const project = await prisma.project.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update all actuals for this period
    await prisma.progressActual.updateMany({
      where: {
        organizationId,
        periodDate: pDate,
        periodType: project.periodType,
        wbsItem: { projectId: params.id }
      },
      data: {
        isLocked: body.locked,
      }
    });

    return NextResponse.json({ success: true, locked: body.locked });

  } catch (error) {
    console.error("[PROGRESS_LOCK_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
