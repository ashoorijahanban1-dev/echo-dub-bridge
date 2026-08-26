import https from "https";

export interface DownloadlyCourseCard {
  url: string;
  slug: string;
  titleFa: string;
  titleEn: string;
  instructor: string;
  category: string;
  totalParts: number;
  thumbnailUrl: string;
  isHot: boolean;
  sourcePage: number;
}

export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function fetchDownloadlyPage(url: string): Promise<{ status: number; html: string }> {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const options: https.RequestOptions = {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: "GET",
        family: 4, // Strict IPv4 to avoid ENOTFOUND/IPv6 timeouts
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1"
        },
        timeout: 14000
      };

      const req = https.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(fetchDownloadlyPage(res.headers.location));
        }

        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          resolve({ status: res.statusCode || 200, html: data });
        });
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("مهلت اتصال به سرور دانلودلی (Timeout 14s) به پایان رسید."));
      });

      req.on("error", (err) => {
        reject(err);
      });

      req.end();
    } catch (e: any) {
      reject(e);
    }
  });
}

export function parseCoursesFromHtml(html: string, pageNum: number = 1): DownloadlyCourseCard[] {
  const linkRegex = /<a\s+[^>]*href=["'](https?:\/\/downloadly\.ir\/elearning\/[a-z0-9\-\/]+)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  const courses: DownloadlyCourseCard[] = [];
  const seenUrls = new Set<string>();

  while ((match = linkRegex.exec(html)) !== null) {
    const courseUrl = match[1];
    const rawTitle = decodeHtmlEntities(match[2]);

    if (
      !rawTitle || 
      rawTitle.length < 8 || 
      rawTitle.includes("ادامه") || 
      rawTitle.includes("دیدگاه") || 
      rawTitle.includes("صفحه") ||
      rawTitle.includes("آموزش‌های") ||
      seenUrls.has(courseUrl)
    ) {
      continue;
    }

    seenUrls.add(courseUrl);

    const titleFa = rawTitle.replace(/^دانلود\s+/i, "").replace(/\s+-\s+دانلود رایگان.*/i, "").trim();
    const urlParts = courseUrl.split("/").filter(Boolean);
    const slug = urlParts[urlParts.length - 1] || "course-" + Date.now();

    const lower = titleFa.toLowerCase();
    const isHot = (
      lower.includes("2026") || 
      lower.includes("2025") || 
      lower.includes("ai") || 
      lower.includes("chatgpt") || 
      lower.includes("docker") || 
      lower.includes("kubernetes") ||
      lower.includes("bootcamp") ||
      lower.includes("fullstack") ||
      lower.includes("vibe")
    );

    let category = "برنامه‌نویسی و DevOps";
    if (lower.includes("python") || lower.includes("django") || lower.includes("fastapi") || lower.includes("backend") || lower.includes("laravel")) {
      category = "بک‌اند و توسعه وب";
    } else if (lower.includes("react") || lower.includes("next") || lower.includes("vue") || lower.includes("angular") || lower.includes("frontend")) {
      category = "فرانت‌اند و جاوااسکریپت";
    } else if (lower.includes("ai") || lower.includes("chatgpt") || lower.includes("langchain") || lower.includes("rag") || lower.includes("machine learning") || lower.includes("data")) {
      category = "هوش مصنوعی و یادگیری ماشین";
    } else if (lower.includes("docker") || lower.includes("kubernetes") || lower.includes("cloud") || lower.includes("azure") || lower.includes("ci/cd") || lower.includes("devops")) {
      category = "دواپس، کلود و کانتینر";
    } else if (lower.includes("crypto") || lower.includes("trading") || lower.includes("finance")) {
      category = "مالی و ارز دیجیتال";
    } else if (lower.includes("design") || lower.includes("graphic") || lower.includes("photoshop")) {
      category = "طراحی و گرافیک";
    }

    courses.push({
      url: courseUrl,
      slug,
      titleFa,
      titleEn: titleFa,
      instructor: "مدرس بین‌المللی Udemy / Coursera",
      category,
      totalParts: 3,
      thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
      isHot,
      sourcePage: pageNum
    });
  }

  return courses;
}
