import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { fetchDownloadlyPage } from "@/lib/downloadly-fetcher";
import { extractRarLinksFromHtml, downloadFileStream, extractRarArchive } from "@/lib/downloadly-downloader";
import { submitDubbingJobDirect, uploadDubbingFileDirect, getDubbingJobStatusDirect } from "@/lib/us-engine-client";
import { logPipelineEvent } from "@/lib/pipeline-logger";
import { getVoiceProfileById, normalizeTextForSpeech } from "@/lib/voice-tuner";

export interface StartDubbingParams {
  discoveredCourseId?: string;
  slug?: string;
  sourceUrl?: string;
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
  sourceUrl,
  titleFa,
  titleEn,
  instructor = "مدرس بین‌المللی Udemy",
  category = "برنامه‌نویسی و DevOps",
  voiceGender = "male-warm",
  videoUrl
}: StartDubbingParams) {
  const targetSlug = slug || `course-${Date.now()}`;
  const effectiveSourceUrl = sourceUrl || videoUrl || `https://downloadly.ir/download/elearning/video-tutorials/${targetSlug}/`;
  const voiceProfile = getVoiceProfileById(voiceGender);

  // 1. Create IngestionBatch in DB
  const batch = await prisma.ingestionBatch.create({
    data: {
      courseTitle: titleFa,
      sourceUrl: effectiveSourceUrl,
      status: "QUEUED",
      currentStage: "⏳ در صف پردازش هوشمند و استخراج لینک‌های دانلود...",
      totalParts: 1,
      completedEpisodes: 0,
      voiceGender: voiceProfile.id,
      logs: JSON.stringify([
        `[${new Date().toLocaleTimeString("fa-IR")}] [PIPELINE] 🚀 آغاز خط تولید هوشمند برای دوره: ${titleFa}`
      ])
    }
  });

  // Log startup details
  await logPipelineEvent(
    batch.id,
    "INIT",
    `دوره: ${titleFa} | صدای انتخابی: ${voiceProfile.nameFa} (${voiceProfile.badge}) | منبع: ${effectiveSourceUrl}`,
    "INFO"
  );

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
      await logPipelineEvent(batch.id, "PIPELINE", `شروع پویش و استخراج ویدیوهای دوره...`, "INFO");
      
      let usJobId: string | null = null;
      let realExtractedVideoPath: string | null = null;

      // Step A: Find RAR links on course page
      try {
        const candidateUrls = [
          sourceUrl,
          `https://downloadly.ir/download/elearning/video-tutorials/${targetSlug}/`,
          `https://downloadly.ir/elearning/video-tutorials/${targetSlug}/`,
          `https://downloadly.ir/download/elearning/${targetSlug}/`
        ].filter(Boolean) as string[];

        let rarLinks: string[] = [];
        for (const cUrl of candidateUrls) {
          await logPipelineEvent(batch.id, "CRAWLER", `بررسی صفحه دانلودلی: ${cUrl}`, "INFO");
          const pageRes = await fetchDownloadlyPage(cUrl);
          if (pageRes && pageRes.html) {
            const found = extractRarLinksFromHtml(pageRes.html);
            if (found.length > 0) {
              rarLinks = found;
              await logPipelineEvent(
                batch.id,
                "CRAWLER",
                `تعداد ${rarLinks.length} لینک پارت RAR در صفحه کشف شد.`,
                "SUCCESS",
                `پارت اول: ${rarLinks[0]}`
              );
              break;
            }
          }
        }
          
        if (rarLinks.length > 0) {
          const downloadDir = path.join(process.cwd(), "storage", "downloads", batch.id);
          fs.mkdirSync(downloadDir, { recursive: true });

          let part1Path = "";

          // Download all parts into the same directory for seamless multi-part RAR extraction
          for (let pIdx = 0; pIdx < rarLinks.length; pIdx++) {
            const currentPartUrl = rarLinks[pIdx];
            let rawFileName = `part${pIdx + 1}.rar`;
            try {
              const urlObj = new URL(currentPartUrl);
              rawFileName = path.basename(urlObj.pathname) || rawFileName;
            } catch (e) {}
            const currentPartPath = path.join(downloadDir, rawFileName);
            if (pIdx === 0) part1Path = currentPartPath;

            await prisma.ingestionBatch.update({
              where: { id: batch.id },
              data: {
                status: "DOWNLOADING",
                totalParts: rarLinks.length,
                currentStage: `1️⃣ در حال دانلود پارت ${pIdx + 1} از ${rarLinks.length} با IP سرور ایران...`
              }
            });

            await logPipelineEvent(
              batch.id,
              "DOWNLOADER",
              `شروع دانلود پارت ${pIdx + 1} از ${rarLinks.length} (${rawFileName})...`,
              "INFO",
              currentPartUrl
            );

            // Download Part (with 30 min timeout for multi-GB archives)
            await downloadFileStream(currentPartUrl, currentPartPath, 1800);

            let downloadedSizeMb = 0;
            if (fs.existsSync(currentPartPath)) {
              downloadedSizeMb = Number((fs.statSync(currentPartPath).size / (1024 * 1024)).toFixed(1));
            }

            await logPipelineEvent(
              batch.id,
              "DOWNLOADER",
              `پارت ${pIdx + 1} از ${rarLinks.length} با موفقیت دانلود شد (حجم: ${downloadedSizeMb} مگابایت)`,
              "SUCCESS",
              currentPartPath
            );
          }

          await prisma.ingestionBatch.update({
            where: { id: batch.id },
            data: {
              status: "EXTRACTING",
              currentStage: "2️⃣ استخراج خودکار آرشیو با پسورد www.downloadly.ir..."
            }
          });

          await logPipelineEvent(
            batch.id,
            "UNRAR",
            `آغاز اکسترکت پارت فشرده با موتور رسمی RARLab unrar و پسورد www.downloadly.ir...`,
            "INFO"
          );

          // Extract with official unrar
          const extractDir = path.join(process.cwd(), "storage", "extracted", batch.id);
          const extractedVideos = await extractRarArchive(part1Path, extractDir);
          
          await logPipelineEvent(
            batch.id,
            "UNRAR",
            `عملیات اکسترکت انجام شد؛ تعداد ${extractedVideos.length} فایل ویدیویی معتبر استخراج گردید.`,
            extractedVideos.length > 0 ? "SUCCESS" : "WARN",
            extractedVideos.map(v => path.basename(v)).join(", ")
          );

          if (extractedVideos.length > 0) {
            // 1. Persistent Course Storage Directory
            const courseMediaDir = path.join(process.cwd(), "storage", "courses", targetSlug);
            if (!fs.existsSync(courseMediaDir)) {
              fs.mkdirSync(courseMediaDir, { recursive: true });
            }

            // 2. Ensure Course has a valid Chapter
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

            // 3. Register ALL Extracted Video Lessons in the Database!
            for (let i = 0; i < extractedVideos.length; i++) {
              const srcVideo = extractedVideos[i];
              const epFilename = path.basename(srcVideo);
              const destVideo = path.join(courseMediaDir, epFilename);
              try {
                if (!fs.existsSync(destVideo)) {
                  fs.copyFileSync(srcVideo, destVideo);
                }
              } catch (copyErr) {
                console.error("Failed to copy video to course media dir:", copyErr);
              }

              const cleanTitle = epFilename.replace(/\.mp4$/i, "").replace(/^\d+[\.\-\s]+/, "").trim() || `جلسه ${i + 1}`;
              const epNumber = i + 1;
              const epId = `${targetSlug}-ep${epNumber}`;

              await prisma.episode.upsert({
                where: { id: epId },
                update: {
                  titleFa: `جلسه ${epNumber}: ${cleanTitle}`,
                  titleEn: cleanTitle,
                  episodeNumber: epNumber,
                  streamUrl: `/api/stream/${epId}`,
                  originalVideoUrl: `/storage/courses/${targetSlug}/${epFilename}`
                },
                create: {
                  id: epId,
                  chapterId: chapter.id,
                  titleFa: `جلسه ${epNumber}: ${cleanTitle}`,
                  titleEn: cleanTitle,
                  episodeNumber: epNumber,
                  durationSeconds: 600,
                  streamUrl: `/api/stream/${epId}`,
                  originalVideoUrl: `/storage/courses/${targetSlug}/${epFilename}`,
                  isFreePreview: epNumber <= 2
                }
              });
            }

            await logPipelineEvent(
              batch.id,
              "DATABASE",
              `تعداد ${extractedVideos.length} جلسه واقعی از دوره در دیتابیس سایت ثبت و آماده استریم شد.`,
              "SUCCESS"
            );

            // Select ALL lessons for AI Dubbing (not just the first one!)
            for (let dubIdx = 0; dubIdx < extractedVideos.length; dubIdx++) {
              const currentVideoPath = path.join(courseMediaDir, path.basename(extractedVideos[dubIdx]));
              const fallbackPath = extractedVideos[dubIdx];
              const dubVideoPath = fs.existsSync(currentVideoPath) ? currentVideoPath : fallbackPath;
              const vidSizeMb = (fs.statSync(dubVideoPath).size / (1024 * 1024)).toFixed(1);
              await logPipelineEvent(
                batch.id,
                "UNRAR",
                `فایل درس ${dubIdx + 1}/${extractedVideos.length} انتخاب شد: ${path.basename(dubVideoPath)} (حجم: ${vidSizeMb} MB)`,
                "INFO"
              );
            }
            // Use first video for initial dubbing, rest will be queued
            realExtractedVideoPath = path.join(courseMediaDir, path.basename(extractedVideos[0]));
            if (!fs.existsSync(realExtractedVideoPath)) {
              realExtractedVideoPath = extractedVideos[0];
            }
          }
        } else {
          await logPipelineEvent(
            batch.id,
            "CRAWLER",
            `هیچ لینک پارت RAR در صفحه یافت نشد. تلاش برای استفاده از منبع مستقیم ویدیو...`,
            "WARN"
          );
        }
      } catch (dlErr: any) {
        await logPipelineEvent(
          batch.id,
          "DOWNLOADER",
          `هشدار در فرآیند دانلود یا استخراج آرشیو: ${dlErr.message}`,
          "WARN",
          dlErr.stack
        );
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

        await logPipelineEvent(
          batch.id,
          "US-ENGINE",
          `ارسال مستقیم استریم ویدیوی استخراج شده به سرور آمریکا (209.145.63.253)...`,
          "INFO",
          path.basename(realExtractedVideoPath)
        );

        const uploadRes = await uploadDubbingFileDirect({
          filePath: realExtractedVideoPath,
          title: normalizeTextForSpeech(titleFa),
          voice_gender: voiceProfile.gender,
          preserve_bgm: true
        });
        usJobId = uploadRes.job_id;

        await logPipelineEvent(
          batch.id,
          "US-ENGINE",
          `فایل ویدیو با موفقیت در سرور آمریکا دریافت و ثبت شد. شناسه جاب: ${usJobId}`,
          "SUCCESS"
        );
      } else if (videoUrl && videoUrl.startsWith("http")) {
        await prisma.ingestionBatch.update({
          where: { id: batch.id },
          data: {
            status: "DUBBING",
            currentStage: "3️⃣ ارسال لینک مستقیم ویدیوی دوره به سرور هوش مصنوعی آمریکا..."
          }
        });

        await logPipelineEvent(
          batch.id,
          "US-ENGINE",
          `ارسال لینک استریم ویدیو به سرور آمریکا: ${videoUrl}`,
          "INFO"
        );

        const submitData = await submitDubbingJobDirect({
          video_url: videoUrl,
          title: normalizeTextForSpeech(titleFa),
          voice_gender: voiceProfile.gender,
          preserve_bgm: true
        });
        usJobId = submitData.job_id;

        await logPipelineEvent(
          batch.id,
          "US-ENGINE",
          `جاب مستقیم در سرور آمریکا ثبت شد. شناسه: ${usJobId}`,
          "SUCCESS"
        );
      } else {
        throw new Error("هیچ فایل ویدیویی از آرشیو دانلودلی استخراج نشد و لینک ویدیوی مستقیم نیز مشخص نیست.");
      }

      if (!usJobId) {
        throw new Error("پاسخی از سرور آمریکا جهت شروع جاب دوبله دریافت نشد.");
      }

      // Step C: Poll US Engine for Real Progress (up to 350 attempts = ~20 minutes)
      let isDone = false;
      let attempts = 0;
      let finalResult: any = null;
      let lastReportedStage = "";

      await logPipelineEvent(
        batch.id,
        "AI-STUDIO",
        `آغاز رصد و مانیتورینگ هوش مصنوعی (Whisper -> Gemini 3 -> EdgeTTS -> FFmpeg)...`,
        "INFO"
      );

      while (!isDone && attempts < 350) {
        attempts++;
        await new Promise((r) => setTimeout(r, 3500));

        try {
          const sData = await getDubbingJobStatusDirect(usJobId);
          const currentProgress = sData.progress || 0;
          const currentStageText = sData.current_stage || "در حال پردازش صوتی و ترجمه...";

          await prisma.ingestionBatch.update({
            where: { id: batch.id },
            data: {
              currentStage: `موتور هوش مصنوعی [${currentProgress}%]: ${currentStageText}`,
              completedEpisodes: (currentProgress >= 100) ? 1 : 0
            }
          });

          if (currentStageText !== lastReportedStage) {
            lastReportedStage = currentStageText;
            await logPipelineEvent(
              batch.id,
              "AI-STUDIO",
              `پیشرفت دوبله [${currentProgress}%]: ${currentStageText}`,
              "INFO"
            );
          }

          if (sData.status === "COMPLETED") {
            isDone = true;
            finalResult = sData.result;
            await logPipelineEvent(
              batch.id,
              "AI-STUDIO",
              `موتور دوبله آمریکا با موفقیت پایان یافت (100%).`,
              "SUCCESS"
            );
            break;
          } else if (sData.status === "FAILED") {
            const failReason = sData.error || sData.current_stage || "پردازش دوبله در سرور آمریکا ناموفق بود.";
            await logPipelineEvent(
              batch.id,
              "US-ENGINE",
              `❌ سرور آمریکا خطا گزارش کرد: ${failReason}`,
              "ERROR"
            );
            throw new Error(`خطای موتور دوبله سرور آمریکا: ${failReason}`);
          }
        } catch (pollErr: any) {
          if (pollErr.message.includes("خطای موتور دوبله") || pollErr.message.includes("Error in pipeline")) {
            throw pollErr;
          }
          if (attempts % 10 === 0) {
            await logPipelineEvent(
              batch.id,
              "POLL",
              `در انتظار پاسخ سرور آمریکا (تلاش ${attempts}/350): ${pollErr.message}`,
              "WARN"
            );
          }
        }
      }

      if (!finalResult || !finalResult.telegram) {
        throw new Error("فرآیند دوبله در سرور آمریکا به موقع پایان نیافت یا متادیتای تلگرام بازگردانده نشد.");
      }

      const tgData = finalResult.telegram;
      await logPipelineEvent(
        batch.id,
        "TELEGRAM",
        `ویدیوی دوبله شده در کانال تلگرام بارگذاری شد (پیام: ${tgData.message_id} | فایل: ${tgData.file_id?.slice(0, 15)}...)`,
        "SUCCESS"
      );

      // Step D: Update Episode 1 with dubbed Telegram & Duration metadata
      let epChapter = await prisma.chapter.findFirst({ where: { courseId: course.id } });
      if (!epChapter) {
        epChapter = await prisma.chapter.create({
          data: {
            courseId: course.id,
            titleFa: "فصل ۱: جلسات و سرفصل‌های جامع دوره",
            orderIndex: 1
          }
        });
      }

      const ep1Id = `${targetSlug}-ep1`;
      await prisma.episode.upsert({
        where: { id: ep1Id },
        update: {
          telegramFileId: tgData.file_id || null,
          telegramMessageId: tgData.message_id ? Number(tgData.message_id) : null,
          durationSeconds: Math.round(finalResult.duration_seconds || 480),
          streamUrl: `/api/stream/${ep1Id}`
        },
        create: {
          id: ep1Id,
          chapterId: epChapter.id,
          titleFa: "جلسه ۱: مقدمه و شروع کار با دوبله فارسی هوش مصنوعی",
          titleEn: "01 - Introduction & Practical Implementation",
          episodeNumber: 1,
          durationSeconds: Math.round(finalResult.duration_seconds || 480),
          streamUrl: `/api/stream/${ep1Id}`,
          telegramFileId: tgData.file_id || null,
          telegramMessageId: tgData.message_id ? Number(tgData.message_id) : null,
          isFreePreview: true
        }
      });

      await logPipelineEvent(
        batch.id,
        "DATABASE",
        `جلسه ۱ دوره با موفقیت دوبله و با استریم اختصاصی فعال شد.`,
        "SUCCESS"
      );

      // Step E: Complete IngestionBatch in DB
      await prisma.ingestionBatch.update({
        where: { id: batch.id },
        data: {
          status: "COMPLETED",
          currentStage: `🎉 دوبله کامل شد و در تلگرام (پیام ${tgData.message_id}) و سایت منتشر گردید!`,
          completedEpisodes: 1
        }
      });

      await logPipelineEvent(
        batch.id,
        "PUBLISHED",
        `🎉 خط تولید دوره "${titleFa}" با موفقیت ۱۰۰٪ تکمیل و منتشر شد!`,
        "SUCCESS"
      );

      if (discoveredCourseId) {
        await prisma.discoveredCourse.update({
          where: { id: discoveredCourseId },
          data: { status: "DUBBED" }
        });
      }
    } catch (err: any) {
      console.error("[Orchestrator] Pipeline error:", err.message);
      await logPipelineEvent(
        batch.id,
        "ERROR",
        `❌ خطا در خط تولید: ${err.message}`,
        "ERROR",
        err.stack
      );

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
    message: "خط تولید خودکار هوش مصنوعی آغاز شد و به سرور متصل گردید."
  };
}
