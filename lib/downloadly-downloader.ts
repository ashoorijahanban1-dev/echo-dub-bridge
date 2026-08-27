import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export interface ExtractedCourseMedia {
  videoFiles: string[];
  firstLecturePath?: string;
  totalParts: number;
}

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

export function downloadFileStream(url: string, destPath: string, timeoutMs: number = 60000): Promise<void> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === "https:" ? https : http;
    const file = fs.createWriteStream(destPath);

    const req = client.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "GET",
      family: 4,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://downloadly.ir/"
      },
      timeout: timeoutMs
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        return resolve(downloadFileStream(res.headers.location, destPath, timeoutMs));
      }

      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(destPath); } catch (e) {}
        return reject(new Error(`Download failed with HTTP ${res.statusCode}`));
      }

      res.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    });

    req.on("timeout", () => {
      req.destroy();
      file.close();
      try { fs.unlinkSync(destPath); } catch (e) {}
      reject(new Error("مهلت دانلود فایل از سرور دانلودلی به پایان رسید."));
    });

    req.on("error", (err) => {
      file.close();
      try { fs.unlinkSync(destPath); } catch (e) {}
      reject(err);
    });

    req.end();
  });
}

export async function extractRarArchive(rarFilePath: string, outputDir: string, password = "www.downloadly.ir"): Promise<string[]> {
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // Try 7z extraction first
    const cmd7z = `7z x -p"${password}" -y -o"${outputDir}" "${rarFilePath}"`;
    await execPromise(cmd7z);
  } catch (err7z) {
    try {
      // Fallback to unrar command
      const cmdUnrar = `unrar x -p"${password}" -y "${rarFilePath}" "${outputDir}"`;
      await execPromise(cmdUnrar);
    } catch (errUnrar: any) {
      console.warn("[Downloader] 7z/unrar command warning:", errUnrar.message);
    }
  }

  // Find all extracted video files
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
          videoFiles.push(fullPath);
        }
      }
    }
  }

  scanDir(outputDir);
  return videoFiles.sort();
}
