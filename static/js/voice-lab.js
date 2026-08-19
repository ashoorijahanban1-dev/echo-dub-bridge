/**
 * EchoDub AI - Voice Lab, Emotion Tuner & Voice Cloning Sandbox
 */

window.VoiceLab = {
  activeVoiceId: 'arya',
  activeEmotion: 'narrative',
  speedRate: 1.0,
  pitchShift: 1.0,
  audioCtx: null,

  voices: {
    arya: {
      id: 'arya',
      name: 'آریا (Arya)',
      gender: 'male',
      style: 'روایی و مستند',
      lang: 'fa-IR',
      pitchBase: 0.9,
      rateBase: 1.0,
      avatar: '👨‍💼',
      sampleText: 'هوش مصنوعی اکنون قادر است تمام ظرافت‌های گفتار انسانی و لحن‌های عمیق عاطفی را بازآفرینی نماید.'
    },
    sara: {
      id: 'sara',
      name: 'سارا (Sara)',
      gender: 'female',
      style: 'صمیمی و پادکست',
      lang: 'fa-IR',
      pitchBase: 1.25,
      rateBase: 1.05,
      avatar: '👩‍💼',
      sampleText: 'سلام به همه دوستان! در این بخش می‌خواهیم یک پدیده شگفت‌انگیز را با هم بررسی کنیم.'
    },
    kaveh: {
      id: 'kaveh',
      name: 'کاوه (Kaveh)',
      gender: 'male',
      style: 'سینمایی و حماسی',
      lang: 'fa-IR',
      pitchBase: 0.75,
      rateBase: 0.95,
      avatar: '🎭',
      sampleText: 'سرنوشت ما در دست خودمان است؛ حتی در تاریک‌ترین لحظات تاریخ بشریت.'
    },
    niloofar: {
      id: 'niloofar',
      name: 'نیلوفر (Niloofar)',
      gender: 'female',
      style: 'مستند و آرامش‌بخش',
      lang: 'fa-IR',
      pitchBase: 1.1,
      rateBase: 0.95,
      avatar: '🌸',
      sampleText: 'در آرامش بی‌پایان اقیانوس، زندگی با نغمه‌ای آرام و جاودانه به پیش می‌رود.'
    },
    kourosh: {
      id: 'kourosh',
      name: 'کوروش (Kourosh)',
      gender: 'male',
      style: 'پرانرژی و یوتیوب',
      lang: 'fa-IR',
      pitchBase: 1.05,
      rateBase: 1.15,
      avatar: '⚡',
      sampleText: 'بچه‌ها سلام! امروز اومدیم با یه بررسی فوق‌العاده خفن از جدیدترین هوش مصنوعی دنیا!'
    }
  },

  emotions: {
    narrative: { name: 'روایی (Narrative)', pitchMod: 1.0, rateMod: 1.0 },
    cinematic: { name: 'سینمایی (Cinematic)', pitchMod: 0.85, rateMod: 0.9 },
    conversational: { name: 'صمیمی (Conversational)', pitchMod: 1.1, rateMod: 1.05 },
    energetic: { name: 'باانرژی (Energetic)', pitchMod: 1.2, rateMod: 1.2 },
    formal: { name: 'رسمی (Formal)', pitchMod: 0.95, rateMod: 0.95 }
  },

  init() {
    this.bindEvents();
    this.renderVoiceList();
  },

  bindEvents() {
    const speedSlider = document.getElementById('voiceSpeedSlider');
    const speedVal = document.getElementById('voiceSpeedVal');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        this.speedRate = parseFloat(e.target.value);
        if (speedVal) speedVal.innerText = `${this.speedRate}x`;
      });
    }

    const pitchSlider = document.getElementById('voicePitchSlider');
    const pitchVal = document.getElementById('voicePitchVal');
    if (pitchSlider) {
      pitchSlider.addEventListener('input', (e) => {
        this.pitchShift = parseFloat(e.target.value);
        if (pitchVal) pitchVal.innerText = `${this.pitchShift}x`;
      });
    }

    document.querySelectorAll('.emotion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.emotion-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeEmotion = chip.getAttribute('data-emotion');
      });
    });

    const recordBtn = document.getElementById('btnRecordClone');
    if (recordBtn) {
      recordBtn.addEventListener('click', () => this.simulateVoiceCloning());
    }
  },

  renderVoiceList() {
    const container = document.getElementById('voicePersonaSelector');
    if (!container) return;

    container.innerHTML = '';
    Object.values(this.voices).forEach(v => {
      const card = document.createElement('div');
      card.className = `voice-persona-card ${v.id === this.activeVoiceId ? 'active' : ''}`;
      card.setAttribute('data-voice-id', v.id);
      card.innerHTML = `
        <div class="voice-avatar">${v.avatar}</div>
        <div style="font-weight:700; font-size:0.9rem;">${v.name}</div>
        <div style="font-size:0.75rem; color:var(--text-dim);">${v.style}</div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.voice-persona-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.activeVoiceId = v.id;
        
        const sampleInput = document.getElementById('voiceSampleText');
        if (sampleInput && sampleInput.value === '') {
          sampleInput.value = v.sampleText;
        }
      });

      container.appendChild(card);
    });
  },

  speakLiveText() {
    const sampleInput = document.getElementById('voiceSampleText');
    const text = (sampleInput && sampleInput.value.trim()) 
      ? sampleInput.value.trim() 
      : window.getTranslation('sampleDefaultText');

    this.speakText(text, this.activeVoiceId);
  },

  speakText(text, voiceId = 'arya') {
    const voiceData = this.voices[voiceId] || this.voices['arya'];
    const emotionData = this.emotions[this.activeEmotion] || this.emotions['narrative'];

    this.playAcousticChime();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.pitch = voiceData.pitchBase * emotionData.pitchMod * this.pitchShift;
      utterance.rate = voiceData.rateBase * emotionData.rateMod * this.speedRate;

      const availableVoices = window.speechSynthesis.getVoices();
      const targetVoice = availableVoices.find(v => v.lang.startsWith('fa') || v.lang.includes('IR')) ||
                          availableVoices.find(v => v.lang.startsWith('en')) ||
                          availableVoices[0];
      
      if (targetVoice) utterance.voice = targetVoice;

      window.speechSynthesis.speak(utterance);
    }

    if (window.showToast) {
      window.showToast(window.currentLang === 'fa' ? `در حال پخش صدای هوش مصنوعی: ${voiceData.name}` : `Synthesizing neural voice: ${voiceData.name}`);
    }
  },

  playAcousticChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio context handled
    }
  },

  simulateVoiceCloning() {
    const btn = document.getElementById('btnRecordClone');
    const statusMsg = document.getElementById('cloneStatusMsg');
    const visual = document.getElementById('voiceFingerprintVisual');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="pulse-dot"></span> در حال ضبط و آنالیز فرکانس‌های حنجره...`;
    }

    if (visual) {
      visual.style.borderColor = 'var(--accent-pink)';
    }

    setTimeout(() => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `🎙️ ضبط مجدد نمونه صوتی`;
      }
      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.innerHTML = `✅ ${window.getTranslation('cloneStatusReady')}`;
      }
      if (window.showToast) {
        window.showToast(window.currentLang === 'fa' ? 'شبیه‌سازی صدا با موفقیت استخراج شد (شباهت: ۹۸.۲٪)' : 'Voice clone profile created successfully!');
      }
    }, 2800);
  }
};
