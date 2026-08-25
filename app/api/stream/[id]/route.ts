import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FALLBACK_STREAM = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let targetUrl: string | null = null;

    try {
      const episode = await prisma.episode.findFirst({
        where: {
          OR: [
            { id: id },
            { streamUrl: { contains: id } }
          ]
        }
      });

      if (episode && episode.streamUrl && (episode.streamUrl.startsWith("http://") || episode.streamUrl.startsWith("https://"))) {
        targetUrl = episode.streamUrl;
      }
    } catch {
      // ignore db error
    }

    if (!targetUrl) {
      targetUrl = FALLBACK_STREAM;
    }

    return NextResponse.redirect(targetUrl, 307);
  } catch (error: any) {
    return NextResponse.redirect(FALLBACK_STREAM, 307);
  }
}
