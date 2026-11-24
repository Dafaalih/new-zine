/* ============================================================
   ZINE MAKER â€” APP.JS (REWRITTEN ZOOM/LAYOUT)
   PART 1 OF 3: State, helpers, data, screens 1-3
   ============================================================ */
(function () {
'use strict';

/* ============================================================
   CONSTANTS
   ============================================================ */
const SHEET = { W: 1748, H: 1240, COLS: 4, ROWS: 2, FW: 437, FH: 620 };

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const STORAGE_KEY = 'zinemaker.saved';

let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

const fq = name => '"' + String(name || 'Inter').replace(/["']/g, '') + '"';
const cleanFont = name => String(name || 'Inter').replace(/["']/g, '');

function toHex(v) {
  if (typeof v !== 'string') return '#ffffff';
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return ('#' + v.slice(1).split('').map(c => c + c).join('')).toLowerCase();
  }
  return '#ffffff';
}

function isDark(hex) {
  const h = toHex(hex).slice(1);
  const r = parseInt(h.substr(0, 2), 16);
  const g = parseInt(h.substr(2, 2), 16);
  const b = parseInt(h.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function downscaleDataURL(src, max) {
  return new Promise(resolve => {
    const im = new Image();
    im.onload = () => {
      if (im.width <= max && im.height <= max) return resolve(src);
      const s = Math.min(max / im.width, max / im.height);
      const cv = document.createElement('canvas');
      cv.width = Math.round(im.width * s);
      cv.height = Math.round(im.height * s);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      resolve(cv.toDataURL('image/png'));
    };
    im.onerror = () => resolve(src);
    im.src = src;
  });
}

/* ============================================================
   DATA
   ============================================================ */
const FONT_LIST = [
  'Inter', 'Space Grotesk', 'Special Elite', 'Permanent Marker', 'Caveat',
  'Archivo Black', 'Rubik Mono One', 'DM Serif Display', 'Playfair Display',
  'Courier Prime', 'Silkscreen', 'Press Start 2P'
];

const BASE_PALETTE = ['#000000', '#ffffff', '#000000'];
const BG_PRESETS = [
  '#000000', '#ff5c5c', '#ffd9d9', '#7a0505', '#3d0202', '#ffffff',
  '#f2f2f2', '#d9d9d9', '#a6a6a6', '#666666', '#333333', '#000000'
];

const MOODBOARDS = [
  {
    id: 'punk-xerox', name: 'punk xerox', meta: 'special elite \u00B7 courier prime',
    palette: ['#000000', '#ffffff', '#000000', '#ffd9d9'],
    swatch: ['k', 'w', 'r', 'c:#ffd9d9'],
    bg: '#000000', ink: '#ffffff', accent: '#000000',
    titleFont: 'Special Elite', bodyFont: 'Courier Prime',
    block: 'rect', sticker: 'skull'
  },
  {
    id: 'red-riot', name: 'red riot', meta: 'archivo black \u00B7 inter',
    palette: ['#000000', '#ffffff', '#000000', '#ff5c5c'],
    swatch: ['r', 'w', 'k', 'c:#ff5c5c'],
    bg: '#000000', ink: '#ffffff', accent: '#000000',
    titleFont: 'Archivo Black', bodyFont: 'Inter',
    block: 'blob', sticker: 'flame'
  },
  {
    id: 'retro-pixel', name: 'retro pixel', meta: 'press start 2p \u00B7 silkscreen',
    palette: ['#000000', '#ffffff', '#000000', '#3d0202'],
    swatch: ['r', 'w', 'k', 'c:#3d0202'],
    bg: '#000000', ink: '#ffffff', accent: '#ffffff',
    titleFont: 'Press Start 2P', bodyFont: 'Silkscreen',
    block: 'rect', sticker: 'star'
  },
  {
    id: 'photocopy-noir', name: 'photocopy noir', meta: 'courier prime \u00B7 inter',
    palette: ['#ffffff', '#000000', '#000000', '#a6a6a6'],
    swatch: ['w', 'k', 'r', 'c:#a6a6a6'],
    bg: '#ffffff', ink: '#000000', accent: '#000000',
    titleFont: 'Courier Prime', bodyFont: 'Inter',
    block: 'line', sticker: 'heart'
  },
  {
    id: 'gothic-floral', name: 'gothic floral', meta: 'dm serif display \u00B7 playfair',
    palette: ['#000000', '#ffffff', '#000000', '#7a0505'],
    swatch: ['r', 'w', 'k', 'c:#7a0505'],
    bg: '#000000', ink: '#ffffff', accent: '#7a0505',
    titleFont: 'DM Serif Display', bodyFont: 'Playfair Display',
    block: 'circle', sticker: 'flower'
  },
  {
    id: 'sticker-bomb', name: 'sticker bomb', meta: 'permanent marker \u00B7 archivo black',
    palette: ['#000000', '#ffffff', '#000000', '#ffd9d9'],
    swatch: ['r', 'w', 'k', 'c:#ffd9d9'],
    bg: '#000000', ink: '#ffffff', accent: '#000000',
    titleFont: 'Permanent Marker', bodyFont: 'Archivo Black',
    block: 'blob', sticker: 'heart'
  }
];

const ZINE8_FRAMES = [
  { id: 'back', label: 'BACK COVER', row: 1, col: 0, page: 8 },
  { id: 'cover', label: 'FRONT COVER', row: 1, col: 1, page: 1 },
  { id: '1', label: 'PAGE 1', row: 1, col: 2, page: 2 },
  { id: '2', label: 'PAGE 2', row: 1, col: 3, page: 3 },
  { id: '6', label: 'PAGE 6', row: 0, col: 0, page: 7, rotated: true },
  { id: '5', label: 'PAGE 5', row: 0, col: 1, page: 6, rotated: true },
  { id: '4', label: 'PAGE 4', row: 0, col: 2, page: 5, rotated: true },
  { id: '3', label: 'PAGE 3', row: 0, col: 3, page: 4, rotated: true }
];

/* ============================================================
   STATE + THEME
   ============================================================ */
function defaultTheme() {
  return {
    palette: BASE_PALETTE.slice(),
    titleFont: 'Inter',
    bodyFont: 'Inter',
    bg: '#ffffff',
    ink: '#000000',
    accent: '#000000'
  };
}

function themeFromMood(id) {
  const m = MOODBOARDS.find(x => x.id === id);
  if (!m) return defaultTheme();
  return {
    palette: m.palette.slice(),
    titleFont: cleanFont(m.titleFont),
    bodyFont: cleanFont(m.bodyFont || 'Inter'),
    bg: m.bg,
    ink: m.ink,
    accent: m.accent
  };
}

const state = {
  format: 'zine8',
  ratio: null,
  designMode: 'framed', // 'framed' | 'free'
  activeFrameId: 'cover',
  pageCount: 8,
  pageW: 495,
  pageH: 700,
  pages: [],
  active: 0,
  mood: null,
  theme: defaultTheme(),
  zoom: 1,
  mode: 'edit',
  snap: true,
  loading: false,
  busy: false,
  crop: null,
  clipboard: null,
  guides: true,
  safeArea: false,
  doodleMode: false,
  doodleColor: '#000000',
  doodleSize: 4,
  doodleBrush: 'pen',
  sheet: null,
  frameBackgrounds: {}
};

function activePage() { return state.pages[state.active] || null; }
function activeCanvas() { const p = activePage(); return p ? p.canvas : null; }

function palette() {
  const extra = (state.theme && state.theme.palette) ? state.theme.palette : [];
  return Array.from(new Set(BASE_PALETTE.concat(extra)));
}

/* ============================================================
   SCREENS 1-3: LANDING / TYPE / MOOD
   ============================================================ */
const screens = {
  landing: $('#screen-landing'),
  editor: $('#screen-editor'),
  photoEditor: $('#screen-photo-editor')
};

function showScreen(name) {
  Object.keys(screens).forEach(k => {
    if (screens[k]) screens[k].classList.remove('active');
  });
  if (screens[name]) screens[name].classList.add('active');
  window.scrollTo(0, 0);
}

$('#btn-start-zine').addEventListener('click', () => goType());
if ($('#btn-open-photo-editor')) {
  $('#btn-open-photo-editor').addEventListener('click', () => {
    showScreen('photoEditor');
    if (window.ZinePhotoEditor && window.ZinePhotoEditor.init) {
      window.ZinePhotoEditor.init();
    }
  });
}
if ($('#poster-btn-details')) {
  $('#poster-btn-details').addEventListener('click', () => goType());
}
if ($('#poster-floating-pill')) {
  $('#poster-floating-pill').addEventListener('click', () => goType());
}
if ($('#footer-btn-start')) {
  $('#footer-btn-start').addEventListener('click', () => goType());
}
if ($('#footer-btn-photo')) {
  $('#footer-btn-photo').addEventListener('click', () => {
    showScreen('photoEditor');
    if (window.ZinePhotoEditor && window.ZinePhotoEditor.init) {
      window.ZinePhotoEditor.init();
    }
  });
}
if ($('#footer-back-to-top')) {
  $('#footer-back-to-top').addEventListener('click', () => {
    const landingScreen = $('#screen-landing');
    if (landingScreen) {
      landingScreen.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

/* ============================================================
   3D PHOTO SPHERE ENGINE (TRUE 3D PLANAR PHOTOS FROM PHOTOS FOLDER)
   ============================================================ */
const PHOTOS_IN_FOLDER = [
  { src: 'photos/pixel-art-photo-1794161154441.png', caption: 'pixel art photo 01' },
  { src: 'photos/pixel-art-photo-1794162608550.png', caption: 'pixel art photo 02' },
  { src: 'photos/pixel-art-photo-1794164358092.png', caption: 'pixel art photo 03' },
  { src: 'photos/pixel-art-photo-1794164434852.png', caption: 'pixel art photo 04' },
  { src: 'photos/pixel-art-photo-1794164501420.png', caption: 'pixel art photo 05' }
];

// Distribute photos across 40 Fibonacci sphere nodes matching video reference
const PHOTO_SPHERE_ITEMS = [];
const TOTAL_SPHERE_NODES = 40;
for (let i = 0; i < TOTAL_SPHERE_NODES; i++) {
  const photo = PHOTOS_IN_FOLDER[i % PHOTOS_IN_FOLDER.length];
  PHOTO_SPHERE_ITEMS.push({
    src: photo.src,
    caption: photo.caption
  });
}

function openPhotoZoom(src, caption) {
  const overlay = $('#photo-zoom-overlay');
  const img = $('#photo-zoom-img');
  const cap = $('#photo-zoom-caption');
  if (!overlay || !img || !cap) return;

  img.src = src;
  cap.textContent = caption || 'pixel art photo';
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closePhotoZoom() {
  const overlay = $('#photo-zoom-overlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

if ($('#photo-zoom-close')) {
  $('#photo-zoom-close').addEventListener('click', closePhotoZoom);
}
if ($('#photo-zoom-backdrop')) {
  $('#photo-zoom-backdrop').addEventListener('click', closePhotoZoom);
}
if ($('#photo-zoom-img')) {
  $('#photo-zoom-img').addEventListener('click', closePhotoZoom);
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePhotoZoom();
});

function initPhotoSphere3D() {
  const stage = $('#photo-sphere-stage');
  const viewport = $('#photo-sphere-viewport');
  if (!stage || !viewport) return;

  stage.innerHTML = '';
  const photoElements = [];
  const N = PHOTO_SPHERE_ITEMS.length;

  // Generate 3D points on sphere using Fibonacci Spiral lattice
  const points = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2; // from 1 down to -1
    const rAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * 2.399963229728653; // golden angle
    const x = Math.cos(phi) * rAtY;
    const z = Math.sin(phi) * rAtY;
    points.push({ x, y, z });
  }

  // Create photo DOM elements
  PHOTO_SPHERE_ITEMS.forEach((item, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'photo-sphere-thumb';
    thumb.innerHTML = `<img src="${item.src}" alt="${item.caption}" class="photo-thumb-img" loading="lazy">`;

    thumb.addEventListener('click', () => {
      if (dragDist < 8) {
        openPhotoZoom(item.src, item.caption);
      }
    });

    stage.appendChild(thumb);
    photoElements.push({
      el: thumb,
      baseX: points[idx].x,
      baseY: points[idx].y,
      baseZ: points[idx].z
    });
  });

  // Calculate 3D sphere radii based on viewport size
  function getSphereRadii() {
    const rect = viewport.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const isMobile = rect.width < 600;
    const base = Math.min(centerX * 0.70, centerY * 0.85);
    const R = isMobile ? Math.min(base, 160) : Math.min(base, 275);
    return {
      Rx: R,
      Ry: R * 0.94,
      Rz: R
    };
  }

  // Position each card at (x, y, z) in the 3D stage
  function layoutThumbs() {
    const { Rx, Ry, Rz } = getSphereRadii();
    photoElements.forEach((item, idx) => {
      const pt = points[idx];
      const x = pt.x * Rx;
      const y = pt.y * Ry;
      const z = pt.z * Rz;
      item.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px)`;
    });
  }

  layoutThumbs();
  window.addEventListener('resize', layoutThumbs);

  // 3D Physics & Drag Variables (Full 360° Trackball Matrix)
  let m = [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ];

  function rotateMatrix(mat, angleX, angleY) {
    if (Math.abs(angleX) < 1e-6 && Math.abs(angleY) < 1e-6) return mat;
    const cx = Math.cos(angleX), sx = Math.sin(angleX);
    const cy = Math.cos(angleY), sy = Math.sin(angleY);

    const r00 = cy,        r01 = 0,  r02 = sy;
    const r10 = sx * sy,   r11 = cx, r12 = -sx * cy;
    const r20 = -cx * sy,  r21 = sx, r22 = cx * cy;

    const n00 = r00 * mat[0] + r01 * mat[3] + r02 * mat[6];
    const n01 = r00 * mat[1] + r01 * mat[4] + r02 * mat[7];
    const n02 = r00 * mat[2] + r01 * mat[5] + r02 * mat[8];

    const n10 = r10 * mat[0] + r11 * mat[3] + r12 * mat[6];
    const n11 = r10 * mat[1] + r11 * mat[4] + r12 * mat[7];
    const n12 = r10 * mat[2] + r11 * mat[5] + r12 * mat[8];

    const n20 = r20 * mat[0] + r21 * mat[3] + r22 * mat[6];
    const n21 = r20 * mat[1] + r21 * mat[4] + r22 * mat[7];
    const n22 = r20 * mat[2] + r21 * mat[5] + r22 * mat[8];

    let len0 = Math.hypot(n00, n01, n02) || 1;
    let o00 = n00 / len0, o01 = n01 / len0, o02 = n02 / len0;

    let dot = n10 * o00 + n11 * o01 + n12 * o02;
    let t10 = n10 - dot * o00, t11 = n11 - dot * o01, t12 = n12 - dot * o02;
    let len1 = Math.hypot(t10, t11, t12) || 1;
    let o10 = t10 / len1, o11 = t11 / len1, o12 = t12 / len1;

    let o20 = o01 * o12 - o02 * o11;
    let o21 = o02 * o10 - o00 * o12;
    let o22 = o00 * o11 - o01 * o10;

    return [o00, o01, o02, o10, o11, o12, o20, o21, o22];
  }

  // Initial tilt matching aesthetic
  m = rotateMatrix(m, -0.12, 0);

  let velY = 0.0032;
  let velX = 0;
  let isDragging = false;
  let startX = 0, startY = 0;
  let lastX = 0, lastY = 0;
  let dragDist = 0;
  let isHovered = false;

  viewport.addEventListener('mouseenter', () => { isHovered = true; });
  viewport.addEventListener('mouseleave', () => { isHovered = false; });

  // Pointer drag events for desktop & touch
  viewport.addEventListener('pointerdown', (e) => {
    isDragging = true;
    dragDist = 0;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    viewport.classList.add('is-dragging');
    try { viewport.setPointerCapture(e.pointerId); } catch(err) {}
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    dragDist += Math.abs(dx) + Math.abs(dy);

    const ax = -dy * 0.0048;
    const ay = dx * 0.0048;

    m = rotateMatrix(m, ax, ay);
    velY = ay;
    velX = ax;

    lastX = e.clientX;
    lastY = e.clientY;
  });

  const stopDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove('is-dragging');
    try { viewport.releasePointerCapture(e.pointerId); } catch(err) {}
  };

  viewport.addEventListener('pointerup', stopDrag);
  viewport.addEventListener('pointercancel', stopDrag);

  // Render Loop with GPU Native 3D Transform
  function render() {
    if (viewport.offsetParent === null) {
      setTimeout(() => requestAnimationFrame(render), 800);
      return;
    }
    if (!isDragging) {
      if (!isHovered) {
        m = rotateMatrix(m, velX, velY);
      }
      velY *= 0.95;
      velX *= 0.95;
      if (Math.abs(velY) < 0.0022) velY = 0.0022;
    }

    // Apply native CSS 3D transform to stage:
    // Every card rotates in true 3D perspective, turns edge-on from the side,
    // and can be rotated 360 degrees endlessly in all directions!
    stage.style.transform = `matrix3d(${m[0].toFixed(6)}, ${m[3].toFixed(6)}, ${m[6].toFixed(6)}, 0, ${m[1].toFixed(6)}, ${m[4].toFixed(6)}, ${m[7].toFixed(6)}, 0, ${m[2].toFixed(6)}, ${m[5].toFixed(6)}, ${m[8].toFixed(6)}, 0, 0, 0, 0, 1)`;

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

// Initialize 3D Photo Sphere on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhotoSphere3D);
} else {
  initPhotoSphere3D();
}
if ($('#btn-photo-back')) {
  $('#btn-photo-back').addEventListener('click', () => showScreen('landing'));
}
if ($('#btn-edit-post')) $('#btn-edit-post').addEventListener('click', () => goType());

$('#btn-resume').addEventListener('click', () => {
  if (window.__zineOpenProject) window.__zineOpenProject();
});

let chosenFormat = 'zine8';
let chosenRatio = null;
let chosenDesignMode = 'framed'; // 'framed' | 'free'

function goType() {
  openEditor(null);
}

let selectedMood = null;

function renderMoods() {
  const grid = $('#moodGrid');
  if (!grid) return;
  grid.innerHTML = '';
  MOODBOARDS.forEach(m => {
    const card = document.createElement('button');
    card.className = 'mood-card';
    card.dataset.mood = m.id;

    const cv = document.createElement('canvas');
    cv.width = 210;
    cv.height = 296;
    card.appendChild(cv);

    const name = document.createElement('span');
    name.className = 'mood-name';
    name.textContent = m.name;
    card.appendChild(name);

    const meta = document.createElement('span');
    meta.className = 'mood-meta';
    meta.textContent = m.meta;
    card.appendChild(meta);

    const sw = document.createElement('div');
    sw.className = 'swatches';
    m.swatch.forEach(s => {
      const sp = document.createElement('span');
      const cls = s.slice(0, 1);
      sp.className = 'swatch ' + cls;
      if (cls === 'c') sp.style.setProperty('--custom', s.slice(2));
      sw.appendChild(sp);
    });
    card.appendChild(sw);

    grid.appendChild(card);
    paintMoodThumb(cv, m);

    card.addEventListener('click', () => {
      $$('.mood-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedMood = m.id;
      $('#btn-use-mood')?.classList.remove('hidden');
    });
  });
}

function drawSticker(ctx, type, x, y, size, color, bg) {
  ctx.save();
  ctx.translate(x, y);
  const r = size / 2;
  ctx.fillStyle = color;
  switch (type) {
    case 'star':
      ctx.beginPath();
      ctx.moveTo(0, -r); ctx.lineTo(r * 0.22, -r * 0.22); ctx.lineTo(r, 0);
      ctx.lineTo(r * 0.22, r * 0.22); ctx.lineTo(0, r); ctx.lineTo(-r * 0.22, r * 0.22);
      ctx.lineTo(-r, 0); ctx.lineTo(-r * 0.22, -r * 0.22);
      ctx.closePath(); ctx.fill();
      break;
    case 'heart':
      ctx.beginPath();
      ctx.moveTo(0, r * 0.85);
      ctx.bezierCurveTo(r * 1.35, r * 0.1, r * 0.62, -r * 0.95, 0, -r * 0.35);
      ctx.bezierCurveTo(-r * 0.62, -r * 0.95, -r * 1.35, r * 0.1, 0, r * 0.85);
      ctx.closePath(); ctx.fill();
      break;
    case 'flower':
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2;
        ctx.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.3, 0, Math.PI * 2);
      }
      ctx.fill();
      break;
    case 'skull':
      ctx.beginPath();
      ctx.arc(0, -r * 0.05, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(-r * 0.32, -r * 0.15, r * 0.17, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.32, -r * 0.15, r * 0.17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color;
      for (let i = -2; i <= 2; i++) ctx.fillRect(i * r * 0.26 - r * 0.07, r * 0.5, r * 0.14, r * 0.5);
      break;
    case 'flame':
      ctx.beginPath();
      ctx.moveTo(0, r);
      ctx.bezierCurveTo(r * 1.15, r * 0.45, r * 0.8, -r * 0.35, r * 0.3, -r * 0.75);
      ctx.bezierCurveTo(r * 0.05, -r * 0.15, 0, 0, 0, 0);
      ctx.bezierCurveTo(0, 0, -r * 0.05, -r * 0.15, -r * 0.3, -r * 0.75);
      ctx.bezierCurveTo(-r * 0.8, -r * 0.35, -r * 1.15, r * 0.45, 0, r);
      ctx.closePath(); ctx.fill();
      break;
    default:
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function paintMoodThumb(cv, m) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = m.bg;
  ctx.fillRect(0, 0, W, H);

  const dark = isDark(m.bg);
  const hair = dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.22)';

  ctx.strokeStyle = hair;
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, W - 24, H - 24);

  ctx.fillStyle = m.ink;
  ctx.globalAlpha = .6;
  ctx.font = '12px "Inter", Arial, sans-serif';
  ctx.fillText('zine', W - 48, 36);
  ctx.globalAlpha = 1;

  const title = m.name.toUpperCase();
  let size = 26;
  ctx.font = size + 'px ' + fq(m.titleFont);
  while (ctx.measureText(title).width > W - 60 && size > 12) {
    size -= 2;
    ctx.font = size + 'px ' + fq(m.titleFont);
  }
  ctx.fillStyle = m.ink;
  ctx.fillText(title, 24, 64);

  ctx.strokeStyle = m.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(24, 82);
  ctx.lineTo(24 + W * 0.45, 82);
  ctx.stroke();

  ctx.fillStyle = m.accent;
  if (m.block === 'rect') {
    ctx.fillRect(24, 110, W * 0.55, 55);
  } else if (m.block === 'circle') {
    ctx.beginPath(); ctx.arc(24 + W * 0.28, 137, 38, 0, Math.PI * 2); ctx.fill();
  } else if (m.block === 'line') {
    ctx.fillRect(24, 145, W - 48, 8);
  } else {
    const bx = 24 + W * 0.28, by = 137, br = 40;
    ctx.beginPath();
    ctx.moveTo(bx, by - br);
    ctx.quadraticCurveTo(bx + br * 1.2, by - br * 0.6, bx + br, by);
    ctx.quadraticCurveTo(bx + br * 1.1, by + br * 0.7, bx, by + br);
    ctx.quadraticCurveTo(bx - br * 1.1, by + br * 0.7, bx - br, by);
    ctx.quadraticCurveTo(bx - br * 1.2, by - br * 0.6, bx, by - br);
    ctx.fill();
  }

  const body = dark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.3)';
  ctx.strokeStyle = body;
  ctx.lineWidth = 3;
  [0.66, 0.72, 0.78, 0.84].forEach((fy, i, arr) => {
    ctx.beginPath();
    ctx.moveTo(24, H * fy);
    const w = (i === arr.length - 1) ? (W - 48) * 0.5 : (W - 48);
    ctx.lineTo(24 + w, H * fy);
    ctx.stroke();
  });

  drawSticker(ctx, m.sticker, W - 46, H - 44, 22, m.accent, m.bg);
}

if ($('#btn-blank')) $('#btn-blank').addEventListener('click', () => openEditor(null));
if ($('#btn-use-mood')) {
  $('#btn-use-mood').addEventListener('click', () => {
    if (selectedMood) openEditor(selectedMood);
    else toast('pick a mood first');
  });
}

/* ============================================================
   END OF PART 1
   ============================================================ */
/* ============================================================
   ZINE MAKER â€” APP.JS (REWRITTEN ZOOM/LAYOUT)
   PART 2 OF 3: Editor build, zoom, guides, canvas, history
   ============================================================ */

/* ============================================================
   ZOOM SYSTEM â€” SINGLE SOURCE OF TRUTH
   ============================================================ */
let zoom = 1;
let guidesOn = true;
let guideColor = '#ff0000'; // default guide color (red)

function applyZoom(z, centerPoint, skipScroll = false) {
  const oldZoom = zoom;
  zoom = Math.min(3, Math.max(0.1, z));
  const c = activeCanvas();
  if (!c) return;

  const sc = $('#stage-scroll');
  let relX = 0.5;
  let relY = 0.5;

  if (sc && oldZoom > 0 && !skipScroll) {
    if (centerPoint) {
      const rect = sc.getBoundingClientRect();
      const mouseX = centerPoint.x - rect.left + sc.scrollLeft;
      const mouseY = centerPoint.y - rect.top + sc.scrollTop;
      relX = mouseX / Math.max(1, sc.scrollWidth);
      relY = mouseY / Math.max(1, sc.scrollHeight);
    } else {
      const cx = sc.scrollLeft + sc.clientWidth / 2;
      const cy = sc.scrollTop + sc.clientHeight / 2;
      relX = cx / Math.max(1, sc.scrollWidth);
      relY = cy / Math.max(1, sc.scrollHeight);
    }
  }

  c.setZoom(zoom);
  c.setDimensions({ width: SHEET.W * zoom, height: SHEET.H * zoom });
  drawGuides();
  c.calcOffset();
  c.requestRenderAll();
  updateZoomLabel();

  if (sc && oldZoom !== zoom && !skipScroll) {
    requestAnimationFrame(() => {
      if (centerPoint) {
        const rect = sc.getBoundingClientRect();
        sc.scrollLeft = relX * sc.scrollWidth - (centerPoint.x - rect.left);
        sc.scrollTop = relY * sc.scrollHeight - (centerPoint.y - rect.top);
      } else {
        sc.scrollLeft = relX * sc.scrollWidth - sc.clientWidth / 2;
        sc.scrollTop = relY * sc.scrollHeight - sc.clientHeight / 2;
      }
    });
  }
}

function fitZoom() {
  const sc = $('#stage-scroll');
  if (!sc) return 1;
  const r = sc.getBoundingClientRect();
  const isMobile = window.innerWidth <= 768;

  const lp = document.querySelector('#layers-panel');
  const isLpOpen = lp && lp.offsetParent !== null && !lp.classList.contains('hidden') && lp.offsetWidth > 0;
  const leftReserved = isMobile ? 12 : (isLpOpen ? (lp.offsetWidth + 24) : 30);

  const pd = document.querySelector('#propsDrawer');
  const isPdOpen = pd && pd.classList.contains('open') && pd.offsetWidth > 0;
  // On mobile the props drawer is a bottom sheet, so horizontal right reserve is minimal
  const rightReserved = isMobile ? 12 : (isPdOpen ? (pd.offsetWidth + 80) : 75); // 75px for vertical dock toolbar & margin

  const availW = Math.max(isMobile ? 260 : 320, r.width - leftReserved - rightReserved);
  const availH = Math.max(isMobile ? 180 : 220, r.height - (isMobile ? 110 : 70));
  return Math.max(0.15, Math.min(availW / SHEET.W, availH / SHEET.H, 1));
}

function fitToScreen() {
  applyZoom(fitZoom(), null, true);
  centerStageInView();
}

function centerStageInView() {
  const sc = $('#stage-scroll');
  const stage = $('#stage');
  if (!sc || !stage) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const isMobile = window.innerWidth <= 768;
      const lp = document.querySelector('#layers-panel');
      const isLpOpen = lp && lp.offsetParent !== null && !lp.classList.contains('hidden') && lp.offsetWidth > 0;
      const leftW = isMobile ? 0 : (isLpOpen ? lp.offsetWidth : 0);

      const pd = document.querySelector('#propsDrawer');
      const isPdOpen = pd && pd.classList.contains('open') && pd.offsetWidth > 0;
      // On mobile toolbar & drawer are docked bottom, so horizontal right reserve is 0
      const rightW = isMobile ? 0 : (isPdOpen ? (pd.offsetWidth + 60) : 60); // 60px for vertical dock toolbar

      const visibleW = sc.clientWidth - leftW - rightW;
      const targetCenterX = leftW + visibleW / 2;
      const targetCenterY = sc.clientHeight / 2;

      const stageCenterX = stage.offsetLeft + stage.offsetWidth / 2;
      const stageCenterY = stage.offsetTop + stage.offsetHeight / 2;

      sc.scrollLeft = Math.max(0, Math.round(stageCenterX - targetCenterX));
      sc.scrollTop = Math.max(0, Math.round(stageCenterY - targetCenterY));

      if (window.Ruler && window.Ruler.draw) window.Ruler.draw();
    });
  });
}

function updateZoomLabel() {
  const lbl = $('#zoom-label');
  if (lbl) lbl.textContent = Math.round(zoom * 100) + '%';
}

let resizeTimer = null;
let lastWinW = window.innerWidth;
let lastWinH = window.innerHeight;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const dw = Math.abs(window.innerWidth - lastWinW);
    const dh = Math.abs(window.innerHeight - lastWinH);
    // Ignore small width shifts under 32px (e.g. scrollbar toggling or drawer open/close)
    if (dw < 32 && dh < 32) return;
    lastWinW = window.innerWidth;
    lastWinH = window.innerHeight;
    if (state.format === 'zine8' && state.pages.length) fitToScreen();
  }, 150);
});

(function bindStagePanAndWheel() {
  const sc = document.querySelector('#stage-scroll');
  if (!sc) return;

  let isSpaceDown = false;
  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let startScrollTop = 0;

  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && !e.repeat) {
      const activeEl = document.activeElement;
      const typing = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
      if (!typing) {
        isSpaceDown = true;
        sc.classList.add('is-panning');
      }
    }
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'Space') {
      isSpaceDown = false;
      if (!isPanning) sc.classList.remove('is-panning');
    }
  });

  sc.addEventListener('pointerdown', e => {
    const isCanvasEl = e.target && (e.target.tagName === 'CANVAS' || e.target.closest('.canvas-container'));
    // Pan when holding space, middle click, or dragging on the dark stage background outside canvas objects
    if (isSpaceDown || e.button === 1 || (!isCanvasEl && e.button === 0)) {
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
      startScrollLeft = sc.scrollLeft;
      startScrollTop = sc.scrollTop;
      sc.classList.add('is-panning');
      sc.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  sc.addEventListener('pointermove', e => {
    if (!isPanning) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    sc.scrollLeft = startScrollLeft - dx;
    sc.scrollTop = startScrollTop - dy;
    e.preventDefault();
  }, true);

  const endPan = e => {
    if (!isPanning) return;
    isPanning = false;
    if (!isSpaceDown) sc.classList.remove('is-panning');
    try { sc.releasePointerCapture(e.pointerId); } catch (err) {}
  };

  sc.addEventListener('pointerup', endPan, true);
  sc.addEventListener('pointercancel', endPan, true);

  sc.addEventListener('wheel', e => {
    // Zoom with Ctrl or Meta
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      applyZoom(zoom * factor, { x: e.clientX, y: e.clientY });
      return;
    }

    // Shift+Wheel or Alt+Wheel -> Horizontal Scroll (Left / Right)
    if (e.shiftKey || e.altKey) {
      e.preventDefault();
      sc.scrollLeft += (e.deltaY || e.deltaX) * 1.5;
      return;
    }

    // Direct trackpad horizontal scroll (when deltaX is significant)
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 2) {
      sc.scrollLeft += e.deltaX;
      return;
    }
  }, { passive: false });
})();

/* ============================================================
   GUIDE OVERLAY â€” SAME SCALE AS CANVAS
   ============================================================ */
function createGuideCanvas() {
  const existing = $('#guideCanvas');
  if (existing) existing.remove();

  const g = document.createElement('canvas');
  g.id = 'guideCanvas';
  g.style.position = 'absolute';
  g.style.left = '0';
  g.style.top = '0';
  g.style.pointerEvents = 'none';
  g.style.zIndex = '5';

  const wrap = $('.page-wrap');
  if (wrap) wrap.appendChild(g);
  drawGuides();
}

function drawGuideLine(ctx, x1, y1, x2, y2, isDashed, z) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Parse guideColor to get rgba variants
  const gc = guideColor || '#ff0000';

  if (isDashed) {
    ctx.setLineDash([8 / z, 6 / z]);
    ctx.strokeStyle = gc;
    ctx.lineWidth = Math.max(1.4 / z, 1.2);
  } else {
    ctx.setLineDash([]);
    // Use guide color at 50% opacity for solid lines
    ctx.strokeStyle = gc;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = Math.max(1 / z, 1);
  }

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.restore();
}

function drawScissors(ctx, x, y, size, angle, z) {
  ctx.save();
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);

  const gc = guideColor || '#ff0000';
  ctx.strokeStyle = gc;
  ctx.fillStyle = gc;
  ctx.lineWidth = Math.max(1.4 / z, 1.2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Blade 1
  ctx.beginPath();
  ctx.moveTo(-size * 0.15, -size * 0.1);
  ctx.lineTo(size * 0.65, size * 0.3);
  ctx.stroke();

  // Blade 2
  ctx.beginPath();
  ctx.moveTo(-size * 0.15, size * 0.1);
  ctx.lineTo(size * 0.65, -size * 0.3);
  ctx.stroke();

  // Finger loop 1 (top ring)
  ctx.beginPath();
  ctx.arc(-size * 0.45, -size * 0.22, size * 0.18, 0, Math.PI * 2);
  ctx.stroke();

  // Finger loop 2 (bottom ring)
  ctx.beginPath();
  ctx.arc(-size * 0.45, size * 0.22, size * 0.18, 0, Math.PI * 2);
  ctx.stroke();

  // Pivot pin
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(1.6 / z, 1.4), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawNarrowGuideLabel(ctx, text, cx, cy, fontSize, z) {
  ctx.save();
  ctx.font = `normal 400 ${fontSize}px "Arial Narrow", "Arial", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = guideColor || '#ff0000';

  const letterSpacingVal = '-0.09em';
  const letterSpacingPx = fontSize * -0.09;

  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = letterSpacingVal;
    ctx.fillText(text, cx, cy);
  } else {
    // Fallback: character-by-character measurement with -9% letter spacing
    const chars = text.split('');
    const widths = chars.map(ch => ctx.measureText(ch).width);
    const totalW = widths.reduce((a, b) => a + b, 0) + (chars.length - 1) * letterSpacingPx;
    let startX = cx - totalW / 2;

    ctx.textAlign = 'left';
    chars.forEach((ch, i) => {
      ctx.fillText(ch, startX, cy);
      startX += widths[i] + letterSpacingPx;
    });
  }

  ctx.restore();
}

function drawGuides() {
  const g = $('#guideCanvas');
  if (!g) return;

  const dpr = window.devicePixelRatio || 1;
  g.width = Math.round(SHEET.W * zoom * dpr);
  g.height = Math.round(SHEET.H * zoom * dpr);
  g.style.width = (SHEET.W * zoom) + 'px';
  g.style.height = (SHEET.H * zoom) + 'px';

  const ctx = g.getContext('2d');
  ctx.setTransform(zoom * dpr, 0, 0, zoom * dpr, 0, 0);
  ctx.clearRect(0, 0, SHEET.W, SHEET.H);

  if (!guidesOn) return;

  // 1. Draw 3 vertical solid fold lines between columns
  for (let i = 1; i <= 3; i++) {
    const x = SHEET.FW * i;
    drawGuideLine(ctx, x, 0, x, SHEET.H, false, zoom);
  }

  // 2. Draw horizontal solid fold lines on outer columns (col 0 and col 3)
  const y = SHEET.FH;
  drawGuideLine(ctx, 0, y, SHEET.FW, y, false, zoom);
  drawGuideLine(ctx, 3 * SHEET.FW, y, SHEET.W, y, false, zoom);

  // 3. Draw horizontal dashed CUT LINE across middle columns (col 1 and col 2)
  drawGuideLine(ctx, SHEET.FW, y, 3 * SHEET.FW, y, true, zoom);

  // 4. Draw scissor icons at both ends of the cut line
  const scissorSize = Math.max(22 / zoom, 20);
  const scissorPad = 34;
  drawScissors(ctx, SHEET.FW + scissorPad, y, scissorSize, 0, zoom); // pointing right along cut line
  drawScissors(ctx, 3 * SHEET.FW - scissorPad, y, scissorSize, Math.PI, zoom); // pointing left along cut line

  // 5. Draw frame labels matching user mockup:
  // Font: Arial Narrow, letter-spacing: -9%, lowercase, centered, pure black without white stroke
  const labels = [
    { col: 0, row: 0, text: 'page 6' },
    { col: 1, row: 0, text: 'page 5' },
    { col: 2, row: 0, text: 'page 4' },
    { col: 3, row: 0, text: 'page 3' },
    { col: 0, row: 1, text: 'back cover' },
    { col: 1, row: 1, text: 'front cover' },
    { col: 2, row: 1, text: 'page 1' },
    { col: 3, row: 1, text: 'page 2' }
  ];

  const fontSize = Math.max(44, Math.round(20 / zoom));

  labels.forEach(item => {
    const cx = item.col * SHEET.FW + SHEET.FW / 2;
    const cy = item.row * SHEET.FH + SHEET.FH / 2;
    drawNarrowGuideLabel(ctx, item.text, cx, cy, fontSize, zoom);
  });
}

function toggleGuides() {
  guidesOn = !guidesOn;
  state.guides = guidesOn;
  drawGuides();
  buildToolbar();
  scheduleAutosave();
  if (guidesOn) openGuideColorDrawer();
  else hideProps();
}

function openGuideColorDrawer() {
  const colors = [
    { c: '#ffffff', label: 'White (Best for Dark/Photos)' },
    { c: '#ffff00', label: 'Yellow (High Contrast)' },
    { c: '#00ffff', label: 'Cyan / Light Blue' },
    { c: '#ff0055', label: 'Neon Pink' },
    { c: '#00ff66', label: 'Neon Green' },
    { c: '#ff5500', label: 'Orange' },
    { c: '#000000', label: 'Royal Blue' },
    { c: '#ff0000', label: 'Classic Red' },
    { c: '#000000', label: 'Black (Best for Light/White)' },
  ];
  const swatches = colors.map(s =>
    `<button type="button" class="tp-guide-color-swatch ${guideColor.toLowerCase() === s.c.toLowerCase() ? 'active' : ''}" data-action="set-guide-color" data-value="${s.c}" title="${s.label}" style="background:${s.c};"></button>`
  ).join('');
  openDrawer(`
    <div class="tp-modern-header">
      <span class="tp-modern-title">Guide Overlay</span>
      <button type="button" class="tp-modern-close" data-action="close-drawer" title="close">✕</button>
    </div>
    <div class="tp-card-box">
      <div class="tp-card-header-row" style="margin-bottom:8px;">
        <span class="tp-card-label">Guides Visibility</span>
        <button type="button" class="tp-btn-modern ${guidesOn ? 'primary' : ''}" data-action="toggle-guide-visibility" style="height:26px;font-size:11px;padding:0 10px;">
          ${guidesOn ? 'Visible' : 'Hidden'}
        </button>
      </div>
    </div>
    <div class="tp-card-box">
      <span class="tp-card-tag">Guide Color Preset</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        ${swatches}
      </div>
    </div>
    <div class="tp-card-box">
      <span class="tp-card-tag">Custom Color</span>
      <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
        <input type="color" value="${guideColor}" data-action="set-guide-color-custom" style="width:40px;height:32px;border:none;border-radius:6px;cursor:pointer;background:transparent;padding:0;">
        <span style="font-size:12px;color:rgba(255,255,255,0.7);font-family:monospace;">${guideColor.toUpperCase()}</span>
      </div>
    </div>
  `);
}

/* ============================================================
   EDITOR BUILD
   ============================================================ */
const ICONS = {
  select: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3l12 12-5.5 1-2.5 5-2-1 2.5-5L4 15V3z"/></svg>',
  frame: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 2v20M19 2v20M2 5h20M2 19h20"/></svg>',
  shape: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>',
  pen: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg>',
  text: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M12 6v14M8 20h8"/></svg>',
  bg: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="2"/></svg>',
  upload: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  sticker: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 5.2 5.6.8-4.1 3.9 1 5.7-4.9-2.7-4.9 2.7 1-5.7L4 8l5.6-.8L12 2z"/></svg>',
  layout: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
  stitch: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>',
  texture: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4L18.4 5.6"/></svg>',
  guides: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 4h18M3 10h18M3 16h18M3 20h18M7 3v18M17 3v18"/></svg>',
  zoomin: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M16 16l4.5 4.5M11 8v6M8 11h6"/></svg>',
  zoomout: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M16 16l4.5 4.5M8 11h6"/></svg>',
  fit: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/></svg>'
};

function setActiveTool(toolName) {
  const tb = $('#toolbar');
  if (!tb) return;
  tb.querySelectorAll('.tool-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tool === toolName);
  });
}
window.setActiveTool = setActiveTool;

function buildToolbar() {
  const tb = $('#toolbar');
  if (!tb) return;

  const btn = (label, tool, icon, extraClass = '') =>
    `<button type="button" class="tool-btn ${extraClass}" data-tool="${tool}" data-tooltip="${label}" aria-label="${label}" title="${label}">
      ${ICONS[icon] || ''}
    </button>`;

  let html =
    btn('Select', 'select', 'select', state.doodleMode ? '' : 'active') +
    btn('Layouts & Templates', 'templates', 'layout') +
    btn('Fit to Frame', 'fit-frame', 'frame') +
    btn('Shape', 'shape', 'shape') +
    btn('Doodle & Pen Tool', 'doodle', 'pen', state.doodleMode ? 'active' : '') +
    btn('Text', 'text', 'text') +
    btn('Background', 'background', 'bg') +
    btn('Upload Image', 'upload', 'upload') +
    btn('Texture Overlay', 'texture', 'texture');

  html += '<span class="toolbar-sep"></span>' +
    btn('Toggle Guides', 'guides', 'guides', guidesOn ? 'active' : '');

  html += '<span class="toolbar-sep"></span>' +
    btn('Zoom In', 'zoom-in', 'zoomin') +
    btn('Zoom Out', 'zoom-out', 'zoomout') +
    btn('Fit to Screen', 'fit', 'fit');

  tb.innerHTML = html;
}

function postSize(ratio) {
  switch (ratio) {
    case '4:5': return [900, 1125];
    case '9:16': return [900, 1600];
    case 'a4': return [794, 1123];
    default: return [900, 900];
  }
}

function buildPages(n) {
  const stage = $('#stage');
  stage.innerHTML = '';
  state.pages = [];

  if (state.format === 'zine8') {
    const wrap = document.createElement('div');
    wrap.className = 'page-wrap';

    const el = document.createElement('canvas');
    wrap.appendChild(el);
    stage.appendChild(wrap);

    const canvas = new fabric.Canvas(el, {
      width: SHEET.W,
      height: SHEET.H,
      backgroundColor: '#e8e8e8',
      preserveObjectStacking: true,
      selection: true,
      fireRightClick: true,
      stopContextMenu: true,
      selectionColor: 'rgba(47,10,233,0.1)',
      selectionBorderColor: '#000000',
      selectionLineWidth: 1.5
    });

    const page = {
      canvas: canvas,
      wrap: wrap,
      history: { undo: [], redo: [] },
      isSheet: true
    };
    canvas.__page = page;
    state.pages.push(page);
    state.sheet = page;

    drawFrameOutlines(canvas);
    wireCanvas(page);
    createGuideCanvas();
  } else {
    for (let i = 0; i < n; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'page-wrap';
      wrap.style.display = 'none';

      const el = document.createElement('canvas');
      wrap.appendChild(el);
      stage.appendChild(wrap);

      const canvas = new fabric.Canvas(el, {
        width: state.pageW,
        height: state.pageH,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        selection: true,
        fireRightClick: true,
        stopContextMenu: true,
        selectionColor: 'rgba(47,10,233,0.1)',
        selectionBorderColor: '#000000',
        selectionLineWidth: 1.5
      });

      const page = {
        canvas: canvas,
        wrap: wrap,
        history: { undo: [], redo: [] }
      };
      canvas.__page = page;
      state.pages.push(page);
      wireCanvas(page);
    }
  }
}

function drawFrameOutlines(canvas) {
  ZINE8_FRAMES.forEach(f => {
    const x = f.col * SHEET.FW;
    const y = f.row * SHEET.FH;

    const rect = new fabric.Rect({
      left: x,
      top: y,
      width: SHEET.FW,
      height: SHEET.FH,
      fill: state.frameBackgrounds[f.id] || '#ffffff',
      stroke: null,
      strokeWidth: 0,
      selectable: false,
      evented: false,
      hoverCursor: 'default',
      objectCaching: false,
      name: 'frame-' + f.id
    });
    canvas.add(rect);
  });

  canvas.getObjects().forEach(o => {
    if (o.name && o.name.startsWith('frame-')) canvas.sendToBack(o);
  });
}

/* ============================================================
   DESIGN MODES: 1 PAGE 1 DESAIN (FRAMES) vs FREE DESIGN (SEAMLESS)
   ============================================================ */
function getFrameForPoint(x, y) {
  return ZINE8_FRAMES.find(f => {
    const fx = f.col * SHEET.FW;
    const fy = f.row * SHEET.FH;
    return x >= fx && x < fx + SHEET.FW && y >= fy && y < fy + SHEET.FH;
  }) || ZINE8_FRAMES.find(f => f.id === 'cover') || ZINE8_FRAMES[1];
}

function getFrameForObject(obj) {
  if (!obj) return null;
  const pt = obj.getCenterPoint ? obj.getCenterPoint() : { x: obj.left || 0, y: obj.top || 0 };
  const cx = Math.max(0, Math.min(SHEET.W - 1, pt.x));
  const cy = Math.max(0, Math.min(SHEET.H - 1, pt.y));
  return getFrameForPoint(cx, cy);
}

function createFrameClip(frame) {
  const clip = new fabric.Rect({
    left: frame.col * SHEET.FW,
    top: frame.row * SHEET.FH,
    width: SHEET.FW,
    height: SHEET.FH,
    originX: 'left',
    originY: 'top',
    absolutePositioned: true
  });
  clip.__frameId = frame.id;
  return clip;
}

function updateObjectClip(obj) {
  if (!obj) return;
  if (obj.name && (obj.name.startsWith('frame-') || obj.name.startsWith('guide-'))) return;
  if (obj._isTextureOverlay) return;
  if (state.format !== 'zine8') return;

  if (state.designMode === 'free') {
    if (obj.clipPath) {
      obj.clipPath = null;
      obj.dirty = true;
    }
    return;
  }

  // Framed mode: clip to the page frame it belongs to
  const frame = getFrameForObject(obj);
  if (!frame) return;

  if (obj.clipPath && obj.clipPath.__frameId === frame.id) {
    return; // already clipped to this frame
  }

  const clip = createFrameClip(frame);
  obj.clipPath = clip;
  obj.dirty = true;
}

function setDesignMode(mode) {
  if (state.designMode === mode) return;
  state.designMode = mode;
  updateDesignModeUI();

  const c = activeCanvas();
  if (c && state.format === 'zine8') {
    c.getObjects().forEach(o => {
      updateObjectClip(o);
    });
    c.requestRenderAll();
    markChange();
  }
  toast(mode === 'framed' ? 'mode: 1 page 1 desain (frames)' : 'mode: free design (seamless canvas)');
}

function updateDesignModeUI() {
  const mode = state.designMode || 'framed';
  const framedBtn = $('#tab-mode-framed');
  const freeBtn = $('#tab-mode-free');
  if (framedBtn) framedBtn.classList.toggle('active', mode === 'framed');
  if (freeBtn) freeBtn.classList.toggle('active', mode === 'free');
}

function wireCanvas(page) {
  const c = page.canvas;

  c.on('mouse:down', e => {
    if (state.format === 'zine8') {
      const p = c.getPointer(e.e);
      const f = getFrameForPoint(p.x, p.y);
      if (f) {
        const changed = state.activeFrameId !== f.id;
        state.activeFrameId = f.id;
        if (changed) {
          const d = $('#propsDrawer');
          if (d && d.classList.contains('open') && d.querySelector('.canva-color-drawer[data-mode="background"]')) {
            openBackgroundDrawer();
          }
        }
      }
    }
  });

  c.on('selection:created', e => {
    if (e.target && state.format === 'zine8') {
      const f = getFrameForObject(e.target);
      if (f) state.activeFrameId = f.id;
    }
    refreshProps();
  });
  c.on('selection:updated', e => {
    if (e.target && state.format === 'zine8') {
      const f = getFrameForObject(e.target);
      if (f) state.activeFrameId = f.id;
    }
    refreshProps();
  });
  c.on('selection:cleared', () => {
    if (state.crop && state.crop.rect) {
      setTimeout(() => {
        if (state.crop && state.crop.rect) {
          c.setActiveObject(state.crop.rect);
          c.requestRenderAll();
        }
      }, 10);
      return;
    }
    if (window.ZineSnapping && window.ZineSnapping.clearGuides) {
      window.ZineSnapping.clearGuides(c);
    }
    hideProps();
  });

  c.on('mouse:up', () => {
    if (window.ZineSnapping && window.ZineSnapping.clearGuides) {
      window.ZineSnapping.clearGuides(c);
    }
  });

  c.on('object:added', e => {
    if (e.target) updateObjectClip(e.target);
    onCanvasChanged(page);
  });
  c.on('object:removed', () => onCanvasChanged(page));
  c.on('object:modified', e => {
    if (window.ZineSnapping && window.ZineSnapping.clearGuides) {
      window.ZineSnapping.clearGuides(c);
    }
    if (state.format === 'zine8' && e.target) {
      if (e.target.type === 'activeSelection') {
        e.target.getObjects().forEach(o => updateObjectClip(o));
      } else {
        updateObjectClip(e.target);
      }
    }
    onCanvasChanged(page);
  });
  c.on('editing:exited', () => onCanvasChanged(page));
  c.on('text:changed', () => queueHistory(page));

  c.on('object:moving', e => {
    onObjectMoving(page, e);
    if (e.target) updatePositionInputs(e.target);
    // NOTE: Do NOT update clipPath during live drag — reassigning clipPath every
    // mouse-move event causes visual glitching/flickering.
    // ClipPath is refreshed once in object:modified when the drag finishes.
  });
  c.on('object:scaling', e => {
    if (state.crop && e.target === state.crop.rect) updateCropDim();
  });
}

function onCanvasChanged(page) {
  if (state.loading || state.busy || state.crop) return;
  markChange(page);
}

function buildThumbs() {
  const row = $('#thumbRow');
  if (!row) return;
  if (state.format === 'zine8' || state.format === 'post') {
    row.style.display = 'none';
    return;
  }
  row.style.display = '';
  row.innerHTML = '';

  state.pages.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'thumb' + (i === state.active ? ' active' : '');
    b.dataset.page = String(i);
    b.setAttribute('aria-label', 'page ' + (i + 1));
    const img = document.createElement('img');
    img.alt = '';
    b.appendChild(img);
    row.appendChild(b);
    updateThumb(i);
  });
}

function updateThumb(i) {
  const page = state.pages[i];
  if (!page) return;
  const btn = $('#thumbRow .thumb[data-page="' + i + '"]');
  if (!btn) return;
  const img = btn.querySelector('img');
  if (!img) return;
  try {
    img.src = page.canvas.toDataURL({ format: 'png', multiplier: 0.2 });
  } catch (e) { /* noop */ }
}

let thumbTimer = null;
function scheduleThumb(page) {
  clearTimeout(thumbTimer);
  thumbTimer = setTimeout(() => {
    const i = state.pages.indexOf(page);
    if (i >= 0) updateThumb(i);
  }, 350);
}

function updateThumbActive() {
  $$('#thumbRow .thumb').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.page, 10) === state.active);
  });
}

function formatTitle() {
  switch (state.format) {
    case 'zine8': return '8-page mini zine';
    case 'zine4': return '4-page zine';
    case 'zinefree': return state.pageCount + '-page zine';
    case 'post': return 'post';
    default: return 'zine';
  }
}

function updatePageLabel() {
  const title = $('#project-title');
  const label = $('#page-count-label');
  if (title) title.textContent = state.projectTitle || formatTitle();
  if (!label) return;
  if (state.format === 'zine8') {
    label.textContent = 'sheet \u00B7 8-page layout';
  } else if (state.format === 'post') {
    label.textContent = 'post \u00B7 ' + (state.ratio || '1:1');
  } else {
    label.textContent = 'page ' + (state.active + 1) + ' / ' + state.pages.length;
  }
}

function showPage(i) {
  if (!state.pages.length) return;
  commitEditing();
  if (state.crop) exitCrop(false);

  state.active = clamp(i, 0, state.pages.length - 1);
  state.pages.forEach((p, idx) => {
    p.wrap.style.display = (idx === state.active) ? 'block' : 'none';
  });

  const p = activePage();
  p.canvas.calcOffset();
  applyZoom(zoom);
  p.canvas.requestRenderAll();
  updateThumbActive();
  updatePageLabel();
  refreshProps();
  scheduleAutosave();
}

function starPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = (i % 2) ? r * 0.45 : r;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad });
  }
  return pts;
}

function makeMoodShape(mood, W, H, accent) {
  const kind = mood ? mood.block : 'circle';
  const size = Math.min(W, H) * 0.34;
  const cx = W * 0.5;
  const cy = H * 0.63;

  if (kind === 'rect') {
    return new fabric.Rect({
      width: W * 0.52, height: H * 0.14, fill: accent,
      left: cx, top: cy, originX: 'center', originY: 'center'
    });
  }
  if (kind === 'line') {
    return new fabric.Rect({
      width: W * 0.62, height: 8, fill: accent,
      left: cx, top: cy, originX: 'center', originY: 'center'
    });
  }
  if (kind === 'blob') {
    const pts = [];
    const n = 20;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      const rr = size * 0.55 * (0.84 + 0.16 * Math.sin(i * 2.1 + 1));
      pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
    }
    return new fabric.Polygon(pts, {
      fill: accent, left: cx, top: cy, originX: 'center', originY: 'center'
    });
  }
  return new fabric.Circle({
    radius: size / 2, fill: accent,
    left: cx, top: cy, originX: 'center', originY: 'center'
  });
}

function buildStarter(page, mood) {
  const c = page.canvas;
  if (state.format !== 'zine8') return;

  const mood_obj = mood ? MOODBOARDS.find(m => m.id === mood) : null;
  if (!mood_obj) return;

  const coverFrame = ZINE8_FRAMES.find(f => f.id === 'cover');
  const page1Frame = ZINE8_FRAMES.find(f => f.id === '1');
  if (!coverFrame || !page1Frame) return;

  const cX = coverFrame.col * SHEET.FW + SHEET.FW / 2;
  const cY = coverFrame.row * SHEET.FH + SHEET.FH / 2;

  const p1X = page1Frame.col * SHEET.FW + SHEET.FW / 2;
  const p1Y = page1Frame.row * SHEET.FH + SHEET.FH / 2;

  const accent = mood_obj.accent;
  const ink = mood_obj.ink;

  const title = new fabric.Textbox(mood_obj.name.toUpperCase(), {
    left: cX, top: cY - 40,
    originX: 'center', originY: 'center',
    width: SHEET.FW * 0.75,
    fontFamily: fq(mood_obj.titleFont),
    fontSize: 26,
    fontWeight: 'bold',
    fill: accent,
    textAlign: 'center',
    charSpacing: 20,
    lineHeight: 1.08
  });
  c.add(title);

  const text1 = new fabric.Textbox('your design here', {
    left: p1X, top: p1Y - 80,
    originX: 'center', originY: 'center',
    width: SHEET.FW * 0.8,
    fontFamily: fq(mood_obj.bodyFont),
    fontSize: 14,
    fill: ink,
    textAlign: 'center'
  });
  c.add(text1);

  const shape = makeMoodShape(mood_obj, SHEET.FW, SHEET.FH, accent);
  shape.set({ left: p1X, top: p1Y + 60 });
  c.add(shape);

  c.requestRenderAll();
}

function openEditor(moodId) {
  const ctx = window.__zineContext || {};
  const fmt = ctx.format || chosenFormat || 'zine8';

  state.projectId = 'proj_' + Date.now();
  state.projectTitle = (fmt === 'zine8' ? '8-page mini zine' : (fmt === 'post' ? 'post' : 'zine')) + ' #' + (Math.floor(Math.random() * 900) + 100);
  state.format = fmt;
  state.ratio = ctx.ratio || chosenRatio || '1:1';
  state.designMode = ctx.designMode || chosenDesignMode || 'framed';
  state.activeFrameId = 'cover';
  updateDesignModeUI();
  state.mood = moodId || null;
  state.theme = themeFromMood(state.mood);
  state.clipboard = null;
  state.crop = null;
  zoom = 1;
  state.active = 0;
  state.frameBackgrounds = {};
  guidesOn = true;
  state.guides = true;
  state.doodleMode = false;
  if (typeof exitPenTool === 'function') exitPenTool(false);

  ZINE8_FRAMES.forEach(f => {
    state.frameBackgrounds[f.id] = '#ffffff';
  });

  if (fmt === 'post') {
    const s = postSize(state.ratio);
    state.pageW = s[0];
    state.pageH = s[1];
    state.pageCount = 1;
  } else if (fmt === 'zine8') {
    state.pageW = SHEET.W;
    state.pageH = SHEET.H;
    state.pageCount = 1;
  } else {
    state.pageW = 495;
    state.pageH = 700;
    if (fmt === 'zine4') state.pageCount = 4;
    else state.pageCount = Math.max(4, Math.ceil((ctx.pages || freePages) / 4) * 4);
  }

  state.loading = true;
  buildPages(state.pageCount);

  const mood_obj = state.mood ? MOODBOARDS.find(m => m.id === state.mood) : null;
  if (fmt === 'zine8' && mood_obj) {
    buildStarter(state.pages[0], state.mood);
  }

  state.loading = false;

  state.pages.forEach(p => {
    p.history.undo = [snap(p)];
    p.history.redo = [];
  });

  showScreen('editor');
  buildToolbar();
  buildThumbs();
  setMode('edit');
  showPage(0);

  const triggerCenter = () => {
    if (state.pages.length) fitToScreen();
  };
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      triggerCenter();
      setTimeout(triggerCenter, 80);
      setTimeout(triggerCenter, 220);
    });
  });

  updatePageLabel();
  saveNow();
}

