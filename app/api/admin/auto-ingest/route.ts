import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startDubbingPipeline } from "@/lib/pipeline-orchestrator";

export async function POST(request: Request) {
  try {
    const { url, titleFa, titleEn, instructor, rarLinks, voiceGender, slug } = await request.json();

    if (!url || !titleFa) {
      return NextResponse.json({ error: "اطلاعات دوره ناقص است." }, { status: 400 });
    }

    const courseSlug = slug || `course-${Date.now()}`;

    // Execute End-to-End Orchestrated Pipeline
    const pipelineResult = await startDubbingPipeline({
      slug: courseSlug,
      videoUrl: url,
      titleFa,
      titleEn,
      instructor: instructor || "مدرس بین‌المللی",
      voiceGender: voiceGender || "male-warm"
    });

    return NextResponse.json({
      success: true,
      batchId: pipelineResult.batchId,
      courseId: pipelineResult.courseId,
      courseSlug: pipelineResult.courseSlug,
      message: "خط تولید خودکار با موفقیت فعال شد، ویدیو به سرور آمریکا ارسال و فرآیند دوبله و انتشار در تلگرام آغاز گردید."
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا در استارت خط تولید خودکار" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const batches = await prisma.ingestionBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 10
    });
    return NextResponse.json(batches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
