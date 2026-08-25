import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchDownloadlyPage, parseCoursesFromHtml } from "@/lib/downloadly-fetcher";

export async function POST(request: Request) {
  try {
    let keyword = "udemy";
    try {
      const body = await request.json();
      if (body?.keyword && body.keyword.trim()) {
        keyword = body.keyword.trim();
      }
    } catch {
      // body empty, default to "udemy"
    }

    const targetUrl = `https://downloadly.ir/?s=${encodeURIComponent(keyword)}`;
    let html = "";
    
    try {
      const res = await fetchDownloadlyPage(targetUrl);
      html = res.html;
    } catch (e: any) {
      console.warn("Direct Downloadly fetch warning, using fallback parser:", e.message);
    }

    const parsedCourses = parseCoursesFromHtml(html, 1);
    const discoveredList: any[] = [];

    for (const c of parsedCourses) {
      try {
        const existingCourse = await prisma.course.findUnique({ where: { slug: c.slug } });
        const status = existingCourse ? "DUBBED" : "DISCOVERED";

        const item = await prisma.discoveredCourse.upsert({
          where: { url: c.url },
          update: {
            titleFa: c.titleFa,
            category: c.category,
            isHot: c.isHot,
            sourcePage: 1
          },
          create: {
            url: c.url,
            slug: c.slug,
            titleFa: c.titleFa,
            titleEn: c.titleEn,
            instructor: c.instructor,
            category: c.category,
            totalParts: c.totalParts,
            thumbnailUrl: c.thumbnailUrl,
            isHot: c.isHot,
            sourcePage: 1,
            status
          }
        });
        discoveredList.push(item);
      } catch (dbErr) {
        console.error("DB Upsert error for course:", c.slug, dbErr);
      }
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
