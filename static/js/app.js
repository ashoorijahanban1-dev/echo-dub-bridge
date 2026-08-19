/**
 * EchoDub AI - Main App Coordinator & Event Listeners
 */

// Toast Notification System
window.showToast = function(message, duration = 3200) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>✨</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

function initEchoDubApp() {
  // Initialize sub-modules
  if (window.DubPlayer && typeof window.DubPlayer.init === 'function') window.DubPlayer.init();
  if (window.DubbingEngine && typeof window.DubbingEngine.init === 'function') window.DubbingEngine.init();
  if (window.VoiceLab && typeof window.VoiceLab.init === 'function') window.VoiceLab.init();
  if (window.AdminCMS && typeof window.AdminCMS.init === 'function') window.AdminCMS.init();

  // Set initial default language (Farsi)
  if (typeof window.setLanguage === 'function') window.setLanguage('fa');

  // Language Switch Button
  const langToggleBtn = document.getElementById('langToggleBtn');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      const nextLang = window.currentLang === 'fa' ? 'en' : 'fa';
      window.setLanguage(nextLang);
      if (window.AdminCMS) window.AdminCMS.renderAll();
      window.showToast(nextLang === 'fa' ? 'زبان به فارسی تغییر یافت' : 'Language switched to English');
    });
  }

  // Showcase Category Filter Buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');
      if (window.AdminCMS) {
        window.AdminCMS.renderShowcaseCards(cat);
      }
    });
  });

  // Preset Selection Pills in Studio
  document.querySelectorAll('.preset-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.preset-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const presetKey = pill.getAttribute('data-preset');
      if (window.DubbingEngine) {
        window.DubbingEngine.selectPreset(presetKey);
        window.showToast(window.currentLang === 'fa' ? `ویدیوی پیش‌نمایش بارگذاری شد` : `Loaded preset demo video`);
      }
    });
  });

  // Pipeline Start Button
  const runPipelineBtn = document.getElementById('btnRunPipeline');
  if (runPipelineBtn) {
    runPipelineBtn.addEventListener('click', () => {
      if (window.DubbingEngine) {
        window.DubbingEngine.runPipeline();
      }
    });
  }

  // Dual-Track Audio Buttons (Studio Player)
  document.querySelectorAll('.studio-track-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const track = btn.getAttribute('data-track');
      if (window.DubPlayer) {
        window.DubPlayer.setTrack(track);
      }
    });
  });

  // Dual-Track Audio Buttons (Hero Player)
  document.querySelectorAll('.hero-track-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const track = btn.getAttribute('data-track');
      if (window.DubPlayer) {
        window.DubPlayer.setHeroTrack(track);
      }
    });
  });

  // Synthesize Live Voice Button in Voice Lab
  const btnSynthesize = document.getElementById('btnSynthesizeVoice');
  if (btnSynthesize) {
    btnSynthesize.addEventListener('click', () => {
      if (window.VoiceLab) {
        window.VoiceLab.speakLiveText();
      }
    });
  }

  // Subtitle Export Buttons
  const btnExportSrt = document.getElementById('btnExportSrt');
  if (btnExportSrt) {
    btnExportSrt.addEventListener('click', () => {
      if (window.DubbingEngine) window.DubbingEngine.exportSRT();
    });
  }

  const btnExportAudio = document.getElementById('btnExportAudio');
  if (btnExportAudio) {
    btnExportAudio.addEventListener('click', () => {
      if (window.DubbingEngine) window.DubbingEngine.exportAudioTrack();
    });
  }

  const btnExportVideo = document.getElementById('btnExportFullVideo');
  if (btnExportVideo) {
    btnExportVideo.addEventListener('click', () => {
      if (window.DubbingEngine) window.DubbingEngine.exportFullVideo();
    });
  }

  // Drag & Drop / File Upload Handler
  const dropzone = document.getElementById('videoDropzone');
  const fileInput = document.getElementById('videoFileInput');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleUserVideoUpload(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleUserVideoUpload(e.target.files[0]);
      }
    });
  }

  function handleUserVideoUpload(file) {
    const videoUrl = URL.createObjectURL(file);
    const customProject = {
      id: 'custom-' + Date.now(),
      title: file.name,
      category: 'custom',
      videoUrl: videoUrl,
      poster: '',
      sourceLang: document.getElementById('sourceLangSelect') ? document.getElementById('sourceLangSelect').value : 'en',
      targetLang: document.getElementById('targetLangSelect') ? document.getElementById('targetLangSelect').value : 'fa',
      duration: 30,
      speakersCount: 1,
      segments: [
        {
          id: 1,
          start: 0,
          end: 6.0,
          speaker: 'Speaker 1',
          originalText: 'Extracted audio dialogue from uploaded file...',
          dubbedText: 'متن استخراج‌شده و ترجمه‌شده از ویدیوی بارگذاری شده شما...',
          voiceId: 'arya'
        },
        {
          id: 2,
          start: 6.5,
          end: 14.0,
          speaker: 'Speaker 1',
          originalText: 'AI is aligning vocal pace with video timestamps.',
          dubbedText: 'هوش مصنوعی در حال تطبیق زمان‌بندی ادای واژگان فارسی با چهره گوینده است.',
          voiceId: 'arya'
        }
      ]
    };

    if (window.DubbingEngine) {
      window.DubbingEngine.activeProject = customProject;
      window.DubbingEngine.renderSubtitlesEditor();
    }
    if (window.DubPlayer) {
      window.DubPlayer.loadProject(customProject);
    }

    window.showToast(window.currentLang === 'fa' ? `ویدیوی شما (${file.name}) با موفقیت بارگذاری شد` : `Video (${file.name}) uploaded successfully`);
  }

  // Order / Project Quote Form Submission
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('orderName').value;
      const email = document.getElementById('orderEmail').value;
      const phone = document.getElementById('orderPhone').value;
      const videoUrl = document.getElementById('orderVideoUrl').value;
      const notes = document.getElementById('orderNotes').value;

      if (window.AdminCMS) {
        window.AdminCMS.addInquiry({
          id: 'INQ-' + Math.floor(100 + Math.random() * 900),
          name: name,
          email: email,
          phone: phone,
          videoUrl: videoUrl,
          notes: notes,
          date: new Date().toLocaleDateString('fa-IR'),
          status: 'unread'
        });
      }

      orderForm.reset();
      window.showToast(window.currentLang === 'fa' ? 'سفارش شما با موفقیت ثبت شد! کارشناسان به زودی تماس خواهند گرفت.' : 'Order submitted successfully! Our team will contact you shortly.');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEchoDubApp);
} else {
  initEchoDubApp();
}
