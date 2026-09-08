import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Known episode file mappings for courses
const COURSE_EPISODE_MAP: Record<string, Record<number, string>> = {
  linux: {
    1: "1 - Introduction.mp4",
    2: "2 - gdisk partition on Linux.mp4",
    3: "3 - LVM partition.mp4",
    4: "4 - Formatting disk partition label in Linux.mp4",
    5: "5 - Summary of disk partition in Linux.mp4"
  },
  java: {
    1: "1. Introduction.mp4",
    2: "1. Java + Spring Boot + SQL + JDBC - Introduction to the course.mp4"
  }
};

function parseEpisodeNumber(id: string, episode: any): number | null {
  if (episode?.episodeNumber && typeof episode.episodeNumber === "number") {
    return episode.episodeNumber;
  }
  const match = id.match(/ep(\d+)/i) || id.match(/_(\d+)$/) || id.match(/-(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

function findLocalDubbedFile(episode: any, id: string, epNum: number | null): string | null {
  const outputDirs = [
    path.join("/app", "storage", "output"),
    path.join(process.cwd(), "storage", "output")
  ];

  const targetBasename = episode?.originalVideoUrl
    ? path.basename(episode.originalVideoUrl).toLowerCase()
    : "";
  const titleEn = episode?.titleEn ? episode.titleEn.toLowerCase() : "";

  for (const oDir of outputDirs) {
    if (fs.existsSync(oDir)) {
      try {
        const files = fs.readdirSync(oDir);
        const match = files.find(f => {
          const fl = f.toLowerCase();
          if (!fl.endsWith(".mp4")) return false;

          // 1. Exact basename match from originalVideoUrl
          if (targetBasename && fl.includes(targetBasename)) return true;

          // 2. Exact title match (if long enough to avoid false positives)
          if (titleEn && titleEn.length > 5 && fl.includes(titleEn)) return true;

          // 3. Strict episode number match ONLY if filename also contains course hints
          if (epNum !== null) {
            const hasEpNum = (
              fl.includes(`_${epNum}.`) ||
              fl.includes(`_${epNum} `) ||
              fl.includes(`_${epNum}-`) ||
              fl.includes(`_${epNum}_`) ||
              fl.includes(`-${epNum}.`) ||
              fl.includes(`-${epNum} `)
            );
            if (!hasEpNum) return false;

            if (id.includes("linux") && (fl.includes("linux") || fl.includes("lvm") || fl.includes("partition") || fl.includes("gdisk") || fl.includes("introduction"))) {
              return true;
            }
            if (id.includes("java") && (fl.includes("java") || fl.includes("spring") || fl.includes("jdbc") || fl.includes("introduction"))) {
              return true;
            }
          }

          return false;
        });

        if (match) {
          const fullPath = path.join(oDir, match);
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 10000) {
            return fullPath;
          }
        }
      } catch (e) {}
    }
  }

  return null;
}

/**
 * Find dubbed file on US engine by querying the /api/v1/output/list endpoint,
 * then matching by episode's original basename or titleEn.
 * Returns the exact filename to use with /api/v1/stream/output/{filename}
 */
async function findDubbedFileOnUsEngine(
  usEngineIp: string,
  usHostHeader: string,
  episode: any,
  id: string,
  epNum: number | null
): Promise<string | null> {
  try {
    const listUrl = `http://${usEngineIp}/api/v1/output/list`;
    const listRes = await fetch(listUrl, {
      headers: {
        "Host": usHostHeader,
        "User-Agent": "RPIM-Internal-Stream-Proxy/1.0"
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });

    if (!listRes.ok) return null;

    const files: any[] = await listRes.json();
    if (!Array.isArray(files)) return null;

    // Build search terms from episode data
    const targetBasename = episode?.originalVideoUrl
      ? decodeURIComponent(path.basename(episode.originalVideoUrl)).toLowerCase()
      : "";
    const titleEn = episode?.titleEn ? episode.titleEn.toLowerCase() : "";

    // Get episode map basename
    let epMapBasename = "";
    if (epNum !== null) {
      if (id.includes("linux") || id.includes("lvm")) {
        epMapBasename = (COURSE_EPISODE_MAP.linux[epNum] || "").toLowerCase();
      } else if (id.includes("java") || id.includes("spring")) {
        epMapBasename = (COURSE_EPISODE_MAP.java[epNum] || "").toLowerCase();
      }
    }

    // Find matching file in the list
    const match = files.find((f: any) => {
      const fname: string = (f.filename || f.name || f || "").toLowerCase();
      if (!fname.endsWith(".mp4")) return false;

      // Decode URL-encoded names (job_123_2%20-%20gdisk... → 2 - gdisk...)
      const fDecoded = decodeURIComponent(fname);

      if (targetBasename && (fname.includes(targetBasename) || fDecoded.includes(targetBasename))) return true;
      if (titleEn && titleEn.length > 5 && (fname.includes(titleEn) || fDecoded.includes(titleEn))) return true;
      if (epMapBasename && (fname.includes(epMapBasename.replace(".mp4", "")) || fDecoded.includes(epMapBasename.replace(".mp4", "")))) return true;

      return false;
    });

    if (match) {
      return match.filename || match.name || match;
    }
  } catch (e) {
    console.error("US engine output list error:", e);
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

    const epNum = parseEpisodeNumber(id, episode);

    // 2. Locate local DUBBED file on disk (ONLY from storage/output, NEVER raw un-dubbed files)
    targetFilePath = findLocalDubbedFile(episode, id, epNum);

    // 3. Fallback: If not on local disk yet, proxy dubbed stream from US AI Engine / Telegram CDN
    if (!targetFilePath) {
      const usEngineIp = process.env.US_ENGINE_IP || "209.145.63.253";
      const usHostHeader = process.env.US_ENGINE_HOST_HEADER || "ai.rpim.ir";

      // STEP 3A: Query US engine's output list to find the exact dubbed filename
      const engineFoundFilename = await findDubbedFileOnUsEngine(usEngineIp, usHostHeader, episode, id, epNum);

      // Build candidate names - prefer exact match from engine list
      const candidateNames: string[] = [];

      if (engineFoundFilename) {
        // Use the exact filename found from engine's output list
        candidateNames.push(engineFoundFilename);
      }

      // Also try common patterns as fallback
      if (episode?.originalVideoUrl) {
        candidateNames.push(path.basename(episode.originalVideoUrl));
      }
      if (episode?.titleEn) {
        candidateNames.push(`${episode.titleEn}.mp4`);
        candidateNames.push(episode.titleEn);
      }

      // Add strict course-episode mapping (NEVER fall back to Ep 1 for other episodes!)
      if (epNum !== null) {
        if (id.includes("linux") || id.includes("lvm")) {
          const linuxFile = COURSE_EPISODE_MAP.linux[epNum];
          if (linuxFile) candidateNames.push(linuxFile);
        } else if (id.includes("java") || id.includes("spring")) {
          const javaFile = COURSE_EPISODE_MAP.java[epNum];
          if (javaFile) candidateNames.push(javaFile);
        }
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
            cache: "no-store",
            signal: AbortSignal.timeout(15000)
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
            cache: "no-store",
            signal: AbortSignal.timeout(15000)
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
    }

    // 4. If no dubbed video source exists, return clean 404 with status information
    // DO NOT silently play Episode 1 or sample video!
    if (!targetFilePath || !fs.existsSync(targetFilePath)) {
      return NextResponse.json(
        {
          status: "QUEUED_FOR_DUBBING",
          code: "EPISODE_IN_PROGRESS",
          message: "این جلسه در استودیوی هوش مصنوعی RPIM TV در نوبت دوبله قرار دارد.",
          episodeId: id,
          episodeNumber: epNum
        },
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
