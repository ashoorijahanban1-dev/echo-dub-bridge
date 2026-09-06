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

    // Update episode in database
    const epTargetId = episodeId || `${slug}-ep1`;
    const updatedEpisode = await prisma.episode.upsert({
      where: { id: epTargetId },
      update: {
        streamUrl: `/api/stream/${epTargetId}`,
        originalVideoUrl: `/storage/courses/${slug}/${localFileName}`,
        telegramFileId: telegramFileId || null,
        telegramMessageId: telegramMessageId ? Number(telegramMessageId) : null,
        durationSeconds: 402,
        isFreePreview: true
      },
      create: {
        id: epTargetId,
        chapter: {
          connectOrCreate: {
            where: { id: `${slug}-ch1` },
            create: {
              id: `${slug}-ch1`,
              course: { connect: { slug } },
              titleFa: "فصل ۱: جلسات و سرفصل‌های جامع دوره",
              orderIndex: 1
            }
          }
        },
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
