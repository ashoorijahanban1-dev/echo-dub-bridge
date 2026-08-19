/**
 * EchoDub AI - Video Dubbing Engine & Pipeline Simulator
 */

window.DubbingEngine = {
  presets: {
    ted: {
      id: 'ted',
      title: '🎙️ TED Talk - AI & The Future of Humanity',
      category: 'ted',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      poster: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
      sourceLang: 'en',
      targetLang: 'fa',
      duration: 32,
      speakersCount: 1,
      segments: [
        {
          id: 1,
          start: 0,
          end: 4.5,
          speaker: 'Speaker 1 (Sam)',
          originalText: 'Artificial intelligence is not just a technological tool, it is a transformation of human intellect.',
          dubbedText: 'هوش مصنوعی تنها یک ابزار فناورانه نیست، بلکه دگرگونی بنیادین اندیشه و خرد انسانی است.',
          voiceId: 'arya'
        },
        {
          id: 2,
          start: 4.6,
          end: 9.8,
          speaker: 'Speaker 1 (Sam)',
          originalText: 'When we build systems that understand reasoning, we unlock solutions to our greatest scientific problems.',
          dubbedText: 'وقتی ما سیستم‌هایی می‌سازیم که منطق و استدلال را درک می‌کنند، کلید حل بزرگ‌ترین مسائل علمی تاریخ را به دست می‌آوریم.',
          voiceId: 'arya'
        },
        {
          id: 3,
          start: 10.0,
          end: 16.2,
          speaker: 'Speaker 1 (Sam)',
          originalText: 'The transition will be fast, and our ability to adapt with wisdom will define the next century of progress.',
          dubbedText: 'این گذار بسیار پرشتاب خواهد بود، و توانایی ما در سازگاری خردمندانه، قرن آینده تمدن بشری را رقم خواهد زد.',
          voiceId: 'arya'
        },
        {
          id: 4,
          start: 16.5,
          end: 24.0,
          speaker: 'Speaker 1 (Sam)',
          originalText: 'Every creator, developer, and thinker will have an intellectual superpower at their fingertips.',
          dubbedText: 'هر تولیدکننده محتوا، برنامه‌نویس و متفکری به یک ابرقدرت فکری در سرانگشتان خود دسترسی خواهد داشت.',
          voiceId: 'arya'
        }
      ]
    },

    movie: {
      id: 'movie',
      title: '🎬 Interstellar - Cinematic Epic Scene',
      category: 'cinema',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
      sourceLang: 'en',
      targetLang: 'fa',
      duration: 28,
      speakersCount: 2,
      segments: [
        {
          id: 1,
          start: 0,
          end: 6.2,
          speaker: 'Speaker 1 (Cooper)',
          originalText: 'We used to look up at the sky and wonder at our place in the stars.',
          dubbedText: 'ما در گذشته به آسمان نگاه می‌کردیم و شگفت‌زده جایگاه خود را میان ستارگان جستجو می‌کردیم.',
          voiceId: 'kaveh'
        },
        {
          id: 2,
          start: 6.5,
          end: 13.0,
          speaker: 'Speaker 1 (Cooper)',
          originalText: 'Now we just look down and worry about our place in the dirt.',
          dubbedText: 'اما حالا فقط به زمین خیره می‌شویم و نگران بقای خود در این خاک و غباریم.',
          voiceId: 'kaveh'
        },
        {
          id: 3,
          start: 13.5,
          end: 20.0,
          speaker: 'Speaker 2 (Brand)',
          originalText: 'Love is the one thing we are capable of perceiving that transcends dimensions of time and space.',
          dubbedText: 'عشق تنها چیزی است که قادریم حس کنیم و فراتر از ابعاد زمان و مکان در جریان است.',
          voiceId: 'sara'
        }
      ]
    },

    tech: {
      id: 'tech',
      title: '💻 Apple Keynote & AI Neural Engine',
      category: 'tech',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      poster: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      sourceLang: 'en',
      targetLang: 'fa',
      duration: 25,
      speakersCount: 1,
      segments: [
        {
          id: 1,
          start: 0,
          end: 5.0,
          speaker: 'Speaker 1 (Tech Host)',
          originalText: 'Today we are introducing a revolution in spatial computing and neural processing.',
          dubbedText: 'امروز ما در حال رونمایی از انقلابی بزرگ در محاسبات فضایی و پردازش‌های عصبی هستیم.',
          voiceId: 'kourosh'
        },
        {
          id: 2,
          start: 5.2,
          end: 11.5,
          speaker: 'Speaker 1 (Tech Host)',
          originalText: 'With over thirty trillion operations per second, your device adapts seamlessly in real time.',
          dubbedText: 'با بیش از سی تریلیون محاسبه در هر ثانیه، دستگاه شما به صورت آنی با خواسته‌هایتان هماهنگ می‌شود.',
          voiceId: 'kourosh'
        },
        {
          id: 3,
          start: 12.0,
          end: 18.0,
          speaker: 'Speaker 1 (Tech Host)',
          originalText: 'This is the most powerful personal technology experience ever created.',
          dubbedText: 'این قدرتمندترین تجربه فناوری شخصی است که تا کنون خلق شده است.',
          voiceId: 'kourosh'
        }
      ]
    },

    nature: {
      id: 'nature',
      title: '🌍 BBC Nature Documentary (David Attenborough)',
      category: 'doc',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      poster: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=800&q=80',
      sourceLang: 'en',
      targetLang: 'fa',
      duration: 30,
      speakersCount: 1,
      segments: [
        {
          id: 1,
          start: 0,
          end: 6.8,
          speaker: 'Speaker 1 (Narrator)',
          originalText: 'Across the vast plains of the Serengeti, life moves in harmony with the ancient seasons.',
          dubbedText: 'در سراسر دشت‌های بی‌کران سرنگتی، حیات در هماهنگی شگفت‌انگیزی با فصول کهن جریان دارد.',
          voiceId: 'niloofar'
        },
        {
          id: 2,
          start: 7.2,
          end: 15.0,
          speaker: 'Speaker 1 (Narrator)',
          originalText: 'Every predator and creature plays an indispensable role in maintaining this fragile natural balance.',
          dubbedText: 'هر شکارچی و موجود زنده‌ای، نقشی حیاتی در حفظ این توازن شکننده و باستانی طبیعت ایفا می‌کند.',
          voiceId: 'niloofar'
        }
      ]
    }
  },

  activeProject: null,
  isProcessing: false,

  init() {
    this.selectPreset('ted');
  },

  selectPreset(presetKey) {
    if (!this.presets[presetKey]) return;
    this.activeProject = JSON.parse(JSON.stringify(this.presets[presetKey]));
    
    this.renderSubtitlesEditor();
    if (window.DubPlayer) {
      window.DubPlayer.loadProject(this.activeProject);
    }
  },

  async runPipeline(options = {}) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const runBtn = document.getElementById('btnRunPipeline');
    const progressBar = document.getElementById('pipelineProgressBar');
    const progressText = document.getElementById('pipelineProgressText');
    const logBox = document.getElementById('terminalBody');

    if (runBtn) {
      runBtn.disabled = true;
      runBtn.innerHTML = `<span class="soundwave-anim"><span class="soundwave-bar"></span><span class="soundwave-bar"></span></span> ${window.getTranslation('btnProcessing')}`;
    }

    if (logBox) logBox.innerHTML = '';

    const addLog = (msg, type = 'info') => {
      if (!logBox) return;
      const now = new Date().toTimeString().split(' ')[0];
      const div = document.createElement('div');
      div.className = 'log-line';
      div.innerHTML = `<span class="log-time">[${now}]</span> <span class="log-${type}">➜ ${msg}</span>`;
      logBox.appendChild(div);
      logBox.scrollTop = logBox.scrollHeight;
    };

    const updateStepUI = (stepIndex) => {
      document.querySelectorAll('.step-card').forEach((card, idx) => {
        if (idx < stepIndex) {
          card.classList.add('completed');
          card.classList.remove('active');
        } else if (idx === stepIndex) {
          card.classList.add('active');
        } else {
          card.classList.remove('active', 'completed');
        }
      });
    };

    const setProgress = (percent, text) => {
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressText) progressText.innerText = text;
    };

    try {
      // Stage 1: Audio Extraction & Separation
      updateStepUI(0);
      setProgress(15, 'Stage 1/5: Isolating vocal track & background stems (Demucs v4)...');
      addLog('Initiating Demucs v4 Neural Stem Separation on input video...', 'info');
      await this.sleep(700);
      addLog('Vocal dialogue isolated. Background ambience & BGM ducking envelope created.', 'success');

      // Stage 2: Whisper Speech-to-Text & Diarization
      updateStepUI(1);
      setProgress(35, 'Stage 2/5: Speech-to-Text & Multi-speaker Diarization (Whisper Large-v3)...');
      addLog('Running OpenAI Whisper Large-v3 with word-level timestamping...', 'info');
      await this.sleep(800);
      addLog(`Detected ${this.activeProject.speakersCount} distinct speaker cluster(s) with 99.8% confidence.`, 'success');

      // Stage 3: Neural Contextual Translation & Syllable Matching
      updateStepUI(2);
      setProgress(60, 'Stage 3/5: Contextual Translation & Lip-Timing Alignment...');
      addLog('Translating segments to Persian with rhythmic pacing & syllable length constraint...', 'info');
      await this.sleep(800);
      addLog('Generated time-synchronized Farsi script matching original speaking cadence.', 'success');

      // Stage 4: Human-like Neural Voice Synthesis
      updateStepUI(3);
      setProgress(85, 'Stage 4/5: Synthesizing Human-like Neural Persian Voices & Emotion...');
      addLog('Synthesizing voice models with expressive breath intervals and emotion dynamics...', 'info');
      await this.sleep(900);
      addLog('All audio segments synthesized with 48kHz studio fidelity.', 'success');

      // Stage 5: Mastering, Audio-Video Muxing
      updateStepUI(4);
      setProgress(100, 'Stage 5/5: Final Audio Ducking & Video Mux Complete!');
      addLog('Muxing dubbed voiceover track with ducked background music...', 'info');
      await this.sleep(600);
      addLog('✅ Dubbing Complete! Dual-track player is ready for instant comparison.', 'success');

      if (window.showToast) {
        window.showToast(window.currentLang === 'fa' ? 'دوبله هوشمند با موفقیت تکمیل شد!' : 'AI Dubbing completed successfully!');
      }

      if (window.AdminCMS) {
        window.AdminCMS.addJob({
          id: 'JOB-' + Math.floor(1000 + Math.random() * 9000),
          title: this.activeProject.title,
          lang: `${this.activeProject.sourceLang.toUpperCase()} ➔ ${this.activeProject.targetLang.toUpperCase()}`,
          status: 'completed',
          date: new Date().toLocaleDateString('fa-IR')
        });
      }

    } catch (err) {
      addLog('Error in pipeline execution: ' + err.message, 'warn');
    } finally {
      this.isProcessing = false;
      if (runBtn) {
        runBtn.disabled = false;
        runBtn.innerHTML = `<span>✨</span> ${window.getTranslation('btnRunPipeline')}`;
      }
    }
  },

  renderSubtitlesEditor() {
    const container = document.getElementById('subtitlesEditorContainer');
    if (!container || !this.activeProject) return;

    container.innerHTML = '';
    this.activeProject.segments.forEach((seg, index) => {
      const item = document.createElement('div');
      item.className = 'sub-item';
      item.id = `sub-seg-${seg.id}`;
      item.innerHTML = `
        <div class="sub-time">${this.formatTime(seg.start)} - ${this.formatTime(seg.end)}</div>
        <div class="sub-text" contenteditable="true" data-index="${index}">${seg.dubbedText}</div>
        <button class="btn btn-secondary btn-icon-only" title="${window.getTranslation('btnReVoiceSegment')}" onclick="window.DubbingEngine.reVoiceSegment(${index})">
          🔄
        </button>
      `;

      item.querySelector('.sub-text').addEventListener('blur', (e) => {
        seg.dubbedText = e.target.innerText;
      });

      item.addEventListener('click', () => {
        if (window.DubPlayer && window.DubPlayer.video) {
          window.DubPlayer.video.currentTime = seg.start;
          window.DubPlayer.video.play();
        }
      });

      container.appendChild(item);
    });
  },

  reVoiceSegment(index) {
    if (!this.activeProject || !this.activeProject.segments[index]) return;
    const seg = this.activeProject.segments[index];
    if (window.showToast) {
      window.showToast(window.currentLang === 'fa' ? `تولید مجدد صدای گوینده برای بخش #${seg.id}` : `Re-synthesizing segment #${seg.id}...`);
    }
    if (window.VoiceLab) {
      window.VoiceLab.speakText(seg.dubbedText, seg.voiceId);
    }
  },

  exportSRT() {
    if (!this.activeProject) return;
    let srtContent = '';
    this.activeProject.segments.forEach((seg, i) => {
      srtContent += `${i + 1}\n`;
      srtContent += `${this.toSrtTime(seg.start)} --> ${this.toSrtTime(seg.end)}\n`;
      srtContent += `${seg.dubbedText}\n\n`;
    });

    this.downloadFile('dubbed-subtitles.srt', srtContent, 'text/plain');
    if (window.showToast) {
      window.showToast(window.currentLang === 'fa' ? 'فایل زیرنویس SRT دانلود شد' : 'SRT subtitles downloaded');
    }
  },

  exportAudioTrack() {
    if (window.showToast) {
      window.showToast(window.currentLang === 'fa' ? 'ترک صوتی با کیفیت 320kbps آماده دانلود شد' : 'High quality 320kbps MP3 track downloaded');
    }
  },

  exportFullVideo() {
    if (window.showToast) {
      window.showToast(window.currentLang === 'fa' ? 'ویدیوی نهایی 4K با دوبله کامل آماده‌سازی و دانلود شد' : 'Rendered full 4K dubbed video downloaded');
    }
  },

  downloadFile(filename, text, mime) {
    const element = document.createElement('a');
    element.setAttribute('href', `data:${mime};charset=utf-8,` + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  },

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  toSrtTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
