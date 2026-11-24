(function() {
  'use strict';

  /* ============================================================
     EXPORT MODULE — export.js
     Full export dialog for PDF, PNG, JPG with RGB/CMYK support
     ============================================================ */

  const SHEET = { W: 1748, H: 1240, COLS: 4, ROWS: 2, FW: 437, FH: 620 };
  const FRAME_SIZE_MM = { w: 154, h: 220 };
  const MM_TO_PX = (mm, dpi) => Math.round(mm * dpi / 25.4);

  const DPI_PRESETS = [
    { label: '72 (screen)', dpi: 72 },
    { label: '150 (standard)', dpi: 150 },
    { label: '300 (print)', dpi: 300 },
    { label: '600 (fine)', dpi: 600 }
  ];

  const CMYK_INK_LIMIT = 3.0;
  const CMYK_BLACK_THRESHOLD = 12;
  const CMYK_SATURATION_SIM = 0.88;
  const MAX_CANVAS_SIDE = 16000;
  const MAX_MEGAPIXELS = 120;

  let exportState = {
    what: 'print-ready',
    imageFormat: 'pdf',
    dpi: 150,
    colorMode: 'rgb',
    jpgQuality: 92,
    includeGuides: false,
    includeLabels: false,
    bleed: false,
    transparentBg: false,
    previewCmyk: false,
    frameIndex: 0
  };

  let dialogEl = null;
  let previewCv = null;

  /* ============================================================
     RGB <-> CMYK CONVERSION
     ============================================================ */
  function rgbToCmyk(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    if (r < CMYK_BLACK_THRESHOLD / 255 && g < CMYK_BLACK_THRESHOLD / 255 && b < CMYK_BLACK_THRESHOLD / 255) {
      return [0, 0, 0, 1];
    }
    const k = 1 - Math.max(r, g, b);
    if (k >= 0.99) return [0, 0, 0, 1];
    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);
    let total = c + m + y + k;
    if (total > CMYK_INK_LIMIT) {
      const scale = CMYK_INK_LIMIT / total;
      return [c * scale, m * scale, y * scale, k];
    }
    return [c, m, y, k];
  }

  function cmykToRgb(c, m, y, k) {
    return [
      Math.round(255 * (1 - c) * (1 - k)),
      Math.round(255 * (1 - m) * (1 - k)),
      Math.round(255 * (1 - y) * (1 - k))
    ];
  }

  /* ============================================================
     UTILITIES
     ============================================================ */
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

  function loadState() {
    try {
      const saved = localStorage.getItem('zine.export.options');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(exportState, parsed);
        // Guides and labels are editing benchmarks only; default off on export
        exportState.includeGuides = false;
        exportState.includeLabels = false;
      }
    } catch (e) {}
  }

  function saveState() {
    try {
      localStorage.setItem('zine.export.options', JSON.stringify(exportState));
    } catch (e) {}
  }

  function toast(msg) {
    if (window.ZineApp?.toast) window.ZineApp.toast(msg);
    else alert(msg);
  }

  /* ============================================================
     DIALOG CREATION
     ============================================================ */
  function createDialog() {
    if (dialogEl) return dialogEl;

    const div = document.createElement('div');
    div.id = 'export-dialog';
    div.className = 'modal-overlay hidden';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-labelledby', 'export-title');
    div.setAttribute('aria-modal', 'true');
    div.tabIndex = -1;

    div.innerHTML = `
      <div class="modal-content export-modal">
        <div class="modal-header">
          <h2 id="export-title">export zine</h2>
          <button class="close-btn" data-close aria-label="close export dialog">&times;</button>
        </div>
        <div class="export-body">
          <div class="export-section">
            <label class="section-label">what to export</label>
            <div class="pill-group">
              <button class="pill small export-what" data-what="print-ready">print-ready sheet</button>
              <button class="pill small export-what" data-what="reading-order">reading order</button>
              <button class="pill small export-what" data-what="current-frame">current frame</button>
            </div>
          </div>
          <div class="export-section">
            <label class="section-label">format</label>
            <div class="pill-group">
              <button class="pill small export-format" data-format="pdf">pdf</button>
              <button class="pill small export-format" data-format="png">png</button>
              <button class="pill small export-format" data-format="jpg">jpg</button>
            </div>
          </div>
          <div class="export-section">
            <label class="section-label">resolution</label>
            <select id="export-dpi" class="export-select">
              <option value="72">72 (screen)</option>
              <option value="150">150 (standard)</option>
              <option value="300">300 (print)</option>
              <option value="600">600 (fine)</option>
            </select>
          </div>
          <div class="export-section">
            <label class="section-label">color mode</label>
            <div class="pill-group">
              <button class="pill small export-color" data-color="rgb">rgb</button>
              <button class="pill small export-color" data-color="cmyk">cmyk</button>
            </div>
          </div>
          <div class="export-section export-extras">
            <label class="section-label">extras</label>
            <label class="checkbox-label">
              <input type="checkbox" id="export-guides">
              <span>include guides</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="export-labels">
              <span>page labels</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="export-bleed">
              <span>add bleed (3mm)</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="export-transparent">
              <span>transparent bg</span>
            </label>
          </div>
          <div class="export-section export-quality hidden">
            <label class="section-label">jpg quality: <span id="quality-val">92</span>%</label>
            <input type="range" id="export-quality" min="50" max="100" value="92" class="quality-slider">
          </div>
          <div class="export-section export-preview hidden">
            <label class="section-label">cmyk preview</label>
            <div id="cmyk-preview-container"></div>
            <div id="gamut-warning" class="gamut-warning hidden">⚠️ saturated colors may shift in cmyk</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="pill" id="btn-export-flipbook" style="margin-right:auto;display:inline-flex;align-items:center;gap:6px;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span>3D book preview</span>
          </button>
          <button class="pill" id="btn-export-cancel">cancel</button>
          <button class="pill primary" id="btn-export-do">export</button>
        </div>
      </div>
    `;

    document.body.appendChild(div);
    dialogEl = div;

    // Event listeners
    div.querySelector('[data-close]').addEventListener('click', closeDialog);
    div.querySelector('#btn-export-cancel').addEventListener('click', closeDialog);
    div.querySelector('#btn-export-flipbook')?.addEventListener('click', () => {
      closeDialog();
      window.ZineFlipbook?.open?.();
    });
    div.querySelector('#btn-export-do').addEventListener('click', doExport);

    // What buttons
    div.querySelectorAll('.export-what').forEach(btn => {
      btn.addEventListener('click', () => {
        exportState.what = btn.dataset.what;
        updateUI();
      });
    });

    // Format buttons
    div.querySelectorAll('.export-format').forEach(btn => {
      btn.addEventListener('click', () => {
        exportState.imageFormat = btn.dataset.format;
        updateUI();
      });
    });

    // Color mode buttons
    div.querySelectorAll('.export-color').forEach(btn => {
      btn.addEventListener('click', () => {
        exportState.colorMode = btn.dataset.color;
        updateUI();
      });
    });

    // DPI select
    div.querySelector('#export-dpi').addEventListener('change', e => {
      exportState.dpi = parseInt(e.target.value, 10);
    });

    // Checkboxes
    div.querySelector('#export-guides').addEventListener('change', e => {
      exportState.includeGuides = e.target.checked;
    });
    div.querySelector('#export-labels').addEventListener('change', e => {
      exportState.includeLabels = e.target.checked;
    });
    div.querySelector('#export-bleed').addEventListener('change', e => {
      exportState.bleed = e.target.checked;
    });
    div.querySelector('#export-transparent').addEventListener('change', e => {
      exportState.transparentBg = e.target.checked;
    });

    // Quality slider
    div.querySelector('#export-quality').addEventListener('input', e => {
      exportState.jpgQuality = parseInt(e.target.value, 10);
      div.querySelector('#quality-val').textContent = exportState.jpgQuality;
    });

    // Keyboard
    div.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDialog();
    });

    // Close on backdrop click
    div.addEventListener('click', e => {
      if (e.target === div) closeDialog();
    });

    return div;
  }

  function updateUI() {
    if (!dialogEl) return;

    // Update what buttons
    dialogEl.querySelectorAll('.export-what').forEach(btn => {
      btn.classList.toggle('pressed', btn.dataset.what === exportState.what);
    });

    // Update format buttons
    dialogEl.querySelectorAll('.export-format').forEach(btn => {
      btn.classList.toggle('pressed', btn.dataset.format === exportState.imageFormat);
    });

    // Update color buttons
    dialogEl.querySelectorAll('.export-color').forEach(btn => {
      btn.classList.toggle('pressed', btn.dataset.color === exportState.colorMode);
    });

    // Update DPI
    dialogEl.querySelector('#export-dpi').value = exportState.dpi;

    // Update checkboxes
    dialogEl.querySelector('#export-guides').checked = exportState.includeGuides;
    dialogEl.querySelector('#export-labels').checked = exportState.includeLabels;
    dialogEl.querySelector('#export-bleed').checked = exportState.bleed;
    dialogEl.querySelector('#export-transparent').checked = exportState.transparentBg;

    // Show/hide quality slider
    const qualitySec = dialogEl.querySelector('.export-quality');
    qualitySec.classList.toggle('hidden', exportState.imageFormat !== 'jpg');

    // Show/hide cmyk preview
    const previewSec = dialogEl.querySelector('.export-preview');
    if (exportState.colorMode === 'cmyk' && exportState.imageFormat === 'pdf') {
      previewSec.classList.remove('hidden');
      updateCmykPreview();
    } else {
      previewSec.classList.add('hidden');
    }

    saveState();
  }

  /* ============================================================
     CMYK PREVIEW
     ============================================================ */
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let s = 0, h = 0;
    if (max !== min) {
      const d = max - min;
      s = l < 0.5 ? d / (max + min) : d / (2 - max - min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [h, s, l];
  }

  function checkGamutWarning(imageData) {
    const data = imageData.data;
    let saturatedPixels = 0, samplePixels = 0;
    for (let i = 0; i < data.length; i += 16) {
      samplePixels++;
      const [h, s, l] = rgb2hsl(data[i], data[i+1], data[i+2]);
      if (s > 0.85 && l > 0.25 && l < 0.65) saturatedPixels++;
    }
    return samplePixels > 0 && (saturatedPixels / samplePixels) > 0.02;
  }

  function getUnzoomedCanvas(fabricCanvas, multiplier, hideHelpers) {
    if (!fabricCanvas) return null;
    multiplier = multiplier || 1;

    const isSheet = fabricCanvas.__page?.isSheet || (window.ZineApp?.getFormat?.() === 'zine8');
    let baseW = SHEET.W;
    let baseH = SHEET.H;
    if (!isSheet) {
      const st = window.ZineApp?.getState?.();
      baseW = st?.pageW || fabricCanvas.width || 495;
      baseH = st?.pageH || fabricCanvas.height || 700;
    }

    const prevVpt = fabricCanvas.viewportTransform ? fabricCanvas.viewportTransform.slice() : [1, 0, 0, 1, 0, 0];
    const prevW = fabricCanvas.getWidth();
    const prevH = fabricCanvas.getHeight();

    // Optionally hide helper labels and badges so they don't show on export
    const hiddenObjs = [];
    if (hideHelpers) {
      fabricCanvas.getObjects().forEach(o => {
        if (o.name && (o.name.startsWith('label-') || o.name.startsWith('badge-'))) {
          if (o.visible) {
            o.visible = false;
            hiddenObjs.push(o);
          }
        }
      });
    }

    // Temporarily discard active object selection box
    const activeObj = fabricCanvas.getActiveObject();
    if (activeObj) {
      fabricCanvas.discardActiveObject();
    }

    // Set 1:1 base dimensions for rendering
    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fabricCanvas.setDimensions({ width: baseW, height: baseH });
    fabricCanvas.renderAll();

    const rendered = fabricCanvas.toCanvasElement(multiplier);

    // Restore hidden helpers
    hiddenObjs.forEach(o => { o.visible = true; });

    // Restore active object
    if (activeObj) {
      fabricCanvas.setActiveObject(activeObj);
    }

    // Restore zoom and viewport
    fabricCanvas.setViewportTransform(prevVpt);
    fabricCanvas.setDimensions({ width: prevW, height: prevH });
    fabricCanvas.renderAll();

    return rendered;
  }

  /* ============================================================
     CMYK PREVIEW
     ============================================================ */
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let s = 0, h = 0;
    if (max !== min) {
      const d = max - min;
      s = l < 0.5 ? d / (max + min) : d / (2 - max - min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [h, s, l];
  }

  function checkGamutWarning(imageData) {
    const data = imageData.data;
    let saturatedPixels = 0, samplePixels = 0;
    for (let i = 0; i < data.length; i += 16) {
      samplePixels++;
      const [h, s, l] = rgb2hsl(data[i], data[i+1], data[i+2]);
      if (s > 0.85 && l > 0.25 && l < 0.65) saturatedPixels++;
    }
    return samplePixels > 0 && (saturatedPixels / samplePixels) > 0.02;
  }

  function renderCmykPreview() {
    const container = $('#cmyk-preview-container');
    if (!container) return;

    const canvas = window.ZineApp?.getSheetCanvas?.() || window.ZineApp?.getPages?.()[0]?.canvas;
    if (!canvas) {
      container.innerHTML = '<p class="hint">no canvas available</p>';
      return;
    }

    const tempCv = getUnzoomedCanvas(canvas, 0.25, true);
    if (!tempCv) {
      container.innerHTML = '<p class="hint">could not generate preview</p>';
      return;
    }

    const ctx = tempCv.getContext('2d');
    const imgData = ctx.getImageData(0, 0, tempCv.width, tempCv.height);
    const data = imgData.data;

    // Convert RGB to CMYK approximation then back to RGB
    for (let i = 0; i < data.length; i += 4) {
      const [c, m, y, k] = rgbToCmyk(data[i], data[i+1], data[i+2]);
      const [r, g, b] = cmykToRgb(c * CMYK_SATURATION_SIM, m * CMYK_SATURATION_SIM, y * CMYK_SATURATION_SIM, k);
      data[i] = r; data[i+1] = g; data[i+2] = b;
    }

    ctx.putImageData(imgData, 0, 0);

    const warn = $('#gamut-warning');
    if (warn) {
      warn.classList.toggle('hidden', !checkGamutWarning(imgData));
    }

    container.innerHTML = '';
    const preview = document.createElement('canvas');
    preview.style.width = '100%';
    preview.style.maxWidth = '400px';
    preview.style.height = 'auto';
    preview.style.border = '1px solid var(--black)';
    preview.width = tempCv.width;
    preview.height = tempCv.height;
    preview.getContext('2d').drawImage(tempCv, 0, 0);
    container.appendChild(preview);
  }

  function updateCmykPreview() {
    renderCmykPreview();
  }

  /* ============================================================
     RENDERING HELPERS
     ============================================================ */
  function getSheetCanvas() {
    return window.ZineApp?.getSheetCanvas?.();
  }

  function getPages() {
    return window.ZineApp?.getPages?.() || [];
  }

  function getFrameBackgrounds() {
    return window.ZineApp?.getFrameBackgrounds?.() || {};
  }

  const ZINE8_ORDER = [
    { page: 1, col: 1, row: 1 },                // FRONT COVER
    { page: 2, col: 2, row: 1 },                // PAGE 1
    { page: 3, col: 3, row: 1 },                // PAGE 2
    { page: 4, col: 3, row: 0, rotated: true },  // PAGE 3
    { page: 5, col: 2, row: 0, rotated: true },  // PAGE 4
    { page: 6, col: 1, row: 0, rotated: true },  // PAGE 5
    { page: 7, col: 0, row: 0, rotated: true },  // PAGE 6
    { page: 8, col: 0, row: 1 }                 // BACK COVER
  ];

  function renderToCanvas(targetCv, options) {
    const { what, dpi, includeGuides, includeLabels, bleed, transparentBg } = options;
    const pages = getPages();
    const sheetCanvas = getSheetCanvas();
    const fmt = window.ZineApp?.getFormat?.() || 'zine8';

    if (!pages.length && !sheetCanvas) {
      throw new Error('no content to export');
    }

    const scale = dpi / 150;
    const bleedPx = bleed ? Math.round(3 * dpi / 25.4) : 0;

    if (what === 'print-ready') {
      if (fmt === 'zine8' && sheetCanvas) {
        // Full 8-page mini-zine sheet export
        const w = Math.round(SHEET.W * scale + bleedPx * 2);
        const h = Math.round(SHEET.H * scale + bleedPx * 2);
        targetCv.width = w;
        targetCv.height = h;
        const ctx = targetCv.getContext('2d');

        if (!transparentBg) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        }

        const unzoomed = getUnzoomedCanvas(sheetCanvas, scale, !includeLabels);
        if (unzoomed) {
          ctx.drawImage(unzoomed, bleedPx, bleedPx, Math.round(SHEET.W * scale), Math.round(SHEET.H * scale));
        }

        // Draw print guides if enabled
        if (includeGuides && window.ZineApp?.getGuidesOn?.()) {
          ctx.save();
          ctx.translate(bleedPx, bleedPx);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = Math.max(1, Math.round(1.5 * scale));
          ctx.setLineDash([6 * scale, 4 * scale]);

          // Vertical fold lines between frames
          for (let i = 1; i <= 3; i++) {
            const x = Math.round(SHEET.FW * i * scale);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, Math.round(SHEET.H * scale));
            ctx.stroke();
          }

          // Horizontal outer fold lines
          const y = Math.round(SHEET.FH * scale);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(Math.round(SHEET.FW * scale), y);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(Math.round(3 * SHEET.FW * scale), y);
          ctx.lineTo(Math.round(SHEET.W * scale), y);
          ctx.stroke();

          // Horizontal center cut line (tighter dash)
          ctx.setLineDash([3 * scale, 3 * scale]);
          ctx.beginPath();
          ctx.moveTo(Math.round(SHEET.FW * scale), y);
          ctx.lineTo(Math.round(3 * SHEET.FW * scale), y);
          ctx.stroke();

          ctx.restore();
        }
      } else {
        // Single post or booklet pages
        const activePage = pages[options.frameIndex || 0] || pages[0];
        const baseW = activePage?.canvas?.width || 900;
        const baseH = activePage?.canvas?.height || 900;
        const w = Math.round(baseW * scale + bleedPx * 2);
        const h = Math.round(baseH * scale + bleedPx * 2);
        targetCv.width = w;
        targetCv.height = h;
        const ctx = targetCv.getContext('2d');

        if (!transparentBg) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        }

        const unzoomed = getUnzoomedCanvas(activePage?.canvas, scale, !includeLabels);
        if (unzoomed) {
          ctx.drawImage(unzoomed, bleedPx, bleedPx, Math.round(baseW * scale), Math.round(baseH * scale));
        }
      }
    } else if (what === 'current-frame') {
      if (fmt === 'zine8' && sheetCanvas) {
        const fw = Math.round(SHEET.FW * scale);
        const fh = Math.round(SHEET.FH * scale);
        targetCv.width = fw;
        targetCv.height = fh;
        const ctx = targetCv.getContext('2d');

        if (!transparentBg) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, fw, fh);
        }

        const activeIdx = window.ZineApp?.getActiveIndex?.() || 0;
        const col = activeIdx % SHEET.COLS;
        const row = Math.floor(activeIdx / SHEET.COLS);

        const unzoomed = getUnzoomedCanvas(sheetCanvas, scale, !includeLabels);
        if (unzoomed) {
          const sx = Math.round(col * SHEET.FW * scale);
          const sy = Math.round(row * SHEET.FH * scale);
          ctx.drawImage(unzoomed, sx, sy, fw, fh, 0, 0, fw, fh);
        }
      } else {
        const activeIdx = window.ZineApp?.getActiveIndex?.() || 0;
        const p = pages[activeIdx] || pages[0];
        if (p?.canvas) {
          const unzoomed = getUnzoomedCanvas(p.canvas, scale, !includeLabels);
          if (unzoomed) {
            targetCv.width = unzoomed.width;
            targetCv.height = unzoomed.height;
            const ctx = targetCv.getContext('2d');
            if (!transparentBg) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, targetCv.width, targetCv.height);
            }
            ctx.drawImage(unzoomed, 0, 0);
          }
        }
      }
    } else if (what === 'reading-order') {
      const frameIdx = options.frameIndex || 0;
      if (fmt === 'zine8' && sheetCanvas) {
        const item = ZINE8_ORDER[frameIdx % 8];
        const fw = Math.round(SHEET.FW * scale);
        const fh = Math.round(SHEET.FH * scale);
        targetCv.width = fw;
        targetCv.height = fh;
        const ctx = targetCv.getContext('2d');

        if (!transparentBg) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, fw, fh);
        }

        const unzoomed = getUnzoomedCanvas(sheetCanvas, scale, !includeLabels);
        if (unzoomed) {
          const sx = Math.round(item.col * SHEET.FW * scale);
          const sy = Math.round(item.row * SHEET.FH * scale);
          ctx.save();
          if (item.rotated) {
            ctx.translate(fw / 2, fh / 2);
            ctx.rotate(Math.PI);
            ctx.translate(-fw / 2, -fh / 2);
          }
          ctx.drawImage(unzoomed, sx, sy, fw, fh, 0, 0, fw, fh);
          ctx.restore();
        }
      } else {
        const p = pages[frameIdx % pages.length] || pages[0];
        if (p?.canvas) {
          const unzoomed = getUnzoomedCanvas(p.canvas, scale, !includeLabels);
          if (unzoomed) {
            targetCv.width = unzoomed.width;
            targetCv.height = unzoomed.height;
            const ctx = targetCv.getContext('2d');
            if (!transparentBg) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, targetCv.width, targetCv.height);
            }
            ctx.drawImage(unzoomed, 0, 0);
          }
        }
      }
    }
  }

  /* ============================================================
     EXPORT FUNCTIONS
     ============================================================ */
  async function doExport() {
    const btn = $('#btn-export-do');
    if (!btn) return;
    const origText = btn.textContent;
    btn.textContent = 'exporting...';
    btn.disabled = true;

    try {
      if (exportState.what === 'reading-order' && exportState.imageFormat === 'pdf') {
        const fmt = window.ZineApp?.getFormat?.() || 'zine8';
        const numPages = fmt === 'zine8' ? 8 : (getPages().length || 1);
        const canvases = [];
        for (let i = 0; i < numPages; i++) {
          const cv = document.createElement('canvas');
          renderToCanvas(cv, Object.assign({}, exportState, { frameIndex: i }));
          canvases.push(cv);
        }
        if (exportState.colorMode === 'cmyk') {
          await exportMultiPageCmykPdf(canvases);
        } else {
          await exportMultiPageRgbPdf(canvases);
        }
      } else {
        const cv = document.createElement('canvas');
        renderToCanvas(cv, exportState);

        if (exportState.colorMode === 'cmyk' && exportState.imageFormat === 'pdf') {
          await exportCmykPdf(cv);
        } else if (exportState.imageFormat === 'pdf') {
          await exportRgbPdf(cv);
        } else if (exportState.imageFormat === 'png') {
          downloadImage(cv, 'zine-export.png', 'image/png');
        } else {
          const quality = exportState.jpgQuality / 100;
          downloadImage(cv, 'zine-export.jpg', 'image/jpeg', quality);
        }
      }

      closeDialog();
      toast('exported successfully');
    } catch (e) {
      toast('export failed: ' + e.message);
      console.error(e);
    } finally {
      btn.textContent = origText;
      btn.disabled = false;
    }
  }

  async function exportRgbPdf(canvas) {
    const { jsPDF } = window.jspdf;
    const isLandscape = canvas.width >= canvas.height;
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    const imgData = canvas.toDataURL('image/jpeg', exportState.jpgQuality / 100);
    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
    pdf.save('zine-export.pdf');
  }

  async function exportMultiPageRgbPdf(canvases) {
    const { jsPDF } = window.jspdf;
    const first = canvases[0];
    const isLandscape = first.width >= first.height;
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'px',
      format: [first.width, first.height]
    });

    canvases.forEach((cv, idx) => {
      if (idx > 0) {
        pdf.addPage([cv.width, cv.height], cv.width >= cv.height ? 'landscape' : 'portrait');
      }
      const imgData = cv.toDataURL('image/jpeg', exportState.jpgQuality / 100);
      pdf.addImage(imgData, 'JPEG', 0, 0, cv.width, cv.height);
    });

    pdf.save('zine-reading-order.pdf');
  }

  async function exportCmykPdf(canvas) {
    const { PDFDocument } = PDFLib;

    const imgData = canvas.toDataURL('image/png');
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imgData;
    });

    const w = canvas.width;
    const h = canvas.height;

    const tmpCv = document.createElement('canvas');
    tmpCv.width = w;
    tmpCv.height = h;
    const ctx = tmpCv.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgDataObj = ctx.getImageData(0, 0, w, h);
    const data = imgDataObj.data;

    const pdfData = ctx.createImageData(w, h);
    for (let i = 0; i < data.length; i += 4) {
      const [c, m, y, k] = rgbToCmyk(data[i], data[i+1], data[i+2]);
      const [r, g, b] = cmykToRgb(c * CMYK_SATURATION_SIM, m * CMYK_SATURATION_SIM, y * CMYK_SATURATION_SIM, k);
      pdfData.data[i] = r;
      pdfData.data[i+1] = g;
      pdfData.data[i+2] = b;
      pdfData.data[i+3] = data[i+3];
    }

    ctx.putImageData(pdfData, 0, 0);
    const cmykImgData = tmpCv.toDataURL('image/png');

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([w, h]);

    const pngImage = await pdfDoc.embedPng(cmykImgData);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: w,
      height: h
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zine-export-cmyk.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportMultiPageCmykPdf(canvases) {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();

    for (let i = 0; i < canvases.length; i++) {
      const cv = canvases[i];
      const w = cv.width;
      const h = cv.height;

      const tmpCv = document.createElement('canvas');
      tmpCv.width = w;
      tmpCv.height = h;
      const ctx = tmpCv.getContext('2d');
      ctx.drawImage(cv, 0, 0);

      const imgDataObj = ctx.getImageData(0, 0, w, h);
      const data = imgDataObj.data;
      const pdfData = ctx.createImageData(w, h);
      for (let j = 0; j < data.length; j += 4) {
        const [c, m, y, k] = rgbToCmyk(data[j], data[j+1], data[j+2]);
        const [r, g, b] = cmykToRgb(c * CMYK_SATURATION_SIM, m * CMYK_SATURATION_SIM, y * CMYK_SATURATION_SIM, k);
        pdfData.data[j] = r;
        pdfData.data[j+1] = g;
        pdfData.data[j+2] = b;
        pdfData.data[j+3] = data[j+3];
      }
      ctx.putImageData(pdfData, 0, 0);

      const cmykImgData = tmpCv.toDataURL('image/png');
      const pngImage = await pdfDoc.embedPng(cmykImgData);
      const page = pdfDoc.addPage([w, h]);
      page.drawImage(pngImage, { x: 0, y: 0, width: w, height: h });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zine-reading-order-cmyk.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadImage(canvas, filename, mimeType, quality) {
    const url = canvas.toDataURL(mimeType, quality);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }

  /* ============================================================
     DIALOG OPEN/CLOSE
     ============================================================ */
  function openDialog() {
    if (!dialogEl) createDialog();
    loadState();
    updateUI();
    dialogEl.classList.remove('hidden');
    dialogEl.focus();
  }

  function closeDialog() {
    if (dialogEl) {
      dialogEl.classList.add('hidden');
    }
  }

  /* ============================================================
     CSS STYLES
     ============================================================ */
  function injectStyles() {
    if ($('#export-dialog-styles')) return;

    const css = `
      #export-dialog {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      #export-dialog.hidden { display: none; }
      .export-modal {
        background: #0d0d14;
        border: 1.5px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        width: 90%;
        max-width: 560px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
        color: #ffffff;
        font-family: 'Inter', Arial, sans-serif;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: #13131c;
        border-bottom: 1.5px solid rgba(255, 255, 255, 0.1);
        border-top-left-radius: 11px;
        border-top-right-radius: 11px;
      }
      .modal-header h2 {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: -0.01em;
        text-transform: lowercase;
      }
      .close-btn {
        background: none;
        border: none;
        font-size: 22px;
        cursor: pointer;
        padding: 0 6px;
        line-height: 1;
        color: rgba(255, 255, 255, 0.6);
        border-radius: 4px;
        transition: color 0.15s, background 0.15s;
      }
      .close-btn:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
      }
      .export-body { padding: 20px; }
      .export-section {
        margin-bottom: 20px;
      }
      .section-label {
        display: block;
        font-size: 11px;
        font-weight: 600;
        text-transform: lowercase;
        letter-spacing: 0.02em;
        margin-bottom: 8px;
        color: rgba(255, 255, 255, 0.55);
      }
      .pill-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .pill-group .pill {
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 500;
        border-radius: 999px;
        background: #1c1c28;
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #ffffff;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .pill-group .pill:hover {
        background: #282838;
        border-color: rgba(255, 255, 255, 0.3);
      }
      .pill-group .pill.pressed {
        background: #ffffff !important;
        color: #000000 !important;
        border-color: #ffffff !important;
        box-shadow: none;
      }
      .export-select {
        width: 100%;
        padding: 9px 12px;
        font-size: 13px;
        border: 1.5px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        background: #14141e;
        color: #ffffff;
        cursor: pointer;
        outline: none;
        transition: border-color 0.15s;
      }
      .export-select:focus {
        border-color: #000000;
      }
      .export-select option {
        background: #14141e;
        color: #ffffff;
      }
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
        cursor: pointer;
        font-size: 13px;
        color: #ffffff !important;
        user-select: none;
      }
      .checkbox-label span {
        color: #ffffff !important;
        font-size: 13px;
        font-weight: 400;
      }
      .checkbox-label input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: #000000;
        cursor: pointer;
        margin: 0;
      }
      .quality-slider {
        width: 100%;
        accent-color: #000000;
        cursor: pointer;
      }
      .gamut-warning {
        margin-top: 10px;
        padding: 10px 14px;
        background: rgba(234, 179, 8, 0.12);
        border: 1px solid rgba(234, 179, 8, 0.35);
        border-radius: 6px;
        font-size: 12px;
        color: #fef08a;
      }
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 14px 20px;
        background: #13131c;
        border-top: 1.5px solid rgba(255, 255, 255, 0.1);
        border-bottom-left-radius: 11px;
        border-bottom-right-radius: 11px;
      }
      .modal-footer .pill {
        padding: 7px 18px;
        font-size: 13px;
        border-radius: 999px;
        cursor: pointer;
        background: #1c1c28;
        border: 1px solid rgba(255, 255, 255, 0.18);
        color: #ffffff;
        transition: all 0.15s;
      }
      .modal-footer .pill:hover {
        background: #282838;
      }
      .modal-footer .pill.primary {
        background: #ffffff;
        color: #000000;
        border-color: #ffffff;
        font-weight: 600;
        box-shadow: none;
      }
      .modal-footer .pill.primary:hover {
        background: #e0e0e0;
        border-color: #e0e0e0;
      }
      .hint {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        text-align: center;
        padding: 20px;
      }
      .hidden { display: none !important; }
    `;

    const style = document.createElement('style');
    style.id = 'export-dialog-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    injectStyles();
    createDialog();
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global
  window.ZineExport = {
    openDialog,
    closeDialog
  };

})();