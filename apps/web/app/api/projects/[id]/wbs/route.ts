export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// Prisma client is used to perform sync directly

// We can use a simple function to generate unique IDs if needed, or uuid. 
// Let's generate a safe unique ID that fits the standard cuid length or use standard UUID.
function generateId() {
  return "wbs_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

interface WbsRowPayload {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  level: number;
  unit: string | null;
  volume: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
  weight: number | null;
  sortOrder: number;
  isLeaf: boolean;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await requireOrg();

    const wbsItems = await prisma.wbsItem.findMany({
      where: {
        projectId: params.id,
        organizationId,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    // Convert Decimals to numbers for frontend safety
    const formatted = wbsItems.map((item) => ({
      ...item,
      volume: item.volume ? Number(item.volume) : null,
      unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
      totalPrice: item.totalPrice ? Number(item.totalPrice) : null,
      weight: item.weight ? Number(item.weight) : null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[WBS_GET]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data WBS" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { organizationId } = await requireOrg();
    const { rows }: { rows: WbsRowPayload[] } = await req.json();

    if (!Array.isArray(rows)) {
      return NextResponse.json(
        { error: "Payload harus berupa array rows" },
        { status: 400 }
      );
    }

    // Verify project exists and belongs to organization
    const project = await prisma.project.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Proyek tidak ditemukan" },
        { status: 404 }
      );
    }

    // 1. Map temporary client-side IDs to permanent database IDs
    const idMap = new Map<string, string>();
    const processedRows = rows.map((row) => {
      let finalId = row.id;
      if (row.id.startsWith("wbs-new-")) {
        finalId = generateId();
        idMap.set(row.id, finalId);
      }
      return { ...row, finalId };
    });

    // 2. Update parentId pointers based on the map
    const finalRows = processedRows.map((row) => {
      let finalParentId = row.parentId;
      if (row.parentId && idMap.has(row.parentId)) {
        finalParentId = idMap.get(row.parentId)!;
      }
      return {
        ...row,
        parentId: finalParentId,
      };
    });

    // 3. Recalculate weights on the server for maximum consistency
    const leafNodes = finalRows.filter((r) => r.isLeaf && r.volume && r.unitPrice);
    const totalContractValue = leafNodes.reduce((sum, r) => {
      const vol = Number(r.volume || 0);
      const price = Number(r.unitPrice || 0);
      return sum + (vol * price);
    }, 0);

    const rowsWithServerWeights = finalRows.map((row) => {
      let calculatedTotalPrice = null;
      let calculatedWeight = null;

      if (row.isLeaf && row.volume && row.unitPrice) {
        calculatedTotalPrice = Number(row.volume) * Number(row.unitPrice);
        if (totalContractValue > 0) {
          calculatedWeight = parseFloat(((calculatedTotalPrice / totalContractValue) * 100).toFixed(4));
        }
      }

      return {
        ...row,
        totalPrice: calculatedTotalPrice,
        weight: calculatedWeight,
      };
    });

    // 4. Perform database sync within a transaction
    await prisma.$transaction(async (tx) => {
      // Get all current IDs in DB
      const currentDbItems = await tx.wbsItem.findMany({
        where: { projectId: params.id, organizationId },
        select: { id: true },
      });
      const dbIds = new Set(currentDbItems.map((item) => item.id));

      const payloadIds = new Set(rowsWithServerWeights.map((r) => r.finalId));

      // Items to delete
      const idsToDelete = Array.from(dbIds).filter((id) => !payloadIds.has(id));

      if (idsToDelete.length > 0) {
        await tx.wbsItem.deleteMany({
          where: {
            id: { in: idsToDelete },
            projectId: params.id,
            organizationId,
          },
        });
      }

      // Upsert the rest
      for (const row of rowsWithServerWeights) {
        const data = {
          projectId: params.id,
          organizationId,
          parentId: row.parentId,
          code: row.code,
          name: row.name,
          level: row.level,
          unit: row.unit,
          volume: row.volume !== null ? row.volume : null,
          unitPrice: row.unitPrice !== null ? row.unitPrice : null,
          totalPrice: row.totalPrice !== null ? row.totalPrice : null,
          weight: row.weight !== null ? row.weight : null,
          sortOrder: row.sortOrder,
          isLeaf: row.isLeaf,
        };

        if (dbIds.has(row.finalId)) {
          // Update
          await tx.wbsItem.update({
            where: { id: row.finalId },
            data,
          });
        } else {
          // Create
          await tx.wbsItem.create({
            data: {
              id: row.finalId,
              ...data,
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WBS_SYNC]", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data WBS" },
      { status: 500 }
    );
  }
}
