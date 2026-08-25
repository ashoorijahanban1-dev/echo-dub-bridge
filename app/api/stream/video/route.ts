import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), "public", "sample-video.mp4");

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Video not found on server", { status: 404 });
    }

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
  } catch (err: any) {
    return new NextResponse(`Streaming error: ${err.message}`, { status: 500 });
  }
}
