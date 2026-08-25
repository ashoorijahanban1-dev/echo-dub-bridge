import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishCourseToTelegram } from "@/lib/telegram-publisher";

export async function POST(request: Request) {
  try {
    const { courseId, slug } = await request.json();

    let course: any = null;
    if (courseId) {
      course = await prisma.course.findUnique({ where: { id: courseId } });
    } else if (slug) {
      course = await prisma.course.findUnique({ where: { slug } });
    }

    if (!course) {
      return NextResponse.json({ error: "دوره مورد نظر یافت نشد." }, { status: 404 });
    }

    const result = await publishCourseToTelegram({
      courseTitleFa: course.titleFa,
      courseTitleEn: course.titleEn,
      slug: course.slug,
      instructor: course.instructor,
      category: course.category,
      thumbnailUrl: course.thumbnailUrl,
      episodeTitle: "جلسه ۱: مقدمه و شروع کار با مفاهیم اصلی"
    });

    return NextResponse.json({
      success: true,
      message: "دوره و ویدیو با موفقیت به کانال تلگرام ارسال شدند! 🎉",
      result
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
