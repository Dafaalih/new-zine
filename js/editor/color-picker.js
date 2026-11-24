/* ============================================================
   ZINE MAKER — FIGMA-STYLE COLOR PICKER (color-picker.js)
   2D Saturation/Value gradient, Hue slider, Opacity slider,
   Eyedropper tool, Hex/Opacity inputs.
   + Gradient mode: Linear & Radial with multiple stops (Figma-style)
   ============================================================ */
(function () {
  'use strict';

  // ── Solid color state ──────────────────────────────────────
  let currentH = 0;
  let currentS = 1;
  let currentV = 1;
  let currentA = 1;

  // ── Mode ───────────────────────────────────────────────────
  // 'solid' | 'linear' | 'radial'
  let currentMode = 'solid';

  // ── Gradient state ─────────────────────────────────────────
  // Each stop: { offset: 0..1, color: '#rrggbb', alpha: 1 }
  let gradStops = [
    { offset: 0, color: '#000000', alpha: 1 },
    { offset: 1, color: '#ffffff', alpha: 1 }
  ];
  let activeStopIdx = 0;
  let gradAngle = 90;

  let activeCallback = null;
  let activeElement  = null;
  let activeProp     = null;

  // ═══════════════════════════════════════════════════════════
  //  COLOR MATH
  // ═══════════════════════════════════════════════════════════
  function hsvToRgb(h, s, v) {
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    let r = 0, g = 0, b = 0;
    if      (h < 60)  { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) {         g = c; b = x; }
    else if (h < 240) {         g = x; b = c; }
    else if (h < 300) { r = x;         b = c; }
    else              { r = c;         b = x; }
    return { r: Math.round((r+m)*255), g: Math.round((g+m)*255), b: Math.round((b+m)*255) };
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max, v = max;
    if (max !== min) {
      if      (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else                h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: Math.round(h) % 360, s, v };
  }

  function parseColor(str) {
    if (!str || typeof str !== 'string') return { h: 0, s: 1, v: 1, a: 1 };
    str = str.trim();
    const rgba = str.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
    if (rgba) {
      const hsv = rgbToHsv(+rgba[1], +rgba[2], +rgba[3]);
      return { h: hsv.h, s: hsv.s, v: hsv.v, a: rgba[4] !== undefined ? parseFloat(rgba[4]) : 1 };
    }
    if (str.startsWith('#')) {
      let hex = str.slice(1);
      if (hex.length === 3 || hex.length === 4) hex = hex.split('').map(c => c + c).join('');
      const r = parseInt(hex.substring(0,2),16)||0, g = parseInt(hex.substring(2,4),16)||0, b = parseInt(hex.substring(4,6),16)||0;
      const a = hex.length >= 8 ? parseInt(hex.substring(6,8),16)/255 : 1;
      return { ...rgbToHsv(r,g,b), a };
    }
    return { h: 249, s: 0.96, v: 0.91, a: 1 };
  }

  function rgbToHex(r, g, b) {
    return [r,g,b].map(n => n.toString(16).padStart(2,'0').toUpperCase()).join('');
  }

  function getFormattedSolid() {
    const rgb = hsvToRgb(currentH, currentS, currentV);
    if (currentA < 0.999)
      return `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.round(currentA*100)/100})`;
    return '#' + rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  function stopToCssColor(stop) {
    const p = parseColor(stop.color);
    const rgb = hsvToRgb(p.h, p.s, p.v);
    if ((stop.alpha ?? 1) < 0.999) return `rgba(${rgb.r},${rgb.g},${rgb.b},${stop.alpha})`;
    return stop.color;
  }

  // ═══════════════════════════════════════════════════════════
  //  GRADIENT → CSS / FABRIC
  // ═══════════════════════════════════════════════════════════
  function buildCssGradient(type, angle, stops) {
    const sorted = [...stops].sort((a,b)=>a.offset-b.offset);
    const parts  = sorted.map(s=>`${stopToCssColor(s)} ${Math.round(s.offset*100)}%`).join(', ');
    if (type === 'radial') return `radial-gradient(circle, ${parts})`;
    return `linear-gradient(${angle}deg, ${parts})`;
  }

  function buildFabricGradientForObj(type, angle, stops) {
    const sorted = [...stops].sort((a,b)=>a.offset-b.offset);
    const colorStops = sorted.map(s => ({ offset: s.offset, color: stopToCssColor(s) }));
    if (type === 'radial') {
      return new fabric.Gradient({
        type: 'radial',
        coords: { x1: 0.5, y1: 0.5, r1: 0, x2: 0.5, y2: 0.5, r2: 0.5 },
        gradientUnits: 'percentage',
        colorStops
      });
    }
    const rad = (angle - 90) * Math.PI / 180;
    return new fabric.Gradient({
      type: 'linear',
      coords: {
        x1: 0.5 - 0.5 * Math.cos(rad),
        y1: 0.5 - 0.5 * Math.sin(rad),
        x2: 0.5 + 0.5 * Math.cos(rad),
        y2: 0.5 + 0.5 * Math.sin(rad)
      },
      gradientUnits: 'percentage',
      colorStops
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  DOM CREATION
  // ═══════════════════════════════════════════════════════════
  function createPickerDOM() {
    let el = document.getElementById('figma-color-picker');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'figma-color-picker';
    el.className = 'figma-color-picker hidden';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'color picker');

    el.innerHTML = `
      <div class="fcp-mode-tabs">
        <button class="fcp-mode-tab active" data-mode="solid">Solid</button>
        <button class="fcp-mode-tab" data-mode="linear">Linear</button>
        <button class="fcp-mode-tab" data-mode="radial">Radial</button>
      </div>

      <div class="fcp-gradient-section" id="fcp-gradient-section" style="display:none">
        <div class="fcp-grad-bar-wrap">
          <div class="fcp-grad-bar" id="fcp-grad-bar">
            <div class="fcp-grad-stops" id="fcp-grad-stops"></div>
          </div>
        </div>
        <div class="fcp-grad-actions">
          <div class="fcp-angle-wrap" id="fcp-angle-wrap" style="display:none">
            <input type="number" id="fcp-angle-input" class="fcp-angle-input" min="0" max="360" value="90" aria-label="gradient angle">
            <span class="fcp-pct-symbol">°</span>
          </div>
          <button class="fcp-grad-btn" id="fcp-grad-add" title="add colour stop">+</button>
          <button class="fcp-grad-btn" id="fcp-grad-del" title="remove colour stop">−</button>
        </div>
      </div>

      <div class="fcp-sat-val" id="fcp-sat-val">
        <div class="fcp-sat-white"></div>
        <div class="fcp-val-black"></div>
        <div class="fcp-handle" id="fcp-sv-handle"></div>
      </div>

      <div class="fcp-controls-row">
        <button type="button" class="fcp-eyedropper-btn" id="fcp-eyedropper" aria-label="eyedropper" title="pick colour from screen">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 4l6 6-2 2-2-2-7 7H5v-4l7-7-2-2 2-2zM4 20l3-1-2-2-1 3z"/>
          </svg>
        </button>
        <div class="fcp-sliders-col">
          <div class="fcp-track fcp-hue-track" id="fcp-hue-track">
            <div class="fcp-slider-handle" id="fcp-hue-handle"></div>
          </div>
          <div class="fcp-track fcp-alpha-track" id="fcp-alpha-track">
            <div class="fcp-alpha-gradient" id="fcp-alpha-gradient"></div>
            <div class="fcp-slider-handle" id="fcp-alpha-handle"></div>
          </div>
        </div>
      </div>

      <div class="fcp-bottom-row">
        <div class="fcp-format-wrap">
          <button type="button" class="fcp-format-btn" id="fcp-format-btn">
            <span>Hex</span>
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9 L12 15 L18 9"/></svg>
          </button>
        </div>
        <div class="fcp-hex-wrap">
          <input type="text" class="fcp-hex-input" id="fcp-hex-input" maxlength="7" spellcheck="false" aria-label="hex color">
        </div>
        <div class="fcp-opacity-wrap">
          <input type="number" class="fcp-opacity-input" id="fcp-opacity-input" min="0" max="100" step="1" aria-label="opacity percentage">
          <span class="fcp-pct-symbol">%</span>
        </div>
      </div>
    `;

    document.body.appendChild(el);
    bindPickerEvents(el);
    return el;
  }

  // ═══════════════════════════════════════════════════════════
  //  VISUALS UPDATE
  // ═══════════════════════════════════════════════════════════
  function updateVisuals(triggerCallback) {
    if (triggerCallback === undefined) triggerCallback = true;
    const picker = document.getElementById('figma-color-picker');
    if (!picker) return;

    const rgb = hsvToRgb(currentH, currentS, currentV);
    const pureHue = hsvToRgb(currentH, 1, 1);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const alphaPct = Math.round(currentA * 100);

    const svBox = document.getElementById('fcp-sat-val');
    const svHandle = document.getElementById('fcp-sv-handle');
    if (svBox && svHandle) {
      svBox.style.backgroundColor = `rgb(${pureHue.r},${pureHue.g},${pureHue.b})`;
      svHandle.style.left = (currentS * 100) + '%';
      svHandle.style.top  = ((1 - currentV) * 100) + '%';
      svHandle.style.backgroundColor = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    }

    const hueHandle = document.getElementById('fcp-hue-handle');
    if (hueHandle) {
      hueHandle.style.left = ((currentH / 360) * 100) + '%';
      hueHandle.style.backgroundColor = `rgb(${pureHue.r},${pureHue.g},${pureHue.b})`;
    }

    const alphaGrad   = document.getElementById('fcp-alpha-gradient');
    const alphaHandle = document.getElementById('fcp-alpha-handle');
    if (alphaGrad && alphaHandle) {
      alphaGrad.style.background = `linear-gradient(to right, transparent, rgb(${rgb.r},${rgb.g},${rgb.b}))`;
      alphaHandle.style.left = (currentA * 100) + '%';
      alphaHandle.style.backgroundColor = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    }

    const hexInput = document.getElementById('fcp-hex-input');
    if (hexInput && document.activeElement !== hexInput) hexInput.value = hex;
    const opInput  = document.getElementById('fcp-opacity-input');
    if (opInput  && document.activeElement !== opInput)  opInput.value  = alphaPct;

    // Gradient: sync active stop color
    if (currentMode !== 'solid') {
      gradStops[activeStopIdx].color = '#' + hex;
      gradStops[activeStopIdx].alpha = currentA;
      renderGradientBar();
    }

    if (triggerCallback && activeCallback) activeCallback(buildOutput(), hex, currentA);
  }

  function buildOutput() {
    if (currentMode === 'solid') return getFormattedSolid();
    return JSON.stringify({
      _gradientMode: currentMode,
      stops: gradStops.map(s => ({ offset: s.offset, color: s.color, alpha: s.alpha })),
      angle: gradAngle
    });
  }

  // ── Gradient bar render ────────────────────────────────────
  function renderGradientBar() {
    const bar  = document.getElementById('fcp-grad-bar');
    const cont = document.getElementById('fcp-grad-stops');
    if (!bar || !cont) return;

    bar.style.background = buildCssGradient(currentMode, gradAngle, gradStops);

    cont.innerHTML = '';
    gradStops.forEach((s, i) => {
      const dot = document.createElement('div');
      dot.className = 'fcp-stop-dot' + (i === activeStopIdx ? ' active' : '');
      dot.style.left       = (s.offset * 100) + '%';
      dot.style.background = stopToCssColor(s);
      dot.dataset.idx = i;
      cont.appendChild(dot);
    });

    // Angle visibility
    const aw = document.getElementById('fcp-angle-wrap');
    if (aw) aw.style.display = currentMode === 'linear' ? 'flex' : 'none';
    const ai = document.getElementById('fcp-angle-input');
    if (ai && document.activeElement !== ai) ai.value = gradAngle;
  }

  function switchMode(mode) {
    currentMode = mode;
    const gradSection = document.getElementById('fcp-gradient-section');
    if (gradSection) gradSection.style.display = mode === 'solid' ? 'none' : 'block';
    document.querySelectorAll('.fcp-mode-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.mode === mode));
    if (mode !== 'solid') { loadStop(activeStopIdx); renderGradientBar(); }
    if (activeCallback) activeCallback(buildOutput(), null, currentA);
  }

  function loadStop(idx) {
    if (!gradStops[idx]) return;
    activeStopIdx = idx;
    const p = parseColor(gradStops[idx].color);
    currentH = p.h; currentS = p.s; currentV = p.v;
    currentA = gradStops[idx].alpha ?? 1;
    updateVisuals(false);
    renderGradientBar();
  }

  // ═══════════════════════════════════════════════════════════
  //  DRAGGER
  // ═══════════════════════════════════════════════════════════
  function bindDragger(element, onMove) {
    let isDragging = false;
    const handle = e => {
      const rect = element.getBoundingClientRect();
      const cx = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const cy = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      onMove(
        Math.max(0, Math.min(rect.width,  cx - rect.left)) / (rect.width  || 1),
        Math.max(0, Math.min(rect.height, cy - rect.top))  / (rect.height || 1)
      );
      updateVisuals(true);
    };
    element.addEventListener('pointerdown', e => {
      e.stopPropagation(); isDragging = true; handle(e);
      try { element.setPointerCapture(e.pointerId); } catch(_){}
    });
    element.addEventListener('pointermove', e => { if (isDragging) handle(e); });
    const stop = e => {
      if (!isDragging) return; isDragging = false;
      try { element.releasePointerCapture(e.pointerId); } catch(_){}
    };
    element.addEventListener('pointerup', stop);
    element.addEventListener('pointercancel', stop);
  }

  // ═══════════════════════════════════════════════════════════
  //  EVENT BINDING
  // ═══════════════════════════════════════════════════════════
  function bindPickerEvents(picker) {
    picker.addEventListener('pointerdown', e => e.stopPropagation());
    picker.addEventListener('mousedown',   e => e.stopPropagation());

    // Sat/Val
    const svBox = document.getElementById('fcp-sat-val');
    if (svBox) bindDragger(svBox, (nx, ny) => { currentS = nx; currentV = 1 - ny; });

    // Hue
    const hueTrack = document.getElementById('fcp-hue-track');
    if (hueTrack) bindDragger(hueTrack, nx => { currentH = Math.round(nx * 360) % 360; });

    // Alpha
    const alphaTrack = document.getElementById('fcp-alpha-track');
    if (alphaTrack) bindDragger(alphaTrack, nx => { currentA = Math.max(0, Math.min(1, nx)); });

    // Click events (tabs, stop dots, add/del buttons)
    picker.addEventListener('click', e => {
      const tab = e.target.closest('.fcp-mode-tab');
      if (tab) { switchMode(tab.dataset.mode); return; }

      const dot = e.target.closest('.fcp-stop-dot');
      if (dot) { loadStop(+dot.dataset.idx); return; }

      if (e.target.closest('#fcp-grad-add')) {
        const sorted = [...gradStops].sort((a,b) => a.offset - b.offset);
        const cur    = gradStops[activeStopIdx] || sorted[0];
        const nextOff = Math.min(1, cur.offset + 0.25);
        gradStops.push({ offset: nextOff, color: cur.color, alpha: cur.alpha });
        activeStopIdx = gradStops.length - 1;
        loadStop(activeStopIdx);
        if (activeCallback) activeCallback(buildOutput(), null, currentA);
        return;
      }

      if (e.target.closest('#fcp-grad-del')) {
        if (gradStops.length > 2) {
          gradStops.splice(activeStopIdx, 1);
          activeStopIdx = Math.max(0, activeStopIdx - 1);
          loadStop(activeStopIdx);
          if (activeCallback) activeCallback(buildOutput(), null, currentA);
        }
        return;
      }
    });

    // Gradient stop dragging
    const stopsEl = document.getElementById('fcp-grad-stops');
    const barEl   = document.getElementById('fcp-grad-bar');
    if (stopsEl && barEl) {
      let dragging = null;
      stopsEl.addEventListener('pointerdown', e => {
        const dot = e.target.closest('.fcp-stop-dot');
        if (!dot) return;
        dragging = +dot.dataset.idx;
        activeStopIdx = dragging;
        loadStop(dragging);
        try { stopsEl.setPointerCapture(e.pointerId); } catch(_){}
        e.stopPropagation();
      });
      stopsEl.addEventListener('pointermove', e => {
        if (dragging === null) return;
        const rect = barEl.getBoundingClientRect();
        gradStops[dragging].offset = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        renderGradientBar();
        if (activeCallback) activeCallback(buildOutput(), null, currentA);
      });
      stopsEl.addEventListener('pointerup', () => { dragging = null; });
    }

    // Eyedropper
    const eyedropperBtn = document.getElementById('fcp-eyedropper');
    if (eyedropperBtn) {
      eyedropperBtn.addEventListener('click', async () => {
        if (window.EyeDropper) {
          try {
            const res = await new window.EyeDropper().open();
            if (res && res.sRGBHex) {
              const p = parseColor(res.sRGBHex);
              currentH = p.h; currentS = p.s; currentV = p.v; currentA = 1;
              updateVisuals(true);
            }
          } catch(e) { /* cancelled */ }
        } else if (window.ZineApp && window.ZineApp.toast) {
          window.ZineApp.toast('eyedropper not supported in this browser');
        }
      });
    }

    // Hex input
    const hexInput = document.getElementById('fcp-hex-input');
    if (hexInput) {
      hexInput.addEventListener('input', () => {
        const val = hexInput.value.replace(/[^0-9A-Fa-f]/g,'');
        if (val.length === 6) {
          const p = parseColor('#' + val);
          currentH = p.h; currentS = p.s; currentV = p.v;
          updateVisuals(true);
        }
      });
      hexInput.addEventListener('keydown', e => { if (e.key === 'Enter') hexInput.blur(); });
    }

    // Opacity input
    const opInput = document.getElementById('fcp-opacity-input');
    if (opInput) {
      opInput.addEventListener('input', () => {
        const val = parseInt(opInput.value, 10);
        if (!isNaN(val)) { currentA = Math.max(0, Math.min(100, val)) / 100; updateVisuals(true); }
      });
      opInput.addEventListener('keydown', e => { if (e.key === 'Enter') opInput.blur(); });
    }

    // Angle input
    const angleInput = document.getElementById('fcp-angle-input');
    if (angleInput) {
      angleInput.addEventListener('input', () => {
        const v = parseInt(angleInput.value, 10);
        if (!isNaN(v)) {
          gradAngle = ((v % 360) + 360) % 360;
          renderGradientBar();
          if (activeCallback) activeCallback(buildOutput(), null, currentA);
        }
      });
    }

    // Close on outside click
    document.addEventListener('pointerdown', e => {
      const p = document.getElementById('figma-color-picker');
      if (p && !p.classList.contains('hidden') && !p.contains(e.target)) {
        if (!e.target.closest('.custom-color-btn, .swatch-btn, .tp-color-picker-wrap')) {
          FigmaColorPicker.close();
        }
      }
    });
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && FigmaColorPicker.isOpen()) FigmaColorPicker.close();
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════════════
  const FigmaColorPicker = {
    open(anchorElement, initialColor, callback, propName) {
      const picker = createPickerDOM();
      activeCallback = callback;
      activeElement  = anchorElement;
      activeProp     = propName;

      // Defaults
      currentMode   = 'solid';
      gradStops     = [
        { offset: 0, color: '#000000', alpha: 1 },
        { offset: 1, color: '#ffffff', alpha: 1 }
      ];
      activeStopIdx = 0;
      gradAngle     = 90;

      // Detect existing gradient on selected object
      const canvas = window.ZineApp && window.ZineApp.activeCanvas ? window.ZineApp.activeCanvas() : null;
      if (canvas) {
        const objs = canvas.getActiveObjects();
        if (objs.length) {
          const val = propName === 'stroke' ? objs[0].stroke : (propName === 'textBg' ? objs[0].backgroundColor : objs[0].fill);
          if (val && typeof val === 'object' && val.type) {
            // Existing Fabric gradient — load it
            currentMode = val.type === 'radial' ? 'radial' : 'linear';
            if (val.colorStops) {
              gradStops = val.colorStops.map(cs => {
                const p = parseColor(cs.color);
                const rgb = hsvToRgb(p.h, p.s, p.v);
                return {
                  offset: cs.offset,
                  color: '#' + rgbToHex(rgb.r, rgb.g, rgb.b),
                  alpha: p.a
                };
              });
            }
            if (val.type === 'linear' && val.coords) {
              const dx = (val.coords.x2||0) - (val.coords.x1||0);
              const dy = (val.coords.y2||0) - (val.coords.y1||0);
              gradAngle = Math.round((Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360)) % 360;
            }
          }
        }
      }

      // Parse initial solid color
      const col = (typeof initialColor === 'string') ? initialColor : '#000000';
      const parsed = parseColor(col);
      currentH = parsed.h; currentS = parsed.s; currentV = parsed.v;
      currentA = parsed.a !== undefined ? parsed.a : 1;

      // Update tab UI
      document.querySelectorAll('.fcp-mode-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.mode === currentMode));
      const gradSection = document.getElementById('fcp-gradient-section');
      if (gradSection) gradSection.style.display = currentMode === 'solid' ? 'none' : 'block';

      picker.classList.remove('hidden');
      updateVisuals(false);
      if (currentMode !== 'solid') renderGradientBar();

      // Position picker near anchor
      if (anchorElement) {
        const r = anchorElement.getBoundingClientRect();
        const pw = 240, ph = currentMode === 'solid' ? 310 : 395;
        let top  = r.top - ph - 10;
        if (top < 10) top = (r.bottom + ph + 10 <= window.innerHeight) ? r.bottom + 10 : Math.max(10, window.innerHeight - ph - 10);
        let left = r.left;
        if (r.left > window.innerWidth / 2) left = r.left - pw - 12;
        if (left + pw > window.innerWidth - 10) left = window.innerWidth - pw - 10;
        if (left < 10) left = 10;
        picker.style.left = Math.round(left) + 'px';
        picker.style.top  = Math.round(top)  + 'px';
      }
    },

    close() {
      const picker = document.getElementById('figma-color-picker');
      if (picker) picker.classList.add('hidden');
      activeCallback = null; activeElement = null; activeProp = null;
    },

    isOpen() {
      const picker = document.getElementById('figma-color-picker');
      return picker && !picker.classList.contains('hidden');
    }
  };

  window.FigmaColorPicker = FigmaColorPicker;
  window.buildFabricGradient = buildFabricGradientForObj;

  // ═══════════════════════════════════════════════════════════
  //  GLOBAL INTERCEPT (custom-color-btn clicks)
  // ═══════════════════════════════════════════════════════════
  document.addEventListener('click', e => {
    const customBtn = e.target.closest('.custom-color-btn, .tp-color-picker-wrap, [style*="conic-gradient"]');
    if (customBtn) {
      e.preventDefault();
      e.stopPropagation();
      const prop = customBtn.dataset.prop || (customBtn.closest('.swatches') && customBtn.closest('.swatches').dataset.prop) || 'fill';
      let curColor = '#000000';
      const canvas = window.ZineApp && window.ZineApp.activeCanvas ? window.ZineApp.activeCanvas() : null;
      if (canvas) {
        const objs = canvas.getActiveObjects();
        if (objs.length) {
          curColor = (prop === 'stroke' ? objs[0].stroke : (prop === 'textBg' ? objs[0].backgroundColor : objs[0].fill)) || '#000000';
        } else if (prop === 'bgColor') {
          curColor = (window.ZineApp && window.ZineApp.getFormat && window.ZineApp.getFormat() === 'zine8')
            ? ((window.ZineApp.getFrameBackgrounds && window.ZineApp.getFrameBackgrounds()[window.ZineApp.getActiveFrameId ? window.ZineApp.getActiveFrameId() : 'cover']) || '#ffffff')
            : (canvas.backgroundColor || '#ffffff');
        } else if (prop === 'doodleColor') {
          curColor = (window.ZineApp && window.ZineApp.getState && window.ZineApp.getState().doodleColor) || '#000000';
        }
      }
      FigmaColorPicker.open(customBtn, typeof curColor === 'string' ? curColor : '#000000', colorStr => {
        applyColorGlobally(prop, colorStr);
      }, prop);
    }
  }, true);

  // ═══════════════════════════════════════════════════════════
  //  APPLY COLOR / GRADIENT
  // ═══════════════════════════════════════════════════════════
  function applyColorGlobally(prop, colorStr) {
    const canvas = window.ZineApp && window.ZineApp.activeCanvas ? window.ZineApp.activeCanvas() : null;
    if (!canvas) return;

    if (prop === 'bgColor') {
      const colorVal = typeof colorStr === 'string' ? colorStr : '#ffffff';
      if (window.ZineApp && window.ZineApp.setBackgroundColor) {
        window.ZineApp.setBackgroundColor(colorVal, false);
      } else {
        canvas.backgroundColor = colorVal;
        canvas.requestRenderAll();
        if (window.ZineApp && window.ZineApp.markChange) window.ZineApp.markChange();
      }
      const d = document.getElementById('propsDrawer');
      if (d) {
        const pill = d.querySelector('.custom-color-btn[data-prop="bgColor"], .tp-color-swatch-pill[data-prop="bgColor"]');
        if (pill) pill.style.background = colorVal;
        if (window.ZineApp && window.ZineApp.refreshBackgroundDrawer) {
          window.ZineApp.refreshBackgroundDrawer();
        }
      }
      return;
    }

    if (prop === 'doodleColor') {
      const st = window.ZineApp && window.ZineApp.getState ? window.ZineApp.getState() : null;
      if (st) st.doodleColor = colorStr;
      if (canvas.freeDrawingBrush) canvas.freeDrawingBrush.color = colorStr;
      const d = document.getElementById('propsDrawer');
      if (d) {
        const pill = d.querySelector('.custom-color-btn[data-prop="doodleColor"]');
        if (pill) pill.style.background = colorStr;
      }
      return;
    }

    const objs = canvas.getActiveObjects();
    if (!objs.length) return;

    // Gradient?
    if (typeof colorStr === 'string' && colorStr.startsWith('{')) {
      try {
        const data = JSON.parse(colorStr);
        if (data._gradientMode) {
          objs.forEach(o => {
            const grad = buildFabricGradientForObj(data._gradientMode, data.angle, data.stops);
            if (prop === 'fill')   o.set('fill',   grad);
            if (prop === 'stroke') o.set('stroke', grad);
            if (prop === 'textBg') {
              o.set('backgroundColor', grad);
              if (!o.padding) o.set('padding', 8);
            }
            o.dirty = true; o.setCoords();
          });
          canvas.requestRenderAll();
          if (window.ZineApp && window.ZineApp.markChange) window.ZineApp.markChange();
          return;
        }
      } catch(_) {}
    }

    // Solid
    objs.forEach(o => {
      if (prop === 'fill')   o.set('fill',   colorStr);
      if (prop === 'stroke') { o.set('stroke', colorStr); if (!o.strokeWidth) o.set('strokeWidth', 2); }
      if (prop === 'textBg') {
        o.set('backgroundColor', colorStr);
        if (!o.padding) o.set('padding', 8);
      }
      if (window.renderText && (o.type === 'textbox' || o.type === 'i-text' || o.type === 'text')) window.renderText(o);
      o.dirty = true; o.setCoords();
    });

    canvas.requestRenderAll();
    if (window.ZineApp && window.ZineApp.markChange) window.ZineApp.markChange();
    if (window.TextPanel && window.TextPanel.isOpen()) window.TextPanel.update(objs[0]);

    const d = document.getElementById('propsDrawer');
    if (d) {
      const pill = d.querySelector(`.custom-color-btn[data-prop="${prop}"], .tp-color-swatch-pill[data-prop="${prop}"]`);
      if (pill) pill.style.background = typeof colorStr === 'string' ? colorStr : '#000000';
      const hexStr = typeof colorStr === 'string' ? colorStr.toLowerCase() : '';
      d.querySelectorAll(`.canva-swatch[data-prop="${prop}"]`).forEach(b => {
        b.classList.toggle('active', (b.dataset.color || '').toLowerCase() === hexStr);
      });
    }
  }

})();