/* ============================================================
   HISTORY / UNDO / REDO / AUTOSAVE
   ============================================================ */
const TEXT_PROPS = [
  'id', 'name', 'selectable', 'evented',
  'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY',
  'hasControls', 'hasBorders', 'hoverCursor',
  'rawText', 'textCase', 'listStyle', 'paraSpacing', 'truncate', 'maxLines',
  'wrapStyle', 'vertTrim', '_isTextureOverlay', '_textureId', 'globalCompositeOperation',
  'cropX', 'cropY', 'clipPath', 'adjustments', 'effects'
];

function snap(page) {
  return JSON.stringify(page.canvas.toJSON(TEXT_PROPS));
}

let autosaveTimer = null;
let historyTimer = null;

function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(saveNow, 700);
}

function queueHistory(page) {
  clearTimeout(historyTimer);
  historyTimer = setTimeout(() => markChange(page), 350);
}

function markChange(page) {
  page = page || activePage();
  if (!page || state.loading || state.crop) return;

  clearTimeout(historyTimer);

  const s = snap(page);
  const h = page.history;
  if (!h.undo) h.undo = [];
  if (!h.redo) h.redo = [];

  if (h.undo.length && h.undo[h.undo.length - 1] === s) {
    scheduleAutosave();
    return;
  }
  h.undo.push(s);
  if (h.undo.length > 60) h.undo.shift();
  h.redo.length = 0;

  scheduleAutosave();
  scheduleThumb(page);
  if (window.ZineLayers && window.ZineLayers.render) window.ZineLayers.render();
}

