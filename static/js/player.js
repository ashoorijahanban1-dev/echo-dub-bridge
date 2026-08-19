/**
 * EchoDub AI - Advanced Dual-Track Video Player & Audio Waveform Visualizer
 */

window.DubPlayer = {
  video: null,
  heroVideo: null,
  activeTrack: 'dubbed', // 'original' or 'dubbed'
  heroActiveTrack: 'dubbed',
  currentProject: null,
  canvas: null,
  ctx: null,
  animId: null,
  duckingLevel: 0.25,

  init() {
    this.video = document.getElementById('studioVideoElement');
    this.heroVideo = document.getElementById('heroVideoElement');
    this.canvas = document.getElementById('waveformCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.initVisualizer();
    }

    this.bindEvents();
  },

  loadProject(project) {
    this.currentProject = project;
    if (this.video) {
      this.video.src = project.videoUrl;
      this.video.poster = project.poster;
      this.video.load();
    }

    if (this.heroVideo) {
      this.heroVideo.src = project.videoUrl;
      this.heroVideo.poster = project.poster;
    }
  },

  bindEvents() {
    // Studio Player Timeupdate for Subtitles
    if (this.video) {
      this.video.addEventListener('timeupdate', () => {
        this.updateSubtitles(this.video.currentTime, 'studioSubtitleOverlay');
      });

      this.video.addEventListener('play', () => {
        this.startVisualizer();
      });

      this.video.addEventListener('pause', () => {
        this.stopVisualizer();
      });
    }

    // Hero Player Timeupdate
    if (this.heroVideo) {
      this.heroVideo.addEventListener('timeupdate', () => {
        this.updateSubtitles(this.heroVideo.currentTime, 'heroSubtitleOverlay');
      });
    }

    // Ducking Slider
    const duckSlider = document.getElementById('duckingRange');
    const duckVal = document.getElementById('duckingVal');
    if (duckSlider) {
      duckSlider.addEventListener('input', (e) => {
        this.duckingLevel = parseFloat(e.target.value);
        if (duckVal) duckVal.innerText = `${Math.round(this.duckingLevel * 100)}%`;
      });
    }
  },

  setTrack(trackType) {
    this.activeTrack = trackType;
    document.querySelectorAll('.studio-track-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-track') === trackType);
    });

    const overlay = document.getElementById('studioSubtitleOverlay');
    if (trackType === 'dubbed') {
      if (this.video) this.video.volume = 0.35 + (this.duckingLevel * 0.4);
      if (overlay) overlay.style.borderColor = 'var(--border-active)';
      if (window.showToast) {
        window.showToast(window.currentLang === 'fa' ? '🎙️ لاین دوبله هوش مصنوعی فارسی فعال شد' : '🎙️ AI Dubbed audio track activated');
      }
    } else {
      if (this.video) this.video.volume = 1.0;
      if (overlay) overlay.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      if (window.showToast) {
        window.showToast(window.currentLang === 'fa' ? '🎵 لاین صدای اصلی ویدیو فعال شد' : '🎵 Original video audio track activated');
      }
    }
  },

  setHeroTrack(trackType) {
    this.heroActiveTrack = trackType;
    document.querySelectorAll('.hero-track-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-track') === trackType);
    });

    const badge = document.getElementById('heroTrackBadge');
    if (badge) {
      badge.textContent = trackType === 'dubbed' 
        ? window.getTranslation('heroPreviewTrackDubbed') 
        : window.getTranslation('heroPreviewTrackOriginal');
    }
  },

  updateSubtitles(currentTime, overlayId) {
    const overlay = document.getElementById(overlayId);
    if (!overlay || !this.currentProject || !this.currentProject.segments) return;

    const currentSeg = this.currentProject.segments.find(
      seg => currentTime >= seg.start && currentTime <= seg.end
    );

    if (currentSeg) {
      const isDubbed = (overlayId === 'heroSubtitleOverlay') ? (this.heroActiveTrack === 'dubbed') : (this.activeTrack === 'dubbed');
      overlay.innerHTML = `<span class="speaker-tag" style="color:var(--accent-cyan)">[${currentSeg.speaker}]:</span> ${isDubbed ? currentSeg.dubbedText : currentSeg.originalText}`;
      overlay.style.opacity = '1';

      document.querySelectorAll('.sub-item').forEach(item => {
        item.classList.toggle('active', item.id === `sub-seg-${currentSeg.id}`);
      });
    } else {
      overlay.style.opacity = '0.4';
    }
  },

  // HTML5 Canvas Audio Waveform Visualizer
  initVisualizer() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio || 500;
    this.canvas.height = this.canvas.offsetHeight * window.devicePixelRatio || 65;
    this.drawIdleWaveform();
  },

  drawIdleWaveform() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';

    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    for (let x = 0; x < width; x += 6) {
      const y = (height / 2) + Math.sin(x * 0.05) * 4;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  },

  startVisualizer() {
    if (this.animId) cancelAnimationFrame(this.animId);
    let phase = 0;

    const render = () => {
      if (!this.video || this.video.paused) {
        this.drawIdleWaveform();
        return;
      }

      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isDubbed = this.activeTrack === 'dubbed';
      const barCount = 48;
      const barWidth = width / barCount - 3;

      for (let i = 0; i < barCount; i++) {
        const freq = Math.sin(phase + i * 0.25) * Math.cos(phase * 0.5 + i * 0.1);
        const barHeight = Math.max(6, Math.abs(freq) * (height * 0.75));
        const x = i * (barWidth + 3);
        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isDubbed) {
          grad.addColorStop(0, '#8b5cf6');
          grad.addColorStop(1, '#06b6d4');
        } else {
          grad.addColorStop(0, '#3b82f6');
          grad.addColorStop(1, '#6366f1');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      phase += 0.08;
      this.animId = requestAnimationFrame(render);
    };

    render();
  },

  stopVisualizer() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.drawIdleWaveform();
  }
};
