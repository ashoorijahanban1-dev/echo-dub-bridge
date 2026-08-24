import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const banners = await prisma.siteBanner.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(banners);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, subtitle, badgeText, buttonText, linkUrl, isActive, type } = await request.json();
    if (!title) return NextResponse.json({ error: "عنوان بنر الزامی است." }, { status: 400 });

    const banner = await prisma.siteBanner.create({
      data: {
        title,
        subtitle,
        badgeText,
        buttonText,
        linkUrl,
        isActive: isActive !== undefined ? isActive : true,
        type: type || "PROMO"
      }
    });

    return NextResponse.json({ success: true, banner });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, title, subtitle, badgeText, buttonText, linkUrl, isActive } = await request.json();
    if (!id) return NextResponse.json({ error: "شناسه الزامی است." }, { status: 400 });

    const banner = await prisma.siteBanner.update({
      where: { id },
      data: {
        title,
        subtitle,
        badgeText,
        buttonText,
        linkUrl,
        isActive
      }
    });

    return NextResponse.json({ success: true, banner });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
