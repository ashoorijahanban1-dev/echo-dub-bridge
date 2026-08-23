import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CourseCard from "@/components/ui/CourseCard";
import { 
  Sparkles, 
  Play, 
  Zap, 
  ShieldCheck, 
  Globe2, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  ArrowLeft,
  Headphones
} from "lucide-react";

async function getFeaturedCourses() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        chapters: {
          include: {
            episodes: true
          }
        }
      },
      take: 6,
      orderBy: { createdAt: "desc" }
    });
    return courses;
  } catch (e) {
    return [];
  }
}

export default async function HomePage() {
  const courses = await getFeaturedCourses();

  // Fallback demo courses if DB is clean
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
    }
  ];

  return (
    <div className="space-y-20 pb-20">
      
      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left/Text */}
            <div className="lg:col-span-7 space-y-6 text-right">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-xs font-bold text-cyan-300 backdrop-blur-md shadow-glow">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>اولین پلتفرم یادگیری با دوبله طبیعی هوش مصنوعی در ایران</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                برترین دوره‌های دنیا با{" "}
                <span className="gradient-text-cyan">دوبله فارسی هوش مصنوعی</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
                بدون محدودیت زبان انگلیسی و بدون افت سرعت یا فیلترشکن، تخصصی‌ترین دوره‌های بین‌المللی برنامه‌نویسی و مهندسی نرم‌افزار را با صدای طبیعی فارسی و روان‌ترین ترجمه کانتکست‌یار تماشا کنید.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/courses"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 font-bold text-white shadow-glow hover:opacity-95 active:scale-95 transition-all text-sm"
                >
                  <Play className="w-4 h-4 fill-white" />
                  مشاهده دوره‌ها و شروع یادگیری
                </Link>

                <Link
                  href="/admin/studio"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl glass-panel text-slate-200 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all text-sm font-semibold border border-slate-700/80"
                >
                  <Headphones className="w-4 h-4 text-cyan-400" />
                  استودیوی دوبله جلسه جدید
                </Link>
              </div>

              {/* Trust & Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800/80 text-right">
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-cyan-400">100%</div>
                  <div className="text-xs text-slate-400 mt-0.5">صدای طبیعی بدون رباتیک</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-violet-400">2 Audio</div>
                  <div className="text-xs text-slate-400 mt-0.5">سوییچ فارسی و انگلیسی</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400">No-VPN</div>
                  <div className="text-xs text-slate-400 mt-0.5">پخش پرسرعت نیم‌بها</div>
                </div>
              </div>

            </div>

            {/* Hero Right / Interactive Preview Card */}
            <div className="lg:col-span-5 relative">
              <div className="glass-panel rounded-3xl p-3 border border-slate-700/80 shadow-2xl relative group">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=80"
                    alt="پیش‌نمایش پلیر"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-between p-4">
                    <div className="flex justify-between items-center">
                      <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                        ⚡ دوبله صدم‌ثانیه‌ای Gemini 3
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white">دوره جامع داکر و کوبرنتیز</div>
                      <div className="text-[10px] text-cyan-300 font-mono">جلسه ۱: مفاهیم کانتینرها و ایمیج‌ها</div>
                      <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div className="w-2/3 h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Tech Pill */}
                <div className="absolute -bottom-4 -left-4 glass-panel px-4 py-2.5 rounded-2xl border border-violet-500/40 shadow-glowPurple flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-600/30 flex items-center justify-center text-violet-300">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-white">دیکشنری اصطلاحات IT</div>
                    <div className="text-[9px] text-slate-400">حفظ کلماتی مثل Deploy, Container, State</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            چرا یادگیری با <span className="gradient-text-cyan">EchoDub AI</span> متفاوت است؟
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            تجربه‌ای مدرن با ترکیب هوش مصنوعی، استریم لبه و پلیر اختصاصی دوزبانه
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">پلیر دوزبانه (Dual-Audio)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              هر لحظه که بخواهید، با یک کلیک بین صدای دوبله فارسی و صدای اصلی انگلیسی جابجا شوید بدون افت کیفیت یا مکث در ویدیو.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">ترجمه کانتکست‌یار Gemini 3</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              هوش مصنوعی فقط متن را ترجمه نمی‌کند، بلکه مفاهیم فنی برنامه‌نویسی را درک کرده و با اصطلاحات رایج کامیونیتی توسعه‌دهندگان بیان می‌کند.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">استریم داخلی بدون فیلترشکن</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              با استفاده از معماری هوشمند پروکسی معکوس، تمامی ویدیوها با نهایت سرعت دانلود، ترافیک نیم‌بها و بدون نیاز به VPN پخش می‌شوند.
            </p>
          </div>

        </div>
      </section>

      {/* 3. Featured Courses Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              دوره‌های منتخب و جدیدترین دوبله‌ها
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              یادگیری تخصصی با بالاترین کیفیت صوت و تصویر
            </p>
          </div>

          <Link
            href="/courses"
            className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            مشاهده همه
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

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
      </section>

    </div>
  );
}
