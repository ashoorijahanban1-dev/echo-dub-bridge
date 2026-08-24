import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "آدرس اینترنتی معتبر الزامی است." }, { status: 400 });
    }

    // Fetch page content
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ error: `دریافت صفحه با خطای ${res.status} مواجه شد.` }, { status: 400 });
    }

    const html = await res.text();

    // Extract Title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    let title = titleMatch ? titleMatch[1].replace(/ - دانلود رایگان.*/, "").replace(/دانلود /, "").trim() : "دوره آموزشی";

    // Extract Instructor
    const instructorMatch = html.match(/مدرس\s*:\s*<[^>]+>([^<]+)<\/a>/i) || html.match(/مدرس\s*:\s*([^<\n]+)/i);
    const instructor = instructorMatch ? instructorMatch[1].trim() : "مدرس بین‌المللی";

    // Extract Duration / Lessons count
    const lessonsMatch = html.match(/تعداد دروس\s*:\s*([0-9]+)/i);
    const durationMatch = html.match(/مدت زمان آموزش\s*:\s*([^<\n]+)/i);
    const lessonsCount = lessonsMatch ? parseInt(lessonsMatch[1]) : 24;
    const durationText = durationMatch ? durationMatch[1].trim() : "نامشخص";

    // Extract RAR Download Links
    const rarLinks: { name: string; url: string; size?: string }[] = [];
    const linkRegex = /<a\s+[^>]*href=["'](https?:\/\/[^"']+\.rar)["'][^>]*>(.*?)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const linkUrl = match[1];
      const linkText = match[2].replace(/<[^>]+>/g, "").trim();
      rarLinks.push({
        name: linkText || `پارت ${rarLinks.length + 1}`,
        url: linkUrl
      });
    }

    // Extract Course Slug
    const urlParts = url.split("/").filter(Boolean);
    const slug = urlParts[urlParts.length - 1] || "course-" + Date.now();

    return NextResponse.json({
      success: true,
      data: {
        url,
        slug,
        titleFa: title,
        titleEn: title,
        instructor,
        lessonsCount,
        durationText,
        totalParts: rarLinks.length || 1,
        rarLinks: rarLinks.length > 0 ? rarLinks : [{ name: "لینک مستقیم ویدیو/پارت", url }],
        defaultPassword: "www.downloadly.ir",
        estimatedQuality: "1080p Full HD"
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا در تحلیل صفحه دوره" }, { status: 500 });
  }
}
