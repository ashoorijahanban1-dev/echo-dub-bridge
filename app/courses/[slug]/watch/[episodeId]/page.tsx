import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VideoPlayer from "@/components/player/VideoPlayer";
import EpisodeSidebar from "@/components/player/EpisodeSidebar";
import { ArrowRight, Sparkles, ShieldCheck, Download, Share2, Info } from "lucide-react";

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
      titleFa: "دوره جامع مستری داکر و کانتینرها (۲۰۲۶)",
      titleEn: "Docker Mastery: with Kubernetes + Swarm",
      instructor: "Bret Fisher",
      chapters: [
        {
          id: "c1",
          titleFa: "فصل اول: مبانی کانتینرسازی",
          episodes: [
            {
              id: "ep-1",
              titleFa: "جلسه اول: آشنایی با داکر و تفاوت آن با ماشین‌های مجازی",
              titleEn: "Introduction to Containers & Virtual Machines",
              episodeNumber: 1,
              durationSeconds: 480,
              streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              isFreePreview: true,
            },
            {
              id: "ep-2",
              titleFa: "جلسه دوم: کار با دستورات اصلی داکر (Run, Exec, Logs)",
              titleEn: "Essential Docker CLI Commands in Depth",
              episodeNumber: 2,
              durationSeconds: 620,
              streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
              isFreePreview: true,
            },
          ],
        },
      ],
    };
  }

  // Find active episode
  for (const chap of course.chapters || []) {
    for (const ep of chap.episodes || []) {
      if (ep.id === episodeId) {
        currentEpisode = ep;
        break;
      }
    }
  }

  if (!currentEpisode) {
    currentEpisode = course.chapters?.[0]?.episodes?.[0] || {
      id: episodeId,
      titleFa: "جلسه اول: آموزش تخصصی",
      titleEn: "Episode 1: Core Concepts",
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      durationSeconds: 480,
    };
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
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {currentEpisode.titleEn}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <a
                  href={currentEpisode.streamUrl}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  دانلود ویدیو
                </a>
              </div>
            </div>

            {/* AI Dubbing Info & Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>دوبله شده با گوینده هوشمند: <strong>فرید (Farid Neural)</strong></span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>استریم پرسرعت با سرور اختصاصی ایران (ترافیک نیم‌بها)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Sidebar Column */}
        <div className="lg:col-span-4 h-[600px]">
          <EpisodeSidebar
            courseSlug={course.slug}
            currentEpisodeId={currentEpisode.id}
            chapters={course.chapters || []}
          />
        </div>

      </div>

    </div>
  );
}
