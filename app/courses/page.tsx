import { prisma } from "@/lib/prisma";
import CourseCard from "@/components/ui/CourseCard";
import { Compass, Sparkles, Gift, CheckCircle2, Search } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CoursesCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  let courses: any[] = [];
  try {
    const where: any = { isPublished: true };
    if (resolvedSearchParams?.category && resolvedSearchParams.category !== "all") {
      where.category = { contains: resolvedSearchParams.category };
    }
    if (resolvedSearchParams?.q) {
      where.OR = [
        { titleFa: { contains: resolvedSearchParams.q } },
        { titleEn: { contains: resolvedSearchParams.q } },
        { instructor: { contains: resolvedSearchParams.q } },
      ];
    }
    courses = await prisma.course.findMany({
      where,
      include: {
        chapters: {
          include: { episodes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    courses = [];
  }

  // Fallback demo courses if DB is empty
  const displayCourses = courses.length > 0 ? courses : [
    {
      id: "1",
      slug: "docker-mastery-course",
      titleFa: "دوره جامع مستری داکر و کانتینرها (۲۰۲۶)",
      titleEn: "Docker Mastery: with Kubernetes + Swarm from a Docker Captain",
      instructor: "Bret Fisher",
      category: "دواپس و کانتینرها",
      level: "مقدماتی تا پیشرفته",
      totalDurationMin: 540,
      thumbnailUrl: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=80",
      badgeText: "۱۰۰٪ رایگان",
      rating: 4.9,
      studentsCount: 2450,
      chapters: [{ episodes: [{ id: "ep1" }] }]
    },
    {
      id: "2",
      slug: "fastapi-microservices-masterclass",
      titleFa: "میکروسرویس‌های مقیاس‌پذیر با FastAPI و پایتون",
      titleEn: "Building Scalable Microservices with FastAPI & Python",
      instructor: "Tiangolo (Sebastián)",
      category: "بک‌اند و پایتون",
      level: "متوسط",
      totalDurationMin: 420,
      thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
      badgeText: "۱۰۰٪ رایگان",
      rating: 4.95,
      studentsCount: 1890,
      chapters: [{ episodes: [{ id: "ep2" }] }]
    },
    {
      id: "3",
      slug: "nextjs-fullstack-architecture",
      titleFa: "معماری فول‌استک با Next.js 16 و React Server Components",
      titleEn: "Fullstack Next.js 16, Server Actions & Tailwind Enterprise",
      instructor: "Lee Robinson",
      category: "فرانت‌اند و وب",
      level: "پیشرفته",
      totalDurationMin: 360,
      thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
      badgeText: "۱۰۰٪ رایگان",
      rating: 4.88,
      studentsCount: 3100,
      chapters: [{ episodes: [{ id: "ep3" }] }]
    }
  ];

  const currentCategory = resolvedSearchParams?.category || "all";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* 100% Free Promotional Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-emerald-800/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Gift className="w-6 h-6 animate-bounce" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950">
                🎉 دسترسی رایگان و نامحدود
              </span>
              <span className="text-xs text-emerald-300 font-semibold">کمپین رونمایی EchoDub AI</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              تمام دوره‌ها، صوت فارسی، زبان اصلی و زیرنویس‌ها به صورت ۱۰۰٪ رایگان در دسترس شماست!
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <span className="text-xs text-emerald-300/80 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            کیفیت 1080p بدون نیاز به اشتراک
          </span>
        </div>
      </div>

      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-cyan-400" />
            کاتالوگ دوره‌های آموزشی با دوبله فارسی ({displayCourses.length} دوره)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            مجموعه کامل دوره‌های تخصصی مهندسی نرم‌افزار، دواپس، بک‌اند و هوش مصنوعی
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "همه دوره‌ها" },
            { id: "برنامه‌نویسی", label: "برنامه‌نویسی و DevOps" },
            { id: "پایتون", label: "بک‌اند و پایتون" },
            { id: "وب", label: "فرانت‌اند و وب" }
          ].map((cat) => (
            <Link
              key={cat.id}
              href={`/courses${cat.id === "all" ? "" : `?category=${encodeURIComponent(cat.id)}`}`}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                (currentCategory === cat.id || (cat.id === "all" && !resolvedSearchParams?.category))
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayCourses.map((c: any) => {
          const firstEp = c.chapters?.[0]?.episodes?.[0]?.id;
          return (
            <CourseCard
              key={c.id}
              slug={c.slug}
              titleFa={c.titleFa}
              titleEn={c.titleEn}
              instructor={c.instructor}
              category={c.category}
              level={c.level}
              totalDurationMin={c.totalDurationMin}
              thumbnailUrl={c.thumbnailUrl}
              badgeText="۱۰۰٪ رایگان"
              rating={c.rating}
              studentsCount={c.studentsCount}
              firstEpisodeId={firstEp}
            />
          );
        })}
      </div>

    </div>
  );
}
