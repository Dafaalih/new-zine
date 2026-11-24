/* ============================================================
   ZINE MAKER — TEXTURE OVERLAY (texture.js)
   Adds texture images from assets/overlay/ as Fabric.js
   Image objects on top with CSS blend modes and opacity control.
   ============================================================ */
(function () {
  'use strict';

  /* ── fallback catalog ── */
  const FALLBACK_TEXTURES = [
    { id: 'paper_scan',   file: 'assets/overlay/Scanned paper old vintage wrinkled minimalist white black newspaper texture overlay _ Premium Photo.jpeg', label: 'paper scan' },
    { id: 'grunge',       file: 'assets/overlay/Texturelabs_Grunge_301M.jpg',    label: 'grunge' },
    { id: 'ink_paint',    file: 'assets/overlay/Texturelabs_InkPaint_411M.jpg',   label: 'ink paint' },
    { id: 'paper_128',    file: 'assets/overlay/Texturelabs_Paper_128M.jpg',      label: 'paper light' },
    { id: 'paper_356',    file: 'assets/overlay/Texturelabs_Paper_356M.jpg',      label: 'paper dark' }
  ];

  function getTextures() {
    if (window.TEXTURE_DATA && Array.isArray(window.TEXTURE_DATA) && window.TEXTURE_DATA.length) {
      return window.TEXTURE_DATA;
    }
    return FALLBACK_TEXTURES;
  }

  /* ── blend modes (matching the Figma reference) ── */
  const BLEND_MODES = [
    { group: null,       modes: ['source-over'] },
    { group: 'darken',   modes: ['darken', 'multiply', 'color-burn'] },
    { group: 'lighten',  modes: ['lighten', 'screen', 'color-dodge'] },
    { group: 'contrast', modes: ['overlay', 'soft-light', 'hard-light'] },
    { group: 'invert',   modes: ['difference', 'exclusion'] }
  ];

  const BLEND_LABELS = {
    'source-over': 'Normal',
    'darken':      'Darken',
    'multiply':    'Multiply',
    'color-burn':  'Color burn',
    'lighten':     'Lighten',
    'screen':      'Screen',
    'color-dodge': 'Color dodge',
    'overlay':     'Overlay',
    'soft-light':  'Soft light',
    'hard-light':  'Hard light',
    'difference':  'Difference',
    'exclusion':   'Exclusion'
  };

  /* ── helpers ── */
  function getCanvas() {
    return window.ZineApp && window.ZineApp.activeCanvas ? window.ZineApp.activeCanvas() : null;
  }

  function getState() {
    return window.ZineApp && window.ZineApp.getState ? window.ZineApp.getState() : null;
  }

  function markChange() {
    if (window.ZineApp && window.ZineApp.markChange) window.ZineApp.markChange();
  }

  function toast(msg) {
    if (window.ZineApp && window.ZineApp.toast) window.ZineApp.toast(msg);
  }

  /* Find existing texture overlay on a canvas */
  function findTextureOverlay(canvas) {
    if (!canvas) return null;
    const objs = canvas.getObjects();
    for (let i = objs.length - 1; i >= 0; i--) {
      if (objs[i]._isTextureOverlay) return objs[i];
    }
    return null;
  }

  /* Robust image loader supporting base64 dataUri & local files without CORS error */
  function loadTextureImage(src) {
    return new Promise((resolve, reject) => {
      const isDataUri = typeof src === 'string' && src.startsWith('data:');
      const isFileProto = window.location.protocol === 'file:';
      const imgEl = new Image();

      if (!isDataUri && !isFileProto) {
        imgEl.crossOrigin = 'anonymous';
      }

      imgEl.onload = function () {
        if (!imgEl.width || !imgEl.height) {
          reject(new Error('Zero dimension image'));
          return;
        }
        const fImg = new fabric.Image(imgEl);
        resolve(fImg);
      };

      imgEl.onerror = function (e) {
        // Retry with fabric.Image.fromURL as fallback
        try {
          fabric.Image.fromURL(src, function (im, isError) {
            if (im && !isError) resolve(im);
            else reject(new Error('Failed to load image'));
          });
        } catch (err) {
          reject(err);
        }
      };

      imgEl.src = src;
    });
  }

  /* ── add / replace texture on the active canvas ── */
  async function applyTexture(textureDef) {
    const c = getCanvas();
    if (!c) { toast('no active canvas'); return; }
    const st = getState();
    const w = st ? st.pageW : c.width;
    const h = st ? st.pageH : c.height;

    const src = textureDef.dataUri || textureDef.file;
    if (!src) {
      toast('could not load texture');
      return;
    }

    try {
      const img = await loadTextureImage(src);

      // Remove existing texture overlay
      const existing = findTextureOverlay(c);
      let preservedBlend = 'multiply';
      let preservedOpacity = 0.5;
      if (existing) {
        preservedBlend = existing.globalCompositeOperation || 'multiply';
        preservedOpacity = existing.opacity !== undefined ? existing.opacity : 0.5;
        c.remove(existing);
      }

      // Scale to cover the entire canvas
      const scaleX = w / img.width;
      const scaleY = h / img.height;
      const scale = Math.max(scaleX, scaleY);

      img.set({
        left: w / 2,
        top: h / 2,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
        opacity: preservedOpacity,
        globalCompositeOperation: preservedBlend,
        _isTextureOverlay: true,
        _textureId: textureDef.id,
        name: 'texture-overlay'
      });

      c.add(img);
      c.bringToFront(img);
      c.requestRenderAll();
      markChange();

      // Refresh the drawer to show appearance controls
      openTextureAppearance(textureDef.id);
    } catch (err) {
      console.error('Texture load failed:', err);
      toast('could not load texture');
    }
  }

  /* ── remove texture from active canvas ── */
  function removeTexture() {
    const c = getCanvas();
    if (!c) return;
    const tex = findTextureOverlay(c);
    if (tex) {
      c.remove(tex);
      c.requestRenderAll();
      markChange();
    }
  }

  /* ── build texture chips for the drawer ── */
  function buildTextureChips(activeId) {
    let html = '';
    const list = getTextures();
    list.forEach(t => {
      const isActive = (activeId === t.id) ? ' active' : '';
      const src = t.dataUri || t.file;
      html += '<button type="button" class="texture-chip' + isActive + '" data-action="apply-texture" data-texture-id="' + t.id + '" title="' + t.label + '" aria-label="' + t.label + '">' +
        '<img src="' + src + '" alt="' + t.label + '">' +
        '<span class="texture-chip-label">' + t.label + '</span>' +
        '</button>';
    });
    return html;
  }

  /* ── build blend mode dropdown options ── */
  function buildBlendOptions(current) {
    let html = '';
    BLEND_MODES.forEach((group, gi) => {
      if (gi > 0) html += '<option disabled>──────</option>';
      group.modes.forEach(mode => {
        const label = BLEND_LABELS[mode] || mode;
        const selected = (mode === current) ? ' selected' : '';
        html += '<option value="' + mode + '"' + selected + '>' + label + '</option>';
      });
    });
    return html;
  }

  /* ── open texture picker drawer ── */
  function openTexturePicker() {
    const c = getCanvas();
    const existing = c ? findTextureOverlay(c) : null;
    const activeId = existing ? existing._textureId : null;

    const html =
      '<div class="tp-modern-header">' +
        '<span class="tp-modern-title">Texture Overlays</span>' +
        '<button type="button" class="tp-modern-close" data-action="close-drawer" title="close">✕</button>' +
      '</div>' +
      '<div class="tp-card-box">' +
        '<span class="tp-card-tag">Select Overlay</span>' +
        '<div class="texture-grid">' +
          '<button type="button" class="texture-chip texture-chip-none' + (!activeId ? ' active' : '') + '" data-action="remove-texture" title="no texture" aria-label="no texture">' +
            '<span class="texture-chip-none-icon">✕</span>' +
            '<span class="texture-chip-label">none</span>' +
          '</button>' +
          buildTextureChips(activeId) +
        '</div>' +
      '</div>';

    if (window.__openDrawer) {
      window.__openDrawer(html);
    } else {
      const d = document.getElementById('propsDrawer');
      if (d) {
        d.innerHTML = html;
        d.classList.add('open');
      }
    }

    // If a texture is already applied, show appearance controls too
    if (existing) {
      appendAppearanceControls(existing);
    }
  }

  /* ── open texture appearance panel ── */
  function openTextureAppearance(textureId) {
    const c = getCanvas();
    const existing = c ? findTextureOverlay(c) : null;

    const html =
      '<div class="tp-modern-header">' +
        '<span class="tp-modern-title">Texture Overlays</span>' +
        '<button type="button" class="tp-modern-close" data-action="close-drawer" title="close">✕</button>' +
      '</div>' +
      '<div class="tp-card-box">' +
        '<span class="tp-card-tag">Select Overlay</span>' +
        '<div class="texture-grid">' +
          '<button type="button" class="texture-chip texture-chip-none' + (!textureId ? ' active' : '') + '" data-action="remove-texture" title="no texture" aria-label="no texture">' +
            '<span class="texture-chip-none-icon">✕</span>' +
            '<span class="texture-chip-label">none</span>' +
          '</button>' +
          buildTextureChips(textureId) +
        '</div>' +
      '</div>';

    if (window.__openDrawer) {
      window.__openDrawer(html);
    } else {
      const d = document.getElementById('propsDrawer');
      if (d) {
        d.innerHTML = html;
        d.classList.add('open');
      }
    }

    if (existing) {
      appendAppearanceControls(existing);
    }
  }

  /* ── append appearance controls below texture grid ── */
  function appendAppearanceControls(texObj) {
    const d = document.getElementById('propsDrawer');
    if (!d) return;

    const currentBlend = texObj.globalCompositeOperation || 'multiply';
    const currentOpacity = Math.round((texObj.opacity !== undefined ? texObj.opacity : 0.5) * 100);

    const appearanceHTML =
      '<div class="tp-card-box texture-appearance" style="margin-top:8px">' +
        '<span class="tp-card-tag">Appearance</span>' +
        '<div class="tp-row-card" style="margin-bottom:8px">' +
          '<span class="tp-card-label">Blend Mode</span>' +
          '<div class="tp-font-dropdown-wrap">' +
            '<select class="tp-font-select texture-blend-select" data-action="texture-blend" aria-label="blend mode">' +
              buildBlendOptions(currentBlend) +
            '</select>' +
            '<svg class="tp-chevron-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>' +
          '</div>' +
        '</div>' +
        '<div class="tp-control-card" style="padding:0;background:none;border:none">' +
          '<div class="tp-card-header-row">' +
            '<span class="tp-card-label">Opacity</span>' +
            '<span class="tp-card-badge texture-opacity-val">' + currentOpacity + '%</span>' +
          '</div>' +
          '<div class="tp-slider-track-wrap">' +
            '<span class="tp-icon-a-sm" style="font-size:11px">0%</span>' +
            '<input type="range" class="tp-modern-range texture-opacity-range" min="0" max="100" step="1" value="' + currentOpacity + '" data-action="texture-opacity" aria-label="texture opacity">' +
            '<span class="tp-icon-a-lg" style="font-size:14px">100%</span>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:10px">' +
          '<button type="button" class="tp-btn-modern" data-action="remove-texture" style="width:100%">Remove Texture</button>' +
        '</div>' +
      '</div>';

    d.insertAdjacentHTML('beforeend', appearanceHTML);
  }

  /* ── bind drawer events ── */
  function bindTextureEvents() {
    const d = document.getElementById('propsDrawer');
    if (!d) return;

    d.addEventListener('click', e => {
      const applyBtn = e.target.closest('[data-action="apply-texture"]');
      if (applyBtn) {
        const texId = applyBtn.dataset.textureId;
        const list = getTextures();
        const tex = list.find(t => t.id === texId);
        if (tex) applyTexture(tex);
        return;
      }

      const removeBtn = e.target.closest('[data-action="remove-texture"]');
      if (removeBtn) {
        removeTexture();
        openTexturePicker();
        return;
      }
    });

    d.addEventListener('change', e => {
      if (e.target.classList.contains('texture-blend-select')) {
        const c = getCanvas();
        if (!c) return;
        const tex = findTextureOverlay(c);
        if (tex) {
          tex.set('globalCompositeOperation', e.target.value);
          c.requestRenderAll();
          markChange();
        }
      }
    });

    d.addEventListener('input', e => {
      if (e.target.classList.contains('texture-opacity-range')) {
        const c = getCanvas();
        if (!c) return;
        const tex = findTextureOverlay(c);
        if (tex) {
          const val = parseInt(e.target.value, 10);
          tex.set('opacity', val / 100);
          c.requestRenderAll();
          const valSpan = e.target.parentElement.querySelector('.texture-opacity-val');
          if (valSpan) valSpan.textContent = val + '%';
          markChange();
        }
      }
    });
  }

  setTimeout(bindTextureEvents, 100);

  const observer = new MutationObserver(() => {
    bindTextureEvents();
  });
  const drawerEl = document.getElementById('propsDrawer');
  if (drawerEl) {
    observer.observe(drawerEl, { childList: true });
  }

  /* ── expose to global for app.js to call ── */
  window.openTextureDrawer = openTexturePicker;

  /* ── ensure texture overlay is always on top after any object manipulation ── */
  function ensureTextureOnTop() {
    const c = getCanvas();
    if (!c) return;
    const tex = findTextureOverlay(c);
    if (tex) {
      c.bringToFront(tex);
    }
  }

  let _hookedCanvases = new WeakSet();
  function hookCanvas() {
    const c = getCanvas();
    if (!c || _hookedCanvases.has(c)) return;
    _hookedCanvases.add(c);

    c.on('object:added', () => {
      setTimeout(ensureTextureOnTop, 10);
    });
  }
  setInterval(hookCanvas, 500);

  /* ── include _isTextureOverlay and _textureId in serialization ── */
  if (window.ZineApp && window.ZineApp.TEXT_PROPS) {
    const tp = window.ZineApp.TEXT_PROPS;
    if (tp.indexOf('_isTextureOverlay') === -1) {
      tp.push('_isTextureOverlay', '_textureId');
    }
  }

  const origLoad = window.__zineOpenProject;
  if (origLoad) {
    window.__zineOpenProject = function () {
      origLoad.apply(this, arguments);
      setTimeout(fixTextureOverlays, 500);
    };
  }

  function fixTextureOverlays() {
    if (!window.ZineApp) return;
    const pages = window.ZineApp.getPages ? window.ZineApp.getPages() : [];
    pages.forEach(p => {
      if (!p || !p.canvas) return;
      p.canvas.getObjects().forEach(o => {
        if (o._isTextureOverlay) {
          o.set({
            selectable: false,
            evented: false,
            name: 'texture-overlay'
          });
          p.canvas.bringToFront(o);
        }
      });
      p.canvas.requestRenderAll();
    });
  }

})();