function applySnapshot(page, json) {
  clearTimeout(historyTimer);
  state.loading = true;
  page.canvas.discardActiveObject();
  page.canvas.loadFromJSON(JSON.parse(json), () => {
    // Strip any legacy helper labels or badges from canvas objects
    page.canvas.getObjects().slice().forEach(o => {
      if (o.name && (o.name.startsWith('label-') || o.name.startsWith('badge-'))) {
        page.canvas.remove(o);
      }
    });

    // Re-render rich typography if present
    if (window.renderText) {
      page.canvas.getObjects().forEach(o => {
        if (o && (o.type === 'textbox' || o.type === 'i-text' || o.type === 'text')) {
          try { window.renderText(o); } catch (_) {}
        }
      });
    }

    // Re-apply adjustments and effects
    page.canvas.getObjects().forEach(o => {
      if (o.type === 'image' && (o.adjustments || o.effects)) {
        if (window.ZineAdjustments) window.ZineAdjustments.applyAdjustments(o);
        else if (window.ZineEffects) window.ZineEffects.applyEffects(o);
      }
    });

    if (state.format === 'zine8') {
      page.canvas.getObjects().forEach(o => updateObjectClip(o));
    }

    state.loading = false;
    page.canvas.calcOffset();
    page.canvas.requestRenderAll();
    hideProps();
    scheduleThumb(page);
    scheduleAutosave();
    if (typeof drawGuides === 'function') drawGuides();
    if (window.ZineLayers && window.ZineLayers.render) window.ZineLayers.render();
  });
}

function undo() {
  clearTimeout(historyTimer);
  if (state.crop) exitCrop(false);
  commitEditing();
  const p = activePage();
  if (!p) return;
  const h = p.history;
  if (!h.undo || h.undo.length < 2) { toast('nothing to undo'); return; }
  const current = h.undo.pop();
  h.redo.push(current);
  applySnapshot(p, h.undo[h.undo.length - 1]);
  toast('undo');
}

function redo() {
  clearTimeout(historyTimer);
  if (state.crop) exitCrop(false);
  commitEditing();
  const p = activePage();
  if (!p) return;
  const h = p.history;
  if (!h.redo || !h.redo.length) { toast('nothing to redo'); return; }
  const s = h.redo.pop();
  h.undo.push(s);
  applySnapshot(p, s);
  toast('redo');
}

function commitEditing() {
  const c = activeCanvas();
  if (!c) return;
  const o = c.getActiveObject();
  if (o && o.isEditing) {
    try { o.exitEditing(); } catch (e) { /* noop */ }
  }
}

function serializeProject() {
  return {
    v: 3,
    id: state.projectId || ('proj_' + Date.now()),
    title: state.projectTitle || (state.format === 'zine8' ? '8-page mini zine' : 'zine project'),
    format: state.format,
    ratio: state.ratio,
    designMode: state.designMode || 'framed',
    pageCount: state.pageCount,
    pageW: state.pageW,
    pageH: state.pageH,
    active: state.active,
    mood: state.mood,
    theme: state.theme,
    zoom: zoom,
    guides: guidesOn,
    guideColor: guideColor,
    frameBackgrounds: state.frameBackgrounds,
    pages: state.pages.map(p => JSON.stringify(p.canvas.toJSON(TEXT_PROPS)))
  };
}

function saveNow() {
  if (!state.pages.length || state.loading || state.crop) return;
  const project = serializeProject();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    const r = $('#btn-resume');
    if (r) r.classList.remove('hidden');
  } catch (e) { /* quota / private mode */ }

  if (window.ZineProjects?.saveCurrent) {
    let thumb = null;
    try {
      if (state.pages[0]?.canvas) {
        thumb = state.pages[0].canvas.toDataURL({ format: 'png', multiplier: 0.12 });
      }
    } catch (e) {}
    window.ZineProjects.saveCurrent(project, thumb);
  }
}

