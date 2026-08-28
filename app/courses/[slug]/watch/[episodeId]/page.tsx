import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VideoPlayer from "@/components/player/VideoPlayer";
import EpisodeSidebar from "@/components/player/EpisodeSidebar";
import { ArrowRight, Sparkles, ShieldCheck, Download, Share2, Info, Radio } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WatchEpisodePage({
  params,
}: {
  params: Promise<{ slug: string; episodeId: string }>;
}) {
  const { slug, episodeId } = await params;
  let course: any = null;
  let currentEpisode: any = null;

  try {
    course = await prisma.course.findUnique({
      where: { slug },
      include: {
        chapters: {
          include: {
            episodes: {
              orderBy: { episodeNumber: "asc" },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });
  } catch (e) {
    course = null;
  }

  // Fallback demo course if DB is empty
  if (!course) {
    course = {
      id: "1",
      slug,
      titleFa: "دوره جامع با دوبله اختصاصی فارسی",
      titleEn: slug.replace(/-/g, " ").toUpperCase(),
      instructor: "مدرس بین‌المللی",
      chapters: []
    };
  }

  // Fallback demo course ONLY if DB has no chapters at all
  if (!course.chapters || course.chapters.length === 0) {
    course.chapters = [
      {
        id: "c1",
        titleFa: "فصل ۱: مفاهیم پایه، معماری و راه‌اندازی",
        episodes: [
          {
            id: `${course.slug}-ep1`,
            titleFa: "جلسه ۱: مقدمه و نقشه راه جامع یادگیری",
            titleEn: "01 - Introduction and Learning Roadmap",
            episodeNumber: 1,
            durationSeconds: 480,
            streamUrl: `/api/stream/${course.slug}-ep1`,
            isFreePreview: true,
          }
        ],
      }
    ];
  }

  // Find active episode
  for (const chap of course.chapters || []) {
    for (const ep of chap.episodes || []) {
      if (ep.id === episodeId || ep.id === `${course.slug}-${episodeId}`) {
        currentEpisode = ep;
        break;
      }
    }
  }

  if (!currentEpisode) {
    currentEpisode = course.chapters?.[0]?.episodes?.[0] || {
      id: episodeId,
      titleFa: "جلسه اول: آموزش تخصصی و مقدمات",
      titleEn: "Episode 1: Core Concepts",
      streamUrl: `/api/stream/${episodeId}`,
      durationSeconds: 480,
    };
  }

  // Ensure streamUrl routes to dynamic stream endpoint
  if (
    !currentEpisode.streamUrl ||
    currentEpisode.streamUrl === "/api/stream/video" ||
    currentEpisode.streamUrl.includes("commondatastorage.googleapis.com") ||
    currentEpisode.streamUrl === "/sample-video.mp4"
  ) {
    currentEpisode.streamUrl = `/api/stream/${currentEpisode.id}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Link href="/courses" className="hover:text-cyan-400 transition-colors">
            دوره‌ها
          </Link>
          <span>/</span>
          <Link href={`/courses/${course.slug}`} className="hover:text-cyan-400 transition-colors">
            {course.titleFa}
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-semibold">{currentEpisode.titleFa}</span>
        </div>

        <Link
          href={`/courses/${course.slug}`}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
        >
          <ArrowRight className="w-4 h-4" />
          مشاهده صفحه کامل دوره
        </Link>
      </div>

      {/* Main Player & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Video Player Column */}
        <div className="lg:col-span-8 space-y-5">
          <VideoPlayer
            episodeId={currentEpisode.id}
            streamUrl={currentEpisode.streamUrl}
            title={currentEpisode.titleFa}
            courseTitle={course.titleFa}
            dubbedAudioUrl={currentEpisode.dubbedAudioUrl}
            originalAudioUrl={currentEpisode.originalAudioUrl}
            subtitleFaUrl={currentEpisode.subtitleFaUrl}
            subtitleEnUrl={currentEpisode.subtitleEnUrl}
          />

          {/* Episode Info & Action Bar */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {currentEpisode.titleFa}
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {currentEpisode.titleEn}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  استریم CDN تلگرام
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  دوبله هوش مصنوعی فارسی
                </span>
              </div>
            </div>

            {/* Course & Instructor Context */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div>
                دوره: <strong className="text-slate-200">{course.titleFa}</strong>
              </div>
              <div>
                مدرس: <strong className="text-slate-200">{course.instructor || "مدرس بین‌المللی"}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column: Episodes Playlist */}
        <div className="lg:col-span-4">
          <EpisodeSidebar
            courseSlug={course.slug}
            chapters={course.chapters}
            currentEpisodeId={currentEpisode.id}
          />
        </div>

      </div>

    </div>
  );
}
