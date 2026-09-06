import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const { slug, episodeId, usOutputFile, telegramFileId, telegramMessageId, episodeFileName } = await request.json();

    if (!slug || !usOutputFile) {
      return NextResponse.json({ error: "slug و usOutputFile الزامی است." }, { status: 400 });
    }

    const courseDir = path.join(process.cwd(), "storage", "courses", slug);
    if (!fs.existsSync(courseDir)) {
      fs.mkdirSync(courseDir, { recursive: true });
    }

    const localFileName = episodeFileName || "01. Bird strike dataset.mp4";
    const destPath = path.join(courseDir, localFileName);
    const usUrl = `http://ai.rpim.ir/api/v1/download/output/${encodeURIComponent(usOutputFile)}`;

    console.log(`[SyncDubbed] Downloading ${usUrl} -> ${destPath}...`);

    const curlCmd = `curl -sL --fail --connect-timeout 30 --max-time 600 -o "${destPath}.tmp" "${usUrl}" && mv "${destPath}.tmp" "${destPath}"`;
    await execPromise(curlCmd);

    const stats = fs.existsSync(destPath) ? fs.statSync(destPath) : null;
    const fileSizeMb = stats ? (stats.size / (1024 * 1024)).toFixed(2) : 0;

    // Ensure course and chapter exist in DB
    const course = await prisma.course.upsert({
      where: { slug },
      update: { isPublished: true },
      create: {
        slug,
        titleFa: "دوره جامع Data Storytelling با پایتون",
        titleEn: slug,
        descriptionFa: "دوره آموزشی تخصصی با دوبله اختصاصی هوش مصنوعی، کیفیت 1080p و دسترسی نامحدود.",
        instructor: "مدرس بین‌المللی LinkedIn / Coursera",
        category: "هوش مصنوعی و داده",
        level: "متوسط تا پیشرفته",
        totalDurationMin: 480,
        thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
        badgeText: "دوبله اختصاصی AI",
        isPublished: true
      }
    });

    let chapter = await prisma.chapter.findFirst({ where: { courseId: course.id } });
    if (!chapter) {
      chapter = await prisma.chapter.create({
        data: {
          courseId: course.id,
          titleFa: "فصل ۱: جلسات و سرفصل‌های جامع دوره",
          orderIndex: 1
        }
      });
    }

    // Update episode in database
    const epTargetId = episodeId || `${slug}-ep1`;
    const updatedEpisode = await prisma.episode.upsert({
      where: { id: epTargetId },
      update: {
        chapterId: chapter.id,
        streamUrl: `/api/stream/${epTargetId}`,
        originalVideoUrl: `/storage/courses/${slug}/${localFileName}`,
        telegramFileId: telegramFileId || null,
        telegramMessageId: telegramMessageId ? Number(telegramMessageId) : null,
        durationSeconds: 402,
        isFreePreview: true
      },
      create: {
        id: epTargetId,
        chapterId: chapter.id,
        titleFa: "جلسه ۱: مجموعه داده برخورد پرندگان (دوبله فارسی هوش مصنوعی)",
        titleEn: localFileName.replace(/\.mp4$/i, ""),
        episodeNumber: 1,
        durationSeconds: 402,
        streamUrl: `/api/stream/${epTargetId}`,
        originalVideoUrl: `/storage/courses/${slug}/${localFileName}`,
        telegramFileId: telegramFileId || null,
        telegramMessageId: telegramMessageId ? Number(telegramMessageId) : null,
        isFreePreview: true
      }
    });

    // Also link to featured homepage course episode 1 so homepage visitors hear real Persian AI dubbing!
    try {
      const dockerCourse = await prisma.course.findUnique({ where: { slug: "docker-mastery-course" }, include: { chapters: { include: { episodes: true } } } });
      if (dockerCourse && dockerCourse.chapters[0]?.episodes[0]) {
        await prisma.episode.update({
          where: { id: dockerCourse.chapters[0].episodes[0].id },
          data: {
            streamUrl: `/api/stream/${epTargetId}`,
            originalVideoUrl: `/storage/courses/${slug}/${localFileName}`,
            telegramFileId: telegramFileId || null
          }
        });
      }
    } catch (featuredErr) {
      console.warn("Could not link featured episode:", featuredErr);
    }

    return NextResponse.json({
      success: true,
      message: `ویدیوی دوبله فارسی با موفقیت روی سرور ایران ذخیره گردید (${fileSizeMb} MB).`,
      destPath,
      fileSizeMb,
      episode: updatedEpisode
    });

  } catch (err: any) {
    console.error("[SyncDubbed] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
