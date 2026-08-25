import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishCourseToTelegram } from "@/lib/telegram-publisher";
import { startDubbingPipeline } from "@/lib/pipeline-orchestrator";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const courses = await prisma.discoveredCourse.findMany({
      where,
      orderBy: { discoveredAt: "desc" }
    });

    return NextResponse.json(courses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { courseIds, action, voiceGender } = await request.json();

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ error: "لیست شناسه‌های دوره الزامی است." }, { status: 400 });
    }

    if (action === "REJECT") {
      await prisma.discoveredCourse.updateMany({
        where: { id: { in: courseIds } },
        data: { status: "REJECTED" }
      });
      return NextResponse.json({ success: true, message: `${courseIds.length} دوره رد شد.` });
    }

    if (action === "APPROVE") {
      const coursesToIngest = await prisma.discoveredCourse.findMany({
        where: { id: { in: courseIds } }
      });

      const results = [];

      for (const disc of coursesToIngest) {
        // Mark status as PROCESSING
        await prisma.discoveredCourse.update({
          where: { id: disc.id },
          data: { status: "PROCESSING", approvedAt: new Date() }
        });

        // Trigger Master Pipeline Orchestrator (Iran -> US -> Telegram -> Website)
        const pipelineResult = await startDubbingPipeline({
          discoveredCourseId: disc.id,
          slug: disc.slug,
          titleFa: disc.titleFa,
          titleEn: disc.titleEn,
          instructor: disc.instructor,
          category: disc.category,
          voiceGender: voiceGender || "male"
        });

        results.push({ id: disc.id, titleFa: disc.titleFa, slug: disc.slug, batchId: pipelineResult.batchId });
      }

      return NextResponse.json({
        success: true,
        message: `🎉 تعداد ${results.length} دوره به خط تولید متصل و فرآیند دوبله در سرور آمریکا و آپلود تلگرام آغاز شد!`,
        results
      });
    }

    return NextResponse.json({ error: "عملیات نامعتبر است." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
