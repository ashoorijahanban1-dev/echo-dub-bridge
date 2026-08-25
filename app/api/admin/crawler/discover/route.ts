import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { categoryUrl, keyword } = await request.json();

    // Default target: Downloadly video tutorials main feed or custom keyword search
    let targetUrl = categoryUrl || "https://downloadly.ir/elearning/video-tutorials/";
    if (keyword && keyword.trim()) {
      targetUrl = `https://downloadly.ir/?s=${encodeURIComponent(keyword.trim())}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ error: `دریافت فید دانلودلی با خطای ${res.status} مواجه شد.` }, { status: 400 });
    }

    const html = await res.text();

    // Extract Course Articles from HTML
    const discovered: any[] = [];
    
    // Regex to match article links and titles in Downloadly
    const articleRegex = /<article[^>]*>[\s\S]*?<a\s+[^>]*href=["'](https?:\/\/downloadly\.ir\/elearning\/[^"']+)["'][^>]*>(.*?)<\/a>[\s\S]*?<\/article>/gi;
    let match;

    while ((match = articleRegex.exec(html)) !== null) {
      const courseUrl = match[1];
      let rawTitle = match[2].replace(/<[^>]+>/g, "").trim();
      
      if (!rawTitle || rawTitle.includes("ادامه مطلب") || rawTitle.includes("دیدگاه")) continue;
      
      // Clean title
      const titleFa = rawTitle.replace(/^دانلود\s+/i, "").replace(/\s+-\s+دانلود رایگان.*/i, "").trim();
      const urlParts = courseUrl.split("/").filter(Boolean);
      const slug = urlParts[urlParts.length - 1] || "course-" + Date.now();

      // Estimate category
      let category = "برنامه‌نویسی و DevOps";
      if (titleFa.toLowerCase().includes("python") || titleFa.toLowerCase().includes("django") || titleFa.toLowerCase().includes("fastapi")) {
        category = "بک‌اند و پایتون";
      } else if (titleFa.toLowerCase().includes("react") || titleFa.toLowerCase().includes("next") || titleFa.toLowerCase().includes("vue") || titleFa.toLowerCase().includes("frontend")) {
        category = "فرانت‌اند و وب";
      } else if (titleFa.toLowerCase().includes("ai") || titleFa.toLowerCase().includes("gpt") || titleFa.toLowerCase().includes("machine learning")) {
        category = "هوش مصنوعی و داده";
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
          instructor: "مدرس بین‌المللی",
          category,
          totalParts: 2,
          thumbnailUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80",
          status
        }
      });

      discovered.push(item);
    }

    // If regex was too strict on layout, fallback with link pattern
    if (discovered.length === 0) {
      const simpleLinkRegex = /<a\s+[^>]*href=["'](https?:\/\/downloadly\.ir\/elearning\/video-tutorials\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
      while ((match = simpleLinkRegex.exec(html)) !== null) {
        const courseUrl = match[1];
        let rawTitle = match[2].replace(/<[^>]+>/g, "").trim();
        if (!rawTitle || rawTitle.length < 5 || rawTitle.includes("ادامه") || rawTitle.includes("صفحه")) continue;

        const titleFa = rawTitle.replace(/^دانلود\s+/i, "").trim();
        const urlParts = courseUrl.split("/").filter(Boolean);
        const slug = urlParts[urlParts.length - 1];

        const existingCourse = await prisma.course.findUnique({ where: { slug } });
        const item = await prisma.discoveredCourse.upsert({
          where: { url: courseUrl },
          update: { titleFa },
          create: {
            url: courseUrl,
            slug,
            titleFa,
            titleEn: titleFa,
            category: "برنامه‌نویسی و DevOps",
            status: existingCourse ? "DUBBED" : "DISCOVERED"
          }
        });
        discovered.push(item);
      }
    }

    return NextResponse.json({
      success: true,
      count: discovered.length,
      discovered
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا در پویش خودکار دانلودلی" }, { status: 500 });
  }
}
