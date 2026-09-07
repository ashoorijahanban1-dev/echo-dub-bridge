import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

function findLocalVideoFile(episode: any, id: string): string | null {
  const candidatePaths: string[] = [];

  // 1. From episode.originalVideoUrl
  if (episode?.originalVideoUrl) {
    const raw = episode.originalVideoUrl;
    const cleanRel = raw.replace(/^\/app\//, "").replace(/^\//, "");
    candidatePaths.push(
      path.join("/app", cleanRel),
      path.join(process.cwd(), cleanRel),
      path.join("/app", raw),
      path.join(process.cwd(), raw),
      raw
    );
  }

  // 2. From course slug
  const slug = episode?.chapter?.course?.slug || (id.includes("-ep") ? id.split("-ep")[0] : null);
  if (slug) {
    const courseDirs = [
      path.join("/app", "storage", "courses", slug),
      path.join(process.cwd(), "storage", "courses", slug)
    ];
    for (const cDir of courseDirs) {
      if (fs.existsSync(cDir)) {
        try {
          const files = fs.readdirSync(cDir);
          const epNum = episode?.episodeNumber || 1;
          const match = files.find(f => f.endsWith(".mp4") && (
            f.startsWith(`${epNum}.`) ||
            f.startsWith(`0${epNum}.`) ||
            f.startsWith(`${epNum} `) ||
            f.startsWith(`0${epNum} `) ||
            (episode?.titleEn && f.includes(episode.titleEn)) ||
            files.length === 1
          )) || files.find(f => f.endsWith(".mp4"));

          if (match) {
            candidatePaths.push(path.join(cDir, match));
          }
        } catch (e) {}
      }
    }
  }

  // 3. Scan storage/courses subfolders
  const storageCourseDirs = [
    path.join("/app", "storage", "courses"),
    path.join(process.cwd(), "storage", "courses")
  ];
  for (const rootDir of storageCourseDirs) {
    if (fs.existsSync(rootDir)) {
      try {
        const subdirs = fs.readdirSync(rootDir);
        for (const sub of subdirs) {
          const subPath = path.join(rootDir, sub);
          if (fs.statSync(subPath).isDirectory()) {
            const files = fs.readdirSync(subPath);
            const m = files.find(f => f.endsWith(".mp4") && (id.includes(sub) || (slug && sub.includes(slug))));
            if (m) {
              candidatePaths.push(path.join(subPath, m));
            }
          }
        }
      } catch (e) {}
    }
  }

  // Test candidate paths in order
  for (const p of candidatePaths) {
    if (p && fs.existsSync(p)) {
      try {
        const st = fs.statSync(p);
        if (st.isFile() && st.size > 1000) {
          return p;
        }
      } catch (e) {}
    }
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let targetFilePath: string | null = null;
    let episode: any = null;

    // 1. Check if episode exists in DB
    try {
      episode = await prisma.episode.findFirst({
        where: {
          OR: [
            { id: id },
            { streamUrl: { contains: id } }
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
    } catch (e) {
      console.error("DB lookup error in stream:", e);
    }

    // If external non-blocked direct HTTP URL
    if (
      episode?.streamUrl &&
      episode.streamUrl.startsWith("http") &&
      !episode.streamUrl.includes("commondatastorage.googleapis.com") &&
      !episode.streamUrl.includes("0.0.0.0")
    ) {
      return NextResponse.redirect(episode.streamUrl, 307);
    }

    // 2. Locate local file on disk
    targetFilePath = findLocalVideoFile(episode, id);

    // 3. Fallback: If not on local disk yet, proxy stream from US AI Engine / Telegram CDN
    if (!targetFilePath) {
      const usEngineIp = process.env.US_ENGINE_IP || "209.145.63.253";
      const usHostHeader = process.env.US_ENGINE_HOST_HEADER || "ai.rpim.ir";

      const outputName = episode?.originalVideoUrl 
        ? path.basename(episode.originalVideoUrl) 
        : (episode?.titleEn ? `${episode.titleEn}.mp4` : null);

      let targetUsUrl = "";
      if (outputName) {
        targetUsUrl = `http://${usEngineIp}/api/v1/stream/output/${encodeURIComponent(outputName)}`;
      } else if (episode?.telegramFileId) {
        targetUsUrl = `http://${usEngineIp}/api/v1/stream/${episode.telegramFileId}`;
      }

      if (targetUsUrl) {
        try {
          const upstreamHeaders: Record<string, string> = {
            "Host": usHostHeader,
            "User-Agent": "RPIM-Internal-Stream-Proxy/1.0"
          };
          const rangeHeader = request.headers.get("range");
          if (rangeHeader) {
            upstreamHeaders["Range"] = rangeHeader;
          }

          const upstreamRes = await fetch(targetUsUrl, {
            headers: upstreamHeaders,
            cache: "no-store"
          });

          if (upstreamRes.ok || upstreamRes.status === 206) {
            const resHeaders = new Headers();
            resHeaders.set("Content-Type", upstreamRes.headers.get("content-type") || "video/mp4");
            resHeaders.set("Accept-Ranges", "bytes");
            resHeaders.set("Access-Control-Allow-Origin", "*");
            resHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

            const contentRange = upstreamRes.headers.get("content-range");
            const contentLength = upstreamRes.headers.get("content-length");
            if (contentRange) resHeaders.set("Content-Range", contentRange);
            if (contentLength) resHeaders.set("Content-Length", contentLength);

            return new NextResponse(upstreamRes.body, {
              status: upstreamRes.status,
              headers: resHeaders
            });
          }
        } catch (proxyErr) {
          console.error("US Engine proxy stream error:", proxyErr);
        }
      }

      // Fallback to sample video if available
      const samplePath = path.join("/app", "public", "sample-video.mp4");
      if (fs.existsSync(samplePath) && fs.statSync(samplePath).size > 1000) {
        targetFilePath = samplePath;
      }
    }

    // 4. If still no video source found, return 404
    if (!targetFilePath || !fs.existsSync(targetFilePath)) {
      return NextResponse.json(
        { error: "ویدیوی این جلسه هنوز آماده نشده است.", code: "VIDEO_NOT_FOUND" },
        { status: 404 }
      );
    }

    const filePath = targetFilePath;
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = request.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      const fileStream = fs.createReadStream(filePath, { start, end });
      const readableStream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        }
      });

      return new NextResponse(readableStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": "video/mp4",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } else {
      const fileStream = fs.createReadStream(filePath);
      const readableStream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        }
      });

      return new NextResponse(readableStream, {
        status: 200,
        headers: {
          "Content-Length": fileSize.toString(),
          "Content-Type": "video/mp4",
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  } catch (error: any) {
    return new NextResponse(`Stream error: ${error.message}`, { status: 500 });
  }
}

