import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

/**
 * Serves Persian and English WebVTT (.vtt) and SubRip (.srt) subtitles
 * for video player integration and direct user downloads.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const lang = (searchParams.get("lang") || "fa").toLowerCase();
    const format = (searchParams.get("format") || "vtt").toLowerCase();
    const ext = format === "srt" ? "srt" : "vtt";

    // 1. Check if episode exists in database
    let episode: any = null;
    try {
      episode = await prisma.episode.findFirst({
        where: {
          OR: [
            { id },
            { streamUrl: { contains: id } }
          ]
        },
        include: {
          chapter: {
            include: {
              course: true
            }
          }
        }
      });
    } catch (e) {
      console.error("[Subtitles] DB lookup error:", e);
    }

    // If explicit subtitle URL exists in database
    if (lang === "fa" && episode?.subtitleFaUrl && episode.subtitleFaUrl.startsWith("http")) {
      return NextResponse.redirect(episode.subtitleFaUrl, 307);
    }
    if (lang === "en" && episode?.subtitleEnUrl && episode.subtitleEnUrl.startsWith("http")) {
      return NextResponse.redirect(episode.subtitleEnUrl, 307);
    }

    // 2. Search local disk storage
    const candidatePaths: string[] = [];
    const slug = episode?.chapter?.course?.slug || (id.includes("-ep") ? id.split("-ep")[0] : null);

    if (slug) {
      const courseDirs = [
        path.join(process.cwd(), "storage", "courses", slug),
        path.join("/app", "storage", "courses", slug)
      ];

      for (const cDir of courseDirs) {
        if (fs.existsSync(cDir)) {
          try {
            const files = fs.readdirSync(cDir);
            // Look for matching subtitle file e.g. ep1_fa.vtt or *.fa.vtt
            const match = files.find(f => 
              (f.endsWith(`_${lang}.${ext}`) || f.endsWith(`.${lang}.${ext}`) || f.endsWith(`.${ext}`)) &&
              (f.includes(id) || files.length <= 4)
            );
            if (match) {
              candidatePaths.push(path.join(cDir, match));
            }
          } catch (e) {}
        }
      }
    }

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, "utf-8");
        const mediaType = ext === "vtt" ? "text/vtt; charset=utf-8" : "text/plain; charset=utf-8";
        return new NextResponse(content, {
          status: 200,
          headers: {
            "Content-Type": mediaType,
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400"
          }
        });
      }
    }

    // 3. Fallback: Proxy or redirect from US AI Dubbing Engine
    const usEngineUrl = process.env.NEXT_PUBLIC_US_ENGINE_URL || "http://ai.rpim.ir";
    const usSubtitleUrl = `${usEngineUrl}/api/v1/subtitles/${encodeURIComponent(id)}_${lang}.${ext}`;

    try {
      const res = await fetch(usSubtitleUrl, {
        headers: process.env.INTERNAL_API_SECRET ? {
          "Authorization": `Bearer ${process.env.INTERNAL_API_SECRET}`
        } : {},
        signal: AbortSignal.timeout(5000)
      });

      if (res.ok) {
        const text = await res.text();
        const mediaType = ext === "vtt" ? "text/vtt; charset=utf-8" : "text/plain; charset=utf-8";
        return new NextResponse(text, {
          status: 200,
          headers: {
            "Content-Type": mediaType,
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400"
          }
        });
      }
    } catch (fetchErr) {
      // Ignore network errors and fallback to synthetic cue
    }

    // 4. If no subtitles exist yet, provide a friendly placeholder cue track
    const titleText = episode?.titleFa || "آموزش تخصصی با دوبله فارسی هوش مصنوعی";
    const placeholderVtt = `WEBVTT\n\n1\n00:00:01.000 --> 00:00:08.000\n${titleText} (RPIM TV)\n`;
    const placeholderSrt = `1\n00:00:01,000 --> 00:00:08,000\n${titleText} (RPIM TV)\n`;

    return new NextResponse(ext === "vtt" ? placeholderVtt : placeholderSrt, {
      status: 200,
      headers: {
        "Content-Type": ext === "vtt" ? "text/vtt; charset=utf-8" : "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600"
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
