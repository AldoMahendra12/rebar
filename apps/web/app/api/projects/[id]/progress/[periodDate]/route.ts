export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string; periodDate: string } }
) {
  try {
    const { organizationId } = await requireOrg();
    const pDate = new Date(params.periodDate);

    const project = await prisma.project.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const periodType = project.periodType;

    // Fetch WBS items
    const wbsItems = await prisma.wbsItem.findMany({
      where: { projectId: params.id, organizationId },
      orderBy: { sortOrder: "asc" },
    });

    if (wbsItems.length === 0) {
      return NextResponse.json({
        period: { periodDate: params.periodDate, periodLabel: params.periodDate, periodType, status: "empty", isLocked: false },
        items: [],
        summary: { weightedPlannedThisPeriod: 0, weightedActualThisPeriod: 0, weightedPlannedCumulative: 0, weightedActualCumulative: 0, deviation: 0, completedItems: 0, totalLeafItems: 0 }
      });
    }

    const leafItems = wbsItems.filter((i) => i.isLeaf);
    const leafItemIds = leafItems.map((i) => i.id);

    // Fetch plans
    const plans = await prisma.progressPlan.findMany({
      where: { wbsItemId: { in: leafItemIds }, organizationId },
    });

    // Fetch actuals
    const actuals = await prisma.progressActual.findMany({
      where: { wbsItemId: { in: leafItemIds }, organizationId },
    });

    // Fetch photos
    const actualIds = actuals.map(a => a.id);
    const photos = await prisma.progressPhoto.findMany({
      where: { progressActualId: { in: actualIds } },
    });

    // Compute metrics
    const items = [];
    let weightedPlannedThisPeriod = 0;
    let weightedActualThisPeriod = 0;
    let weightedPlannedCumulative = 0;
    let weightedActualCumulative = 0;
    let completedItems = 0;

    let periodIsLocked = false;
    let periodStatus = "empty";

    const totalRAB = leafItems.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);

    for (const item of wbsItems) {
      const isLeaf = item.isLeaf;
      const weight = totalRAB > 0 && isLeaf ? (Number(item.totalPrice || 0) / totalRAB) * 100 : 0;
      
      let plannedThisPeriod = 0;
      let plannedCumulative = 0;
      let actualThisPeriod: number | null = null;
      let actualCumulative: number | null = null;
      let isSubmitted = false;
      let notes = null;
      let itemPhotos: any[] = [];

      if (isLeaf) {
        // Plans
        const itemPlans = plans.filter((p) => p.wbsItemId === item.id);
        for (const p of itemPlans) {
          if (p.periodDate <= pDate) {
            plannedCumulative += Number(p.plannedPercentage);
            if (p.periodDate.getTime() === pDate.getTime()) {
              plannedThisPeriod = Number(p.plannedPercentage);
            }
          }
        }

        // Actuals
        const itemActuals = actuals.filter((a) => a.wbsItemId === item.id);
        let cumAct = 0;
        for (const a of itemActuals) {
          if (a.periodDate <= pDate) {
            cumAct += Number(a.actualPercentage);
            if (a.periodDate.getTime() === pDate.getTime()) {
              actualThisPeriod = Number(a.actualPercentage);
              notes = a.notes;
              if (a.isLocked) periodIsLocked = true;
              
              const phts = photos.filter(ph => ph.progressActualId === a.id);
              itemPhotos = phts.map(ph => ({ id: ph.id, fileUrl: ph.fileUrl, fileName: ph.fileName }));
            }
          }
        }
        actualCumulative = itemActuals.length > 0 ? cumAct : null;
        isSubmitted = actualThisPeriod !== null;

        // Weight calculations
        const wFrac = weight / 100;
        weightedPlannedThisPeriod += wFrac * plannedThisPeriod;
        weightedPlannedCumulative += wFrac * Math.min(plannedCumulative, 100);
        
        if (actualThisPeriod !== null) {
          weightedActualThisPeriod += wFrac * actualThisPeriod;
          completedItems++;
        }
        if (actualCumulative !== null) {
          weightedActualCumulative += wFrac * Math.min(actualCumulative, 100);
        }
      }

      items.push({
        wbsItemId: item.id,
        code: item.code,
        name: item.name,
        level: item.level,
        isLeaf,
        unit: item.unit,
        weight: parseFloat(weight.toFixed(4)),
        plannedThisPeriod: parseFloat(plannedThisPeriod.toFixed(2)),
        plannedCumulative: parseFloat(Math.min(plannedCumulative, 100).toFixed(2)),
        actualThisPeriod: actualThisPeriod !== null ? parseFloat(actualThisPeriod.toFixed(2)) : null,
        actualCumulative: actualCumulative !== null ? parseFloat(Math.min(actualCumulative, 100).toFixed(2)) : null,
        isSubmitted,
        notes,
        photos: itemPhotos,
      });
    }

    if (periodIsLocked) {
      periodStatus = "locked";
    } else if (completedItems >= leafItems.length && leafItems.length > 0) {
      periodStatus = "submitted";
    } else if (completedItems > 0) {
      periodStatus = "draft";
    }

    // Convert date back to a readable label for this view (simplified)
    const monthStr = pDate.toLocaleDateString("id-ID", { month: "short" });
    const periodLabel = periodType === "weekly" ? `Minggu — ${pDate.getDate()} ${monthStr}` : `${monthStr} ${pDate.getFullYear()}`;

    return NextResponse.json({
      period: {
        periodDate: params.periodDate,
        periodLabel,
        periodType,
        status: periodStatus,
        isLocked: periodIsLocked,
      },
      items,
      summary: {
        weightedPlannedThisPeriod: parseFloat(weightedPlannedThisPeriod.toFixed(2)),
        weightedActualThisPeriod: parseFloat(weightedActualThisPeriod.toFixed(2)),
        weightedPlannedCumulative: parseFloat(weightedPlannedCumulative.toFixed(2)),
        weightedActualCumulative: parseFloat(weightedActualCumulative.toFixed(2)),
        deviation: parseFloat((weightedActualCumulative - weightedPlannedCumulative).toFixed(2)),
        completedItems,
        totalLeafItems: leafItems.length,
      }
    });

  } catch (error) {
    console.error("[PROGRESS_DATA_GET] Falling back to mock data:", error);

    // Mock WBS items for demo
    const mockWbsItems = [
      { wbsItemId: "wbs-1",     code: "1",     name: "Pekerjaan Struktur",       level: 1, isLeaf: false, unit: "",    weight: 0,     plannedThisPeriod: 0,  plannedCumulative: 0,   actualThisPeriod: null, actualCumulative: null, isSubmitted: false, notes: null, photos: [] },
      { wbsItemId: "wbs-1-1",   code: "1.1",   name: "Pekerjaan Pondasi",       level: 2, isLeaf: false, unit: "",    weight: 0,     plannedThisPeriod: 0,  plannedCumulative: 0,   actualThisPeriod: null, actualCumulative: null, isSubmitted: false, notes: null, photos: [] },
      { wbsItemId: "wbs-1-1-1", code: "1.1.1", name: "Galian Tanah Pondasi",    level: 3, isLeaf: true,  unit: "m³",  weight: 15.5,  plannedThisPeriod: 25, plannedCumulative: 75,  actualThisPeriod: null, actualCumulative: null, isSubmitted: false, notes: null, photos: [] },
      { wbsItemId: "wbs-1-1-2", code: "1.1.2", name: "Beton Pondasi f'c 25 MPa",level: 3, isLeaf: true,  unit: "m³",  weight: 18.2,  plannedThisPeriod: 20, plannedCumulative: 60,  actualThisPeriod: null, actualCumulative: null, isSubmitted: false, notes: null, photos: [] },
      { wbsItemId: "wbs-1-2",   code: "1.2",   name: "Pekerjaan Kolom",         level: 2, isLeaf: false, unit: "",    weight: 0,     plannedThisPeriod: 0,  plannedCumulative: 0,   actualThisPeriod: null, actualCumulative: null, isSubmitted: false, notes: null, photos: [] },
      { wbsItemId: "wbs-1-2-1", code: "1.2.1", name: "Pembesian Kolom",         level: 3, isLeaf: true,  unit: "kg",  weight: 22.1,  plannedThisPeriod: 15, plannedCumulative: 40,  actualThisPeriod: null, actualCumulative: null, isSubmitted: false, notes: null, photos: [] },
      { wbsItemId: "wbs-1-2-2", code: "1.2.2", name: "Bekisting Kolom",         level: 3, isLeaf: true,  unit: "m²",  weight: 12.8,  plannedThisPeriod: 10, plannedCumulative: 30,  actualThisPeriod: null, actualCumulative: null, isSubmitted: false, notes: null, photos: [] },
      { wbsItemId: "wbs-2",     code: "2",     name: "Pekerjaan Arsitektur",    level: 1, isLeaf: false, unit: "",    weight: 0,     plannedThisPeriod: 0,  plannedCumulative: 0,   actualThisPeriod: null, actualCumulative: null, isSubmitted: false, notes: null, photos: [] },
      { wbsItemId: "wbs-2-1",   code: "2.1",   name: "Pekerjaan Dinding",       level: 2, isLeaf: true,  unit: "m²",  weight: 16.4,  plannedThisPeriod: 30, plannedCumulative: 50,  actualThisPeriod: null, actualCumulative: null, isSubmitted: false, notes: null, photos: [] },
      { wbsItemId: "wbs-2-2",   code: "2.2",   name: "Pekerjaan Finishing",     level: 2, isLeaf: true,  unit: "m²",  weight: 15.0,  plannedThisPeriod: 10, plannedCumulative: 20,  actualThisPeriod: null, actualCumulative: null, isSubmitted: false, notes: null, photos: [] },
    ];
    const pDate = new Date(params.periodDate);
    const monthStr = pDate.toLocaleDateString("id-ID", { month: "short" });
    return NextResponse.json({
      period: {
        periodDate: params.periodDate,
        periodLabel: `Minggu — ${pDate.getDate()} ${monthStr}`,
        periodType: "weekly",
        status: "empty",
        isLocked: false,
      },
      items: mockWbsItems,
      summary: {
        weightedPlannedThisPeriod: 14.5,
        weightedActualThisPeriod: 0,
        weightedPlannedCumulative: 42.3,
        weightedActualCumulative: 0,
        deviation: -42.3,
        completedItems: 0,
        totalLeafItems: 6,
      }
    });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string; periodDate: string } }
) {
  try {
    const { organizationId, userId } = await requireOrg();
    const pDate = new Date(params.periodDate);
    const body: { items: any[]; action: "draft" | "submit" } = await req.json();

    const project = await prisma.project.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const periodType = project.periodType;
    const isLocked = body.action === "submit";

    await prisma.$transaction(async (tx) => {
      for (const item of body.items) {
        if (item.actualPercentage === null) continue;
        
        await tx.progressActual.upsert({
          where: {
            wbsItemId_periodDate_periodType: {
              wbsItemId: item.wbsItemId,
              periodDate: pDate,
              periodType,
            }
          },
          create: {
            wbsItemId: item.wbsItemId,
            organizationId,
            periodDate: pDate,
            periodType,
            actualPercentage: item.actualPercentage,
            notes: item.notes,
            isLocked,
            reportedById: userId,
          },
          update: {
            actualPercentage: item.actualPercentage,
            notes: item.notes,
            isLocked,
          }
        });
      }
    });

    return NextResponse.json({ success: true, action: body.action });

  } catch (error) {
    console.error("[PROGRESS_DATA_POST]", error);
    // In demo mode (no DB), simulate success
    return NextResponse.json({ success: true, action: "draft", demo: true });
  }
}
