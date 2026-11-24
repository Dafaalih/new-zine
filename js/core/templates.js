(function() {
  'use strict';

  /* ============================================================
     ZINE TEMPLATES & FRAME SWAP MODULE — templates.js
     One-click starter layouts and frame reordering for zines
     ============================================================ */

  const SHEET = { W: 1748, H: 1240, FW: 437, FH: 620 };

  const ZINE8_FRAMES = [
    { id: 'cover', label: 'FRONT COVER (p. 1)', row: 1, col: 1 },
    { id: '1', label: 'PAGE 1 (p. 2)', row: 1, col: 2 },
    { id: '2', label: 'PAGE 2 (p. 3)', row: 1, col: 3 },
    { id: '3', label: 'PAGE 3 (p. 4)', row: 0, col: 3, rotated: true },
    { id: '4', label: 'PAGE 4 (p. 5 - Center)', row: 0, col: 2, rotated: true },
    { id: '5', label: 'PAGE 5 (p. 6)', row: 0, col: 1, rotated: true },
    { id: '6', label: 'PAGE 6 (p. 7)', row: 0, col: 0, rotated: true },
    { id: 'back', label: 'BACK COVER (p. 8)', row: 1, col: 0 }
  ];

  /* ============================================================
     LAYOUT PRESETS DEFINITIONS
     ============================================================ */
  const TEMPLATES = [
    {
      id: 'punk-cover',
      title: 'Punk Cover',
      category: 'Cover',
      desc: 'Bold slanted title, accent badge, and price stamp',
      previewIcon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
      apply: (canvas, bounds) => {
        const { fx, fy, fw, fh } = bounds;

        // Dark accent bar
        const bar = new fabric.Rect({
          left: fx + 24,
          top: fy + 36,
          width: 140,
          height: 24,
          fill: '#000000',
          rx: 2,
          ry: 2
        });

        // Top tag
        const tag = new fabric.IText('VOL. 01 // INDIE', {
          left: fx + 32,
          top: fy + 41,
          fontFamily: 'Courier Prime',
          fontSize: 12,
          fontWeight: 'bold',
          fill: '#ffffff'
        });

        // Main Bold Title
        const title = new fabric.IText('NEW\nZINE®', {
          left: fx + 24,
          top: fy + 80,
          fontFamily: 'Permanent Marker',
          fontSize: 56,
          fill: '#000000',
          lineHeight: 0.9,
          angle: -2
        });

        // Subtitle box
        const subBox = new fabric.Rect({
          left: fx + 24,
          top: fy + 225,
          width: fw - 48,
          height: 38,
          fill: '#2f0ae9',
          rx: 3,
          ry: 3
        });

        const subText = new fabric.IText('NO EDITORS · NO RULES · DIY', {
          left: fx + 36,
          top: fy + 236,
          fontFamily: 'Space Grotesk',
          fontSize: 13,
          fontWeight: 'bold',
          fill: '#ffffff'
        });

        // Center Graphic Placeholder Box
        const photoFrame = new fabric.Rect({
          left: fx + 24,
          top: fy + 285,
          width: fw - 48,
          height: 190,
          fill: '#f0f0f2',
          stroke: '#000000',
          strokeWidth: 2,
          strokeDashArray: [6, 4]
        });

        const photoHint = new fabric.IText('[ drop foto di sini ]', {
          left: fx + fw / 2,
          top: fy + 370,
          originX: 'center',
          originY: 'center',
          fontFamily: 'Special Elite',
          fontSize: 15,
          fill: 'rgba(0,0,0,0.45)'
        });

        // Footer Barcode / Tagline
        const price = new fabric.IText('PRICE: $0.00 (FREE)', {
          left: fx + 24,
          top: fy + fh - 52,
          fontFamily: 'Courier Prime',
          fontSize: 12,
          fontWeight: 'bold',
          fill: '#000000'
        });

        const issue = new fabric.IText('COPY & DISTRIBUTE', {
          left: fx + fw - 24,
          top: fy + fh - 52,
          originX: 'right',
          fontFamily: 'Space Grotesk',
          fontSize: 11,
          fontWeight: 'bold',
          fill: '#2f0ae9'
        });

        canvas.add(bar, tag, title, subBox, subText, photoFrame, photoHint, price, issue);
      }
    },
    {
      id: 'photo-polaroid',
      title: 'Polaroid & Journal',
      category: 'Photo',
      desc: 'Tilted polaroid frame with tape strip and typewriter note',
      previewIcon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
      apply: (canvas, bounds) => {
        const { fx, fy, fw, fh } = bounds;

        // Tape strip across top
        const tape = new fabric.Rect({
          left: fx + fw / 2 - 40,
          top: fy + 40,
          width: 80,
          height: 22,
          fill: 'rgba(235, 215, 160, 0.75)',
          stroke: 'rgba(180, 160, 120, 0.4)',
          strokeWidth: 1,
          angle: -3
        });

        // White Polaroid Card Body
        const polaroid = new fabric.Rect({
          left: fx + 32,
          top: fy + 55,
          width: fw - 64,
          height: 320,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 1.5,
          shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.15)', blur: 10, offsetX: 4, offsetY: 6 }),
          angle: 1.5
        });

        // Photo cutout inside polaroid
        const innerPhoto = new fabric.Rect({
          left: fx + 46,
          top: fy + 72,
          width: fw - 92,
          height: 220,
          fill: '#e8e8ec',
          stroke: 'rgba(0,0,0,0.15)',
          strokeWidth: 1,
          angle: 1.5
        });

        const innerHint = new fabric.IText('FOTO 35MM', {
          left: fx + fw / 2,
          top: fy + 180,
          originX: 'center',
          originY: 'center',
          fontFamily: 'Courier Prime',
          fontSize: 14,
          fill: 'rgba(0,0,0,0.4)',
          angle: 1.5
        });

        // Handwritten caption under photo
        const caption = new fabric.IText('summer afternoon, 2026', {
          left: fx + 52,
          top: fy + 320,
          fontFamily: 'Caveat',
          fontSize: 22,
          fontWeight: 'bold',
          fill: '#222222',
          angle: 1.5
        });

        // Journal text lines below
        const journalTitle = new fabric.IText('ENTRY #04', {
          left: fx + 36,
          top: fy + 405,
          fontFamily: 'Space Grotesk',
          fontSize: 13,
          fontWeight: 'bold',
          fill: '#000000'
        });

        const journalBody = new fabric.IText(
          'we found this quiet alleyway by accident.\nfilm came back grainier than expected,\nbut that is exactly how it felt.',
          {
            left: fx + 36,
            top: fy + 430,
            fontFamily: 'Special Elite',
            fontSize: 13,
            lineHeight: 1.45,
            fill: '#333333'
          }
        );

        canvas.add(polaroid, innerPhoto, innerHint, caption, tape, journalTitle, journalBody);
      }
    },
    {
      id: 'comic-2panel',
      title: 'Comic 2-Panel',
      category: 'Comic',
      desc: 'Two classic comic panels with caption strip and speech bubble',
      previewIcon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      apply: (canvas, bounds) => {
        const { fx, fy, fw, fh } = bounds;

        const panelW = fw - 48;
        const panelH = (fh - 110) / 2;

        // Panel 1 (Top)
        const panel1 = new fabric.Rect({
          left: fx + 24,
          top: fy + 36,
          width: panelW,
          height: panelH,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 3
        });

        // Caption header
        const capBox1 = new fabric.Rect({
          left: fx + 24,
          top: fy + 36,
          width: 130,
          height: 24,
          fill: '#ffff00',
          stroke: '#000000',
          strokeWidth: 2
        });

        const capText1 = new fabric.IText('MEANWHILE...', {
          left: fx + 32,
          top: fy + 41,
          fontFamily: 'Archivo Black',
          fontSize: 11,
          fill: '#000000'
        });

        const bubbleText1 = new fabric.IText('"is it printable yet?"', {
          left: fx + 50,
          top: fy + 120,
          fontFamily: 'Special Elite',
          fontSize: 15,
          fill: '#000000'
        });

        // Panel 2 (Bottom)
        const panel2 = new fabric.Rect({
          left: fx + 24,
          top: fy + 48 + panelH,
          width: panelW,
          height: panelH,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 3
        });

        // Speech bubble box
        const bubbleBg = new fabric.Rect({
          left: fx + 40,
          top: fy + 70 + panelH,
          width: panelW - 32,
          height: 70,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
          rx: 8,
          ry: 8
        });

        const bubbleText2 = new fabric.IText('"YES! FOLD ONCE, CUT ONCE,\nAND WE ARE READY TO DISTRIBUTE!"', {
          left: fx + 52,
          top: fy + 82 + panelH,
          fontFamily: 'Space Grotesk',
          fontSize: 13,
          fontWeight: 'bold',
          lineHeight: 1.3,
          fill: '#000000'
        });

        // Sound effect badge
        const sfx = new fabric.IText('KRACK!', {
          left: fx + fw - 42,
          top: fy + fh - 65,
          originX: 'right',
          fontFamily: 'Permanent Marker',
          fontSize: 26,
          fill: '#2f0ae9',
          angle: -8
        });

        canvas.add(panel1, capBox1, capText1, bubbleText1, panel2, bubbleBg, bubbleText2, sfx);
      }
    },
    {
      id: 'manifesto-typo',
      title: 'Manifesto / Typo',
      category: 'Text',
      desc: 'High-contrast angled typography banner and punk principles',
      previewIcon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
      apply: (canvas, bounds) => {
        const { fx, fy, fw, fh } = bounds;

        // Big background angled banner
        const banner = new fabric.Rect({
          left: fx + 16,
          top: fy + 65,
          width: fw - 32,
          height: 90,
          fill: '#000000',
          angle: -2.5
        });

        const bannerText = new fabric.IText('NO PERMISSION\nREQUIRED', {
          left: fx + 28,
          top: fy + 78,
          fontFamily: 'Archivo Black',
          fontSize: 32,
          fill: '#ffffff',
          lineHeight: 0.95,
          angle: -2.5
        });

        // Accent divider
        const line = new fabric.Rect({
          left: fx + 24,
          top: fy + 195,
          width: fw - 48,
          height: 4,
          fill: '#2f0ae9'
        });

        // Rule bullet points
        const rules = [
          'RULE 01: Perfect is boring. Messy is human.',
          'RULE 02: Print at home or Xerox shop.',
          'RULE 03: Leave copies in coffee shops.',
          'RULE 04: Ugly is allowed.'
        ];

        const textObjs = [];
        rules.forEach((r, idx) => {
          const t = new fabric.IText(r, {
            left: fx + 26,
            top: fy + 225 + idx * 56,
            fontFamily: 'Courier Prime',
            fontSize: 13,
            fontWeight: 'bold',
            fill: '#000000',
            lineHeight: 1.3
          });
          textObjs.push(t);
        });

        // Bottom Stamp
        const stamp = new fabric.IText('✻ NEW-ZINE MANIFESTO ✻', {
          left: fx + fw / 2,
          top: fy + fh - 45,
          originX: 'center',
          fontFamily: 'Space Grotesk',
          fontSize: 12,
          fontWeight: 'bold',
          letterSpacing: 2,
          fill: '#2f0ae9'
        });

        canvas.add(banner, bannerText, line, ...textObjs, stamp);
      }
    },
    {
      id: 'poetry-verse',
      title: 'Poetry / Journal',
      category: 'Text',
      desc: 'Elegant serif verse, italic stanza, and flourish divider',
      previewIcon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>',
      apply: (canvas, bounds) => {
        const { fx, fy, fw, fh } = bounds;

        // Decorative asterisks
        const asterisks = new fabric.IText('✻   ✻   ✻', {
          left: fx + fw / 2,
          top: fy + 65,
          originX: 'center',
          fontFamily: 'Space Grotesk',
          fontSize: 14,
          fill: '#2f0ae9'
        });

        // Poem Title
        const title = new fabric.IText('the quiet hour', {
          left: fx + fw / 2,
          top: fy + 110,
          originX: 'center',
          fontFamily: 'DM Serif Display',
          fontSize: 28,
          fontStyle: 'italic',
          fill: '#000000'
        });

        // Poem Body
        const verse = new fabric.IText(
          'between the second fold\nand the final cut,\nthe paper breathes.\n\nnothing here was checked\nby an algorithm\nor approved by a board.\n\njust ink,\npaper,\nand two hands.',
          {
            left: fx + fw / 2,
            top: fy + 175,
            originX: 'center',
            fontFamily: 'Playfair Display',
            fontSize: 16,
            fontStyle: 'italic',
            lineHeight: 1.55,
            textAlign: 'center',
            fill: '#222222'
          }
        );

        // Thin separator line
        const sep = new fabric.Rect({
          left: fx + fw / 2 - 30,
          top: fy + 450,
          width: 60,
          height: 1,
          fill: 'rgba(0,0,0,0.3)'
        });

        // Author footnote
        const author = new fabric.IText('— midnight notes, 2026', {
          left: fx + fw / 2,
          top: fy + 475,
          originX: 'center',
          fontFamily: 'Special Elite',
          fontSize: 13,
          fill: 'rgba(0,0,0,0.5)'
        });

        canvas.add(asterisks, title, verse, sep, author);
      }
    },
    {
      id: 'collage-3grid',
      title: '3-Photo Collage',
      category: 'Photo',
      desc: 'Three overlapping tilted snapshot boxes with tape stickers',
      previewIcon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
      apply: (canvas, bounds) => {
        const { fx, fy, fw, fh } = bounds;

        // Box 1 (Top Left)
        const b1 = new fabric.Rect({
          left: fx + 32,
          top: fy + 50,
          width: 175,
          height: 175,
          fill: '#f4f4f6',
          stroke: '#000000',
          strokeWidth: 2,
          angle: -4
        });
        const t1 = new fabric.IText('photo 01', {
          left: fx + 85,
          top: fy + 130,
          fontFamily: 'Special Elite',
          fontSize: 13,
          fill: 'rgba(0,0,0,0.4)',
          angle: -4
        });

        // Box 2 (Top Right)
        const b2 = new fabric.Rect({
          left: fx + 215,
          top: fy + 80,
          width: 180,
          height: 190,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
          angle: 3
        });
        const t2 = new fabric.IText('photo 02', {
          left: fx + 270,
          top: fy + 165,
          fontFamily: 'Special Elite',
          fontSize: 13,
          fill: 'rgba(0,0,0,0.4)',
          angle: 3
        });

        // Tape on Box 2
        const tape = new fabric.Rect({
          left: fx + 260,
          top: fy + 70,
          width: 60,
          height: 18,
          fill: 'rgba(235, 215, 160, 0.75)',
          angle: 6
        });

        // Box 3 (Bottom Center)
        const b3 = new fabric.Rect({
          left: fx + 50,
          top: fy + 265,
          width: fw - 100,
          height: 190,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
          angle: -1
        });
        const t3 = new fabric.IText('[ drop hero photo here ]', {
          left: fx + fw / 2,
          top: fy + 355,
          originX: 'center',
          originY: 'center',
          fontFamily: 'Courier Prime',
          fontSize: 14,
          fill: 'rgba(0,0,0,0.4)',
          angle: -1
        });

        // Stamp badge
        const stamp = new fabric.IText('REMIX · 2026', {
          left: fx + fw - 35,
          top: fy + fh - 40,
          originX: 'right',
          fontFamily: 'Space Grotesk',
          fontSize: 12,
          fontWeight: 'bold',
          fill: '#2f0ae9'
        });

        canvas.add(b1, t1, b2, t2, tape, b3, t3, stamp);
      }
    },
    {
      id: 'blank-frame',
      title: 'Blank Canvas',
      category: 'Utility',
      desc: 'Clean frame with white background ready for fresh ideas',
      previewIcon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>',
      apply: (canvas, bounds) => {
        // Does not add objects, simply lets user clear frame
      }
    }
  ];

  /* ============================================================
     FRAME UTILITIES & BOUNDS
     ============================================================ */
  function getActiveBounds() {
    const fmt = window.ZineApp?.getFormat?.() || 'zine8';
    const activeFrameId = window.ZineApp?.getActiveFrameId?.() || 'cover';

    if (fmt === 'zine8') {
      const f = ZINE8_FRAMES.find(x => x.id === activeFrameId) || ZINE8_FRAMES[0];
      return {
        frame: f,
        fx: f.col * SHEET.FW,
        fy: f.row * SHEET.FH,
        fw: SHEET.FW,
        fh: SHEET.FH
      };
    } else {
      const c = window.ZineApp?.activeCanvas?.();
      return {
        frame: { id: '0', label: 'Page' },
        fx: 0,
        fy: 0,
        fw: c ? c.width : 495,
        fh: c ? c.height : 700
      };
    }
  }

  function getObjectsInFrame(canvas, bounds) {
    const { fx, fy, fw, fh } = bounds;
    return canvas.getObjects().filter(o => {
      // Exclude background outlines and system helpers
      if (o.name && (o.name.startsWith('frame-') || o.name.startsWith('label-') || o.name.startsWith('badge-') || o._isTextureOverlay)) {
        return false;
      }
      const pt = o.getCenterPoint ? o.getCenterPoint() : { x: o.left || 0, y: o.top || 0 };
      return pt.x >= fx && pt.x < fx + fw && pt.y >= fy && pt.y < fy + fh;
    });
  }

  /* ============================================================
     APPLY TEMPLATE TO ACTIVE FRAME
     ============================================================ */
  function applyTemplate(templateId) {
    const t = TEMPLATES.find(x => x.id === templateId);
    if (!t) return;

    const canvas = window.ZineApp?.activeCanvas?.();
    if (!canvas) return;

    const bounds = getActiveBounds();

    // Check if frame already has objects; if so, clear them or confirm
    const existing = getObjectsInFrame(canvas, bounds);
    if (existing.length > 0) {
      existing.forEach(o => canvas.remove(o));
    }

    // Apply template elements
    t.apply(canvas, bounds);
    canvas.requestRenderAll();

    if (window.ZineApp?.queueHistory) window.ZineApp.queueHistory();
    if (window.ZineApp?.markChange) window.ZineApp.markChange();
    if (window.ZineApp?.toast) window.ZineApp.toast(`Template applied: ${t.title}`);
  }

  /* ============================================================
     FRAME CONTENT SWAPPING / REORDERING
     ============================================================ */
  function swapFrameContent(sourceFrameId, targetFrameId) {
    if (sourceFrameId === targetFrameId) return;

    const canvas = window.ZineApp?.getSheetCanvas?.();
    if (!canvas) return;

    const src = ZINE8_FRAMES.find(x => x.id === sourceFrameId);
    const dst = ZINE8_FRAMES.find(x => x.id === targetFrameId);
    if (!src || !dst) return;

    const srcFx = src.col * SHEET.FW;
    const srcFy = src.row * SHEET.FH;
    const dstFx = dst.col * SHEET.FW;
    const dstFy = dst.row * SHEET.FH;

    const dx = dstFx - srcFx;
    const dy = dstFy - srcFy;

    const srcBounds = { fx: srcFx, fy: srcFy, fw: SHEET.FW, fh: SHEET.FH };
    const dstBounds = { fx: dstFx, fy: dstFy, fw: SHEET.FW, fh: SHEET.FH };

    const srcObjs = getObjectsInFrame(canvas, srcBounds);
    const dstObjs = getObjectsInFrame(canvas, dstBounds);

    // Move source objects to destination
    srcObjs.forEach(o => {
      o.set({
        left: o.left + dx,
        top: o.top + dy
      });
      o.setCoords();
    });

    // Move destination objects to source
    dstObjs.forEach(o => {
      o.set({
        left: o.left - dx,
        top: o.top - dy
      });
      o.setCoords();
    });

    // Swap frame background colors in state if present
    const frameBgs = window.ZineApp?.getFrameBackgrounds?.();
    if (frameBgs) {
      const srcBg = frameBgs[sourceFrameId] || '#ffffff';
      const dstBg = frameBgs[targetFrameId] || '#ffffff';
      frameBgs[sourceFrameId] = dstBg;
      frameBgs[targetFrameId] = srcBg;

      const srcFrameRect = canvas.getObjects().find(o => o.name === 'frame-' + sourceFrameId);
      const dstFrameRect = canvas.getObjects().find(o => o.name === 'frame-' + targetFrameId);
      if (srcFrameRect) srcFrameRect.set('fill', dstBg);
      if (dstFrameRect) dstFrameRect.set('fill', srcBg);
    }

    canvas.requestRenderAll();
    if (window.ZineApp?.queueHistory) window.ZineApp.queueHistory();
    if (window.ZineApp?.markChange) window.ZineApp.markChange();
    if (window.ZineApp?.toast) window.ZineApp.toast(`Berhasil ditukar: ${src.label} ⇄ ${dst.label}`);

    // Reopen drawer to reflect updated state
    openTemplatesDrawer();
  }

  /* ============================================================
     RENDER TEMPLATES DRAWER
     ============================================================ */
  function openTemplatesDrawer() {
    const d = document.querySelector('#propsDrawer');
    if (!d) return;

    const activeBounds = getActiveBounds();
    const curFrame = activeBounds.frame;

    // Build swap options
    const swapOptions = ZINE8_FRAMES
      .filter(f => f.id !== curFrame.id)
      .map(f => `<option value="${f.id}">${f.label}</option>`)
      .join('');

    const templateCards = TEMPLATES.map(t => `
      <div class="tmpl-card" data-tmpl-id="${t.id}" title="${t.desc}">
        <div class="tmpl-card-head">
          <span class="tmpl-icon">${t.previewIcon}</span>
          <span class="tmpl-tag">${t.category}</span>
        </div>
        <div class="tmpl-title">${t.title}</div>
        <div class="tmpl-desc">${t.desc}</div>
        <button type="button" class="tmpl-apply-btn">Apply Layout</button>
      </div>
    `).join('');

    const html = `
      <div class="templates-drawer">
        <!-- Header -->
        <div class="tmpl-drawer-header">
          <div class="tmpl-header-title">
            <span class="tmpl-header-icon" style="display:inline-flex;align-items:center;">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
            </span>
            <span>Layouts & Templates</span>
          </div>
          <button type="button" class="tmpl-close-btn" id="tmplCloseBtn" aria-label="Close">✕</button>
        </div>

        <!-- Target Frame Indicator -->
        <div class="tmpl-active-indicator">
          <span class="tmpl-target-tag">TARGET FRAME:</span>
          <span class="tmpl-target-name">${curFrame.label || 'CURRENT FRAME'}</span>
        </div>

        <!-- Quick Frame Swapper Section -->
        <div class="tmpl-swap-box">
          <div class="tmpl-swap-title" style="display:flex;align-items:center;gap:6px;">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16"/>
            </svg>
            <span>Tukar Isi Halaman (Frame Swap)</span>
          </div>
          <div class="tmpl-swap-row">
            <select id="tmplSwapSelect" class="tmpl-select">
              ${swapOptions}
            </select>
            <button type="button" id="tmplBtnDoSwap" class="tmpl-swap-action-btn">Tukar</button>
          </div>
        </div>

        <!-- Presets Grid -->
        <div class="tmpl-grid">
          ${templateCards}
        </div>
      </div>
    `;

    d.innerHTML = html;
    d.classList.add('open');

    // Bindings
    d.querySelector('#tmplCloseBtn')?.addEventListener('click', () => {
      d.innerHTML = '';
      d.classList.remove('open');
      if (window.setActiveTool) window.setActiveTool('select');
    });

    d.querySelectorAll('.tmpl-card').forEach(card => {
      card.addEventListener('click', () => {
        applyTemplate(card.dataset.tmplId);
      });
    });

    d.querySelector('#tmplBtnDoSwap')?.addEventListener('click', () => {
      const targetId = d.querySelector('#tmplSwapSelect')?.value;
      if (targetId) {
        swapFrameContent(curFrame.id, targetId);
      }
    });

    injectStyles();
  }

  /* ============================================================
     INJECT STYLES
     ============================================================ */
  function injectStyles() {
    if (document.querySelector('#templates-styles')) return;

    const css = `
      .templates-drawer {
        padding: 16px;
        color: #ffffff;
        font-family: 'Space Grotesk', sans-serif;
        box-sizing: border-box;
      }
      .tmpl-drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .tmpl-header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      .tmpl-close-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        line-height: 1;
      }
      .tmpl-close-btn:hover {
        color: #ffffff;
      }

      .tmpl-active-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(47, 10, 233, 0.2);
        border: 1px solid rgba(47, 10, 233, 0.4);
        padding: 6px 10px;
        border-radius: 6px;
        margin-bottom: 14px;
        font-size: 11px;
      }
      .tmpl-target-tag {
        color: #8c8eff;
        font-weight: 700;
      }
      .tmpl-target-name {
        color: #ffffff;
        font-weight: 600;
      }

      /* Frame Swap Box */
      .tmpl-swap-box {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 16px;
      }
      .tmpl-swap-title {
        font-size: 11px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 8px;
      }
      .tmpl-swap-row {
        display: flex;
        gap: 8px;
      }
      .tmpl-select {
        flex: 1;
        background: #1e1e24;
        border: 1px solid rgba(255, 255, 255, 0.18);
        color: #ffffff;
        padding: 6px 8px;
        border-radius: 6px;
        font-size: 11px;
        outline: none;
      }
      .tmpl-swap-action-btn {
        background: #2f0ae9;
        border: none;
        color: #ffffff;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .tmpl-swap-action-btn:hover {
        background: #3e1eff;
      }

      /* Grid of Templates */
      .tmpl-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: calc(100vh - 280px);
        overflow-y: auto;
        padding-right: 2px;
      }
      .tmpl-card {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.18s ease;
      }
      .tmpl-card:hover {
        background: rgba(255, 255, 255, 0.09);
        border-color: rgba(47, 10, 233, 0.5);
        transform: translateY(-1px);
      }
      .tmpl-card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
      }
      .tmpl-icon {
        font-size: 16px;
      }
      .tmpl-tag {
        font-size: 9px;
        text-transform: uppercase;
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
      }
      .tmpl-title {
        font-size: 13px;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 4px;
      }
      .tmpl-desc {
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.55);
        line-height: 1.35;
        margin-bottom: 10px;
      }
      .tmpl-apply-btn {
        width: 100%;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #ffffff;
        padding: 5px;
        border-radius: 5px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .tmpl-card:hover .tmpl-apply-btn {
        background: #2f0ae9;
        border-color: #2f0ae9;
      }
    `;

    const style = document.createElement('style');
    style.id = 'templates-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ============================================================
     EXPOSE GLOBAL
     ============================================================ */
  window.ZineTemplates = {
    openDrawer: openTemplatesDrawer,
    applyTemplate: applyTemplate,
    swapFrameContent: swapFrameContent
  };

})();