/* ============================================================
   END OF PART 2
   ============================================================ */
/* ============================================================
   ZINE MAKER â€” APP.JS (REWRITTEN ZOOM/LAYOUT)
   PART 3 OF 3: Props, tools, crop, snapping, doodle, keyboard, project save/load
   ============================================================ */

/* ============================================================
   PROPS DRAWER
   ============================================================ */
window.__openDrawer = openDrawer;
function openDrawer(html) {
  const d = $('#propsDrawer');
  if (!d) return;
  d.innerHTML = html;
  d.classList.add('open');
}

function hideProps() {
  const d = $('#propsDrawer');
  if (!d) return;
  d.innerHTML = '';
  d.classList.remove('open');
  if (!window.TextPanel || !window.TextPanel.isOpen()) {
    setActiveTool('select');
  }
}

function swatchRow(prop, current, colors) {
  let customStyle = 'background:conic-gradient(#000000,#ffffff,#000000,#000000)';
  if (current && typeof current === 'object' && current.colorStops) {
    const parts = current.colorStops.map(s => `${s.color} ${Math.round(s.offset * 100)}%`).join(', ');
    customStyle = current.type === 'radial' ? `background:radial-gradient(circle, ${parts})` : `background:linear-gradient(90deg, ${parts})`;
  }
  const hexCurrent = toHex(current);
  let html = '<div class="swatches" data-prop="' + prop + '">';
  colors.forEach(col => {
    const on = (col.toLowerCase() === hexCurrent.toLowerCase()) ? ' active' : '';
    html += '<button class="swatch-btn' + on + '" data-prop="' + prop +
      '" data-color="' + col + '" style="background:' + col +
      '" aria-label="colour ' + col + '"></button>';
  });
  html += '<button type="button" class="swatch-btn custom-color-btn" data-prop="' + prop +
    '" data-current="' + hexCurrent + '" style="' + customStyle + '" title="custom colour" aria-label="custom colour"></button>';
  html += '</div>';
  return html;
}

function canvaColorSectionHTML(prop, currentVal, labelText) {
  let curHex = '#000000';
  if (currentVal) {
    if (typeof currentVal === 'string') {
      curHex = toHex(currentVal).toLowerCase();
    } else if (currentVal.colorStops) {
      curHex = toHex(currentVal.colorStops[0]?.color || '#000000').toLowerCase();
    }
  }

  const topColors = ['#8ce832', '#2d4f43', '#ffffff', '#374151', '#000000'];
  let quickColors = [...topColors];
  if (curHex && !quickColors.map(c => c.toLowerCase()).includes(curHex)) {
    quickColors.splice(1, 0, curHex);
  }

  const renderQuickSwatches = quickColors.slice(0, 5).map(col => {
    const isAct = col.toLowerCase() === curHex;
    return `<button type="button" class="canva-swatch ${isAct ? 'active' : ''}" data-prop="${prop}" data-color="${col}" style="background:${col};" title="${col}" aria-label="${col}"></button>`;
  }).join('');

  return `
    <div class="tp-card-box tp-color-card canva-color-section" data-prop="${prop}">
      <div class="tp-card-header-row">
        <span class="tp-card-label">${labelText}</span>
      </div>

      <!-- Top Row: Rainbow (+) Add Color, Pipette/Eyedropper, and Quick Swatches -->
      <div class="canva-quick-row" style="margin-top: 6px;">
        <button type="button" class="canva-add-color-btn custom-color-btn" data-prop="${prop}" title="Tambah warna baru (Custom Color)" aria-label="custom color">
          <div class="canva-add-inner">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"><line x1="12" y1="6" x2="12" y2="18"/><line x1="6" y1="12" x2="18" y2="12"/></svg>
          </div>
        </button>

        <button type="button" class="canva-eyedropper-btn" data-prop="${prop}" title="Ambil warna dari layar (Eyedropper)" aria-label="eyedropper">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 4l6 6"/>
            <path d="M4 20l4-1 10.5-10.5a2.12 2.12 0 1 0-3-3L5 16l-1 4z"/>
            <line x1="14" y1="4" x2="8" y2="10"/>
          </svg>
        </button>

        ${renderQuickSwatches}
      </div>
    </div>
  `;
}

function canvaStrokeSectionHTML(strokeVal, strokeW) {
  let curHex = '#000000';
  if (strokeVal) {
    if (typeof strokeVal === 'string') curHex = toHex(strokeVal).toLowerCase();
    else if (strokeVal.colorStops) curHex = toHex(strokeVal.colorStops[0]?.color || '#000000').toLowerCase();
  }

  const topColors = ['#8ce832', '#2d4f43', '#ffffff', '#374151', '#000000'];
  let quickColors = [...topColors];
  if (curHex && !quickColors.map(c => c.toLowerCase()).includes(curHex)) {
    quickColors.splice(1, 0, curHex);
  }

  const renderQuickSwatches = quickColors.slice(0, 5).map(col => {
    const isAct = col.toLowerCase() === curHex;
    return `<button type="button" class="canva-swatch ${isAct ? 'active' : ''}" data-prop="stroke" data-color="${col}" style="background:${col};" title="${col}" aria-label="${col}"></button>`;
  }).join('');

  return `
    <div class="tp-card-box tp-color-card canva-color-section" data-prop="stroke">
      <div class="tp-card-header-row">
        <span class="tp-card-label">Stroke</span>
        <span class="tp-card-badge" id="val-strokeWidth">${strokeW} px</span>
      </div>
      <div class="canva-quick-row" style="margin-top: 6px;">
        <button type="button" class="canva-add-color-btn custom-color-btn" data-prop="stroke" title="Tambah warna baru (Custom Color)" aria-label="custom color">
          <div class="canva-add-inner">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"><line x1="12" y1="6" x2="12" y2="18"/><line x1="6" y1="12" x2="18" y2="12"/></svg>
          </div>
        </button>
        <button type="button" class="canva-eyedropper-btn" data-prop="stroke" title="Ambil warna dari layar (Eyedropper)" aria-label="eyedropper">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 4l6 6"/>
            <path d="M4 20l4-1 10.5-10.5a2.12 2.12 0 1 0-3-3L5 16l-1 4z"/>
            <line x1="14" y1="4" x2="8" y2="10"/>
          </svg>
        </button>
        ${renderQuickSwatches}
      </div>
      <div class="tp-slider-track-wrap" style="margin-top: 6px;">
        <span class="tp-icon-a-sm" style="font-size:10px">0</span>
        <input type="range" min="0" max="32" step="1" value="${strokeW}" data-prop="strokeWidth" class="tp-modern-range" aria-label="stroke width">
        <span class="tp-icon-a-lg" style="font-size:12px">32</span>
      </div>
    </div>
  `;
}

function fontOptions(current) {
  const list = [state.theme.titleFont].concat(FONT_LIST)
    .filter((f, i, a) => a.indexOf(f) === i);
  return list.map(f =>
    '<option value="' + f + '"' + (f === current ? ' selected' : '') + '>' + f + '</option>'
  ).join('');
}

function isText(o) {
  return o && (o.type === 'textbox' || o.type === 'i-text' || o.type === 'text');
}

