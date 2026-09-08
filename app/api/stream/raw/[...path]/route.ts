import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("File path required", { status: 400 });
    }

    const relativePath = pathSegments.map(p => decodeURIComponent(p)).join(path.sep);
    
    // Prevent path traversal
    const safeBaseStorage = path.resolve("/app", "storage", "courses");
    const targetFile = path.resolve(safeBaseStorage, relativePath);

    if (!targetFile.startsWith(safeBaseStorage)) {
      return new NextResponse("Access denied", { status: 403 });
    }

    let filePath = targetFile;
    if (!fs.existsSync(filePath)) {
      // Try process.cwd() fallback
      const localBase = path.resolve(process.cwd(), "storage", "courses");
      const localTarget = path.resolve(localBase, relativePath);
      if (fs.existsSync(localTarget)) {
        filePath = localTarget;
      } else {
        return new NextResponse("Raw file not found on server", { status: 404 });
      }
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
          "Cache-Control": "public, max-age=31536000, immutable"
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
          "Cache-Control": "public, max-age=31536000, immutable"
        }
      });
    }
  } catch (error: any) {
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}
