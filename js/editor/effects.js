/**
 * ZINE MAKER — FIGMA-STYLE EFFECTS ENGINE & POPOVER (effects.js)
 * Supports Drop shadow, Inner shadow, Layer blur (Uniform & Progressive), Background blur,
 * Noise, Texture (Rough / Deckled Edge), and Glass.
 */
(function (root) {
  'use strict';

  const EFFECT_DEFS = {
    'inner-shadow': {
      id: 'inner-shadow',
      name: 'Inner shadow',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 7h10M7 7v10" stroke-width="2.5" stroke-linecap="round"/></svg>`,
      defaults: { x: 0, y: 4, blur: 4, spread: 0, color: '#000000', opacity: 25, enabled: true }
    },
    'drop-shadow': {
      id: 'drop-shadow',
      name: 'Drop shadow',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="13" height="13" rx="3"/><rect x="3" y="3" width="13" height="13" rx="3" fill="currentColor" fill-opacity="0.25"/></svg>`,
      defaults: { x: 0, y: 4, blur: 4, spread: 0, color: '#000000', opacity: 25, enabled: true }
    },
    'layer-blur': {
      id: 'layer-blur',
      name: 'Layer blur',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="4" r="1.5"/><circle cx="12" cy="4" r="1.5"/><circle cx="20" cy="4" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/><circle cx="4" cy="20" r="1.5"/><circle cx="12" cy="20" r="1.5"/><circle cx="20" cy="20" r="1.5"/></svg>`,
      defaults: { blur: 8, blurMode: 'uniform', startBlur: 0, endBlur: 4, enabled: true }
    },
    'background-blur': {
      id: 'background-blur',
      name: 'Background blur',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="12" r="1" fill="currentColor"/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="12" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/></svg>`,
      defaults: { blur: 12, enabled: true }
    },
    'noise': {
      id: 'noise',
      name: 'Noise',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 8h.01M12 7h.01M17 9h.01M8 12h.01M13 13h.01M16 14h.01M9 17h.01M14 16h.01M11 10h.01M15 11h.01" stroke-width="2.5" stroke-linecap="round"/></svg>`,
      defaults: { amount: 25, enabled: true }
    },
    'texture': {
      id: 'texture',
      name: 'Texture',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>`,
      defaults: { sizeX: 8.4, sizeY: 8.4, radius: 4, clipToShape: false, enabled: true }
    },
    'glass': {
      id: 'glass',
      name: 'Glass',
      icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 9 9" stroke-width="2.5"/></svg>`,
      defaults: { blur: 8, tint: '#ffffff', opacity: 25, enabled: true }
    }
  };

  let activeTargetObject = null;
  let activeEditingEffectKey = null;
  let menuContainer = null;
  let popoverContainer = null;
  let _cachedNoisePattern = null;

  function isTextObject(obj) {
    if (!obj) return false;
    return obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text' || (typeof obj.text === 'string');
  }

  function hexToRgba(hex, alphaPercent) {
    let clean = (hex || '#000000').replace('#', '');
    if (clean.length === 3) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    const r = parseInt(clean.substring(0, 2), 16) || 0;
    const g = parseInt(clean.substring(2, 4), 16) || 0;
    const b = parseInt(clean.substring(4, 6), 16) || 0;
    const a = Math.max(0, Math.min(1, (parseFloat(alphaPercent) || 0) / 100));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function getActiveCanvasObject() {
    const c = (window.ZineApp && window.ZineApp.activeCanvas && window.ZineApp.activeCanvas()) ||
              (window.ZineMaker && window.ZineMaker.activeCanvas && window.ZineMaker.activeCanvas());
    return c ? c.getActiveObject() : null;
  }

  function getObjectEffects(obj) {
    if (!obj) return [];
    if (!obj._effectsList) obj._effectsList = [];
    return obj._effectsList;
  }

  /* ============================================================
     TEXTURE NOISE / ROUGH DECKLED EDGE GENERATOR (Figma-Style)
     ============================================================ */
  function getRoughNoise(seed, t) {
    const s1 = Math.sin(t * 0.85 + seed * 1.33) * 0.45;
    const s2 = Math.sin(t * 1.95 + seed * 2.71) * 0.30;
    const s3 = Math.sin(t * 4.41 + seed * 5.17) * 0.15;
    const s4 = Math.sin(t * 9.23 + seed * 7.39) * 0.10;
    return s1 + s2 + s3 + s4;
  }

  function traceTexturedPathRaw(ctx, obj, texEff) {
    const w = obj.width || 100;
    const h = obj.height || 100;
    const sizeX = Math.max(2, parseFloat(texEff.sizeX) || 8.4);
    const sizeY = Math.max(2, parseFloat(texEff.sizeY) || 8.4);
    const radius = Math.max(0, parseFloat(texEff.radius) ?? 4);
    const clipToShape = !!texEff.clipToShape;
    const seed = ((obj.left || 0) * 3 + (obj.top || 0) * 7 + (obj.width || 0)) % 1000 + 13;

    if (obj.type === 'circle') {
      const baseR = obj.radius || w / 2;
      const steps = Math.max(16, Math.round((2 * Math.PI * baseR) / sizeX));
      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * 2 * Math.PI;
        let disp = getRoughNoise(seed, theta * 4.5) * radius;
        if (clipToShape && disp > 0) disp = 0;
        const r = baseR + disp;
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      return;
    }

    // Default: Rect / Polygon / Image rough boundary
    const halfW = w / 2;
    const halfH = h / 2;

    // Top edge: -halfW to halfW, y = -halfH
    let first = true;
    for (let x = -halfW; x <= halfW; x += sizeX) {
      let disp = getRoughNoise(seed, x * 0.18) * radius;
      if (clipToShape && disp < 0) disp = 0;
      const y = -halfH + disp;
      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Right edge: -halfH to halfH, x = halfW
    for (let y = -halfH; y <= halfH; y += sizeY) {
      let disp = getRoughNoise(seed + 15, y * 0.18) * radius;
      if (clipToShape && disp > 0) disp = 0;
      const x = halfW + disp;
      ctx.lineTo(x, y);
    }

    // Bottom edge: halfW to -halfW, y = halfH
    for (let x = halfW; x >= -halfW; x -= sizeX) {
      let disp = getRoughNoise(seed + 30, x * 0.18) * radius;
      if (clipToShape && disp > 0) disp = 0;
      const y = halfH + disp;
      ctx.lineTo(x, y);
    }

    // Left edge: halfH to -halfH, x = -halfW
    for (let y = halfH; y >= -halfH; y -= sizeY) {
      let disp = getRoughNoise(seed + 45, y * 0.18) * radius;
      if (clipToShape && disp < 0) disp = 0;
      const x = -halfW + disp;
      ctx.lineTo(x, y);
    }

    ctx.closePath();
  }

  function traceObjectPathRaw(ctx, obj) {
    // If texture effect is active (and not text), trace the rough deckled path!
    if (!isTextObject(obj)) {
      const tex = obj._effectsList?.find(e => e.id === 'texture' && e.enabled);
      if (tex) {
        traceTexturedPathRaw(ctx, obj, tex);
        return;
      }
    }

    const w = obj.width || 0;
    const h = obj.height || 0;

    if (obj.type === 'circle') {
      ctx.arc(0, 0, obj.radius || w / 2, 0, Math.PI * 2);
    } else if (obj.type === 'triangle') {
      ctx.moveTo(-w / 2, h / 2);
      ctx.lineTo(0, -h / 2);
      ctx.lineTo(w / 2, h / 2);
      ctx.closePath();
    } else if (obj.type === 'polygon' && obj.points && obj.points.length) {
      const pts = obj.points;
      const offX = w / 2;
      const offY = h / 2;
      ctx.moveTo(pts[0].x - offX, pts[0].y - offY);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x - offX, pts[i].y - offY);
      }
      ctx.closePath();
    } else if (obj.type === 'path' && typeof obj._setPathToCtx === 'function') {
      obj._setPathToCtx(ctx);
    } else if (obj.type === 'rect' && (obj.rx || obj.ry)) {
      const rx = Math.min(obj.rx || 0, w / 2);
      const ry = Math.min(obj.ry || 0, h / 2);
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-w / 2, -h / 2, w, h, [rx, ry]);
      } else {
        ctx.rect(-w / 2, -h / 2, w, h);
      }
    } else {
      ctx.rect(-w / 2, -h / 2, w, h);
    }
  }

  /* ============================================================
     AUTHENTIC FIGMA INNER SHADOW (Inverted Mask Hole Shadow)
     ============================================================ */
  function renderInnerShadow(ctx, obj, eff) {
    if (!eff || !eff.enabled) return;
    const w = obj.width || 100;
    const h = obj.height || 100;
    const blur = Math.max(0, eff.blur ?? 4);
    const spread = Math.max(0, eff.spread ?? 0);
    const offsetX = eff.x ?? 0;
    const offsetY = eff.y ?? 4;
    const shadowColor = hexToRgba(eff.color || '#000000', eff.opacity ?? 25);

    ctx.save();
    // 1. Clip strictly to the shape boundary so shadow never spills outside
    ctx.beginPath();
    traceObjectPathRaw(ctx, obj);
    ctx.clip();

    // 2. Set shadow properties
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = blur + spread;
    ctx.shadowOffsetX = offsetX;
    ctx.shadowOffsetY = offsetY;

    // 3. Draw outer mask containing inner shape hole using even-odd rule
    const pad = Math.max(150, (blur + spread) * 4 + 150);
    ctx.beginPath();
    ctx.rect(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2);
    traceObjectPathRaw(ctx, obj);
    ctx.fillStyle = '#000000';
    ctx.fill('evenodd');

    // 4. Spread stroke if spread > 0
    if (spread > 0) {
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = shadowColor;
      ctx.lineWidth = spread * 1.5;
      ctx.beginPath();
      traceObjectPathRaw(ctx, obj);
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ============================================================
     PROGRESSIVE BLUR LAYER ENGINE (Gradient Blur)
     ============================================================ */
  function renderProgressiveBlurLayer(ctx, obj, blurEff) {
    const bStart = Math.max(0, blurEff.startBlur ?? 0);
    const bEnd = Math.max(0, blurEff.endBlur ?? 4);

    if (bStart === 0 && bEnd === 0) {
      obj._orig_top_render(ctx);
      return;
    }

    if (bStart === bEnd) {
      const prevFilter = ctx.filter;
      ctx.filter = `blur(${bStart}px)`;
      obj._orig_top_render(ctx);
      ctx.filter = prevFilter || 'none';
      return;
    }

    const w = obj.width || 100;
    const h = obj.height || 100;
    const maxB = Math.max(bStart, bEnd);
    const pad = Math.ceil(maxB * 2.5 + 40);

    // Offscreen canvas for base unblurred rendering
    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = Math.ceil(w + pad * 2);
    baseCanvas.height = Math.ceil(h + pad * 2);
    const baseCtx = baseCanvas.getContext('2d');
    baseCtx.translate(pad + w / 2, pad + h / 2);
    obj._orig_render(baseCtx);

    // 1. Base pass: bStart blur
    ctx.save();
    if (bStart > 0) ctx.filter = `blur(${bStart}px)`;
    ctx.drawImage(baseCanvas, -pad - w / 2, -pad - h / 2);
    ctx.restore();

    // 2. End pass: bEnd blur masked with linear gradient from top to bottom
    const endCanvas = document.createElement('canvas');
    endCanvas.width = baseCanvas.width;
    endCanvas.height = baseCanvas.height;
    const endCtx = endCanvas.getContext('2d');

    if (bEnd > 0) endCtx.filter = `blur(${bEnd}px)`;
    endCtx.drawImage(baseCanvas, 0, 0);

    // Linear alpha gradient mask
    endCtx.filter = 'none';
    endCtx.globalCompositeOperation = 'destination-in';
    const grad = endCtx.createLinearGradient(0, pad, 0, pad + h);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 1)');
    endCtx.fillStyle = grad;
    endCtx.fillRect(0, 0, endCanvas.width, endCanvas.height);

    // Composite masked blurred end pass
    ctx.save();
    ctx.drawImage(endCanvas, -pad - w / 2, -pad - h / 2);
    ctx.restore();
  }

  function getNoisePattern(ctx) {
    if (!_cachedNoisePattern) {
      const ncv = document.createElement('canvas');
      ncv.width = 128;
      ncv.height = 128;
      const nctx = ncv.getContext('2d');
      const idata = nctx.createImageData(128, 128);
      const d = idata.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.floor(Math.random() * 255);
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = 45;
      }
      nctx.putImageData(idata, 0, 0);
      _cachedNoisePattern = ctx.createPattern(ncv, 'repeat');
    }
    return _cachedNoisePattern;
  }

  function renderNoise(ctx, obj, eff) {
    if (!eff || !eff.enabled) return;
    const w = obj.width || 100;
    const h = obj.height || 100;
    const amount = Math.max(0, Math.min(100, eff.amount ?? 25));
    if (amount <= 0) return;

    ctx.save();
    ctx.beginPath();
    traceObjectPathRaw(ctx, obj);
    ctx.clip();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = amount / 100;
    ctx.fillStyle = getNoisePattern(ctx);
    ctx.fillRect(-w / 2 - 20, -h / 2 - 20, w + 40, h + 40);
    ctx.restore();
  }

  function renderGlass(ctx, obj, eff) {
    if (!eff || !eff.enabled) return;
    const w = obj.width || 100;
    const h = obj.height || 100;
    const tint = eff.tint || '#ffffff';
    const opacity = (eff.opacity ?? 25) / 100;

    ctx.save();
    ctx.beginPath();
    traceObjectPathRaw(ctx, obj);
    ctx.clip();

    // 1. Frosted glass tint gradient
    const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    grad.addColorStop(0, hexToRgba(tint, opacity * 100 * 1.5));
    grad.addColorStop(1, hexToRgba(tint, opacity * 100 * 0.3));
    ctx.fillStyle = grad;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // 2. Specular rim highlight (top-left gloss)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    traceObjectPathRaw(ctx, obj);
    ctx.stroke();

    // 3. Diagonal light reflection sheen
    const sheenGrad = ctx.createLinearGradient(-w / 2, -h / 2, 0, 0);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    sheenGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.05)');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(-w / 2, -h / 2, w, h / 2);

    ctx.restore();
  }

  function renderBackgroundBlur(ctx, obj, eff) {
    if (!eff || !eff.enabled) return;
    const w = obj.width || 100;
    const h = obj.height || 100;
    const blur = Math.max(0, eff.blur ?? 12);
    if (blur <= 0) return;

    ctx.save();
    ctx.beginPath();
    traceObjectPathRaw(ctx, obj);
    ctx.clip();

    const canvas = obj.canvas || (window.ZineApp && window.ZineApp.activeCanvas && window.ZineApp.activeCanvas());
    let sampled = false;
    if (canvas && canvas.lowerCanvasEl && typeof obj.calcTransformMatrix === 'function' && typeof fabric !== 'undefined') {
      try {
        const m = obj.calcTransformMatrix();
        const inv = fabric.util.invertTransform(m);
        ctx.save();
        ctx.filter = `blur(${blur}px)`;
        ctx.transform(inv[0], inv[1], inv[2], inv[3], inv[4], inv[5]);
        ctx.drawImage(canvas.lowerCanvasEl, 0, 0);
        ctx.restore();
        sampled = true;
      } catch (e) {
        sampled = false;
      }
    }

    ctx.fillStyle = sampled ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(-w / 2, -h / 2, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    traceObjectPathRaw(ctx, obj);
    ctx.stroke();

    ctx.restore();
  }

  function hookObjectRendering(obj) {
    if (!obj || obj._zineEffectsHooked) return;
    obj._zineEffectsHooked = true;

    // 1. Hook _render
    const origRender = obj._render;
    obj._orig_render = origRender;

    obj._render = function (ctx) {
      const effects = this._effectsList;
      if (!effects || !effects.length) {
        this._orig_render(ctx);
        return;
      }

      // Pre-render effect: Background Blur
      const bgBlur = effects.find(e => e.id === 'background-blur' && e.enabled);
      if (bgBlur) {
        renderBackgroundBlur(ctx, this, bgBlur);
      }

      // Texture Deckled Edge Shape Render (only for non-text)
      const tex = !isTextObject(this) && effects.find(e => e.id === 'texture' && e.enabled);
      if (tex && this.type !== 'image') {
        ctx.save();
        ctx.beginPath();
        traceTexturedPathRaw(ctx, this, tex);
        if (this.fill && this.fill !== 'transparent') {
          ctx.fillStyle = this.fill;
          ctx.fill();
        }
        if (this.stroke && this.strokeWidth > 0) {
          ctx.strokeStyle = this.stroke;
          ctx.lineWidth = this.strokeWidth;
          ctx.stroke();
        }
        ctx.restore();
      } else {
        if (tex && this.type === 'image') {
          ctx.save();
          ctx.beginPath();
          traceTexturedPathRaw(ctx, this, tex);
          ctx.clip();
          this._orig_render(ctx);
          ctx.restore();
        } else {
          this._orig_render(ctx);
        }
      }

      // Post-render effects inside shape:
      const inner = effects.find(e => e.id === 'inner-shadow' && e.enabled);
      if (inner) renderInnerShadow(ctx, this, inner);

      const noise = effects.find(e => e.id === 'noise' && e.enabled);
      if (noise) renderNoise(ctx, this, noise);

      const glass = effects.find(e => e.id === 'glass' && e.enabled);
      if (glass) renderGlass(ctx, this, glass);
    };

    // 2. Hook top-level render for Layer Blur (Uniform & Progressive)
    const origTopRender = obj.render;
    obj._orig_top_render = origTopRender;

    obj.render = function (ctx) {
      const effects = this._effectsList;
      const blur = effects?.find(e => e.id === 'layer-blur' && e.enabled);
      if (blur) {
        if (blur.blurMode === 'progressive') {
          renderProgressiveBlurLayer(ctx, this, blur);
          return;
        } else if (blur.blur > 0) {
          const prevFilter = ctx.filter;
          ctx.filter = `blur(${blur.blur}px)`;
          this._orig_top_render(ctx);
          ctx.filter = prevFilter || 'none';
          return;
        }
      }
      this._orig_top_render(ctx);
    };
  }

  function applyEffects(obj) {
    if (!obj) return;
    hookObjectRendering(obj);
    const effects = getObjectEffects(obj);

    // 1. Drop shadow
    const drop = effects.find(e => e.id === 'drop-shadow' && e.enabled);
    if (drop) {
      const shadowColor = hexToRgba(drop.color, drop.opacity);
      obj.set('shadow', new fabric.Shadow({
        color: shadowColor,
        blur: Math.max(0, (drop.blur || 0) + (drop.spread || 0)),
        offsetX: drop.x || 0,
        offsetY: drop.y || 0
      }));
    } else {
      obj.set('shadow', null);
    }

    // 2. Object caching: disable caching if blur, inner shadow or texture is active
    const needsDynamicRender = effects.some(e => e.enabled && (e.id === 'layer-blur' || e.id === 'background-blur' || e.id === 'inner-shadow' || e.id === 'texture'));
    if (needsDynamicRender) {
      obj.objectCaching = false;
      const blurEff = effects.find(e => e.enabled && (e.id === 'layer-blur' || e.id === 'background-blur'));
      if (blurEff) {
        const b = blurEff.blurMode === 'progressive' ? Math.max(blurEff.startBlur || 0, blurEff.endBlur || 4) : (blurEff.blur || 8);
        obj.padding = Math.max(obj.padding || 0, b * 1.5);
      }
    } else {
      obj.objectCaching = true;
    }

    // 3. Image specific filters if image
    if (obj.type === 'image' && typeof fabric !== 'undefined' && fabric.Image && fabric.Image.filters) {
      const newFilters = [];
      const blurEff = effects.find(e => e.id === 'layer-blur' && e.enabled);
      if (blurEff && blurEff.blurMode !== 'progressive' && fabric.Image.filters.Blur) {
        newFilters.push(new fabric.Image.filters.Blur({ blur: Math.min(1, (blurEff.blur || 8) / 30) }));
      }
      const noiseEff = effects.find(e => e.id === 'noise' && e.enabled);
      if (noiseEff && fabric.Image.filters.Noise) {
        newFilters.push(new fabric.Image.filters.Noise({ noise: Math.min(700, (noiseEff.amount || 25) * 6) }));
      }
      const adjFilters = (window.ZineAdjustments && window.ZineAdjustments.getFiltersForObject)
        ? window.ZineAdjustments.getFiltersForObject(obj)
        : [];
      obj.filters = [...adjFilters, ...newFilters];
      if (obj.applyFilters) obj.applyFilters();
    }

    obj.dirty = true;
    const c = obj.canvas || (window.ZineApp && window.ZineApp.activeCanvas && window.ZineApp.activeCanvas()) ||
              (window.ZineMaker && window.ZineMaker.activeCanvas && window.ZineMaker.activeCanvas());
    if (c) c.requestRenderAll();
  }

  /* ============================================================
     UI RENDERING & DIRECT DOM REFRESH
     ============================================================ */
  function renderEffectRowHTML(eff, index) {
    const def = EFFECT_DEFS[eff.id] || { name: eff.id, icon: '' };
    const eyeActive = eff.enabled !== false;
    return `
      <div class="tp-effect-row" data-index="${index}" data-id="${eff.id}">
        <button type="button" class="tp-effect-eye-btn ${eyeActive ? 'active' : ''}" data-action="toggle-eye" title="Toggle visibility">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${eyeActive 
              ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
              : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'}
          </svg>
        </button>
        <div class="tp-effect-info-btn" data-action="edit-effect" title="Configure effect">
          <span class="tp-effect-row-icon">${def.icon}</span>
          <span class="tp-effect-row-name">${def.name}</span>
        </div>
        <button type="button" class="tp-effect-del-btn" data-action="delete-effect" title="Remove effect">✕</button>
      </div>
    `;
  }

  function updateEffectsListDOM(obj) {
    const listEl = document.getElementById('tp-effects-list');
    if (!listEl) return;
    const effects = getObjectEffects(obj);
    if (effects.length === 0) {
      listEl.innerHTML = `
        <div class="tp-effects-empty" id="tp-effects-empty">
          <span class="tp-effects-empty-text">No effects applied</span>
        </div>
      `;
    } else {
      listEl.innerHTML = effects.map((eff, index) => renderEffectRowHTML(eff, index)).join('');
    }
  }

  function renderEffectsSectionHTML(obj) {
    if (!obj) return '';
    activeTargetObject = obj;
    const effects = getObjectEffects(obj);

    let listHTML = '';
    if (effects.length === 0) {
      listHTML = `
        <div class="tp-effects-empty" id="tp-effects-empty">
          <span class="tp-effects-empty-text">No effects applied</span>
        </div>
      `;
    } else {
      listHTML = effects.map((eff, index) => renderEffectRowHTML(eff, index)).join('');
    }

    return `
      <div class="tp-card-box tp-effects-card-container">
        <div class="tp-card-header-row" style="margin-bottom:6px;">
          <span class="tp-card-label" style="font-weight:700;display:flex;align-items:center;gap:6px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 9 9"/></svg>
            Effects
          </span>
          <button type="button" class="tp-btn-add-effect" id="tp-btn-add-effect" title="Add Effect">+</button>
        </div>
        <div class="tp-effects-list" id="tp-effects-list">
          ${listHTML}
        </div>
      </div>
    `;
  }

  function closeAllMenus() {
    if (menuContainer) {
      menuContainer.remove();
      menuContainer = null;
    }
    if (popoverContainer) {
      popoverContainer.remove();
      popoverContainer = null;
    }
  }

  function openEffectsMenu(anchorBtn, obj) {
    closeAllMenus();
    activeTargetObject = obj;

    const menu = document.createElement('div');
    menu.className = 'figma-effects-dropdown-menu';
    menu.id = 'figma-effects-dropdown-menu';

    let html = '';
    // If text object, remove 'texture' from effects list
    const isText = isTextObject(obj);
    const keys = Object.keys(EFFECT_DEFS).filter(k => !(k === 'texture' && isText));

    keys.forEach((key) => {
      const item = EFFECT_DEFS[key];
      html += `
        <div class="figma-menu-item" data-id="${item.id}">
          <span class="figma-item-icon">${item.icon}</span>
          <span class="figma-item-label">${item.name}</span>
          ${item.badge ? `<span class="figma-item-badge">${item.badge}</span>` : ''}
        </div>
      `;
    });

    menu.innerHTML = html;
    document.body.appendChild(menu);
    menuContainer = menu;

    // Position menu near button
    const rect = anchorBtn.getBoundingClientRect();
    let left = rect.left - 210;
    if (left < 10) left = rect.right + 10;
    let top = rect.bottom + 6;
    if (top + 360 > window.innerHeight) top = window.innerHeight - 370;

    menu.style.left = `${Math.max(10, Math.round(left))}px`;
    menu.style.top = `${Math.max(10, Math.round(top))}px`;

    menu.querySelectorAll('.figma-menu-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.id;
        addEffectToObject(obj, id);
        closeAllMenus();
      });
    });

    setTimeout(() => {
      window.addEventListener('click', onWindowClick);
    }, 10);
  }

  function onWindowClick(e) {
    if (menuContainer && !menuContainer.contains(e.target) && !e.target.closest('#tp-btn-add-effect')) {
      if (menuContainer) {
        menuContainer.remove();
        menuContainer = null;
      }
    }
    if (popoverContainer && !popoverContainer.contains(e.target) && !e.target.closest('.tp-effect-row') && !e.target.closest('.figma-effects-dropdown-menu')) {
      if (popoverContainer) {
        popoverContainer.remove();
        popoverContainer = null;
      }
    }
    if (!menuContainer && !popoverContainer) {
      window.removeEventListener('click', onWindowClick);
    }
  }

  function addEffectToObject(obj, effectId) {
    if (!obj) return;
    const def = EFFECT_DEFS[effectId];
    if (!def) return;
    const effects = getObjectEffects(obj);
    const newEff = JSON.parse(JSON.stringify(def.defaults));
    newEff.id = effectId;
    effects.push(newEff);

    applyEffects(obj);
    updateEffectsListDOM(obj);
    refreshDrawer();
    openEffectConfigPopover(document.querySelector('.tp-effects-card-container') || document.body, obj, effects.length - 1);
  }

  function openEffectConfigPopover(anchorEl, obj, effectIndex) {
    if (menuContainer) {
      menuContainer.remove();
      menuContainer = null;
    }
    if (popoverContainer) {
      popoverContainer.remove();
      popoverContainer = null;
    }

    activeTargetObject = obj;
    activeEditingEffectKey = effectIndex;
    const effects = getObjectEffects(obj);
    const eff = effects[effectIndex];
    if (!eff) return;
    const def = EFFECT_DEFS[eff.id] || { name: eff.id, icon: '' };

    const popover = document.createElement('div');
    popover.className = 'figma-effect-config-popover';
    popover.id = 'figma-effect-config-popover';

    const isShadow = eff.id === 'inner-shadow' || eff.id === 'drop-shadow';
    const isBlur = eff.id === 'layer-blur' || eff.id === 'background-blur';
    const isLayerBlur = eff.id === 'layer-blur';
    const isNoise = eff.id === 'noise';
    const isTexture = eff.id === 'texture';
    const isGlass = eff.id === 'glass';

    let controlsHTML = '';
    if (isShadow) {
      controlsHTML = `
        <div class="fec-row">
          <span class="fec-label">Position</span>
          <div class="fec-inputs-pair">
            <div class="fec-input-box">
              <span class="fec-prefix">X</span>
              <input type="number" class="fec-number-input" data-prop="x" value="${eff.x ?? 0}">
            </div>
            <div class="fec-input-box">
              <span class="fec-prefix">Y</span>
              <input type="number" class="fec-number-input" data-prop="y" value="${eff.y ?? 4}">
            </div>
          </div>
        </div>

        <div class="fec-row">
          <span class="fec-label">Blur</span>
          <div class="fec-input-box fec-full-box">
            <span class="fec-prefix-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="4" r="1.5"/><circle cx="12" cy="4" r="1.5"/><circle cx="20" cy="4" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/><circle cx="4" cy="20" r="1.5"/><circle cx="12" cy="20" r="1.5"/><circle cx="20" cy="20" r="1.5"/></svg>
            </span>
            <input type="number" min="0" max="100" class="fec-number-input" data-prop="blur" value="${eff.blur ?? 4}">
          </div>
        </div>

        <div class="fec-row">
          <span class="fec-label">Spread</span>
          <div class="fec-input-box fec-full-box">
            <span class="fec-prefix-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            </span>
            <input type="number" min="0" max="50" class="fec-number-input" data-prop="spread" value="${eff.spread ?? 0}">
          </div>
        </div>

        <div class="fec-row">
          <span class="fec-label">Color</span>
          <div class="fec-color-combo-box">
            <label class="fec-swatch-wrap" title="Change color">
              <input type="color" class="fec-color-picker-input" data-prop="color" value="${eff.color || '#000000'}">
              <span class="fec-swatch-preview" style="background-color:${eff.color || '#000000'}"></span>
            </label>
            <input type="text" class="fec-hex-input" data-prop="color-hex" value="${(eff.color || '#000000').replace('#', '').toUpperCase()}" maxlength="6">
            <span class="fec-divider"></span>
            <input type="number" min="0" max="100" class="fec-opacity-input" data-prop="opacity" value="${eff.opacity ?? 25}">
            <span class="fec-percent-sign">%</span>
          </div>
        </div>
      `;
    } else if (isBlur) {
      const blurMode = eff.blurMode || 'uniform';
      if (isLayerBlur) {
        controlsHTML = `
          <!-- Figma Segmented Control: Uniform | Progressive -->
          <div class="fec-segmented-tabs" style="display:flex;background:#27272a;border-radius:8px;padding:3px;margin-bottom:12px;">
            <button type="button" class="fec-seg-btn ${blurMode === 'uniform' ? 'active' : ''}" data-blur-mode="uniform" style="flex:1;border:none;background:${blurMode === 'uniform' ? '#3f3f46' : 'transparent'};color:${blurMode === 'uniform' ? '#ffffff' : '#a1a1aa'};font-size:12px;font-weight:600;padding:5px 0;border-radius:6px;cursor:pointer;transition:all 0.15s ease;">
              Uniform
            </button>
            <button type="button" class="fec-seg-btn ${blurMode === 'progressive' ? 'active' : ''}" data-blur-mode="progressive" style="flex:1;border:none;background:${blurMode === 'progressive' ? '#3f3f46' : 'transparent'};color:${blurMode === 'progressive' ? '#ffffff' : '#a1a1aa'};font-size:12px;font-weight:600;padding:5px 0;border-radius:6px;cursor:pointer;transition:all 0.15s ease;">
              Progressive
            </button>
          </div>

          ${blurMode === 'uniform' ? `
            <div class="fec-row">
              <span class="fec-label">Blur</span>
              <div class="fec-input-box fec-full-box">
                <span class="fec-prefix-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="4" r="1.5"/><circle cx="12" cy="4" r="1.5"/><circle cx="20" cy="4" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/><circle cx="4" cy="20" r="1.5"/><circle cx="12" cy="20" r="1.5"/><circle cx="20" cy="20" r="1.5"/></svg>
                </span>
                <input type="number" min="0" max="100" class="fec-number-input" data-prop="blur" value="${eff.blur ?? 8}">
              </div>
            </div>
          ` : `
            <div class="fec-row">
              <span class="fec-label">Start</span>
              <div class="fec-input-box fec-full-box">
                <span class="fec-prefix-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="4" r="1.5"/><circle cx="12" cy="4" r="1.5"/><circle cx="20" cy="4" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/><circle cx="4" cy="20" r="1.5"/><circle cx="12" cy="20" r="1.5"/><circle cx="20" cy="20" r="1.5"/></svg>
                </span>
                <input type="number" min="0" max="100" class="fec-number-input" data-prop="startBlur" value="${eff.startBlur ?? 0}">
              </div>
            </div>
            <div class="fec-row" style="margin-top:6px;">
              <span class="fec-label">End</span>
              <div class="fec-input-box fec-full-box">
                <span class="fec-prefix-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="4" r="1.5"/><circle cx="12" cy="4" r="1.5"/><circle cx="20" cy="4" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/><circle cx="4" cy="20" r="1.5"/><circle cx="12" cy="20" r="1.5"/><circle cx="20" cy="20" r="1.5"/></svg>
                </span>
                <input type="number" min="0" max="100" class="fec-number-input" data-prop="endBlur" value="${eff.endBlur ?? 4}">
              </div>
            </div>
          `}
        `;
      } else {
        controlsHTML = `
          <div class="fec-row">
            <span class="fec-label">Blur Radius</span>
            <div class="fec-input-box fec-full-box">
              <span class="fec-prefix-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="4" r="1.5"/><circle cx="12" cy="4" r="1.5"/><circle cx="20" cy="4" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/><circle cx="4" cy="20" r="1.5"/><circle cx="12" cy="20" r="1.5"/><circle cx="20" cy="20" r="1.5"/></svg>
              </span>
              <input type="number" min="0" max="100" class="fec-number-input" data-prop="blur" value="${eff.blur ?? 12}">
            </div>
          </div>
        `;
      }
    } else if (isNoise) {
      controlsHTML = `
        <div class="fec-row">
          <span class="fec-label">Amount</span>
          <div class="fec-input-box fec-full-box">
            <input type="number" min="0" max="100" class="fec-number-input" data-prop="amount" value="${eff.amount ?? 25}">
            <span class="fec-percent-sign">%</span>
          </div>
        </div>
      `;
    } else if (isTexture) {
      controlsHTML = `
        <div class="fec-row">
          <span class="fec-label">Size</span>
          <div class="fec-inputs-pair">
            <div class="fec-input-box">
              <span class="fec-prefix">X</span>
              <input type="number" step="0.1" min="1" max="100" class="fec-number-input" data-prop="sizeX" value="${eff.sizeX ?? 8.4}">
            </div>
            <div class="fec-input-box">
              <span class="fec-prefix">Y</span>
              <input type="number" step="0.1" min="1" max="100" class="fec-number-input" data-prop="sizeY" value="${eff.sizeY ?? 8.4}">
            </div>
          </div>
        </div>

        <div class="fec-row">
          <span class="fec-label">Radius</span>
          <div class="fec-input-box fec-full-box">
            <span class="fec-prefix-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            </span>
            <input type="number" step="0.5" min="0" max="50" class="fec-number-input" data-prop="radius" value="${eff.radius ?? 4}">
          </div>
        </div>

        <div class="fec-row" style="margin-top:4px;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:#d4d4d8;user-select:none;">
            <input type="checkbox" class="fec-checkbox-input" data-prop="clipToShape" ${eff.clipToShape ? 'checked' : ''} style="accent-color:#3b82f6;width:14px;height:14px;cursor:pointer;">
            <span>Clip to shape</span>
          </label>
        </div>
      `;
    } else if (isGlass) {
      controlsHTML = `
        <div class="fec-row">
          <span class="fec-label">Blur</span>
          <div class="fec-input-box fec-full-box">
            <input type="number" min="0" max="50" class="fec-number-input" data-prop="blur" value="${eff.blur ?? 8}">
          </div>
        </div>
        <div class="fec-row">
          <span class="fec-label">Tint</span>
          <div class="fec-color-combo-box">
            <label class="fec-swatch-wrap" title="Change tint">
              <input type="color" class="fec-color-picker-input" data-prop="tint" value="${eff.tint || '#ffffff'}">
              <span class="fec-swatch-preview" style="background-color:${eff.tint || '#ffffff'}"></span>
            </label>
            <input type="text" class="fec-hex-input" data-prop="tint-hex" value="${(eff.tint || '#ffffff').replace('#', '').toUpperCase()}" maxlength="6">
            <span class="fec-divider"></span>
            <input type="number" min="0" max="100" class="fec-opacity-input" data-prop="opacity" value="${eff.opacity ?? 25}">
            <span class="fec-percent-sign">%</span>
          </div>
        </div>
      `;
    }

    popover.innerHTML = `
      <div class="fec-header">
        <div class="fec-header-left" data-action="switch-effect-type" style="cursor:pointer;" title="Switch effect type">
          <span class="fec-title-icon">${def.icon}</span>
          <span class="fec-title-text">${def.name}</span>
          <svg class="fec-chevron-down" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="fec-header-right">
          <button type="button" class="fec-btn-icon" data-action="toggle-blend" title="Opacity / Blend">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
          </button>
          <button type="button" class="fec-btn-icon fec-btn-close" data-action="close-popover" title="Close">✕</button>
        </div>
      </div>
      <div class="fec-body">
        ${controlsHTML}
      </div>
    `;

    document.body.appendChild(popover);
    popoverContainer = popover;

    // Position popover left of drawer
    const drawer = document.querySelector('#propsDrawer') || document.querySelector('#text-panel');
    if (drawer && drawer.classList.contains('open')) {
      const dRect = drawer.getBoundingClientRect();
      popover.style.right = `${window.innerWidth - dRect.left + 12}px`;
      popover.style.top = `${Math.min(window.innerHeight - 340, Math.max(70, dRect.top + 160))}px`;
    } else {
      const rect = anchorEl.getBoundingClientRect();
      popover.style.left = `${Math.max(10, rect.left - 280)}px`;
      popover.style.top = `${Math.min(window.innerHeight - 340, Math.max(70, rect.top))}px`;
    }

    // Segmented tab switching: Uniform vs Progressive
    popover.querySelectorAll('.fec-seg-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = btn.dataset.blurMode;
        if (mode) {
          eff.blurMode = mode;
          applyEffects(obj);
          openEffectConfigPopover(anchorEl, obj, effectIndex);
        }
      });
    });

    // Bind real-time input events
    popover.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        const prop = input.dataset.prop;
        if (!prop) return;

        if (prop === 'x') eff.x = parseFloat(input.value) || 0;
        if (prop === 'y') eff.y = parseFloat(input.value) || 0;
        if (prop === 'blur') eff.blur = Math.max(0, parseFloat(input.value) || 0);
        if (prop === 'startBlur') eff.startBlur = Math.max(0, parseFloat(input.value) || 0);
        if (prop === 'endBlur') eff.endBlur = Math.max(0, parseFloat(input.value) || 0);
        if (prop === 'spread') eff.spread = Math.max(0, parseFloat(input.value) || 0);
        if (prop === 'amount') eff.amount = Math.max(0, parseFloat(input.value) || 0);
        if (prop === 'opacity') eff.opacity = Math.max(0, Math.min(100, parseFloat(input.value) || 0));

        // Texture properties
        if (prop === 'sizeX') eff.sizeX = Math.max(1, parseFloat(input.value) || 8.4);
        if (prop === 'sizeY') eff.sizeY = Math.max(1, parseFloat(input.value) || 8.4);
        if (prop === 'radius') eff.radius = Math.max(0, parseFloat(input.value) || 0);

        if (prop === 'color') {
          eff.color = input.value;
          const hexInput = popover.querySelector('.fec-hex-input[data-prop="color-hex"]');
          const swatch = popover.querySelector('.fec-swatch-preview');
          if (hexInput) hexInput.value = input.value.replace('#', '').toUpperCase();
          if (swatch) swatch.style.backgroundColor = input.value;
        }

        if (prop === 'color-hex') {
          let val = input.value.replace('#', '');
          if (val.length === 6) {
            eff.color = '#' + val;
            const picker = popover.querySelector('.fec-color-picker-input[data-prop="color"]');
            const swatch = popover.querySelector('.fec-swatch-preview');
            if (picker) picker.value = eff.color;
            if (swatch) swatch.style.backgroundColor = eff.color;
          }
        }

        if (prop === 'tint') {
          eff.tint = input.value;
          const hexInput = popover.querySelector('.fec-hex-input[data-prop="tint-hex"]');
          const swatch = popover.querySelector('.fec-swatch-preview');
          if (hexInput) hexInput.value = input.value.replace('#', '').toUpperCase();
          if (swatch) swatch.style.backgroundColor = input.value;
        }

        if (prop === 'tint-hex') {
          let val = input.value.replace('#', '');
          if (val.length === 6) {
            eff.tint = '#' + val;
            const picker = popover.querySelector('.fec-color-picker-input[data-prop="tint"]');
            const swatch = popover.querySelector('.fec-swatch-preview');
            if (picker) picker.value = eff.tint;
            if (swatch) swatch.style.backgroundColor = eff.tint;
          }
        }

        applyEffects(obj);
      });
    });

    // Checkbox input
    popover.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const prop = cb.dataset.prop;
        if (prop === 'clipToShape') {
          eff.clipToShape = cb.checked;
          applyEffects(obj);
        }
      });
    });

    // Switch effect type header click
    const headerLeft = popover.querySelector('[data-action="switch-effect-type"]');
    if (headerLeft) {
      headerLeft.addEventListener('click', (e) => {
        e.stopPropagation();
        openEffectsMenu(headerLeft, obj);
      });
    }

    popover.querySelector('[data-action="close-popover"]').addEventListener('click', () => {
      closeAllMenus();
    });

    setTimeout(() => {
      window.addEventListener('click', onWindowClick);
    }, 10);
  }

  function refreshDrawer() {
    const activeObj = activeTargetObject || getActiveCanvasObject();
    if (activeObj) {
      updateEffectsListDOM(activeObj);
    }

    if (typeof window.refreshProps === 'function') {
      window.refreshProps();
    } else if (window.ZineApp && typeof window.ZineApp.refreshProps === 'function') {
      window.ZineApp.refreshProps();
    } else if (window.ZineMaker && typeof window.ZineMaker.refreshProps === 'function') {
      window.ZineMaker.refreshProps();
    }

    if (window.TextPanel && window.TextPanel.isOpen && window.TextPanel.isOpen()) {
      const o = getActiveCanvasObject();
      if (o) window.TextPanel.update(o);
    }
  }

  // Global event delegation for propsDrawer & text-panel (capture phase to fire reliably)
  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('#tp-btn-add-effect');
    if (addBtn) {
      e.preventDefault();
      e.stopPropagation();
      const activeObj = getActiveCanvasObject() || activeTargetObject;
      if (activeObj) openEffectsMenu(addBtn, activeObj);
      return;
    }

    const eyeBtn = e.target.closest('.tp-effect-eye-btn');
    if (eyeBtn) {
      e.preventDefault();
      e.stopPropagation();
      const row = eyeBtn.closest('.tp-effect-row');
      if (!row) return;
      const idx = parseInt(row.dataset.index, 10);
      const activeObj = getActiveCanvasObject() || activeTargetObject;
      if (activeObj) {
        const effects = getObjectEffects(activeObj);
        if (effects[idx]) {
          effects[idx].enabled = !effects[idx].enabled;
          applyEffects(activeObj);
          updateEffectsListDOM(activeObj);
          refreshDrawer();
        }
      }
      return;
    }

    const editBtn = e.target.closest('.tp-effect-info-btn');
    if (editBtn) {
      e.preventDefault();
      e.stopPropagation();
      const row = editBtn.closest('.tp-effect-row');
      if (!row) return;
      const idx = parseInt(row.dataset.index, 10);
      const activeObj = getActiveCanvasObject() || activeTargetObject;
      if (activeObj) {
        openEffectConfigPopover(row, activeObj, idx);
      }
      return;
    }

    const delBtn = e.target.closest('.tp-effect-del-btn');
    if (delBtn) {
      e.preventDefault();
      e.stopPropagation();
      const row = delBtn.closest('.tp-effect-row');
      if (!row) return;
      const idx = parseInt(row.dataset.index, 10);
      const activeObj = getActiveCanvasObject() || activeTargetObject;
      if (activeObj) {
        const effects = getObjectEffects(activeObj);
        effects.splice(idx, 1);
        applyEffects(activeObj);
        closeAllMenus();
        updateEffectsListDOM(activeObj);
        refreshDrawer();
      }
      return;
    }
  }, true);

  root.ZineEffects = {
    EFFECT_DEFS,
    renderEffectsSectionHTML,
    openEffectsMenu,
    openEffectConfigPopover,
    applyEffects,
    getObjectEffects,
    updateEffectsListDOM
  };

})(window);
