/**
 * EchoDub Command Center - Dashboard Controller
 * Real-time telemetry, job submission, watcher control, and domestic stream testing.
 */

const Dashboard = {
  statusInterval: null,
  logsInterval: null,

  init() {
    this.refreshAll();
    this.statusInterval = setInterval(() => this.fetchSystemStatus(), 5000);
    this.logsInterval = setInterval(() => this.fetchLogs(), 3000);
  },

  async refreshAll() {
    await this.fetchSystemStatus();
    await this.fetchLogs();
  },

  async fetchSystemStatus() {
    try {
      const res = await fetch('/api/v1/bridge/system/status');
      if (!res.ok) return;
      const data = await res.json();

      // Iran Server Metrics
      const iranDisk = data.iran_server?.disk;
      if (iranDisk) {
        document.getElementById('iranDiskUsage').innerText = `${iranDisk.used_gb} / ${iranDisk.total_gb}`;
      }

      // US Server Metrics
      const usServer = data.us_server;
      const usBadge = document.getElementById('usBadge');
      if (usServer?.status === 'ONLINE') {
        usBadge.className = 'status-badge status-online';
        usBadge.innerHTML = '<span class="pulse-dot"></span> متصل (8-Core CPU)';
      } else {
        usBadge.className = 'status-badge status-offline';
        usBadge.innerHTML = 'قطع ارتباط با سرور آمریکا';
      }
      document.getElementById('usJobsCount').innerText = usServer?.jobs_count || 0;

      // Watcher Agent Metrics
      const watcher = data.watcher_agent;
      document.getElementById('processedCoursesCount').innerText = watcher?.processed_courses_count || 0;

      // Render Jobs
      if (usServer?.jobs) {
        this.renderJobs(usServer.jobs);
      }
    } catch (e) {
      console.warn("Telemetry fetch error:", e);
    }
  },

  async fetchLogs() {
    try {
      const res = await fetch('/api/v1/bridge/system/logs');
      if (!res.ok) return;
      const data = await res.json();
      const terminal = document.getElementById('terminalLogs');

      if (data.logs && data.logs.length > 0) {
        terminal.innerHTML = data.logs.map(log => {
          let cls = 'log-info';
          if (log.includes('ERROR') || log.includes('error') || log.includes('Failed')) cls = 'log-error';
          else if (log.includes('SUCCESS') || log.includes('complete') || log.includes('transferred')) cls = 'log-success';
          else if (log.includes('WARN')) cls = 'log-warn';
          return `<div class="log-entry ${cls}">${this.escapeHtml(log)}</div>`;
        }).join('');
        terminal.scrollTop = terminal.scrollHeight;
      }
    } catch (e) {
      console.warn("Log fetch error:", e);
    }
  },

  renderJobs(jobs) {
    const tbody = document.getElementById('jobsTableBody');
    if (!jobs || jobs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding: 24px; text-align: center; color: #64748b;">هیچ جابی در حال حاضر در صف نیست.</td></tr>`;
      return;
    }

    tbody.innerHTML = jobs.map(job => {
      const isDone = job.status === 'COMPLETED';
      const isFailed = job.status === 'FAILED';
      const statusCls = isDone ? 'status-online' : (isFailed ? 'status-offline' : 'status-online');
      const streamUrl = `/stream/${job.job_id}`;

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 12px; font-weight: 600; font-family: monospace;">${job.job_id}</td>
          <td style="padding: 12px;"><span class="status-badge ${statusCls}">${job.status}</span></td>
          <td style="padding: 12px;">
            <div style="background: rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden; height: 8px; width: 100px;">
              <div style="background: linear-gradient(90deg, #8b5cf6, #06b6d4); height: 100%; width: ${job.progress || 0}%;"></div>
            </div>
            <span style="font-size: 11px; color: #94a3b8;">${job.progress || 0}%</span>
          </td>
          <td style="padding: 12px; color: #cbd5e1;">${job.current_stage || '-'}</td>
          <td style="padding: 12px;">
            ${isDone ? `<a href="${streamUrl}" target="_blank" style="background: rgba(6,182,212,0.15); color: #22d3ee; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600;"><i class="fa-solid fa-play"></i> پخش داخلی</a>` : '<span style="color: #64748b;">در حال انجام...</span>'}
          </td>
        </tr>
      `;
    }).join('');
  },

  async submitCourse(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const courseUrl = document.getElementById('courseUrlInput').value.trim();
    const voiceGender = document.getElementById('voiceGenderInput').value;
    const postId = document.getElementById('wpPostIdInput').value.trim();

    if (!courseUrl) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> در حال ثبت جاب در سرور ایران...';

    try {
      const isFullCourse = courseUrl.includes('/elearning/') || courseUrl.includes('/video-tutorials/');
      const endpoint = isFullCourse ? '/api/v1/bridge/course/process' : '/api/v1/bridge/dispatch';
      
      const payload = isFullCourse 
        ? { course_url: courseUrl, voice_gender: voiceGender }
        : { video_url: courseUrl, title: "Course Lesson", voice_gender: voiceGender, wordpress_post_id: postId ? parseInt(postId) : null };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      alert(`✅ عملیات با موفقیت آغاز شد!\nپیام: ${data.message || 'جاب به صف افزوده شد.'}`);
      document.getElementById('courseUrlInput').value = '';
      this.refreshAll();
    } catch (err) {
      alert(`❌ خطا در ارتباط با سرور: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-play"></i> شروع پردازش کامل و دوبله خودکار دوره';
    }
  },

  async triggerWatcherScan() {
    try {
      const res = await fetch('/api/v1/bridge/watcher/check-now', { method: 'POST' });
      const data = await res.json();
      alert("🛰️ دستور اسکن فوری به ایجنت ناظر ارسال شد. در چند ثانیه لاگ‌ها بروز می‌شوند.");
      this.fetchLogs();
    } catch (e) {
      alert("خطا در ارسال درخواست اسکن");
    }
  },

  escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
};

document.addEventListener('DOMContentLoaded', () => Dashboard.init());
