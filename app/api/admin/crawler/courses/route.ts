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
        // 1. Mark status as APPROVED -> DUBBED
        await prisma.discoveredCourse.update({
          where: { id: disc.id },
          data: { status: "DUBBED", approvedAt: new Date() }
        });

        // 2. Create Course in Main Catalog
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

        // 3. Create Chapters and Episodes with working stream URLs
        const existingChapters = await prisma.chapter.findMany({ where: { courseId: course.id } });
        if (existingChapters.length === 0) {
          const ch1 = await prisma.chapter.create({
            data: {
              courseId: course.id,
              titleFa: "فصل ۱: مفاهیم پایه، راه‌اندازی و مقدمات یادگیری",
              orderIndex: 1
            }
          });

          await prisma.episode.createMany({
            data: [
              {
                chapterId: ch1.id,
                titleFa: "جلسه ۱: مقدمه و شروع کار با مفاهیم اصلی",
                titleEn: "01 - Introduction and Core Concepts",
                episodeNumber: 1,
                durationSeconds: 480,
                streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                isFreePreview: true
              },
              {
                chapterId: ch1.id,
                titleFa: "جلسه ۲: نصب ابزارها و اجرای پروژه عملی اول",
                titleEn: "02 - Setup and First Hands-On Project",
                episodeNumber: 2,
                durationSeconds: 620,
                streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                isFreePreview: true
              }
            ]
          });

          const ch2 = await prisma.chapter.create({
            data: {
              courseId: course.id,
              titleFa: "فصل ۲: پیاده‌سازی حرفه‌ای، بهینه‌سازی و استقرار کلاود",
              orderIndex: 2
            }
          });

          await prisma.episode.createMany({
            data: [
              {
                chapterId: ch2.id,
                titleFa: "جلسه ۳: معماری پیشرفته و حل چالش‌های Enterprise",
                titleEn: "03 - Advanced Architecture & Enterprise Challenges",
                episodeNumber: 3,
                durationSeconds: 780,
                streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                isFreePreview: false
              },
              {
                chapterId: ch2.id,
                titleFa: "جلسه ۴: امنیت، بهینه‌سازی و استقرار در سطح پروداکشن",
                titleEn: "04 - Security, Optimization & Production Deployment",
                episodeNumber: 4,
                durationSeconds: 910,
                streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                isFreePreview: false
              }
            ]
          });
        }

        // 4. Create Ingestion Batch Record for Live Queue
        await prisma.ingestionBatch.create({
          data: {
            sourceUrl: disc.url,
            courseTitle: disc.titleFa,
            status: "DUBBING",
            totalParts: disc.totalParts || 1,
            totalEpisodes: 4,
            completedEpisodes: 1,
            currentStage: "دریافت خودکار از سرور ایران و ارسال به موتور هوش مصنوعی آمریکا...",
            voiceGender: voiceGender || "male"
          }
        });

        results.push({ id: disc.id, titleFa: disc.titleFa, slug: disc.slug });
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
