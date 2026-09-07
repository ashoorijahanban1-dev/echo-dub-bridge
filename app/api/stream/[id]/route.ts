import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

function findLocalDubbedFile(episode: any, id: string): string | null {
  const candidatePaths: string[] = [];
  const outputDirs = [
    path.join("/app", "storage", "output"),
    path.join(process.cwd(), "storage", "output")
  ];

  const targetBasename = episode?.originalVideoUrl
    ? path.basename(episode.originalVideoUrl).toLowerCase()
    : "";
  const titleEn = episode?.titleEn ? episode.titleEn.toLowerCase() : "";
  const epNum = episode?.episodeNumber || 1;

  for (const oDir of outputDirs) {
    if (fs.existsSync(oDir)) {
      try {
        const files = fs.readdirSync(oDir);
        const match = files.find(f => {
          const fl = f.toLowerCase();
          if (!fl.endsWith(".mp4")) return false;
          return (
            (targetBasename && fl.includes(targetBasename)) ||
            (titleEn && fl.includes(titleEn)) ||
            fl.includes(`_${epNum}.`) ||
            fl.includes(`_${epNum} `) ||
            fl.includes(`-${epNum}.`) ||
            fl.includes(`-${epNum} `) ||
            fl.includes(id.toLowerCase())
          );
        });
        if (match) {
          candidatePaths.push(path.join(oDir, match));
        }
      } catch (e) {}
    }
  }

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

    // 2. Locate local DUBBED file on disk (ONLY from storage/output, NEVER raw un-dubbed files)
    targetFilePath = findLocalDubbedFile(episode, id);

    // 3. Fallback: If not on local disk yet, proxy dubbed stream from US AI Engine / Telegram CDN
    if (!targetFilePath) {
      const usEngineIp = process.env.US_ENGINE_IP || "209.145.63.253";
      const usHostHeader = process.env.US_ENGINE_HOST_HEADER || "ai.rpim.ir";

      const candidateNames: string[] = [];
      if (episode?.originalVideoUrl) {
        candidateNames.push(path.basename(episode.originalVideoUrl));
      }
      if (episode?.titleEn) {
        candidateNames.push(`${episode.titleEn}.mp4`);
        candidateNames.push(episode.titleEn);
      }
      if (id.includes("linux") || id.includes("lvm")) {
        candidateNames.push("1 - Introduction.mp4");
      }
      if (id.includes("java") || id.includes("spring")) {
        candidateNames.push("1. Introduction.mp4");
      }
      candidateNames.push(`${id}.mp4`);

      // Try candidates in order against US dubbing engine
      for (const outputName of candidateNames) {
        const targetUsUrl = `http://${usEngineIp}/api/v1/stream/output/${encodeURIComponent(outputName)}`;
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
          console.error(`US Engine proxy stream error for ${outputName}:`, proxyErr);
        }
      }

      // Check Telegram CDN if fileId exists
      if (episode?.telegramFileId) {
        const targetUsUrl = `http://${usEngineIp}/api/v1/stream/${episode.telegramFileId}`;
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
        } catch (tgErr) {
          console.error("Telegram CDN stream error:", tgErr);
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

