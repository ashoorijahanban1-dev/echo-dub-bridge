"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  RotateCw, 
  Settings, 
  Languages, 
  Subtitles, 
  Sparkles,
  Gauge
} from "lucide-react";

export interface VideoPlayerProps {
  episodeId: string;
  streamUrl: string;
  title: string;
  courseTitle: string;
  dubbedAudioUrl?: string | null;
  originalAudioUrl?: string | null;
  subtitleFaUrl?: string | null;
  subtitleEnUrl?: string | null;
  onNextEpisode?: () => void;
  hasAudioTracks?: boolean;
}

export default function VideoPlayer({
  episodeId,
  streamUrl,
  title,
  courseTitle,
  dubbedAudioUrl,
  originalAudioUrl,
  subtitleFaUrl,
  subtitleEnUrl,
  onNextEpisode,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Audio Track & Subtitle State
  const [audioTrack, setAudioTrack] = useState<"persian" | "english">("persian");
  const [activeSubtitle, setActiveSubtitle] = useState<"off" | "fa" | "en">("off");
  
  // Menus
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentSrc, setCurrentSrc] = useState<string>(streamUrl || "/api/stream/video");
  const [hasStreamError, setHasStreamError] = useState(false);

  useEffect(() => {
    // If streamUrl is empty, relative sample, or blocked Google storage, use local HTTP 206 stream
    if (
      !streamUrl ||
      streamUrl.includes("commondatastorage.googleapis.com") ||
      streamUrl === "/sample-video.mp4"
    ) {
      setCurrentSrc("/api/stream/video");
    } else {
      setCurrentSrc(streamUrl);
    }
    setHasStreamError(false);
  }, [streamUrl, episodeId]);

  const handleVideoError = () => {
    console.warn("Video stream load error from:", currentSrc, "- switching to domestic fallback stream");
    if (currentSrc !== "/api/stream/video") {
      setCurrentSrc("/api/stream/video");
      setHasStreamError(true);
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }
    }
  };

  // 1. Resume Playback from LocalStorage
  useEffect(() => {
    const savedTime = localStorage.getItem(`watch_pos_${episodeId}`);
    if (savedTime && videoRef.current) {
      const time = parseFloat(savedTime);
      if (time > 0) {
        videoRef.current.currentTime = time;
      }
    }
  }, [episodeId]);

  // Save current time
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);
    localStorage.setItem(`watch_pos_${episodeId}`, current.toString());
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Play / Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipSeconds = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), duration);
  };

  // Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const muted = !isMuted;
    setIsMuted(muted);
    videoRef.current.muted = muted;
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Speed
  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettingsMenu(false);
  };

  // Subtitle Toggle
  const changeSubtitle = (sub: "off" | "fa" | "en") => {
    setActiveSubtitle(sub);
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        if (sub === "off") {
          tracks[i].mode = "disabled";
        } else if (tracks[i].language === sub) {
          tracks[i].mode = "showing";
        } else {
          tracks[i].mode = "disabled";
        }
      }
    }
    setShowSubtitleMenu(false);
  };

  // Dual Audio Track switch
  const changeAudioTrack = (track: "persian" | "english") => {
    setAudioTrack(track);
    setShowAudioMenu(false);
    // If separate audio streams or multi-track audio API is available:
    if (videoRef.current && (videoRef.current as any).audioTracks) {
      const tracks = (videoRef.current as any).audioTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].enabled = (track === "persian" && i === 0) || (track === "english" && i === 1);
      }
    }
  };

  // Keyboard Shortcuts
  // Anti-Piracy & Anti-Download Protection Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+S, Ctrl+U, F12, Ctrl+Shift+I (Save / Inspect / Download tools)
      if (
        (e.ctrlKey || e.metaKey) && ["s", "u", "p"].includes(e.key.toLowerCase()) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        return;
      }

      // Avoid hotkeys when typing in input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowright":
          e.preventDefault();
          skipSeconds(-5); // RTL seek backward
          break;
        case "arrowleft":
          e.preventDefault();
          skipSeconds(5); // RTL seek forward
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "c":
          e.preventDefault();
          changeSubtitle(activeSubtitle === "off" ? "fa" : "off");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isMuted, duration, activeSubtitle]);

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  // Format time (00:00)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onContextMenu={(e) => e.preventDefault()}
      className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800/80 group select-none"
    >
      {/* Dynamic Anti-Piracy Watermark Overlay */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none opacity-20 hover:opacity-40 transition-opacity font-mono text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm border border-white/5 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>rpim.ir | پخش حفاظت‌شده</span>
      </div>

      {/* HTML5 Protected Video Element */}
      <video
        ref={videoRef}
        src={currentSrc}
        onError={handleVideoError}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onContextMenu={(e) => e.preventDefault()}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onEnded={() => {
          setIsPlaying(false);
          if (onNextEpisode) onNextEpisode();
        }}
        playsInline
        preload="metadata"
        className="w-full h-full object-contain cursor-pointer"
      >
        {subtitleFaUrl && (
          <track
            kind="subtitles"
            src={subtitleFaUrl}
            srcLang="fa"
            label="فارسی"
            default={activeSubtitle === "fa"}
          />
        )}
        {subtitleEnUrl && (
          <track
            kind="subtitles"
            src={subtitleEnUrl}
            srcLang="en"
            label="English"
            default={activeSubtitle === "en"}
          />
        )}
      </video>


      {/* Center Play/Pause Large Overlay Button on Click */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] cursor-pointer"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-glow transform hover:scale-110 active:scale-95 transition-all">
            <Play className="w-9 h-9 text-white fill-white mr-1" />
          </div>
        </div>
      )}

      {/* Top Bar (Title & Mode badge) */}
      <div className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">{courseTitle}</div>
            <h2 className="text-sm sm:text-base font-bold text-white leading-tight">{title}</h2>
          </div>
          
          {/* Audio Language Indicator Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-xs text-cyan-300 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-semibold">
              {audioTrack === "persian" ? "دوبله هوشمند فارسی" : "زبان اصلی (English)"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className={`absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        
        {/* Progress Bar & Seeker */}
        <div className="relative w-full mb-3 flex items-center group/seek">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-cyan-400 group-hover/seek:h-2.5 transition-all"
          />
          {/* Progress filled color overlay */}
          <div
            className="absolute top-0 right-0 h-1.5 bg-gradient-to-l from-cyan-400 to-violet-500 rounded-lg pointer-events-none group-hover/seek:h-2.5"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white">
          
          {/* Left Controls (Playback & Volume) */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
              title={isPlaying ? "توقف (Space)" : "پخش (Space)"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            <button
              onClick={() => skipSeconds(-5)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all hidden sm:block"
              title="۵ ثانیه عقب"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => skipSeconds(5)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all hidden sm:block"
              title="۵ ثانیه جلو"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 opacity-80 group-hover/vol:opacity-100"
              />
            </div>

            {/* Time Stamp */}
            <div className="text-xs font-mono text-slate-300 font-medium select-none mr-2">
              <span>{formatTime(currentTime)}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls (Audio Switch, Subtitles, Speed, Fullscreen) */}
          <div className="flex items-center gap-2 relative">
            
            {/* 1. Dual Audio Switcher Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowAudioMenu(!showAudioMenu);
                  setShowSubtitleMenu(false);
                  setShowSettingsMenu(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all ${
                  audioTrack === "persian" 
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30" 
                    : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
                }`}
                title="تغییر زبان صدا"
              >
                <Languages className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{audioTrack === "persian" ? "دوبله فارسی" : "انگلیسی"}</span>
              </button>

              {showAudioMenu && (
                <div className="absolute bottom-10 left-0 w-44 glass-panel rounded-xl p-1.5 space-y-1 shadow-2xl z-20 border border-slate-700 text-xs">
                  <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase">انتخاب زبان صوتی</div>
                  <button
                    onClick={() => changeAudioTrack("persian")}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-right ${audioTrack === "persian" ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-300 hover:bg-slate-800"}`}
                  >
                    <span>🎙️ دوبله هوشمند فارسی</span>
                    {audioTrack === "persian" && <span className="text-cyan-400">✓</span>}
                  </button>
                  <button
                    onClick={() => changeAudioTrack("english")}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-right ${audioTrack === "english" ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-300 hover:bg-slate-800"}`}
                  >
                    <span>🇬🇧 زبان اصلی (English)</span>
                    {audioTrack === "english" && <span className="text-cyan-400">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* 2. Subtitles Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSubtitleMenu(!showSubtitleMenu);
                  setShowAudioMenu(false);
                  setShowSettingsMenu(false);
                }}
                className={`p-2 rounded-xl border transition-all ${
                  activeSubtitle !== "off" 
                    ? "bg-violet-500/20 border-violet-500/50 text-violet-300" 
                    : "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700"
                }`}
                title="زیرنویس (C)"
              >
                <Subtitles className="w-4 h-4" />
              </button>

              {showSubtitleMenu && (
                <div className="absolute bottom-10 left-0 w-36 glass-panel rounded-xl p-1.5 space-y-1 shadow-2xl z-20 border border-slate-700 text-xs">
                  <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase">زیرنویس</div>
                  <button
                    onClick={() => changeSubtitle("off")}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-right ${activeSubtitle === "off" ? "bg-violet-500/20 text-violet-300 font-bold" : "text-slate-300 hover:bg-slate-800"}`}
                  >
                    <span>خاموش</span>
                    {activeSubtitle === "off" && <span className="text-violet-400">✓</span>}
                  </button>
                  <button
                    onClick={() => changeSubtitle("fa")}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-right ${activeSubtitle === "fa" ? "bg-violet-500/20 text-violet-300 font-bold" : "text-slate-300 hover:bg-slate-800"}`}
                  >
                    <span>فارسی (AI)</span>
                    {activeSubtitle === "fa" && <span className="text-violet-400">✓</span>}
                  </button>
                  <button
                    onClick={() => changeSubtitle("en")}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-right ${activeSubtitle === "en" ? "bg-violet-500/20 text-violet-300 font-bold" : "text-slate-300 hover:bg-slate-800"}`}
                  >
                    <span>English</span>
                    {activeSubtitle === "en" && <span className="text-violet-400">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* 3. Speed / Settings */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSettingsMenu(!showSettingsMenu);
                  setShowAudioMenu(false);
                  setShowSubtitleMenu(false);
                }}
                className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:bg-slate-700 transition-all text-xs font-mono font-bold"
                title="سرعت پخش"
              >
                {playbackSpeed}x
              </button>

              {showSettingsMenu && (
                <div className="absolute bottom-10 left-0 w-32 glass-panel rounded-xl p-1.5 space-y-1 shadow-2xl z-20 border border-slate-700 text-xs">
                  <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase">سرعت پخش</div>
                  {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-right font-mono ${playbackSpeed === s ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-300 hover:bg-slate-800"}`}
                    >
                      <span>{s}x {s === 1 ? "(عادی)" : ""}</span>
                      {playbackSpeed === s && <span className="text-cyan-400">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              title="تمام‌صفحه (F)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
