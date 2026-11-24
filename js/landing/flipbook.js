(function() {
  'use strict';

  /* ============================================================
     3D INTERACTIVE FLIPBOOK PREVIEW MODULE — flipbook.js
     Buttery Smooth 3D Page Flip, Zero Layout Shifts, No Emojis
     ============================================================ */

  const SHEET = { W: 1748, H: 1240, FW: 437, FH: 620 };

  // Page frames matching standard 8-page mini-zine reading order
  const ZINE8_ORDER = [
    { page: 1, label: 'Front Cover', col: 1, row: 1 },
    { page: 2, label: 'Page 2', col: 2, row: 1 },
    { page: 3, label: 'Page 3', col: 3, row: 1 },
    { page: 4, label: 'Page 4', col: 3, row: 0 },
    { page: 5, label: 'Page 5', col: 2, row: 0 },
    { page: 6, label: 'Page 6', col: 1, row: 0 },
    { page: 7, label: 'Page 7', col: 0, row: 0 },
    { page: 8, label: 'Back Cover', col: 0, row: 1 }
  ];

  /* SVG Icons (Strictly no emojis) */
  const ICONS = {
    view3D: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    viewFlat: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
    soundOn: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
    export: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
  };

  let modalEl = null;
  let pageImages = []; // Array of { num, label, dataUrl } in reading order (0 to 7)
  let currentSpread = 0; // 0: Cover, 1: Spread 2-3, 2: Centerfold 4-5, 3: Spread 6-7, 4: Back Cover
  const totalSpreads = 5;
  let soundEnabled = true;
  let is3DAngled = true;
  let autoPlayTimer = null;
  let isAnimating = false;

  /* ============================================================
     PROCEDURAL REALISTIC PAPER FLIP SOUND (Web Audio API)
     ============================================================ */
  function playPaperSound() {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window.__zineAudioCtx) window.__zineAudioCtx = new AudioCtx();
      const ctx = window.__zineAudioCtx;
      if (ctx.state === 'suspended') ctx.resume();

      const dur = 0.22;
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        const pink = b0 + b1 + b2 + white * 0.5362;
        const env = Math.sin((i / bufferSize) * Math.PI);
        data[i] = pink * env * 0.25;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.24, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) { /* audio muted or unsupported */ }
  }

  /* ============================================================
     ACCURATE FULL-RES PAGE EXTRACTION
     Ensures every page is sliced properly and rendered upright
     ============================================================ */
  function extractPages() {
    const pages = [];
    const fmt = window.ZineApp?.getFormat?.() || 'zine8';
    const sheetCanvas = window.ZineApp?.getSheetCanvas?.();
    const allPages = window.ZineApp?.getPages?.() || [];

    if (fmt === 'zine8' && sheetCanvas) {
      // 1. SAVE CANVAS VIEWPORT AND DIMENSIONS
      const prevVpt = sheetCanvas.viewportTransform ? sheetCanvas.viewportTransform.slice() : [1, 0, 0, 1, 0, 0];
      const prevW = sheetCanvas.getWidth();
      const prevH = sheetCanvas.getHeight();

      // 2. DISCARD ACTIVE SELECTION
      const activeObj = sheetCanvas.getActiveObject();
      if (activeObj) sheetCanvas.discardActiveObject();

      // 3. HIDE HELPER LABELS & BADGES
      const hiddenObjs = [];
      sheetCanvas.getObjects().forEach(o => {
        if (o.name && (o.name.startsWith('label-') || o.name.startsWith('badge-'))) {
          if (o.visible) {
            o.visible = false;
            hiddenObjs.push(o);
          }
        }
      });

      // 4. RESET TO 1:1 BASE DIMENSIONS
      sheetCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      sheetCanvas.setDimensions({ width: SHEET.W, height: SHEET.H });
      sheetCanvas.renderAll();

      // Render clean full-res sheet
      const renderedSheet = sheetCanvas.toCanvasElement(1.0);

      // 5. RESTORE CANVAS STATE IMMEDIATELY
      hiddenObjs.forEach(o => { o.visible = true; });
      if (activeObj) sheetCanvas.setActiveObject(activeObj);
      sheetCanvas.setViewportTransform(prevVpt);
      sheetCanvas.setDimensions({ width: prevW, height: prevH });
      sheetCanvas.renderAll();

      // 6. SLICE EACH OF THE 8 PAGES
      const fw = SHEET.FW; // 437
      const fh = SHEET.FH; // 620
      const scaleX = renderedSheet.width / SHEET.W;
      const scaleY = renderedSheet.height / SHEET.H;

      ZINE8_ORDER.forEach((item, idx) => {
        const cv = document.createElement('canvas');
        cv.width = fw;
        cv.height = fh;
        const ctx = cv.getContext('2d');

        // Pure white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, fw, fh);

        const sx = item.col * SHEET.FW * scaleX;
        const sy = item.row * SHEET.FH * scaleY;
        const sw = fw * scaleX;
        const sh = fh * scaleY;

        // Draw page slice with accurate pixel coordinates
        ctx.drawImage(renderedSheet, sx, sy, sw, sh, 0, 0, fw, fh);

        pages.push({
          num: idx + 1,
          label: item.label,
          dataUrl: cv.toDataURL('image/jpeg', 0.95)
        });
      });
    } else {
      allPages.forEach((p, idx) => {
        if (!p.canvas) return;
        const prevVpt = p.canvas.viewportTransform ? p.canvas.viewportTransform.slice() : [1, 0, 0, 1, 0, 0];
        const prevW = p.canvas.getWidth();
        const prevH = p.canvas.getHeight();
        const baseW = window.ZineApp?.getState?.()?.pageW || p.canvas.width || 495;
        const baseH = window.ZineApp?.getState?.()?.pageH || p.canvas.height || 700;

        p.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        p.canvas.setDimensions({ width: baseW, height: baseH });
        p.canvas.renderAll();

        const dataUrl = p.canvas.toDataURL({ format: 'jpeg', quality: 0.95 });

        p.canvas.setViewportTransform(prevVpt);
        p.canvas.setDimensions({ width: prevW, height: prevH });
        p.canvas.renderAll();

        pages.push({
          num: idx + 1,
          label: idx === 0 ? 'Front Cover' : (idx === allPages.length - 1 ? 'Back Cover' : 'Page ' + (idx + 1)),
          dataUrl: dataUrl
        });
      });
    }

    return pages;
  }

  /* ============================================================
     SPREAD DATA GETTER
     ============================================================ */
  function getSpreadPages(spreadIdx) {
    if (!pageImages.length) return { left: null, right: null };

    if (spreadIdx === 0) {
      // Cover (Front cover on right, inside book base on left)
      return { left: null, right: pageImages[0] };
    } else if (spreadIdx === totalSpreads - 1) {
      // Back Cover (Back cover on left, inside book base on right)
      return { left: pageImages[pageImages.length - 1], right: null };
    } else {
      // Open Spreads:
      // Spread 1 -> P2, P3
      // Spread 2 -> P4, P5 (Centerfold)
      // Spread 3 -> P6, P7
      const leftIdx = (spreadIdx - 1) * 2 + 1;
      const rightIdx = leftIdx + 1;
      return {
        left: pageImages[leftIdx] || null,
        right: pageImages[rightIdx] || null,
        isCenterfold: (spreadIdx === 2)
      };
    }
  }

  /* ============================================================
     BUILD MODAL DOM
     ============================================================ */
  function createModal() {
    if (modalEl) return;

    modalEl = document.createElement('div');
    modalEl.id = 'flipbookOverlay';
    modalEl.className = 'flipbook-overlay hidden';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-label', '3D Zine Flipbook');

    modalEl.innerHTML = `
      <div class="flipbook-container">
        <!-- Top Navigation Bar -->
        <header class="flipbook-header">
          <div class="fb-head-left">
            <span class="fb-badge">3D Flipbook</span>
            <span class="fb-zine-title" id="fbZineTitle">8-Page Folded Mini Zine</span>
            <span class="fb-pages-indicator" id="fbPagesIndicator">8 Pages</span>
          </div>

          <div class="fb-head-right">
            <button type="button" class="fb-tool-btn ${is3DAngled ? 'active' : ''}" id="fbViewToggle" title="Toggle 3D View vs Flat View">
              <span class="fb-icon-wrap" id="fbViewIcon">${is3DAngled ? ICONS.view3D : ICONS.viewFlat}</span>
              <span class="fb-tool-label" id="fbViewLabel">${is3DAngled ? '3D view' : 'flat view'}</span>
            </button>
            <button type="button" class="fb-tool-btn ${soundEnabled ? 'active' : ''}" id="fbSoundToggle" title="Toggle sound effects">
              <span class="fb-icon-wrap" id="fbSoundIcon">${soundEnabled ? ICONS.soundOn : ICONS.soundOff}</span>
              <span class="fb-tool-label">sound</span>
            </button>
            <button type="button" class="fb-tool-btn" id="fbAutoToggle" title="Auto-flip pages">
              <span class="fb-icon-wrap" id="fbAutoIcon">${ICONS.play}</span>
              <span class="fb-tool-label">auto</span>
            </button>
            <button type="button" class="fb-tool-btn primary" id="fbExportShortcut" title="Open print & export options">
              <span class="fb-icon-wrap">${ICONS.export}</span>
              <span>export pdf</span>
            </button>
            <button type="button" class="fb-close-btn" id="fbCloseBtn" aria-label="Close flipbook">
              ${ICONS.close}
            </button>
          </div>
        </header>

        <!-- Main Viewport -->
        <main class="flipbook-viewport ${is3DAngled ? 'mode-3d' : 'mode-flat'}" id="fbViewport">
          <!-- Ambient Studio Lighting -->
          <div class="fb-ambient-glow" aria-hidden="true"></div>

          <!-- The Book Stage Component (ALWAYS FIXED 680px x 480px) -->
          <div class="fb-stage-wrap" id="fbStageWrap">
            <!-- Contact Ground Shadow -->
            <div class="fb-book-ground-shadow" aria-hidden="true"></div>

            <!-- Soft background page deck peeking out (matching reference video) -->
            <div class="fb-paper-deck fb-deck-left" id="fbDeckLeft" aria-hidden="true"></div>
            <div class="fb-paper-deck fb-deck-right" id="fbDeckRight" aria-hidden="true"></div>

            <!-- The Book Spread -->
            <div class="fb-book-spread" id="fbBookSpread">
              <!-- Left Page -->
              <div class="fb-page-wing fb-wing-left" id="fbPageLeftWrap" title="Klik untuk balik ke halaman sebelumnya">
                <div class="fb-wing-clip" id="fbLeftClip">
                  <img src="" class="fb-page-img" id="fbLeftImg" draggable="false">
                  <div class="fb-inner-spine-shadow left"></div>
                  <div class="fb-paper-glare"></div>
                  <div class="fb-page-footer-num" id="fbLeftNum"></div>
                </div>
              </div>

              <!-- Center Vertical Spine -->
              <div class="fb-center-spine" aria-hidden="true"></div>

              <!-- Right Page -->
              <div class="fb-page-wing fb-wing-right" id="fbPageRightWrap" title="Klik untuk lanjut ke halaman berikutnya">
                <div class="fb-wing-clip" id="fbRightClip">
                  <img src="" class="fb-page-img" id="fbRightImg" draggable="false">
                  <div class="fb-inner-spine-shadow right"></div>
                  <div class="fb-paper-glare"></div>
                  <div class="fb-page-footer-num" id="fbRightNum"></div>
                </div>
              </div>

              <!-- Animated 3D Turning Leaf -->
              <div class="fb-turning-leaf" id="fbTurningLeaf" style="display:none;" aria-hidden="true">
                <div class="fb-leaf-face fb-leaf-front">
                  <img src="" class="fb-page-img" id="fbLeafFrontImg" draggable="false">
                  <div class="fb-leaf-shading" id="fbFrontShade"></div>
                </div>
                <div class="fb-leaf-face fb-leaf-back">
                  <img src="" class="fb-page-img" id="fbLeafBackImg" draggable="false">
                  <div class="fb-leaf-shading" id="fbBackShade"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Side Floating Nav Arrows -->
          <button type="button" class="fb-nav-arrow fb-prev" id="fbPrevBtn" title="Previous page (Left Arrow)">
            ${ICONS.arrowLeft}
          </button>
          <button type="button" class="fb-nav-arrow fb-next" id="fbNextBtn" title="Next page (Right Arrow)">
            ${ICONS.arrowRight}
          </button>
        </main>

        <!-- Bottom Controls & Spread Navigator -->
        <footer class="flipbook-footer">
          <div class="fb-spread-pills" id="fbSpreadPills" role="tablist"></div>
          <div class="fb-footer-hint">
            <span>Klik halaman kanan untuk membuka / lanjut · Klik halaman kiri untuk kembali · Keyboard ← →</span>
          </div>
        </footer>
      </div>
    `;

    document.body.appendChild(modalEl);
    bindEvents();
    injectStyles();
  }

  /* ============================================================
     SET SPREAD STATIC STATE (NO LAYOUT SHIFT)
     ============================================================ */
  function applyStaticSpread(spreadIdx) {
    const leftImg = document.querySelector('#fbLeftImg');
    const rightImg = document.querySelector('#fbRightImg');
    const leftClip = document.querySelector('#fbLeftClip');
    const rightClip = document.querySelector('#fbRightClip');
    const leftNum = document.querySelector('#fbLeftNum');
    const rightNum = document.querySelector('#fbRightNum');
    const deckLeft = document.querySelector('#fbDeckLeft');
    const deckRight = document.querySelector('#fbDeckRight');
    const spreadWrap = document.querySelector('#fbBookSpread');
    if (!leftImg || !rightImg || !spreadWrap) return;

    const data = getSpreadPages(spreadIdx);

    // Update centerfold status class
    spreadWrap.classList.toggle('is-centerfold', spreadIdx === 2);

    // Update left page
    if (data.left) {
      leftImg.src = data.left.dataUrl;
      leftImg.style.display = 'block';
      leftClip.className = 'fb-wing-clip has-page';
      leftNum.innerHTML = `<span>${data.left.label}</span>`;
    } else {
      // Cover state: left wing is clean closed desk plate
      leftImg.src = '';
      leftImg.style.display = 'none';
      leftClip.className = 'fb-wing-clip is-empty';
      leftNum.innerHTML = '';
    }

    // Update right page
    if (data.right) {
      rightImg.src = data.right.dataUrl;
      rightImg.style.display = 'block';
      rightClip.className = 'fb-wing-clip has-page';
      rightNum.innerHTML = `<span>${data.right.label}</span>${spreadIdx === 2 ? '<span class="centerfold-tag">CENTERFOLD</span>' : ''}`;
    } else {
      // Back cover state: right wing is clean closed desk plate
      rightImg.src = '';
      rightImg.style.display = 'none';
      rightClip.className = 'fb-wing-clip is-empty';
      rightNum.innerHTML = '';
    }

    // Update clean background paper decks
    if (deckLeft) {
      deckLeft.classList.toggle('visible', spreadIdx > 0);
    }
    if (deckRight) {
      deckRight.classList.toggle('visible', spreadIdx < totalSpreads - 1);
    }

    updatePills();
    updateNavButtons();
  }

  /* ============================================================
     BUTTERY SMOOTH 3D FLIP ANIMATION
     ============================================================ */
  function flipToSpread(fromSpread, toSpread, direction) {
    if (isAnimating) return;
    isAnimating = true;

    playPaperSound();

    const flipper = document.querySelector('#fbTurningLeaf');
    const frontImg = document.querySelector('#fbLeafFrontImg');
    const backImg = document.querySelector('#fbLeafBackImg');
    const leftImg = document.querySelector('#fbLeftImg');
    const rightImg = document.querySelector('#fbRightImg');
    const leftClip = document.querySelector('#fbLeftClip');
    const rightClip = document.querySelector('#fbRightClip');
    const leftNum = document.querySelector('#fbLeftNum');
    const rightNum = document.querySelector('#fbRightNum');
    const deckLeft = document.querySelector('#fbDeckLeft');
    const deckRight = document.querySelector('#fbDeckRight');

    const fromData = getSpreadPages(fromSpread);
    const toData = getSpreadPages(toSpread);

    if (direction === 'next') {
      // Flipping right page over to left
      flipper.className = 'fb-turning-leaf is-turning-next';
      frontImg.src = fromData.right ? fromData.right.dataUrl : '';
      backImg.src = toData.left ? toData.left.dataUrl : '';

      // Reveal target right page underneath immediately
      if (toData.right) {
        rightImg.src = toData.right.dataUrl;
        rightImg.style.display = 'block';
        rightClip.className = 'fb-wing-clip has-page';
        rightNum.innerHTML = `<span>${toData.right.label}</span>${toSpread === 2 ? '<span class="centerfold-tag">CENTERFOLD</span>' : ''}`;
      } else {
        rightImg.src = '';
        rightImg.style.display = 'none';
        rightClip.className = 'fb-wing-clip is-empty';
        rightNum.innerHTML = '';
      }

      flipper.style.display = 'block';
      void flipper.offsetWidth; // Force reflow
      flipper.classList.add('animate');

      setTimeout(() => {
        // Complete flip on left side
        if (toData.left) {
          leftImg.src = toData.left.dataUrl;
          leftImg.style.display = 'block';
          leftClip.className = 'fb-wing-clip has-page';
          leftNum.innerHTML = `<span>${toData.left.label}</span>`;
        } else {
          leftImg.src = '';
          leftImg.style.display = 'none';
          leftClip.className = 'fb-wing-clip is-empty';
          leftNum.innerHTML = '';
        }

        flipper.style.display = 'none';
        flipper.className = 'fb-turning-leaf';

        currentSpread = toSpread;
        if (deckLeft) deckLeft.classList.toggle('visible', currentSpread > 0);
        if (deckRight) deckRight.classList.toggle('visible', currentSpread < totalSpreads - 1);
        updatePills();
        updateNavButtons();
        isAnimating = false;
      }, 550);
    } else {
      // Flipping left page over to right
      flipper.className = 'fb-turning-leaf is-turning-prev';
      frontImg.src = fromData.left ? fromData.left.dataUrl : '';
      backImg.src = toData.right ? toData.right.dataUrl : '';

      // Reveal target left page underneath immediately
      if (toData.left) {
        leftImg.src = toData.left.dataUrl;
        leftImg.style.display = 'block';
        leftClip.className = 'fb-wing-clip has-page';
        leftNum.innerHTML = `<span>${toData.left.label}</span>`;
      } else {
        leftImg.src = '';
        leftImg.style.display = 'none';
        leftClip.className = 'fb-wing-clip is-empty';
        leftNum.innerHTML = '';
      }

      flipper.style.display = 'block';
      void flipper.offsetWidth;
      flipper.classList.add('animate');

      setTimeout(() => {
        // Complete flip on right side
        if (toData.right) {
          rightImg.src = toData.right.dataUrl;
          rightImg.style.display = 'block';
          rightClip.className = 'fb-wing-clip has-page';
          rightNum.innerHTML = `<span>${toData.right.label}</span>${toSpread === 2 ? '<span class="centerfold-tag">CENTERFOLD</span>' : ''}`;
        } else {
          rightImg.src = '';
          rightImg.style.display = 'none';
          rightClip.className = 'fb-wing-clip is-empty';
          rightNum.innerHTML = '';
        }

        flipper.style.display = 'none';
        flipper.className = 'fb-turning-leaf';

        currentSpread = toSpread;
        if (deckLeft) deckLeft.classList.toggle('visible', currentSpread > 0);
        if (deckRight) deckRight.classList.toggle('visible', currentSpread < totalSpreads - 1);
        updatePills();
        updateNavButtons();
        isAnimating = false;
      }, 550);
    }
  }

  /* ============================================================
     SPREAD NAVIGATION
     ============================================================ */
  function nextSpread() {
    if (isAnimating) return;
    if (currentSpread >= totalSpreads - 1) {
      if (autoPlayTimer) {
        // Smooth loop back to cover
        flipToSpread(currentSpread, 0, 'prev');
      }
      return;
    }
    flipToSpread(currentSpread, currentSpread + 1, 'next');
  }

  function prevSpread() {
    if (isAnimating) return;
    if (currentSpread <= 0) return;
    flipToSpread(currentSpread, currentSpread - 1, 'prev');
  }

  function goToSpread(targetIdx) {
    if (isAnimating || targetIdx === currentSpread) return;
    const dir = targetIdx > currentSpread ? 'next' : 'prev';
    flipToSpread(currentSpread, targetIdx, dir);
  }

  function updatePills() {
    const pillsContainer = document.querySelector('#fbSpreadPills');
    if (!pillsContainer) return;

    const labels = [
      'Cover',
      'p. 2 — 3',
      'p. 4 — 5 (Centerfold)',
      'p. 6 — 7',
      'Back'
    ];

    let html = '';
    labels.forEach((lbl, idx) => {
      const active = (idx === currentSpread) ? 'active' : '';
      html += `<button type="button" class="fb-pill ${active}" data-spread="${idx}">${lbl}</button>`;
    });

    pillsContainer.innerHTML = html;

    pillsContainer.querySelectorAll('.fb-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        goToSpread(parseInt(btn.dataset.spread, 10));
      });
    });
  }

  function updateNavButtons() {
    const prevBtn = document.querySelector('#fbPrevBtn');
    const nextBtn = document.querySelector('#fbNextBtn');
    if (prevBtn) prevBtn.disabled = (currentSpread === 0);
    if (nextBtn) nextBtn.disabled = (currentSpread === totalSpreads - 1);
  }

  /* ============================================================
     VIEW MODE TOGGLE: 3D ANGLED vs FLAT SPREAD
     ============================================================ */
  function toggleViewMode() {
    is3DAngled = !is3DAngled;
    const vp = document.querySelector('#fbViewport');
    const toggleBtn = document.querySelector('#fbViewToggle');
    const icon = document.querySelector('#fbViewIcon');
    const label = document.querySelector('#fbViewLabel');
    if (vp) {
      vp.classList.toggle('mode-3d', is3DAngled);
      vp.classList.toggle('mode-flat', !is3DAngled);
    }
    if (toggleBtn) toggleBtn.classList.toggle('active', is3DAngled);
    if (icon) icon.innerHTML = is3DAngled ? ICONS.view3D : ICONS.viewFlat;
    if (label) label.textContent = is3DAngled ? '3D view' : 'flat view';
  }

  /* ============================================================
     AUTOPLAY
     ============================================================ */
  function toggleAutoPlay() {
    if (autoPlayTimer) stopAutoPlay();
    else startAutoPlay();
  }

  function startAutoPlay() {
    const autoIcon = document.querySelector('#fbAutoIcon');
    const autoBtn = document.querySelector('#fbAutoToggle');
    if (autoIcon) autoIcon.innerHTML = ICONS.pause;
    if (autoBtn) autoBtn.classList.add('active');

    autoPlayTimer = setInterval(() => {
      if (currentSpread < totalSpreads - 1) {
        nextSpread();
      } else {
        // Smooth loop back to Cover
        goToSpread(0);
      }
    }, 2400);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
    const autoIcon = document.querySelector('#fbAutoIcon');
    const autoBtn = document.querySelector('#fbAutoToggle');
    if (autoIcon) autoIcon.innerHTML = ICONS.play;
    if (autoBtn) autoBtn.classList.remove('active');
  }

  /* ============================================================
     EVENT BINDINGS
     ============================================================ */
  function bindEvents() {
    const closeBtn = document.querySelector('#fbCloseBtn');
    const prevBtn = document.querySelector('#fbPrevBtn');
    const nextBtn = document.querySelector('#fbNextBtn');
    const soundToggle = document.querySelector('#fbSoundToggle');
    const viewToggle = document.querySelector('#fbViewToggle');
    const autoToggle = document.querySelector('#fbAutoToggle');
    const exportBtn = document.querySelector('#fbExportShortcut');
    const pageRightWrap = document.querySelector('#fbPageRightWrap');
    const pageLeftWrap = document.querySelector('#fbPageLeftWrap');

    if (closeBtn) closeBtn.addEventListener('click', closeFlipbook);
    if (prevBtn) prevBtn.addEventListener('click', prevSpread);
    if (nextBtn) nextBtn.addEventListener('click', nextSpread);
    if (viewToggle) viewToggle.addEventListener('click', toggleViewMode);

    if (pageRightWrap) pageRightWrap.addEventListener('click', nextSpread);
    if (pageLeftWrap) pageLeftWrap.addEventListener('click', prevSpread);

    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        const icon = document.querySelector('#fbSoundIcon');
        if (icon) icon.innerHTML = soundEnabled ? ICONS.soundOn : ICONS.soundOff;
        soundToggle.classList.toggle('active', soundEnabled);
        if (soundEnabled) playPaperSound();
      });
    }

    if (autoToggle) autoToggle.addEventListener('click', toggleAutoPlay);

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        closeFlipbook();
        if (window.ZineExport?.openDialog) {
          window.ZineExport.openDialog();
        }
      });
    }

    // Keyboard support
    window.addEventListener('keydown', e => {
      if (!modalEl || modalEl.classList.contains('hidden')) return;

      if (e.key === 'Escape') {
        closeFlipbook();
      } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSpread();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSpread();
      }
    });

    modalEl.addEventListener('click', e => {
      if (e.target === modalEl) closeFlipbook();
    });
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */
  function openFlipbook() {
    createModal();

    const titleEl = document.querySelector('#fbZineTitle');
    const projTitle = window.ZineApp?.getState?.()?.projectTitle;
    if (titleEl) {
      titleEl.textContent = projTitle ? `${projTitle} · 3D Booklet` : '8-Page Folded Mini Zine';
    }

    pageImages = extractPages();
    if (!pageImages || !pageImages.length) {
      if (window.ZineApp?.toast) window.ZineApp.toast('Kanvas belum siap');
      return;
    }

    modalEl.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    currentSpread = 0;
    applyStaticSpread(0);
  }

  function closeFlipbook() {
    if (!modalEl) return;
    stopAutoPlay();
    modalEl.classList.add('hidden');
    document.body.style.overflow = '';
  }

  /* ============================================================
     INJECT PREMIUM 3D BOOK STYLES (No Layout Shifts, Real Flips)
     ============================================================ */
  function injectStyles() {
    const existing = document.querySelector('#flipbook-styles');
    if (existing) existing.remove();

    const css = `
      .flipbook-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: radial-gradient(circle at 50% 45%, #14151a 0%, #0a0b0e 100%);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
        transition: opacity 0.25s ease;
      }
      .flipbook-overlay.hidden {
        display: none !important;
        opacity: 0;
        pointer-events: none;
      }

      .flipbook-container {
        width: 100vw;
        height: 100vh;
        max-width: 1360px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 16px 28px;
        box-sizing: border-box;
      }

      /* Header */
      .flipbook-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        z-index: 10;
      }
      .fb-head-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .fb-badge {
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        font-weight: 700;
        box-shadow: none;
      }
      .fb-zine-title {
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-size: 15px;
        font-weight: 600;
        color: #ffffff;
        letter-spacing: -0.01em;
      }
      .fb-pages-indicator {
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 3px 8px;
        border-radius: 6px;
      }

      .fb-head-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .fb-tool-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.16);
        color: #ffffff;
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-size: 12px;
        font-weight: 600;
        padding: 5px 12px;
        height: 32px;
        box-sizing: border-box;
        border-radius: 7px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .fb-tool-btn:hover {
        background: rgba(255, 255, 255, 0.16);
        border-color: rgba(255, 255, 255, 0.3);
      }
      .fb-tool-btn.primary {
        background: #ffffff;
        border-color: #ffffff;
        color: #000000;
        font-weight: 700;
      }
      .fb-tool-btn.primary:hover {
        background: #e6e6e6;
        border-color: #e6e6e6;
      }
      .fb-tool-btn.active {
        background: #ffffff;
        border-color: #ffffff;
        color: #000000;
        font-weight: 700;
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
      }
      .fb-icon-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .fb-close-btn {
        width: 32px;
        height: 32px;
        border-radius: 7px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.16);
        color: #ffffff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .fb-close-btn:hover {
        background: rgba(255, 255, 255, 0.18);
        border-color: rgba(255, 255, 255, 0.35);
      }

      /* Viewport */
      .flipbook-viewport {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        user-select: none;
      }

      .flipbook-viewport.mode-3d {
        perspective: 1800px;
        perspective-origin: 50% 48%;
      }
      .flipbook-viewport.mode-flat {
        perspective: none;
      }

      .fb-ambient-glow {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 65%);
        pointer-events: none;
      }

      /* ============================================================
         THE FIXED BOOK STAGE (ALWAYS 680px x 480px)
         Zero layout jumps or size snaps!
         ============================================================ */
      .fb-stage-wrap {
        position: relative;
        width: 680px;
        height: 480px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform-style: preserve-3d;
      }

      .flipbook-viewport.mode-3d .fb-stage-wrap {
        transform: rotateX(6deg);
      }
      .flipbook-viewport.mode-flat .fb-stage-wrap {
        transform: none !important;
      }

      /* Ground Shadow */
      .fb-book-ground-shadow {
        position: absolute;
        bottom: -24px;
        left: 50%;
        transform: translateX(-50%);
        width: 660px;
        height: 38px;
        background: radial-gradient(ellipse at 50% 50%, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.25) 50%, transparent 75%);
        filter: blur(9px);
        pointer-events: none;
        z-index: 0;
      }

      /* Subtle paper deck peeking out behind (only 8px rounded edge) */
      .fb-paper-deck {
        position: absolute;
        top: 6px;
        bottom: 6px;
        width: 330px;
        background: #ffffff;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        opacity: 0.94;
        pointer-events: none;
        display: none;
        z-index: 1;
      }
      .fb-paper-deck.visible {
        display: block;
      }
      .fb-deck-right {
        right: -8px;
        border-radius: 0 16px 16px 0;
      }
      .fb-deck-left {
        left: -8px;
        border-radius: 16px 0 0 16px;
      }

      /* The Book Spread Container */
      .fb-book-spread {
        position: relative;
        width: 680px;
        height: 480px;
        display: flex;
        z-index: 2;
        transform-style: preserve-3d;
      }

      /* Wing Left & Right */
      .fb-page-wing {
        position: relative;
        width: 340px;
        height: 480px;
        cursor: pointer;
        box-sizing: border-box;
      }

      .fb-wing-clip {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #ffffff;
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.55);
        transition: box-shadow 0.2s ease;
      }

      .fb-wing-left .fb-wing-clip {
        border-radius: 16px 0 0 16px;
      }
      .fb-wing-right .fb-wing-clip {
        border-radius: 0 16px 16px 0;
      }

      /* Desk backplate when page is closed */
      .fb-wing-clip.is-empty {
        background: rgba(255, 255, 255, 0.02);
        box-shadow: none;
        border: 1px dashed rgba(255, 255, 255, 0.08);
      }

      .fb-page-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        background: #ffffff;
      }

      /* Center Spine Crease Line */
      .fb-center-spine {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        width: 32px;
        transform: translateX(-50%);
        background: linear-gradient(
          to right,
          rgba(0, 0, 0, 0.24) 0%,
          rgba(0, 0, 0, 0.08) 30%,
          rgba(255, 255, 255, 0.12) 50%,
          rgba(0, 0, 0, 0.08) 70%,
          rgba(0, 0, 0, 0.24) 100%
        );
        pointer-events: none;
        z-index: 6;
      }

      .fb-inner-spine-shadow.left {
        position: absolute;
        top: 0;
        bottom: 0;
        right: 0;
        width: 32px;
        background: linear-gradient(to left, rgba(0, 0, 0, 0.22) 0%, transparent 100%);
        pointer-events: none;
        z-index: 4;
      }
      .fb-inner-spine-shadow.right {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 32px;
        background: linear-gradient(to right, rgba(0, 0, 0, 0.22) 0%, transparent 100%);
        pointer-events: none;
        z-index: 4;
      }

      .fb-paper-glare {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 55%);
        pointer-events: none;
      }

      .fb-page-footer-num {
        position: absolute;
        bottom: 10px;
        left: 14px;
        right: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 10px;
        font-weight: 700;
        color: rgba(0, 0, 0, 0.45);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        pointer-events: none;
        z-index: 5;
      }
      .centerfold-tag {
        color: #333333;
        font-weight: 800;
      }

      /* ============================================================
         3D TURNING PAGE LEAF (REALISTIC PAGE CURL / FLIP)
         ============================================================ */
      .fb-turning-leaf {
        position: absolute;
        top: 0;
        width: 340px;
        height: 480px;
        transform-style: preserve-3d;
        pointer-events: none;
        z-index: 20;
      }

      /* Next Page Turn (From Right to Left) */
      .fb-turning-leaf.is-turning-next {
        left: 340px;
        transform-origin: left center;
        transform: rotateY(0deg);
      }
      .fb-turning-leaf.is-turning-next.animate {
        transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        transform: rotateY(-180deg);
      }

      /* Prev Page Turn (From Left to Right) */
      .fb-turning-leaf.is-turning-prev {
        left: 0;
        transform-origin: right center;
        transform: rotateY(0deg);
      }
      .fb-turning-leaf.is-turning-prev.animate {
        transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        transform: rotateY(180deg);
      }

      .fb-leaf-face {
        position: absolute;
        inset: 0;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        overflow: hidden;
        background: #ffffff;
      }

      .fb-turning-leaf.is-turning-next .fb-leaf-front {
        border-radius: 0 16px 16px 0;
        transform: rotateY(0deg);
        box-shadow: 8px 18px 45px rgba(0, 0, 0, 0.45);
      }
      .fb-turning-leaf.is-turning-next .fb-leaf-back {
        border-radius: 16px 0 0 16px;
        transform: rotateY(180deg);
        box-shadow: -8px 18px 45px rgba(0, 0, 0, 0.45);
      }

      .fb-turning-leaf.is-turning-prev .fb-leaf-front {
        border-radius: 16px 0 0 16px;
        transform: rotateY(0deg);
        box-shadow: -8px 18px 45px rgba(0, 0, 0, 0.45);
      }
      .fb-turning-leaf.is-turning-prev .fb-leaf-back {
        border-radius: 0 16px 16px 0;
        transform: rotateY(-180deg);
        box-shadow: 8px 18px 45px rgba(0, 0, 0, 0.45);
      }

      .fb-leaf-shading {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.3);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.28s ease;
      }
      .fb-turning-leaf.animate .fb-leaf-shading {
        opacity: 0.28;
      }

      /* Nav Arrows */
      .fb-nav-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.16);
        color: #ffffff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s ease;
        z-index: 10;
      }
      .fb-nav-arrow:hover:not(:disabled) {
        background: #ffffff;
        color: #000000;
        border-color: #ffffff;
        transform: translateY(-50%) scale(1.05);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      }
      .fb-nav-arrow:disabled {
        opacity: 0.18;
        cursor: not-allowed;
      }
      .fb-nav-arrow.fb-prev { left: 24px; }
      .fb-nav-arrow.fb-next { right: 24px; }

      /* Footer */
      .flipbook-footer {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        z-index: 10;
      }
      .fb-spread-pills {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.06);
        padding: 4px;
        border-radius: 7px;
        border: 1px solid rgba(255, 255, 255, 0.14);
      }
      .fb-pill {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.65);
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 12px;
        height: 26px;
        box-sizing: border-box;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .fb-pill:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.12);
      }
      .fb-pill.active {
        background: #ffffff;
        color: #0a0a0e;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      }
      .fb-footer-hint {
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        text-align: center;
      }

      /* Responsive adjustments */
      @media (max-width: 820px) {
        .fb-stage-wrap,
        .fb-book-spread {
          width: 90vw;
          height: calc(90vw * 0.706);
        }
        .fb-page-wing,
        .fb-turning-leaf,
        .fb-paper-deck {
          width: 45vw;
          height: 100%;
        }
        .fb-turning-leaf.is-turning-next {
          left: 45vw;
        }
        .flipbook-container {
          padding: 12px 14px;
        }
      }
    `;

    const style = document.createElement('style');
    style.id = 'flipbook-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ============================================================
     EXPOSE GLOBAL
     ============================================================ */
  window.ZineFlipbook = {
    open: openFlipbook,
    close: closeFlipbook,
    renderSpread: applyStaticSpread,
    nextSpread: nextSpread,
    prevSpread: prevSpread
  };

})();
