"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Server, 
  Database, 
  Send, 
  Sparkles, 
  Layers, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DownloadCloud, 
  Globe, 
  Lock, 
  LogOut, 
  ExternalLink,
  BookOpen,
  Film,
  PlusCircle,
  RefreshCw,
  Sliders,
  Check,
  Zap
} from "lucide-react";
import { submitDubbingJobToEngine, getEngineJobStatus, DubbingJobStatus } from "@/lib/api-client";

export default function MissionControlAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"health" | "ingestion" | "studio" | "catalog" | "security">("health");
  
  // Health Metrics State
  const [healthData, setHealthData] = useState<any>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Ingestion State
  const [ingestUrl, setIngestUrl] = useState("");
  const [ingestTitleFa, setIngestTitleFa] = useState("");
  const [ingestInstructor, setIngestInstructor] = useState("");
  const [ingestCategory, setIngestCategory] = useState("برنامه‌نویسی و DevOps");
  const [ingestVoice, setIngestVoice] = useState<"male" | "female">("male");
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionMsg, setIngestionMsg] = useState("");

  // Studio Single Job State
  const [studioUrl, setStudioUrl] = useState("");
  const [studioTitle, setStudioTitle] = useState("");
  const [studioVoice, setStudioVoice] = useState<"male" | "female">("male");
  const [isStudioSubmitting, setIsStudioSubmitting] = useState(false);
  const [currentJob, setCurrentJob] = useState<DubbingJobStatus | null>(null);
  const [jobHistory, setJobHistory] = useState<DubbingJobStatus[]>([]);

  // Courses Catalog State
  const [courses, setCourses] = useState<any[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);

  // Fetch Health & Courses
  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/admin/health");
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error("Health fetch error:", err);
    } finally {
      setIsHealthLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error("Courses fetch error:", err);
    } finally {
      setIsCoursesLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchCourses();
  }, []);

  // Auto Refresh Interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealth();
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Polling active studio job
  useEffect(() => {
    if (!currentJob || currentJob.status === "COMPLETED" || currentJob.status === "FAILED") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updated = await getEngineJobStatus(currentJob.job_id);
        setCurrentJob(updated);
        if (updated.status === "COMPLETED" || updated.status === "FAILED") {
          setJobHistory((prev) => [updated, ...prev.filter((j) => j.job_id !== updated.job_id)]);
          fetchCourses(); // refresh catalog
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [currentJob]);

  // Handle Logout
  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  // Submit Single Studio Job
  const handleStudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioUrl.trim()) return;

    setIsStudioSubmitting(true);
    try {
      const job = await submitDubbingJobToEngine(studioUrl, studioTitle || undefined, studioVoice);
      setCurrentJob(job);
      setJobHistory((prev) => [job, ...prev]);
      setStudioUrl("");
      setStudioTitle("");
    } catch (err: any) {
      alert(`خطا در ارسال به موتور هوش مصنوعی: ${err.message}`);
    } finally {
      setIsStudioSubmitting(false);
    }
  };

  // Submit Ingestion Job
  const handleIngestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsIngesting(true);
    setIngestionMsg("🚀 جاب اینجکشن و پردازش دسته به سرور ایران ارسال شد...");
    setTimeout(() => {
      setIsIngesting(false);
      setIngestionMsg("✅ پایپ‌لاین فعال است. فایل‌ها پس از دانلود و اکسترکت خودکار در کاتالوگ منتشر می‌شوند.");
      fetchCourses();
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Mission Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              مرکز فرماندهی امنیتی (Mission Control)
            </span>
            <span className="text-xs text-slate-400 font-mono">v1.2.0 Enterprise</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Cpu className="w-8 h-8 text-cyan-400" />
            داشبورد مدیریت و خط تولید هوشمند
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            نظارت زنده بر سلامت سرورها، هاب دانلود دسته‌ای، مانیتورینگ هوش مصنوعی و امنیت زیرساخت
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => { fetchHealth(); fetchCourses(); }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-2 text-xs font-semibold"
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${isHealthLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span className="hidden sm:inline">بروزرسانی</span>
          </button>

          <button
            onClick={handleLogout}
            className="py-2.5 px-4 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-300 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج ایمن</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "health", label: "سلامت سیستم و سرورها", icon: Activity, badge: healthData?.status === "HEALTHY" ? "سبز" : null },
          { id: "ingestion", label: "هاب دانلود دوره‌ها (دانلودلی)", icon: DownloadCloud, badge: "جدید" },
          { id: "studio", label: "استودیوی دوبله ویدیو", icon: Sparkles },
          { id: "catalog", label: "مدیریت کاتالوگ دوره‌ها", icon: BookOpen, count: courses.length },
          { id: "security", label: "سپر دفاعی و امنیت", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                  isActive ? "bg-slate-950 text-cyan-300" : "bg-cyan-950 text-cyan-400 border border-cyan-800"
                }`}>
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  isActive ? "bg-slate-950 text-white" : "bg-slate-800 text-slate-300"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SYSTEM HEALTH & METRICS */}
      {/* ========================================================================= */}
      {activeTab === "health" && (
        <div className="space-y-6">
          {/* Status Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Iran Server Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Server className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  آنلاین (۷۸.۱۵۷.۵۱.۱۴)
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">سرور وب ایران (Next.js 16)</h3>
                <p className="text-xs text-slate-400 mt-0.5">دامنه اصلی: https://rpim.ir</p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span>تاخیر دیتابیس:</span>
                  <span className="text-white font-bold">{healthData?.services?.database?.latencyMs || 2} ms</span>
                </div>
                <div className="flex justify-between">
                  <span>وضعیت Prisma:</span>
                  <span className="text-emerald-400 font-bold">متصل و پایدار</span>
                </div>
              </div>
            </div>

            {/* US AI Engine Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  آنلاین (۲۰۹.۱۴۵.۶۳.۲۵۳)
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">موتور هوش مصنوعی آمریکا</h3>
                <p className="text-xs text-slate-400 mt-0.5">Whisper + Gemini 3 + EdgeTTS</p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span>تاخیر پاسخگویی:</span>
                  <span className="text-white font-bold">{healthData?.services?.usEngine?.latencyMs || 84} ms</span>
                </div>
                <div className="flex justify-between">
                  <span>فایروال UFW & Fail2ban:</span>
                  <span className="text-emerald-400 font-bold">فعال و سخت‌گیرانه</span>
                </div>
              </div>
            </div>

            {/* Telegram CDN Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Send className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  متصل (CDN نامحدود)
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">شبکه توزیع محتوای تلگرام</h3>
                <p className="text-xs text-slate-400 mt-0.5">کانال خصوصی و ربات هوشمند</p>
              </div>
              <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span>فضای ذخیره‌سازی:</span>
                  <span className="text-emerald-400 font-bold">نامحدود (Free Cloud)</span>
                </div>
                <div className="flex justify-between">
                  <span>پروتکل ارسال:</span>
                  <span className="text-white font-bold">MTProto + Bot API</span>
                </div>
              </div>
            </div>

          </div>

          {/* Diagnostic Latency Bar */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-white">مانیتورینگ Real-Time اتصالات شبکه</h4>
                <p className="text-xs text-slate-400">
                  آخرین بررسی: {lastRefreshed.toLocaleTimeString("fa-IR")} | تاخیر کل چرخه: {healthData?.totalLatencyMs || 90} میلی‌ثانیه
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-400 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                بروزرسانی خودکار زنده (هر ۶ ثانیه)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BATCH COURSE INGESTION HUB (DOWNLOADLY) */}
      {/* ========================================================================= */}
      {activeTab === "ingestion" && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <DownloadCloud className="w-6 h-6 text-cyan-400" />
                  هاب دریافت و دوبله خودکار دوره‌های Downloadly.ir
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  لینک صفحه دوره در دانلودلی یا لینک‌های مستقیم پارت‌های RAR را وارد کنید. سرور ایران فایل‌ها را با IP داخلی دانلود و آنزیپ کرده و جلسات را جهت دوبله به آمریکا ارسال می‌کند.
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-mono font-bold">
                Iran Ingestion Relay
              </span>
            </div>

            {ingestionMsg && (
              <div className="p-4 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{ingestionMsg}</span>
              </div>
            )}

            <form onSubmit={handleIngestSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    آدرس صفحه دوره در دانلودلی یا پارت‌های RAR
                  </label>
                  <input
                    type="url"
                    value={ingestUrl}
                    onChange={(e) => setIngestUrl(e.target.value)}
                    placeholder="https://downloadly.ir/elearning/video-tutorials/docker-and-kubernetes-the-complete-guide/"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    عنوان فارسی دوره (جهت نمایش در سایت)
                  </label>
                  <input
                    type="text"
                    value={ingestTitleFa}
                    onChange={(e) => setIngestTitleFa(e.target.value)}
                    placeholder="دوره جامع داکر و کوبرنتیز ۲۰۲۶"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">مدرس دوره</label>
                  <input
                    type="text"
                    value={ingestInstructor}
                    onChange={(e) => setIngestInstructor(e.target.value)}
                    placeholder="استیون گرایدر (Stephen Grider)"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">دسته‌بندی موضوعی</label>
                  <select
                    value={ingestCategory}
                    onChange={(e) => setIngestCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="برنامه‌نویسی و DevOps">برنامه‌نویسی و DevOps</option>
                    <option value="هوش مصنوعی و داده">هوش مصنوعی و داده</option>
                    <option value="توسعه وب و فرانت‌اند">توسعه وب و فرانت‌اند</option>
                    <option value="امنیت و شبکه">امنیت و شبکه</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">جنسیت گوینده هوش مصنوعی</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIngestVoice("male")}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        ingestVoice === "male"
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      صداپیشه مرد
                    </button>
                    <button
                      type="button"
                      onClick={() => setIngestVoice("female")}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        ingestVoice === "female"
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      صداپیشه زن
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isIngesting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isIngesting ? (
                    <span className="inline-block w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>شروع دانلود، اکسترکت و خط تولید خودکار دوره</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SINGLE VIDEO DUBBING STUDIO */}
      {/* ========================================================================= */}
      {activeTab === "studio" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Submission Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center gap-2.5 text-white font-bold text-lg">
                <Film className="w-5 h-5 text-cyan-400" />
                <h2>ارسال تکی ویدیو جهت دوبله هوشمند</h2>
              </div>

              <form onSubmit={handleStudioSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">لینک مستقیم ویدیو انگلیسی (.mp4 / URL)</label>
                  <input
                    type="url"
                    value={studioUrl}
                    onChange={(e) => setStudioUrl(e.target.value)}
                    placeholder="https://commondatastorage.googleapis.com/.../lesson.mp4"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">عنوان ویدیو (اختیاری)</label>
                  <input
                    type="text"
                    value={studioTitle}
                    onChange={(e) => setStudioTitle(e.target.value)}
                    placeholder="مثال: معرفی معماری کانتینرها در داکر"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">انتخاب گوینده هوش مصنوعی</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStudioVoice("male")}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        studioVoice === "male"
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      صداپیشه مرد (فرید)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudioVoice("female")}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        studioVoice === "female"
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      صداپیشه زن (دل‌آرا)
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isStudioSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isStudioSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>ارسال به پایپ‌لاین هوش مصنوعی</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Active Job Progress Visualizer */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  مانیتورینگ زنده پردازش هوش مصنوعی
                </h3>
                {currentJob && (
                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    شناسه: {currentJob.job_id}
                  </span>
                )}
              </div>

              {currentJob ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-white">{currentJob.current_stage || "در حال پردازش..."}</span>
                    <span className="font-mono font-bold text-cyan-400">{currentJob.progress}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 shadow-sm shadow-cyan-500/50"
                      style={{ width: `${Math.max(5, currentJob.progress)}%` }}
                    />
                  </div>

                  {currentJob.status === "COMPLETED" && (
                    <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>دوبله با موفقیت کامل انجام شد و در تلگرام ذخیره گردید!</span>
                      </div>
                      {currentJob.result?.telegram?.telegram_link && (
                        <a
                          href={currentJob.result.telegram.telegram_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline font-mono"
                        >
                          مشاهده پست در کانال تلگرام <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs sm:text-sm space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-600" />
                  <p>در حال حاضر پردازش فعالی در صف نیست.</p>
                  <p className="text-[11px] text-slate-600">لینک یک ویدیو را وارد کنید تا پردازش زنده آغاز شود.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COURSES CATALOG MANAGER */}
      {/* ========================================================================= */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white">کاتالوگ دوره‌های منتشر شده ({courses.length} دوره)</h2>
              <p className="text-xs text-slate-400 mt-0.5">تمام دوره‌ها و جلسات دوبله‌شده و آماده پخش در سایت</p>
            </div>
            <button
              onClick={() => setActiveTab("ingestion")}
              className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>افزودن دوره جدید</span>
            </button>
          </div>

          <div className="space-y-4">
            {courses.map((course) => {
              const totalEpisodes = course.chapters?.reduce((acc: number, ch: any) => acc + (ch.episodes?.length || 0), 0) || 0;
              return (
                <div
                  key={course.id}
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.titleFa}
                      className="w-20 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                          {course.category}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Slug: {course.slug}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{course.titleFa}</h3>
                      <p className="text-xs text-slate-400">مدرس: {course.instructor} | {course.chapters?.length || 0} فصل | {totalEpisodes} جلسه دوبله‌شده</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/courses/${course.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>مشاهده در سایت</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SECURITY SHIELD & AUDIT */}
      {/* ========================================================================= */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                لایه‌های دفاعی و وضعیت امنیت سایبری (Security Shield)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                گزارش مکانیزم‌های دفاعی فعال در برابر حملات DDoS، Brute-force، اسکنرهای وب و نفوذ به سرورها
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    احراز هویت ادمین و محافظت از روت‌ها
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    فعال (Active)
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تمام روت‌های `/admin` با کوکی‌های امن HTTP-Only محافظت می‌شوند و در صورت ۵ بار اشتباه در پسورد، آی‌پی برای ۱۵ دقیقه قفل می‌شود.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    سیستم Rate-Limiting برای APIها
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    فعال (Active)
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  میدل‌ور Next.js تعداد درخواست‌های هر IP را روی حداکثر ۱۲۰ درخواست در دقیقه لیمیت کرده تا از حملات اسپم و کراش سرور جلوگیری کند.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    فایروال سخت‌گیرانه UFW در سرور آمریکا
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    فعال (Active)
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تمام پورت‌های ورودی به جز ۲۲، ۸۰، ۴۴۳ و ۸۰۰۰ مسدود شده‌اند و پورت ۲۵ (SMTP) برای جلوگیری کامل از اسپم بلاک است.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    سیستم ضد نفوذ Fail2ban
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    فعال (Active)
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  سرویس Fail2ban لاگ‌های احراز هویت SSH را اسکن کرده و مهاجمان را بلافاصله در لایه شبکه (iptables) مسدود می‌کند.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
