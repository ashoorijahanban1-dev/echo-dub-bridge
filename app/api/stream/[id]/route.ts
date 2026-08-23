import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const episode = await prisma.episode.findUnique({
      where: { id },
    });

    if (!episode || !episode.streamUrl) {
      return NextResponse.json({ error: "Episode or stream not found" }, { status: 404 });
    }

    return NextResponse.redirect(episode.streamUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
