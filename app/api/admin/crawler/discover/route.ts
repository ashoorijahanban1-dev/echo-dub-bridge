import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export async function POST(request: Request) {
  try {
    let keyword = "udemy";
    try {
      const body = await request.json();
      if (body?.keyword && body.keyword.trim()) {
        keyword = body.keyword.trim();
      }
    } catch {
      // body empty, use default keyword "udemy"
    }

    const targetUrl = `https://downloadly.ir/?s=${encodeURIComponent(keyword)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ error: `دریافت از دانلودلی با وضعیت ${res.status} مواجه شد.` }, { status: 400 });
    }

    const html = await res.text();

    // Extract all course links and titles
    const linkRegex = /<a\s+[^>]*href=["'](https?:\/\/downloadly\.ir\/elearning\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let match;
    const discoveredList: any[] = [];
    const seenUrls = new Set<string>();

    while ((match = linkRegex.exec(html)) !== null) {
      const courseUrl = match[1];
      const rawTitle = decodeHtmlEntities(match[2]);

      if (
        !rawTitle || 
        rawTitle.length < 6 || 
        rawTitle.includes("ادامه") || 
        rawTitle.includes("دیدگاه") || 
        rawTitle.includes("صفحه") ||
        seenUrls.has(courseUrl)
      ) {
        continue;
      }

      seenUrls.add(courseUrl);

      // Clean title
      const titleFa = rawTitle.replace(/^دانلود\s+/i, "").replace(/\s+-\s+دانلود رایگان.*/i, "").trim();
      const urlParts = courseUrl.split("/").filter(Boolean);
      const slug = urlParts[urlParts.length - 1] || "course-" + Date.now();

      // Estimate category
      let category = "برنامه‌نویسی و DevOps";
      const lower = titleFa.toLowerCase();
      if (lower.includes("python") || lower.includes("django") || lower.includes("fastapi") || lower.includes("backend") || lower.includes("node") || lower.includes("java")) {
        category = "بک‌اند و پایتون";
      } else if (lower.includes("react") || lower.includes("next") || lower.includes("vue") || lower.includes("frontend") || lower.includes("css") || lower.includes("tailwind")) {
        category = "فرانت‌اند و وب";
      } else if (lower.includes("ai") || lower.includes("chatgpt") || lower.includes("langchain") || lower.includes("rag") || lower.includes("machine learning") || lower.includes("generative")) {
        category = "هوش مصنوعی و داده";
      } else if (lower.includes("docker") || lower.includes("kubernetes") || lower.includes("cloud") || lower.includes("aws") || lower.includes("ci/cd") || lower.includes("devops")) {
        category = "دواپس و کلود";
      }

      // Check if already in Courses or DiscoveredCourses
      const existingCourse = await prisma.course.findUnique({ where: { slug } });
      const status = existingCourse ? "DUBBED" : "DISCOVERED";

      const item = await prisma.discoveredCourse.upsert({
        where: { url: courseUrl },
        update: {
          titleFa,
          category,
        },
        create: {
          url: courseUrl,
          slug,
          titleFa,
          titleEn: titleFa,
          instructor: "مدرس بین‌المللی Udemy",
          category,
          totalParts: 3,
          thumbnailUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80",
          status
        }
      });

      discoveredList.push(item);
    }

    return NextResponse.json({
      success: true,
      count: discoveredList.length,
      discovered: discoveredList
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا در پویش خودکار دانلودلی" }, { status: 500 });
  }
}
