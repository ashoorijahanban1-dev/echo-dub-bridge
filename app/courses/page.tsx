import { prisma } from "@/lib/prisma";
import CourseCard from "@/components/ui/CourseCard";
import { Compass, Filter, Search } from "lucide-react";

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
    if (resolvedSearchParams?.category) {
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
      badgeText: "دوبله فارسی AI",
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
      badgeText: "دوبله هوشمند",
      rating: 4.95,
      studentsCount: 1890,
      chapters: [{ episodes: [{ id: "ep2" }] }]
    },
    {
      id: "3",
      slug: "nextjs-fullstack-architecture",
      titleFa: "معماری فول‌استک با Next.js 15 و React Server Components",
      titleEn: "Fullstack Next.js 15, Server Actions & Tailwind Enterprise",
      instructor: "Lee Robinson",
      category: "فرانت‌اند و وب",
      level: "پیشرفته",
      totalDurationMin: 360,
      thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
      badgeText: "جدیدترین انتشار",
      rating: 4.88,
      studentsCount: 3100,
      chapters: [{ episodes: [{ id: "ep3" }] }]
    },
    {
      id: "4",
      slug: "kubernetes-production-guide",
      titleFa: "راهنمای پروداکشن کوبرنتیز و کلود نیتیو",
      titleEn: "Kubernetes for Developers: Core Concepts & Production Deployments",
      instructor: "Dan Wahlin",
      category: "دواپس و کانتینرها",
      level: "پیشرفته",
      totalDurationMin: 480,
      thumbnailUrl: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80",
      badgeText: "دوبله اختصاصی",
      rating: 4.92,
      studentsCount: 1420,
      chapters: [{ episodes: [{ id: "ep4" }] }]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-cyan-400" />
            کاتالوگ دوره‌های آموزشی با دوبله فارسی
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            مجموعه کامل دوره‌های تخصصی مهندسی نرم‌افزار، دواپس، بک‌اند و هوش مصنوعی
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {["همه", "دواپس و کانتینرها", "بک‌اند و پایتون", "فرانت‌اند و وب"].map((cat) => (
            <button
              key={cat}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                cat === "همه"
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
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
              badgeText={c.badgeText}
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
