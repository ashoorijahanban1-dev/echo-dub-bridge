import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q");

    const where: any = { isPublished: true };
    if (category) where.category = { contains: category };
    if (q) {
      where.OR = [
        { titleFa: { contains: q } },
        { titleEn: { contains: q } },
        { instructor: { contains: q } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        chapters: {
          include: { episodes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(courses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
