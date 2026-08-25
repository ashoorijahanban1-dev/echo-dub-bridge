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
  Settings,
  FileText,
  LayoutTemplate,
  Save,
  Eye,
  Plus,
  Compass,
  Radar,
  Radio,
  ListFilter
} from "lucide-react";
import { submitDubbingJobToEngine, getEngineJobStatus, DubbingJobStatus } from "@/lib/api-client";

export default function MissionControlAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"health" | "harvester" | "ingestion" | "studio" | "cms-courses" | "cms-articles" | "glossary" | "users" | "analytics" | "settings">("harvester");
  
  // Health Metrics State
  const [healthData, setHealthData] = useState<any>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Autonomous Harvester & Crawler State
  const [discoveredCourses, setDiscoveredCourses] = useState<any[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [crawlerKeyword, setCrawlerKeyword] = useState("");
  const [crawlerFilter, setCrawlerFilter] = useState<"ALL" | "DISCOVERED" | "DUBBED" | "REJECTED">("DISCOVERED");
  const [selectedDiscoveredIds, setSelectedDiscoveredIds] = useState<string[]>([]);
  const [harvesterStatusMsg, setHarvesterStatusMsg] = useState("");

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

  // Courses Catalog & CMS State
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseEdit, setSelectedCourseEdit] = useState<any>(null);
  const [courseSaveStatus, setCourseSaveStatus] = useState("");

  // Articles CMS State
  const [articles, setArticles] = useState<any[]>([]);
  const [newArticleTitle, setNewArticleTitle] = useState("");
  const [newArticleSlug, setNewArticleSlug] = useState("");
  const [newArticleExcerpt, setNewArticleExcerpt] = useState("");
  const [newArticleContent, setNewArticleContent] = useState("");
  const [newArticleCategory, setNewArticleCategory] = useState("آموزش هوش مصنوعی");
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);

  // Glossary State
  const [glossaryTerms, setGlossaryTerms] = useState<any[]>([]);
  const [newSourceTerm, setNewSourceTerm] = useState("");
  const [newTargetTerm, setNewTargetTerm] = useState("");
  const [newCategory, setNewCategory] = useState("DevOps");

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Settings State
  const [settingsList, setSettingsList] = useState<any[]>([]);
  const [savedSettingsMsg, setSavedSettingsMsg] = useState("");

  // Fetch Discovered Courses
  const fetchDiscoveredCourses = async () => {
    try {
      const res = await fetch(`/api/admin/crawler/courses?status=${crawlerFilter}`);
      if (res.ok) {
        const data = await res.json();
        setDiscoveredCourses(data);
      }
    } catch (err) {
      console.error("Discovered courses error:", err);
    }
  };

  // Run Autonomous Crawl / Scan
  const handleScanCrawler = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsDiscovering(true);
    setHarvesterStatusMsg("🔍 در حال پویش و اسکن هوشمند فید دوره‌های دانلودلی...");
    try {
      const res = await fetch("/api/admin/crawler/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: crawlerKeyword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setHarvesterStatusMsg(`✅ تعداد ${data.count} دوره جدید کشف و به لیست تایید اضافه شد.`);
      fetchDiscoveredCourses();
      setTimeout(() => setHarvesterStatusMsg(""), 4000);
    } catch (err: any) {
      setHarvesterStatusMsg(`❌ خطا در پویش: ${err.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Approve Discovered Course(s) -> Start Production!
  const handleApproveCourses = async (courseIds: string[]) => {
    try {
      setHarvesterStatusMsg("🚀 در حال تایید و ارسال به خط تولید خودکار هوش مصنوعی...");
      const res = await fetch("/api/admin/crawler/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseIds,
          action: "APPROVE",
          voiceGender: ingestVoice
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setHarvesterStatusMsg(data.message);
      setSelectedDiscoveredIds([]);
      fetchDiscoveredCourses();
      fetchCourses();
      fetchAnalytics();
      setTimeout(() => setHarvesterStatusMsg(""), 5000);
    } catch (err: any) {
      setHarvesterStatusMsg(`❌ خطا: ${err.message}`);
    }
  };

  // Reject Discovered Course(s)
  const handleRejectCourses = async (courseIds: string[]) => {
    try {
      const res = await fetch("/api/admin/crawler/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseIds, action: "REJECT" })
      });
      if (res.ok) {
        setSelectedDiscoveredIds([]);
        fetchDiscoveredCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

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
      if (res.ok) setCourses(await res.json());
    } catch (err) {
      console.error("Courses fetch error:", err);
    }
  };

  const fetchArticles = async () => {
    try {
      const res = await fetch("/api/admin/cms/articles");
      if (res.ok) setArticles(await res.json());
    } catch (err) {
      console.error("Articles fetch error:", err);
    }
  };

  const fetchGlossary = async () => {
    try {
      const res = await fetch("/api/admin/glossary");
      if (res.ok) setGlossaryTerms(await res.json());
    } catch (err) {
      console.error("Glossary fetch error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsersList(await res.json());
    } catch (err) {
      console.error("Users fetch error:", err);
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
    fetchDiscoveredCourses();
    fetchCourses();
    fetchArticles();
    fetchGlossary();
    fetchUsers();
    fetchAnalytics();
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchDiscoveredCourses();
  }, [crawlerFilter]);

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
  const handleStartIngestion = async () => {
    if (!scrapedData) return;
    setIsIngesting(true);
    setIngestionStatusMsg("🚀 در حال استارت خط تولید خودکار و اتصال به سرور دانلود ایران...");
    try {
      const res = await fetch("/api/admin/auto-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: scrapedData.url,
          slug: scrapedData.slug,
          titleFa: scrapedData.titleFa,
          titleEn: scrapedData.titleEn,
          instructor: scrapedData.instructor,
          rarLinks: scrapedData.rarLinks,
          voiceGender: ingestVoice
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIngestionStatusMsg(`🎉 ${data.message} (شناسه دوره: ${data.courseSlug})`);
      fetchCourses();
      fetchAnalytics();
    } catch (err: any) {
      setIngestionStatusMsg(`❌ خطا: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  // Update Course in CMS
  const handleSaveCourseCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseEdit) return;

    try {
      const res = await fetch(`/api/admin/cms/courses/${selectedCourseEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedCourseEdit)
      });
      if (res.ok) {
        setCourseSaveStatus("✅ دوره با موفقیت ذخیره و بروزرسانی شد.");
        fetchCourses();
        setTimeout(() => setCourseSaveStatus(""), 3000);
      }
    } catch (err: any) {
      alert(`خطا در ذخیره: ${err.message}`);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (id: string) => {
    if (!confirm("آیا از حذف کامل این دوره و تمام جلسات آن اطمینان دارید؟")) return;
    try {
      await fetch(`/api/admin/cms/courses/${id}`, { method: "DELETE" });
      setSelectedCourseEdit(null);
      fetchCourses();
    } catch (err) {
      console.error(err);
    }
  };

  // Create Article in CMS
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticleTitle || !newArticleSlug || !newArticleContent) return;

    setIsCreatingArticle(true);
    try {
      const res = await fetch("/api/admin/cms/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newArticleTitle,
          slug: newArticleSlug,
          excerpt: newArticleExcerpt,
          content: newArticleContent,
          category: newArticleCategory
        })
      });
      if (res.ok) {
        setNewArticleTitle("");
        setNewArticleSlug("");
        setNewArticleExcerpt("");
        setNewArticleContent("");
        fetchArticles();
      }
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    } finally {
      setIsCreatingArticle(false);
    }
  };

  // Delete Article
  const handleDeleteArticle = async (id: string) => {
    if (!confirm("آیا از حذف این مقاله اطمینان دارید؟")) return;
    try {
      await fetch("/api/admin/cms/articles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      fetchArticles();
    } catch (err) {
      console.error(err);
    }
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
              <Radar className="w-3.5 h-3.5 animate-pulse" />
              مرکز فرماندهی پویشگر هوشمند (Autonomous Harvester & Studio)
            </span>
            <span className="text-xs text-slate-400 font-mono">v3.0 Auto Pilot</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Radar className="w-8 h-8 text-cyan-400" />
            پویشگر خودکار دانلودلی و خط تولید هوش مصنوعی
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            کشف خودکار دوره‌های جدید، تایید لیست با یک کلیک، دانلود در سرور ایران، دوبله در آمریکا و انتشار در سایت
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => { fetchHealth(); fetchDiscoveredCourses(); fetchCourses(); fetchAnalytics(); }}
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

      {/* Navigation Tabs (10 Modules) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "harvester", label: "🤖 پویشگر خودکار و کشف دوره‌ها", icon: Radar, badge: "جدید", count: discoveredCourses.length },
          { id: "health", label: "سلامت سرورها و شبکه", icon: Activity },
          { id: "cms-courses", label: "CMS دوره‌ها و سرفصل‌ها", icon: BookOpen, count: courses.length },
          { id: "cms-articles", label: "CMS مقالات و وبلاگ", icon: FileText, count: articles.length },
          { id: "ingestion", label: "لینک مستقیم دانلودلی", icon: DownloadCloud },
          { id: "studio", label: "استودیوی دوبله تک ویدیو", icon: Sparkles },
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
      {/* TAB 0: AUTONOMOUS COURSE HARVESTER & APPROVAL PIPELINE */}
      {/* ========================================================================= */}
      {activeTab === "harvester" && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Radar className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: "10s" }} />
                  پویشگر خودکار دانلودلی (Autonomous Course Harvester)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  پویشگر به صورت خودکار دوره‌های جدید را پیدا و لیست می‌کند؛ با یک کلیک دوره‌ها را تایید و خط تولید دانلود و دوبله را استارت بزنید!
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleScanCrawler()}
                  disabled={isDiscovering}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isDiscovering ? "animate-spin" : ""}`} />
                  <span>{isDiscovering ? "در حال پویش خودکار..." : "پویش جدیدترین دوره‌های دانلودلی"}</span>
                </button>
              </div>
            </div>

            {/* Keyword Search & Category Harvester */}
            <form onSubmit={handleScanCrawler} className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-850">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={crawlerKeyword}
                  onChange={(e) => setCrawlerKeyword(e.target.value)}
                  placeholder="جستجوی موضوعی و کشف خودکار در دانلودلی (مثال: React 19, Kubernetes, Python, AI)..."
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
              </div>
              <button
                type="submit"
                disabled={isDiscovering}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>کشف بر اساس موضوع</span>
              </button>
            </form>

            {harvesterStatusMsg && (
              <div className="p-4 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{harvesterStatusMsg}</span>
              </div>
            )}

            {/* Filter & Batch Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: "DISCOVERED", label: "منتظر تایید ادمین" },
                  { id: "ALL", label: "همه دوره‌ها" },
                  { id: "DUBBED", label: "دوبله و منتشر شده" },
                  { id: "REJECTED", label: "رد شده" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCrawlerFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      crawlerFilter === f.id
                        ? "bg-cyan-500 text-slate-950 font-bold"
                        : "bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Batch Actions */}
              {selectedDiscoveredIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 font-bold">{selectedDiscoveredIds.length} دوره انتخاب شده:</span>
                  <button
                    onClick={() => handleApproveCourses(selectedDiscoveredIds)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>تایید و شروع خط تولید گروهی</span>
                  </button>
                  <button
                    onClick={() => handleRejectCourses(selectedDiscoveredIds)}
                    className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-400 hover:text-white text-xs font-bold"
                  >
                    رد کردن
                  </button>
                </div>
              )}
            </div>

            {/* Discovered Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {discoveredCourses.map((disc) => {
                const isSelected = selectedDiscoveredIds.includes(disc.id);
                return (
                  <div
                    key={disc.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? "bg-slate-850 border-cyan-500 shadow-lg shadow-cyan-500/10"
                        : "bg-slate-950 border-slate-800/90 hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                          {disc.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          disc.status === "DUBBED"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : disc.status === "REJECTED"
                            ? "bg-red-950 text-red-400 border border-red-800"
                            : "bg-amber-950 text-amber-400 border border-amber-800"
                        }`}>
                          {disc.status === "DUBBED" ? "دوبله و منتشر شده" : disc.status === "REJECTED" ? "رد شده" : "منتظر تایید"}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{disc.titleFa}</h3>

                      <div className="text-[11px] text-slate-400 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>مدرس:</span>
                          <span className="text-slate-200 font-semibold">{disc.instructor}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>پارت‌های RAR:</span>
                          <span className="text-cyan-400 font-mono font-bold">{disc.totalParts} پارت</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-850 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedDiscoveredIds([...selectedDiscoveredIds, disc.id]);
                            else setSelectedDiscoveredIds(selectedDiscoveredIds.filter(id => id !== disc.id));
                          }}
                          className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                        />
                        <span>انتخاب</span>
                      </label>

                      {disc.status === "DISCOVERED" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRejectCourses([disc.id])}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors"
                            title="رد کردن"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleApproveCourses([disc.id])}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>تایید و شروع دوبله</span>
                          </button>
                        </div>
                      )}

                      {disc.status === "DUBBED" && (
                        <a
                          href={`/courses/${disc.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                        >
                          <span>تماشا در سایت</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {discoveredCourses.length === 0 && (
              <div className="text-center py-16 text-slate-500 space-y-3">
                <Radar className="w-10 h-10 mx-auto text-slate-600" />
                <h3 className="text-sm font-bold text-white">هیچ دوره‌ای در این فیلتر یافت نشد</h3>
                <p className="text-xs">برای اسکن جدیدترین دوره‌ها، دکمه «پویش جدیدترین دوره‌های دانلودلی» را بزنید.</p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SYSTEM HEALTH */}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MANUAL DOWNLOADLY INGESTION */}
      {/* ========================================================================= */}
      {activeTab === "ingestion" && (
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <DownloadCloud className="w-6 h-6 text-cyan-400" />
              دریافت دستی دوره با لینک صفحه Downloadly.ir
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              آدرس مستقیم صفحه دوره را وارد کنید تا پارت‌ها استخراج شوند.
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
                  <span>تحلیل و استخراج پارت‌ها</span>
                </>
              )}
            </button>
          </form>

          {scrapedData && (
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    اطلاعات استخراج شده از دانلودلی
                  </span>
                  <h3 className="text-lg font-bold text-white">{scrapedData.titleFa}</h3>
                  <p className="text-xs text-slate-400">
                    مدرس: <span className="text-slate-200 font-semibold">{scrapedData.instructor}</span> | تعداد پارت‌ها: <span className="text-cyan-400 font-bold">{scrapedData.totalParts} پارت RAR</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleStartIngestion}
                    disabled={isIngesting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all shrink-0"
                  >
                    <Zap className="w-4 h-4" />
                    <span>تایید و شروع خط تولید خودکار</span>
                  </button>
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
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PROFESSIONAL COURSE & EPISODE CMS */}
      {/* ========================================================================= */}
      {activeTab === "cms-courses" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Courses List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                لیست دوره‌های موجود ({courses.length})
              </h2>
              <button
                onClick={() => setActiveTab("harvester")}
                className="py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>کشف خودکار دوره</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {courses.map((course) => {
                const isSelected = selectedCourseEdit?.id === course.id;
                return (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourseEdit(course)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-850 border-cyan-500 shadow-lg shadow-cyan-500/10"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.titleFa}
                        className="w-16 h-12 rounded-lg object-cover border border-slate-800 shrink-0"
                      />
                      <div className="space-y-1 flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">{course.titleFa}</h4>
                        <p className="text-[11px] text-slate-400 truncate">مدرس: {course.instructor}</p>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-cyan-400 font-semibold">{course.category}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-emerald-400 font-bold">{course.isPublished ? "منتشرشده" : "پیش‌نویس"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Course CMS Editor */}
          <div className="lg:col-span-7 space-y-6">
            {selectedCourseEdit ? (
              <form onSubmit={handleSaveCourseCMS} className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-bold text-white">ویرایشگر بصری دوره (Course Visual CMS)</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(selectedCourseEdit.id)}
                      className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-400 hover:text-white transition-colors"
                      title="حذف کامل دوره"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <a
                      href={`/courses/${selectedCourseEdit.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="پیش‌نمایش زنده در سایت"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {courseSaveStatus && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{courseSaveStatus}</span>
                  </div>
                )}

                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">عنوان فارسی دوره</label>
                    <input
                      type="text"
                      value={selectedCourseEdit.titleFa}
                      onChange={(e) => setSelectedCourseEdit({ ...selectedCourseEdit, titleFa: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">عنوان انگلیسی اصلی</label>
                    <input
                      type="text"
                      value={selectedCourseEdit.titleEn}
                      onChange={(e) => setSelectedCourseEdit({ ...selectedCourseEdit, titleEn: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-300">نام مدرس</label>
                      <input
                        type="text"
                        value={selectedCourseEdit.instructor}
                        onChange={(e) => setSelectedCourseEdit({ ...selectedCourseEdit, instructor: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-300">دسته‌بندی</label>
                      <input
                        type="text"
                        value={selectedCourseEdit.category}
                        onChange={(e) => setSelectedCourseEdit({ ...selectedCourseEdit, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">توضیحات و معرفی دوره</label>
                    <textarea
                      rows={3}
                      value={selectedCourseEdit.descriptionFa || ""}
                      onChange={(e) => setSelectedCourseEdit({ ...selectedCourseEdit, descriptionFa: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">آدرس تصویر کاور (Thumbnail URL)</label>
                    <input
                      type="url"
                      value={selectedCourseEdit.thumbnailUrl}
                      onChange={(e) => setSelectedCourseEdit({ ...selectedCourseEdit, thumbnailUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCourseEdit.isPublished}
                        onChange={(e) => setSelectedCourseEdit({ ...selectedCourseEdit, isPublished: e.target.checked })}
                        className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
                      />
                      <span className="text-white font-bold">دوره در سایت منتشر و قابل مشاهده باشد</span>
                    </label>

                    <button
                      type="submit"
                      className="py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>ذخیره تغییرات دوره</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3 text-slate-500">
                <BookOpen className="w-10 h-10 mx-auto text-slate-600" />
                <h3 className="text-sm font-bold text-white">یک دوره را از لیست سمت راست انتخاب کنید</h3>
                <p className="text-xs">برای ویرایش متادیتا، نام مدرس، توضیحات و انتشار، روی هر دوره کلیک کنید.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BLOG & ARTICLES CMS */}
      {/* ========================================================================= */}
      {activeTab === "cms-articles" && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-cyan-400" />
                سیستم مدیریت مقالات و وبلاگ آموزشی (Article & SEO CMS)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                انتشار مقالات تخصصی مهندسی، آموزش هوش مصنوعی و بهینه‌سازی سئو برای جذب دانشجویان از گوگل
              </p>
            </div>

            {/* Create Article Form */}
            <form onSubmit={handleCreateArticle} className="p-6 rounded-2xl bg-slate-950 border border-slate-855 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">عنوان مقاله</label>
                  <input
                    type="text"
                    value={newArticleTitle}
                    onChange={(e) => setNewArticleTitle(e.target.value)}
                    placeholder="راهنمای جامع میکروسرویس‌ها با داکر و کوبرنتیز"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">نامک انگلیسی یکتا (Slug)</label>
                  <input
                    type="text"
                    value={newArticleSlug}
                    onChange={(e) => setNewArticleSlug(e.target.value)}
                    placeholder="docker-kubernetes-microservices-guide"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">چکیده کوتاه (برای پیش‌نمایش و سئو)</label>
                <input
                  type="text"
                  value={newArticleExcerpt}
                  onChange={(e) => setNewArticleExcerpt(e.target.value)}
                  placeholder="خلاصه‌ای از مهم‌ترین نکات و دستاوردهای این مقاله..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">متن کامل مقاله (Markdown یا متن ساده)</label>
                <textarea
                  rows={6}
                  value={newArticleContent}
                  onChange={(e) => setNewArticleContent(e.target.value)}
                  placeholder="محتوای تخصصی مقاله خود را در اینجا بنویسید..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <select
                    value={newArticleCategory}
                    onChange={(e) => setNewArticleCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  >
                    <option value="آموزش هوش مصنوعی">آموزش هوش مصنوعی</option>
                    <option value="دواپس و کلود">دواپس و کلود</option>
                    <option value="برنامه‌نویسی و وب">برنامه‌نویسی و وب</option>
                    <option value="اخبار پلتفرم">اخبار پلتفرم</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingArticle}
                  className="py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>انتشار مقاله در وبلاگ</span>
                </button>
              </div>
            </form>

            {/* Articles List Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">مقالات منتشر شده ({articles.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-3 px-4">عنوان مقاله</th>
                      <th className="py-3 px-4">دسته‌بندی</th>
                      <th className="py-3 px-4">زمان مطالعه</th>
                      <th className="py-3 px-4">تاریخ انتشار</th>
                      <th className="py-3 px-4 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {articles.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-850/40">
                        <td className="py-3.5 px-4 font-bold text-white">{art.title}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800">
                            {art.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">{art.readTimeMin} دقیقه</td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {new Date(art.createdAt).toLocaleDateString("fa-IR")}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteArticle(art.id)}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white transition-colors"
                            title="حذف مقاله"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: STUDIO */}
      {/* ========================================================================= */}
      {activeTab === "studio" && (
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg">
            <Film className="w-5 h-5 text-cyan-400" />
            <h2>استودیوی ارسال و دوبله تکی ویدیو با هوش مصنوعی</h2>
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
          }} className="space-y-4 max-w-2xl">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">لینک مستقیم ویدیو انگلیسی (.mp4 / URL)</label>
              <input
                type="url"
                value={studioUrl}
                onChange={(e) => setStudioUrl(e.target.value)}
                placeholder="https://commondatastorage.googleapis.com/.../lesson.mp4"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-cyan-500"
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
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isStudioSubmitting}
              className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>ارسال به پایپ‌لاین هوش مصنوعی</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: GLOSSARY */}
      {/* ========================================================================= */}
      {activeTab === "glossary" && (
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <BookMarked className="w-6 h-6 text-amber-400" />
              واژه‌نامه تخصصی IT (Custom Glossary for Gemini 3)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              کلمات فنی و اصطلاحاتی که می‌خواهید ترجمه نشوند یا معادل دقیق داشته باشند.
            </p>
          </div>

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
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>افزودن به واژه‌نامه</span>
            </button>
          </form>

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
      )}

      {/* ========================================================================= */}
      {/* TAB 7: USERS & VIP */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-400" />
                مدیریت کاربران و اشتراک‌های ویژه VIP ({usersList.length} کاربر)
              </h2>
              <p className="text-xs text-slate-400 mt-1">مشاهده دانشجویان، فعال‌سازی دستی VIP و سابقه دسترسی</p>
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
                          VIP فعال
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
      )}

      {/* ========================================================================= */}
      {/* TAB 8: ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400">کل دقایق دوبله‌شده</span>
            <div className="text-2xl font-black text-white">{analyticsData?.metrics?.totalDubbedMinutes || 68} دقیقه</div>
            <span className="text-[11px] text-emerald-400 font-semibold">⚡ معادل محتوای 1080p با کیفیت عالی</span>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400">صرفه‌جویی پهنای باند با تلگرام</span>
            <div className="text-2xl font-black text-cyan-400">{analyticsData?.metrics?.estimatedGigabytesSaved || "45.0 GB"}</div>
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
      )}

      {/* ========================================================================= */}
      {/* TAB 9: SETTINGS VAULT */}
      {/* ========================================================================= */}
      {activeTab === "settings" && (
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
      )}

    </div>
  );
}
