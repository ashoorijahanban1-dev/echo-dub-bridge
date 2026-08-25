import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        // 1. Mark status as APPROVED -> PROCESSING
        await prisma.discoveredCourse.update({
          where: { id: disc.id },
          data: { status: "PROCESSING", approvedAt: new Date() }
        });

        // 2. Create Course in Main Catalog if not exists
        const course = await prisma.course.upsert({
          where: { slug: disc.slug },
          update: {
            titleFa: disc.titleFa,
            titleEn: disc.titleEn || disc.titleFa,
            isPublished: true
          },
          create: {
            slug: disc.slug,
            titleFa: disc.titleFa,
            titleEn: disc.titleEn || disc.titleFa,
            descriptionFa: `دوره آموزشی جامع ${disc.titleFa} با دوبله اختصاصی هوش مصنوعی فارسی، کیفیت 1080p و دسترسی نامحدود.`,
            instructor: disc.instructor || "مدرس بین‌المللی",
            category: disc.category || "برنامه‌نویسی و DevOps",
            level: "متوسط تا پیشرفته",
            thumbnailUrl: disc.thumbnailUrl || "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80",
            isPublished: true
          }
        });

        // 3. Create Chapters and Episodes
        const chapter = await prisma.chapter.create({
          data: {
            courseId: course.id,
            titleFa: "فصل ۱: مبانی، مفاهیم و آموزش پروژه‌محور",
            orderIndex: 1
          }
        });

        await prisma.episode.create({
          data: {
            chapterId: chapter.id,
            titleFa: "جلسه ۱: مقدمه و شروع کار با مفاهیم اصلی",
            titleEn: "01 - Introduction and Core Concepts",
            episodeNumber: 1,
            durationSeconds: 360,
            streamUrl: `/api/stream/${course.slug}-ep1`,
            isFreePreview: true
          }
        });

        // 4. Create Ingestion Batch Record
        await prisma.ingestionBatch.create({
          data: {
            sourceUrl: disc.url,
            courseTitle: disc.titleFa,
            status: "DUBBING",
            totalParts: disc.totalParts || 1,
            totalEpisodes: 3,
            completedEpisodes: 1,
            currentStage: "دریافت خودکار از سرور ایران و ارسال به موتور هوش مصنوعی آمریکا...",
            voiceGender: voiceGender || "male"
          }
        });

        // 5. Update DiscoveredCourse to DUBBED
        await prisma.discoveredCourse.update({
          where: { id: disc.id },
          data: { status: "DUBBED" }
        });

        results.push({ id: disc.id, titleFa: disc.titleFa, slug: course.slug });
      }

      return NextResponse.json({
        success: true,
        message: `🎉 تعداد ${results.length} دوره با موفقیت تایید و به خط تولید خودکار هوش مصنوعی ارسال شدند!`,
        results
      });
    }

    return NextResponse.json({ error: "عملیات نامعتبر است." }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
