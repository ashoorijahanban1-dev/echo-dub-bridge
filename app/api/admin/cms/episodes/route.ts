import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { chapterId, titleFa, titleEn, episodeNumber, durationSeconds, streamUrl, isFreePreview } = await request.json();
    if (!chapterId || !titleFa || !streamUrl) {
      return NextResponse.json({ error: "فصل، عنوان و لینک استریم الزامی است." }, { status: 400 });
    }

    const episode = await prisma.episode.create({
      data: {
        chapterId,
        titleFa,
        titleEn: titleEn || titleFa,
        episodeNumber: episodeNumber || 1,
        durationSeconds: durationSeconds || 300,
        streamUrl,
        isFreePreview: isFreePreview !== undefined ? isFreePreview : false
      }
    });

    return NextResponse.json({ success: true, episode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, titleFa, titleEn, streamUrl, isFreePreview } = await request.json();
    if (!id) return NextResponse.json({ error: "شناسه جلسه الزامی است." }, { status: 400 });

    const episode = await prisma.episode.update({
      where: { id },
      data: {
        titleFa,
        titleEn,
        streamUrl,
        isFreePreview
      }
    });

    return NextResponse.json({ success: true, episode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "شناسه الزامی است." }, { status: 400 });

    await prisma.episode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
