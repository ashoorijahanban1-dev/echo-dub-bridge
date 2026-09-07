import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CourseCard from "@/components/ui/CourseCard";
import { 
  Tv, 
  Play, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  ArrowLeft,
  Flame,
  Volume2,
  Subtitles,
  Film
} from "lucide-react";

export const dynamic = "force-dynamic";

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

  // Primary curated courses with live Persian dubbed episodes
  const displayCourses = courses.length > 0 ? courses : [
    {
      id: "java-course",
      slug: "mastering-java-spring-boot-rest-apis-and-microservices",
      titleFa: "دوره جامع جاوا و معماری میکروسرویس با Spring Boot",
      titleEn: "Mastering Java, Spring Boot REST APIs and Microservices",
      instructor: "Ranga Karanam",
      category: "برنامه‌نویسی و وب",
      level: "مقدماتی تا پیشرفته",
      totalDurationMin: 611,
      thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
      badgeText: "دوبله اختصاصی",
      rating: 4.95,
      studentsCount: 3820,
      chapters: [{ episodes: [{ id: "mastering-java-spring-boot-rest-apis-and-microservices-ep1" }] }]
    },
    {
      id: "linux-course",
      slug: "linux-partitioning-lvm-hands-on-practical-guide",
      titleFa: "راهنمای تخصصی مدیریت دیسک و LVM در لینوکس",
      titleEn: "Linux Partitioning & LVM: Hands-On Practical Guide",
      instructor: "Imran Afzal",
      category: "دواپس و لینوکس",
      level: "متوسط تا پیشرفته",
      totalDurationMin: 446,
      thumbnailUrl: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=80",
      badgeText: "دوبله اختصاصی",
      rating: 4.9,
      studentsCount: 2150,
      chapters: [{ episodes: [{ id: "linux-partitioning-lvm-hands-on-practical-guide-ep1" }] }]
    }
  ];

  return (
    <div className="space-y-20 pb-20">
      
      {/* 1. Hero Section */}
      <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left/Text */}
            <div className="lg:col-span-7 space-y-6 text-right">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-xs font-bold text-cyan-300 backdrop-blur-md shadow-glow">
                <Tv className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>شبکه پخش آنلاین آموزش‌های تخصصی و فناوری</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                تماشای روان برترین دوره‌های دنیا با{" "}
                <span className="gradient-text-cyan">دوبله فارسی سلیس</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
                دسترسـی آزاد و پیوسته به تخصصی‌ترین دوره‌های بین‌المللی برنامه‌نویسی، دواپس و معماری نرم‌افزار با صدای طبیعی و روان، تصویر Full HD و بدون کوچک‌ترین افت سرعت.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/courses"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 font-bold text-white shadow-glow hover:opacity-95 active:scale-95 transition-all text-sm"
                >
                  <Play className="w-4 h-4 fill-white" />
                  شروع تماشا و آرشیو دوره‌ها
                </Link>

                <Link
                  href="/courses?category=devops"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl glass-panel text-slate-200 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all text-sm font-semibold border border-slate-700/80"
                >
                  <Flame className="w-4 h-4 text-cyan-400" />
                  دوره‌های منتخب ماه
                </Link>
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-800/80 text-right">
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-cyan-400">Full HD</div>
                  <div className="text-xs text-slate-400 mt-0.5">کیفیت بالای تصویر و اسلایدها</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-violet-400">سلیس و گرم</div>
                  <div className="text-xs text-slate-400 mt-0.5">گویندگی روان و بدون رباتیک</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400">استریم پایدار</div>
                  <div className="text-xs text-slate-400 mt-0.5">پخش مستقیم و بی‌وقفه</div>
                </div>
              </div>

            </div>

            {/* Hero Right / Modern Video Player Preview Card */}
            <div className="lg:col-span-5 relative">
              <div className="glass-panel rounded-3xl p-3 border border-slate-700/80 shadow-2xl relative group">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=80"
                    alt="پیش‌نمایش تلویزیون RPIM"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent flex flex-col justify-between p-4">
                    <div className="flex justify-between items-center">
                      <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        در حال پخش
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-[10px] text-slate-300 font-mono">
                        1080p
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-sm font-bold text-white">دوره جامع داکر و کوبرنتیز</div>
                      <div className="text-xs text-cyan-300">قسمت اول: مفاهیم کانتینرها و معماری ابری</div>
                      <div className="w-full h-1.5 bg-slate-800/90 rounded-full mt-2 overflow-hidden">
                        <div className="w-3/5 h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Media Pill */}
                <div className="absolute -bottom-4 -left-4 glass-panel px-4 py-2.5 rounded-2xl border border-cyan-500/40 shadow-glow flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-600/30 flex items-center justify-center text-cyan-300">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-white">دوبله اختصاصی و زیرنویس همگام</div>
                    <div className="text-[9px] text-slate-400">تلفظ دقیق تمامی اصطلاحات فنی</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Media Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            تجربه تماشای هوشمند در <span className="gradient-text-cyan">RPIM TV</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            طراحی شده برای یادگیری متمرکز، بدون خستگی و بدون محدودیت زبانی
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Play className="w-6 h-6 fill-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-white">استریم پایدار و پرسرعت</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              پخش روان و مستقیم ویدیوها با کمترین میزان بافرینگ، ترافیک بهینه و بدون نیاز به ابزارهای جانبی.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
              <Volume2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">گویندگی رسا و طبیعی</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ترجمه مفهومی و دوبله تخصصی با لحن گرم و آموزشی، متناسب با واژگان رایج دنیای مهندسی و نرم‌افزار.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Subtitles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">زیرنویس همگام دو زبانه</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              همراهی دقیق متن زیرنویس فارسی و انگلیسی برای درک عمیق‌تر مفاهیم و یادگیری همزمان واژگان اصلی زبان مبدأ.
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
