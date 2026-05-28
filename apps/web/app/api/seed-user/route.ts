import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cek apakah user sudah ada
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (existingUser) {
      const org = await prisma.organization.findUnique({ where: { id: existingUser.organizationId } });
      return NextResponse.json({ success: true, message: "User sudah terdaftar", user: existingUser, org });
    }

    // Ambil info dari Clerk
    const clerkUser = await currentUser();
    const fullName = clerkUser
      ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || "Owner"
      : "Owner";
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";

    const body = await req.json().catch(() => ({}));
    const companyName = body.companyName || "Perusahaan Saya";
    const size = body.size || "<10";

    // Buat slug unik
    const slugBase = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 60);
    const existing = await prisma.organization.findUnique({ where: { slug: slugBase } });
    const slug = existing ? `${slugBase}-${Date.now().toString(36)}` : slugBase;

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Buat org + user
    const org = await prisma.organization.create({
      data: { name: companyName, slug, size, subscriptionTier: "trial", subscriptionStatus: "trial", trialEndsAt },
    });

    const user = await prisma.user.create({
      data: { id: userId, organizationId: org.id, fullName, email, role: "owner" },
    });

    return NextResponse.json({ success: true, user, org });
  } catch (error) {
    console.error("[SEED USER]", error);
    return NextResponse.json(
      { error: "Gagal seed: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const org = user ? await prisma.organization.findUnique({ where: { id: user.organizationId } }) : null;

    return NextResponse.json({ userId, user, org });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
