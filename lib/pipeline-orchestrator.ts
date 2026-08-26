import { prisma } from "./prisma";
import { publishCourseToTelegram } from "./telegram-publisher";
import fs from "fs";
import path from "path";

const US_ENGINE_HOST = "http://75glmxpk5jxiudgaa1jzsny9.209.145.63.253.sslip.io";

export interface PipelineTriggerOptions {
  courseId?: string;
  discoveredCourseId?: string;
  slug?: string;
  videoUrl?: string;
  titleFa: string;
  titleEn?: string;
  instructor?: string;
  category?: string;
  voiceGender?: string;
}

/**
 * Master Pipeline Orchestrator
 * Fully chains: Iran Harvester/Download -> US AI Dubbing Engine -> Telegram CDN Upload -> Web Catalog Publishing
 */
export async function startDubbingPipeline(opts: PipelineTriggerOptions) {
  const {
    courseId,
    discoveredCourseId,
    slug,
    videoUrl,
    titleFa,
    titleEn,
    instructor = "مدرس بین‌المللی",
    category = "برنامه‌نویسی و هوش مصنوعی",
    voiceGender = "male"
  } = opts;

  const targetSlug = slug || `course-${Date.now()}`;
  const videoSourceUrl = videoUrl || "https://github.com/ashoorijahanban1-dev/echo-dub-bridge/raw/main/public/sample-video.mp4";

  // 1. Create IngestionBatch in DB
  const batch = await prisma.ingestionBatch.create({
    data: {
      sourceUrl: videoSourceUrl,
      courseTitle: titleFa,
      status: "QUEUED",
      totalParts: 1,
      totalEpisodes: 1,
      completedEpisodes: 0,
      currentStage: "شروع خط تولید: آماده‌سازی و ارسال ویدیو به موتور هوش مصنوعی آمریکا...",
      voiceGender: voiceGender,
      logs: JSON.stringify([
        { time: new Date().toISOString(), message: "🚀 آغاز خط تولید خودکار و هماهنگی سرورها" }
      ])
    }
  });

  // 2. Ensure Course exists in DB
  const course = await prisma.course.upsert({
    where: { slug: targetSlug },
    update: {
      titleFa,
      titleEn: titleEn || titleFa,
      instructor,
      category,
      isPublished: true
    },
    create: {
      slug: targetSlug,
      titleFa,
      titleEn: titleEn || titleFa,
      descriptionFa: `دوره آموزشی تخصصی ${titleFa} با دوبله اختصاصی هوش مصنوعی، کیفیت 1080p و دسترسی نامحدود.`,
      instructor,
      category,
      level: "متوسط تا پیشرفته",
      totalDurationMin: 480,
      thumbnailUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80",
      badgeText: "دوبله اختصاصی AI",
      isPublished: true
    }
  });

  // 3. Background Pipeline Runner (Direct Upload to US Engine)
  (async () => {
    try {
      console.log(`[Orchestrator] Starting real upload & dubbing for: ${titleFa}`);
      
      // Get video buffer (from local public file or remote URL)
      let videoBuffer: Buffer;
      const localSamplePath = path.join(process.cwd(), "public", "sample-video.mp4");
      
      if (videoUrl && videoUrl.startsWith("http") && !videoUrl.includes("sample-video.mp4")) {
        console.log(`[Orchestrator] Fetching video from remote URL: ${videoUrl}`);
        const fetchRes = await fetch(videoUrl);
        if (!fetchRes.ok) throw new Error(`Failed to download source video: ${fetchRes.status}`);
        const ab = await fetchRes.arrayBuffer();
        videoBuffer = Buffer.from(ab);
      } else if (fs.existsSync(localSamplePath)) {
        videoBuffer = fs.readFileSync(localSamplePath);
      } else {
        throw new Error("No valid video source found on server.");
      }

      await prisma.ingestionBatch.update({
        where: { id: batch.id },
        data: {
          status: "EXTRACTING",
          currentStage: "در حال ارسال فایل ویدیو به سرور آمریکا (209.145.63.253)..."
        }
      });

      // Prepare Multipart Form Data
      const formData = new FormData();
      formData.append("file", new Blob([new Uint8Array(videoBuffer)], { type: "video/mp4" }), `${targetSlug}.mp4`);
      formData.append("title", titleFa);
      formData.append("voice_gender", voiceGender);
      formData.append("preserve_bgm", "true");

      const uploadRes = await fetch(`${US_ENGINE_HOST}/api/v1/dub/upload`, {
        method: "POST",
        body: formData
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`US Engine upload failed (${uploadRes.status}): ${errText}`);
      }

      const uploadData = await uploadRes.json();
      const usJobId = uploadData.job_id;
      console.log(`[Orchestrator] Job created on US Engine: ${usJobId}`);

      await prisma.ingestionBatch.update({
        where: { id: batch.id },
        data: {
          status: "DUBBING",
          currentStage: "موتور آمریکا: در حال ترنسکریپشن صوتی با Whisper و ترجمه با Gemini..."
        }
      });

      // Poll US Engine
      let isDone = false;
      let attempts = 0;
      let finalResult: any = null;

      while (!isDone && attempts < 40) {
        attempts++;
        await new Promise((r) => setTimeout(r, 4000));

        try {
          const statusRes = await fetch(`${US_ENGINE_HOST}/api/v1/dub/status/${usJobId}`);
          if (statusRes.ok) {
            const sData = await statusRes.json();
            
            await prisma.ingestionBatch.update({
              where: { id: batch.id },
              data: {
                currentStage: `موتور هوش مصنوعی [${sData.progress}%]: ${sData.current_stage}`,
                completedEpisodes: sData.progress >= 100 ? 1 : 0
              }
            });

            if (sData.status === "COMPLETED") {
              isDone = true;
              finalResult = sData.result;
            } else if (sData.status === "FAILED") {
              throw new Error(sData.error || "US Engine pipeline failed.");
            }
          }
        } catch (pollErr: any) {
          console.warn("[Orchestrator] Poll warning:", pollErr.message);
        }
      }

      if (!finalResult || !finalResult.telegram) {
        throw new Error("Dubbing pipeline timed out or did not return Telegram CDN data.");
      }

      const tgData = finalResult.telegram;
      console.log(`[Orchestrator] Dubbing complete! Telegram Message ID: ${tgData.message_id}, File ID: ${tgData.file_id}`);

      // 4. Create or Update Chapter & Episode
      let chapter = await prisma.chapter.findFirst({ where: { courseId: course.id } });
      if (!chapter) {
        chapter = await prisma.chapter.create({
          data: {
            courseId: course.id,
            titleFa: "فصل ۱: مفاهیم پایه و شروع کار عملی",
            orderIndex: 1
          }
        });
      }

      await prisma.episode.create({
        data: {
          chapterId: chapter.id,
          titleFa: "جلسه ۱: مقدمه و شروع کار با دوبله فارسی هوش مصنوعی",
          titleEn: "01 - Introduction & Practical Implementation",
          episodeNumber: 1,
          durationSeconds: Math.round(finalResult.duration_seconds || 480),
          streamUrl: "/api/stream/video",
          telegramFileId: tgData.file_id,
          telegramMessageId: tgData.message_id,
          isFreePreview: true
        }
      });

      // 5. Broadcast to Telegram Channel
      try {
        await publishCourseToTelegram({
          courseTitleFa: course.titleFa,
          courseTitleEn: course.titleEn,
          slug: course.slug,
          instructor: course.instructor,
          category: course.category,
          thumbnailUrl: course.thumbnailUrl,
          episodeTitle: "جلسه ۱: مقدمه و شروع دوره با دوبله فارسی"
        });
      } catch (tgErr: any) {
        console.warn("[Orchestrator] Telegram broadcast notice:", tgErr.message);
      }

      // 6. Complete IngestionBatch in DB
      await prisma.ingestionBatch.update({
        where: { id: batch.id },
        data: {
          status: "COMPLETED",
          currentStage: `🎉 دوبله کامل شد و در تلگرام (پیام ${tgData.message_id}) و سایت منتشر گردید!`,
          completedEpisodes: 1
        }
      });

      if (discoveredCourseId) {
        await prisma.discoveredCourse.update({
          where: { id: discoveredCourseId },
          data: { status: "DUBBED" }
        });
      }
    } catch (err: any) {
      console.error("[Orchestrator] Pipeline error:", err.message);
      await prisma.ingestionBatch.update({
        where: { id: batch.id },
        data: {
          status: "FAILED",
          currentStage: `❌ خطا در خط تولید: ${err.message}`
        }
      });
    }
  })();

  return {
    success: true,
    batchId: batch.id,
    courseId: course.id,
    courseSlug: course.slug,
    message: "خط تولید خودکار هوش مصنوعی آغاز شد و ویدیو به سرور آمریکا ارسال گردید."
  };
}
