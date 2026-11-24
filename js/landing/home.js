(function () {
  'use strict';

  /* ============================================================
     1. ACCORDION & GLITCH SCRAMBLE LOGIC
     ============================================================ */
  const GLITCH_GLYPHS = 'ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789!@#$%&*?/~';

  function triggerGlitch(el) {
    if (!el) return;
    const targetText = el.dataset.original || el.textContent.trim();
    const glitchWord = el.dataset.glitch || targetText.toUpperCase();
    if (el._glitchTimer) clearInterval(el._glitchTimer);

    el.classList.add('glitching');
    const startTime = Date.now();
    const totalDuration = 360;
    const phase1Duration = 120;

    el._glitchTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < phase1Duration) {
        let out = '';
        const len = Math.max(targetText.length, glitchWord.length);
        for (let i = 0; i < len; i++) {
          if (Math.random() < 0.35) {
            out += GLITCH_GLYPHS[Math.floor(Math.random() * GLITCH_GLYPHS.length)];
          } else {
            out += glitchWord[i] || GLITCH_GLYPHS[Math.floor(Math.random() * GLITCH_GLYPHS.length)];
          }
        }
        el.textContent = out;
      } else {
        const resolveProgress = Math.min(1, (elapsed - phase1Duration) / (totalDuration - phase1Duration));
        const resolvedCount = Math.floor(resolveProgress * targetText.length);
        
        let out = '';
        for (let i = 0; i < targetText.length; i++) {
          if (targetText[i] === ' ') {
            out += ' ';
          } else if (i < resolvedCount) {
            out += targetText[i];
          } else {
            out += GLITCH_GLYPHS[Math.floor(Math.random() * GLITCH_GLYPHS.length)];
          }
        }
        el.textContent = out;
      }

      if (elapsed >= totalDuration) {
        clearInterval(el._glitchTimer);
        el._glitchTimer = null;
        el.textContent = targetText;
        el.classList.remove('glitching');
      }
    }, 28);
  }

  function initAccordion() {
    const landing = document.querySelector('#screen-landing');
    if (!landing) return;

    const items = landing.querySelectorAll('.acc-item');

    items.forEach(item => {
      const btn = item.querySelector('.acc-head');
      const panel = item.querySelector('.acc-panel');
      if (!btn || !panel) return;

      const runGlitch = () => {
        const left = btn.querySelector('.split-left');
        const right = btn.querySelector('.split-right');
        if (left) triggerGlitch(left);
        if (right) triggerGlitch(right);
      };

      btn.addEventListener('mouseenter', runGlitch);

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        runGlitch();
        const isCurrentlyExpanded = btn.getAttribute('aria-expanded') === 'true';

        // 1. Close all other items
        items.forEach(otherItem => {
          const otherBtn = otherItem.querySelector('.acc-head');
          const otherPanel = otherItem.querySelector('.acc-panel');
          if (otherBtn && otherBtn !== btn) {
            otherBtn.setAttribute('aria-expanded', 'false');
            otherPanel.classList.remove('open');
            setTimeout(() => {
              if (otherBtn.getAttribute('aria-expanded') === 'false') {
                otherPanel.setAttribute('hidden', '');
              }
            }, 300);
          }
        });

        // 2. Toggle clicked item
        if (isCurrentlyExpanded) {
          btn.setAttribute('aria-expanded', 'false');
          panel.classList.remove('open');
          setTimeout(() => {
            if (btn.getAttribute('aria-expanded') === 'false') {
              panel.setAttribute('hidden', '');
            }
          }, 300);
        } else {
          panel.removeAttribute('hidden');
          // Trigger reflow to restart CSS animation cleanly
          void panel.offsetHeight;
          panel.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ============================================================
     2. THEME TOGGLE LOGIC (CLEAN LIGHT MODE <-> DARK MODE)
     ============================================================ */
  function initTheme() {
    const landing = document.querySelector('#screen-landing');
    if (!landing) return;

    const btnDark = document.querySelector('#landing-dot-dark');
    const btnLight = document.querySelector('#landing-dot-light');
    const STORAGE_KEY = 'zinemaker.landingTheme';

    function applyTheme(isDark) {
      if (isDark) {
        landing.classList.add('dark-mode');
        landing.classList.remove('light-mode');
        try { localStorage.setItem(STORAGE_KEY, 'dark'); } catch (e) {}
      } else {
        landing.classList.remove('dark-mode');
        landing.classList.add('light-mode');
        try { localStorage.setItem(STORAGE_KEY, 'light'); } catch (e) {}
      }
    }

    // Default: Clean light mode (editorial off-white #f2f2f2)
    let saved = 'light';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark') saved = 'dark';
    } catch (e) {}
    applyTheme(saved === 'dark');

    // Light dot -> Clean Light Mode
    if (btnLight) {
      btnLight.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        applyTheme(false);
      });
    }

    // Dark dot -> Clean Dark Mode
    if (btnDark) {
      btnDark.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        applyTheme(true);
      });
    }
  }

  /* ============================================================
     3. 3D ROTATING DESIGN RING SHOWCASE ("OTHER WORK")
     ============================================================ */
  function init3DRingShowcase() {
    const cylinder = document.querySelector('#ring-cylinder');
    const stageContainer = document.querySelector('#ring-stage-container');
    if (!cylinder || !stageContainer) return;

    const DESIGNS = [
      { id: '1', title: "THINGS I CAN'T CHANGE", tag: '01', img: 'assets/design/1.jpg', designer: '@kido__studio' },
      { id: '2', title: 'CHANGE ON NOTHING', tag: '02', img: 'assets/design/2.jpg', designer: '@kido__studio' },
      { id: '3', title: 'VOID ARCHIVE', tag: '03', img: 'assets/design/3.jpg', designer: 'indie creator' },
      { id: '4', title: 'NOTHING TO LOSE', tag: '04', img: 'assets/design/4.jpg', designer: '@magnoliatats' },
      { id: '5', title: 'SOLAR DREAMS', tag: '05', img: 'assets/design/5.jpg', designer: '@johnamarquis' },
      { id: '6', title: 'BOTANIC FOREST', tag: '06', img: 'assets/design/6.jpg', designer: '@hadleyhendrix' },
      { id: '7', title: 'DUSK HORIZON', tag: '07', img: 'assets/design/7.jpg', designer: 'indie creator' },
      { id: '8', title: 'ALONE BACK', tag: '08', img: 'assets/design/8.jpg', designer: 'indie creator' },
      { id: '9', title: 'MIDNIGHT BLUE', tag: '09', img: 'assets/design/9.jpg', designer: 'indie creator' },
      { id: '10', title: 'CHERRY BLOSSOM', tag: '10', img: 'assets/design/10.jpg', designer: 'indie creator' }
    ];

    cylinder.innerHTML = '';
    const cards = [];

    // Create 3D cards
    DESIGNS.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'ring-card';
      card.setAttribute('data-index', index);
      card.innerHTML = `
        <span class="ring-card-tag">${item.tag}</span>
        <img class="ring-card-img" src="${item.img}" alt="${item.title}" loading="lazy">
        <div class="ring-card-title">${item.title}</div>
      `;
      cylinder.appendChild(card);
      cards.push(card);
    });

    let currentRotation = 0;
    let targetRotation = 0;
    let tiltX = 0;
    let targetTiltX = 0;
    let isPointerDown = false;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startRotation = 0;
    let velocity = 0;
    let dragDistance = 0;
    let lastX = 0;
    let lastTime = performance.now();
    let downCard = null;
    let isHovering = false;
    let animId = null;

    function getCardDimensions() {
      const first = cards[0];
      const w = first ? first.offsetWidth : 168;
      const count = DESIGNS.length;
      // Radius with clean breathing room from the side typography
      const radius = Math.round((w / 2) / Math.tan(Math.PI / count)) + 12;
      return { width: w, radius: radius };
    }

    function positionCards() {
      const { radius } = getCardDimensions();
      const count = DESIGNS.length;
      const step = 360 / count;

      cards.forEach((card, i) => {
        const angle = i * step;
        card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
      });
    }

    positionCards();
    window.addEventListener('resize', positionCards);

    function openCardModal(idx) {
      const count = DESIGNS.length;
      const step = 360 / count;
      const targetAngle = -idx * step;

      const diff = (targetAngle - targetRotation) % 360;
      let normalizedDiff = diff;
      if (diff > 180) normalizedDiff -= 360;
      if (diff < -180) normalizedDiff += 360;
      targetRotation += normalizedDiff;

      // Open preview modal
      if (typeof window.openDesignModal === 'function') {
        window.openDesignModal(idx);
      } else if (window.ZineArchShowcase && typeof window.ZineArchShowcase.openModal === 'function') {
        window.ZineArchShowcase.openModal(idx);
      } else {
        const modal = document.getElementById('zss-preview-modal');
        const img = document.getElementById('zss-modal-img');
        const caption = document.getElementById('zss-modal-caption');
        if (modal && DESIGNS[idx]) {
          if (img) {
            img.src = DESIGNS[idx].img;
            img.alt = DESIGNS[idx].title;
          }
          if (caption) {
            caption.textContent = `design by ${DESIGNS[idx].designer || 'community artist'}`;
          }
          modal.classList.add('active');
          modal.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
        }
      }
    }

    // Drag / Swipe / Click Interaction
    stageContainer.addEventListener('pointerdown', (e) => {
      isPointerDown = true;
      isDragging = false;
      downCard = e.target.closest('.ring-card');
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      startRotation = targetRotation;
      velocity = 0;
      dragDistance = 0;
      lastTime = performance.now();
    });

    stageContainer.addEventListener('pointermove', (e) => {
      const rect = stageContainer.getBoundingClientRect();
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      targetTiltX = -relY * 6; // subtle 3D tilt

      // ONLY drag if mouse/finger is actually held down!
      if (!isPointerDown) return;

      const totalDist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (totalDist > 6) {
        if (!isDragging) {
          isDragging = true;
          try { stageContainer.setPointerCapture(e.pointerId); } catch (err) {}
        }
        const dx = e.clientX - startX;
        dragDistance = totalDist;
        targetRotation = startRotation + dx * 0.35;

        const now = performance.now();
        const dt = Math.max(now - lastTime, 16);
        velocity = (e.clientX - lastX) / dt * 10;
        lastX = e.clientX;
        lastTime = now;
      }
    });

    function handlePointerUp(e) {
      if (!isPointerDown) return;
      isPointerDown = false;

      if (isDragging) {
        isDragging = false;
        try { stageContainer.releasePointerCapture(e.pointerId); } catch (err) {}
      } else if (downCard) {
        // Clean tap/click on a card
        const idx = parseInt(downCard.getAttribute('data-index'), 10);
        if (!isNaN(idx)) {
          openCardModal(idx);
        }
      }
      downCard = null;
    }

    stageContainer.addEventListener('pointerup', handlePointerUp);
    stageContainer.addEventListener('pointercancel', (e) => {
      isPointerDown = false;
      isDragging = false;
      try { stageContainer.releasePointerCapture(e.pointerId); } catch (err) {}
      downCard = null;
    });

    stageContainer.addEventListener('mouseenter', () => { isHovering = true; });
    stageContainer.addEventListener('mouseleave', () => {
      isHovering = false;
      isPointerDown = false;
      targetTiltX = 0;
    });

    // Also support direct click event on cards
    cards.forEach((card, i) => {
      card.addEventListener('click', (e) => {
        if (isDragging || dragDistance > 8) return;
        openCardModal(i);
      });
    });

    // Animation Loop
    function animate() {
      const landing = document.getElementById('screen-landing');
      if (landing && !landing.classList.contains('active')) {
        animId = requestAnimationFrame(animate);
        return;
      }

      if (!isDragging) {
        if (Math.abs(velocity) > 0.05) {
          targetRotation += velocity;
          velocity *= 0.93; // momentum decay
        } else {
          // Gentle auto-rotation when idle
          const speed = isHovering ? 0.06 : 0.22;
          targetRotation -= speed;
        }
      }

      // Smooth lerp
      currentRotation += (targetRotation - currentRotation) * 0.12;
      tiltX += (targetTiltX - tiltX) * 0.10;

      cylinder.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${currentRotation.toFixed(2)}deg)`;

      // Depth lighting: brighten front-facing cards, dim back cards
      const count = DESIGNS.length;
      const step = 360 / count;
      cards.forEach((card, i) => {
        const cardAngle = (i * step + currentRotation) % 360;
        const rad = (cardAngle * Math.PI) / 180;
        const cos = Math.cos(rad); // 1 = facing front, -1 = facing back
        if (cos > 0) {
          card.style.opacity = (0.75 + cos * 0.25).toFixed(2);
          card.style.filter = `brightness(${(85 + cos * 20).toFixed(0)}%)`;
        } else {
          card.style.opacity = Math.max(0.35, (0.75 + cos * 0.4)).toFixed(2);
          card.style.filter = `brightness(70%)`;
        }
      });

      animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);
  }

  /* ============================================================
     INITIALIZATION
     ============================================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAccordion();
      initTheme();
      init3DRingShowcase();
    });
  } else {
    initAccordion();
    initTheme();
    init3DRingShowcase();
  }
})();
