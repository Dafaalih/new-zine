(function () {
  'use strict';

  /* ============================================================
     ZINE MAKER — PROJECTS HISTORY MODULE (projects.js)
     Multi-project storage with IndexedDB + fallback
     ============================================================ */

  const DB_NAME = 'ZineMakerDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'projects';
  const LS_BACKUP_KEY = 'zinemaker.projects_meta';

  let dbInstance = null;

  function getDB() {
    if (dbInstance) return Promise.resolve(dbInstance);
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
      req.onsuccess = e => {
        dbInstance = e.target.result;
        resolve(dbInstance);
      };
      req.onerror = () => resolve(null);
    });
  }

  /* ------------------------------------------------------------
     DB Operations
     ------------------------------------------------------------ */
  async function dbGetAll() {
    const db = await getDB();
    if (!db) {
      try {
        const raw = localStorage.getItem(LS_BACKUP_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }
    return new Promise(resolve => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = req.result || [];
          items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          resolve(items);
        };
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  async function dbPut(project) {
    const db = await getDB();
    if (!db) {
      try {
        const list = await dbGetAll();
        const idx = list.findIndex(p => p.id === project.id);
        if (idx >= 0) list[idx] = project;
        else list.unshift(project);
        localStorage.setItem(LS_BACKUP_KEY, JSON.stringify(list.slice(0, 15)));
      } catch (e) {}
      return;
    }
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(project);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async function dbDelete(id) {
    const db = await getDB();
    if (!db) {
      try {
        const list = (await dbGetAll()).filter(p => p.id !== id);
        localStorage.setItem(LS_BACKUP_KEY, JSON.stringify(list));
      } catch (e) {}
      return;
    }
    return new Promise(resolve => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch (e) {
        resolve();
      }
    });
  }

  /* ------------------------------------------------------------
     Helpers
     ------------------------------------------------------------ */
  function timeAgo(ts) {
    if (!ts) return 'just now';
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 45) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    if (s < 604800) return Math.floor(s / 86400) + 'd ago';
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function formatLabel(fmt) {
    switch (fmt) {
      case 'zine8': return '8-page mini zine';
      case 'zine4': return '4-page zine';
      case 'zinefree': return 'free-length zine';
      case 'post': return 'post';
      default: return 'zine';
    }
  }

  /* ------------------------------------------------------------
     Save / Sync Current Project
     ------------------------------------------------------------ */
  let saveTimer = null;
  async function saveCurrent(projectData, thumbUrl) {
    if (!projectData) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        const id = projectData.id || ('proj_' + Date.now());
        const title = projectData.title || (formatLabel(projectData.format) + ' #' + id.slice(-4));
        let prevThumb = null;
        if (!thumbUrl) {
          try {
            const list = await dbGetAll();
            const prev = list.find(x => x.id === id);
            if (prev && prev.thumbnail) prevThumb = prev.thumbnail;
          } catch (e) {}
        }
        const record = {
          id: id,
          title: title,
          format: projectData.format || 'zine8',
          updatedAt: Date.now(),
          thumbnail: thumbUrl || prevThumb || null,
          data: projectData
        };
        await dbPut(record);
        updateHistoryCount();
      } catch (e) {
        console.warn('Projects save error:', e);
      }
    }, 400);
  }

  /* Auto-import legacy single-saved zine if it exists */
  async function autoImportLegacy() {
    try {
      const existing = await dbGetAll();
      if (existing && existing.length > 0) return;
      const raw = localStorage.getItem('zinemaker.saved');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.pages) && parsed.pages.length) {
        const id = 'proj_legacy_' + Date.now();
        parsed.id = id;
        parsed.title = 'My Previous Zine';
        await dbPut({
          id: id,
          title: 'My Previous Zine',
          format: parsed.format || 'zine8',
          updatedAt: Date.now(),
          thumbnail: null,
          data: parsed
        });
        updateHistoryCount();
      }
    } catch (e) {}
  }

  /* ------------------------------------------------------------
     MODAL UI
     ------------------------------------------------------------ */
  let modalEl = null;

  function createModal() {
    if (modalEl) return modalEl;

    const div = document.createElement('div');
    div.id = 'projects-modal';
    div.className = 'projects-modal-overlay hidden';
    div.innerHTML = `
      <div class="projects-dialog" role="dialog" aria-labelledby="pm-title" aria-modal="true">
        <header class="pm-header">
          <div class="pm-title-group">
            <h2 id="pm-title">my projects</h2>
            <span class="pm-badge" id="pm-count-badge">0 saved</span>
          </div>
          <div class="pm-header-actions">
            <button class="pm-btn-new" id="pm-new-zine">+ new zine</button>
            <button class="pm-close" id="pm-close" aria-label="close">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </header>

        <div class="pm-body" id="pm-grid">
          <!-- projects will be injected here -->
        </div>
      </div>
    `;

    document.body.appendChild(div);
    modalEl = div;

    div.querySelector('#pm-close').addEventListener('click', closeModal);
    div.querySelector('#pm-new-zine').addEventListener('click', () => {
      closeModal();
      if (window.ZineApp?.openEditor) {
        window.ZineApp.openEditor(null);
      } else {
        const btn = document.querySelector('#btn-start-zine');
        if (btn) btn.click();
      }
    });

    div.addEventListener('click', e => {
      if (e.target === div) closeModal();
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !modalEl.classList.contains('hidden')) {
        closeModal();
      }
    });

    return div;
  }

  async function renderProjectsList() {
    const grid = document.querySelector('#pm-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="pm-loading">loading projects...</div>';
    const list = await dbGetAll();

    const badge = document.querySelector('#pm-count-badge');
    if (badge) badge.textContent = list.length + (list.length === 1 ? ' project' : ' projects');

    if (!list.length) {
      grid.innerHTML = `
        <div class="pm-empty">
          <p class="pm-empty-text">no saved projects yet.</p>
          <button class="pm-btn-new" id="pm-empty-new" style="margin:0 auto;">start your first zine</button>
        </div>
      `;
      const btn = grid.querySelector('#pm-empty-new');
      if (btn) {
        btn.addEventListener('click', () => {
          closeModal();
          const startBtn = document.querySelector('#btn-start-zine');
          if (startBtn) startBtn.click();
        });
      }
      return;
    }

    let html = '';
    list.forEach(p => {
      const fallbackSvg = `
        <div class="pm-thumb-placeholder">
          <svg viewBox="0 0 100 70" preserveAspectRatio="none" style="width:100%; height:100%; display:block; background:#ffffff;">
            <line x1="0" y1="35" x2="100" y2="35" stroke="#e0e0e0" stroke-width="1.2"/>
            <line x1="25" y1="0" x2="25" y2="70" stroke="#e0e0e0" stroke-width="1.2"/>
            <line x1="50" y1="0" x2="50" y2="70" stroke="#e0e0e0" stroke-width="1.2"/>
            <line x1="75" y1="0" x2="75" y2="70" stroke="#e0e0e0" stroke-width="1.2"/>
          </svg>
        </div>
      `;

      const thumbHtml = p.thumbnail
        ? `<img src="${p.thumbnail}" alt="" class="pm-thumb-img" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';"><div class="pm-thumb-placeholder" style="display:none; width:100%; height:100%;"><svg viewBox="0 0 100 70" preserveAspectRatio="none" style="width:100%; height:100%; display:block; background:#ffffff;"><line x1="0" y1="35" x2="100" y2="35" stroke="#e0e0e0" stroke-width="1.2"/><line x1="25" y1="0" x2="25" y2="70" stroke="#e0e0e0" stroke-width="1.2"/><line x1="50" y1="0" x2="50" y2="70" stroke="#e0e0e0" stroke-width="1.2"/><line x1="75" y1="0" x2="75" y2="70" stroke="#e0e0e0" stroke-width="1.2"/></svg></div>`
        : fallbackSvg;

      html += `
        <div class="pm-card" data-id="${p.id}">
          <div class="pm-card-thumb">
            ${thumbHtml}
          </div>
          <div class="pm-card-info">
            <div class="pm-card-row">
              <input type="text" class="pm-card-title" value="${escapeHtml(p.title || 'untitled zine')}" data-id="${p.id}" spellcheck="false">
            </div>
            <div class="pm-card-meta">
              <span class="pm-tag">${formatLabel(p.format)}</span>
              <span class="pm-date">${timeAgo(p.updatedAt)}</span>
            </div>
          </div>
          <div class="pm-card-actions">
            <button class="pm-btn-open" data-id="${p.id}">open</button>
            <div class="pm-btn-group">
              <button class="pm-btn-dup" data-id="${p.id}" title="duplicate">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
              <button class="pm-btn-dl" data-id="${p.id}" title="export">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </button>
              <button class="pm-btn-del" data-id="${p.id}" title="delete project">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 4v6m4-6v6"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;

    // Wire events
    grid.querySelectorAll('.pm-btn-open').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const proj = list.find(x => x.id === id);
        if (proj && proj.data) {
          closeModal();
          if (window.__zineOpenProject) {
            window.__zineOpenProject(proj.data);
          }
        }
      });
    });

    grid.querySelectorAll('.pm-btn-dup').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const proj = list.find(x => x.id === id);
        if (proj && proj.data) {
          const newId = 'proj_' + Date.now();
          const cloneData = JSON.parse(JSON.stringify(proj.data));
          cloneData.id = newId;
          cloneData.title = (proj.title || 'zine') + ' (copy)';
          await dbPut({
            id: newId,
            title: cloneData.title,
            format: proj.format || 'zine8',
            updatedAt: Date.now(),
            thumbnail: proj.thumbnail,
            data: cloneData
          });
          renderProjectsList();
          updateHistoryCount();
        }
      });
    });

    grid.querySelectorAll('.pm-btn-dl').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const proj = list.find(x => x.id === id);
        if (proj && proj.data) {
          closeModal();
          if (window.__zineOpenProject) {
            window.__zineOpenProject(proj.data);
          }
          setTimeout(() => {
            if (window.ZineExport && window.ZineExport.openDialog) {
              window.ZineExport.openDialog();
            }
          }, 300);
        }
      });
    });

    grid.querySelectorAll('.pm-btn-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const proj = list.find(x => x.id === id);
        const name = proj ? proj.title : 'this project';
        if (confirm('Delete "' + name + '"? This cannot be undone.')) {
          await dbDelete(id);
          renderProjectsList();
          updateHistoryCount();
        }
      });
    });

    grid.querySelectorAll('.pm-card-title').forEach(input => {
      input.addEventListener('change', async () => {
        const id = input.dataset.id;
        const proj = list.find(x => x.id === id);
        if (proj) {
          proj.title = input.value.trim() || 'untitled zine';
          if (proj.data) proj.data.title = proj.title;
          await dbPut(proj);
        }
      });
    });
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  function openModal() {
    injectStyles();
    createModal();
    renderProjectsList();
    modalEl.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (modalEl) {
      modalEl.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  async function updateHistoryCount() {
    const list = await dbGetAll();
    const count = list.length;
    const btn = document.querySelector('#btn-landing-projects');
    if (btn) {
      const span = btn.querySelector('.pm-count');
      if (span) {
        span.textContent = count;
        span.style.display = count > 0 ? 'inline-block' : 'none';
      }
    }
    const resumeBtn = document.querySelector('#btn-resume');
    if (resumeBtn && count > 0) {
      resumeBtn.classList.remove('hidden');
    }
  }

  /* ------------------------------------------------------------
     Styles
     ------------------------------------------------------------ */
  function injectStyles() {
    let style = document.querySelector('#projects-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'projects-styles';
      document.head.appendChild(style);
    }
    style.textContent = `
      .projects-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        padding: 20px;
        box-sizing: border-box;
        font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .projects-modal-overlay.hidden { display: none !important; }
      .projects-dialog {
        background: #14151b;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 12px;
        width: 100%;
        max-width: 900px;
        height: 85vh;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        color: #ffffff;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75);
        overflow: hidden;
        min-height: 0;
      }
      .pm-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        background: #181920;
        flex-shrink: 0;
      }
      .pm-title-group {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .pm-header h2 {
        margin: 0;
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.02em;
        text-transform: lowercase;
        color: #ffffff;
      }
      .pm-badge {
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-size: 11px;
        font-weight: 700;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.14);
        padding: 3px 9px;
        border-radius: 6px;
      }
      .pm-header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .pm-btn-new {
        background: #ffffff;
        color: #000000;
        border: 1px solid #ffffff;
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-weight: 700;
        font-size: 12px;
        padding: 6px 14px;
        border-radius: 7px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        transition: all 0.15s ease;
      }
      .pm-btn-new:hover {
        background: #e6e6e6;
        border-color: #e6e6e6;
      }
      .pm-close {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.14);
        color: #ffffff;
        width: 32px;
        height: 32px;
        border-radius: 7px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .pm-close:hover {
        background: rgba(255, 255, 255, 0.18);
        border-color: rgba(255, 255, 255, 0.3);
      }
      .pm-body {
        padding: 24px;
        overflow-y: auto;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        grid-auto-rows: max-content;
        gap: 18px;
        flex: 1 1 0%;
        min-height: 0;
        background: #0f1015;
      }
      .pm-body::-webkit-scrollbar {
        width: 8px;
      }
      .pm-body::-webkit-scrollbar-track {
        background: #0f1015;
      }
      .pm-body::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }
      @media (max-width: 820px) {
        .pm-body {
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        }
      }
      .pm-empty, .pm-loading {
        grid-column: 1 / -1;
        padding: 60px 20px;
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
        font-family: 'Space Grotesk', -apple-system, sans-serif;
      }
      .pm-empty-text {
        font-size: 15px;
        margin-bottom: 16px;
        font-weight: 600;
      }
      .pm-card {
        background: #181920;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        box-sizing: border-box;
      }
      .pm-card:hover {
        transform: translateY(-2px);
        border-color: rgba(255, 255, 255, 0.3);
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
      }
      .pm-card-thumb {
        width: 100%;
        height: 140px;
        min-height: 140px;
        max-height: 140px;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        position: relative;
        flex-shrink: 0;
      }
      .pm-thumb-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        background: #ffffff;
      }
      .pm-thumb-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
      }
      .pm-card-info {
        padding: 12px 14px 6px;
        background: #181920;
        flex-shrink: 0;
      }
      .pm-card-row {
        margin-bottom: 4px;
      }
      .pm-card-title {
        width: 100%;
        background: transparent;
        border: 1px solid transparent;
        color: #ffffff;
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-size: 13px;
        font-weight: 700;
        padding: 2px 4px;
        margin: 0;
        box-sizing: border-box;
        border-radius: 4px;
        outline: none;
        transition: border-color 0.15s;
      }
      .pm-card-title:hover {
        border-color: rgba(255, 255, 255, 0.2);
      }
      .pm-card-title:focus {
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.05);
      }
      .pm-card-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 6px;
        font-family: 'Space Grotesk', -apple-system, sans-serif;
      }
      .pm-tag {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.14);
        padding: 2px 7px;
        border-radius: 5px;
        font-weight: 700;
        font-size: 10px;
        display: inline-block;
      }
      .pm-date {
        color: rgba(255, 255, 255, 0.45);
        font-size: 11px;
      }
      .pm-card-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 14px 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        background: #181920;
        flex-shrink: 0;
      }
      .pm-btn-open {
        background: #ffffff !important;
        color: #000000 !important;
        border: 1px solid #ffffff !important;
        border-radius: 7px !important;
        font-family: 'Space Grotesk', -apple-system, sans-serif !important;
        font-weight: 700 !important;
        font-size: 12px !important;
        padding: 5px 18px !important;
        height: 28px !important;
        cursor: pointer !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.15s ease !important;
      }
      .pm-btn-open:hover {
        background: #e6e6e6 !important;
        border-color: #e6e6e6 !important;
      }
      .pm-btn-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .pm-btn-dup, .pm-btn-dl, .pm-btn-del {
        width: 28px !important;
        height: 28px !important;
        border-radius: 7px !important;
        border: 1px solid rgba(255, 255, 255, 0.14) !important;
        background: rgba(255, 255, 255, 0.08) !important;
        color: #ffffff !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
        padding: 0 !important;
        flex-shrink: 0 !important;
      }
      .pm-btn-dup:hover, .pm-btn-dl:hover {
        background: rgba(255, 255, 255, 0.16) !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
      }
      .pm-btn-del:hover {
        border-color: #ff453a !important;
        background: rgba(255, 69, 58, 0.2) !important;
        color: #ff453a !important;
      }
    `;
  }

  /* ------------------------------------------------------------
     Init & Global Export
     ------------------------------------------------------------ */
  function init() {
    injectStyles();
    autoImportLegacy().then(updateHistoryCount);

    // Landing button — placed in top-right bar next to light/dark mode dots
    const landingBtn = document.querySelector('#btn-landing-projects');
    if (landingBtn) {
      landingBtn.addEventListener('click', openModal);
    } else {
      const topRight = document.querySelector('.landing-top-right');
      if (topRight) {
        const btn = document.createElement('button');
        btn.id = 'btn-landing-projects';
        btn.className = 'landing-projects-btn';
        btn.title = 'all projects';
        btn.setAttribute('aria-label', 'all projects');
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
            <path d="M3 7 a2 2 0 0 1 2 -2 H8 L10 3 H17 a2 2 0 0 1 2 2 V17 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2 -2 Z"/>
          </svg>
          <span class="pm-count" style="display:none">0</span>
        `;
        btn.addEventListener('click', openModal);
        topRight.insertBefore(btn, topRight.firstChild);
      }
    }

    // Editor top bar button (placed at far right corner)
    const existingEditorBtn = document.querySelector('#btn-editor-projects');
    if (existingEditorBtn) {
      existingEditorBtn.addEventListener('click', () => {
        if (window.ZineApp?.saveNow) window.ZineApp.saveNow();
        openModal();
      });
    } else {
      const topActions = document.querySelector('.top-actions');
      if (topActions) {
        const btn = document.createElement('button');
        btn.id = 'btn-editor-projects';
        btn.className = 'round round-out';
        btn.title = 'project history';
        btn.setAttribute('aria-label', 'project history');
        btn.innerHTML = `
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M3 7 a2 2 0 0 1 2 -2 H8 L10 3 H17 a2 2 0 0 1 2 2 V17 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2 -2 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          </svg>
        `;
        btn.addEventListener('click', () => {
          if (window.ZineApp?.saveNow) window.ZineApp.saveNow();
          openModal();
        });
        topActions.appendChild(btn);
      }
    }

    updateHistoryCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ZineProjects = {
    saveCurrent: saveCurrent,
    getAll: dbGetAll,
    openModal: openModal,
    closeModal: closeModal,
    deleteProject: dbDelete
  };

})();

