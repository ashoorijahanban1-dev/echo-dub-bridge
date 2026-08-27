import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import fs from "fs";
import path from "path";
import { downloadFileStream, extractRarArchive } from "@/lib/downloadly-downloader";

const execPromise = util.promisify(exec);

export async function POST(request: Request) {
  const { url, password = "www.downloadly.ir" } = await request.json();
  const logs: string[] = [];

  try {
    const tmpDir = path.join("/tmp", "test_extract_" + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    const rarPath = path.join(tmpDir, path.basename(new URL(url).pathname));

    logs.push(`1. Downloading slice/archive to: ${rarPath}`);
    await downloadFileStream(url, rarPath, 120);

    const stat = fs.statSync(rarPath);
    logs.push(`Downloaded file size: ${stat.size} bytes`);

    logs.push(`2. Running extractRarArchive with official unrar engine:`);
    const outDir = path.join(tmpDir, "out");
    fs.mkdirSync(outDir, { recursive: true });
    
    const extractedVideos = await extractRarArchive(rarPath, outDir, password);
    logs.push(`Extracted videos: ${JSON.stringify(extractedVideos, null, 2)}`);

    // Clean up
    fs.rmSync(tmpDir, { recursive: true, force: true });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 });
  }
}
