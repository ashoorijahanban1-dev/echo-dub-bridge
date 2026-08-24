import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q");

    const where: any = { isPublished: true };
    if (category) where.category = { contains: category };
    if (q) {
      where.OR = [
        { titleFa: { contains: q } },
        { titleEn: { contains: q } },
        { instructor: { contains: q } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        chapters: {
          include: { episodes: true },
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(courses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      slug,
      titleFa,
      titleEn,
      descriptionFa,
      instructor,
      instructorRole,
      category,
      level,
      thumbnailUrl,
      badgeText,
      chapters
    } = body;

    if (!slug || !titleFa) {
      return NextResponse.json({ error: "slug and titleFa are required" }, { status: 400 });
    }

    // Upsert Course
    const course = await prisma.course.upsert({
      where: { slug },
      update: {
        titleFa,
        titleEn: titleEn || titleFa,
        descriptionFa: descriptionFa || "",
        instructor: instructor || "مدرس بین‌المللی",
        instructorRole: instructorRole || "Tech Lead & Educator",
        category: category || "برنامه‌نویسی و DevOps",
        level: level || "متوسط",
        thumbnailUrl: thumbnailUrl || "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80",
        badgeText: badgeText || "دوبله اختصاصی AI",
        isPublished: true,
      },
      create: {
        slug,
        titleFa,
        titleEn: titleEn || titleFa,
        descriptionFa: descriptionFa || "",
        instructor: instructor || "مدرس بین‌المللی",
        instructorRole: instructorRole || "Tech Lead & Educator",
        category: category || "برنامه‌نویسی و DevOps",
        level: level || "متوسط",
        thumbnailUrl: thumbnailUrl || "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80",
        badgeText: badgeText || "دوبله اختصاصی AI",
        isPublished: true,
      }
    });

    // Process Chapters & Episodes if provided
    if (chapters && Array.isArray(chapters)) {
      for (const chData of chapters) {
        let chapter = await prisma.chapter.findFirst({
          where: { courseId: course.id, orderIndex: chData.orderIndex || 1 }
        });

        if (!chapter) {
          chapter = await prisma.chapter.create({
            data: {
              courseId: course.id,
              titleFa: chData.titleFa || `فصل ${chData.orderIndex}`,
              orderIndex: chData.orderIndex || 1,
            }
          });
        }

        if (chData.episodes && Array.isArray(chData.episodes)) {
          for (const epData of chData.episodes) {
            const existingEp = await prisma.episode.findFirst({
              where: { chapterId: chapter.id, episodeNumber: epData.episodeNumber }
            });

            if (existingEp) {
              await prisma.episode.update({
                where: { id: existingEp.id },
                data: {
                  titleFa: epData.titleFa,
                  titleEn: epData.titleEn || epData.titleFa,
                  durationSeconds: epData.durationSeconds || 0,
                  streamUrl: epData.streamUrl || `/api/stream/tg/${epData.telegramMessageId}`,
                  telegramFileId: epData.telegramFileId,
                  telegramMessageId: epData.telegramMessageId,
                }
              });
            } else {
              await prisma.episode.create({
                data: {
                  chapterId: chapter.id,
                  titleFa: epData.titleFa,
                  titleEn: epData.titleEn || epData.titleFa,
                  episodeNumber: epData.episodeNumber || 1,
                  durationSeconds: epData.durationSeconds || 0,
                  streamUrl: epData.streamUrl || `/api/stream/tg/${epData.telegramMessageId}`,
                  telegramFileId: epData.telegramFileId,
                  telegramMessageId: epData.telegramMessageId,
                  isFreePreview: epData.isFreePreview || (epData.episodeNumber === 1),
                }
              });
            }
          }
        }
      }
    }

    const updatedCourse = await prisma.course.findUnique({
      where: { id: course.id },
      include: {
        chapters: {
          include: { episodes: true },
          orderBy: { orderIndex: "asc" }
        }
      }
    });

    return NextResponse.json({ success: true, course: updatedCourse });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
