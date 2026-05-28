import { NextRequest, NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await requireOrg();
    const { name } = await req.json();

    if (!name || name.length < 2) {
      return NextResponse.json({ code: "" });
    }

    // Generate base code dari nama proyek
    // Ambil huruf pertama tiap kata, max 4 huruf, uppercase
    const words = name.trim().split(/\s+/);
    let baseCode = words
      .map((w: string) => w[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 4);

    if (baseCode.length < 2) {
      baseCode = name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "");
    }

    // Cari nomor urut yang belum dipakai
    let counter = 1;
    let candidateCode = "";

    while (counter <= 999) {
      candidateCode = `${baseCode}-${String(counter).padStart(3, "0")}`;
      const existing = await prisma.project.findFirst({
        where: { organizationId, code: candidateCode },
      });
      if (!existing) break;
      counter++;
    }

    return NextResponse.json({ code: candidateCode });
  } catch {
    return NextResponse.json({ code: "" });
  }
}