function positionSectionHTML(o) {
  if (!o) return '';
  const x = Math.round(o.left || 0);
  const y = Math.round(o.top || 0);
  return `
    <div class="tp-card-box tp-pos-card">
      <div class="tp-card-header-row" style="margin-bottom:6px;">
        <span class="tp-card-label">Position</span>
        <span class="tp-card-badge" style="font-size:10px;opacity:0.75;">kursor panah ↑↓←→</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div class="tp-pos-field" style="display:flex;align-items:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:3px 8px;gap:6px;">
          <span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);">X</span>
          <input type="number" id="inp-pos-x" data-action="set-pos-x" value="${x}" style="width:100%;background:transparent;border:none;color:#fff;font-size:12px;font-family:monospace;outline:none;" />
          <span style="font-size:10px;color:rgba(255,255,255,0.35);">px</span>
        </div>
        <div class="tp-pos-field" style="display:flex;align-items:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:3px 8px;gap:6px;">
          <span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);">Y</span>
          <input type="number" id="inp-pos-y" data-action="set-pos-y" value="${y}" style="width:100%;background:transparent;border:none;color:#fff;font-size:12px;font-family:monospace;outline:none;" />
          <span style="font-size:10px;color:rgba(255,255,255,0.35);">px</span>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.06);">
        <span style="font-size:10px;color:rgba(255,255,255,0.5);">Nudge (Shift = 10px)</span>
        <div style="display:flex;gap:4px;">
          <button type="button" class="tp-nudge-btn" data-action="nudge" data-dir="left" title="Geser Kiri (←)" style="width:26px;height:24px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="10 3 5 8 10 13"/></svg>
          </button>
          <button type="button" class="tp-nudge-btn" data-action="nudge" data-dir="right" title="Geser Kanan (→)" style="width:26px;height:24px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 3 11 8 6 13"/></svg>
          </button>
          <button type="button" class="tp-nudge-btn" data-action="nudge" data-dir="up" title="Geser Atas (↑)" style="width:26px;height:24px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 10 8 5 13 10"/></svg>
          </button>
          <button type="button" class="tp-nudge-btn" data-action="nudge" data-dir="down" title="Geser Bawah (↓)" style="width:26px;height:24px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 8 11 13 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function updatePositionInputs(obj) {
  if (!obj) return;
  const inX = document.getElementById('inp-pos-x');
  const inY = document.getElementById('inp-pos-y');
  if (inX && document.activeElement !== inX) inX.value = Math.round(obj.left || 0);
  if (inY && document.activeElement !== inY) inY.value = Math.round(obj.top || 0);
}

function nudgeActiveObjects(dir, step = 1) {
  const c = activeCanvas();
  if (!c) return;
  const activeObj = c.getActiveObject();
  if (!activeObj || activeObj.isEditing) return;

  let dx = 0, dy = 0;
  if (dir === 'left') dx = -step;
  else if (dir === 'right') dx = step;
  else if (dir === 'up') dy = -step;
  else if (dir === 'down') dy = step;

  if (dx === 0 && dy === 0) return;

  activeObj.set({
    left: activeObj.left + dx,
    top: activeObj.top + dy
  });
  activeObj.setCoords();

  if (state.format === 'zine8') {
    if (activeObj.type === 'activeSelection') {
      activeObj.getObjects().forEach(o => updateObjectClip(o));
    } else {
      updateObjectClip(activeObj);
    }
  }

  c.requestRenderAll();
  updatePositionInputs(activeObj);
  queueHistory(activePage());
}

function alignmentControlsHTML() {
  return `
    <div class="tp-card-box">
      <button type="button" class="tp-btn-modern primary" data-action="fit-frame" style="width:100%;height:36px;font-size:12px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:6px;">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 2v20M19 2v20M2 5h20M2 19h20"/></svg>
        Fit to Frame
      </button>
      <span class="tp-card-tag" style="margin-bottom:8px;display:block;">Alignment</span>
      <div class="tp-align-row" style="display:flex;gap:8px;align-items:center;">
        <div class="tp-align-segmented-group">
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="left" title="Align Left">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="1" y="2" width="1.5" height="12" rx="0.5"/><rect x="4" y="4" width="7" height="2.5" rx="0.75"/><rect x="4" y="9.5" width="10" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="center-h" title="Align Horizontal Center">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="7.25" y="2" width="1.5" height="12" rx="0.5"/><rect x="3" y="4" width="10" height="2.5" rx="0.75"/><rect x="4.5" y="9.5" width="7" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="right" title="Align Right">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="13.5" y="2" width="1.5" height="12" rx="0.5"/><rect x="5" y="4" width="7" height="2.5" rx="0.75"/><rect x="2" y="9.5" width="10" height="2.5" rx="0.75"/></svg>
          </button>
        </div>
        <div class="tp-align-segmented-group">
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="top" title="Align Top">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="2" y="1" width="12" height="1.5" rx="0.5"/><rect x="4" y="4" width="2.5" height="7" rx="0.75"/><rect x="9.5" y="4" width="2.5" height="10" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="center-v" title="Align Vertical Center">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="2" y="7.25" width="12" height="1.5" rx="0.5"/><rect x="4" y="3" width="2.5" height="10" rx="0.75"/><rect x="9.5" y="4.5" width="2.5" height="7" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="bottom" title="Align Bottom">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="2" y="13.5" width="12" height="1.5" rx="0.5"/><rect x="4" y="5" width="2.5" height="7" rx="0.75"/><rect x="9.5" y="2" width="2.5" height="10" rx="0.75"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function openFitFrameDrawer() {
  openDrawer(`
    <div class="tp-modern-header">
      <span class="tp-modern-title">Fit to Frame & Alignment</span>
      <button type="button" class="tp-modern-close" data-action="close-drawer" title="close">✕</button>
    </div>
    <div class="tp-card-box">
      <span class="tp-card-tag">Frame Snapping</span>
      <p style="font-size:12px;color:rgba(255,255,255,0.7);margin:4px 0 10px;line-height:1.4">
        Select an element on canvas to fit it to its page frame cell or align to its boundaries.
      </p>
      <button type="button" class="tp-btn-modern primary" data-action="fit-frame" style="width:100%;height:36px;font-size:12px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:6px;">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 2v20M19 2v20M2 5h20M2 19h20"/></svg>
        Fit to Frame
      </button>
      <span class="tp-card-tag" style="margin-bottom:8px;display:block;">Alignment</span>
      <div class="tp-align-row" style="display:flex;gap:8px;align-items:center;">
        <div class="tp-align-segmented-group">
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="left" title="Align Left">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="1" y="2" width="1.5" height="12" rx="0.5"/><rect x="4" y="4" width="7" height="2.5" rx="0.75"/><rect x="4" y="9.5" width="10" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="center-h" title="Align Horizontal Center">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="7.25" y="2" width="1.5" height="12" rx="0.5"/><rect x="3" y="4" width="10" height="2.5" rx="0.75"/><rect x="4.5" y="9.5" width="7" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="right" title="Align Right">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="13.5" y="2" width="1.5" height="12" rx="0.5"/><rect x="5" y="4" width="7" height="2.5" rx="0.75"/><rect x="2" y="9.5" width="10" height="2.5" rx="0.75"/></svg>
          </button>
        </div>
        <div class="tp-align-segmented-group">
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="top" title="Align Top">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="2" y="1" width="12" height="1.5" rx="0.5"/><rect x="4" y="4" width="2.5" height="7" rx="0.75"/><rect x="9.5" y="4" width="2.5" height="10" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="center-v" title="Align Vertical Center">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="2" y="7.25" width="12" height="1.5" rx="0.5"/><rect x="4" y="3" width="2.5" height="10" rx="0.75"/><rect x="9.5" y="4.5" width="2.5" height="7" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="bottom" title="Align Bottom">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="2" y="13.5" width="12" height="1.5" rx="0.5"/><rect x="4" y="5" width="2.5" height="7" rx="0.75"/><rect x="9.5" y="2" width="2.5" height="10" rx="0.75"/></svg>
          </button>
        </div>
      </div>
    </div>
  `);
}

function showShapeProps(o) {
  const isDoodle = o.type === 'path';
  const typeName = isDoodle ? 'Doodle' : (o.type === 'circle' ? 'Circle' : (o.type === 'triangle' ? 'Triangle' : (o.type === 'rect' ? 'Rectangle' : 'Shape')));
  const strokeW = Math.round(o.strokeWidth || 0);
  const opacityPct = Math.round((o.opacity ?? 1) * 100);

  let html = `
    <div class="tp-modern-header">
      <span class="tp-modern-title">${typeName}</span>
      <button type="button" class="tp-modern-close" data-action="close-drawer" title="close">✕</button>
    </div>
  `;

  if (!isDoodle) {
    html += canvaColorSectionHTML('fill', o.fill, 'Fill Color');
  }

  html += canvaStrokeSectionHTML(o.stroke || '#000000', strokeW);

  html += `
    <div class="tp-card-box tp-control-card">
      <div class="tp-card-header-row">
        <span class="tp-card-label">Opacity</span>
        <span class="tp-card-badge" id="val-opacity">${opacityPct}%</span>
      </div>
      <div class="tp-slider-track-wrap">
        <span class="tp-icon-a-sm" style="font-size:10px">0%</span>
        <input type="range" min="0" max="1" step="0.01" value="${o.opacity ?? 1}" data-prop="opacity" class="tp-modern-range" aria-label="opacity">
        <span class="tp-icon-a-lg" style="font-size:12px">100%</span>
      </div>
    </div>

    <div class="tp-card-box">
      <div class="tp-action-icon-row" style="margin-top:0;">
        <button type="button" class="tp-btn-icon" data-action="flip-h" title="Flip Horizontal" aria-label="Flip Horizontal">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="2 2"/><path d="M8 6L3 12l5 6V6z"/><path d="M16 6l5 6-5 6V6z"/></svg>
        </button>
        <button type="button" class="tp-btn-icon" data-action="flip-v" title="Flip Vertical" aria-label="Flip Vertical">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="22" y2="12" stroke-dasharray="2 2"/><path d="M6 8l6-5 6 5H6z"/><path d="M6 16l6 5 6-5H6z"/></svg>
        </button>
        <button type="button" class="tp-btn-icon" data-action="duplicate" title="Duplicate" aria-label="Duplicate">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        </button>
        <button type="button" class="tp-btn-icon tp-btn-danger" data-action="delete" title="Delete" aria-label="Delete">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
      <div style="display:flex;gap:6px;margin-top:6px;align-items:center;">
        <button type="button" class="tp-btn-modern primary" data-action="fit-frame" style="flex:1;height:28px;font-size:11px;display:flex;align-items:center;justify-content:center;gap:4px;padding:0 6px;">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 2v20M19 2v20M2 5h20M2 19h20"/></svg>
          Fit to Frame
        </button>
        <div class="tp-align-segmented-group" style="padding:2px;gap:1px;">
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="left" title="Align Left" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="1" y="2" width="1.5" height="12" rx="0.5"/><rect x="4" y="4" width="7" height="2.5" rx="0.75"/><rect x="4" y="9.5" width="10" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="center-h" title="Align Horizontal Center" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="7.25" y="2" width="1.5" height="12" rx="0.5"/><rect x="3" y="4" width="10" height="2.5" rx="0.75"/><rect x="4.5" y="9.5" width="7" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="right" title="Align Right" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="13.5" y="2" width="1.5" height="12" rx="0.5"/><rect x="5" y="4" width="7" height="2.5" rx="0.75"/><rect x="2" y="9.5" width="10" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="center-v" title="Align Vertical Center" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="2" y="7.25" width="12" height="1.5" rx="0.5"/><rect x="4" y="3" width="2.5" height="10" rx="0.75"/><rect x="9.5" y="4.5" width="2.5" height="7" rx="0.75"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;

  if (window.ZineEffects) {
    html += window.ZineEffects.renderEffectsSectionHTML(o);
  }

  html += positionSectionHTML(o);
  openDrawer(html);
}

function showTextProps(o) {
  if (window.TextPanel) {
    hideProps();
    window.TextPanel.update(o);
  }
}

function showImageProps(o) {
  const opacityPct = Math.round((o.opacity ?? 1) * 100);
  openDrawer(`
    <div class="tp-modern-header">
      <span class="tp-modern-title">Photo</span>
      <button type="button" class="tp-modern-close" data-action="close-drawer" title="close">✕</button>
    </div>

    <div class="tp-card-box">
      <button type="button" class="tp-btn-modern primary" data-action="replace-photo" style="width:100%;height:34px;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
        Replace Photo
      </button>
    </div>

    <div class="tp-card-box tp-control-card">
      <div class="tp-card-header-row">
        <span class="tp-card-label">Opacity</span>
        <span class="tp-card-badge" id="val-opacity">${opacityPct}%</span>
      </div>
      <div class="tp-slider-track-wrap">
        <span class="tp-icon-a-sm" style="font-size:10px">0%</span>
        <input type="range" min="0" max="1" step="0.01" value="${o.opacity ?? 1}" data-prop="opacity" class="tp-modern-range" aria-label="opacity">
        <span class="tp-icon-a-lg" style="font-size:12px">100%</span>
      </div>
    </div>

    <div class="tp-card-box">
      <div class="tp-action-icon-row" style="margin-top:0;">
        <button type="button" class="tp-btn-icon" data-action="flip-h" title="Flip Horizontal" aria-label="Flip Horizontal">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="2 2"/><path d="M8 6L3 12l5 6V6z"/><path d="M16 6l5 6-5 6V6z"/></svg>
        </button>
        <button type="button" class="tp-btn-icon" data-action="flip-v" title="Flip Vertical" aria-label="Flip Vertical">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="22" y2="12" stroke-dasharray="2 2"/><path d="M6 8l6-5 6 5H6z"/><path d="M6 16l6 5 6-5H6z"/></svg>
        </button>
        <button type="button" class="tp-btn-icon" data-action="crop" title="Crop" aria-label="Crop">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>
        </button>
        <button type="button" class="tp-btn-icon" data-action="duplicate" title="Duplicate" aria-label="Duplicate">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        </button>
        <button type="button" class="tp-btn-icon tp-btn-danger" data-action="delete" title="Delete" aria-label="Delete">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
      <div style="display:flex;gap:6px;margin-top:6px;align-items:center;">
        <button type="button" class="tp-btn-modern primary" data-action="fit-frame" style="flex:1;height:28px;font-size:11px;display:flex;align-items:center;justify-content:center;gap:4px;padding:0 6px;">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 2v20M19 2v20M2 5h20M2 19h20"/></svg>
          Fit to Frame
        </button>
        <div class="tp-align-segmented-group" style="padding:2px;gap:1px;">
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="left" title="Align Left" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="1" y="2" width="1.5" height="12" rx="0.5"/><rect x="4" y="4" width="7" height="2.5" rx="0.75"/><rect x="4" y="9.5" width="10" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="center-h" title="Align Horizontal Center" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="7.25" y="2" width="1.5" height="12" rx="0.5"/><rect x="3" y="4" width="10" height="2.5" rx="0.75"/><rect x="4.5" y="9.5" width="7" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="right" title="Align Right" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="13.5" y="2" width="1.5" height="12" rx="0.5"/><rect x="5" y="4" width="7" height="2.5" rx="0.75"/><rect x="2" y="9.5" width="10" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="center-v" title="Align Vertical Center" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="2" y="7.25" width="12" height="1.5" rx="0.5"/><rect x="4" y="3" width="2.5" height="10" rx="0.75"/><rect x="9.5" y="4.5" width="2.5" height="7" rx="0.75"/></svg>
          </button>
        </div>
      </div>
    </div>
    ${window.ZineAdjustments ? window.ZineAdjustments.renderSectionHTML(o) : ''}
    ${window.ZineEffects ? window.ZineEffects.renderEffectsSectionHTML(o) : ''}
    ${positionSectionHTML(o)}
  `);
}

function showGroupProps(o) {
  const itemsCount = o.getObjects ? o.getObjects().length : 0;
  const opacityPct = Math.round((o.opacity ?? 1) * 100);

  let html = `
    <div class="tp-modern-header">
      <span class="tp-modern-title">Group (${itemsCount} Items)</span>
      <button type="button" class="tp-modern-close" data-action="close-drawer" title="close">✕</button>
    </div>

    <div class="tp-card-box">
      <button type="button" class="tp-btn-modern primary" data-action="ungroup" style="width:100%;height:34px;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 8L3 3M16 8l5-5M8 16l-5 5M16 16l5 5"/>
          <rect x="8" y="8" width="8" height="8" rx="1.5"/>
        </svg>
        Ungroup (Ctrl+Shift+G)
      </button>
    </div>

    <div class="tp-card-box tp-control-card">
      <div class="tp-card-header-row">
        <span class="tp-card-label">Opacity</span>
        <span class="tp-card-badge" id="val-opacity">${opacityPct}%</span>
      </div>
      <div class="tp-slider-track-wrap">
        <span class="tp-icon-a-sm" style="font-size:10px">0%</span>
        <input type="range" min="0" max="1" step="0.01" value="${o.opacity ?? 1}" data-prop="opacity" class="tp-modern-range" aria-label="opacity">
        <span class="tp-icon-a-lg" style="font-size:12px">100%</span>
      </div>
    </div>

    <div class="tp-card-box">
      <div class="tp-action-icon-row" style="margin-top:0;">
        <button type="button" class="tp-btn-icon" data-action="flip-h" title="Flip Horizontal" aria-label="Flip Horizontal">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="2 2"/><path d="M8 6L3 12l5 6V6z"/><path d="M16 6l5 6-5 6V6z"/></svg>
        </button>
        <button type="button" class="tp-btn-icon" data-action="flip-v" title="Flip Vertical" aria-label="Flip Vertical">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="22" y2="12" stroke-dasharray="2 2"/><path d="M6 8l6-5 6 5H6z"/><path d="M6 16l6 5 6-5H6z"/></svg>
        </button>
        <button type="button" class="tp-btn-icon" data-action="duplicate" title="Duplicate" aria-label="Duplicate">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        </button>
        <button type="button" class="tp-btn-icon tp-btn-danger" data-action="delete" title="Delete" aria-label="Delete">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
      <div style="display:flex;gap:6px;margin-top:6px;align-items:center;">
        <button type="button" class="tp-btn-modern primary" data-action="fit-frame" style="flex:1;height:28px;font-size:11px;display:flex;align-items:center;justify-content:center;gap:4px;padding:0 6px;">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 2v20M19 2v20M2 5h20M2 19h20"/></svg>
          Fit to Frame
        </button>
        <div class="tp-align-segmented-group" style="padding:2px;gap:1px;">
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="left" title="Align Left" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="1" y="2" width="1.5" height="12" rx="0.5"/><rect x="4" y="4" width="7" height="2.5" rx="0.75"/><rect x="4" y="9.5" width="10" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="center-h" title="Align Horizontal Center" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="7.25" y="2" width="1.5" height="12" rx="0.5"/><rect x="3" y="4" width="10" height="2.5" rx="0.75"/><rect x="4.5" y="9.5" width="7" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="right" title="Align Right" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="13.5" y="2" width="1.5" height="12" rx="0.5"/><rect x="5" y="4" width="7" height="2.5" rx="0.75"/><rect x="2" y="9.5" width="10" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="center-v" title="Align Vertical Center" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="2" y="7.25" width="12" height="1.5" rx="0.5"/><rect x="4" y="3" width="2.5" height="10" rx="0.75"/><rect x="9.5" y="4.5" width="2.5" height="7" rx="0.75"/></svg>
          </button>
        </div>
      </div>
    </div>
    ${window.ZineEffects ? window.ZineEffects.renderEffectsSectionHTML(o) : ''}
    ${positionSectionHTML(o)}
  `;

  openDrawer(html);
}

function showMultiProps(objs) {
  const opacityPct = Math.round((objs[0].opacity ?? 1) * 100);
  openDrawer(`
    <div class="tp-modern-header">
      <span class="tp-modern-title">${objs.length} Objects Selected</span>
      <button type="button" class="tp-modern-close" data-action="close-drawer" title="close">✕</button>
    </div>

    <div class="tp-card-box">
      <button type="button" class="tp-btn-modern primary" data-action="group" style="width:100%;height:34px;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
          <path d="M7 7h10v10H7z" stroke-dasharray="2 2"/>
        </svg>
        Group Objects (Ctrl+G)
      </button>
    </div>

    <div class="tp-card-box tp-control-card">
      <div class="tp-card-header-row">
        <span class="tp-card-label">Opacity</span>
        <span class="tp-card-badge" id="val-opacity">${opacityPct}%</span>
      </div>
      <div class="tp-slider-track-wrap">
        <span class="tp-icon-a-sm" style="font-size:10px">0%</span>
        <input type="range" min="0" max="1" step="0.01" value="${objs[0].opacity ?? 1}" data-prop="opacity" class="tp-modern-range" aria-label="opacity">
        <span class="tp-icon-a-lg" style="font-size:12px">100%</span>
      </div>
    </div>

    <div class="tp-card-box">
      <div class="tp-action-icon-row" style="margin-top:0;">
        <button type="button" class="tp-btn-icon" data-action="flip-h" title="Flip Horizontal" aria-label="Flip Horizontal">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="2 2"/><path d="M8 6L3 12l5 6V6z"/><path d="M16 6l5 6-5 6V6z"/></svg>
        </button>
        <button type="button" class="tp-btn-icon" data-action="flip-v" title="Flip Vertical" aria-label="Flip Vertical">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="22" y2="12" stroke-dasharray="2 2"/><path d="M6 8l6-5 6 5H6z"/><path d="M6 16l6 5 6-5H6z"/></svg>
        </button>
        <button type="button" class="tp-btn-icon" data-action="duplicate" title="Duplicate" aria-label="Duplicate">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        </button>
        <button type="button" class="tp-btn-icon tp-btn-danger" data-action="delete" title="Delete" aria-label="Delete">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
      <div style="display:flex;gap:6px;margin-top:6px;align-items:center;">
        <button type="button" class="tp-btn-modern primary" data-action="fit-frame" style="flex:1;height:28px;font-size:11px;display:flex;align-items:center;justify-content:center;gap:4px;padding:0 6px;">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 2v20M19 2v20M2 5h20M2 19h20"/></svg>
          Fit to Frame
        </button>
        <div class="tp-align-segmented-group" style="padding:2px;gap:1px;">
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="left" title="Align Left" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="1" y="2" width="1.5" height="12" rx="0.5"/><rect x="4" y="4" width="7" height="2.5" rx="0.75"/><rect x="4" y="9.5" width="10" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="center-h" title="Align Horizontal Center" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="7.25" y="2" width="1.5" height="12" rx="0.5"/><rect x="3" y="4" width="10" height="2.5" rx="0.75"/><rect x="4.5" y="9.5" width="7" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="right" title="Align Right" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="13.5" y="2" width="1.5" height="12" rx="0.5"/><rect x="5" y="4" width="7" height="2.5" rx="0.75"/><rect x="2" y="9.5" width="10" height="2.5" rx="0.75"/></svg>
          </button>
          <button type="button" class="tp-align-btn" data-action="align-frame" data-value="center-v" title="Align Vertical Center" style="width:24px;height:24px;">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><rect x="2" y="7.25" width="12" height="1.5" rx="0.5"/><rect x="4" y="3" width="2.5" height="10" rx="0.75"/><rect x="9.5" y="4.5" width="2.5" height="7" rx="0.75"/></svg>
          </button>
        </div>
      </div>
    </div>
    ${positionSectionHTML(objs[0])}
  `);
}

function showCropProps() {
  openDrawer(`
    <div class="tp-modern-header">
      <span class="tp-modern-title">Crop Image</span>
    </div>
    <div class="tp-card-box">
      <span class="tp-card-tag">Instructions</span>
      <p style="font-size:12px;color:rgba(255,255,255,0.7);margin:4px 0;line-height:1.4">Drag the 8 round handles on canvas to crop the image area.</p>
    </div>
    <div class="tp-card-box" style="display:flex;gap:8px">
      <button type="button" class="tp-btn-modern primary" data-action="apply-crop" style="flex:1;height:36px">Apply Crop</button>
      <button type="button" class="tp-btn-modern" data-action="cancel-crop" style="flex:1;height:36px">Cancel</button>
    </div>
  `);
}

function refreshProps() {
  if (state.crop) { showCropProps(); return; }
  const c = activeCanvas();
  if (!c) { hideProps(); return; }
  const objs = c.getActiveObjects();
  if (!objs.length) { hideProps(); return; }
  if (objs.length > 1) {
    if (window.TextPanel) window.TextPanel.close();
    showMultiProps(objs);
    return;
  }
  const o = objs[0];
  if (isText(o)) {
    hideProps();
    if (window.TextPanel) window.TextPanel.update(o);
  } else if (o.type === 'image') {
    if (window.TextPanel) window.TextPanel.close();
    showImageProps(o);
  } else if (o.type === 'group') {
    if (window.TextPanel) window.TextPanel.close();
    showGroupProps(o);
  } else {
    if (window.TextPanel) window.TextPanel.close();
    showShapeProps(o);
  }
}
window.refreshProps = refreshProps;

function setCanvasBackgroundColor(val, applyToAll = false) {
  const c = activeCanvas();
  if (!c) return;

  c.backgroundColor = val;

  if (state.format === 'zine8') {
    if (applyToAll || state.designMode === 'free') {
      ZINE8_FRAMES.forEach(f => {
        state.frameBackgrounds[f.id] = val;
      });
      c.getObjects().forEach(o => {
        if (o.name && o.name.startsWith('frame-')) {
          o.set('fill', val);
          o.dirty = true;
        }
      });
    } else {
      const fid = state.activeFrameId || 'cover';
      state.frameBackgrounds[fid] = val;
      const frameObj = c.getObjects().find(o => o.name === 'frame-' + fid);
      if (frameObj) {
        frameObj.set('fill', val);
        frameObj.dirty = true;
      }
    }
  }

  c.requestRenderAll();
  markChange();
  scheduleAutosave();
  queueHistory(activePage());
}

function applyProp(prop, val) {
  const c = activeCanvas();
  if (!c) return;
  const objs = c.getActiveObjects();

  switch (prop) {
    case 'bgColor':
      setCanvasBackgroundColor(val, false);
      break;
    case 'doodleColor':
      state.doodleColor = val;
      if (c && c.freeDrawingBrush) c.freeDrawingBrush.color = val;
      break;
    case 'fill':
      if (typeof val === 'string' && val.startsWith('{')) {
        try {
          const data = JSON.parse(val);
          if (data._gradientMode && window.buildFabricGradient) {
            objs.forEach(o => o.set('fill', window.buildFabricGradient(data._gradientMode, data.angle, data.stops)));
            break;
          }
        } catch (_) {}
      }
      objs.forEach(o => o.set('fill', val));
      break;
    case 'stroke':
      if (typeof val === 'string' && val.startsWith('{')) {
        try {
          const data = JSON.parse(val);
          if (data._gradientMode && window.buildFabricGradient) {
            objs.forEach(o => {
              o.set('stroke', window.buildFabricGradient(data._gradientMode, data.angle, data.stops));
              if (!o.strokeWidth) o.set('strokeWidth', 2);
            });
            break;
          }
        } catch (_) {}
      }
      objs.forEach(o => {
        o.set('stroke', val);
        if (!o.strokeWidth) o.set('strokeWidth', 2);
      });
      break;
    case 'strokeWidth':
      objs.forEach(o => o.set('strokeWidth', clamp(val, 0, 60)));
      break;
    case 'opacity':
      objs.forEach(o => o.set('opacity', clamp(val, 0, 1)));
      break;
    case 'fontFamily':
      objs.forEach(o => { if (isText(o)) o.set('fontFamily', fq(val)); });
      break;
    case 'fontSize':
      objs.forEach(o => { if (isText(o)) o.set('fontSize', clamp(val || 6, 6, 400)); });
      break;
    case 'charSpacing':
      objs.forEach(o => { if (isText(o)) o.set('charSpacing', clamp(val, 0, 600)); });
      break;
  }

  objs.forEach(o => { o.dirty = true; o.setCoords(); });
  c.requestRenderAll();
  queueHistory(activePage());
}

(function bindDrawer() {
  const d = $('#propsDrawer');
  if (!d) return;

  d.addEventListener('click', e => {
    const eyeBtn = e.target.closest('.canva-eyedropper-btn');
    if (eyeBtn) {
      const prop = eyeBtn.dataset.prop || 'bgColor';
      if (window.EyeDropper) {
        new window.EyeDropper().open().then(result => {
          applyProp(prop, result.sRGBHex);
          if (prop === 'bgColor') {
            openBackgroundDrawer();
          } else {
            const container = eyeBtn.closest('.canva-color-section, .tp-color-card');
            if (container) {
              const pill = container.querySelector('.tp-color-swatch-pill');
              if (pill) pill.style.background = result.sRGBHex;
              container.querySelectorAll('.canva-swatch').forEach(b => {
                b.classList.toggle('active', (b.dataset.color || '').toLowerCase() === result.sRGBHex.toLowerCase());
              });
            }
          }
        }).catch(() => {});
      } else {
        const addBtn = eyeBtn.closest('.canva-color-section, .canva-color-drawer, .tp-color-card')?.querySelector('.canva-add-color-btn');
        if (addBtn) addBtn.click();
      }
      return;
    }

    const customSw = e.target.closest('.custom-color-btn');
    if (customSw) {
      const prop = customSw.dataset.prop || customSw.closest('.swatches')?.dataset?.prop || 'fill';
      const c = activeCanvas();
      if (!c) return;
      const objs = c.getActiveObjects();
      let curColor = '#000000';
      if (objs.length) {
        curColor = (prop === 'stroke' ? objs[0].stroke : objs[0].fill) || '#000000';
      } else if (prop === 'bgColor') {
        curColor = (state.format === 'zine8' ? (state.frameBackgrounds[state.activeFrameId || 'cover'] || '#ffffff') : (c.backgroundColor || '#ffffff'));
      } else if (prop === 'doodleColor') {
        curColor = state.doodleColor || '#000000';
      }
      if (window.FigmaColorPicker) {
        window.FigmaColorPicker.open(customSw, curColor, (colorStr) => {
          applyProp(prop, colorStr);
          if (prop === 'bgColor') {
            openBackgroundDrawer();
          } else {
            const container = customSw.closest('.canva-color-section, .tp-color-card');
            if (container) {
              const pill = container.querySelector('.tp-color-swatch-pill');
              if (pill) pill.style.background = colorStr;
              container.querySelectorAll('.canva-swatch').forEach(b => {
                b.classList.toggle('active', (b.dataset.color || '').toLowerCase() === colorStr.toLowerCase());
              });
            }
          }
        }, prop);
      }
      return;
    }

    const sw = e.target.closest('.swatch-btn[data-color], .canva-swatch[data-color]');
    if (sw) {
      applyProp(sw.dataset.prop, sw.dataset.color);
      const container = sw.closest('.canva-color-section, .canva-color-drawer, .tp-color-card') || sw.parentElement;
      if (container) {
        container.querySelectorAll('.canva-swatch, .swatch-btn').forEach(b => b.classList.remove('active'));
        sw.classList.add('active');
        const pill = container.querySelector('.tp-color-swatch-pill');
        if (pill) pill.style.background = sw.dataset.color;
      }
      return;
    }

    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const c = activeCanvas();
    if (!c) return;

    if (action === 'apply-bg-all') {
      const curCol = state.format === 'zine8'
        ? (state.frameBackgrounds[state.activeFrameId || 'cover'] || '#ffffff')
        : (c.backgroundColor || '#ffffff');
      setCanvasBackgroundColor(curCol, true);
      toast('Warna latar diterapkan ke semua halaman');
      return;
    }

    if (action === 'open-full-palette') {
      const addBtn = d.querySelector('.canva-add-color-btn');
      if (addBtn) addBtn.click();
      return;
    }
    if (!c) return;
    const objs = c.getActiveObjects();

    switch (action) {
      case 'bold': {
        const on = !objs.every(o => o.fontWeight === 'bold');
        objs.forEach(o => { if (isText(o)) o.set('fontWeight', on ? 'bold' : 'normal'); });
        btn.classList.toggle('on', on);
        break;
      }
      case 'italic': {
        const on = !objs.every(o => o.fontStyle === 'italic');
        objs.forEach(o => { if (isText(o)) o.set('fontStyle', on ? 'italic' : 'normal'); });
        btn.classList.toggle('on', on);
        break;
      }
      case 'align': {
        const val = btn.dataset.value;
        objs.forEach(o => { if (isText(o)) o.set('textAlign', val); });
        const siblings = btn.parentElement.querySelectorAll('[data-action="align"]');
        siblings.forEach(s => s.classList.remove('on'));
        btn.classList.add('on');
        break;
      }
      case 'flip-h':
        objs.forEach(o => o.set('flipX', !o.flipX));
        break;
      case 'flip-v':
        objs.forEach(o => o.set('flipY', !o.flipY));
        break;
      case 'duplicate':
        duplicateSelection();
        return;
      case 'delete':
        deleteSelection();
        return;
      case 'crop':
        startCrop();
        return;
      case 'replace-photo': {
        const sel = c.getActiveObjects();
        const imgObj = sel.find(o => o.type === 'image');
        if (imgObj) replacePhoto(imgObj);
        return;
      }
      case 'apply-crop':
        applyCrop();
        return;
      case 'cancel-crop': {
        const prevImg = state.crop ? state.crop.img : null;
        exitCrop(false);
        if (prevImg) {
          c.setActiveObject(prevImg);
          c.requestRenderAll();
          refreshProps();
        }
        return;
      }
      case 'bg-image':
        $('#file-background').click();
        return;
      case 'bg-remove':
        c.setBackgroundImage(null, () => { c.requestRenderAll(); markChange(); });
        toast('background image removed');
        return;
      case 'add-shape':
        addShape(btn.dataset.shape);
        return;
      case 'layer':
        applyLayer(btn.dataset.value);
        return;
      case 'set-guide-color':
        guideColor = btn.dataset.value;
        state.guideColor = guideColor;
        drawGuides();
        openGuideColorDrawer();
        return;
      case 'toggle-guide-visibility':
        toggleGuides();
        return;
      case 'fit-frame':
        fitToFrame();
        return;
      case 'align-frame': {
        const dir = btn.dataset.value;
        alignToFrame(objs, dir);
        c.requestRenderAll();
        markChange();
        return;
      }
      case 'nudge': {
        const dir = btn.dataset.dir;
        const step = e.shiftKey ? 10 : 2;
        nudgeActiveObjects(dir, step);
        return;
      }
      case 'group':
        groupSelection();
        return;
      case 'ungroup':
        ungroupSelection();
        return;
      case 'close-drawer':
        hideProps();
        return;
    }

    objs.forEach(o => { o.dirty = true; o.setCoords(); });
    c.requestRenderAll();
    markChange(activePage());
  });

  d.addEventListener('input', e => {
    const el = e.target;
    if (!el) return;
    if (el.dataset.action === 'set-pos-x' || el.dataset.action === 'set-pos-y') {
      const c = activeCanvas();
      if (!c) return;
      const activeObj = c.getActiveObject();
      if (!activeObj) return;
      const v = parseFloat(el.value);
      if (!isNaN(v)) {
        if (el.dataset.action === 'set-pos-x') activeObj.set('left', v);
        else activeObj.set('top', v);
        activeObj.setCoords();
        if (state.format === 'zine8') {
          if (activeObj.type === 'activeSelection') {
            activeObj.getObjects().forEach(o => updateObjectClip(o));
          } else {
            updateObjectClip(activeObj);
          }
        }
        c.requestRenderAll();
        queueHistory(activePage());
      }
      return;
    }
    if (el.dataset.action === 'set-guide-color-custom') {
      guideColor = el.value;
      state.guideColor = guideColor;
      drawGuides();
      const hexSpan = d.querySelector('.tp-card-box span[style*="monospace"]');
      if (hexSpan) hexSpan.textContent = guideColor.toUpperCase();
      return;
    }
    if (!el.dataset || !el.dataset.prop) return;
    if (el.type === 'color') {
      applyProp(el.dataset.prop, el.value);
      return;
    }
    if (el.type === 'range' || el.type === 'number') {
      const v = parseFloat(el.value);
      if (!isNaN(v)) {
        applyProp(el.dataset.prop, v);
        const badge = d.querySelector('#val-' + el.dataset.prop);
        if (badge) {
          if (el.dataset.prop === 'opacity') badge.textContent = Math.round(v * 100) + '%';
          else if (el.dataset.prop === 'strokeWidth') badge.textContent = Math.round(v) + 'px';
          else badge.textContent = String(v);
        }
      }
    }
  });

  d.addEventListener('change', e => {
    const el = e.target;
    if (el && el.tagName === 'SELECT' && el.dataset.prop) {
      applyProp(el.dataset.prop, el.value);
    }
  });
})();

/* ============================================================
   TOOLS
   ============================================================ */
function handleTool(tool) {
  switch (tool) {
    case 'select':
      if (state.doodleMode) toggleDoodle();
      if (state.crop) exitCrop(false);
      const c = activeCanvas();
      if (c) c.discardActiveObject().requestRenderAll();
      hideProps();
      if (window.TextPanel) window.TextPanel.close();
      setActiveTool('select');
      toast('select tool');
      break;
    case 'templates':
      if (window.ZineTemplates?.openDrawer) window.ZineTemplates.openDrawer();
      setActiveTool('templates');
      break;
    case 'upload':
      $('#file-photo').click();
      setActiveTool('upload');
      break;
    case 'background':
      openBackgroundDrawer();
      setActiveTool('background');
      break;
    case 'shape':
      openShapeDrawer();
      setActiveTool('shape');
      break;
    case 'text':
      addText();
      setActiveTool('text');
      if (window.TextPanel) {
        window.TextPanel.open();
      }
      break;
    case 'doodle':
      toggleDoodle();
      setActiveTool(state.doodleMode ? 'doodle' : 'select');
      break;
    case 'texture':
      if (window.openTextureDrawer) window.openTextureDrawer();
      setActiveTool('texture');
      break;
    case 'crop': startCrop(); break;
    case 'duplicate': duplicateSelection(); break;
    case 'delete': deleteSelection(); break;
    case 'layers':
      if (window.ZineLayers?.toggle) window.ZineLayers.toggle();
      else openLayersDrawer();
      break;
    case 'flip': openFlipDrawer(); break;
    case 'fit-frame':
      fitToFrame();
      break;
    case 'rotate180': rotate180(); break;
    case 'zoom-in': applyZoom(zoom * 1.2); break;
    case 'zoom-out': applyZoom(zoom / 1.2); break;
    case 'fit': fitToScreen(); break;
    case 'guides':
      toggleGuides();
      setActiveTool(guidesOn ? 'guides' : 'select');
      break;
  }
}

function openBackgroundDrawer() {
  const c = activeCanvas();
  if (!c) return;
  const currentBg = state.format === 'zine8'
    ? (state.frameBackgrounds[state.activeFrameId || 'cover'] || '#ffffff')
    : ((typeof c.backgroundColor === 'string' ? c.backgroundColor : '#ffffff') || '#ffffff');
  const curHex = toHex(currentBg).toLowerCase();

  // Top quick colors (as shown in user photo 1: lime, dark green, white, dark grey, black)
  const topColors = ['#8ce832', '#2d4f43', '#ffffff', '#374151', '#000000'];
  let quickRowColors = [...topColors];
  if (!quickRowColors.map(col => col.toLowerCase()).includes(curHex)) {
    quickRowColors.splice(1, 0, curHex);
  }

  // 14 colors in 7x2 grid matching Image 1 exactly:
  // Row 1: Slate denim, Cobalt blue, Deep indigo, Vibrant purple, Soft pink, Coral red, Cream vanilla
  // Row 2: Electric neon lime, Bright chartreuse, Olive green, Forest green, Pure white, Off-white, Deep black
  const designPalette = [
    '#526c84', '#1b4fd8', '#432874', '#7726b0', '#fbcfe8', '#df4747', '#faecd2',
    '#c6f81a', '#9ee21c', '#65a547', '#227845', '#ffffff', '#f4f4f6', '#131210'
  ];

  const renderTopSwatches = quickRowColors.slice(0, 5).map(col => {
    const isAct = col.toLowerCase() === curHex;
    return `<button type="button" class="canva-swatch ${isAct ? 'active' : ''}" data-prop="bgColor" data-color="${col}" style="background:${col};" title="${col}" aria-label="color ${col}"></button>`;
  }).join('');

  const renderDesignSwatches = designPalette.map(col => {
    const isAct = col.toLowerCase() === curHex;
    return `<button type="button" class="canva-swatch ${isAct ? 'active' : ''}" data-prop="bgColor" data-color="${col}" style="background:${col};" title="${col}" aria-label="color ${col}"></button>`;
  }).join('');

  const activeFrameObj = ZINE8_FRAMES.find(f => f.id === (state.activeFrameId || 'cover')) || { label: 'COVER' };

  openDrawer(`
    <div class="canva-color-drawer" data-mode="background">
      <!-- Clean & Simple Header: Title + Close Button (no icon) -->
      <div class="canva-drawer-header">
        <div style="display:flex; flex-direction:column; gap:2px;">
          <span class="canva-drawer-title">Warna latar belakang</span>
          ${state.format === 'zine8' && state.designMode !== 'free' ? `
            <span style="font-size:10px; color:rgba(255,255,255,0.5); font-weight:600; text-transform:uppercase; letter-spacing:0.04em;">
              Halaman: ${activeFrameObj.label}
            </span>
          ` : ''}
        </div>
        <button type="button" class="tp-modern-close" data-action="close-drawer" title="close">✕</button>
      </div>

      <!-- Top Row: Rainbow (+) Add Color, Pipette/Eyedropper, and Quick Swatches -->
      <div class="canva-quick-row">
        <button type="button" class="canva-add-color-btn custom-color-btn" data-prop="bgColor" title="Tambah warna baru (Custom Color)" aria-label="custom color">
          <div class="canva-add-inner">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"><line x1="12" y1="6" x2="12" y2="18"/><line x1="6" y1="12" x2="18" y2="12"/></svg>
          </div>
        </button>

        <button type="button" class="canva-eyedropper-btn" data-prop="bgColor" title="Ambil warna dari layar (Eyedropper)" aria-label="eyedropper">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 4l6 6"/>
            <path d="M4 20l4-1 10.5-10.5a2.12 2.12 0 1 0-3-3L5 16l-1 4z"/>
            <line x1="14" y1="4" x2="8" y2="10"/>
          </svg>
        </button>

        ${renderTopSwatches}
      </div>

      <!-- Section: Warna dalam desain ini -->
      <div class="canva-section-header">
        <span class="canva-section-title">Warna dalam desain ini</span>
        <button type="button" class="canva-section-action custom-color-btn" data-prop="bgColor">Lihat semua</button>
      </div>

      <!-- Grid: 7 columns x 2 rows of color dots -->
      <div class="canva-grid-swatches">
        ${renderDesignSwatches}
      </div>

      ${state.format === 'zine8' && state.designMode !== 'free' ? `
        <div style="margin-top:10px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08);">
          <button type="button" class="tp-apply-all-btn" data-action="apply-bg-all" style="width:100%; padding:9px 12px; border-radius:8px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#ffffff; font-size:12px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.15s ease;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="3"/>
              <path d="M7 2v20M17 2v20M2 12h20"/>
            </svg>
            Terapkan ke semua halaman
          </button>
        </div>
      ` : ''}
    </div>
  `);
}

const SHAPE_ICONS = {
  rect: '<rect x="4" y="6" width="16" height="12"/>',
  circle: '<circle cx="12" cy="12" r="8"/>',
  triangle: '<path d="M12 4 L20 19 H4 Z"/>',
  star: '<path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z"/>',
  heart: '<path d="M12 20C6 15 3 12 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 12 18 15 12 20z"/>',
  line: '<path d="M4 12h16"/>',
  arrow: '<path d="M4 12h16M15 7l5 5-5 5"/>',
  blob: '<path d="M12 4c5 0 8 4 7 9-1 5-6 8-10 6-4-2-6-6-4-10 1.5-3 4-5 7-5z"/>'
};

function openShapeDrawer() {
  const items = Object.keys(SHAPE_ICONS).map(k =>
    `<button type="button" class="tp-shape-chip" data-action="add-shape" data-shape="${k}" aria-label="add ${k}" title="${k}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        ${SHAPE_ICONS[k]}
      </svg>
      <span class="chip-name">${k}</span>
    </button>`
  ).join('');

  openDrawer(`
    <div class="tp-modern-header">
      <span class="tp-modern-title">Shapes</span>
      <button type="button" class="tp-modern-close" data-action="close-drawer" title="close">✕</button>
    </div>
    <div class="tp-card-box">
      <span class="tp-card-tag">Add Shape</span>
      <div class="tp-shape-grid">${items}</div>
    </div>
    <div class="tp-card-box" style="padding:10px 12px">
      <span style="font-size:11px;color:rgba(255,255,255,0.6);line-height:1.4;display:block">
        Click any shape to place it on canvas. You can customize colors, gradients, stroke, and opacity after adding.
      </span>
    </div>
  `);
}

function openLayersDrawer() {
  const c = activeCanvas();
  if (!c || !c.getActiveObjects().length) { toast('select something first'); return; }
  openDrawer(`
    <div class="tp-modern-header">
      <span class="tp-modern-title">Layer Order</span>
      <button type="button" class="tp-modern-close" data-action="close-drawer" title="close">✕</button>
    </div>
    <div class="tp-card-box">
      <span class="tp-card-tag">Positioning</span>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:6px">
        <button type="button" class="tp-btn-modern" data-action="layer" data-value="front">Bring to Front</button>
        <button type="button" class="tp-btn-modern" data-action="layer" data-value="forward">Bring Forward</button>
        <button type="button" class="tp-btn-modern" data-action="layer" data-value="backward">Send Backward</button>
        <button type="button" class="tp-btn-modern" data-action="layer" data-value="back">Send to Back</button>
      </div>
    </div>
  `);
}

function openFlipDrawer() {
  const c = activeCanvas();
  if (!c || !c.getActiveObjects().length) { toast('select something first'); return; }
  openDrawer(`
    <div class="tp-modern-header">
      <span class="tp-modern-title">Flip Object</span>
      <button type="button" class="tp-modern-close" data-action="close-drawer" title="close">✕</button>
    </div>
    <div class="tp-card-box">
      <span class="tp-card-tag">Orientation</span>
      <div class="tp-action-icon-row">
        <button type="button" class="tp-btn-icon" data-action="flip-h" title="Flip Horizontal" aria-label="Flip Horizontal" style="height:38px;gap:8px">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="2 2"/><path d="M8 6L3 12l5 6V6z"/><path d="M16 6l5 6-5 6V6z"/></svg>
          <span style="font-size:12px;font-weight:500">Horizontal</span>
        </button>
        <button type="button" class="tp-btn-icon" data-action="flip-v" title="Flip Vertical" aria-label="Flip Vertical" style="height:38px;gap:8px">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="22" y2="12" stroke-dasharray="2 2"/><path d="M6 8l6-5 6 5H6z"/><path d="M6 16l6 5 6-5H6z"/></svg>
          <span style="font-size:12px;font-weight:500">Vertical</span>
        </button>
      </div>
    </div>
  `);
}

function applyLayer(dir) {
  const c = activeCanvas();
  if (!c) return;
  c.getActiveObjects().forEach(o => {
    if (dir === 'front') c.bringToFront(o);
    else if (dir === 'forward') c.bringForward(o);
    else if (dir === 'backward') c.sendBackwards(o);
    else c.sendToBack(o);
  });
  c.requestRenderAll();
  markChange();
}

function flipSelection(axis) {
  const c = activeCanvas();
  if (!c || !c.getActiveObjects().length) return;
  c.getActiveObjects().forEach(o => {
    if (axis === 'h') o.set('flipX', !o.flipX);
    else if (axis === 'v') o.set('flipY', !o.flipY);
  });
  c.requestRenderAll();
  markChange();
}

function addText() {
  const c = activeCanvas();
  if (!c) return;
  let cx = state.pageW / 2;
  let cy = state.pageH * 0.42;
  let maxW = Math.min(state.pageW * 0.75, 360);
  let fs = Math.round(state.pageH * 0.075);

  if (state.format === 'zine8') {
    const targetFrame = (c.getActiveObject() ? getFrameForObject(c.getActiveObject()) : null)
      || (state.activeFrameId ? ZINE8_FRAMES.find(x => x.id === state.activeFrameId) : null)
      || ZINE8_FRAMES.find(x => x.id === 'cover') || ZINE8_FRAMES[1];
    cx = targetFrame.col * SHEET.FW + SHEET.FW / 2;
    cy = targetFrame.row * SHEET.FH + SHEET.FH / 2;
    maxW = Math.min(SHEET.FW * 0.8, 360);
    fs = 26;
  }

  const t = new fabric.Textbox('your text', {
    left: cx,
    top: cy,
    originX: 'center',
    originY: 'center',
    width: maxW,
    fontFamily: fq(state.theme.titleFont),
    fontSize: fs,
    fill: state.theme.ink || '#000000',
    textAlign: 'center',
    charSpacing: 0,
    lineHeight: 1.1
  });
  c.add(t);
  c.setActiveObject(t);
  c.requestRenderAll();
  refreshProps();
  markChange();
  try { t.enterEditing(); t.selectAll(); } catch (e) { /* noop */ }
}

function addShape(kind) {
  const c = activeCanvas();
  if (!c) return;
  let W = state.pageW;
  let H = state.pageH;
  let cx = W / 2;
  let cy = H / 2;

  if (state.format === 'zine8') {
    const targetFrame = (c.getActiveObject() ? getFrameForObject(c.getActiveObject()) : null)
      || (state.activeFrameId ? ZINE8_FRAMES.find(x => x.id === state.activeFrameId) : null)
      || ZINE8_FRAMES.find(x => x.id === 'cover') || ZINE8_FRAMES[1];
    cx = targetFrame.col * SHEET.FW + SHEET.FW / 2;
    cy = targetFrame.row * SHEET.FH + SHEET.FH / 2;
    W = SHEET.FW;
    H = SHEET.FH;
  }

  const fill = state.theme.accent || '#000000';
  const ink = state.theme.ink || '#000000';
  const size = Math.min(W, H) * 0.38;
  const common = {
    left: cx, top: cy, originX: 'center', originY: 'center',
    fill: fill, stroke: ink, strokeWidth: 0, strokeUniform: true
  };
  let o = null;

  switch (kind) {
    case 'rect':
      o = new fabric.Rect(Object.assign({}, common, { width: size * 1.2, height: size }));
      break;
    case 'circle':
      o = new fabric.Circle(Object.assign({}, common, { radius: size / 2 }));
      break;
    case 'triangle':
      o = new fabric.Triangle(Object.assign({}, common, { width: size, height: size }));
      break;
    case 'star':
      o = new fabric.Polygon(starPoints(0, 0, size / 2), common);
      break;
    case 'heart': {
      const p = new fabric.Path('M 0 28 C -38 -12 -92 26 0 100 C 92 26 38 -12 0 28 Z', {
        fill: fill, stroke: ink, strokeWidth: 0
      });
      p.scaleToWidth(size);
      p.set({ left: cx, top: cy, originX: 'center', originY: 'center' });
      o = p;
      break;
    }
    case 'line':
      o = new fabric.Line([cx - size, cy, cx + size, cy], {
        stroke: fill, strokeWidth: 8, strokeLineCap: 'round', strokeUniform: true
      });
      break;
    case 'arrow': {
      const p = new fabric.Path('M 0 60 L 110 60 M 86 38 L 110 60 L 86 82', {
        fill: null, stroke: fill, strokeWidth: 8,
        strokeLineCap: 'round', strokeLineJoin: 'round'
      });
      p.scaleToWidth(size * 1.7);
      p.set({ left: cx, top: cy, originX: 'center', originY: 'center' });
      o = p;
      break;
    }
    case 'blob': {
      const pts = [];
      const n = 22;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        const rr = (size / 2) * (0.84 + 0.16 * Math.sin(i * 1.9 + 2));
        pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
      }
      o = new fabric.Polygon(pts, common);
      break;
    }
    default:
      o = new fabric.Rect(Object.assign({}, common, { width: size, height: size }));
  }

  if (!o) return;
  o.setCoords();
  c.add(o);
  c.setActiveObject(o);
  c.requestRenderAll();
  refreshProps();
  markChange();
  hideProps();
  refreshProps();
}

function duplicateSelection() {
  const c = activeCanvas();
  if (!c) return;
  const objs = c.getActiveObjects();
  if (!objs.length) { toast('select something first'); return; }

  const clones = [];
  let pending = objs.length;

  objs.forEach(o => {
    o.clone(cl => {
      if (cl) {
        cl.set({
          left: (o.left || 0) + 18,
          top: (o.top || 0) + 18,
          evented: true,
          selectable: true
        });
        cl.setCoords();
        c.add(cl);
        clones.push(cl);
      }
      if (--pending === 0) finish();
    }, ['selectable', 'evented']);
  });

  function finish() {
    c.discardActiveObject();
    if (clones.length === 1) c.setActiveObject(clones[0]);
    else if (clones.length > 1) c.setActiveObject(new fabric.ActiveSelection(clones, { canvas: c }));
    c.requestRenderAll();
    refreshProps();
    markChange();
  }
}

function groupSelection() {
  const c = activeCanvas();
  if (!c) return;
  const activeObj = c.getActiveObject();
  if (!activeObj) {
    toast('Pilih minimal 2 objek untuk di-group');
    return;
  }

  // Multi-selection (ActiveSelection) -> Group
  if (activeObj.type === 'activeSelection') {
    const items = activeObj.getObjects ? activeObj.getObjects() : [];
    if (items.length < 2) {
      toast('Pilih minimal 2 objek untuk di-group');
      return;
    }

    // Strip individual clipPath so they don't break group geometry
    items.forEach(o => {
      if (o.clipPath) {
        o.clipPath = null;
        o.dirty = true;
      }
    });

    let group = null;
    if (typeof activeObj.toGroup === 'function') {
      group = activeObj.toGroup();
    } else {
      c.discardActiveObject();
      items.forEach(item => c.remove(item));
      group = new fabric.Group(items);
      c.add(group);
      c.setActiveObject(group);
    }

    if (group) {
      group.name = 'group-' + Date.now();
      group.setCoords();
      if (state.format === 'zine8') {
        updateObjectClip(group);
      }
      c.requestRenderAll();
      markChange();
      refreshProps();
      if (window.ZineLayers && typeof window.ZineLayers.render === 'function') {
        window.ZineLayers.render();
      }
      toast('Objek berhasil di-group (Ctrl+G)');
    }
    return;
  }

  if (activeObj.type === 'group') {
    toast('Objek sudah berupa group');
    return;
  }

  toast('Pilih minimal 2 objek untuk di-group');
}

function ungroupSelection() {
  const c = activeCanvas();
  if (!c) return;
  const activeObj = c.getActiveObject();
  if (!activeObj) {
    toast('Pilih group untuk di-ungroup');
    return;
  }

  if (activeObj.type === 'group') {
    if (activeObj.clipPath) {
      activeObj.clipPath = null;
      activeObj.dirty = true;
    }

    let sel = null;
    if (typeof activeObj.toActiveSelection === 'function') {
      sel = activeObj.toActiveSelection();
    } else {
      const items = activeObj.getObjects ? activeObj.getObjects() : [];
      c.remove(activeObj);
      items.forEach(item => {
        item.group = null;
        c.add(item);
      });
      sel = new fabric.ActiveSelection(items, { canvas: c });
      c.setActiveObject(sel);
    }

    if (sel) {
      if (state.format === 'zine8') {
        sel.getObjects().forEach(o => updateObjectClip(o));
      }
      sel.setCoords();
    }

    c.requestRenderAll();
    markChange();
    refreshProps();
    if (window.ZineLayers && typeof window.ZineLayers.render === 'function') {
      window.ZineLayers.render();
    }
    toast('Group di-ungroup (Ctrl+Shift+G)');
    return;
  }

  toast('Objek yang dipilih bukan group');
}

function toggleGroupSelection() {
  const c = activeCanvas();
  if (!c) return;
  const activeObj = c.getActiveObject();
  if (!activeObj) return;

  if (activeObj.type === 'activeSelection') {
    groupSelection();
  } else if (activeObj.type === 'group') {
    ungroupSelection();
  }
}

function deleteSelection() {
  if (state.crop) { exitCrop(true); return; }
  const c = activeCanvas();
  if (!c) return;
  const objs = c.getActiveObjects();
  if (!objs.length) { toast('select something first'); return; }
  objs.forEach(o => c.remove(o));
  c.discardActiveObject();
  c.requestRenderAll();
  hideProps();
  markChange();
}

function copySelection() {
  const c = activeCanvas();
  if (!c) return;
  const objs = c.getActiveObjects();
  if (!objs.length) { toast('select something first'); return; }
  state.clipboard = objs.map(o => o.toObject(['selectable', 'evented'].concat(TEXT_PROPS)));
  toast('copied');
}

function pasteClipboard() {
  const c = activeCanvas();
  if (!c) return;
  if (!state.clipboard || !state.clipboard.length) return;

  const added = [];
  let pending = state.clipboard.length;

  state.clipboard.forEach(json => {
    fabric.util.enlivenObjects([json], objs => {
      (objs || []).forEach(o => {
        o.set({
          left: (o.left || 0) + 18,
          top: (o.top || 0) + 18,
          evented: true,
          selectable: true
        });
        o.setCoords();
        c.add(o);
        added.push(o);
      });
      if (--pending === 0) finish();
    });
  });

  function finish() {
    c.discardActiveObject();
    if (added.length === 1) c.setActiveObject(added[0]);
    else if (added.length > 1) c.setActiveObject(new fabric.ActiveSelection(added, { canvas: c }));
    c.requestRenderAll();
    refreshProps();
    markChange();
  }
}

async function addImageFiles(files) {
  const c = activeCanvas();
  if (!c || !files || !files.length) return;
  let idx = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type || file.type.indexOf('image/') !== 0) continue;
    try {
      let src = await fileToDataURL(file);
      src = await downscaleDataURL(src, 1600);
      const img = await new Promise((resolve, reject) => {
        fabric.Image.fromURL(src, im => im ? resolve(im) : reject(new Error('image')), { crossOrigin: 'anonymous' });
      });
      let cx = state.pageW / 2;
      let cy = state.pageH / 2;
      let maxW = state.pageW * 0.82;
      let maxH = state.pageH * 0.82;

      if (state.format === 'zine8') {
        const targetFrame = (c.getActiveObject() ? getFrameForObject(c.getActiveObject()) : null)
          || (state.activeFrameId ? ZINE8_FRAMES.find(x => x.id === state.activeFrameId) : null)
          || ZINE8_FRAMES.find(x => x.id === 'cover') || ZINE8_FRAMES[1];
        cx = targetFrame.col * SHEET.FW + SHEET.FW / 2;
        cy = targetFrame.row * SHEET.FH + SHEET.FH / 2;
        maxW = SHEET.FW * 0.85;
        maxH = SHEET.FH * 0.85;
      }

      const s = Math.min(maxW / img.width, maxH / img.height, 1);
      const off = (idx % 5) * 16;
      img.set({
        left: cx + off,
        top: cy + off,
        originX: 'center',
        originY: 'center',
        scaleX: s,
        scaleY: s
      });
      img.setCoords();
      c.add(img);
      c.setActiveObject(img);
      idx++;
    } catch (e) {
      toast('could not read that image');
    }
  }

  c.requestRenderAll();
  refreshProps();
  markChange();
}

async function setBackgroundImage(file) {
  const c = activeCanvas();
  if (!c || !file) return;
  try {
    let src = await fileToDataURL(file);
    src = await downscaleDataURL(src, 1800);
    const img = await new Promise((resolve, reject) => {
      fabric.Image.fromURL(src, im => im ? resolve(im) : reject(new Error('image')), { crossOrigin: 'anonymous' });
    });
    const s = Math.max(state.pageW / img.width, state.pageH / img.height);
    img.set({
      originX: 'left',
      originY: 'top',
      left: 0,
      top: 0,
      scaleX: s,
      scaleY: s,
      selectable: false,
      evented: false
    });
    c.setBackgroundImage(img, () => {
      c.requestRenderAll();
      markChange();
      toast('background image set');
    });
  } catch (e) {
    toast('could not read that image');
  }
}

/* ============================================================
   REPLACE PHOTO
   ============================================================ */

let _replaceTarget = null; // the fabric Image object to replace

async function replacePhoto(targetObj) {
  const c = activeCanvas();
  if (!c || !targetObj || targetObj.type !== 'image') return;
  _replaceTarget = targetObj;
  $('#file-replace').click();
}

$('#file-replace').addEventListener('change', async e => {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file || !_replaceTarget) return;
  const c = activeCanvas();
  if (!c) return;
  const target = _replaceTarget;
  _replaceTarget = null;
  try {
    let src = await fileToDataURL(file);
    src = await downscaleDataURL(src, 1600);
    const newImg = await new Promise((resolve, reject) => {
      fabric.Image.fromURL(src, im => im ? resolve(im) : reject(new Error('image')), { crossOrigin: 'anonymous' });
    });
    // Preserve position, scale, angle, opacity, clipPath, etc.
    newImg.set({
      left: target.left,
      top: target.top,
      scaleX: target.scaleX * (target.width / newImg.width),
      scaleY: target.scaleY * (target.height / newImg.height),
      angle: target.angle,
      originX: target.originX,
      originY: target.originY,
      opacity: target.opacity,
      flipX: target.flipX,
      flipY: target.flipY,
      clipPath: target.clipPath
    });
    newImg.setCoords();
    // Keep the same z-index
    const idx = c.getObjects().indexOf(target);
    c.remove(target);
    if (idx >= 0) {
      c.insertAt(newImg, idx, false);
    } else {
      c.add(newImg);
    }
    c.setActiveObject(newImg);
    c.requestRenderAll();
    refreshProps();
    markChange();
    toast('photo replaced');
  } catch (err) {
    toast('could not replace photo');
  }
});

/* ============================================================
   CROP
   ============================================================ */

/* Return the image's 4 corner points in canvas coords (ignoring viewportTransform) */
function _imgBoundsAbs(img) {
  const m = img.calcTransformMatrix();
  const hw = (img.width * img.scaleX) / 2;
  const hh = (img.height * img.scaleY) / 2;
  /* corners in local space (origin = center, already scaled) */
  const corners = [
    { x: -hw, y: -hh },
    { x:  hw, y: -hh },
    { x:  hw, y:  hh },
    { x: -hw, y:  hh }
  ];
  /* But calcTransformMatrix already includes scale, so use un-scaled half */
  const hw2 = img.width / 2;
  const hh2 = img.height / 2;
  const pts = [
    { x: -hw2, y: -hh2 },
    { x:  hw2, y: -hh2 },
    { x:  hw2, y:  hh2 },
    { x: -hw2, y:  hh2 }
  ].map(p => fabric.util.transformPoint(new fabric.Point(p.x, p.y), m));

  const xs = pts.map(p => p.x);
  const ys = pts.map(p => p.y);
  return {
    left:   Math.min.apply(null, xs),
    top:    Math.min.apply(null, ys),
    right:  Math.max.apply(null, xs),
    bottom: Math.max.apply(null, ys),
    width:  Math.max.apply(null, xs) - Math.min.apply(null, xs),
    height: Math.max.apply(null, ys) - Math.min.apply(null, ys)
  };
}

function startCrop() {
  const c = activeCanvas();
  if (!c) return;
  if (state.crop) exitCrop(true);

  const img = c.getActiveObject();
  if (!img || img.type !== 'image') { toast('select a photo to crop'); return; }

  img.setCoords();

  /* Compute the axis-aligned bounding box of the image in canvas coords */
  const ib = _imgBoundsAbs(img);

  /* Create crop rect using ABSOLUTE positioning (originX/Y = 'left'/'top')
     so we can easily constrain it to image bounds */
  const rect = new fabric.Rect({
    left: ib.left,
    top: ib.top,
    width: ib.width,
    height: ib.height,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    originX: 'left',
    originY: 'top',
    fill: 'rgba(255,255,255,0.001)',
    stroke: '#ffffff',
    strokeWidth: 2,
    strokeDashArray: [8, 6],
    strokeUniform: true,
    lockRotation: true,
    lockScalingFlip: true,
    hasBorders: false,
    cornerStyle: 'circle',
    transparentCorners: false,
    cornerColor: '#ffffff',
    cornerStrokeColor: '#000000',
    cornerSize: 14,
    objectCaching: false,
    noScaleCache: true,
    _isCropRect: true
  });
  if (rect.setControlsVisibility) rect.setControlsVisibility({ mtr: false });

  const saved = c.getObjects().map(o => ({
    o: o, selectable: o.selectable, evented: o.evented
  }));

  state.busy = true;
  c.discardActiveObject();
  c.add(rect);

  const dims = [];
  for (let i = 0; i < 4; i++) {
    const d = new fabric.Rect({
      fill: 'rgba(0,0,0,0.45)',
      strokeWidth: 0,
      selectable: false,
      evented: false,
      objectCaching: false,
      hoverCursor: 'default'
    });
    dims.push(d);
    c.add(d);
  }
  c.bringToFront(rect);
  state.busy = false;

  c.selection = false;
  saved.forEach(s => { s.o.selectable = false; s.o.evented = false; });
  rect.selectable = true;
  rect.evented = true;
  rect.setCoords();

  state.crop = { page: c.__page, img: img, rect: rect, dims: dims, saved: saved, imgBounds: ib };
  c.setActiveObject(rect);
  updateCropDim();
  c.requestRenderAll();
  showCropProps();
}

/* Clamp the crop rect so it stays within the image bounds */
function constrainCropRect() {
  const cr = state.crop;
  if (!cr) return;
  const rect = cr.rect;
  const ib = cr.imgBounds;

  /* After scaling, fabric changes scaleX/scaleY but keeps width/height.
     Flatten scale into width/height so we work with absolute dimensions. */
  let rw = rect.width * rect.scaleX;
  let rh = rect.height * rect.scaleY;

  /* Clamp size to image bounds */
  rw = clamp(rw, 20, ib.width);
  rh = clamp(rh, 20, ib.height);

  /* Clamp position */
  let rl = rect.left;
  let rt = rect.top;
  rl = clamp(rl, ib.left, ib.left + ib.width - rw);
  rt = clamp(rt, ib.top, ib.top + ib.height - rh);

  rect.set({
    left: rl,
    top: rt,
    width: rw,
    height: rh,
    scaleX: 1,
    scaleY: 1
  });
  rect.setCoords();
}

function updateCropDim() {
  const cr = state.crop;
  if (!cr) return;

  constrainCropRect();

  const rect = cr.rect;
  const ib = cr.imgBounds;
  const W = cr.page.canvas.width;
  const H = cr.page.canvas.height;

  /* Get the crop rect's absolute bounds */
  const x1 = rect.left;
  const y1 = rect.top;
  const x2 = rect.left + rect.width;
  const y2 = rect.top + rect.height;

  const dtop = cr.dims[0];
  const dbottom = cr.dims[1];
  const dleft = cr.dims[2];
  const dright = cr.dims[3];

  /* Dim overlays cover the entire canvas EXCEPT the crop rect hole */
  dtop.set({ left: 0, top: 0, width: W, height: Math.max(0, y1), scaleX: 1, scaleY: 1 });
  dbottom.set({ left: 0, top: y2, width: W, height: Math.max(0, H - y2), scaleX: 1, scaleY: 1 });
  dleft.set({ left: 0, top: y1, width: Math.max(0, x1), height: Math.max(0, y2 - y1), scaleX: 1, scaleY: 1 });
  dright.set({ left: x2, top: y1, width: Math.max(0, W - x2), height: Math.max(0, y2 - y1), scaleX: 1, scaleY: 1 });

  cr.dims.forEach(d => { d.setCoords(); d.dirty = true; });
  cr.page.canvas.requestRenderAll();
}

function exitCrop(render) {
  const cr = state.crop;
  if (!cr) return;
  state.crop = null;

  const c = cr.page.canvas;
  state.busy = true;
  try { c.remove(cr.rect); } catch (e) { /* noop */ }
  cr.dims.forEach(d => { try { c.remove(d); } catch (e) { /* noop */ } });
  cr.saved.forEach(s => { s.o.selectable = s.selectable; s.o.evented = s.evented; });
  c.selection = true;
  state.busy = false;

  if (render) {
    c.discardActiveObject();
    c.requestRenderAll();
  }
  hideProps();
}

function applyCrop() {
  const cr = state.crop;
  if (!cr) return;

  const img = cr.img;
  const rect = cr.rect;
  const ib = cr.imgBounds;

  /* The crop rect is in canvas absolute coords (originX:left, originY:top, no rotation).
     Convert crop rect bounds to a fraction of the image's visual bounds. */
  const fracLeft   = (rect.left - ib.left) / ib.width;
  const fracTop    = (rect.top  - ib.top)  / ib.height;
  const fracRight  = (rect.left + rect.width - ib.left) / ib.width;
  const fracBottom = (rect.top  + rect.height - ib.top)  / ib.height;

  /* Clamp fractions to [0, 1] */
  const f0x = clamp(fracLeft, 0, 1);
  const f0y = clamp(fracTop, 0, 1);
  const f1x = clamp(fracRight, 0, 1);
  const f1y = clamp(fracBottom, 0, 1);

  /* Map fractions to pixel coordinates within the source image.
     img.width / img.height = the currently visible portion of the source.
     img.cropX / img.cropY = offset into the source. */
  const cx0 = img.cropX || 0;
  const cy0 = img.cropY || 0;

  let srcX, srcY, srcW, srcH;

  if (img.flipX) {
    srcX = cx0 + (1 - f1x) * img.width;
    srcW = (f1x - f0x) * img.width;
  } else {
    srcX = cx0 + f0x * img.width;
    srcW = (f1x - f0x) * img.width;
  }
  if (img.flipY) {
    srcY = cy0 + (1 - f1y) * img.height;
    srcH = (f1y - f0y) * img.height;
  } else {
    srcY = cy0 + f0y * img.height;
    srcH = (f1y - f0y) * img.height;
  }

  srcX = Math.round(srcX);
  srcY = Math.round(srcY);
  srcW = Math.max(4, Math.round(srcW));
  srcH = Math.max(4, Math.round(srcH));

  if (srcW < 4 || srcH < 4) {
    toast('crop area is too small');
    return;
  }

  /* Compute the center of the crop rect in canvas coords */
  const newCenterX = rect.left + rect.width / 2;
  const newCenterY = rect.top + rect.height / 2;

  const page = cr.page;
  const c = page.canvas;

  exitCrop(false);

  img.set({
    cropX: srcX,
    cropY: srcY,
    width: srcW,
    height: srcH
  });
  img.setPositionByOrigin(new fabric.Point(newCenterX, newCenterY), 'center', 'center');
  img.setCoords();
  img.dirty = true;

  c.setActiveObject(img);
  c.requestRenderAll();
  refreshProps();
  markChange(page);
  toast('cropped');
}

/* ============================================================
   SMART SNAPPING & MAGNETIC ALIGNMENT
   ============================================================ */
function onObjectMoving(page, e) {
  if (state.crop) { updateCropDim(); return; }
  if (!state.snap) return;
  const obj = e.target;
  if (!obj) return;

  if (window.ZineSnapping && typeof window.ZineSnapping.handleMoving === 'function') {
    window.ZineSnapping.handleMoving(page.canvas, e);
    return;
  }

  // Fallback if snapping module not ready
  const c = obj.getCenterPoint();
  const cx = page.canvas.width / 2;
  const cy = page.canvas.height / 2;
  const th = 8 / zoom;

  if (Math.abs(c.x - cx) <= th) {
    obj.set({ left: obj.left + (cx - c.x) });
  }
  if (Math.abs(c.y - cy) <= th) {
    obj.set({ top: obj.top + (cy - c.y) });
  }
  obj.setCoords();
}

/* ============================================================
   ZINE8-SPECIFIC TOOLS
   ============================================================ */
function fitToFrame() {
  const c = activeCanvas();
  if (!c || !c.getActiveObjects().length) {
    openFitFrameDrawer();
    toast('select an object to fit or align');
    return;
  }
  
  const objs = c.getActiveObjects();
  objs.forEach(o => {
    const cPt = o.getCenterPoint();
    let fx = 0, fy = 0, fw = SHEET.W, fh = SHEET.H;

    if (state.format === 'zine8') {
      const frameIndex = ZINE8_FRAMES.findIndex(f => {
        const x = f.col * SHEET.FW;
        const y = f.row * SHEET.FH;
        return cPt.x >= x && cPt.x < x + SHEET.FW && cPt.y >= y && cPt.y < y + SHEET.FH;
      });
      if (frameIndex >= 0) {
        const frame = ZINE8_FRAMES[frameIndex];
        fx = frame.col * SHEET.FW;
        fy = frame.row * SHEET.FH;
        fw = SHEET.FW;
        fh = SHEET.FH;
      }
    }
    
    if (o.type === 'image') {
      const scale = Math.max(fw / o.width, fh / o.height);
      o.set({
        scaleX: scale,
        scaleY: scale,
        left: fx + fw / 2,
        top: fy + fh / 2,
        originX: 'center',
        originY: 'center'
      });
    } else if (o.type === 'rect') {
      o.set({
        left: fx,
        top: fy,
        width: fw,
        height: fh,
        scaleX: 1,
        scaleY: 1,
        originX: 'left',
        originY: 'top'
      });
    } else {
      const curW = (o.width || 100) * (o.scaleX || 1);
      const curH = (o.height || 100) * (o.scaleY || 1);
      const scale = Math.min(fw / curW, fh / curH);
      o.set({
        scaleX: (o.scaleX || 1) * scale,
        scaleY: (o.scaleY || 1) * scale,
        left: fx + fw / 2,
        top: fy + fh / 2,
        originX: 'center',
        originY: 'center'
      });
    }
    o.setCoords();
    o.dirty = true;
    updateObjectClip(o);
  });
  
  c.requestRenderAll();
  markChange();
  toast('fitted to frame');
  refreshProps();
}

function alignToFrame(objs, dir) {
  const c = activeCanvas();
  if (!c) return;
  if (!objs || !objs.length) {
    toast('select an object first');
    return;
  }

  objs.forEach(o => {
    const cPt = o.getCenterPoint();
    let fx = 0, fy = 0, fw = SHEET.W, fh = SHEET.H;

    if (state.format === 'zine8') {
      const frameIndex = ZINE8_FRAMES.findIndex(f => {
        const x = f.col * SHEET.FW;
        const y = f.row * SHEET.FH;
        return cPt.x >= x && cPt.x < x + SHEET.FW && cPt.y >= y && cPt.y < y + SHEET.FH;
      });
      if (frameIndex >= 0) {
        const frame = ZINE8_FRAMES[frameIndex];
        fx = frame.col * SHEET.FW;
        fy = frame.row * SHEET.FH;
        fw = SHEET.FW;
        fh = SHEET.FH;
      }
    }

    const b = o.getBoundingRect(true);
    let deltaX = 0;
    let deltaY = 0;

    switch (dir) {
      case 'left':
        deltaX = fx - b.left;
        break;
      case 'center-h':
        deltaX = (fx + fw / 2) - (b.left + b.width / 2);
        break;
      case 'right':
        deltaX = (fx + fw) - (b.left + b.width);
        break;
      case 'top':
        deltaY = fy - b.top;
        break;
      case 'center-v':
        deltaY = (fy + fh / 2) - (b.top + b.height / 2);
        break;
      case 'bottom':
        deltaY = (fy + fh) - (b.top + b.height);
        break;
    }

    o.set({
      left: o.left + deltaX,
      top: o.top + deltaY
    });
    o.setCoords();
    o.dirty = true;
    updateObjectClip(o);
  });

  c.requestRenderAll();
  markChange();
  toast('aligned to frame (' + dir + ')');
}

function rotate180() {
  const c = activeCanvas();
  if (!c || !c.getActiveObjects().length) { toast('select an object first'); return; }
  c.getActiveObjects().forEach(o => {
    o.set('angle', ((o.angle || 0) + 180) % 360);
  });
  c.requestRenderAll();
  markChange();
}

/* ============================================================
   DOODLE + PEN TOOL
   ============================================================ */

// ---- Shared doodle drawer HTML ----
function doodleDrawerHTML() {
  const isFree = state.doodleBrush !== 'pen';
  let pillStyle = `background:${state.doodleColor || '#000000'};`;
  return `
    <div class="tp-modern-header">
      <span class="tp-modern-title">${isFree ? 'Doodle' : 'Pen Tool'}</span>
      <button type="button" class="tp-modern-close" data-action="exit-doodle" title="close">✕</button>
    </div>

    <!-- Mode switcher segmented -->
    <div class="tp-card-box">
      <span class="tp-card-tag">Drawing Tool</span>
      <div class="tp-seg-modern" style="margin-top:4px">
        <button type="button" class="tp-seg-btn-modern ${isFree ? 'active' : ''}" data-action="doodle-mode-free">
          ✏ Free Draw
        </button>
        <button type="button" class="tp-seg-btn-modern ${!isFree ? 'active' : ''}" data-action="doodle-mode-pen">
          ✦ Pen Tool
        </button>
      </div>
    </div>

    <!-- Color Card -->
    ${canvaColorSectionHTML('doodleColor', state.doodleColor, 'Color')}

    <!-- Size Slider Card -->
    <div class="tp-card-box tp-control-card">
      <div class="tp-card-header-row">
        <span class="tp-card-label">${isFree ? 'Brush Size' : 'Stroke Width'}</span>
        <span class="tp-card-badge" id="val-doodleSize">${state.doodleSize} px</span>
      </div>
      <div class="tp-slider-track-wrap">
        <span class="tp-icon-a-sm" style="font-size:11px">1</span>
        <input type="range" min="1" max="40" step="1" value="${state.doodleSize}" data-prop="doodleSize" class="tp-modern-range" aria-label="brush size">
        <span class="tp-icon-a-lg" style="font-size:15px">40</span>
      </div>
    </div>

    ${!isFree ? `
    <!-- Pen Tool Actions Card -->
    <div class="tp-card-box">
      <span class="tp-card-tag">Pen Tool Shortcut</span>
      <p style="font-size:11px;color:rgba(255,255,255,0.7);margin:4px 0 8px;line-height:1.4">Click canvas to add points · Double-click to close · ESC to cancel</p>
      <div style="display:flex;gap:6px">
        <button type="button" class="tp-btn-modern" data-action="pen-undo-point" style="flex:1">↩ Undo Point</button>
        <button type="button" class="tp-btn-modern primary" data-action="pen-finish" style="flex:1">Finish Shape</button>
      </div>
    </div>
    ` : ''}

    <div class="tp-card-box" style="padding:6px">
      <button type="button" class="tp-btn-modern primary" data-action="exit-doodle" style="width:100%;height:34px">Done</button>
    </div>
  `;
}

function toggleDoodle() {
  const c = activeCanvas();
  if (!c) return;
  state.doodleMode = !state.doodleMode;

  if (state.doodleMode) {
    if (state.doodleBrush === 'pen') {
      c.isDrawingMode = false;
      startPenTool();
    } else {
      c.isDrawingMode = true;
      c.freeDrawingBrush = new fabric.PencilBrush(c);
      c.freeDrawingBrush.color = state.doodleColor;
      c.freeDrawingBrush.width = state.doodleSize;
    }
    openDrawer(doodleDrawerHTML());
    toast(state.doodleBrush === 'pen' ? 'pen tool on — click to place points' : 'doodle on (ESC to exit)');
  } else {
    exitPenTool();
    c.isDrawingMode = false;
    toast('doodle mode off');
    hideProps();
  }
}

// ---- PEN TOOL (vector path builder) ----
let _penPoints = [];      // array of {x, y}
let _penPreviewLine = null; // live preview polyline
let _penCanvas = null;

function startPenTool() {
  const c = activeCanvas();
  if (!c) return;
  _penCanvas = c;
  _penPoints = [];
  _penPreviewLine = null;
  c.defaultCursor = 'crosshair';
  c.hoverCursor = 'crosshair';
  c.selection = false;

  c.on('mouse:move', _penMouseMove);
  c.on('mouse:down', _penMouseDown);
  c.on('mouse:dblclick', _penFinish);
}

function exitPenTool(commit) {
  const c = _penCanvas || activeCanvas();
  if (!c) return;
  c.off('mouse:move', _penMouseMove);
  c.off('mouse:down', _penMouseDown);
  c.off('mouse:dblclick', _penFinish);
  c.defaultCursor = 'default';
  c.hoverCursor = 'move';
  c.selection = true;

  // Remove preview line
  if (_penPreviewLine) { c.remove(_penPreviewLine); _penPreviewLine = null; }

  if (commit && _penPoints.length >= 2) {
    _commitPenPath(c);
  }
  _penPoints = [];
  _penCanvas = null;
}

function _penMouseMove(opt) {
  const c = _penCanvas;
  if (!c || _penPoints.length === 0) return;
  const ptr = c.getPointer(opt.e);

  // Build a temporary polyline showing the current path + cursor
  const previewPts = _penPoints.concat([{ x: ptr.x, y: ptr.y }]);

  if (_penPreviewLine) c.remove(_penPreviewLine);
  _penPreviewLine = new fabric.Polyline(previewPts, {
    fill: 'transparent',
    stroke: state.doodleColor,
    strokeWidth: Math.max(1, state.doodleSize),
    strokeDashArray: [6, 4],
    selectable: false,
    evented: false,
    originX: 'left',
    originY: 'top'
  });
  c.add(_penPreviewLine);
  c.requestRenderAll();
}

function _penMouseDown(opt) {
  if (opt.e && opt.e.detail >= 2) return; // ignore double-click here (handled by dblclick)
  if (opt.button === 3 || (opt.e && opt.e.button === 2)) return; // ignore right-click
  const c = _penCanvas;
  if (!c) return;
  const ptr = c.getPointer(opt.e);
  _penPoints.push({ x: ptr.x, y: ptr.y });

  // Draw a small dot to mark the point
  const dot = new fabric.Circle({
    left: ptr.x,
    top: ptr.y,
    radius: 3,
    fill: state.doodleColor,
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
    data: { _penDot: true }
  });
  c.add(dot);
  c.requestRenderAll();
}

function _penFinish() {
  exitPenTool(true);
  if (state.doodleMode) {
    // Restart in pen mode
    startPenTool();
    openDrawer(doodleDrawerHTML());
  }
}

function _commitPenPath(c) {
  if (_penPoints.length < 2) return;

  // Remove all dot markers
  const dots = c.getObjects().filter(o => o.data && o.data._penDot);
  dots.forEach(d => c.remove(d));

  // Build SVG path string
  const pts = _penPoints;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    // Simple smooth curve using mid-points (Chaikin-like)
    if (i < pts.length - 1) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      d += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`;
    } else {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
  }

  const path = new fabric.Path(d, {
    fill: 'transparent',
    stroke: state.doodleColor,
    strokeWidth: Math.max(1, state.doodleSize),
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
    selectable: true,
    evented: true
  });

  c.add(path);
  c.setActiveObject(path);
  c.requestRenderAll();
  markChange();
  toast('path added — select to edit');
}

