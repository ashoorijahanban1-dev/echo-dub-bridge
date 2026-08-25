import { prisma } from "./prisma";
import { publishCourseToTelegram } from "./telegram-publisher";

const US_ENGINE_URL = process.env.NEXT_PUBLIC_US_ENGINE_URL || "http://75glmxpk5jxiudgaa1jzsny9.209.145.63.253.sslip.io";

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

  // 1. Create or Update IngestionBatch in DB
  const batch = await prisma.ingestionBatch.create({
    data: {
      sourceUrl: videoSourceUrl,
      courseTitle: titleFa,
      status: "QUEUED",
      totalParts: 1,
      totalEpisodes: 4,
      completedEpisodes: 0,
      currentStage: "شروع زنجیره خودکار: ارسال ویدیو از سرور ایران به موتور هوش مصنوعی آمریکا...",
      voiceGender: voiceGender,
      logs: JSON.stringify([
        { time: new Date().toISOString(), message: "🚀 Job initiated by Master Pipeline Orchestrator." },
        { time: new Date().toISOString(), message: "📦 Video source identified on Iran server." }
      ])
    }
  });

  // 2. Ensure Course exists in database
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

  // 3. Dispatch Job to US Engine in Background
  (async () => {
    try {
      console.log(`[Orchestrator] Sending job to US AI Engine: ${US_ENGINE_URL}/api/v1/dub/submit`);
      
      const submitRes = await fetch(`${US_ENGINE_URL}/api/v1/dub/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: videoSourceUrl,
          title: titleFa,
          voice_gender: voiceGender,
          preserve_bgm: true
        }),
        signal: AbortSignal.timeout(20000)
      });

      if (!submitRes.ok) {
        throw new Error(`US Engine returned status ${submitRes.status}`);
      }

      const submitData = await submitRes.json();
      const usJobId = submitData.job_id;
      console.log(`[Orchestrator] Job registered on US Engine with ID: ${usJobId}`);

      // Update IngestionBatch with US Job ID
      await prisma.ingestionBatch.update({
        where: { id: batch.id },
        data: {
          status: "DUBBING",
          currentStage: "موتور آمریکا: در حال تبدیل گفتار به متن (Whisper) و ترجمه هوشمند...",
        }
      });

      // Poll US Engine until completion
      let isDone = false;
      let attempts = 0;
      let finalResult: any = null;

      while (!isDone && attempts < 30) {
        attempts++;
        await new Promise((r) => setTimeout(r, 4000));

        try {
          const statusRes = await fetch(`${US_ENGINE_URL}/api/v1/dub/status/${usJobId}`, {
            signal: AbortSignal.timeout(8000)
          });
          if (statusRes.ok) {
            const statusData = await statusRes.json();

            await prisma.ingestionBatch.update({
              where: { id: batch.id },
              data: {
                currentStage: `موتور آمریکا [${statusData.progress}%]: ${statusData.current_stage}`,
                completedEpisodes: statusData.progress >= 100 ? 4 : Math.floor((statusData.progress / 100) * 4)
              }
            });

            if (statusData.status === "COMPLETED") {
              isDone = true;
              finalResult = statusData.result;
            } else if (statusData.status === "FAILED") {
              throw new Error(statusData.error || "US Engine pipeline failed.");
            }
          }
        } catch (pollErr: any) {
          console.warn("[Orchestrator] Polling warning:", pollErr.message);
        }
      }

      if (finalResult && finalResult.telegram) {
        const tgData = finalResult.telegram;
        console.log("[Orchestrator] US Engine completed! Telegram post ID:", tgData.message_id, "File ID:", tgData.file_id);

        // 4. Update Course Chapters & Episodes with real Telegram File ID & Streams
        const chapter = await prisma.chapter.create({
          data: {
            courseId: course.id,
            titleFa: "فصل ۱: مفاهیم پایه، معماری و شروع کار",
            orderIndex: 1
          }
        });

        await prisma.episode.create({
          data: {
            chapterId: chapter.id,
            titleFa: "جلسه ۱: مقدمه و شروع کار با دوبله فارسی هوش مصنوعی",
            titleEn: "01 - Introduction & Hands-on Implementation",
            episodeNumber: 1,
            durationSeconds: finalResult.duration_seconds || 480,
            streamUrl: "/api/stream/video",
            telegramFileId: tgData.file_id,
            telegramMessageId: tgData.message_id,
            isFreePreview: true
          }
        });

        // 5. Broadcast to Telegram Channel with Web URL
        await publishCourseToTelegram({
          courseTitleFa: course.titleFa,
          courseTitleEn: course.titleEn,
          slug: course.slug,
          instructor: course.instructor,
          category: course.category,
          thumbnailUrl: course.thumbnailUrl,
          episodeTitle: "جلسه ۱: مقدمه و شروع دوره با دوبله فارسی"
        });

        // 6. Complete IngestionBatch
        await prisma.ingestionBatch.update({
          where: { id: batch.id },
          data: {
            status: "COMPLETED",
            currentStage: "🎉 دوبله و بارگذاری در تلگرام با موفقیت کامل شد! دوره آماده پخش در سایت است.",
            completedEpisodes: 4
          }
        });

        if (discoveredCourseId) {
          await prisma.discoveredCourse.update({
            where: { id: discoveredCourseId },
            data: { status: "DUBBED" }
          });
        }
      }
    } catch (err: any) {
      console.error("[Orchestrator] Pipeline error:", err.message);
      await prisma.ingestionBatch.update({
        where: { id: batch.id },
        data: {
          status: "FAILED",
          currentStage: `خطا در اجرای خط تولید: ${err.message}`
        }
      });
    }
  })();

  return {
    success: true,
    batchId: batch.id,
    courseId: course.id,
    courseSlug: course.slug,
    message: "خط تولید خودکار با موفقیت آغاز شد و به سرور هوش مصنوعی آمریکا متصل گردید."
  };
}
