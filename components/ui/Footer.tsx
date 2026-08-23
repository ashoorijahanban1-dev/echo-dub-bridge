import Link from "next/link";
import { Radio, Github, Send, Heart, Sparkles, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400 text-sm mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-glow">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                EchoDub <span className="gradient-text-cyan">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              پلتفرم استریم و پخش هوشمند دوره‌های آموزشی برنامه‌نویسی و IT به زبان فارسی با صدای طبیعی هوش مصنوعی و امکان تماشای بدون فیلترشکن.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                موتور دوبله Gemini 3 Flash
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                استریم مستقیم نیم‌بها
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-4 text-xs uppercase tracking-wider">دسترسی سریع</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/courses" className="hover:text-cyan-400 transition-colors">کاتالوگ دوره‌ها</Link>
              </li>
              <li>
                <Link href="/courses?category=devops" className="hover:text-cyan-400 transition-colors">دواپس و داکر</Link>
              </li>
              <li>
                <Link href="/courses?category=backend" className="hover:text-cyan-400 transition-colors">بک‌اند و پایتون</Link>
              </li>
              <li>
                <Link href="/admin/studio" className="text-amber-400 hover:text-amber-300 transition-colors">استودیوی دوبله خودکار</Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-bold text-white mb-4 text-xs uppercase tracking-wider">ارتباط و پشتیبانی</h4>
            <p className="text-xs text-slate-500 mb-3">
              جهت سفارش دوبله اختصاصی دوره‌های آموزشی با ما در ارتباط باشید.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center hover:text-white hover:border-slate-700 transition-all"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© ۲۰۲۶ تمامی حقوق محفوظ است — EchoDub AI Platform</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            توسعه داده شده با <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> و Next.js 14
          </p>
        </div>
      </div>
    </footer>
  );
}