(function bindDoodle() {
  const d = $('#propsDrawer');
  if (!d) return;
  d.addEventListener('input', e => {
    const el = e.target;
    if (el && el.dataset && el.dataset.prop === 'doodleSize') {
      state.doodleSize = clamp(parseFloat(el.value) || 4, 1, 40);
      const badge = d.querySelector('#val-doodleSize');
      if (badge) badge.textContent = state.doodleSize + 'px';
      const c = activeCanvas();
      if (c && c.freeDrawingBrush) c.freeDrawingBrush.width = state.doodleSize;
    }
    if (el && el.dataset && el.dataset.prop === 'doodleColor') {
      state.doodleColor = el.value;
      const c = activeCanvas();
      if (c && c.freeDrawingBrush) c.freeDrawingBrush.color = state.doodleColor;
    }
  });
  d.addEventListener('click', e => {
    const sw = e.target.closest('.swatch-btn[data-prop="doodleColor"], .canva-swatch[data-prop="doodleColor"]');
    if (sw && sw.dataset.color) {
      state.doodleColor = sw.dataset.color;
      const c = activeCanvas();
      if (c && c.freeDrawingBrush) c.freeDrawingBrush.color = state.doodleColor;
      const container = sw.closest('.canva-color-section, .tp-color-card') || sw.parentElement;
      if (container) {
        container.querySelectorAll('.canva-swatch, .swatch-btn').forEach(b => b.classList.remove('active'));
        sw.classList.add('active');
        const pill = container.querySelector('.tp-color-swatch-pill');
        if (pill) pill.style.background = sw.dataset.color;
      }
      return;
    }

    // Mode toggle buttons
    if (e.target.closest('[data-action="doodle-mode-free"]')) {
      if (state.doodleBrush === 'pen') {
        exitPenTool(false);
        state.doodleBrush = 'free';
        const c = activeCanvas();
        if (c) {
          c.isDrawingMode = true;
          c.freeDrawingBrush = new fabric.PencilBrush(c);
          c.freeDrawingBrush.color = state.doodleColor;
          c.freeDrawingBrush.width = state.doodleSize;
        }
      }
      openDrawer(doodleDrawerHTML());
      return;
    }
    if (e.target.closest('[data-action="doodle-mode-pen"]')) {
      if (state.doodleBrush !== 'pen') {
        const c = activeCanvas();
        if (c) c.isDrawingMode = false;
        state.doodleBrush = 'pen';
        startPenTool();
      }
      openDrawer(doodleDrawerHTML());
      return;
    }

    // Pen tool controls
    if (e.target.closest('[data-action="pen-undo-point"]')) {
      if (_penPoints.length > 0) {
        _penPoints.pop();
        // Remove last dot
        const c = _penCanvas || activeCanvas();
        if (c) {
          const dots = c.getObjects().filter(o => o.data && o.data._penDot);
          if (dots.length) c.remove(dots[dots.length - 1]);
          c.requestRenderAll();
        }
      }
      return;
    }
    if (e.target.closest('[data-action="pen-finish"]')) {
      _penFinish();
      return;
    }

    const btn = e.target.closest('[data-action="exit-doodle"]');
    if (btn) toggleDoodle();
  });
})();

