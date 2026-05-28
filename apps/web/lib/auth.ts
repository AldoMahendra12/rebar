import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function requireAuth(): Promise<string> {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function requireOrg(): Promise<{
  userId: string;
  organizationId: string;
  role: string;
}> {
  const userId = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, role: true },
  });
  if (!user) throw new Error("USER_NOT_ONBOARDED");
  return { userId, organizationId: user.organizationId, role: user.role };
}
