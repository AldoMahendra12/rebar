export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Mock upload endpoint since UploadThing is not fully configured
export async function POST(
  req: Request,
  { params }: { params: { id: string; periodDate: string } }
) {
  try {
    const { organizationId, userId } = await requireOrg();
    const formData = await req.formData();
    const wbsItemId = formData.get("wbsItemId") as string;
    const file = formData.get("file") as File;
    
    if (!wbsItemId || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pDate = new Date(params.periodDate);

    const project = await prisma.project.findFirst({
      where: { id: params.id, organizationId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Ensure ProgressActual exists
    let actual = await prisma.progressActual.findUnique({
      where: {
        wbsItemId_periodDate_periodType: {
          wbsItemId,
          periodDate: pDate,
          periodType: project.periodType,
        }
      }
    });

    if (!actual) {
      actual = await prisma.progressActual.create({
        data: {
          wbsItemId,
          organizationId,
          periodDate: pDate,
          periodType: project.periodType,
          actualPercentage: 0, // Create an empty actual to attach the photo
          reportedById: userId,
        }
      });
    }

    // Mock UploadThing: In a real app, you would upload the file to UploadThing here
    // const uploadedFiles = await utapi.uploadFiles([file]);
    // const fileUrl = uploadedFiles[0].data.url;
    
    const fileUrl = `mock-url-${Date.now()}-${file.name}`;
    const fileName = file.name;

    const photo = await prisma.progressPhoto.create({
      data: {
        progressActualId: actual.id,
        fileUrl,
        fileName,
      }
    });

    return NextResponse.json({ success: true, photo });

  } catch (error) {
    console.error("[PROGRESS_PHOTO_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
