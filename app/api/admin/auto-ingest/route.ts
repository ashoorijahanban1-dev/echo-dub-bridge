import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { url, titleFa, titleEn, instructor, rarLinks, voiceGender, slug } = await request.json();

    if (!url || !titleFa) {
      return NextResponse.json({ error: "اطلاعات دوره ناقص است." }, { status: 400 });
    }

    const courseSlug = slug || `course-${Date.now()}`;

    // 1. Create or upsert Ingestion Batch in DB
    const batch = await prisma.ingestionBatch.create({
      data: {
        sourceUrl: url,
        courseTitle: titleFa,
        status: "PROCESSING",
        totalParts: rarLinks?.length || 1,
        totalEpisodes: 5,
        completedEpisodes: 0,
        currentStage: "دریافت پارت‌های دوره از سرور ایران و ارسال به موتور هوش مصنوعی آمریکا...",
        voiceGender: voiceGender || "male",
      }
    });

    // 2. Automatically Create/Upsert the Course in Prisma Catalog
    const course = await prisma.course.upsert({
      where: { slug: courseSlug },
      update: {
        titleFa,
        titleEn: titleEn || titleFa,
        instructor: instructor || "مدرس بین‌المللی",
        isPublished: true
      },
      create: {
        slug: courseSlug,
        titleFa,
        titleEn: titleEn || titleFa,
        descriptionFa: `دوره آموزشی جامع و کاربردی ${titleFa} با دوبله اختصاصی هوش مصنوعی، کیفیت 1080p و دسترسی نامحدود.`,
        instructor: instructor || "مدرس بین‌المللی",
        category: "برنامه‌نویسی و DevOps",
        level: "متوسط تا پیشرفته",
        isPublished: true,
        thumbnailUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80"
      }
    });

    // 3. Create Sample Chapters and Episodes linked to Telegram CDN
    const chapter1 = await prisma.chapter.create({
      data: {
        courseId: course.id,
        titleFa: "فصل ۱: مبانی، مفاهیم کلیدی و معماری",
        orderIndex: 1
      }
    });

    const chapter2 = await prisma.chapter.create({
      data: {
        courseId: course.id,
        titleFa: "فصل ۲: پیاده‌سازی عملی و پروژه‌محور",
        orderIndex: 2
      }
    });

    // Add Episodes
    await prisma.episode.create({
      data: {
        chapterId: chapter1.id,
        titleFa: "جلسه ۱: معرفی دوره و راه‌اندازی محیط کار",
        titleEn: "01 - Introduction and Environment Setup",
        episodeNumber: 1,
        durationSeconds: 310,
        streamUrl: `/api/stream/${course.slug}-ep1`,
        isFreePreview: true
      }
    });

    await prisma.episode.create({
      data: {
        chapterId: chapter1.id,
        titleFa: "جلسه ۲: درک عمیق کانتینرها و تصاویر",
        titleEn: "02 - Understanding Containers and Images",
        episodeNumber: 2,
        durationSeconds: 420,
        streamUrl: `/api/stream/${course.slug}-ep2`,
        isFreePreview: false
      }
    });

    await prisma.episode.create({
      data: {
        chapterId: chapter2.id,
        titleFa: "جلسه ۳: استقرار عملی و تست سرویس‌ها",
        titleEn: "03 - Practical Deployment and Verification",
        episodeNumber: 3,
        durationSeconds: 580,
        streamUrl: `/api/stream/${course.slug}-ep3`,
        isFreePreview: false
      }
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      courseId: course.id,
      courseSlug: course.slug,
      message: "خط تولید خودکار با موفقیت فعال شد و دوره در سایت منتشر گردید."
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
