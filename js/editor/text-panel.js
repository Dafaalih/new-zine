/* ============================================================
   ZINE MAKER — FIGMA-STYLE TEXT PANEL (text-panel.js)
   Floating text panel with Basics & Details tabs, custom text
   pipeline, typography controls, and full keyboard accessibility.
   ============================================================ */
(function () {
  'use strict';

  const TEXT_PROPS = [
    'rawText',
    'textCase',
    'listStyle',
    'paraSpacing',
    'truncate',
    'maxLines',
    'wrapStyle',
    'vertTrim'
  ];

  window.TEXT_PROPS = TEXT_PROPS;

  const FONT_LIST = [
    'Inter', 'Space Grotesk', 'Special Elite', 'Permanent Marker', 'Caveat',
    'Archivo Black', 'Rubik Mono One', 'DM Serif Display', 'Playfair Display',
    'Courier Prime', 'Silkscreen', 'Press Start 2P'
  ];

  const cleanFont = name => String(name || 'Inter').replace(/["']/g, '');
  const fq = name => '"' + cleanFont(name) + '"';
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  /* ============================================================
     HELPERS & CANVAS ACCESS
     ============================================================ */
  function getActiveCanvas() {
    if (window.ZineApp && window.ZineApp.activeCanvas) {
      return window.ZineApp.activeCanvas();
    }
    const stage = document.querySelector('#stage');
    if (!stage) return null;
    const activeWrap = stage.querySelector('.page-wrap:not([style*="display: none"])');
    if (activeWrap && activeWrap.querySelector('canvas')) {
      const el = activeWrap.querySelector('canvas');
      return el.__fabric || null;
    }
    return null;
  }

  function getActivePage() {
    if (window.ZineApp && window.ZineApp.activePage) {
      return window.ZineApp.activePage();
    }
    return null;
  }

  function pushHistory() {
    if (window.ZineApp && window.ZineApp.markChange) {
      window.ZineApp.markChange(getActivePage());
    }
  }

  function getPalette() {
    if (window.ZineApp && window.ZineApp.palette) {
      return window.ZineApp.palette();
    }
    return ['#000000', '#ffffff', '#000000', '#ff5c5c', '#d9dcff', '#333333'];
  }

  function getSelectedTextObjects() {
    const c = getActiveCanvas();
    if (!c) return [];
    const objs = c.getActiveObjects();
    return objs.filter(o => o && (o.type === 'textbox' || o.type === 'i-text' || o.type === 'text'));
  }

  function ensureTextbox(obj, canvas) {
    if (!obj || !canvas) return obj;
    if (obj.type === 'textbox') return obj;
    if (obj.type === 'i-text' || obj.type === 'text') {
      const rawOptions = obj.toObject(TEXT_PROPS.concat([
        'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'angle',
        'fill', 'stroke', 'strokeWidth', 'fontFamily', 'fontSize',
        'fontWeight', 'fontStyle', 'textAlign', 'charSpacing', 'lineHeight',
        'opacity', 'selectable', 'evented', 'name'
      ]));
      rawOptions.text = obj.text;
      rawOptions.width = obj.width || 300;
      const newTb = new fabric.Textbox(obj.text || '', rawOptions);
      const idx = canvas.getObjects().indexOf(obj);
      canvas.remove(obj);
      if (idx >= 0) {
        canvas.insertAt(newTb, idx, false);
      } else {
        canvas.add(newTb);
      }
      canvas.setActiveObject(newTb);
      bindTextObjectEvents(newTb);
      return newTb;
    }
    return obj;
  }

  /* ============================================================
     ONE PIPELINE FUNCTION: renderText(obj)
     ============================================================ */
  async function renderText(obj) {
    if (!obj) return;
    const canvas = obj.canvas || getActiveCanvas();

    // Ensure custom properties exist with defaults
    if (obj.rawText === undefined) obj.rawText = obj.text || '';
    if (obj.textCase === undefined) obj.textCase = 'none';
    if (obj.listStyle === undefined) obj.listStyle = 'none';
    if (obj.paraSpacing === undefined) obj.paraSpacing = 0;
    if (obj.truncate === undefined) obj.truncate = false;
    if (obj.maxLines === undefined) obj.maxLines = 3;
    if (obj.wrapStyle === undefined) obj.wrapStyle = 'auto';
    if (obj.vertTrim === undefined) obj.vertTrim = 'standard';

    // Ensure font is loaded before layout measurements
    if (document.fonts && document.fonts.load) {
      try {
        await document.fonts.load(
          `${obj.fontStyle || 'normal'} ${obj.fontWeight || 'normal'} ${obj.fontSize || 16}px ${fq(obj.fontFamily || 'Inter')}`
        );
      } catch (e) { /* ignore */ }
    }

    let text = String(obj.rawText || '');
    let styles = {};

    // 1. APPLY CASE
    let smallCapsMap = [];
    if (obj.textCase === 'upper') {
      text = text.toUpperCase();
    } else if (obj.textCase === 'lower') {
      text = text.toLowerCase();
    } else if (obj.textCase === 'title') {
      text = text.replace(/\b\w+/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
    } else if (obj.textCase === 'small') {
      for (let i = 0; i < text.length; i++) {
        const ch = text.charAt(i);
        smallCapsMap.push(ch >= 'a' && ch <= 'z');
      }
      text = text.toUpperCase();
    }

    // 2. APPLY LIST PREFIXES PER PARAGRAPH
    if (obj.listStyle === 'bullet' || obj.listStyle === 'number') {
      const paras = text.split('\n');
      let num = 1;
      text = paras.map(p => {
        if (!p.trim().length) return p;
        const prefix = obj.listStyle === 'bullet' ? '\u2022 ' : (num++) + '. ';
        return prefix + p;
      }).join('\n');
    }

    // 3. PARAGRAPH SPACING (helper spacer lines with \u200B)
    const spacingPx = Number(obj.paraSpacing) || 0;
    if (spacingPx > 0 && text.includes('\n')) {
      const paras = text.split('\n');
      const spacedParas = [];
      paras.forEach((p, idx) => {
        spacedParas.push(p);
        if (idx < paras.length - 1) {
          spacedParas.push('\u200B');
        }
      });
      text = spacedParas.join('\n');
    }

    obj.text = text;

    // Apply styles for small caps and paragraph spacing
    const lines = text.split('\n');
    const baseFontSize = Number(obj.fontSize) || 20;
    const lh = Number(obj.lineHeight) || 1.1;

    lines.forEach((lineStr, lineIdx) => {
      if (lineStr === '\u200B') {
        const spacerSize = clamp(Math.round(spacingPx / lh), 1, 300);
        if (!styles[lineIdx]) styles[lineIdx] = {};
        styles[lineIdx][0] = { fontSize: spacerSize };
      } else if (obj.textCase === 'small' && smallCapsMap.length) {
        if (!styles[lineIdx]) styles[lineIdx] = {};
        for (let c = 0; c < lineStr.length; c++) {
          if (smallCapsMap[c]) {
            styles[lineIdx][c] = { fontSize: Math.round(baseFontSize * 0.8) };
          }
        }
      }
    });

    obj.styles = styles;

    // 4. APPLY WRAP STYLE
    if (obj.wrapStyle === 'nowrap') {
      // Calculate longest line width and expand box to prevent wrapping
      let maxLineWidth = 50;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.font = `${obj.fontStyle || 'normal'} ${obj.fontWeight || 'normal'} ${baseFontSize}px ${fq(obj.fontFamily || 'Inter')}`;
        lines.forEach(l => {
          const w = ctx.measureText(l).width + (l.length * (Number(obj.charSpacing) || 0) / 1000 * baseFontSize);
          if (w > maxLineWidth) maxLineWidth = w;
        });
        ctx.restore();
      }
      obj.set('width', Math.ceil(maxLineWidth + 24));
    } else if (obj.wrapStyle === 'balance') {
      // Binary-search the narrowest width that keeps the same line count
      obj.initDimensions();
      const targetLines = (obj.textLines || []).length || 1;
      if (targetLines > 1) {
        let low = 60;
        let high = obj.width || 400;
        for (let iter = 0; iter < 12; iter++) {
          const mid = (low + high) / 2;
          obj.set('width', mid);
          obj.initDimensions();
          if ((obj.textLines || []).length <= targetLines) {
            high = mid;
          } else {
            low = mid + 1;
          }
        }
        obj.set('width', Math.ceil(high) + 4);
      }
    }

    obj.initDimensions();

    // 5. TRUNCATE TEXT WITH ELLIPSIS
    if (obj.truncate && obj.maxLines && obj.textLines && obj.textLines.length > obj.maxLines) {
      const maxL = Math.max(1, Number(obj.maxLines) || 3);
      const kept = obj.textLines.slice(0, maxL);
      let last = kept[maxL - 1] || '';
      if (last.length > 2) {
        last = last.slice(0, Math.max(1, last.length - 3)).trim() + '\u2026';
      } else {
        last = last + '\u2026';
      }
      kept[maxL - 1] = last;
      obj.text = kept.join('\n');
      obj.initDimensions();
    }

    // 6. VERTICAL TRIM
    if (obj.vertTrim === 'cap') {
      if (!obj._origCalcTextHeight) {
        obj._origCalcTextHeight = obj.calcTextHeight.bind(obj);
      }
      obj.calcTextHeight = function () {
        const fullH = this._origCalcTextHeight ? this._origCalcTextHeight() : (this.height || 40);
        // Approximation: remove font leading above cap height and below baseline (~28% of font size)
        const capTrimDelta = (Number(this.fontSize) || 20) * 0.28;
        return Math.max(12, fullH - capTrimDelta);
      };
    } else {
      if (obj._origCalcTextHeight) {
        obj.calcTextHeight = obj._origCalcTextHeight;
      }
    }

    obj.dirty = true;
    obj.setCoords();
    if (canvas) {
      canvas.requestRenderAll();
    }

    if (window.TextPanel) {
      window.TextPanel.updatePreview(obj);
    }
  }

  window.renderText = renderText;

  /* ============================================================
     BIND EDITING EVENTS FOR REAL-TIME TEXT TRANSFORMS
     ============================================================ */
  function bindTextObjectEvents(obj) {
    if (!obj || obj._hasTextPanelEvents) return;
    obj._hasTextPanelEvents = true;

    obj.on('editing:entered', () => {
      if (obj.rawText !== undefined) {
        obj.text = obj.rawText;
        obj.styles = {};
        obj.initDimensions();
        if (obj.canvas) obj.canvas.requestRenderAll();
      }
    });

    obj.on('changed', () => {
      const hasTransform = (obj.textCase && obj.textCase !== 'none') ||
                           (obj.listStyle && obj.listStyle !== 'none') ||
                           (obj.paraSpacing && Number(obj.paraSpacing) > 0) ||
                           obj.truncate;
      if (!hasTransform) {
        obj.rawText = obj.text;
      }
      if (window.TextPanel) {
        window.TextPanel.updatePreview(obj);
      }
    });

    obj.on('editing:exited', () => {
      // Strip any leftover zero-width spaces or bullet prefixes when saving rawText
      let clean = String(obj.text || '');
      clean = clean.replace(/\u200B/g, '');
      if (obj.listStyle === 'bullet') {
        clean = clean.split('\n').map(l => l.replace(/^\u2022\s?/, '')).join('\n');
      } else if (obj.listStyle === 'number') {
        clean = clean.split('\n').map(l => l.replace(/^\d+\.\s?/, '')).join('\n');
      }
      obj.rawText = clean;
      renderText(obj);
      pushHistory();
      if (window.TextPanel) {
        window.TextPanel.update();
      }
    });
  }

  /* ============================================================
     BUILD PANEL DOM
     ============================================================ */
  function createPanelDOM() {
    let panel = document.getElementById('text-panel');
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = 'text-panel';
    panel.className = 'text-panel hidden';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'text properties panel');

    panel.innerHTML = `
      <div class="tp-modern-header">
        <span class="tp-modern-title">Type</span>
        <button type="button" class="tp-modern-close" id="tp-btn-close" aria-label="close text panel">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="tp-empty-note hidden" id="tp-empty-note">
        <span>select a text to edit</span>
      </div>

      <div class="tp-body" id="tp-body">
        <!-- Live Preview Card (Text Styles Banner) -->
        <div class="tp-card-box tp-styles-card" id="tp-preview-box">
          <span class="tp-card-tag">Text Styles</span>
          <div class="tp-preview-inner">
            <span id="tp-preview-text">Custom</span>
          </div>
        </div>

        <!-- Font Row -->
        <div class="tp-card-box tp-row-card">
          <span class="tp-card-label">Font</span>
          <div class="tp-font-dropdown-wrap">
            <select id="tp-font-family" class="tp-font-select" aria-label="font family"></select>
            <svg class="tp-chevron-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>

        <!-- Format Buttons (B / I / U / S) -->
        <div class="tp-card-box tp-format-bar">
          <button type="button" class="tp-format-btn" id="tp-btn-bold" title="bold">B</button>
          <button type="button" class="tp-format-btn" id="tp-btn-italic" title="italic"><em>I</em></button>
          <button type="button" class="tp-format-btn" id="tp-btn-underline" title="underline"><span style="text-decoration:underline">U</span></button>
          <button type="button" class="tp-format-btn" id="tp-btn-strike" title="strikethrough"><span style="text-decoration:line-through">S</span></button>
        </div>

        <!-- Size Slider -->
        <div class="tp-card-box tp-control-card">
          <div class="tp-card-header-row">
            <span class="tp-card-label">Size</span>
            <span class="tp-card-badge" id="val-tp-font-size">24 px</span>
          </div>
          <div class="tp-slider-track-wrap">
            <span class="tp-icon-a-sm">A</span>
            <input type="range" min="8" max="240" step="1" value="24" id="tp-font-size" class="tp-modern-range" aria-label="font size">
            <span class="tp-icon-a-lg">A</span>
          </div>
        </div>

        <!-- Color Section -->
        <div class="tp-card-box tp-color-card">
          <div class="tp-card-header-row">
            <span class="tp-card-label">Color</span>
            <div class="tp-color-pill-wrap">
              <button type="button" class="tp-eyedropper-btn" id="tp-btn-eyedropper" title="eyedropper">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 4l6 6-2 2-2-2-7 7H5v-4l7-7-2-2 2-2zM4 20l3-1-2-2-1 3z"/>
                </svg>
              </button>
              <button type="button" class="tp-color-swatch-pill custom-color-btn" id="tp-fill-pill" data-prop="fill" title="text colour" style="background:#000000;"></button>
            </div>
          </div>
          <div class="tp-swatches-row" id="tp-color-swatches"></div>
        </div>

        <!-- Background Section -->
        <div class="tp-card-box tp-color-card">
          <div class="tp-card-header-row">
            <span class="tp-card-label">Background</span>
            <div class="tp-color-pill-wrap">
              <button type="button" class="tp-none-btn" id="tp-btn-bg-none" title="no background">none</button>
              <button type="button" class="tp-color-swatch-pill custom-color-btn" id="tp-bg-pill" data-prop="textBg" title="background colour" style="background:transparent;"></button>
            </div>
          </div>
          <div class="tp-swatches-row" id="tp-bg-swatches"></div>
          <div class="tp-sub-control" id="tp-bg-padding-row">
            <div class="tp-card-header-row" style="margin-top:8px">
              <span class="tp-sub-label">Padding</span>
              <span class="tp-card-badge" id="val-tp-bg-padding">8 px</span>
            </div>
            <input type="range" min="0" max="40" step="1" value="8" id="tp-bg-padding" class="tp-modern-range" aria-label="background padding">
          </div>
        </div>

        <!-- Outline Section -->
        <div class="tp-card-box tp-color-card">
          <div class="tp-card-header-row">
            <span class="tp-card-label">Outline</span>
            <div class="tp-color-pill-wrap">
              <button type="button" class="tp-none-btn" id="tp-btn-stroke-none" title="no outline">none</button>
              <button type="button" class="tp-color-swatch-pill custom-color-btn" id="tp-stroke-pill" data-prop="stroke" title="outline colour" style="background:transparent;"></button>
            </div>
          </div>
          <div class="tp-sub-control" id="tp-stroke-width-row">
            <div class="tp-card-header-row" style="margin-top:8px">
              <span class="tp-sub-label">Width</span>
              <span class="tp-card-badge" id="val-tp-stroke-width">0 px</span>
            </div>
            <input type="range" min="0" max="24" step="1" value="0" id="tp-stroke-width" class="tp-modern-range" aria-label="outline width">
          </div>
        </div>

        <!-- Alignment Controls -->
        <div class="tp-card-box tp-align-card">
          <div class="tp-seg-modern" data-control="textAlign">
            <button type="button" class="tp-seg-btn-modern active" data-val="left" title="align left">
              <svg width="15" height="15" viewBox="0 0 18 18" fill="currentColor"><rect x="2" y="3" width="14" height="2"/><rect x="2" y="7" width="9" height="2"/><rect x="2" y="11" width="12" height="2"/><rect x="2" y="15" width="7" height="2"/></svg>
            </button>
            <button type="button" class="tp-seg-btn-modern" data-val="center" title="align center">
              <svg width="15" height="15" viewBox="0 0 18 18" fill="currentColor"><rect x="2" y="3" width="14" height="2"/><rect x="4.5" y="7" width="9" height="2"/><rect x="3" y="11" width="12" height="2"/><rect x="5.5" y="15" width="7" height="2"/></svg>
            </button>
            <button type="button" class="tp-seg-btn-modern" data-val="right" title="align right">
              <svg width="15" height="15" viewBox="0 0 18 18" fill="currentColor"><rect x="2" y="3" width="14" height="2"/><rect x="7" y="7" width="9" height="2"/><rect x="4" y="11" width="12" height="2"/><rect x="9" y="15" width="7" height="2"/></svg>
            </button>
            <button type="button" class="tp-seg-btn-modern" data-val="justify" title="justify">
              <svg width="15" height="15" viewBox="0 0 18 18" fill="currentColor"><rect x="2" y="3" width="14" height="2"/><rect x="2" y="7" width="14" height="2"/><rect x="2" y="11" width="14" height="2"/><rect x="2" y="15" width="14" height="2"/></svg>
            </button>
          </div>
        </div>

        <!-- Spacing Stepper Section (Line Height & Letter Spacing & Opacity) -->
        <div class="tp-card-box tp-spacing-card">
          <span class="tp-card-tag" style="margin-bottom:10px;display:block">Spacing</span>
          <div class="tp-stepper-row">
            <span class="tp-stepper-label">Line Height</span>
            <div class="tp-stepper-ctrl">
              <span class="tp-stepper-val" id="val-tp-line-height">1.0</span>
              <button type="button" class="tp-stepper-btn" id="tp-lh-minus" title="decrease line height">−</button>
              <button type="button" class="tp-stepper-btn" id="tp-lh-plus" title="increase line height">+</button>
            </div>
          </div>
          <div class="tp-stepper-row" style="margin-top:10px">
            <span class="tp-stepper-label">Letter Spacing</span>
            <div class="tp-stepper-ctrl">
              <span class="tp-stepper-val" id="val-tp-char-spacing">0</span>
              <button type="button" class="tp-stepper-btn" id="tp-cs-minus" title="decrease letter spacing">−</button>
              <button type="button" class="tp-stepper-btn" id="tp-cs-plus" title="increase letter spacing">+</button>
            </div>
          </div>
          <div class="tp-stepper-row" style="margin-top:10px">
            <span class="tp-stepper-label">Opacity</span>
            <div class="tp-stepper-ctrl" style="width:120px">
              <input type="range" min="0" max="1" step="0.05" value="1" id="tp-opacity" class="tp-modern-range" style="width:75px">
              <span class="tp-stepper-val" id="val-tp-opacity" style="min-width:34px">100%</span>
            </div>
          </div>
        </div>

        <!-- Mount point for Figma-Style Effects -->
        <div id="tp-effects-mount-point"></div>
      </div>
    `;

    const editorScreen = document.querySelector('#screen-editor') || document.body;
    editorScreen.appendChild(panel);

    populateFontOptions();
    populateSwatches();
    bindPanelEvents(panel);
    return panel;
  }

  function populateFontOptions() {
    const sel = document.getElementById('tp-font-family');
    if (!sel) return;
    sel.innerHTML = FONT_LIST.map(f => `<option value="${f}">${f}</option>`).join('');
  }

  function populateSwatches() {
    const pal = getPalette();
    const cWrap = document.getElementById('tp-color-swatches');
    const sWrap = document.getElementById('tp-stroke-swatches');
    const bWrap = document.getElementById('tp-bg-swatches');

    const makeSwatches = (prop, allowNone) => {
      let html = '';
      if (allowNone) {
        html += `<button type="button" class="swatch-btn none-btn" data-prop="${prop}" data-color="none" title="no ${prop === 'textBg' ? 'background' : 'outline'}" aria-label="none"><svg viewBox="0 0 24 24" width="12" height="12" stroke="#ff4444" stroke-width="2.5"><line x1="4" y1="4" x2="20" y2="20"/></svg></button>`;
      }
      pal.forEach(c => {
        html += `<button type="button" class="swatch-btn" data-prop="${prop}" data-color="${c}" style="background:${c};" aria-label="${prop} ${c}"></button>`;
      });
      html += `<button type="button" class="swatch-btn custom-color-btn tp-color-picker-wrap" data-prop="${prop}" style="background:conic-gradient(#000000,#ffffff,#000000,#000000)" title="custom colour" aria-label="custom colour"></button>`;
      return html;
    };

    if (cWrap) cWrap.innerHTML = makeSwatches('fill', false);
    if (sWrap) sWrap.innerHTML = makeSwatches('stroke', true);
    if (bWrap) bWrap.innerHTML = makeSwatches('textBg', true);
  }

  /* ============================================================
     PANEL CONTROLS SYNC & INTERACTION
     ============================================================ */
  function syncUIFromObject(obj) {
    const panel = document.getElementById('text-panel');
    const emptyNote = document.getElementById('tp-empty-note');
    const body = document.getElementById('tp-body');
    if (!panel) return;

    if (!obj) {
      if (emptyNote) emptyNote.classList.remove('hidden');
      if (body) body.classList.add('tp-disabled');
      updatePreview(null);
      return;
    }

    if (emptyNote) emptyNote.classList.add('hidden');
    if (body) body.classList.remove('tp-disabled');

    const fxMount = document.getElementById('tp-effects-mount-point');
    if (fxMount && window.ZineEffects) {
      fxMount.innerHTML = window.ZineEffects.renderEffectsSectionHTML(obj);
    }

    // 1. Alignment
    const align = obj.textAlign || 'left';
    setSegmentActive('textAlign', align);

    // 2. Format Buttons (Bold, Italic, Underline, Strike)
    const btnBold = document.getElementById('tp-btn-bold');
    if (btnBold) btnBold.classList.toggle('active', obj.fontWeight === 'bold');
    const btnItalic = document.getElementById('tp-btn-italic');
    if (btnItalic) btnItalic.classList.toggle('active', obj.fontStyle === 'italic');
    const btnUnderline = document.getElementById('tp-btn-underline');
    if (btnUnderline) btnUnderline.classList.toggle('active', Boolean(obj.underline));
    const btnStrike = document.getElementById('tp-btn-strike');
    if (btnStrike) btnStrike.classList.toggle('active', Boolean(obj.linethrough));

    // 3. Font Family
    const ffSel = document.getElementById('tp-font-family');
    if (ffSel) ffSel.value = cleanFont(obj.fontFamily || 'Inter');

    // 4. Font Size
    const fsInput = document.getElementById('tp-font-size');
    const fsBadge = document.getElementById('val-tp-font-size');
    const fsVal = Math.round(obj.fontSize || 24);
    if (fsInput) fsInput.value = fsVal;
    if (fsBadge) fsBadge.textContent = fsVal + ' px';

    // 5. Fill Swatches & Pill
    updateSwatchActive('fill', obj.fill);
    const fillPill = document.getElementById('tp-fill-pill');
    if (fillPill) {
      if (typeof obj.fill === 'string') {
        fillPill.style.background = obj.fill;
      } else if (obj.fill && obj.fill.colorStops) {
        fillPill.style.background = 'linear-gradient(90deg, ' + obj.fill.colorStops.map(s => s.color).join(', ') + ')';
      }
    }

    // 6. Background Swatches, Pill, None button & Padding
    updateSwatchActive('textBg', obj.backgroundColor);
    const bgPill = document.getElementById('tp-bg-pill');
    const bgNoneBtn = document.getElementById('tp-btn-bg-none');
    const padInput = document.getElementById('tp-bg-padding');
    const padBadge = document.getElementById('val-tp-bg-padding');
    const padRow = document.getElementById('tp-bg-padding-row');
    const hasBg = Boolean(obj.backgroundColor && obj.backgroundColor !== 'none');
    if (bgNoneBtn) bgNoneBtn.classList.toggle('active', !hasBg);
    if (bgPill) {
      if (!hasBg) {
        bgPill.style.background = 'transparent';
      } else if (typeof obj.backgroundColor === 'string') {
        bgPill.style.background = obj.backgroundColor;
      } else if (obj.backgroundColor && obj.backgroundColor.colorStops) {
        bgPill.style.background = 'linear-gradient(90deg, ' + obj.backgroundColor.colorStops.map(s => s.color).join(', ') + ')';
      }
    }
    const padVal = Math.round(obj.padding !== undefined ? obj.padding : (hasBg ? 8 : 0));
    if (padInput) padInput.value = padVal;
    if (padBadge) padBadge.textContent = padVal + ' px';
    if (padRow) padRow.style.opacity = hasBg ? '1' : '0.45';

    // 7. Outline Swatches, Pill, None button & Stroke Width
    updateSwatchActive('stroke', obj.stroke);
    const strokePill = document.getElementById('tp-stroke-pill');
    const strokeNoneBtn = document.getElementById('tp-btn-stroke-none');
    const swInput = document.getElementById('tp-stroke-width');
    const swBadge = document.getElementById('val-tp-stroke-width');
    const swRow = document.getElementById('tp-stroke-width-row');
    const hasStroke = Boolean(obj.stroke && obj.stroke !== 'none' && obj.strokeWidth > 0);
    if (strokeNoneBtn) strokeNoneBtn.classList.toggle('active', !hasStroke);
    if (strokePill) {
      if (!hasStroke) {
        strokePill.style.background = 'transparent';
      } else if (typeof obj.stroke === 'string') {
        strokePill.style.background = obj.stroke;
      } else if (obj.stroke && obj.stroke.colorStops) {
        strokePill.style.background = 'linear-gradient(90deg, ' + obj.stroke.colorStops.map(s => s.color).join(', ') + ')';
      }
    }
    const swVal = Math.round(obj.strokeWidth || 0);
    if (swInput) swInput.value = swVal;
    if (swBadge) swBadge.textContent = swVal + ' px';
    if (swRow) swRow.style.opacity = hasStroke ? '1' : '0.45';

    // 8. Line Height
    const lhBadge = document.getElementById('val-tp-line-height');
    if (lhBadge) lhBadge.textContent = (Number(obj.lineHeight) || 1.1).toFixed(1);

    // 9. Letter Spacing (Char Spacing)
    const csBadge = document.getElementById('val-tp-char-spacing');
    if (csBadge) csBadge.textContent = Math.round(obj.charSpacing || 0);

    // 10. Opacity
    const opInput = document.getElementById('tp-opacity');
    const opBadge = document.getElementById('val-tp-opacity');
    const opVal = obj.opacity !== undefined ? Number(obj.opacity) : 1;
    if (opInput) opInput.value = opVal;
    if (opBadge) opBadge.textContent = Math.round(opVal * 100) + '%';

    updatePreview(obj);
  }

  function setSegmentActive(controlName, val) {
    const seg = document.querySelector(`.tp-seg[data-control="${controlName}"], .tp-seg-modern[data-control="${controlName}"]`);
    if (!seg) return;
    const btns = seg.querySelectorAll('.tp-seg-btn, .tp-seg-btn-modern');
    btns.forEach(b => {
      const match = val !== null && b.dataset.val === String(val);
      b.classList.toggle('active', match);
      b.setAttribute('aria-checked', String(match));
    });
  }

  function updateSwatchActive(prop, colorVal) {
    let target = 'none';
    if (colorVal) {
      if (typeof colorVal === 'string') target = colorVal.toLowerCase();
      else if (typeof colorVal === 'object' && colorVal.type) target = 'gradient';
    }
    const btns = document.querySelectorAll(`.swatch-btn[data-prop="${prop}"][data-color]`);
    btns.forEach(b => {
      b.classList.toggle('active', b.dataset.color.toLowerCase() === target);
    });
  }

  function updatePreview(obj) {
    const box = document.getElementById('tp-preview-box');
    const textEl = document.getElementById('tp-preview-text');
    if (!box || !textEl) return;

    if (!obj) {
      textEl.textContent = 'Custom';
      textEl.style.fontFamily = 'Inter, sans-serif';
      textEl.style.fontSize = '24px';
      textEl.style.fontWeight = 'bold';
      textEl.style.fontStyle = 'normal';
      textEl.style.textDecoration = 'none';
      textEl.style.color = '#ffffff';
      textEl.style.backgroundColor = 'transparent';
      textEl.style.padding = '0';
      box.style.justifyContent = 'center';
      return;
    }

    const raw = (obj.rawText || obj.text || 'Custom').slice(0, 30);
    textEl.textContent = raw || 'Custom';
    textEl.style.fontFamily = fq(obj.fontFamily || 'Inter');
    textEl.style.fontSize = Math.min(26, Math.max(14, Number(obj.fontSize) || 24)) + 'px';
    textEl.style.fontWeight = obj.fontWeight || 'normal';
    textEl.style.fontStyle = obj.fontStyle || 'normal';
    textEl.style.letterSpacing = ((Number(obj.charSpacing) || 0) / 1000) + 'em';

    let decor = [];
    if (obj.underline) decor.push('underline');
    if (obj.linethrough) decor.push('line-through');
    textEl.style.textDecoration = decor.length ? decor.join(' ') : 'none';

    if (typeof obj.fill === 'string') {
      textEl.style.color = obj.fill;
    } else {
      textEl.style.color = '#ffffff';
    }

    if (obj.backgroundColor && obj.backgroundColor !== 'none') {
      textEl.style.backgroundColor = typeof obj.backgroundColor === 'string' ? obj.backgroundColor : 'rgba(47, 10, 233, 0.4)';
      textEl.style.padding = '4px 8px';
      textEl.style.borderRadius = '4px';
    } else {
      textEl.style.backgroundColor = 'transparent';
      textEl.style.padding = '0';
    }

    const align = obj.textAlign || 'left';
    if (align === 'center') box.style.justifyContent = 'center';
    else if (align === 'right') box.style.justifyContent = 'flex-end';
    else box.style.justifyContent = 'flex-start';
  }

  /* ============================================================
     APPLYING PROPERTIES TO ALL SELECTED TEXT OBJECTS
     ============================================================ */
  async function applyTextSetting(mutator) {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    let objs = getSelectedTextObjects();
    if (!objs.length) return;

    // Convert IText to Textbox if necessary
    objs = objs.map(o => ensureTextbox(o, canvas));

    for (const o of objs) {
      mutator(o);
      await renderText(o);
    }

    canvas.requestRenderAll();
    pushHistory();
    syncUIFromObject(objs[0]);
  }

  /* ============================================================
     EVENT BINDINGS
     ============================================================ */
  function bindPanelEvents(panel) {
    // 1. Avoid clearing canvas selection when clicking panel controls
    panel.addEventListener('mousedown', e => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'OPTION') {
        return; // Allow input focus
      }
      e.preventDefault();
    });

    // Close button
    const btnClose = panel.querySelector('#tp-btn-close');
    if (btnClose) {
      btnClose.addEventListener('click', () => TextPanel.close());
    }

    // Font Family dropdown
    const ffSel = panel.querySelector('#tp-font-family');
    if (ffSel) {
      ffSel.addEventListener('change', () => {
        applyTextSetting(o => { o.fontFamily = fq(ffSel.value); });
      });
    }

    // Format buttons (Bold, Italic, Underline, Strike)
    const btnBold = panel.querySelector('#tp-btn-bold');
    if (btnBold) {
      btnBold.addEventListener('click', () => {
        applyTextSetting(o => {
          o.fontWeight = (o.fontWeight === 'bold') ? 'normal' : 'bold';
        });
      });
    }

    const btnItalic = panel.querySelector('#tp-btn-italic');
    if (btnItalic) {
      btnItalic.addEventListener('click', () => {
        applyTextSetting(o => {
          o.fontStyle = (o.fontStyle === 'italic') ? 'normal' : 'italic';
        });
      });
    }

    const btnUnderline = panel.querySelector('#tp-btn-underline');
    if (btnUnderline) {
      btnUnderline.addEventListener('click', () => {
        applyTextSetting(o => {
          o.underline = !o.underline;
        });
      });
    }

    const btnStrike = panel.querySelector('#tp-btn-strike');
    if (btnStrike) {
      btnStrike.addEventListener('click', () => {
        applyTextSetting(o => {
          o.linethrough = !o.linethrough;
        });
      });
    }

    // Font size slider
    const fsInput = panel.querySelector('#tp-font-size');
    if (fsInput) {
      fsInput.addEventListener('input', () => {
        const val = clamp(Number(fsInput.value) || 12, 8, 240);
        const badge = panel.querySelector('#val-tp-font-size');
        if (badge) badge.textContent = val + ' px';
        applyTextSetting(o => { o.fontSize = val; });
      });
    }

    // Eyedropper tool
    const eyedropperBtn = panel.querySelector('#tp-btn-eyedropper');
    if (eyedropperBtn) {
      eyedropperBtn.addEventListener('click', async () => {
        if (window.EyeDropper) {
          try {
            const eye = new window.EyeDropper();
            const res = await eye.open();
            if (res && res.sRGBHex) {
              applyTextSetting(o => { o.fill = res.sRGBHex; });
            }
          } catch (_) {}
        } else {
          const fillPill = panel.querySelector('#tp-fill-pill');
          if (fillPill) fillPill.click();
        }
      });
    }

    // Swatches (Color & Outline & TextBg)
    panel.addEventListener('click', e => {
      const sw = e.target.closest('.swatch-btn[data-color]');
      if (!sw) return;
      const prop = sw.dataset.prop;
      const col = sw.dataset.color;
      if (prop === 'fill') {
        applyTextSetting(o => { o.fill = col; });
      } else if (prop === 'stroke') {
        applyTextSetting(o => {
          if (col === 'none') {
            o.stroke = '';
            o.strokeWidth = 0;
          } else {
            o.stroke = col;
            if (!o.strokeWidth) o.strokeWidth = 2;
          }
        });
      } else if (prop === 'textBg') {
        applyTextSetting(o => {
          if (col === 'none') {
            o.backgroundColor = '';
          } else {
            o.backgroundColor = col;
            if (o.padding === undefined || o.padding === 0) o.padding = 8;
          }
        });
      }
    });

    // Background None button
    const btnBgNone = panel.querySelector('#tp-btn-bg-none');
    if (btnBgNone) {
      btnBgNone.addEventListener('click', () => {
        applyTextSetting(o => { o.backgroundColor = ''; });
      });
    }

    // Background Padding slider
    const bgPadInput = panel.querySelector('#tp-bg-padding');
    if (bgPadInput) {
      bgPadInput.addEventListener('input', () => {
        const val = clamp(Number(bgPadInput.value) || 0, 0, 40);
        const badge = panel.querySelector('#val-tp-bg-padding');
        if (badge) badge.textContent = val + ' px';
        applyTextSetting(o => { o.padding = val; });
      });
    }

    // Stroke None button
    const btnStrokeNone = panel.querySelector('#tp-btn-stroke-none');
    if (btnStrokeNone) {
      btnStrokeNone.addEventListener('click', () => {
        applyTextSetting(o => { o.stroke = ''; o.strokeWidth = 0; });
      });
    }

    // Stroke Width slider
    const swInput = panel.querySelector('#tp-stroke-width');
    if (swInput) {
      swInput.addEventListener('input', () => {
        const val = clamp(Number(swInput.value) || 0, 0, 24);
        const badge = panel.querySelector('#val-tp-stroke-width');
        if (badge) badge.textContent = val + ' px';
        applyTextSetting(o => {
          o.strokeWidth = val;
          if (val > 0 && (!o.stroke || o.stroke === 'none')) {
            o.stroke = '#ffffff';
          }
        });
      });
    }

    // Alignment Segmented Controls
    panel.querySelectorAll('.tp-seg-modern[data-control="textAlign"] .tp-seg-btn-modern, .tp-seg[data-control="textAlign"] .tp-seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        applyTextSetting(o => { o.textAlign = btn.dataset.val; });
      });
    });

    // Line Height steppers
    const lhMinus = panel.querySelector('#tp-lh-minus');
    const lhPlus = panel.querySelector('#tp-lh-plus');
    if (lhMinus) {
      lhMinus.addEventListener('click', () => {
        applyTextSetting(o => {
          const cur = Number(o.lineHeight) || 1.1;
          o.lineHeight = Math.max(0.5, Math.round((cur - 0.1) * 10) / 10);
        });
      });
    }
    if (lhPlus) {
      lhPlus.addEventListener('click', () => {
        applyTextSetting(o => {
          const cur = Number(o.lineHeight) || 1.1;
          o.lineHeight = Math.min(3.0, Math.round((cur + 0.1) * 10) / 10);
        });
      });
    }

    // Letter Spacing steppers
    const csMinus = panel.querySelector('#tp-cs-minus');
    const csPlus = panel.querySelector('#tp-cs-plus');
    if (csMinus) {
      csMinus.addEventListener('click', () => {
        applyTextSetting(o => {
          const cur = Number(o.charSpacing) || 0;
          o.charSpacing = Math.max(-50, cur - 10);
        });
      });
    }
    if (csPlus) {
      csPlus.addEventListener('click', () => {
        applyTextSetting(o => {
          const cur = Number(o.charSpacing) || 0;
          o.charSpacing = Math.min(300, cur + 10);
        });
      });
    }

    // Opacity slider
    const opInput = panel.querySelector('#tp-opacity');
    if (opInput) {
      opInput.addEventListener('input', () => {
        const val = clamp(Number(opInput.value) || 1, 0, 1);
        const badge = panel.querySelector('#val-tp-opacity');
        if (badge) badge.textContent = Math.round(val * 100) + '%';
        applyTextSetting(o => { o.opacity = val; });
      });
    }
  }

  /* ============================================================
     TEXT PANEL PUBLIC API
     ============================================================ */
  const TextPanel = {
    isOpen() {
      const p = document.getElementById('text-panel');
      return p && !p.classList.contains('hidden');
    },

    open() {
      const p = createPanelDOM();
      p.classList.remove('hidden');
      if (window.setActiveTool) window.setActiveTool('text');
      this.update();
    },

    close() {
      const p = document.getElementById('text-panel');
      if (p) p.classList.add('hidden');
      if (window.setActiveTool) window.setActiveTool('select');
    },

    toggle() {
      if (this.isOpen()) this.close();
      else this.open();
    },

    update(explicitObj) {
      createPanelDOM();
      const objs = explicitObj ? [explicitObj] : getSelectedTextObjects();
      if (objs.length) {
        bindTextObjectEvents(objs[0]);
        syncUIFromObject(objs[0]);
      } else {
        syncUIFromObject(null);
      }
    },

    updatePreview(obj) {
      updatePreview(obj);
    }
  };

  window.TextPanel = TextPanel;

  /* ============================================================
     GLOBAL HOOKS & KEYBOARD (ESCAPE, TOOLBAR, SELECTION)
     ============================================================ */
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && TextPanel.isOpen()) {
      TextPanel.close();
    }
  });

  // Listen to canvas selection events
  function hookCanvasSelection() {
    const c = getActiveCanvas();
    if (!c || c._hasTextPanelHook) return;
    c._hasTextPanelHook = true;

    c.on('selection:created', e => {
      const textObjs = getSelectedTextObjects();
      if (textObjs.length) {
        TextPanel.open();
      }
    });

    c.on('selection:updated', e => {
      const textObjs = getSelectedTextObjects();
      if (textObjs.length) {
        TextPanel.open();
      } else if (TextPanel.isOpen()) {
        TextPanel.close();
      }
    });

    c.on('selection:cleared', () => {
      if (TextPanel.isOpen()) {
        TextPanel.close();
      }
    });

    c.on('object:added', e => {
      if (e.target && (e.target.type === 'textbox' || e.target.type === 'i-text' || e.target.type === 'text')) {
        bindTextObjectEvents(e.target);
      }
    });
  }

  // Periodic hook check for newly created canvases (e.g. after screen change)
  setInterval(hookCanvasSelection, 500);

})();

