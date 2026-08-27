import fs from "fs";
import path from "path";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export function extractRarLinksFromHtml(html: string): string[] {
  const rarRegex = /href=["'](https?:\/\/[^"']+\.rar[^"']*)["']/gi;
  const links: string[] = [];
  let match;
  while ((match = rarRegex.exec(html)) !== null) {
    const rawLink = match[1].replace(/&#038;/g, "&").trim();
    if (!links.includes(rawLink)) {
      links.push(rawLink);
    }
  }
  return links;
}

export async function downloadFileStream(url: string, destPath: string, timeoutSec: number = 600): Promise<void> {
  const dir = path.dirname(destPath);
  fs.mkdirSync(dir, { recursive: true });

  // Use curl with full redirect, auto-resume and referer support
  const cmd = `curl -L --fail --connect-timeout 30 --max-time ${timeoutSec} --referer "https://downloadly.ir/" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -o "${destPath}" "${url}"`;
  console.log(`[Downloader] Executing curl for ${url}`);
  await execPromise(cmd);

  if (!fs.existsSync(destPath) || fs.statSync(destPath).size < 1000) {
    throw new Error("فایل دانلود شده ناقص یا نامعتبر است.");
  }
}

export async function extractRarArchive(rarFilePath: string, outputDir: string, password = "www.downloadly.ir"): Promise<string[]> {
  fs.mkdirSync(outputDir, { recursive: true });

  // Try 7z extraction (allowing non-fatal volume exit codes)
  try {
    const cmd7z = `7z x -p"${password}" -y -o"${outputDir}" "${rarFilePath}"`;
    await execPromise(cmd7z);
  } catch (err7z: any) {
    console.log("[Downloader] 7z non-fatal warning/exit:", err7z.message);
  }

  // Also try 7z flat extract for video formats directly
  try {
    const cmd7zE = `7z e -p"${password}" -y -o"${outputDir}" "${rarFilePath}" "*.mp4" "*.mkv" "*.mov" -r`;
    await execPromise(cmd7zE);
  } catch (err7zE: any) {
    // Non-fatal
  }

  // Scan output directory for valid video files
  const videoFiles: string[] = [];
  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if ([".mp4", ".mkv", ".mov", ".avi", ".ts"].includes(ext)) {
          try {
            const stat = fs.statSync(fullPath);
            if (stat.size > 500000) { // minimum 500KB for real video
              videoFiles.push(fullPath);
            }
          } catch (e) {}
        }
      }
    }
  }

  scanDir(outputDir);
  return videoFiles.sort();
}
