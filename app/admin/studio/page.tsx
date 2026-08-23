"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Play, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Cpu, 
  Languages, 
  Send, 
  FileVideo, 
  Activity,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { US_ENGINE_URL, DubbingJobStatus, submitDubbingJobToEngine, getEngineJobStatus } from "@/lib/api-client";

export default function AdminStudioPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [voiceGender, setVoiceGender] = useState<"male" | "female">("male");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentJob, setCurrentJob] = useState<DubbingJobStatus | null>(null);
  const [jobHistory, setJobHistory] = useState<DubbingJobStatus[]>([]);

  // Polling active job
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
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [currentJob]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const job = await submitDubbingJobToEngine(videoUrl, title || undefined, voiceGender);
      setCurrentJob(job);
      setJobHistory((prev) => [job, ...prev]);
      setVideoUrl("");
      setTitle("");
    } catch (err: any) {
      alert(`خطا در ارسال جاب به سرور آمریکا: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stages = [
    { percent: 25, title: "استخراج صوت", desc: "FFmpeg 16kHz Mono Extraction" },
    { percent: 40, title: "رونویسی و زمان‌بندی", desc: "Faster-Whisper Large-v3 (CPU)" },
    { percent: 60, title: "ترجمه هوش مصنوعی", desc: "Gemini 3 Flash + IT Tech Glossary" },
    { percent: 80, title: "دوبله صدای طبیعی", desc: "Edge-TTS Neural Persian Voice" },
    { percent: 95, title: "میکس و مسترینگ", desc: "FFmpeg EBU R128 (-14 LUFS)" },
    { percent: 100, title: "انتشار روی CDN", desc: "Telegram MTProto Unlimited Cloud" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-bold mb-1">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>متصل به سرور آمریکا (Coolify Active Engine)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-amber-400" />
            استودیوی دوبله خودکار ویدیو (EchoDub Studio)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            لینک فایل ویدیوی آموزشی انگلیسی را وارد کنید تا تمام مراحل دوبله و مسترینگ به صورت خودکار انجام شود.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>موتور هوش مصنوعی: Gemini 3 Flash</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Submission Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
              ثبت ویدیو برای دوبله هوشمند
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  آدرس ویدیوی انگلیسی (URL مستقیم یا لینک دانلودلی):
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://downloadly.ir/courses/lesson-01.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  عنوان جلسه (اختیاری):
                </label>
                <input
                  type="text"
                  placeholder="مثال: فصل اول - جلسه ۱: آشنایی با داکر"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                />
              </div>

              {/* Voice selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  انتخاب صدای گوینده فارسی:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVoiceGender("male")}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                      voiceGender === "male"
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">فرید (Farid Neural)</div>
                      <div className="text-[10px] text-slate-500">صدای مردانه رسمی و آرام</div>
                    </div>
                    {voiceGender === "male" && <span className="text-cyan-400 text-xs">✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => setVoiceGender("female")}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                      voiceGender === "female"
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">دل‌آرا (Dilara Neural)</div>
                      <div className="text-[10px] text-slate-500">صدای زنانه دلنشین</div>
                    </div>
                    {voiceGender === "female" && <span className="text-cyan-400 text-xs">✓</span>}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 font-bold text-white shadow-glow hover:opacity-95 active:scale-98 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>در حال ارسال جاب به سرور آمریکا...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>شروع دوبله هوشمند با Gemini 3</span>
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* Live Job Progress Column */}
        <div className="lg:col-span-6 space-y-6">
          {currentJob ? (
            <div className="glass-panel rounded-2xl p-6 border border-cyan-500/40 shadow-glow space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">
                    JOB ID: {currentJob.job_id}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    {currentJob.result?.title || title || "در حال پردازش جلسه..."}
                  </h3>
                </div>

                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  currentJob.status === "COMPLETED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : currentJob.status === "FAILED"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse"
                }`}>
                  {currentJob.status}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">{currentJob.current_stage}</span>
                  <span className="font-mono text-cyan-400 font-bold">{currentJob.progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-500"
                    style={{ width: `${currentJob.progress}%` }}
                  />
                </div>
              </div>

              {/* Pipeline Stages Stepper */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {stages.map((st, idx) => {
                  const isDone = currentJob.progress >= st.percent;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-xs transition-all ${
                        isDone
                          ? "bg-slate-900/90 border-cyan-500/40 text-slate-200"
                          : "bg-slate-950/40 border-slate-800/80 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-0.5">
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span className={isDone ? "text-cyan-300" : ""}>{st.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono leading-tight">{st.desc}</div>
                    </div>
                  );
                })}
              </div>

              {/* Completed Details */}
              {currentJob.status === "COMPLETED" && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs space-y-2 text-emerald-200">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    دوبله و مسترینگ با موفقیت ۱۰۰٪ کامل شد!
                  </div>
                  <div className="text-[11px] text-slate-300">
                    مدت زمان پردازش: {currentJob.result?.elapsed_time_seconds} ثانیه | تعداد سگمنت‌های ترجمه: {currentJob.result?.segments_count}
                  </div>
                  {currentJob.result?.telegram?.telegram_link && (
                    <a
                      href={currentJob.result.telegram.telegram_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:underline font-mono text-[11px] pt-1"
                    >
                      مشاهده در تلگرام CDN <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto border border-slate-800">
                <FileVideo className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-300">هیچ جابی در حال پردازش نیست</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                از فرم سمت چپ یک لینک ویدیو وارد کنید تا پایپ‌لاین هوش مصنوعی روی سرور آمریکا فعال شود.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
