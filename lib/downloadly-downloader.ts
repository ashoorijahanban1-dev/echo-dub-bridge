import fs from "fs";
import path from "path";
import { exec } from "child_process";
import util from "util";
import dns from "dns";
import https from "https";
import http from "http";

const execPromise = util.promisify(exec);

export function extractRarLinksFromHtml(html: string): string[] {
  const rarRegex = /href=["'](https?:\/\/[^"']+\.(?:rar|zip|7z)[^"']*)["']/gi;
  const links: string[] = [];
  let match;
  while ((match = rarRegex.exec(html)) !== null) {
    const rawLink = match[1].replace(/&#038;/g, "&").trim();
    if (!links.includes(rawLink)) {
      links.push(rawLink);
    }
  }
  // Naturally sort multi-part files (part1 before part2 before part10)
  links.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  return links;
}

try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "178.22.122.100", "185.51.200.2"]);
} catch (e) {}

async function resolveHostIp(hostname: string): Promise<string | null> {
  try {
    const ips = await dns.promises.resolve4(hostname);
    if (ips && ips.length > 0) return ips[0];
  } catch (e) {}
  return null;
}

async function getRedirectUrl(urlStr: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const isHttps = parsed.protocol === "https:";
      const req = (isHttps ? https : http).request(urlStr, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://downloadly.ir/"
        },
        timeout: 10000,
        rejectUnauthorized: false
      }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, urlStr).toString();
          resolve(nextUrl);
        } else {
          resolve(urlStr);
        }
      });
      req.on("error", () => resolve(urlStr));
      req.on("timeout", () => { req.destroy(); resolve(urlStr); });
      req.end();
    } catch (e) {
      resolve(urlStr);
    }
  });
}

export async function downloadFileStream(url: string, destPath: string, timeoutSec: number = 1800): Promise<void> {
  const dir = path.dirname(destPath);
  fs.mkdirSync(dir, { recursive: true });

  // Resolve any initial 302 redirects (e.g. dl3.downloadly.ir -> dl3-downloadly.111.ir.cdn.ir)
  let targetUrl = url;
  try {
    const resolvedUrl = await getRedirectUrl(url);
    if (resolvedUrl && resolvedUrl !== url) {
      targetUrl = resolvedUrl;
      console.log(`[Downloader] Redirect detected: ${url} -> ${targetUrl}`);
    }
  } catch (e) {}

  // Resolve IPs for both original and target hostnames using public DNS to bypass Docker DNS limitations
  const hostnamesToResolve: string[] = [];
  try {
    const h1 = new URL(url).hostname;
    if (h1 && !hostnamesToResolve.includes(h1)) hostnamesToResolve.push(h1);
  } catch (e) {}
  try {
    const h2 = new URL(targetUrl).hostname;
    if (h2 && !hostnamesToResolve.includes(h2)) hostnamesToResolve.push(h2);
  } catch (e) {}

  const resolveParts: string[] = [];
  for (const host of hostnamesToResolve) {
    const ip = await resolveHostIp(host);
    if (ip) {
      resolveParts.push(`--resolve "${host}:443:${ip}" --resolve "${host}:80:${ip}"`);
    }
  }
  const resolveArgs = resolveParts.join(" ");

  // Execute curl with resume (-C -), follow-redirects (-L), retry and pre-resolved IPs
  const cmd = `curl -L -C - --fail --retry 3 --connect-timeout 30 --max-time ${timeoutSec} ${resolveArgs} --referer "https://downloadly.ir/" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -o "${destPath}" "${targetUrl}"`;
  console.log(`[Downloader] Executing curl download: ${cmd.substring(0, 160)}...`);
  await execPromise(cmd);

  if (!fs.existsSync(destPath) || fs.statSync(destPath).size < 1000) {
    throw new Error("فایل دانلود شده ناقص یا نامعتبر است.");
  }
}

async function getUnrarExecutablePath(): Promise<string> {
  // Check common binary paths
  const candidatePaths = [
    "/usr/local/bin/unrar",
    "/usr/bin/unrar",
    "/tmp/rar/unrar"
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }

  // Check if unrar is in system PATH
  try {
    const { stdout } = await execPromise("which unrar");
    const pathFound = stdout.trim();
    if (pathFound && fs.existsSync(pathFound)) return pathFound;
  } catch (e) {}

  // If not found, download and extract RARLab unrar to /tmp/rar/unrar
  try {
    console.log("[Downloader] unrar binary not found in system, downloading official RARLab unrar...");
    await execPromise("curl -sL https://www.rarlab.com/rar/rarlinux-x64-624.tar.gz -o /tmp/rarlinux.tar.gz && tar -xzf /tmp/rarlinux.tar.gz -C /tmp/ && chmod +x /tmp/rar/unrar && rm -f /tmp/rarlinux.tar.gz");
    if (fs.existsSync("/tmp/rar/unrar")) {
      console.log("[Downloader] Official RARLab unrar installed to /tmp/rar/unrar successfully");
      return "/tmp/rar/unrar";
    }
  } catch (e: any) {
    console.log("[Downloader] Failed to auto-download unrar:", e.message);
  }

  return "unrar";
}
export async function extractRarArchive(rarFilePath: string, outputDir: string, password = "www.downloadly.ir"): Promise<string[]> {
  fs.mkdirSync(outputDir, { recursive: true });
  const unrarBin = await getUnrarExecutablePath();
  // unrar requires trailing slash on destination directory to distinguish path from file mask
  const targetDir = outputDir.endsWith("/") || outputDir.endsWith("\\") ? outputDir : outputDir + "/";

  // List archive contents for diagnostics
  try {
    const { stdout: listOut } = await execPromise(`"${unrarBin}" lb -p"${password}" "${rarFilePath}"`);
    console.log(`[Downloader] Archive files found:\n${listOut.trim().split("\n").slice(0, 10).join("\n")}`);
  } catch (e: any) {
    console.log(`[Downloader] unrar lb warning: ${e.message}`);
  }

  // 1. Try official unrar extract with full paths (x) and destination with trailing slash
  try {
    const cmdUnrarX = `"${unrarBin}" x -p"${password}" -y -o+ "${rarFilePath}" "${targetDir}"`;
    console.log(`[Downloader] Executing: ${cmdUnrarX}`);
    const { stdout: xOut, stderr: xErr } = await execPromise(cmdUnrarX);
    console.log("[Downloader] unrar x extraction completed:", xOut.slice(-200));
  } catch (errUnrar: any) {
    console.log("[Downloader] unrar x non-fatal warning/exit:", errUnrar.message);
  }

  // 2. Also try official unrar flat extract (e) to dump video files directly into targetDir
  try {
    const cmdUnrarE = `"${unrarBin}" e -p"${password}" -y -o+ "${rarFilePath}" "${targetDir}"`;
    console.log(`[Downloader] Executing fallback: ${cmdUnrarE}`);
    await execPromise(cmdUnrarE);
  } catch (errUnrarE: any) {
    console.log("[Downloader] unrar e non-fatal warning/exit:", errUnrarE.message);
  }

  // 3. Also try 7z extraction as secondary fallback
  try {
    const cmd7z = `7z x -p"${password}" -y -o"${outputDir}" "${rarFilePath}"`;
    await execPromise(cmd7z);
  } catch (err7z: any) {
    console.log("[Downloader] 7z non-fatal warning/exit:", err7z.message);
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
