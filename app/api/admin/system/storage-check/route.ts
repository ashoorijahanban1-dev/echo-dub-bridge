import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export async function GET() {
  const info: Record<string, any> = {};

  // List all storage directories and their contents
  try {
    const { stdout } = await execPromise(
      "find /app/storage -type f -name '*.mp4' 2>/dev/null | head -100 || echo 'NO_STORAGE_DIR'"
    );
    info.mp4Files = stdout.trim().split("\n").filter(Boolean);
  } catch (e: any) { info.mp4Files = e.message; }

  // Check extracted dir
  try {
    const { stdout } = await execPromise(
      "ls -la /app/storage/extracted/ 2>/dev/null || echo 'NO_EXTRACTED_DIR'"
    );
    info.extractedDir = stdout.trim();
  } catch (e: any) { info.extractedDir = e.message; }

  // Check courses dir
  try {
    const { stdout } = await execPromise(
      "ls -laR /app/storage/courses/ 2>/dev/null || echo 'NO_COURSES_DIR'"
    );
    info.coursesDir = stdout.trim();
  } catch (e: any) { info.coursesDir = e.message; }

  // Check downloads dir
  try {
    const { stdout } = await execPromise(
      "ls -la /app/storage/downloads/ 2>/dev/null || echo 'NO_DOWNLOADS_DIR'"
    );
    info.downloadsDir = stdout.trim();
  } catch (e: any) { info.downloadsDir = e.message; }

  // Check public dir for sample video
  try {
    const { stdout } = await execPromise(
      "ls -la /app/public/sample-video.mp4 2>/dev/null || echo 'NO_SAMPLE'"
    );
    info.sampleVideo = stdout.trim();
  } catch (e: any) { info.sampleVideo = e.message; }

  // Disk usage
  try {
    const { stdout } = await execPromise("df -h /app 2>/dev/null || df -h / 2>/dev/null");
    info.disk = stdout.trim();
  } catch (e: any) { info.disk = e.message; }

  return NextResponse.json(info);
}
