export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addWeeks, addMonths, startOfWeek, startOfMonth } from "date-fns";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await requireOrg();

    const project = await prisma.project.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const periodType = project.periodType as "weekly" | "monthly";

    // 1. Generate periods
    const periods: any[] = [];
    if (periodType === "weekly") {
      let current = startOfWeek(start, { weekStartsOn: 1 });
      const lastWeek = startOfWeek(end, { weekStartsOn: 1 });
      while (current <= lastWeek) {
        periods.push({
          date: new Date(current),
          dateStr: current.toISOString().split("T")[0],
        });
        current = addWeeks(current, 1);
      }
    } else {
      let current = startOfMonth(start);
      const lastMonth = startOfMonth(end);
      while (current <= lastMonth) {
        periods.push({
          date: new Date(current),
          dateStr: current.toISOString().split("T")[0],
        });
        current = addMonths(current, 1);
      }
    }

    // 2. Fetch actuals to determine status
    const actuals = await prisma.progressActual.findMany({
      where: {
        organizationId,
        wbsItem: { projectId: params.id },
      },
      select: {
        periodDate: true,
        isLocked: true,
        updatedAt: true,
        reportedBy: { select: { fullName: true } },
      },
    });

    const leafItemsCount = await prisma.wbsItem.count({
      where: { projectId: params.id, organizationId, isLeaf: true },
    });

    // Group actuals by periodDate (as string)
    const actualsByPeriod: Record<string, typeof actuals> = {};
    for (const a of actuals) {
      const pStr = a.periodDate.toISOString().split("T")[0];
      if (!actualsByPeriod[pStr]) actualsByPeriod[pStr] = [];
      actualsByPeriod[pStr].push(a);
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    // Find the "current" period (closest past period or exactly today)
    let currentPeriodIdx = -1;
    for (let i = periods.length - 1; i >= 0; i--) {
      if (periods[i].date <= today) {
        currentPeriodIdx = i;
        break;
      }
    }
    if (currentPeriodIdx === -1 && periods.length > 0) currentPeriodIdx = 0;

    const result = periods.map((p, i) => {
      const periodActuals = actualsByPeriod[p.dateStr] || [];
      const hasActuals = periodActuals.length > 0;
      const allLocked = hasActuals && periodActuals.every((a) => a.isLocked);
      const itemsFilled = periodActuals.length;
      
      let status = "empty";
      if (allLocked) {
        status = "locked";
      } else if (itemsFilled >= leafItemsCount && leafItemsCount > 0) {
        status = "submitted";
      } else if (hasActuals) {
        status = "draft";
      }

      // Format label
      let label = "";
      if (periodType === "weekly") {
        const dEnd = addWeeks(p.date, 1);
        dEnd.setDate(dEnd.getDate() - 1);
        const startStr = p.date.getDate();
        const endStr = dEnd.getDate();
        const monthStr = p.date.toLocaleDateString("id-ID", { month: "short" });
        const yearStr = p.date.getFullYear();
        label = `Minggu ${i + 1} — ${startStr}–${endStr} ${monthStr} ${yearStr}`;
      } else {
        const monthStr = p.date.toLocaleDateString("id-ID", { month: "long" });
        const yearStr = p.date.getFullYear();
        label = `${monthStr} ${yearStr}`;
      }

      const latestActual = periodActuals.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

      return {
        periodDate: p.dateStr,
        periodLabel: label,
        periodType,
        status,
        submittedAt: latestActual ? latestActual.updatedAt.toISOString() : null,
        submittedByName: latestActual?.reportedBy?.fullName || null,
        isCurrent: i === currentPeriodIdx,
        isPast: p.date < today && i !== currentPeriodIdx,
        isFuture: p.date > today && i !== currentPeriodIdx,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PROGRESS_PERIODS_GET] Falling back to mock data:", error);
    
    // Generate mock periods based on current date (last 8 weeks)
    const today = new Date();
    const mockPeriods = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (7 * (7 - i))); // go back 7 weeks, then forward
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1); // Monday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const dateStr = weekStart.toISOString().split("T")[0];
      const isCurrent = i === 7;
      const startDay = weekStart.getDate();
      const endDay = weekEnd.getDate();
      const monthStr = weekStart.toLocaleDateString("id-ID", { month: "short" });
      const yearStr = weekStart.getFullYear();
      return {
        periodDate: dateStr,
        periodLabel: `Minggu ${i + 1} — ${startDay}–${endDay} ${monthStr} ${yearStr}`,
        periodType: "weekly",
        status: i < 6 ? "empty" : i === 6 ? "draft" : "empty",
        submittedAt: null,
        submittedByName: null,
        isCurrent,
        isPast: !isCurrent && i < 7,
        isFuture: false,
      };
    });
    return NextResponse.json(mockPeriods);
  }
}
