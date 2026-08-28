import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        chapters: {
          include: {
            episodes: true
          }
        }
      }
    });

    const results = [];

    for (const course of courses) {
      // Check storage/courses/{slug} or storage/extracted
      const courseSlug = course.slug;
      const candidates = [
        path.join(process.cwd(), "storage", "courses", courseSlug),
        path.join(process.cwd(), "storage", "extracted")
      ];

      let foundVideos: string[] = [];

      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          const files = fs.readdirSync(cand);
          for (const f of files) {
            const fullP = path.join(cand, f);
            if (fs.statSync(fullP).isFile() && f.endsWith(".mp4") && !f.includes("sample-video")) {
              foundVideos.push(fullP);
            } else if (fs.statSync(fullP).isDirectory()) {
              const subfiles = fs.readdirSync(fullP).filter(sf => sf.endsWith(".mp4") && !sf.includes("sample-video"));
              for (const sf of subfiles) {
                foundVideos.push(path.join(fullP, sf));
              }
            }
          }
        }
      }

      // Filter unique videos
      const uniqueVideos = Array.from(new Set(foundVideos));

      if (uniqueVideos.length > 0) {
        // Ensure chapter exists
        let chapter = course.chapters[0];
        if (!chapter) {
          chapter = await prisma.chapter.create({
            data: {
              courseId: course.id,
              titleFa: "فصل ۱: جلسات و سرفصل‌های جامع دوره",
              orderIndex: 1
            },
            include: {
              episodes: true
            }
          });
        }

        // Register each video as an episode
        for (let i = 0; i < uniqueVideos.length; i++) {
          const vidPath = uniqueVideos[i];
          const filename = path.basename(vidPath);
          const cleanTitle = filename.replace(/\.mp4$/i, "").replace(/^\d+[\.\-\s]+/, "").trim() || `جلسه ${i + 1}`;
          const epNumber = i + 1;
          const epId = `${courseSlug}-ep${epNumber}`;

          await prisma.episode.upsert({
            where: { id: epId },
            update: {
              titleFa: `جلسه ${epNumber}: ${cleanTitle}`,
              titleEn: cleanTitle,
              episodeNumber: epNumber,
              streamUrl: `/api/stream/${epId}`,
              originalVideoUrl: vidPath
            },
            create: {
              id: epId,
              chapterId: chapter.id,
              titleFa: `جلسه ${epNumber}: ${cleanTitle}`,
              titleEn: cleanTitle,
              episodeNumber: epNumber,
              durationSeconds: 600,
              streamUrl: `/api/stream/${epId}`,
              originalVideoUrl: vidPath,
              isFreePreview: epNumber <= 2
            }
          });
        }

        results.push({ course: course.titleFa, episodesRegistered: uniqueVideos.length });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
