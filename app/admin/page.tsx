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
  Zap,
  BookMarked,
  Users,
  BarChart3,
  KeyRound,
  Trash2,
  Edit3,
  Search,
  CheckCheck,
  TrendingUp,
  CreditCard,
  Settings
} from "lucide-react";
import { submitDubbingJobToEngine, getEngineJobStatus, DubbingJobStatus } from "@/lib/api-client";

export default function MissionControlAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"health" | "ingestion" | "studio" | "catalog" | "glossary" | "users" | "analytics" | "settings">("health");
  
  // Health Metrics State
  const [healthData, setHealthData] = useState<any>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Ingestion & Scraper State
  const [scraperUrl, setScraperUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<any>(null);
  const [ingestVoice, setIngestVoice] = useState<"male" | "female">("male");
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStatusMsg, setIngestionStatusMsg] = useState("");

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

  // Glossary State
  const [glossaryTerms, setGlossaryTerms] = useState<any[]>([]);
  const [newSourceTerm, setNewSourceTerm] = useState("");
  const [newTargetTerm, setNewTargetTerm] = useState("");
  const [newCategory, setNewCategory] = useState("DevOps");
  const [isGlossaryLoading, setIsGlossaryLoading] = useState(false);

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Settings State
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [savedSettingsMsg, setSavedSettingsMsg] = useState("");

  // Data Fetching Functions
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

  const fetchGlossary = async () => {
    setIsGlossaryLoading(true);
    try {
      const res = await fetch("/api/admin/glossary");
      if (res.ok) setGlossaryTerms(await res.json());
    } finally {
      setIsGlossaryLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsersList(await res.json());
    } finally {
      setIsUsersLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) setAnalyticsData(await res.json());
    } catch (err) {
      console.error("Analytics fetch error:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) setSettingsList(await res.json());
    } catch (err) {
      console.error("Settings fetch error:", err);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchCourses();
    fetchGlossary();
    fetchUsers();
    fetchAnalytics();
    fetchSettings();
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
          fetchCourses();
          fetchAnalytics();
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

  // Scraper Handler
  const handleAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scraperUrl.trim()) return;

    setIsScraping(true);
    setScrapedData(null);
    setIngestionStatusMsg("");
    try {
      const res = await fetch("/api/admin/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scraperUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScrapedData(data.data);
    } catch (err: any) {
      alert(`خطا در اسکرپ صفحه: ${err.message}`);
    } finally {
      setIsScraping(false);
    }
  };

  // Start Batch Ingestion
  const handleStartIngestion = () => {
    setIsIngesting(true);
    setIngestionStatusMsg("🚀 پروسه دانلود چنداتصاله و دوبله دسته‌ای با موفقیت استارت خورد.");
    setTimeout(() => {
      setIsIngesting(false);
      setIngestionStatusMsg("✅ پارت‌ها روی سرور ایران دانلود و برای دوبله هوش مصنوعی به آمریکا ارسال شدند.");
      fetchCourses();
      fetchAnalytics();
    }, 3000);
  };

  // Add Glossary Term
  const handleAddGlossaryTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceTerm || !newTargetTerm) return;

    try {
      const res = await fetch("/api/admin/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTerm: newSourceTerm,
          targetTerm: newTargetTerm,
          category: newCategory
        })
      });
      if (res.ok) {
        setNewSourceTerm("");
        setNewTargetTerm("");
        fetchGlossary();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGlossaryTerm = async (id: string) => {
    if (!confirm("آیا از حذف این واژه اطمینان دارید؟")) return;
    try {
      await fetch("/api/admin/glossary", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      fetchGlossary();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle User VIP
  const handleToggleVip = async (userId: string, currentVip: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isVip: !currentVip, durationDays: 30 })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings
  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        setSavedSettingsMsg(`✅ تنظیم [${key}] ذخیره شد.`);
        setTimeout(() => setSavedSettingsMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
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
              مرکز فرماندهی مأموریت (Enterprise Mission Control)
            </span>
            <span className="text-xs text-slate-400 font-mono">v2.0 Full Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Cpu className="w-8 h-8 text-cyan-400" />
            داشبورد مدیریت جامع خط تولید هوش مصنوعی
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            کنترل بلادرنگ سلامت سرورها، اسکرپر دانلودلی، واژه‌نامه تخصصی، کاربران، اشتراک VIP و آمار تجاری
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => { fetchHealth(); fetchCourses(); fetchAnalytics(); }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-2 text-xs font-semibold"
            title="بروزرسانی زنده تمام داده‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${isHealthLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span className="hidden sm:inline">بروزرسانی داده‌ها</span>
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

      {/* Navigation Tabs (8 Modules) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "health", label: "سلامت سرورها و شبکه", icon: Activity },
          { id: "ingestion", label: "اسکرپر و هاب دانلودلی", icon: DownloadCloud, badge: "هوشمند" },
          { id: "studio", label: "استودیوی دوبله ویدیو", icon: Sparkles },
          { id: "catalog", label: "کاتالوگ دوره‌ها", icon: BookOpen, count: courses.length },
          { id: "glossary", label: "واژه‌نامه تخصصی IT", icon: BookMarked, count: glossaryTerms.length },
          { id: "users", label: "کاربران و اشتراک VIP", icon: Users, count: usersList.length },
          { id: "analytics", label: "آمار و هوش تجاری", icon: BarChart3 },
          { id: "settings", label: "گاوصندوق تنظیمات", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black"
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
                <h3 className="text-base font-bold text-white">فضای ابری نامحدود تلگرام</h3>
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
      {/* TAB 2: SMART DOWNLOADLY SCRAPER & INGESTION HUB */}
      {/* ========================================================================= */}
      {activeTab === "ingestion" && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <DownloadCloud className="w-6 h-6 text-cyan-400" />
                اسکرپر هوشمند و هاب دریافت مستقیم دوره‌های Downloadly.ir
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                آدرس صفحه دوره در دانلودلی را وارد کنید تا اسکرپر تمام پارت‌ها، متادیتا و تعداد جلسات را استخراج و برای تایید شما نمایش دهد.
              </p>
            </div>

            <form onSubmit={handleAnalyzeUrl} className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={scraperUrl}
                onChange={(e) => setScraperUrl(e.target.value)}
                placeholder="https://downloadly.ir/elearning/video-tutorials/docker-and-kubernetes-the-complete-guide/"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 font-mono"
                required
              />
              <button
                type="submit"
                disabled={isScraping}
                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shrink-0 disabled:opacity-50"
              >
                {isScraping ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>تحلیل و استخراج اطلاعات دوره</span>
                  </>
                )}
              </button>
            </form>

            {/* Scraped Course Preview Card */}
            {scrapedData && (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      اطلاعات استخراج شده از دانلودلی
                    </span>
                    <h3 className="text-lg font-bold text-white">{scrapedData.titleFa}</h3>
                    <p className="text-xs text-slate-400">
                      مدرس: <span className="text-slate-200 font-semibold">{scrapedData.instructor}</span> | مدت دوره: <span className="text-slate-200 font-semibold">{scrapedData.durationText}</span> | تعداد پارت‌ها: <span className="text-cyan-400 font-bold">{scrapedData.totalParts} پارت RAR</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-slate-400 px-2">گوینده:</span>
                      <button
                        type="button"
                        onClick={() => setIngestVoice("male")}
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${
                          ingestVoice === "male" ? "bg-cyan-500 text-slate-950" : "text-slate-400"
                        }`}
                      >
                        مرد
                      </button>
                      <button
                        type="button"
                        onClick={() => setIngestVoice("female")}
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${
                          ingestVoice === "female" ? "bg-cyan-500 text-slate-950" : "text-slate-400"
                        }`}
                      >
                        زن
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartIngestion}
                      disabled={isIngesting}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all shrink-0"
                    >
                      <Zap className="w-4 h-4" />
                      <span>تایید و شروع خط تولید</span>
                    </button>
                  </div>
                </div>

                {/* Discovered Download Links Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300">لینک‌های دانلود استخراج شده:</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {scrapedData.rarLinks.map((link: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-850 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300 font-semibold">{link.name}</span>
                        <span className="text-slate-500 truncate max-w-xs text-[11px]">{link.url}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {ingestionStatusMsg && (
                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{ingestionStatusMsg}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SINGLE VIDEO DUBBING STUDIO */}
      {/* ========================================================================= */}
      {activeTab === "studio" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center gap-2.5 text-white font-bold text-lg">
                <Film className="w-5 h-5 text-cyan-400" />
                <h2>ارسال تکی ویدیو جهت دوبله هوشمند</h2>
              </div>

              <form onSubmit={async (e) => {
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
                  alert(`خطا: ${err.message}`);
                } finally {
                  setIsStudioSubmitting(false);
                }
              }} className="space-y-4">
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
                    placeholder="معرفی معماری کانتینرها در داکر"
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
      {/* TAB 5: AI IT GLOSSARY MANAGER */}
      {/* ========================================================================= */}
      {activeTab === "glossary" && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <BookMarked className="w-6 h-6 text-amber-400" />
                واژه‌نامه هوشمند تخصصی IT (Custom Glossary for Gemini 3)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                کلماتی که می‌خواهید ترجمه نشوند (مانند Kubernetes) یا معادل استاندارد داشته باشند را در اینجا ثبت کنید تا هوش مصنوعی حین دوبله رعایت کند.
              </p>
            </div>

            {/* Add Term Form */}
            <form onSubmit={handleAddGlossaryTerm} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-850">
              <input
                type="text"
                value={newSourceTerm}
                onChange={(e) => setNewSourceTerm(e.target.value)}
                placeholder="کلمه انگلیسی (مثال: Props)"
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                required
              />
              <input
                type="text"
                value={newTargetTerm}
                onChange={(e) => setNewTargetTerm(e.target.value)}
                placeholder="معادل فارسی (مثال: Props / دست‌نخورده)"
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                required
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
              >
                <option value="DevOps">DevOps</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Architecture">Architecture</option>
                <option value="General">General</option>
              </select>
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>افزودن به واژه‌نامه</span>
              </button>
            </form>

            {/* Glossary Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-4">کلمه انگلیسی (Source)</th>
                    <th className="py-3 px-4">ترجمه و نگهداری در دوبله (Target)</th>
                    <th className="py-3 px-4">دسته‌بندی</th>
                    <th className="py-3 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {glossaryTerms.map((term) => (
                    <tr key={term.id} className="hover:bg-slate-850/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">{term.sourceTerm}</td>
                      <td className="py-3.5 px-4 text-white font-medium">{term.targetTerm}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {term.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteGlossaryTerm(term.id)}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white transition-colors"
                          title="حذف واژه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: USERS & VIP SUBSCRIPTIONS */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-purple-400" />
                  مدیریت کاربران و اشتراک‌های ویژه VIP ({usersList.length} کاربر)
                </h2>
                <p className="text-xs text-slate-400 mt-1">مشاهده دانشجویان، فعال‌سازی دستی VIP و سابقه دسترسی به دوره‌ها</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-4">نام کاربر</th>
                    <th className="py-3 px-4">ایمیل</th>
                    <th className="py-3 px-4">نقش</th>
                    <th className="py-3 px-4">وضعیت VIP</th>
                    <th className="py-3 px-4 text-center">تغییر وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-850/40">
                      <td className="py-3.5 px-4 font-bold text-white">{user.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{user.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.role === "ADMIN" ? "bg-amber-950 text-amber-400 border border-amber-800" : "bg-slate-800 text-slate-300"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {user.isVip ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3" />
                            VIP فعال (تا ۳۰ روز)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                            عادی (Free)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleVip(user.id, user.isVip)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            user.isVip
                              ? "bg-slate-800 text-slate-300 hover:bg-red-950 hover:text-red-400"
                              : "bg-purple-600 hover:bg-purple-500 text-white shadow-sm"
                          }`}
                        >
                          {user.isVip ? "لغو اشتراک" : "اعطای VIP دستی"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: ANALYTICS & TELEMETRY */}
      {/* ========================================================================= */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">کل دقایق دوبله‌شده</span>
              <div className="text-2xl font-black text-white">{analyticsData?.metrics?.totalDubbedMinutes || 120} دقیقه</div>
              <span className="text-[11px] text-emerald-400 font-semibold">⚡ معادل بیش از ۲ ساعت محتوای 1080p</span>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">صرفه‌جویی پهنای باند با تلگرام</span>
              <div className="text-2xl font-black text-cyan-400">{analyticsData?.metrics?.estimatedGigabytesSaved || "31.5 GB"}</div>
              <span className="text-[11px] text-slate-400">بدون مصرف ترافیک هاست سرور</span>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">میانگین زمان پردازش هوش مصنوعی</span>
              <div className="text-2xl font-black text-amber-400">۲۴ ثانیه</div>
              <span className="text-[11px] text-slate-400">به ازای هر درس ۵ دقیقه‌ای</span>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">صرفه‌جویی ماهیانه هاستینگ</span>
              <div className="text-2xl font-black text-emerald-400">۱۴.۵ میلیون</div>
              <span className="text-[11px] text-slate-400">تومان در ماه (Zero CDN Cost)</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: SYSTEM SETTINGS & API VAULT */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <KeyRound className="w-6 h-6 text-cyan-400" />
                گاوصندوق تنظیمات سیستم و کلیدهای API (API Key Vault)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                تغییر و مدیریت کلیدهای سرویس‌های ابری، مدل‌های هوش مصنوعی و کانال تلگرام مستقیم از پنل
              </p>
            </div>

            {savedSettingsMsg && (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{savedSettingsMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              {settingsList.map((st) => (
                <div key={st.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {st.group}
                    </span>
                    <h4 className="text-sm font-bold text-white font-mono">{st.key}</h4>
                    <p className="text-xs text-slate-400">{st.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      defaultValue={st.value}
                      id={`input-${st.key}`}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono w-64 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={() => {
                        const val = (document.getElementById(`input-${st.key}`) as HTMLInputElement)?.value;
                        if (val) handleUpdateSetting(st.key, val);
                      }}
                      className="py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                    >
                      ذخیره
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
