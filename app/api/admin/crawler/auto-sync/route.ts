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
    const { mode, page, autoApprove, maxItems, keyword } = await request.json();

    const currentMode = mode || "DAILY_HOT"; // "DAILY_HOT" | "DEEP_ARCHIVE"
    const currentPage = page || 1;
    const limit = maxItems || 15;

    let targetUrls: string[] = [];

    if (currentMode === "DAILY_HOT") {
      // Hot keywords reflecting trending technologies in 2026
      const hotQueries = keyword && keyword.trim() 
        ? [keyword.trim()] 
        : ["udemy", "ai", "2026", "chatgpt", "devops", "fullstack", "react", "python"];
      
      targetUrls = hotQueries.map(q => `https://downloadly.ir/?s=${encodeURIComponent(q)}`);
    } else {
      // DEEP ARCHIVE: Crawl archive page index
      const baseQuery = keyword && keyword.trim() ? encodeURIComponent(keyword.trim()) : "udemy";
      targetUrls = [`https://downloadly.ir/page/${currentPage}/?s=${baseQuery}`];
    }

    const discoveredList: any[] = [];
    const seenUrls = new Set<string>();

    for (const targetUrl of targetUrls) {
      if (discoveredList.length >= limit) break;

      try {
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

        if (!res.ok) continue;

        const html = await res.text();
        const linkRegex = /<a\s+[^>]*href=["'](https?:\/\/downloadly\.ir\/elearning\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
        let match;

        while ((match = linkRegex.exec(html)) !== null) {
          if (discoveredList.length >= limit) break;

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

          const titleFa = rawTitle.replace(/^دانلود\s+/i, "").replace(/\s+-\s+دانلود رایگان.*/i, "").trim();
          const urlParts = courseUrl.split("/").filter(Boolean);
          const slug = urlParts[urlParts.length - 1] || "course-" + Date.now();

          // Calculate Hotness Score
          const lower = titleFa.toLowerCase();
          const isHot = (
            lower.includes("2026") || 
            lower.includes("2025") || 
            lower.includes("ai") || 
            lower.includes("chatgpt") || 
            lower.includes("docker") || 
            lower.includes("kubernetes") ||
            lower.includes("bootcamp") ||
            lower.includes("fullstack")
          );

          // Estimate category
          let category = "برنامه‌نویسی و DevOps";
          if (lower.includes("python") || lower.includes("django") || lower.includes("fastapi") || lower.includes("backend")) {
            category = "بک‌اند و پایتون";
          } else if (lower.includes("react") || lower.includes("next") || lower.includes("vue") || lower.includes("frontend")) {
            category = "فرانت‌اند و وب";
          } else if (lower.includes("ai") || lower.includes("chatgpt") || lower.includes("langchain") || lower.includes("rag") || lower.includes("machine learning")) {
            category = "هوش مصنوعی و داده";
          } else if (lower.includes("docker") || lower.includes("kubernetes") || lower.includes("cloud") || lower.includes("ci/cd") || lower.includes("devops")) {
            category = "دواپس و کلود";
          }

          const existingCourse = await prisma.course.findUnique({ where: { slug } });
          const status = existingCourse ? "DUBBED" : (autoApprove ? "APPROVED" : "DISCOVERED");

          const item = await prisma.discoveredCourse.upsert({
            where: { url: courseUrl },
            update: {
              titleFa,
              category,
              isHot,
              sourcePage: currentPage,
              status: existingCourse ? "DUBBED" : undefined
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
              isHot,
              sourcePage: currentPage,
              status
            }
          });

          // If autoApprove is active and not already dubbed, auto create Course
          if (autoApprove && !existingCourse) {
            const course = await prisma.course.upsert({
              where: { slug: item.slug },
              update: { isPublished: true },
              create: {
                slug: item.slug,
                titleFa: item.titleFa,
                titleEn: item.titleEn || item.titleFa,
                descriptionFa: `دوره آموزشی جامع ${item.titleFa} با دوبله اختصاصی هوش مصنوعی، کیفیت 1080p و دسترسی نامحدود.`,
                instructor: item.instructor || "مدرس بین‌المللی",
                category: item.category,
                thumbnailUrl: item.thumbnailUrl || "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80",
                isPublished: true
              }
            });

            const ch = await prisma.chapter.create({
              data: {
                courseId: course.id,
                titleFa: "فصل ۱: آموزش تخصصی و سرفصل‌های جامع",
                orderIndex: 1
              }
            });

            await prisma.episode.create({
              data: {
                chapterId: ch.id,
                titleFa: "جلسه ۱: مقدمه و شروع کار با مفاهیم اصلی",
                titleEn: "01 - Introduction",
                episodeNumber: 1,
                durationSeconds: 360,
                streamUrl: `/api/stream/${course.slug}-ep1`,
                isFreePreview: true
              }
            });

            await prisma.discoveredCourse.update({
              where: { id: item.id },
              data: { status: "DUBBED" }
            });
          }

          discoveredList.push(item);
        }
      } catch (err) {
        console.error("Auto-sync fetch error for URL:", targetUrl, err);
      }
    }

    return NextResponse.json({
      success: true,
      mode: currentMode,
      page: currentPage,
      count: discoveredList.length,
      autoApprovedCount: autoApprove ? discoveredList.filter(d => d.status === "DUBBED" || d.status === "APPROVED").length : 0,
      discovered: discoveredList
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا در همگام‌سازی خودکار" }, { status: 500 });
  }
}
