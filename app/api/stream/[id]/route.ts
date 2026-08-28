import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let targetFilePath: string | null = null;

    // 1. Check if episode exists in DB and locate physical file
    try {
      const episode = await prisma.episode.findFirst({
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

      if (episode) {
        // If external non-blocked URL
        if (
          episode.streamUrl &&
          episode.streamUrl.startsWith("http") &&
          !episode.streamUrl.includes("commondatastorage.googleapis.com") &&
          !episode.streamUrl.includes("0.0.0.0")
        ) {
          return NextResponse.redirect(episode.streamUrl, 307);
        }

        // Check episode originalVideoUrl on disk
        if (episode.originalVideoUrl) {
          const directPath = path.isAbsolute(episode.originalVideoUrl)
            ? episode.originalVideoUrl
            : path.join(process.cwd(), episode.originalVideoUrl.replace(/^\//, ""));
          if (fs.existsSync(directPath)) {
            targetFilePath = directPath;
          }
        }

        // Check storage/courses/{courseSlug}/
        if (!targetFilePath && episode.chapter?.course?.slug) {
          const courseDir = path.join(process.cwd(), "storage", "courses", episode.chapter.course.slug);
          if (fs.existsSync(courseDir)) {
            const files = fs.readdirSync(courseDir);
            // Match by episode number or name
            const matchingFile = files.find(f => 
              f.startsWith(`${episode.episodeNumber}.`) || 
              f.startsWith(`${episode.episodeNumber} -`) ||
              f.includes(episode.titleEn || "") ||
              f.endsWith(".mp4")
            );
            if (matchingFile) {
              targetFilePath = path.join(courseDir, matchingFile);
            }
          }
        }
      }
    } catch (e) {
      console.error("DB lookup error in stream:", e);
    }

    // 2. Fallback to public sample video if no physical video is found
    if (!targetFilePath || !fs.existsSync(targetFilePath)) {
      targetFilePath = path.join(process.cwd(), "public", "sample-video.mp4");
    }

    if (!fs.existsSync(targetFilePath)) {
      return new NextResponse("Video stream unavailable", { status: 404 });
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
