import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { fetchDownloadlyPage } from "@/lib/downloadly-fetcher";
import { extractRarLinksFromHtml, downloadFileStream, extractRarArchive } from "@/lib/downloadly-downloader";
import { submitDubbingJobDirect, uploadDubbingFileDirect, getDubbingJobStatusDirect } from "@/lib/us-engine-client";

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
  videoUrl
}: StartDubbingParams) {
  const targetSlug = slug || `course-${Date.now()}`;

  // 1. Create IngestionBatch in DB
  const batch = await prisma.ingestionBatch.create({
    data: {
      courseTitle: titleFa,
      sourceUrl: videoUrl || `https://downloadly.ir/elearning/video-tutorials/${targetSlug}/`,
      status: "QUEUED",
      currentStage: "⏳ در صف پردازش هوشمند و استخراج لینک‌های دانلود...",
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

  // 3. Background Real Downloader & Extraction Runner
  (async () => {
    try {
      console.log(`[Orchestrator] Starting real course extraction & dubbing for: ${titleFa}`);
      
      let usJobId: string | null = null;
      let realExtractedVideoPath: string | null = null;

      // Step A: Find RAR links on course page
      try {
        const coursePageUrl = `https://downloadly.ir/elearning/video-tutorials/${targetSlug}/`;
        console.log(`[Orchestrator] Fetching course page for RAR links: ${coursePageUrl}`);
        const pageRes = await fetchDownloadlyPage(coursePageUrl);
        
        if (pageRes && pageRes.html) {
          const rarLinks = extractRarLinksFromHtml(pageRes.html);
          console.log(`[Orchestrator] Found ${rarLinks.length} RAR archive links for ${targetSlug}`);
          
          if (rarLinks.length > 0) {
            await prisma.ingestionBatch.update({
              where: { id: batch.id },
              data: {
                status: "DOWNLOADING",
                totalParts: rarLinks.length,
                currentStage: `1️⃣ در حال دانلود پارت ۱ از ${rarLinks.length} با IP سرور ایران...`
              }
            });

            const downloadDir = path.join(process.cwd(), "storage", "downloads", batch.id);
            fs.mkdirSync(downloadDir, { recursive: true });
            const part1Path = path.join(downloadDir, "part1.rar");

            // Download Part 1
            console.log(`[Orchestrator] Downloading ${rarLinks[0]} to ${part1Path}`);
            await downloadFileStream(rarLinks[0], part1Path, 60000);

            await prisma.ingestionBatch.update({
              where: { id: batch.id },
              data: {
                status: "EXTRACTING",
                currentStage: "2️⃣ استخراج خودکار آرشیو با پسورد www.downloadly.ir..."
              }
            });

            // Extract with 7z/unrar
            const extractDir = path.join(process.cwd(), "storage", "extracted", batch.id);
            const extractedVideos = await extractRarArchive(part1Path, extractDir);
            console.log(`[Orchestrator] Extracted ${extractedVideos.length} video files from RAR`);

            if (extractedVideos.length > 0) {
              realExtractedVideoPath = extractedVideos[0];
              console.log(`[Orchestrator] Selected real lecture video: ${realExtractedVideoPath}`);
            }
          }
        }
      } catch (dlErr: any) {
        console.warn(`[Orchestrator] Real RAR download/extraction warning: ${dlErr.message}`);
      }

      // Step B: Submit or Upload to US AI Engine
      if (realExtractedVideoPath && fs.existsSync(realExtractedVideoPath)) {
        await prisma.ingestionBatch.update({
          where: { id: batch.id },
          data: {
            status: "DUBBING",
            currentStage: "3️⃣ ارسال ویدیوی واقعی دوره به سرور آمریکا و ترنسکریپشن صوتی با Whisper..."
          }
        });

        console.log(`[Orchestrator] Uploading real extracted lecture to US Engine: ${realExtractedVideoPath}`);
        const uploadRes = await uploadDubbingFileDirect({
          filePath: realExtractedVideoPath,
          title: titleFa,
          voice_gender: voiceGender,
          preserve_bgm: true
        });
        usJobId = uploadRes.job_id;
      } else if (videoUrl && videoUrl.startsWith("http")) {
        await prisma.ingestionBatch.update({
          where: { id: batch.id },
          data: {
            status: "DUBBING",
            currentStage: "3️⃣ ارسال لینک مستقیم ویدیوی دوره به سرور هوش مصنوعی آمریکا..."
          }
        });

        console.log(`[Orchestrator] Submitting direct video URL to US Engine: ${videoUrl}`);
        const submitData = await submitDubbingJobDirect({
          video_url: videoUrl,
          title: titleFa,
          voice_gender: voiceGender,
          preserve_bgm: true
        });
        usJobId = submitData.job_id;
      } else {
        throw new Error("فایل ویدیوی این دوره از آرشیو دانلودلی دریافت نشد و لینک مستقیم ویدیو تعیین نشده است.");
      }

      if (!usJobId) {
        throw new Error("امکان برقراری ارتباط با موتور دوبله در سرور آمریکا وجود ندارد.");
      }

      console.log(`[Orchestrator] Job successfully registered on US Engine: ${usJobId}`);

      // Step C: Poll US Engine for Real Progress
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

      // Step D: Create or Update Chapter & Episode
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

      // Step E: Complete IngestionBatch in DB
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
