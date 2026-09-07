import Link from "next/link";
import { Tv, Send, Sparkles, Film, Compass, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400 text-sm mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-glow">
                <Tv className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                RPIM <span className="gradient-text-cyan">TV</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              شبکه آنلاین و تلویزیون تخصصی پخش دوره‌های آموزشی روز دنیا به زبان فارسی؛ طراحی شده برای دسترسی آزاد، پایدار و باکیفیت به دانش مهندسی و نرم‌افزار.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-cyan-400">
                <Film className="w-3.5 h-3.5" />
                پخش با کیفیت Full HD
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                استریم پیوسته و پایدار
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-4 text-xs uppercase tracking-wider">دسته‌بندی‌ها</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/courses" className="hover:text-cyan-400 transition-colors">تمام دوره‌ها</Link>
              </li>
              <li>
                <Link href="/courses?category=devops" className="hover:text-cyan-400 transition-colors">دواپس و زیرساخت ابری</Link>
              </li>
              <li>
                <Link href="/courses?category=backend" className="hover:text-cyan-400 transition-colors">برنامه‌نویسی بک‌اند و پایتون</Link>
              </li>
              <li>
                <Link href="/courses?category=frontend" className="hover:text-cyan-400 transition-colors">توسعه فرانت‌اند و مدرن وب</Link>
              </li>
            </ul>
          </div>

          {/* Connect & Telegram */}
          <div>
            <h4 className="font-bold text-white mb-4 text-xs uppercase tracking-wider">جامعه و پشتیبانی</h4>
            <p className="text-xs text-slate-500 mb-3">
              جهت اطلاع از جدیدترین پخش‌ها و دریافت فایل‌های کمکی به کانال تلگرام ما بپیوندید.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://t.me/rpimtv"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
              >
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                کانال رسمی تلگرام
              </a>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© ۲۰۲۶ تمامی حقوق مادی و معنوی برای رسانه آموزشی RPIM TV محفوظ است.</p>
          <p className="mt-2 sm:mt-0 text-slate-600">
            آموزش تخصصی بدون مرز
          </p>
        </div>
      </div>
    </footer>
  );
}