/* ============================================================
   FILTERS
   ============================================================ */
function openFilterDrawer() {
  openDrawer(`
    <div class="tp-modern-header">
      <span class="tp-modern-title">Filters</span>
      <button type="button" class="tp-modern-close" data-action="close-drawer" title="close">✕</button>
    </div>
    <div class="tp-card-box" style="padding:12px">
      <span style="font-size:12px;color:rgba(255,255,255,0.7);display:block;line-height:1.5">
        Pro tip: Use the <strong>Texture</strong> tool in the toolbar for high quality paper scan, ink, and grunge overlays with live blend modes!
      </span>
    </div>
  `);
}

/* ============================================================
   PROJECT SAVE / LOAD
   ============================================================ */
window.__zineOpenProject = function (projectData) {
  if (projectData) {
    loadProject(projectData);
    return;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { toast('no saved project found'); return; }
    loadProject(JSON.parse(raw));
  } catch (e) {
    toast('could not restore that project');
  }
};

async function loadProject(data) {
  if (!data || !Array.isArray(data.pages) || !data.pages.length) {
    toast('that is not a zine maker file');
    return;
  }

  exitCrop(false);
  state.loading = true;

  state.projectId = data.id || ('proj_' + Date.now());
  state.projectTitle = data.title || (data.format === 'zine8' ? '8-page mini zine' : 'zine project');
  state.format = data.format || 'zine8';
  state.ratio = data.ratio || null;
  state.designMode = data.designMode || 'framed';
  state.activeFrameId = 'cover';
  updateDesignModeUI();
  state.pageW = data.pageW || 495;
  state.pageH = data.pageH || 700;
  state.theme = data.theme || defaultTheme();
  state.mood = data.mood || null;
  zoom = data.zoom || 1;
  guidesOn = data.guides !== false;
  state.guides = guidesOn;
  guideColor = data.guideColor || '#ff0000';
  state.guideColor = guideColor;
  state.active = 0;
  state.crop = null;
  state.frameBackgrounds = data.frameBackgrounds || {};
  state.pageCount = data.pages.length;

  buildPages(data.pages.length);

  for (let i = 0; i < data.pages.length; i++) {
    const p = state.pages[i];
    await new Promise(resolve => {
      try {
        p.canvas.loadFromJSON(JSON.parse(data.pages[i]), () => {
          // Strip any legacy helper labels or badges from canvas objects
          p.canvas.getObjects().slice().forEach(o => {
            if (o.name && (o.name.startsWith('label-') || o.name.startsWith('badge-'))) {
              p.canvas.remove(o);
            }
          });
          if (window.renderText) {
            p.canvas.getObjects().forEach(o => {
              if (o && (o.type === 'textbox' || o.type === 'i-text' || o.type === 'text')) {
                window.renderText(o);
              }
            });
          }
          p.canvas.getObjects().forEach(o => {
            if (o.type === 'image' && (o.adjustments || o.effects)) {
              if (window.ZineAdjustments) window.ZineAdjustments.applyAdjustments(o);
              else if (window.ZineEffects) window.ZineEffects.applyEffects(o);
            }
          });
          if (state.format === 'zine8') {
            p.canvas.getObjects().forEach(o => updateObjectClip(o));
          }
          resolve();
        });
      } catch (e) {
        resolve();
      }
    });
    p.history.undo = [snap(p)];
    p.history.redo = [];
  }

  state.active = clamp(data.active || 0, 0, state.pages.length - 1);
  state.loading = false;

  // Fix texture overlays after load
  state.pages.forEach(p => {
    if (!p || !p.canvas) return;
    p.canvas.getObjects().forEach(o => {
      if (o._isTextureOverlay) {
        o.set({ selectable: false, evented: false, name: 'texture-overlay' });
        p.canvas.bringToFront(o);
      }
    });
  });

  showScreen('editor');
  buildToolbar();
  buildThumbs();
  setMode('edit');
  showPage(state.active);
  const triggerCenterLoad = () => {
    if (state.pages.length) fitToScreen();
  };
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      triggerCenterLoad();
      setTimeout(triggerCenterLoad, 80);
      setTimeout(triggerCenterLoad, 220);
    });
  });
  updatePageLabel();
  saveNow();
  toast('project loaded');
}

