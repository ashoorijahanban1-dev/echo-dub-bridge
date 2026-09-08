import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { uploadDubbingFileDirect, submitDubbingJobDirect, getDubbingJobStatusDirect } from "@/lib/us-engine-client";

export async function POST(request: Request) {
  try {
    const { episodeId, slug, episodeNumber, voiceGender } = await request.json();

    let episode: any = null;
    if (episodeId) {
      episode = await prisma.episode.findFirst({
        where: {
          OR: [
            { id: episodeId },
            { streamUrl: { contains: episodeId } }
          ]
        },
        include: {
          chapter: {
            include: {
              course: true
            }
          }
        }
      });
    }

    if (!episode && slug && episodeNumber) {
      const course = await prisma.course.findUnique({
        where: { slug },
        include: {
          chapters: {
            include: {
              episodes: true
            }
          }
        }
      });
      if (course) {
        for (const ch of course.chapters) {
          for (const ep of ch.episodes) {
            if (ep.episodeNumber === Number(episodeNumber)) {
              episode = ep;
              break;
            }
          }
        }
      }
    }

    let filePath: string | null = null;
    if (episode?.originalVideoUrl && fs.existsSync(episode.originalVideoUrl)) {
      filePath = episode.originalVideoUrl;
    }

    // Try finding file in storage
    if (!filePath) {
      const courseSlug = slug || episode?.chapter?.course?.slug;
      if (courseSlug) {
        const courseDir = path.join("/app", "storage", "courses", courseSlug);
        if (fs.existsSync(courseDir)) {
          const files = fs.readdirSync(courseDir);
          const epNum = episodeNumber || episode?.episodeNumber || 1;
          const match = files.find(f => f.startsWith(`${epNum} `) || f.startsWith(`${epNum} - `) || f.startsWith(`${epNum}. `));
          if (match) {
            filePath = path.join(courseDir, match);
          }
        }
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json({
        error: "فایل ویدیوی خام این جلسه روی سرور یافت نشد.",
        filePath
      }, { status: 404 });
    }

    const courseSlug = slug || episode?.chapter?.course?.slug || "linux-partitioning-lvm-hands-on-practical-guide";
    const fileName = path.basename(filePath);
    const title = episode?.titleEn || episode?.titleFa || fileName;
    const videoUrl = `https://rpim.ir/api/stream/raw/${courseSlug}/${encodeURIComponent(fileName)}`;

    console.log(`[TriggerDub] Submitting URL ${videoUrl} to US engine for dubbing...`);

    const result = await submitDubbingJobDirect({
      video_url: videoUrl,
      title,
      voice_gender: voiceGender || "male",
      preserve_bgm: true
    });

    return NextResponse.json({
      success: true,
      message: "درخواست دوبله هوشمند با موفقیت به موتور آمریکا ارسال شد.",
      jobId: result.job_id,
      status: result.status,
      videoUrl,
      file: fileName
    });

  } catch (error: any) {
    console.error("[TriggerDub] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const status = await getDubbingJobStatusDirect(jobId);
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
