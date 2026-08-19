/**
 * EchoDub AI - Admin CMS Dashboard & Local State Manager
 */

window.AdminCMS = {
  storageKeys: {
    jobs: 'echodub_jobs_v1',
    inquiries: 'echodub_inquiries_v1',
    showcase: 'echodub_showcase_v1',
    voices: 'echodub_voices_v1'
  },

  init() {
    this.seedDefaultData();
    this.bindEvents();
    this.renderAll();
  },

  seedDefaultData() {
    if (!localStorage.getItem(this.storageKeys.jobs)) {
      const initialJobs = [
        { id: 'JOB-9842', title: 'سخنرانی Sam Altman در اجلاس هوش مصنوعی', lang: 'EN ➔ FA', status: 'completed', date: '۱۴۰۴/۱۱/۲۰' },
        { id: 'JOB-9841', title: 'مستند اعماق اقیانوس آرام - قسمت ۳', lang: 'EN ➔ FA', status: 'completed', date: '۱۴۰۴/۱۱/۱۹' },
        { id: 'JOB-9840', title: 'دوره آموزشی Next.js 15 و هوش مصنوعی', lang: 'EN ➔ FA', status: 'completed', date: '۱۴۰۴/۱۱/۱۸' },
        { id: 'JOB-9839', title: 'آنباکس و بررسی هدست واقعیت مجازی', lang: 'EN ➔ FA', status: 'processing', date: '۱۴۰۴/۱۱/۱۸' }
      ];
      localStorage.setItem(this.storageKeys.jobs, JSON.stringify(initialJobs));
    }

    if (!localStorage.getItem(this.storageKeys.inquiries)) {
      const initialInquiries = [
        {
          id: 'INQ-101',
          name: 'علیرضا رادمان (استودیو کات)',
          email: 'radman@studio-cut.ir',
          phone: '09121234567',
          videoUrl: 'https://youtube.com/watch?v=sample123',
          notes: 'دوبله ۱۰ قسمت دوره هوش مصنوعی با شبیه‌سازی صدای خودم',
          date: '۱۴۰۴/۱۱/۲۰',
          status: 'unread'
        },
        {
          id: 'INQ-102',
          name: 'دکتر مریم شمس',
          email: 'm.shams@uni-med.ac.ir',
          phone: '09129876543',
          videoUrl: 'https://vimeo.com/med-surgery',
          notes: 'دوبله همایش جراحی مغز و اعصاب با لحن علمی و دقیق',
          date: '۱۴۰۴/۱۱/۱۷',
          status: 'contacted'
        }
      ];
      localStorage.setItem(this.storageKeys.inquiries, JSON.stringify(initialInquiries));
    }

    if (!localStorage.getItem(this.storageKeys.showcase)) {
      const initialShowcase = [
        {
          id: 'show-1',
          title: 'سخنرانی TED: آینده هوش مصنوعی و خودآگاهی ماشین‌ها',
          category: 'ted',
          poster: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
          originalLang: 'انگلیسی (English)',
          dubbedLang: 'فارسی (Persian)',
          speakers: '۱ گوینده (آریا)',
          renderTime: '۴ دقیقه',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        },
        {
          id: 'show-2',
          title: 'صحنه دراماتیک فیلم سینمایی میان‌ستاره‌ای (Interstellar)',
          category: 'cinema',
          poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
          originalLang: 'انگلیسی (English)',
          dubbedLang: 'فارسی (Persian)',
          speakers: '۲ گوینده (کاوه و سارا)',
          renderTime: '۶ دقیقه',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
        },
        {
          id: 'show-3',
          title: 'کنفرانس معرفی معماری تراشه‌های هوش مصنوعی اپل',
          category: 'tech',
          poster: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
          originalLang: 'انگلیسی (English)',
          dubbedLang: 'فارسی (Persian)',
          speakers: '۱ گوینده (کوروش)',
          renderTime: '۳ دقیقه',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        },
        {
          id: 'show-4',
          title: 'مستند شگفت‌انگیز حیات‌وحش بی‌بی‌سی با صدای دیوید اتنبرو',
          category: 'doc',
          poster: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=800&q=80',
          originalLang: 'انگلیسی (English)',
          dubbedLang: 'فارسی (Persian)',
          speakers: '۱ گوینده (نیلوفر)',
          renderTime: '۵ دقیقه',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
        }
      ];
      localStorage.setItem(this.storageKeys.showcase, JSON.stringify(initialShowcase));
    }
  },

  bindEvents() {
    const openBtn = document.getElementById('openAdminBtn');
    const closeBtn = document.getElementById('closeAdminBtn');
    const modal = document.getElementById('adminModal');

    if (openBtn && modal) {
      openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.renderAll();
        modal.classList.add('open');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('open');
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.getAttribute('data-admin-tab');
        document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
        const target = document.getElementById(`admin-tab-${tab}`);
        if (target) target.style.display = 'block';
      });
    });
  },

  renderAll() {
    this.renderJobsTable();
    this.renderInquiriesTable();
    this.renderShowcaseCards();
  },

  renderJobsTable() {
    const tableBody = document.getElementById('adminJobsTableBody');
    if (!tableBody) return;

    const jobs = JSON.parse(localStorage.getItem(this.storageKeys.jobs) || '[]');
    tableBody.innerHTML = '';

    jobs.forEach(job => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family:var(--font-mono); font-weight:700; color:var(--accent-cyan);">${job.id}</td>
        <td style="font-weight:600;">${job.title}</td>
        <td><span class="badge-pill" style="font-size:0.75rem;">${job.lang}</span></td>
        <td>
          <span class="status-badge-table ${job.status === 'completed' ? 'status-completed' : 'status-processing'}">
            ${job.status === 'completed' ? window.getTranslation('statusCompleted') : window.getTranslation('statusProcessing')}
          </span>
        </td>
        <td style="color:var(--text-dim);">${job.date}</td>
        <td>
          <button class="btn btn-secondary" style="padding:0.3rem 0.75rem; font-size:0.8rem;" onclick="window.AdminCMS.deleteJob('${job.id}')">
            🗑️
          </button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    const countEl = document.getElementById('adminStatTotalJobs');
    if (countEl) countEl.innerText = `+${2500 + jobs.length}`;
  },

  addJob(job) {
    const jobs = JSON.parse(localStorage.getItem(this.storageKeys.jobs) || '[]');
    jobs.unshift(job);
    localStorage.setItem(this.storageKeys.jobs, JSON.stringify(jobs));
    this.renderJobsTable();
  },

  deleteJob(id) {
    let jobs = JSON.parse(localStorage.getItem(this.storageKeys.jobs) || '[]');
    jobs = jobs.filter(j => j.id !== id);
    localStorage.setItem(this.storageKeys.jobs, JSON.stringify(jobs));
    this.renderJobsTable();
    if (window.showToast) {
      window.showToast(window.currentLang === 'fa' ? 'پروژه از لیست حذف شد' : 'Job deleted from list');
    }
  },

  renderInquiriesTable() {
    const tableBody = document.getElementById('adminInquiriesTableBody');
    if (!tableBody) return;

    const inquiries = JSON.parse(localStorage.getItem(this.storageKeys.inquiries) || '[]');
    tableBody.innerHTML = '';

    inquiries.forEach(inq => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:700;">${inq.name}</td>
        <td style="font-family:var(--font-mono); font-size:0.85rem;">${inq.email}<br><small style="color:var(--text-dim);">${inq.phone}</small></td>
        <td style="max-width:280px; font-size:0.85rem; color:var(--text-muted);">${inq.notes}</td>
        <td style="color:var(--text-dim);">${inq.date}</td>
        <td>
          <button class="btn btn-cyan" style="padding:0.35rem 0.8rem; font-size:0.8rem;" onclick="window.AdminCMS.markInquiry('${inq.id}')">
            ${inq.status === 'unread' ? '✉️ بررسی شد' : '✅ پاسخ داده شد'}
          </button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  },

  addInquiry(inq) {
    const inquiries = JSON.parse(localStorage.getItem(this.storageKeys.inquiries) || '[]');
    inquiries.unshift(inq);
    localStorage.setItem(this.storageKeys.inquiries, JSON.stringify(inquiries));
    this.renderInquiriesTable();
  },

  markInquiry(id) {
    const inquiries = JSON.parse(localStorage.getItem(this.storageKeys.inquiries) || '[]');
    const target = inquiries.find(i => i.id === id);
    if (target) {
      target.status = target.status === 'unread' ? 'contacted' : 'unread';
      localStorage.setItem(this.storageKeys.inquiries, JSON.stringify(inquiries));
      this.renderInquiriesTable();
      if (window.showToast) {
        window.showToast(window.currentLang === 'fa' ? 'وضعیت پیام به‌روزرسانی شد' : 'Inquiry status updated');
      }
    }
  },

  renderShowcaseCards(filterCat = 'all') {
    const container = document.getElementById('showcaseGridContainer');
    if (!container) return;

    const showcaseItems = JSON.parse(localStorage.getItem(this.storageKeys.showcase) || '[]');
    container.innerHTML = '';

    const filtered = filterCat === 'all' 
      ? showcaseItems 
      : showcaseItems.filter(item => item.category === filterCat);

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'showcase-card';
      card.innerHTML = `
        <div class="showcase-thumb">
          <img src="${item.poster}" alt="${item.title}" loading="lazy">
          <div class="showcase-badge-cat">${item.category.toUpperCase()}</div>
        </div>
        <div class="showcase-body">
          <h3 style="font-size:1.1rem; font-weight:700;">${item.title}</h3>
          <div class="showcase-meta-grid">
            <div><span style="color:var(--text-dim);">${window.getTranslation('showcaseStatsOriginal')}</span> <strong>${item.originalLang}</strong></div>
            <div><span style="color:var(--text-dim);">${window.getTranslation('showcaseStatsDubbed')}</span> <strong style="color:var(--accent-emerald);">${item.dubbedLang}</strong></div>
            <div><span style="color:var(--text-dim);">${window.getTranslation('showcaseStatsSpeaker')}</span> <strong>${item.speakers}</strong></div>
            <div><span style="color:var(--text-dim);">${window.getTranslation('showcaseStatsTime')}</span> <strong>${item.renderTime}</strong></div>
          </div>
          <button class="btn btn-secondary" style="width:100%; margin-top:0.5rem;" onclick="window.AdminCMS.playShowcase('${item.id}')">
            ▶️ پخش و مقایسه زنده دوبله
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  },

  playShowcase(id) {
    const items = JSON.parse(localStorage.getItem(this.storageKeys.showcase) || '[]');
    const item = items.find(i => i.id === id);
    if (item && window.DubbingEngine) {
      if (item.category === 'ted') window.DubbingEngine.selectPreset('ted');
      else if (item.category === 'cinema') window.DubbingEngine.selectPreset('movie');
      else if (item.category === 'tech') window.DubbingEngine.selectPreset('tech');
      else if (item.category === 'doc') window.DubbingEngine.selectPreset('nature');

      const studioSection = document.getElementById('studio');
      if (studioSection) {
        studioSection.scrollIntoView({ behavior: 'smooth' });
      }

      if (window.showToast) {
        window.showToast(window.currentLang === 'fa' ? `پروژه ${item.title} در استودیو بارگذاری شد` : `Loaded ${item.title} in Studio`);
      }
    }
  }
};
