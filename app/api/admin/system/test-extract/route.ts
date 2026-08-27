import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import fs from "fs";
import path from "path";
import { downloadFileStream } from "@/lib/downloadly-downloader";

const execPromise = util.promisify(exec);

export async function POST(request: Request) {
  const { url, password = "www.downloadly.ir" } = await request.json();
  const logs: string[] = [];

  try {
    const tmpDir = path.join("/tmp", "test_extract_" + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    const rarPath = path.join(tmpDir, path.basename(new URL(url).pathname));

    logs.push(`1. Downloading 10MB slice to: ${rarPath}`);
    await downloadFileStream(url, rarPath, 60);

    const stat = fs.statSync(rarPath);
    logs.push(`Downloaded file size: ${stat.size} bytes`);

    logs.push(`2. Running 7z l (list archive contents):`);
    try {
      const { stdout: lOut } = await execPromise(`7z l -p"${password}" "${rarPath}" | head -n 30`);
      logs.push(lOut);
    } catch (e: any) {
      logs.push(`7z l error: ${e.message}`);
    }

    logs.push(`3. Running 7z e to extract first video:`);
    const outDir = path.join(tmpDir, "out");
    fs.mkdirSync(outDir, { recursive: true });
    try {
      const { stdout: eOut, stderr: eErr } = await execPromise(`7z e -p"${password}" -y -o"${outDir}" "${rarPath}" "*.mp4" "*.mkv" -r`);
      logs.push(`7z e stdout: ${eOut}`);
      logs.push(`7z e stderr: ${eErr}`);
    } catch (e: any) {
      logs.push(`7z e error: ${e.message}`);
    }

    const extractedFiles = fs.readdirSync(outDir);
    logs.push(`Extracted files count: ${extractedFiles.length}: ${JSON.stringify(extractedFiles)}`);

    // Clean up
    fs.rmSync(tmpDir, { recursive: true, force: true });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 });
  }
}
