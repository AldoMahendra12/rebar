import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Props {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Props) {
  try {
    const { organizationId } = await requireOrg();

    const docs = await (prisma as any).projectDocument?.findMany({
      where: { projectId: params.id, organizationId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(docs ?? []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request, { params }: Props) {
  try {
    const { organizationId, userId } = await requireOrg();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileType = (formData.get("fileType") as string) ?? "other";

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // In production: upload to Cloudflare R2 / UploadThing here
    // For now return a mock record indicating success
    const doc = {
      id: `doc-${Date.now()}`,
      projectId: params.id,
      organizationId,
      name: file.name,
      fileUrl: "#", // Replace with actual storage URL when R2/UploadThing is configured
      fileType,
      uploadedBy: userId,
      createdAt: new Date().toISOString(),
      sizeBytes: file.size,
    };

    // Persist to DB if schema has projectDocument table
    try {
      const saved = await (prisma as any).projectDocument?.create({ data: doc });
      if (saved) return NextResponse.json(saved);
    } catch {}

    // Fallback: return the constructed doc object
    return NextResponse.json(doc);
  } catch (error) {
    console.error("[DOCUMENTS_POST]", error);
    return NextResponse.json({ error: "Gagal mengupload dokumen" }, { status: 500 });
  }
}