function saveProjectFile() {
  if (!state.pages.length) return;
  commitEditing();
  if (state.crop) exitCrop(true);

  const data = serializeProject();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'zine-maker.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  toast('saved zine-maker.json');
}

/* ============================================================
   KEYBOARD + BOOT + TOOLBAR BIND
   ============================================================ */
function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

window.addEventListener('keydown', e => {
  if (!screens.editor.classList.contains('active')) return;
  if (!state.pages.length) return;

  const typing = isTypingTarget(e.target);
  const mod = e.ctrlKey || e.metaKey;
  const key = (e.key || '').toLowerCase();

  if (mod && key === 'z') {
    if (typing && !e.target.closest('.canvas-container')) return;
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
    return;
  }
  if (mod && key === 'y') {
    if (typing && !e.target.closest('.canvas-container')) return;
    e.preventDefault();
    redo();
    return;
  }
  if (mod && key === 'b') {
    e.preventDefault();
    window.ZineFlipbook?.open?.();
    return;
  }
  if (mod && e.shiftKey && key === 's') {
    e.preventDefault();
    state.snap = !state.snap;
    toast(state.snap ? 'Magnetic Guides: ON' : 'Magnetic Guides: OFF');
    return;
  }
  if (state.mode === 'preview') return;
  if (typing) return;

  // Nudge selected object with Arrow keys (1px, or 10px with Shift)
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    const c = activeCanvas();
    const activeObj = c ? c.getActiveObject() : null;
    if (activeObj && !activeObj.isEditing) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      let dir = 'left';
      if (e.key === 'ArrowRight') dir = 'right';
      else if (e.key === 'ArrowUp') dir = 'up';
      else if (e.key === 'ArrowDown') dir = 'down';
      nudgeActiveObjects(dir, step);
      return;
    }
  }

  if (mod && key === 'c') { e.preventDefault(); copySelection(); return; }
  if (mod && key === 'v') { e.preventDefault(); pasteClipboard(); return; }
  if (mod && key === 'd') { e.preventDefault(); duplicateSelection(); return; }
  if (mod && key === 'g') {
    e.preventDefault();
    if (e.shiftKey) {
      ungroupSelection();
    } else {
      toggleGroupSelection();
    }
    return;
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    deleteSelection();
    return;
  }
  if (e.key === 'Escape') {
    if (state.crop) {
      const prevImg = state.crop.img;
      const prevCanvas = state.crop.page.canvas;
      exitCrop(false);
      if (prevImg) {
        prevCanvas.setActiveObject(prevImg);
        prevCanvas.requestRenderAll();
        refreshProps();
      }
    }
    else if (state.doodleMode) toggleDoodle();
    else hideProps();
  }
});

(function bindToolbar() {
  const tb = $('#toolbar');
  if (!tb) return;
  tb.addEventListener('click', e => {
    const btn = e.target.closest('[data-tool]');
    if (!btn) return;
    handleTool(btn.dataset.tool);
  });
})();

$('#tab-mode-framed')?.addEventListener('click', () => setDesignMode('framed'));
$('#tab-mode-free')?.addEventListener('click', () => setDesignMode('free'));

$('#btn-flipbook')?.addEventListener('click', () => window.ZineFlipbook?.open?.());

$('#btn-undo').addEventListener('click', undo);
$('#btn-redo').addEventListener('click', redo);
$('#btn-save-json').addEventListener('click', () => window.ZineExport?.openDialog?.());
$('#btn-open-json')?.addEventListener('click', () => $('#file-load').click());

$('#print-export-pdf')?.addEventListener('click', () => window.ZineExport?.openDialog?.());
$('#print-export-png')?.addEventListener('click', () => window.ZineExport?.openDialog?.());

$('#file-load').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const text = await f.text();
    await loadProject(JSON.parse(text));
  } catch (err) {
    toast('could not read that file');
  }
});

$('#btn-back-editor').addEventListener('click', () => {
  if (state.crop) exitCrop(true);
  if (state.doodleMode) toggleDoodle();
  commitEditing();
  saveNow();
  showScreen('landing');
});

$('#file-photo').addEventListener('change', e => {
  const files = Array.from(e.target.files || []);
  e.target.value = '';
  addImageFiles(files);
});

$('#file-background').addEventListener('change', e => {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (f) setBackgroundImage(f);
});

(function bindDrop() {
  const sc = $('#stage-scroll');
  const overlay = $('#drop-overlay');
  if (!sc || !overlay) return;

  const hasFiles = e => {
    if (!e.dataTransfer || !e.dataTransfer.types) return false;
    return Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') !== -1;
  };

  let depth = 0;

  sc.addEventListener('dragenter', e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth++;
    overlay.classList.add('on');
  });
  sc.addEventListener('dragover', e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
  });
  sc.addEventListener('dragleave', e => {
    if (!hasFiles(e)) return;
    depth = Math.max(0, depth - 1);
    if (!depth) overlay.classList.remove('on');
  });
  sc.addEventListener('drop', e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    overlay.classList.remove('on');
    addImageFiles(Array.from(e.dataTransfer.files || []));
  });

  window.addEventListener('dragover', e => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', e => { if (hasFiles(e)) e.preventDefault(); });
})();

// Note: Selection is preserved while panning the stage. Deselection is handled naturally
// by Fabric.js on empty canvas click, by the Escape key, or by the close drawer button.

$('#dot-edit')?.addEventListener('click', () => setMode('edit'));
$('#dot-preview')?.addEventListener('click', () => setMode('preview'));

function setMode(mode) {
  if (!state.pages.length) return;
  state.mode = mode;

  const ed = $('#screen-editor');
  const isPreview = (mode === 'preview');
  ed.classList.toggle('mode-preview', isPreview);
  ed.classList.toggle('editor-light-mode', isPreview);
  $('#dot-edit')?.setAttribute('aria-pressed', String(!isPreview));
  $('#dot-preview')?.setAttribute('aria-pressed', String(isPreview));

  if (isPreview && state.crop) exitCrop(true);
  if (isPreview && state.doodleMode) toggleDoodle();

  state.pages.forEach(p => {
    p.canvas.discardActiveObject();
    p.canvas.selection = !isPreview;
    p.canvas.forEachObject(o => {
      if (o.name && (o.name.startsWith('frame-') || o.name.startsWith('label-') || o.name.startsWith('badge-'))) return;
      o.selectable = !isPreview;
      o.evented = !isPreview;
    });
    p.canvas.requestRenderAll();
  });

  if (isPreview) {
    hideProps();
    if (window.TextPanel && window.TextPanel.isOpen()) window.TextPanel.close();
    if (window.FigmaColorPicker && window.FigmaColorPicker.isOpen()) window.FigmaColorPicker.close();
  }
}

(function boot() {
  if (window.fabric) {
    fabric.Object.prototype.cornerStyle = 'circle';
    fabric.Object.prototype.cornerSize = 11;
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = '#ffffff';
    fabric.Object.prototype.cornerStrokeColor = '#000000';
    fabric.Object.prototype.borderColor = '#000000';
    fabric.Object.prototype.borderScaleFactor = 1.5;
    fabric.Object.prototype.padding = 2;
    fabric.Object.prototype.objectCaching = true;

    if (fabric.ActiveSelection) {
      fabric.ActiveSelection.prototype.borderColor = '#000000';
      fabric.ActiveSelection.prototype.cornerColor = '#ffffff';
      fabric.ActiveSelection.prototype.cornerStrokeColor = '#000000';
      fabric.ActiveSelection.prototype.borderScaleFactor = 1.5;
    }
  }

  buildToolbar();
  renderMoods();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => renderMoods()).catch(() => {});
  }

  try {
    if (localStorage.getItem(STORAGE_KEY)) {
      $('#btn-resume').classList.remove('hidden');
    }
  } catch (e) { /* private mode */ }
})();

window.addEventListener('beforeunload', () => { try { saveNow(); } catch (e) { /* noop */ } });

window.ZineApp = {
  getSheetCanvas: () => state.sheet?.canvas || null,
  getPages: () => state.pages,
  getActiveIndex: () => state.active || 0,
  getFormat: () => state.format,
  getGuidesOn: () => guidesOn,
  getFrameBackgrounds: () => state.frameBackgrounds,
  getActiveFrameId: () => state.activeFrameId || 'cover',
  setBackgroundColor: (val, all) => setCanvasBackgroundColor(val, all),
  refreshBackgroundDrawer: () => {
    const d = $('#propsDrawer');
    if (d && d.classList.contains('open') && d.querySelector('.canva-color-drawer[data-mode="background"]')) {
      openBackgroundDrawer();
    }
  },
  toast: toast,
  activeCanvas: () => activeCanvas(),
  activePage: () => activePage(),
  markChange: markChange,
  scheduleAutosave: scheduleAutosave,
  saveNow: saveNow,
  openEditor: openEditor,
  duplicateSelection: duplicateSelection,
  deleteSelection: deleteSelection,
  rotate180: rotate180,
  applyLayer: applyLayer,
  flipSelection: flipSelection,
  queueHistory: queueHistory,
  groupSelection: groupSelection,
  ungroupSelection: ungroupSelection,
  toggleGroupSelection: toggleGroupSelection,
  getState: () => state,
  palette: () => palette(),
  TEXT_PROPS: TEXT_PROPS,
  replacePhoto: replacePhoto,
  refreshProps: refreshProps
};

window.ZineMaker = window.ZineApp;

// Also expose globally for layers.js context menu
window.replacePhoto = replacePhoto;

})();

/* ============================================================
   END OF PART 3 / END OF APP.JS
   ============================================================ */
