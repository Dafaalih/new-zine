/**
 * ZINE ARCH SHOWCASE (zine-ring.js)
 * Modern Rainbow Arc Carousel framing the central hero headline & buttons.
 * Inspired by modern Awwwards arched hero showcases.
 */
(function () {
  'use strict';

  const ZINES = [
    {
      id: 'z1',
      title: "THINGS I CAN'T CHANGE",
      subtitle: 'vol. 01 · celestial clouds & stars',
      designer: '@kido__studio',
      tag: '01',
      bg: '#101a26',
      fg: '#ffffff',
      accent: '#38bdf8',
      image: 'assets/design/1.jpg'
    },
    {
      id: 'z2',
      title: 'CHANGE ON NOTHING',
      subtitle: 'vol. 02 · constellations & terrain',
      designer: '@kido__studio',
      tag: '02',
      bg: '#2b382d',
      fg: '#fef08a',
      accent: '#ec4899',
      image: 'assets/design/2.jpg'
    },
    {
      id: 'z3',
      title: 'VOID ARCHIVE',
      subtitle: 'vol. 03 · monochrome prints',
      designer: 'indie creator',
      tag: '03',
      bg: '#1c1c1e',
      fg: '#ffffff',
      accent: '#e4e4e7',
      image: 'assets/design/3.jpg'
    },
    {
      id: 'z4',
      title: 'NOTHING TO LOSE',
      subtitle: 'vol. 04 · because nothing is mine',
      designer: '@magnoliatats',
      tag: '04',
      bg: '#48457c',
      fg: '#f43f5e',
      accent: '#818cf8',
      image: 'assets/design/4.jpg'
    },
    {
      id: 'z5',
      title: 'SOLAR DREAMS',
      subtitle: 'vol. 05 · warm yellow daylight',
      designer: '@johnamarquis',
      tag: '05',
      bg: '#3a3418',
      fg: '#fef08a',
      accent: '#eab308',
      image: 'assets/design/5.jpg'
    },
    {
      id: 'z6',
      title: 'BOTANIC FOREST',
      subtitle: 'vol. 06 · emerald shades & foliage',
      designer: '@hadleyhendrix',
      tag: '06',
      bg: '#163321',
      fg: '#86efac',
      accent: '#22c55e',
      image: 'assets/design/6.jpg'
    },
    {
      id: 'z7',
      title: 'DUSK HORIZON',
      subtitle: 'vol. 07 · film grain & soft static',
      designer: 'indie creator',
      tag: '07',
      bg: '#232733',
      fg: '#cbd5e1',
      accent: '#64748b',
      image: 'assets/design/7.jpg'
    },
    {
      id: 'z8',
      title: 'ALONE BACK',
      subtitle: 'vol. 08 · crimson phone & star chain',
      designer: 'indie creator',
      tag: '08',
      bg: '#4a1515',
      fg: '#ffffff',
      accent: '#ef4444',
      image: 'assets/design/8.jpg'
    },
    {
      id: 'z9',
      title: 'MIDNIGHT BLUE',
      subtitle: 'vol. 09 · deep ocean frequencies',
      designer: 'indie creator',
      tag: '09',
      bg: '#192342',
      fg: '#93c5fd',
      accent: '#3b82f6',
      image: 'assets/design/9.jpg'
    },
    {
      id: 'z10',
      title: 'JORDANALAND',
      subtitle: 'vol. 10 · ornamental gothic rose',
      designer: '@toastiyyi',
      tag: '10',
      bg: '#2d2438',
      fg: '#f43f5e',
      accent: '#e879f9',
      image: 'assets/design/10.jpg'
    }
  ];

  // Carousel State
  let angle = 0;
  let targetAngle = 0;
  let velocity = 0;
  let isDragging = false;
  let hasMoved = false;
  let startX = 0;
  let lastX = 0;
  let autoRotate = true;
  let idleTimer = null;
  let rafId = null;
  let prefersReduced = false;

  // Arc Configuration
  const ANGLE_STEP = 20; // 20 degrees between adjacent cards

  // DOM Elements
  let viewportEl = null;
  let worldEl = null;
  let counterEl = null;
  let btnPrev = null;
  let btnNext = null;

  // Design Preview Modal Elements
  let modalEl = null;
  let modalImg = null;
  let modalCaption = null;
  let modalClose = null;
  let modalBackdrop = null;
  let modalPrev = null;
  let modalNext = null;
  let currentModalIndex = 0;

  const cards = [];

  function init() {
    viewportEl = document.getElementById('zss-stage-viewport');
    worldEl = document.getElementById('zss-world');
    counterEl = document.getElementById('zss-counter');
    btnPrev = document.getElementById('zss-nav-prev');
    btnNext = document.getElementById('zss-nav-next');

    // Modal elements
    modalEl = document.getElementById('zss-preview-modal');
    modalImg = document.getElementById('zss-modal-img');
    modalCaption = document.getElementById('zss-modal-caption');
    modalClose = document.getElementById('zss-modal-close');
    modalBackdrop = document.getElementById('zss-modal-backdrop');
    modalPrev = document.getElementById('zss-modal-prev');
    modalNext = document.getElementById('zss-modal-next');
    initModalEvents();

    if (!viewportEl || !worldEl) return;

    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      prefersReduced = mq.matches;
      const onMq = () => { prefersReduced = mq.matches; };
      if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onMq);
      else if (typeof mq.addListener === 'function') mq.addListener(onMq);
    }

    buildCards();
    bindEvents();
    initModalEvents();
    startAnimationLoop();
  }

  function getDimensions() {
    const w = window.innerWidth;
    const stageH = (viewportEl && viewportEl.clientHeight) || Math.round(window.innerHeight * 0.72);
    const isMobile = w < 640;
    const isTablet = !isMobile && w < 1025;

    let cardW, cardH, radiusX, radiusY;

    if (isMobile) {
      cardW = 82;
      cardH = 112;
      radiusX = Math.min(Math.max(w * 0.62, 210), 460);
      radiusY = stageH * 0.86;
    } else if (isTablet) {
      cardW = 116;
      cardH = 158;
      radiusX = Math.min(w * 0.52, 620);
      radiusY = stageH * 0.86;
    } else {
      cardW = 148;
      cardH = 202;
      radiusX = Math.min(Math.max(w * 0.47, 560), 980);
      radiusY = Math.min(stageH * 0.88, 800);
    }

    // Apex card sits near the top of the stage, fully visible.
    const apexY = cardH * 0.62;
    const yCenter = apexY - stageH / 2 + radiusY;

    return {
      isMobile,
      isTablet,
      radiusX,
      radiusY,
      yCenter,
      cardW,
      cardH,
      // How far along the arc cards stay visible (deg)
      visLimit: isMobile ? 74 : (isTablet ? 86 : 100)
    };
  }

  function buildCards() {
    worldEl.innerHTML = '';
    cards.length = 0;

    ZINES.forEach((zine, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'zss-card';
      cardEl.dataset.index = index;
      cardEl.dataset.id = zine.id;

      const coverContent = zine.image
        ? `<img src="${zine.image}" alt="${zine.title}" class="zss-card-img" loading="eager" draggable="false">`
        : (zine.coverSvg || '');

      cardEl.innerHTML = `
        <div class="zss-card-inner">
          <div class="zss-card-spine"></div>
          <div class="zss-card-cover">${coverContent}</div>
          <div class="zss-card-badge">${zine.tag}</div>
          <div class="zss-card-designer-pill">design by ${zine.designer || 'indie'}</div>
        </div>
      `;

      // Keep card corners visually flush with the cover artwork colour
      cardEl.style.setProperty('--card-bg', zine.bg);
      const innerEl = cardEl.querySelector('.zss-card-inner');
      if (innerEl) innerEl.style.background = zine.bg;

      cardEl.addEventListener('click', (e) => {
        if (hasMoved || Math.abs(velocity) > 0.6) return;
        e.stopPropagation();
        rotateToIndex(index);
        openDesignModal(index);
      });

      worldEl.appendChild(cardEl);

      cards.push({
        el: cardEl,
        data: zine,
        index: index,
        x: 0,
        y: 0,
        z: 0,
        rz: 0,
        scale: 1,
        opacity: 1
      });
    });
  }

  function rotateToIndex(targetIndex) {
    const N = cards.length;
    // Calculate current offset
    const currentActive = Math.round(-targetAngle / ANGLE_STEP);
    let diff = (targetIndex - currentActive) % N;
    if (diff > N / 2) diff -= N;
    if (diff < -N / 2) diff += N;

    targetAngle -= diff * ANGLE_STEP;

    // Reset auto-rotate timer
    if (idleTimer) clearTimeout(idleTimer);
    autoRotate = false;
    idleTimer = setTimeout(() => { autoRotate = true; }, 2600);

    const card = cards[targetIndex];
    if (card && card.el) {
      card.el.classList.add('pulse');
      setTimeout(() => card.el.classList.remove('pulse'), 450);
    }
  }

  function updateActiveCardTracking() {
    const N = cards.length;
    // Find card closest to apex (theta = 0)
    let bestIndex = 0;
    let minDiff = 999999;

    cards.forEach((c, i) => {
      let cardAngle = (angle + i * ANGLE_STEP) % 360;
      if (cardAngle > 180) cardAngle -= 360;
      if (cardAngle < -180) cardAngle += 360;

      const diff = Math.abs(cardAngle);
      if (diff < minDiff) {
        minDiff = diff;
        bestIndex = i;
      }
    });

    if (counterEl && cards[bestIndex]) {
      const z = cards[bestIndex].data;
      counterEl.textContent = `${z.tag} — 10 · ${z.title.toLowerCase()} · design by ${z.designer || 'indie'}`;
    }
  }

  function updateArchLayout() {
    const { radiusX, radiusY, yCenter, visLimit, isMobile, isTablet } = getDimensions();
    const N = cards.length;

    cards.forEach((c, i) => {
      // Calculate normalized angular position relative to apex (0 deg)
      let theta = (angle + i * ANGLE_STEP) % (N * ANGLE_STEP);
      const halfSpan = (N * ANGLE_STEP) / 2;
      if (theta > halfSpan) theta -= (N * ANGLE_STEP);
      if (theta < -halfSpan) theta += (N * ANGLE_STEP);

      const rad = (theta * Math.PI) / 180;
      const absTheta = Math.abs(theta);

      // Radial coordinates on a wide elliptical arch (wraps the hero text)
      const x = Math.sin(rad) * radiusX;
      const y = yCenter - Math.cos(rad) * radiusY;

      // Flat, tangent-to-arc rotation (no 3D perspective / tilt)
      const rz = theta;
      const scale = 1;

      // Smooth opacity falloff along descending flanks (melts naturally into background)
      let opacity = 1;
      const fadeStart = isMobile ? 38 : (isTablet ? 46 : 50);
      const fadeEnd = visLimit;
      if (absTheta > fadeStart) {
        const t = Math.min(1, Math.max(0, (absTheta - fadeStart) / (fadeEnd - fadeStart)));
        // Gentle ease-out curve so cards melt softly into the page background
        opacity = Math.max(0, 1 - Math.pow(t, 1.35));
      }

      // Hide cards outside visible arch range
      const isVisible = absTheta <= visLimit && opacity > 0.02;

      c.x = x;
      c.y = y;
      c.z = 0;
      c.rz = rz;
      c.scale = scale;
      c.opacity = opacity;

      if (!isVisible) {
        c.el.style.opacity = '0';
        c.el.style.pointerEvents = 'none';
        c.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rz.toFixed(1)}deg) scale(0.6)`;
      } else {
        c.el.style.opacity = opacity.toFixed(2);
        c.el.style.pointerEvents = 'auto';
        c.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rz.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      }
    });
  }

  function startAnimationLoop() {
    function tick() {
      // Gentle auto-rotation along the arch when idle
      if (autoRotate && !isDragging && !prefersReduced) {
        targetAngle += 0.08;
      }

      // Smooth interpolation (~600ms settle, ease-in-out feel)
      angle += (targetAngle - angle) * 0.10;

      // Friction momentum
      if (!isDragging && Math.abs(velocity) > 0.05) {
        targetAngle += velocity;
        velocity *= 0.92;
      }

      // Reduced motion: snap straight to target, no drift
      if (prefersReduced) {
        angle = targetAngle;
        velocity = 0;
      }

      updateArchLayout();
      updateActiveCardTracking();

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
  }

  function bindEvents() {
    if (!viewportEl) return;

    // Arrow Nav Buttons
    if (btnPrev) {
      btnPrev.addEventListener('click', (e) => {
        e.preventDefault();
        autoRotate = false;
        targetAngle += ANGLE_STEP;
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { autoRotate = true; }, 2600);
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', (e) => {
        e.preventDefault();
        autoRotate = false;
        targetAngle -= ANGLE_STEP;
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { autoRotate = true; }, 2600);
      });
    }

    // Drag / Touch along Arch
    const onPointerDown = (clientX) => {
      isDragging = true;
      hasMoved = false;
      startX = clientX;
      lastX = clientX;
      autoRotate = false;
      velocity = 0;
      if (idleTimer) clearTimeout(idleTimer);
    };

    const onPointerMove = (clientX) => {
      if (!isDragging) return;
      if (Math.abs(clientX - startX) > 6) hasMoved = true;
      const deltaX = clientX - lastX;
      velocity = deltaX * 0.22;
      targetAngle += velocity;
      lastX = clientX;
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        autoRotate = true;
      }, 2400);
    };

    viewportEl.addEventListener('mousedown', e => {
      // Don't drag if clicking buttons or links
      if (e.target.closest('button, a, input')) return;
      onPointerDown(e.clientX);
    });

    window.addEventListener('mousemove', e => {
      if (isDragging) onPointerMove(e.clientX);
    });

    window.addEventListener('mouseup', onPointerUp);

    // Touch
    viewportEl.addEventListener('touchstart', e => {
      if (e.target.closest('button, a, input')) return;
      if (e.touches && e.touches[0]) onPointerDown(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchmove', e => {
      if (isDragging && e.touches && e.touches[0]) onPointerMove(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchend', onPointerUp);

    // Mouse wheel
    viewportEl.addEventListener('wheel', e => {
      if (e.target.closest('.landing-actions, .landing-meta, .landing-accordion')) return;
      e.preventDefault();
      autoRotate = false;
      const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY);
      targetAngle += delta * 0.15;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        autoRotate = true;
      }, 2200);
    }, { passive: false });

    // Window resize
    window.addEventListener('resize', () => {
      updateArchLayout();
    });
  }

  /* ------------------------------------------------------------
     DESIGN PREVIEW MODAL
     ------------------------------------------------------------ */
  function renderModalDesign(index) {
    const N = ZINES.length;
    if (index < 0) index = N - 1;
    if (index >= N) index = 0;
    currentModalIndex = index;

    const z = ZINES[index];
    if (!z) return;

    if (modalImg) {
      modalImg.src = z.image;
      modalImg.alt = z.title;
    }
    if (modalCaption) {
      modalCaption.textContent = `design by ${z.designer || 'community artist'}`;
    }
  }

  function ensureModalElements() {
    if (!modalEl) {
      modalEl = document.getElementById('zss-preview-modal');
      modalImg = document.getElementById('zss-modal-img');
      modalCaption = document.getElementById('zss-modal-caption');
      modalClose = document.getElementById('zss-modal-close');
      modalBackdrop = document.getElementById('zss-modal-backdrop');
      modalPrev = document.getElementById('zss-modal-prev');
      modalNext = document.getElementById('zss-modal-next');
      initModalEvents();
    }
  }

  function openDesignModal(index) {
    ensureModalElements();
    if (!modalEl) return;
    renderModalDesign(index);
    modalEl.classList.add('active');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDesignModal() {
    ensureModalElements();
    if (!modalEl) return;
    modalEl.classList.remove('active');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initModalEvents() {
    if (!modalEl) return;

    if (modalClose) modalClose.addEventListener('click', closeDesignModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeDesignModal);
    if (modalImg) modalImg.addEventListener('click', closeDesignModal);

    if (modalPrev) {
      modalPrev.addEventListener('click', () => {
        renderModalDesign(currentModalIndex - 1);
        rotateToIndex(currentModalIndex);
      });
    }

    if (modalNext) {
      modalNext.addEventListener('click', () => {
        renderModalDesign(currentModalIndex + 1);
        rotateToIndex(currentModalIndex);
      });
    }

    window.addEventListener('keydown', (e) => {
      if (!modalEl || !modalEl.classList.contains('active')) return;
      if (e.key === 'Escape') closeDesignModal();
      if (e.key === 'ArrowLeft') {
        renderModalDesign(currentModalIndex - 1);
        rotateToIndex(currentModalIndex);
      }
      if (e.key === 'ArrowRight') {
        renderModalDesign(currentModalIndex + 1);
        rotateToIndex(currentModalIndex);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.openDesignModal = openDesignModal;
  window.closeDesignModal = closeDesignModal;
  window.ZineArchShowcase = {
    init: init,
    rotateToIndex: rotateToIndex,
    openModal: openDesignModal,
    closeModal: closeDesignModal,
    next: () => { if (btnNext) btnNext.click(); },
    prev: () => { if (btnPrev) btnPrev.click(); }
  };
})();
