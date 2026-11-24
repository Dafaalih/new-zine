/**
 * ZINE PHOTO ADJUSTMENTS MODULE (adjustments.js)
 * High-performance non-destructive image adjustments for Fabric.js:
 * 1. Threshold (high-contrast 2-tone / black & white with customizable colors and invert)
 * 2. Posterize (discrete tonal quantization with levels and color/grayscale mode)
 * 3. Gradient Map (shadows-to-highlights color remapping with duotone & riso presets)
 */
(function (global) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // 1. FABRIC.JS CUSTOM FILTER REGISTRATION
  // ═══════════════════════════════════════════════════════════════

  function hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return { r: 0, g: 0, b: 0 };
    let h = hex.trim().replace(/^#/, '');
    if (h.length === 3) {
      h = h.split('').map(c => c + c).join('');
    }
    const num = parseInt(h, 16);
    if (isNaN(num)) return { r: 0, g: 0, b: 0 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function initFabricFilters() {
    if (typeof fabric === 'undefined' || !fabric.Image || !fabric.Image.filters) return;

    // Ensure 2D Canvas Backend is used for reliable custom JS pixel manipulation
    try {
      fabric.enableGLFiltering = false;
      if (fabric.Canvas2dFilterBackend && !fabric.filterBackend) {
        fabric.filterBackend = new fabric.Canvas2dFilterBackend();
      }
    } catch (_) {}

    // A. THRESHOLD FILTER
    fabric.Image.filters.Threshold = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
      type: 'Threshold',
      level: 128,
      invert: false,
      color1: '#000000',
      color2: '#ffffff',

      applyTo2d: function (options) {
        const imageData = options.imageData;
        if (!imageData || !imageData.data) return;
        const data = imageData.data;
        const len = data.length;
        const lvl = typeof this.level === 'number' ? this.level : 128;
        const inv = !!this.invert;
        const c1 = hexToRgb(this.color1 || '#000000');
        const c2 = hexToRgb(this.color2 || '#ffffff');

        for (let i = 0; i < len; i += 4) {
          if (data[i + 3] === 0) continue;
          // Perceptual luminance formula Rec. 709
          const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          const isLight = inv ? (lum < lvl) : (lum >= lvl);
          const col = isLight ? c2 : c1;
          data[i] = col.r;
          data[i + 1] = col.g;
          data[i + 2] = col.b;
        }
      },

      toObject: function () {
        return fabric.util.object.extend(this.callSuper('toObject'), {
          level: this.level,
          invert: this.invert,
          color1: this.color1,
          color2: this.color2
        });
      }
    });
    fabric.Image.filters.Threshold.fromObject = fabric.Image.filters.BaseFilter.fromObject;

    // B. POSTERIZE FILTER
    fabric.Image.filters.Posterize = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
      type: 'Posterize',
      levels: 4,
      grayscale: false,

      applyTo2d: function (options) {
        const imageData = options.imageData;
        if (!imageData || !imageData.data) return;
        const data = imageData.data;
        const len = data.length;
        const numLevels = Math.max(2, Math.min(64, this.levels || 4));
        const step = 255 / (numLevels - 1);
        const isGray = !!this.grayscale;

        for (let i = 0; i < len; i += 4) {
          if (data[i + 3] === 0) continue;
          if (isGray) {
            const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
            const q = Math.round(Math.round(lum / step) * step);
            data[i] = q;
            data[i + 1] = q;
            data[i + 2] = q;
          } else {
            data[i] = Math.round(Math.round(data[i] / step) * step);
            data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
            data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
          }
        }
      },

      toObject: function () {
        return fabric.util.object.extend(this.callSuper('toObject'), {
          levels: this.levels,
          grayscale: this.grayscale
        });
      }
    });
    fabric.Image.filters.Posterize.fromObject = fabric.Image.filters.BaseFilter.fromObject;

    // C. GRADIENT MAP FILTER
    fabric.Image.filters.GradientMap = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
      type: 'GradientMap',
      color1: '#000000',
      color2: '#ffffff',
      invert: false,

      applyTo2d: function (options) {
        const imageData = options.imageData;
        if (!imageData || !imageData.data) return;
        const data = imageData.data;
        const len = data.length;
        const inv = !!this.invert;
        const c1 = hexToRgb(this.color1 || '#000000');
        const c2 = hexToRgb(this.color2 || '#ffffff');

        // Precompute 256-entry lookup table for high performance
        const lutR = new Uint8Array(256);
        const lutG = new Uint8Array(256);
        const lutB = new Uint8Array(256);
        for (let j = 0; j < 256; j++) {
          const t = j / 255;
          lutR[j] = Math.round(c1.r + (c2.r - c1.r) * t);
          lutG[j] = Math.round(c1.g + (c2.g - c1.g) * t);
          lutB[j] = Math.round(c1.b + (c2.b - c1.b) * t);
        }

        for (let i = 0; i < len; i += 4) {
          if (data[i + 3] === 0) continue;
          let lum = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
          if (lum < 0) lum = 0;
          else if (lum > 255) lum = 255;
          const idx = inv ? (255 - lum) : lum;
          data[i] = lutR[idx];
          data[i + 1] = lutG[idx];
          data[i + 2] = lutB[idx];
        }
      },

      toObject: function () {
        return fabric.util.object.extend(this.callSuper('toObject'), {
          color1: this.color1,
          color2: this.color2,
          invert: this.invert
        });
      }
    });
    fabric.Image.filters.GradientMap.fromObject = fabric.Image.filters.BaseFilter.fromObject;
  }

  // Initialize filters immediately if fabric is present, or defer to DOMContentLoaded
  if (typeof fabric !== 'undefined') {
    initFabricFilters();
  } else {
    document.addEventListener('DOMContentLoaded', initFabricFilters);
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. GRADIENT MAP PRESETS & DEFAULTS
  // ═══════════════════════════════════════════════════════════════

  const GRADIENT_PRESETS = [
    { id: 'riso-pink', name: 'Riso Pink', color1: '#0d1b2a', color2: '#ff3366' },
    { id: 'duotone-rust', name: 'Duotone', color1: '#1d2d44', color2: '#f4a261' },
    { id: 'cyberpunk', name: 'Cyberpunk', color1: '#240046', color2: '#00ffcc' },
    { id: 'retro-sepia', name: 'Sepia', color1: '#2b1810', color2: '#f5ebe0' },
    { id: 'blueprint', name: 'Blueprint', color1: '#031d44', color2: '#edf2f7' },
    { id: 'acid-zine', name: 'Acid Green', color1: '#091809', color2: '#39ff14' },
    { id: 'sunset-heat', name: 'Sunset Heat', color1: '#03071e', color2: '#ffba08' },
    { id: 'noir', name: 'Noir B&W', color1: '#000000', color2: '#ffffff' }
  ];

  function getObjectAdjustments(obj) {
    if (!obj) return null;
    if (!obj.adjustments) {
      obj.adjustments = {
        threshold: { enabled: false, level: 128, invert: false, color1: '#000000', color2: '#ffffff' },
        posterize: { enabled: false, levels: 4, grayscale: false },
        gradientMap: { enabled: false, color1: '#0d1b2a', color2: '#ff3366', invert: false, preset: 'riso-pink' }
      };
    } else {
      // Ensure sub-objects exist
      if (!obj.adjustments.threshold) {
        obj.adjustments.threshold = { enabled: false, level: 128, invert: false, color1: '#000000', color2: '#ffffff' };
      }
      if (!obj.adjustments.posterize) {
        obj.adjustments.posterize = { enabled: false, levels: 4, grayscale: false };
      }
      if (!obj.adjustments.gradientMap) {
        obj.adjustments.gradientMap = { enabled: false, color1: '#0d1b2a', color2: '#ff3366', invert: false, preset: 'riso-pink' };
      }
    }
    return obj.adjustments;
  }

  function getFiltersForObject(obj) {
    if (!obj || obj.type !== 'image' || !obj.adjustments) return [];
    initFabricFilters();
    if (!fabric.Image || !fabric.Image.filters) return [];

    const adj = obj.adjustments;
    const filters = [];

    // Order of execution:
    // 1. Posterize first (reduces bit depth / steps)
    if (adj.posterize && adj.posterize.enabled && fabric.Image.filters.Posterize) {
      filters.push(new fabric.Image.filters.Posterize({
        levels: adj.posterize.levels || 4,
        grayscale: !!adj.posterize.grayscale
      }));
    }

    // 2. Threshold (converts to binary 2-tone)
    if (adj.threshold && adj.threshold.enabled && fabric.Image.filters.Threshold) {
      filters.push(new fabric.Image.filters.Threshold({
        level: adj.threshold.level ?? 128,
        invert: !!adj.threshold.invert,
        color1: adj.threshold.color1 || '#000000',
        color2: adj.threshold.color2 || '#ffffff'
      }));
    }

    // 3. Gradient Map (maps luminance to gradient)
    if (adj.gradientMap && adj.gradientMap.enabled && fabric.Image.filters.GradientMap) {
      filters.push(new fabric.Image.filters.GradientMap({
        color1: adj.gradientMap.color1 || '#0d1b2a',
        color2: adj.gradientMap.color2 || '#ff3366',
        invert: !!adj.gradientMap.invert
      }));
    }

    return filters;
  }

  function applyAdjustments(obj) {
    if (!obj) return;
    if (window.ZineEffects && window.ZineEffects.applyEffects) {
      window.ZineEffects.applyEffects(obj);
    } else {
      if (obj.type === 'image') {
        obj.filters = getFiltersForObject(obj);
        if (obj.applyFilters) obj.applyFilters();
      }
      obj.dirty = true;
      const c = obj.canvas || (window.ZineApp && window.ZineApp.activeCanvas && window.ZineApp.activeCanvas());
      if (c) c.requestRenderAll();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. UI RENDERING FOR PROPS DRAWER
  // ═══════════════════════════════════════════════════════════════

  function renderSectionHTML(obj) {
    if (!obj || obj.type !== 'image') return '';
    const adj = getObjectAdjustments(obj);
    const hasActive = (adj.threshold?.enabled || adj.posterize?.enabled || adj.gradientMap?.enabled);

    // Render Gradient Presets HTML
    const presetsHTML = GRADIENT_PRESETS.map(p => {
      const isSelected = (adj.gradientMap?.color1?.toLowerCase() === p.color1.toLowerCase() &&
                          adj.gradientMap?.color2?.toLowerCase() === p.color2.toLowerCase());
      return `
        <button type="button" class="tp-adj-preset-pill ${isSelected ? 'active' : ''}" 
                data-action="apply-grad-preset" 
                data-p-color1="${p.color1}" 
                data-p-color2="${p.color2}" 
                title="${p.name}">
          <span class="tp-adj-preset-bar" style="background:linear-gradient(90deg, ${p.color1}, ${p.color2});"></span>
          <span class="tp-adj-preset-label">${p.name}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="tp-card-box tp-adjustments-card-container">
        <div class="tp-card-header-row" style="margin-bottom:8px;">
          <span class="tp-card-label" style="font-weight:700;display:flex;align-items:center;gap:6px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>
            </svg>
            Adjustments
          </span>
          ${hasActive ? `<button type="button" class="tp-adj-reset-btn" id="tp-adj-reset" title="Reset all adjustments">Reset</button>` : ''}
        </div>

        <div class="tp-adjustments-list">
          <!-- 1. THRESHOLD -->
          <div class="tp-adj-card ${adj.threshold?.enabled ? 'active' : ''}" data-adj="threshold">
            <div class="tp-adj-header">
              <button type="button" class="tp-adj-toggle-btn ${adj.threshold?.enabled ? 'active' : ''}" data-action="toggle-adj" data-adj="threshold" title="Toggle Threshold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  ${adj.threshold?.enabled 
                    ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
                    : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'}
                </svg>
              </button>
              <span class="tp-adj-title">Threshold</span>
              <button type="button" class="tp-adj-expand-btn ${adj.threshold?.enabled ? 'open' : ''}" data-action="expand-adj" data-adj="threshold" title="Expand controls">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
            </div>

            <div class="tp-adj-body" style="${adj.threshold?.enabled ? '' : 'display:none;'}">
              <div class="tp-adj-slider-row">
                <div class="tp-card-header-row" style="margin-bottom:4px;">
                  <span class="tp-card-label" style="font-size:11px;">Threshold Level</span>
                  <span class="tp-card-badge" id="val-adj-threshold">${adj.threshold?.level ?? 128}</span>
                </div>
                <input type="range" class="tp-modern-range" min="0" max="255" value="${adj.threshold?.level ?? 128}" data-adj="threshold" data-prop="level" aria-label="threshold level">
              </div>

              <div class="tp-adj-controls-row" style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
                <button type="button" class="tp-adj-pill-btn ${adj.threshold?.invert ? 'active' : ''}" data-action="toggle-invert" data-adj="threshold">
                  Invert
                </button>

                <div class="tp-adj-colors-pair" style="display:flex;align-items:center;gap:6px;">
                  <span style="font-size:10px;color:rgba(255,255,255,0.5)">Dark</span>
                  <button type="button" class="tp-adj-color-swatch" data-adj="threshold" data-color-prop="color1" style="background:${adj.threshold?.color1 || '#000000'};" title="Dark Tone Color"></button>
                  <span style="font-size:10px;color:rgba(255,255,255,0.5)">Light</span>
                  <button type="button" class="tp-adj-color-swatch" data-adj="threshold" data-color-prop="color2" style="background:${adj.threshold?.color2 || '#ffffff'};" title="Light Tone Color"></button>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. POSTERIZE -->
          <div class="tp-adj-card ${adj.posterize?.enabled ? 'active' : ''}" data-adj="posterize">
            <div class="tp-adj-header">
              <button type="button" class="tp-adj-toggle-btn ${adj.posterize?.enabled ? 'active' : ''}" data-action="toggle-adj" data-adj="posterize" title="Toggle Posterize">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  ${adj.posterize?.enabled 
                    ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
                    : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'}
                </svg>
              </button>
              <span class="tp-adj-title">Posterize</span>
              <button type="button" class="tp-adj-expand-btn ${adj.posterize?.enabled ? 'open' : ''}" data-action="expand-adj" data-adj="posterize" title="Expand controls">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
            </div>

            <div class="tp-adj-body" style="${adj.posterize?.enabled ? '' : 'display:none;'}">
              <div class="tp-adj-slider-row">
                <div class="tp-card-header-row" style="margin-bottom:4px;">
                  <span class="tp-card-label" style="font-size:11px;">Levels / Steps</span>
                  <span class="tp-card-badge" id="val-adj-posterize">${adj.posterize?.levels ?? 4}</span>
                </div>
                <input type="range" class="tp-modern-range" min="2" max="16" step="1" value="${adj.posterize?.levels ?? 4}" data-adj="posterize" data-prop="levels" aria-label="posterize levels">
              </div>

              <div class="tp-adj-controls-row" style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
                <span style="font-size:11px;color:rgba(255,255,255,0.6)">Mode</span>
                <div class="tp-adj-seg-group">
                  <button type="button" class="tp-adj-seg-btn ${!adj.posterize?.grayscale ? 'active' : ''}" data-action="set-posterize-mode" data-val="color">Color</button>
                  <button type="button" class="tp-adj-seg-btn ${adj.posterize?.grayscale ? 'active' : ''}" data-action="set-posterize-mode" data-val="gray">B&W</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. GRADIENT MAP -->
          <div class="tp-adj-card ${adj.gradientMap?.enabled ? 'active' : ''}" data-adj="gradientMap">
            <div class="tp-adj-header">
              <button type="button" class="tp-adj-toggle-btn ${adj.gradientMap?.enabled ? 'active' : ''}" data-action="toggle-adj" data-adj="gradientMap" title="Toggle Gradient Map">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  ${adj.gradientMap?.enabled 
                    ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
                    : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'}
                </svg>
              </button>
              <span class="tp-adj-title">Gradient Map</span>
              <button type="button" class="tp-adj-expand-btn ${adj.gradientMap?.enabled ? 'open' : ''}" data-action="expand-adj" data-adj="gradientMap" title="Expand controls">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
            </div>

            <div class="tp-adj-body" style="${adj.gradientMap?.enabled ? '' : 'display:none;'}">
              <div class="tp-adj-presets-label">Presets</div>
              <div class="tp-adj-presets-grid">
                ${presetsHTML}
              </div>

              <div class="tp-adj-grad-custom-row" style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="font-size:10px;color:rgba(255,255,255,0.5)">Dark</span>
                  <button type="button" class="tp-adj-color-swatch" data-adj="gradientMap" data-color-prop="color1" style="background:${adj.gradientMap?.color1 || '#0d1b2a'};" title="Shadows Color"></button>
                  <span style="font-size:10px;color:rgba(255,255,255,0.5)">Light</span>
                  <button type="button" class="tp-adj-color-swatch" data-adj="gradientMap" data-color-prop="color2" style="background:${adj.gradientMap?.color2 || '#ff3366'};" title="Highlights Color"></button>
                </div>
                <button type="button" class="tp-adj-pill-btn ${adj.gradientMap?.invert ? 'active' : ''}" data-action="reverse-gradient" data-adj="gradientMap" title="Reverse Gradient">
                  ⇄ Invert
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function getActiveCanvasObject() {
    const c = (window.ZineApp && window.ZineApp.activeCanvas && window.ZineApp.activeCanvas()) ||
              (window.ZineMaker && window.ZineMaker.activeCanvas && window.ZineMaker.activeCanvas());
    if (!c) return null;
    const objs = c.getActiveObjects();
    return objs && objs.length === 1 ? objs[0] : null;
  }

  function refreshDrawerUI(obj) {
    if (!obj || obj.type !== 'image') return;
    const container = document.querySelector('.tp-adjustments-card-container');
    if (!container) return;
    const temp = document.createElement('div');
    temp.innerHTML = renderSectionHTML(obj);
    const newEl = temp.firstElementChild;
    if (newEl && container.parentNode) {
      container.parentNode.replaceChild(newEl, container);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. EVENT DELEGATION
  // ═══════════════════════════════════════════════════════════════

  document.addEventListener('click', (e) => {
    const obj = getActiveCanvasObject();
    if (!obj || obj.type !== 'image') return;
    const adj = getObjectAdjustments(obj);

    // 1. Reset all adjustments
    const resetBtn = e.target.closest('#tp-adj-reset');
    if (resetBtn) {
      e.preventDefault();
      adj.threshold.enabled = false;
      adj.posterize.enabled = false;
      adj.gradientMap.enabled = false;
      applyAdjustments(obj);
      refreshDrawerUI(obj);
      if (window.ZineApp?.markChange) window.ZineApp.markChange();
      if (window.ZineApp?.queueHistory) window.ZineApp.queueHistory(window.ZineApp.activePage());
      return;
    }

    // 2. Toggle Adjustment (Eye / Switch)
    const toggleBtn = e.target.closest('[data-action="toggle-adj"]');
    if (toggleBtn) {
      e.preventDefault();
      const key = toggleBtn.dataset.adj;
      if (key && adj[key]) {
        adj[key].enabled = !adj[key].enabled;
        applyAdjustments(obj);
        refreshDrawerUI(obj);
        if (window.ZineApp?.markChange) window.ZineApp.markChange();
        if (window.ZineApp?.queueHistory) window.ZineApp.queueHistory(window.ZineApp.activePage());
      }
      return;
    }

    // 3. Expand / Collapse Body
    const expandBtn = e.target.closest('[data-action="expand-adj"]');
    if (expandBtn) {
      e.preventDefault();
      const card = expandBtn.closest('.tp-adj-card');
      if (card) {
        const body = card.querySelector('.tp-adj-body');
        if (body) {
          const isHidden = body.style.display === 'none';
          body.style.display = isHidden ? 'block' : 'none';
          expandBtn.classList.toggle('open', isHidden);
        }
      }
      return;
    }

    // 4. Toggle Invert
    const invertBtn = e.target.closest('[data-action="toggle-invert"]');
    if (invertBtn) {
      e.preventDefault();
      const key = invertBtn.dataset.adj;
      if (key && adj[key]) {
        adj[key].invert = !adj[key].invert;
        applyAdjustments(obj);
        invertBtn.classList.toggle('active', adj[key].invert);
        if (window.ZineApp?.markChange) window.ZineApp.markChange();
        if (window.ZineApp?.queueHistory) window.ZineApp.queueHistory(window.ZineApp.activePage());
      }
      return;
    }

    // 5. Reverse Gradient
    const revBtn = e.target.closest('[data-action="reverse-gradient"]');
    if (revBtn) {
      e.preventDefault();
      if (adj.gradientMap) {
        const tmp = adj.gradientMap.color1;
        adj.gradientMap.color1 = adj.gradientMap.color2;
        adj.gradientMap.color2 = tmp;
        applyAdjustments(obj);
        refreshDrawerUI(obj);
        if (window.ZineApp?.markChange) window.ZineApp.markChange();
        if (window.ZineApp?.queueHistory) window.ZineApp.queueHistory(window.ZineApp.activePage());
      }
      return;
    }

    // 6. Set Posterize Mode (Color vs B&W)
    const segBtn = e.target.closest('[data-action="set-posterize-mode"]');
    if (segBtn) {
      e.preventDefault();
      const val = segBtn.dataset.val;
      if (adj.posterize) {
        adj.posterize.grayscale = (val === 'gray');
        applyAdjustments(obj);
        refreshDrawerUI(obj);
        if (window.ZineApp?.markChange) window.ZineApp.markChange();
        if (window.ZineApp?.queueHistory) window.ZineApp.queueHistory(window.ZineApp.activePage());
      }
      return;
    }

    // 7. Apply Gradient Preset
    const presetBtn = e.target.closest('[data-action="apply-grad-preset"]');
    if (presetBtn) {
      e.preventDefault();
      const c1 = presetBtn.dataset.pColor1;
      const c2 = presetBtn.dataset.pColor2;
      if (adj.gradientMap && c1 && c2) {
        adj.gradientMap.enabled = true;
        adj.gradientMap.color1 = c1;
        adj.gradientMap.color2 = c2;
        applyAdjustments(obj);
        refreshDrawerUI(obj);
        if (window.ZineApp?.markChange) window.ZineApp.markChange();
        if (window.ZineApp?.queueHistory) window.ZineApp.queueHistory(window.ZineApp.activePage());
      }
      return;
    }

    // 8. Custom Color Swatch Click -> Open Figma Color Picker
    const swatchBtn = e.target.closest('.tp-adj-color-swatch');
    if (swatchBtn) {
      e.preventDefault();
      const key = swatchBtn.dataset.adj;
      const prop = swatchBtn.dataset.colorProp;
      if (key && prop && adj[key]) {
        const curColor = adj[key][prop] || '#000000';
        if (window.FigmaColorPicker) {
          window.FigmaColorPicker.open(swatchBtn, curColor, (chosenColor) => {
            if (typeof chosenColor === 'string') {
              adj[key][prop] = chosenColor;
              swatchBtn.style.background = chosenColor;
              applyAdjustments(obj);
              if (window.ZineApp?.markChange) window.ZineApp.markChange();
              if (window.ZineApp?.queueHistory) window.ZineApp.queueHistory(window.ZineApp.activePage());
            }
          });
        }
      }
      return;
    }
  });

  // Slider dragging with live 60fps render
  document.addEventListener('input', (e) => {
    const input = e.target.closest('.tp-modern-range[data-adj]');
    if (!input) return;
    const obj = getActiveCanvasObject();
    if (!obj || obj.type !== 'image') return;
    const adj = getObjectAdjustments(obj);
    const key = input.dataset.adj;
    const prop = input.dataset.prop;

    if (key && prop && adj[key]) {
      const val = parseFloat(input.value);
      adj[key][prop] = val;

      // Update badge display immediately
      const badge = document.getElementById(`val-adj-${key}`);
      if (badge) badge.textContent = val;

      // Auto-enable if slider moved while disabled
      if (!adj[key].enabled) {
        adj[key].enabled = true;
        const card = input.closest('.tp-adj-card');
        if (card) {
          card.classList.add('active');
          const tBtn = card.querySelector('.tp-adj-toggle-btn');
          if (tBtn) tBtn.classList.add('active');
        }
      }

      applyAdjustments(obj);
    }
  });

  document.addEventListener('change', (e) => {
    const input = e.target.closest('.tp-modern-range[data-adj]');
    if (!input) return;
    const obj = getActiveCanvasObject();
    if (obj && window.ZineApp?.markChange) {
      window.ZineApp.markChange();
      if (window.ZineApp?.queueHistory) window.ZineApp.queueHistory(window.ZineApp.activePage());
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. PUBLIC API
  // ═══════════════════════════════════════════════════════════════

  global.ZineAdjustments = {
    initFabricFilters,
    renderSectionHTML,
    getObjectAdjustments,
    getFiltersForObject,
    applyAdjustments,
    refreshDrawerUI,
    GRADIENT_PRESETS
  };

})(typeof window !== 'undefined' ? window : this);
