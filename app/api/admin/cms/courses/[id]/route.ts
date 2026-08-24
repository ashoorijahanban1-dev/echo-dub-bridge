import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        chapters: {
          include: { episodes: true },
          orderBy: { orderIndex: "asc" }
        }
      }
    });

    if (!course) return NextResponse.json({ error: "دوره یافت نشد." }, { status: 404 });
    return NextResponse.json(course);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { titleFa, titleEn, descriptionFa, instructor, category, level, thumbnailUrl, badgeText, isPublished } = body;

    const course = await prisma.course.update({
      where: { id },
      data: {
        titleFa,
        titleEn,
        descriptionFa,
        instructor,
        category,
        level,
        thumbnailUrl,
        badgeText,
        isPublished
      }
    });

    return NextResponse.json({ success: true, course });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.course.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
