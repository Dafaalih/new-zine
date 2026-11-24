(function() {
  'use strict';

  /* ============================================================
     SMART SNAPPING & MAGNETIC ALIGNMENT GUIDES — snapping.js
     High-precision snapping to frame centers, frame edges,
     sheet canvas, and other elements with dynamic visual guides.
     ============================================================ */

  const SHEET = { W: 1748, H: 1240, FW: 437, FH: 620 };

  const CONFIG = {
    snapDistPx: 8,               // Distance in screen pixels to trigger snap
    haloColor: 'rgba(255, 255, 255, 0.9)',
    guideColorCenter: '#2f0ae9', // Electric indigo for centerlines
    guideColorEdge: '#ff0077',   // Neon magenta for edge alignment
    guideColorOther: '#0066ff',  // Vivid blue for other elements
    labelBg: 'rgba(20, 20, 32, 0.94)',
    labelColor: '#ffffff',
    marginSafe: 24
  };

  let isAltPressed = false;
  let activeGuides = []; // Array of active guides

  // Track Alt key globally to temporarily bypass snapping
  window.addEventListener('keydown', e => {
    if (e.key === 'Alt') isAltPressed = true;
  });

  window.addEventListener('keyup', e => {
    if (e.key === 'Alt') isAltPressed = false;
  });

  // Global mouse/pointer release listeners: ALWAYS clear guides
  window.addEventListener('mouseup', () => clearGuides(), true);
  window.addEventListener('pointerup', () => clearGuides(), true);
  window.addEventListener('touchend', () => clearGuides(), true);
  window.addEventListener('blur', () => clearGuides(), true);

  /* ============================================================
     OVERLAY CANVAS MANAGEMENT
     ============================================================ */
  function getSnapCanvas(canvas) {
    if (!canvas) return null;
    let sc = canvas.__smartSnapCanvas;
    if (!sc || !sc.parentNode) {
      const parent = canvas.wrapperEl || (canvas.upperCanvasEl ? canvas.upperCanvasEl.parentNode : null);
      if (!parent) return null;

      sc = document.createElement('canvas');
      sc.className = 'smart-snap-canvas';
      sc.style.position = 'absolute';
      sc.style.left = '0';
      sc.style.top = '0';
      sc.style.width = '100%';
      sc.style.height = '100%';
      sc.style.pointerEvents = 'none';
      sc.style.zIndex = '35';
      parent.appendChild(sc);
      canvas.__smartSnapCanvas = sc;
    }

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);

    if (sc.width !== targetW || sc.height !== targetH) {
      sc.width = targetW;
      sc.height = targetH;
    }
    return sc;
  }

  function clearGuides(canvas) {
    activeGuides = [];
    const overlays = document.querySelectorAll('.smart-snap-canvas');
    overlays.forEach(sc => {
      try {
        const ctx = sc.getContext('2d');
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, sc.width, sc.height);
        ctx.restore();
      } catch (err) { /* noop */ }
    });
  }

  /* ============================================================
     GATHER SNAP TARGETS
     ============================================================ */
  function gatherTargets(canvas, movingObj) {
    const vTargets = []; // Vertical lines (x-coords)
    const hTargets = []; // Horizontal lines (y-coords)

    const isSheet = canvas.__page?.isSheet || (window.ZineApp?.getFormat?.() === 'zine8');
    const movingCenter = movingObj.getCenterPoint ? movingObj.getCenterPoint() : { x: movingObj.left || 0, y: movingObj.top || 0 };

    if (isSheet) {
      // 1. ZINE8 ACTIVE FRAME TARGETS
      const col = Math.max(0, Math.min(3, Math.floor(movingCenter.x / SHEET.FW)));
      const row = Math.max(0, Math.min(1, Math.floor(movingCenter.y / SHEET.FH)));

      const fx = col * SHEET.FW;
      const fy = row * SHEET.FH;
      const fw = SHEET.FW;
      const fh = SHEET.FH;
      const fcx = fx + fw / 2;
      const fcy = fy + fh / 2;

      // Active Frame Center
      vTargets.push({
        val: fcx,
        span: [fy, fy + fh],
        kind: 'frame-center',
        label: 'CENTER',
        priority: 10
      });
      hTargets.push({
        val: fcy,
        span: [fx, fx + fw],
        kind: 'frame-center',
        label: 'CENTER',
        priority: 10
      });

      // Active Frame Edges
      vTargets.push({
        val: fx,
        span: [fy, fy + fh],
        kind: 'frame-edge',
        label: 'FRAME LEFT',
        priority: 6
      });
      vTargets.push({
        val: fx + fw,
        span: [fy, fy + fh],
        kind: 'frame-edge',
        label: 'FRAME RIGHT',
        priority: 6
      });
      hTargets.push({
        val: fy,
        span: [fx, fx + fw],
        kind: 'frame-edge',
        label: 'FRAME TOP',
        priority: 6
      });
      hTargets.push({
        val: fy + fh,
        span: [fx, fx + fw],
        kind: 'frame-edge',
        label: 'FRAME BOTTOM',
        priority: 6
      });

      // Safe Margins (24px)
      vTargets.push({ val: fx + CONFIG.marginSafe, span: [fy, fy + fh], kind: 'margin', label: 'MARGIN', priority: 2 });
      vTargets.push({ val: fx + fw - CONFIG.marginSafe, span: [fy, fy + fh], kind: 'margin', label: 'MARGIN', priority: 2 });
      hTargets.push({ val: fy + CONFIG.marginSafe, span: [fx, fx + fw], kind: 'margin', label: 'MARGIN', priority: 2 });
      hTargets.push({ val: fy + fh - CONFIG.marginSafe, span: [fx, fx + fw], kind: 'margin', label: 'MARGIN', priority: 2 });

      // Sheet Center
      vTargets.push({ val: SHEET.W / 2, span: [0, SHEET.H], kind: 'sheet-center', label: 'SHEET CENTER', priority: 8 });
      hTargets.push({ val: SHEET.H / 2, span: [0, SHEET.W], kind: 'sheet-center', label: 'SHEET CENTER', priority: 8 });

    } else {
      // 2. SINGLE PAGE CANVAS TARGETS
      const st = window.ZineApp?.getState?.();
      const pw = st?.pageW || canvas.width || 495;
      const ph = st?.pageH || canvas.height || 700;

      vTargets.push({ val: pw / 2, span: [0, ph], kind: 'page-center', label: 'CENTER', priority: 10 });
      hTargets.push({ val: ph / 2, span: [0, pw], kind: 'page-center', label: 'CENTER', priority: 10 });

      vTargets.push({ val: 0, span: [0, ph], kind: 'page-edge', label: 'EDGE', priority: 6 });
      vTargets.push({ val: pw, span: [0, ph], kind: 'page-edge', label: 'EDGE', priority: 6 });
      hTargets.push({ val: 0, span: [0, pw], kind: 'page-edge', label: 'EDGE', priority: 6 });
      hTargets.push({ val: ph, span: [0, pw], kind: 'page-edge', label: 'EDGE', priority: 6 });
    }

    // 3. OTHER ELEMENTS ON CANVAS
    const selectedObjects = new Set(
      movingObj.type === 'activeSelection' ? movingObj.getObjects() : [movingObj]
    );

    const allObjects = canvas.getObjects();
    for (let i = 0; i < allObjects.length; i++) {
      const o = allObjects[i];
      if (selectedObjects.has(o)) continue;
      if (!o.visible || o.opacity === 0) continue;
      if (o.isFrame || o.isGuide || o.excludeFromExport) continue;
      if (o.name && (
        o.name.startsWith('frame-') ||
        o.name.startsWith('label-') ||
        o.name.startsWith('badge-') ||
        o.name.startsWith('guide-') ||
        o.name.startsWith('grid-') ||
        o.name.startsWith('texture-')
      )) continue;

      const ob = o.getBoundingRect(true, true);
      if (!ob || ob.width <= 0 || ob.height <= 0) continue;

      const obCx = ob.left + ob.width / 2;
      const obCy = ob.top + ob.height / 2;

      vTargets.push({
        val: obCx,
        span: [ob.top, ob.top + ob.height],
        kind: 'element-center',
        label: 'ALIGN CENTER',
        priority: 7
      });
      hTargets.push({
        val: obCy,
        span: [ob.left, ob.left + ob.width],
        kind: 'element-center',
        label: 'ALIGN CENTER',
        priority: 7
      });

      vTargets.push({
        val: ob.left,
        span: [ob.top, ob.top + ob.height],
        kind: 'element-edge',
        label: 'ALIGN LEFT',
        priority: 5
      });
      vTargets.push({
        val: ob.left + ob.width,
        span: [ob.top, ob.top + ob.height],
        kind: 'element-edge',
        label: 'ALIGN RIGHT',
        priority: 5
      });
      hTargets.push({
        val: ob.top,
        span: [ob.left, ob.left + ob.width],
        kind: 'element-edge',
        label: 'ALIGN TOP',
        priority: 5
      });
      hTargets.push({
        val: ob.top + ob.height,
        span: [ob.left, ob.left + ob.width],
        kind: 'element-edge',
        label: 'ALIGN BOTTOM',
        priority: 5
      });
    }

    return { vTargets, hTargets };
  }

  /* ============================================================
     CORE SMART SNAPPING HANDLER
     ============================================================ */
  function handleMoving(canvas, e) {
    if (!canvas) return;
    const obj = e.target;
    if (!obj) return;

    const appState = window.ZineApp?.getState?.();
    const snapEnabled = appState ? appState.snap !== false : true;
    if (!snapEnabled || isAltPressed || (e.e && e.e.altKey)) {
      clearGuides(canvas);
      return;
    }

    const zoom = canvas.getZoom() || 1;
    const threshold = CONFIG.snapDistPx / zoom;

    const b = obj.getBoundingRect(true, true);
    if (!b || b.width <= 0 || b.height <= 0) return;

    const movingXPoints = [
      { val: b.left + b.width / 2, type: 'center' },
      { val: b.left, type: 'left' },
      { val: b.left + b.width, type: 'right' }
    ];

    const movingYPoints = [
      { val: b.top + b.height / 2, type: 'center' },
      { val: b.top, type: 'top' },
      { val: b.top + b.height, type: 'bottom' }
    ];

    const { vTargets, hTargets } = gatherTargets(canvas, obj);

    // 1. BEST VERTICAL SNAP (X-AXIS)
    let bestX = null;
    let minScoreX = threshold + 1;

    for (let i = 0; i < vTargets.length; i++) {
      const tgt = vTargets[i];
      for (let j = 0; j < movingXPoints.length; j++) {
        const mp = movingXPoints[j];
        const diff = Math.abs(mp.val - tgt.val);
        if (diff <= threshold) {
          const isCenterToCenter = (mp.type === 'center' && tgt.kind.includes('center'));
          const score = diff - (tgt.priority * 0.15) - (isCenterToCenter ? 1.0 : 0);
          if (score < minScoreX) {
            minScoreX = score;
            bestX = {
              delta: tgt.val - mp.val,
              snapCoord: tgt.val,
              target: tgt
            };
          }
        }
      }
    }

    // 2. BEST HORIZONTAL SNAP (Y-AXIS)
    let bestY = null;
    let minScoreY = threshold + 1;

    for (let i = 0; i < hTargets.length; i++) {
      const tgt = hTargets[i];
      for (let j = 0; j < movingYPoints.length; j++) {
        const mp = movingYPoints[j];
        const diff = Math.abs(mp.val - tgt.val);
        if (diff <= threshold) {
          const isCenterToCenter = (mp.type === 'center' && tgt.kind.includes('center'));
          const score = diff - (tgt.priority * 0.15) - (isCenterToCenter ? 1.0 : 0);
          if (score < minScoreY) {
            minScoreY = score;
            bestY = {
              delta: tgt.val - mp.val,
              snapCoord: tgt.val,
              target: tgt
            };
          }
        }
      }
    }

    // 3. APPLY DELTAS
    if (bestX) obj.set({ left: obj.left + bestX.delta });
    if (bestY) obj.set({ top: obj.top + bestY.delta });
    if (bestX || bestY) obj.setCoords();

    // 4. ASSEMBLE ACTIVE GUIDELINES
    activeGuides = [];
    const currentTop = b.top + (bestY ? bestY.delta : 0);
    const currentBottom = currentTop + b.height;
    const currentLeft = b.left + (bestX ? bestX.delta : 0);
    const currentRight = currentLeft + b.width;
    const currentCy = currentTop + b.height / 2;
    const currentCx = currentLeft + b.width / 2;

    if (bestX) {
      const yMin = Math.min(bestX.target.span[0], currentTop) - 24;
      const yMax = Math.max(bestX.target.span[1], currentBottom) + 24;
      activeGuides.push({
        type: 'v',
        coord: bestX.snapCoord,
        span: [yMin, yMax],
        kind: bestX.target.kind,
        label: bestX.target.label,
        anchorPoint: { x: bestX.snapCoord, y: currentCy }
      });
    }

    if (bestY) {
      const xMin = Math.min(bestY.target.span[0], currentLeft) - 24;
      const xMax = Math.max(bestY.target.span[1], currentRight) + 24;
      activeGuides.push({
        type: 'h',
        coord: bestY.snapCoord,
        span: [xMin, xMax],
        kind: bestY.target.kind,
        label: bestY.target.label,
        anchorPoint: { x: currentCx, y: bestY.snapCoord }
      });
    }

    renderGuides(canvas);
  }

  /* ============================================================
     RENDER GUIDES (Clean, Sleek, Never Covering Artwork)
     ============================================================ */
  function renderGuides(canvas) {
    const sc = getSnapCanvas(canvas);
    if (!sc) return;

    const ctx = sc.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Reset transform completely before clearing
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, sc.width, sc.height);
    ctx.restore();

    if (!activeGuides.length) return;

    // Apply viewport transform (canvas zoom & pan)
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    ctx.setTransform(
      vpt[0] * dpr,
      vpt[1] * dpr,
      vpt[2] * dpr,
      vpt[3] * dpr,
      vpt[4] * dpr,
      vpt[5] * dpr
    );

    const zoom = canvas.getZoom() || 1;
    const lineWidth = 1.3 / zoom;
    const haloWidth = 3.4 / zoom;
    const dotRadius = 3.6 / zoom;

    activeGuides.forEach(g => {
      const isCenter = g.kind.includes('center');
      const isEdge = g.kind.includes('edge');
      const strokeColor = isCenter
        ? CONFIG.guideColorCenter
        : (isEdge ? CONFIG.guideColorEdge : CONFIG.guideColorOther);

      ctx.save();

      // 1. Halo / Glow
      ctx.strokeStyle = CONFIG.haloColor;
      ctx.lineWidth = haloWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (g.type === 'v') {
        ctx.moveTo(g.coord, g.span[0]);
        ctx.lineTo(g.coord, g.span[1]);
      } else {
        ctx.moveTo(g.span[0], g.coord);
        ctx.lineTo(g.span[1], g.coord);
      }
      ctx.stroke();

      // 2. Core Magnetic Line
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      if (isEdge || g.kind === 'margin') {
        ctx.setLineDash([5 / zoom, 4 / zoom]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      if (g.type === 'v') {
        ctx.moveTo(g.coord, g.span[0]);
        ctx.lineTo(g.coord, g.span[1]);
      } else {
        ctx.moveTo(g.span[0], g.coord);
        ctx.lineTo(g.span[1], g.coord);
      }
      ctx.stroke();

      // 3. Anchor Pip / Dot at contact point
      if (g.anchorPoint) {
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(g.anchorPoint.x, g.anchorPoint.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.4 / zoom;
        ctx.stroke();

        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.arc(g.anchorPoint.x, g.anchorPoint.y, dotRadius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Subtle Micro-Tag at the outer margin of the guideline
      drawGuideBadge(ctx, g, strokeColor, zoom);

      ctx.restore();
    });
  }

  function drawGuideBadge(ctx, g, strokeColor, zoom) {
    const text = g.label || 'ALIGN';
    const fontSize = Math.max(8.5, Math.round(9 / zoom));
    ctx.font = `600 ${fontSize}px "Space Grotesk", -apple-system, sans-serif`;

    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const padX = 5 / zoom;
    const padY = 2 / zoom;
    const boxW = textW + padX * 2;
    const boxH = fontSize + padY * 2;
    const radius = 2.5 / zoom;

    // Position badge at the edge of the line span (NEVER covering the object)
    let bx, by;
    if (g.type === 'v') {
      bx = g.coord + 5 / zoom;
      by = g.span[0] + 6 / zoom;
    } else {
      bx = g.span[0] + 6 / zoom;
      by = g.coord + 5 / zoom;
    }

    ctx.save();
    ctx.setLineDash([]);
    ctx.fillStyle = CONFIG.labelBg;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1 / zoom;

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(bx, by, boxW, boxH, radius);
    } else {
      ctx.rect(bx, by, boxW, boxH);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = CONFIG.labelColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, bx + padX, by + padY);
    ctx.restore();
  }

  /* ============================================================
     EXPORT GLOBAL API
     ============================================================ */
  window.ZineSnapping = {
    handleMoving,
    clearGuides,
    renderGuides,
    CONFIG
  };

})();
