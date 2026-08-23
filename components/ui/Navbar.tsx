"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Sparkles, 
  Search, 
  Layers, 
  Compass, 
  Radio, 
  Settings, 
  Menu, 
  X,
  PlayCircle
} from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform duration-300">
                <Radio className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight gradient-text-cyan">
                  EchoDub AI
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider -mt-1">
                  پلتفرم تخصصی آموزش دوبله هوشمند
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1 mr-4">
              <Link 
                href="/courses" 
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <Compass className="w-4 h-4" />
                کاتالوگ دوره‌ها
              </Link>
              <Link 
                href="/courses?category=devops" 
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <Layers className="w-4 h-4" />
                دواپس و کلود
              </Link>
              <Link 
                href="/admin/studio" 
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                استودیوی دوبله AI
              </Link>
            </div>
          </div>

          {/* Quick Search & Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="جستجوی دوره، مدرس یا تکنولوژی..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-1.5 pr-9 pl-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            <Link
              href="/admin/studio"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-600 rounded-xl shadow-glow hover:opacity-95 active:scale-95 transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              دوبله جلسه جدید
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/courses"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            کاتالوگ دوره‌ها
          </Link>
          <Link
            href="/admin/studio"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-amber-400 hover:bg-amber-500/10"
          >
            استودیوی دوبله AI (سرور آمریکا)
          </Link>
        </div>
      )}
    </nav>
  );
}
