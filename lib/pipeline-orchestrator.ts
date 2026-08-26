import { prisma } from "@/lib/prisma";
import { submitDubbingJobDirect, getDubbingJobStatusDirect } from "@/lib/us-engine-client";

export interface StartDubbingParams {
  discoveredCourseId?: string;
  slug?: string;
  titleFa: string;
  titleEn?: string;
  instructor?: string;
  category?: string;
  voiceGender?: string;
  videoUrl?: string;
}

export async function startDubbingPipeline({
  discoveredCourseId,
  slug,
  titleFa,
  titleEn,
  instructor = "مدرس بین‌المللی Udemy",
  category = "برنامه‌نویسی و DevOps",
  voiceGender = "male",
  videoUrl = "https://rpim.ir/sample-video.mp4"
}: StartDubbingParams) {
  const targetSlug = slug || `course-${Date.now()}`;

  // 1. Create IngestionBatch in DB
  const batch = await prisma.ingestionBatch.create({
    data: {
      courseTitle: titleFa,
      sourceUrl: videoUrl,
      status: "QUEUED",
      currentStage: "⏳ در صف پردازش هوشمند...",
      totalParts: 1,
      completedEpisodes: 0,
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

  // 3. Background Pipeline Runner (Direct IP Connection to US Server 209.145.63.253)
  (async () => {
    try {
      console.log(`[Orchestrator] Starting real dubbing for: ${titleFa}`);
      
      let effectiveVideoUrl = videoUrl;
      if (!effectiveVideoUrl || !effectiveVideoUrl.startsWith("http")) {
        effectiveVideoUrl = "https://rpim.ir/sample-video.mp4";
      }

      await prisma.ingestionBatch.update({
        where: { id: batch.id },
        data: {
          status: "DUBBING",
          currentStage: "در حال اتصال به سرور هوش مصنوعی آمریکا (209.145.63.253)..."
        }
      });

      // Submit directly via raw TCP/HTTP to US Engine IP
      console.log(`[Orchestrator] Submitting job to US Engine directly: ${effectiveVideoUrl}`);
      const submitData = await submitDubbingJobDirect({
        video_url: effectiveVideoUrl,
        title: titleFa,
        voice_gender: voiceGender,
        preserve_bgm: true
      });

      const usJobId = submitData.job_id;
      console.log(`[Orchestrator] Job successfully registered on US Engine: ${usJobId}`);

      // 4. Poll US Engine for Real Progress
      let isDone = false;
      let attempts = 0;
      let finalResult: any = null;

      while (!isDone && attempts < 60) {
        attempts++;
        await new Promise((r) => setTimeout(r, 3500));

        try {
          const sData = await getDubbingJobStatusDirect(usJobId);
          
          await prisma.ingestionBatch.update({
            where: { id: batch.id },
            data: {
              currentStage: `موتور هوش مصنوعی [${sData.progress || 0}%]: ${sData.current_stage || "در حال پردازش..."}`,
              completedEpisodes: (sData.progress && sData.progress >= 100) ? 1 : 0
            }
          });

          if (sData.status === "COMPLETED") {
            isDone = true;
            finalResult = sData.result;
          } else if (sData.status === "FAILED") {
            throw new Error(sData.error || "US Engine pipeline failed.");
          }
        } catch (pollErr: any) {
          console.warn("[Orchestrator] Poll warning:", pollErr.message);
        }
      }

      if (!finalResult || !finalResult.telegram) {
        throw new Error("فرآیند دوبله در سرور آمریکا با تایم‌اوت مواجه شد یا نتیجه تلگرام دریافت نگردید.");
      }

      const tgData = finalResult.telegram;
      console.log(`[Orchestrator] Dubbing complete! Telegram Message ID: ${tgData.message_id}, File ID: ${tgData.file_id}`);

      // 5. Create or Update Chapter & Episode
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
          telegramFileId: tgData.file_id || null,
          telegramMessageId: tgData.message_id ? Number(tgData.message_id) : null,
          isFreePreview: true
        }
      });

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
