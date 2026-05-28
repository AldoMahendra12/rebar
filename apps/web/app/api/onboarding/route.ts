import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 60);
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyName, size } = await req.json();

    if (!companyName || !size) {
      return NextResponse.json(
        { error: "Nama perusahaan dan ukuran wajib diisi" },
        { status: 400 }
      );
    }

    // Check if user already has an org
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User sudah terdaftar di organisasi" },
        { status: 409 }
      );
    }

    // Generate unique slug
    let slug = slugify(companyName);
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Set trial end date: 14 days from now
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create org + user in one transaction
    const org = await prisma.organization.create({
      data: {
        name: companyName,
        slug,
        size,
        subscriptionTier: "trial",
        subscriptionStatus: "trial",
        trialEndsAt,
      },
    });

    // Get user info from Clerk (will use userId as-is)
    await prisma.user.create({
      data: {
        id: userId,
        organizationId: org.id,
        fullName: "Owner",
        email: "",
        role: "owner",
      },
    });

    return NextResponse.json({ success: true, organizationId: org.id });
  } catch (error) {
    console.error("[ONBOARDING]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
