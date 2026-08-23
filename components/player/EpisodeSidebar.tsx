"use client";

import Link from "next/link";
import { PlayCircle, CheckCircle2, Lock, Sparkles, Clock, Folder } from "lucide-react";

export interface EpisodeItem {
  id: string;
  titleFa: string;
  titleEn: string;
  episodeNumber: number;
  durationSeconds: number;
  isFreePreview: boolean;
}

export interface ChapterGroup {
  id: string;
  titleFa: string;
  episodes: EpisodeItem[];
}

export interface EpisodeSidebarProps {
  courseSlug: string;
  currentEpisodeId: string;
  chapters: ChapterGroup[];
}

export default function EpisodeSidebar({
  courseSlug,
  currentEpisodeId,
  chapters,
}: EpisodeSidebarProps) {
  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col h-full border border-slate-800/80">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
          <Folder className="w-4 h-4 text-cyan-400" />
          جلسات دوره
        </h3>
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
          دوبله فارسی AI
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {chapters.map((chap, cIdx) => (
          <div key={chap.id} className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 px-2 py-1 bg-slate-900/60 rounded-lg flex items-center justify-between">
              <span>{chap.titleFa}</span>
              <span className="text-[10px] text-slate-500 font-mono">{chap.episodes.length} جلسه</span>
            </div>

            <div className="space-y-1">
              {chap.episodes.map((ep) => {
                const isActive = ep.id === currentEpisodeId;
                return (
                  <Link
                    key={ep.id}
                    href={`/courses/${courseSlug}/watch/${ep.id}`}
                    className={`flex items-start justify-between p-2.5 rounded-xl text-xs transition-all ${
                      isActive
                        ? "bg-gradient-to-l from-cyan-500/20 to-violet-500/10 border border-cyan-500/40 text-white shadow-glow"
                        : "hover:bg-slate-800/60 text-slate-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {isActive ? (
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center animate-pulse">
                            <PlayCircle className="w-4 h-4 text-slate-950 fill-cyan-400" />
                          </div>
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400">
                            {ep.episodeNumber}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className={`font-semibold ${isActive ? "text-cyan-300" : "text-slate-200"}`}>
                          {ep.titleFa}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono line-clamp-1">
                          {ep.titleEn}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span>{formatSecs(ep.durationSeconds)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
