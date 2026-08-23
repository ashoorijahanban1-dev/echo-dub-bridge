import Link from "next/link";
import { Clock, Star, Play, User, Sparkles } from "lucide-react";

export interface CourseCardProps {
  slug: string;
  titleFa: string;
  titleEn: string;
  instructor: string;
  category: string;
  level: string;
  totalDurationMin: number;
  thumbnailUrl: string;
  badgeText?: string | null;
  rating?: number;
  studentsCount?: number;
  firstEpisodeId?: string;
}

export default function CourseCard({
  slug,
  titleFa,
  titleEn,
  instructor,
  category,
  level,
  totalDurationMin,
  thumbnailUrl,
  badgeText = "دوبله اختصاصی AI",
  rating = 4.9,
  studentsCount = 1200,
  firstEpisodeId,
}: CourseCardProps) {
  const targetUrl = firstEpisodeId ? `/courses/${slug}/watch/${firstEpisodeId}` : `/courses/${slug}`;

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} دقیقه`;
    return `${h} ساعت و ${m} دقیقه`;
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col group border border-slate-800/80">
      {/* Thumbnail Area */}
      <Link href={targetUrl} className="relative aspect-video w-full overflow-hidden block bg-slate-900">
        <img
          src={thumbnailUrl}
          alt={titleFa}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

        {/* AI Dub Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-[11px] font-bold text-cyan-300 shadow-md">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          {badgeText}
        </div>

        {/* Level Tag */}
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/80 text-[10px] text-slate-300 border border-slate-700/60 font-medium">
          {level}
        </div>

        {/* Hover Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-cyan-950/20 backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center shadow-glow transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 text-white fill-white mr-0.5" />
          </div>
        </div>
      </Link>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] text-cyan-400 font-semibold mb-1">
            {category}
          </div>
          <Link href={targetUrl} className="block">
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
              {titleFa}
            </h3>
          </Link>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5 line-clamp-1">
            {titleEn}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] text-slate-300">{instructor}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-mono">{formatDuration(totalDurationMin)}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="text-[11px] font-bold font-mono">{rating}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
