import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { 
  Play, 
  Clock, 
  Star, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  PlayCircle, 
  Layers, 
  Globe2,
  Folder,
  ShieldCheck
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let course: any = null;

  try {
    course = await prisma.course.findUnique({
      where: { slug },
      include: {
        chapters: {
          include: {
            episodes: {
              orderBy: { episodeNumber: "asc" }
            }
          },
          orderBy: { orderIndex: "asc" }
        }
      }
    });
  } catch (e) {
    course = null;
  }

  // Demo fallback course
  if (!course) {
    course = {
      id: "1",
      slug,
      titleFa: "دوره جامع مستری داکر و کانتینرها (۲۰۲۶)",
      titleEn: "Docker Mastery: with Kubernetes + Swarm from a Docker Captain",
      descriptionFa: "جامع‌ترین دوره آموزشی داکر و ارکستراسیون کانتینرها، ساخت ایمیج‌های بهینه، دیپلوی چندکانتینری با Docker Compose و پیاده‌سازی کلاسترهای ابری با صدای دوبله اختصاصی فارسی هوش مصنوعی.",
      instructor: "Bret Fisher",
      instructorRole: "Docker Captain & DevOps Consultant",
      category: "دواپس و کانتینرها",
      level: "مقدماتی تا پیشرفته",
      totalDurationMin: 540,
      thumbnailUrl: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=80",
      badgeText: "دوبله اختصاصی AI",
      rating: 4.9,
      studentsCount: 2450,
      chapters: [
        {
          id: "c1",
          titleFa: "فصل اول: مبانی کانتینرسازی و معماری داکر",
          episodes: [
            {
              id: "ep-1",
              titleFa: "جلسه اول: آشنایی با داکر و تفاوت آن با ماشین‌های مجازی",
              titleEn: "Introduction to Containers & Virtual Machines",
              episodeNumber: 1,
              durationSeconds: 480,
              isFreePreview: true
            },
            {
              id: "ep-2",
              titleFa: "جلسه دوم: کار با دستورات اصلی داکر (Run, Exec, Logs)",
              titleEn: "Essential Docker CLI Commands in Depth",
              episodeNumber: 2,
              durationSeconds: 620,
              isFreePreview: true
            }
          ]
        },
        {
          id: "c2",
          titleFa: "فصل دوم: نوشتن Dockerfile بهینه و بسته‌بندی اپلیکیشن‌ها",
          episodes: [
            {
              id: "ep-3",
              titleFa: "جلسه سوم: ساخت لایه‌های کانتینر با Multi-Stage Builds",
              titleEn: "Optimizing Image Layers with Multi-Stage Builds",
              episodeNumber: 3,
              durationSeconds: 740,
              isFreePreview: false
            }
          ]
        }
      ]
    };
  }

  const firstEpisodeId = course.chapters?.[0]?.episodes?.[0]?.id || "ep-1";
  const totalEpisodesCount = course.chapters?.reduce((acc: number, c: any) => acc + c.episodes.length, 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Course Hero Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Info Column */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {course.badgeText}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
                {course.category}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
                {course.level}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              {course.titleFa}
            </h1>

            <div className="text-xs sm:text-sm text-slate-400 font-mono font-medium">
              {course.titleEn}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {course.descriptionFa}
            </p>

            {/* Meta stats */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>مدرس: <strong className="text-slate-200">{course.instructor}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="font-bold font-mono">{course.rating}</span>
                <span className="text-slate-500 font-normal">({course.studentsCount} دانشجو)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="font-mono">{course.totalDurationMin} دقیقه آموزش</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-slate-500" />
                <span className="font-mono">{totalEpisodesCount} جلسه</span>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-2">
              <Link
                href={`/courses/${course.slug}/watch/${firstEpisodeId}`}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 font-bold text-white shadow-glow hover:opacity-95 active:scale-95 transition-all text-sm"
              >
                <Play className="w-4 h-4 fill-white" />
                تماشای دوره با دوبله فارسی
              </Link>
            </div>

          </div>

          {/* Thumbnail / Video Preview Column */}
          <div className="lg:col-span-4">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl group">
              <img
                src={course.thumbnailUrl}
                alt={course.titleFa}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center">
                <Link
                  href={`/courses/${course.slug}/watch/${firstEpisodeId}`}
                  className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center shadow-glow transform hover:scale-110 active:scale-95 transition-all"
                >
                  <Play className="w-7 h-7 text-white fill-white mr-1" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Curriculum (سرفصل‌های دوره) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              سرفصل‌ها و جلسات دوره
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تمامی جلسات با دو استریم صوتی فارسی (دوبله AI) و انگلیسی اصلی آماده تماشا هستند.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {course.chapters?.map((chap: any) => (
            <div key={chap.id} className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <h3 className="font-bold text-sm text-cyan-300">{chap.titleFa}</h3>
                <span className="text-xs text-slate-500 font-mono">{chap.episodes.length} جلسه</span>
              </div>

              <div className="space-y-2">
                {chap.episodes?.map((ep: any) => (
                  <Link
                    key={ep.id}
                    href={`/courses/${course.slug}/watch/${ep.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/30 transition-all text-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 text-cyan-400 flex items-center justify-center font-bold font-mono group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                        {ep.episodeNumber}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                          {ep.titleFa}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {ep.titleEn}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {ep.isFreePreview && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          پیش‌نمایش رایگان
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        <span>{Math.floor(ep.durationSeconds / 60)} دقیقه</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
