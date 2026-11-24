/**
 * CROSS-STITCH STUDIO & ORNAMENTS (cross-stitch.js)
 * Dedicated standalone cross-stitch embroidery engine for indie zines.
 * Generates and recolors cross-stitch motifs (bows, editorial ribbons, medallions, filigree ornaments, letters).
 */
(function () {
  'use strict';

  // Preset Indie Colors for thread
  const PRESET_COLORS = [
    { name: 'Carmine Red', hex: '#e63946' },
    { name: 'Bubblegum Pink', hex: '#ff6b9d' },
    { name: 'Noir Black', hex: '#18181c' },
    { name: 'Classic Navy', hex: '#1d3557' },
    { name: 'Emerald Sage', hex: '#2a9d8f' },
    { name: 'Terracotta', hex: '#e76f51' },
    { name: 'Lavender Lilac', hex: '#a29bfe' },
    { name: 'Ecru White', hex: '#ffffff' }
  ];

  // Preset Motifs
  const MOTIFS = [
    {
      id: 'bow',
      name: 'Pita Kristik (Bow)',
      type: 'procedural',
      pattern: 'bow',
      defaultColor: '#ff6b9d',
      desc: 'Pita kristik simetris manis'
    },
    {
      id: 'unicorn',
      name: 'Kuda Unicorn (Sea-Unicorn)',
      type: 'procedural',
      pattern: 'unicorn',
      defaultColor: '#2a9d8f',
      defaultSecondary: '#ff6b9d',
      twoTone: true,
      desc: 'Kuda unicorn mitologi kristik authentic'
    },
    {
      id: 'lily',
      name: 'Bunga Bakung (Lily of Valley)',
      type: 'procedural',
      pattern: 'lily',
      defaultColor: '#2a9d8f',
      defaultSecondary: '#ffffff',
      twoTone: true,
      desc: 'Bunga bakung lonceng bertingkat anggun'
    },
    {
      id: 'medallion',
      name: 'Medali Kristik (Blackwork Medallion)',
      type: 'procedural',
      pattern: 'medallion',
      defaultColor: '#18181c',
      desc: 'Medali spiral 4-sisi blackwork simetris'
    },
    {
      id: 'filigree',
      name: 'Renda Vintage (Teal Filigree)',
      type: 'procedural',
      pattern: 'filigree',
      defaultColor: '#2a9d8f',
      desc: 'Ornamen renda bordir vertikal klasik'
    },
    {
      id: 'ornament',
      name: 'Mahkota Klasik (Royal Emblem)',
      type: 'procedural',
      pattern: 'ornament',
      defaultColor: '#ff6b9d',
      desc: 'Emblem mahkota simetris vertikal'
    },
    {
      id: 'rose',
      name: 'Bunga Mawar (Rose & Stem)',
      type: 'procedural',
      pattern: 'rose',
      defaultColor: '#2a9d8f',
      defaultSecondary: '#e63946',
      twoTone: true,
      desc: 'Mawar kuncup mekar dengan tangkai daun'
    },
    {
      id: 'ribbon',
      name: 'Pita Editorial (Serpentine S)',
      type: 'ribbon',
      defaultColor: '#18181c',
      desc: 'Pita berkelok ala poster editorial'
    },
    {
      id: 'heart',
      name: 'Hati (Cross Stitch Heart)',
      type: 'procedural',
      pattern: 'heart',
      defaultColor: '#e63946',
      desc: 'Simbol cinta kristik'
    },
    {
      id: 'star',
      name: 'Bintang Salju (Starburst)',
      type: 'procedural',
      pattern: 'star',
      defaultColor: '#2a9d8f',
      desc: 'Bintang kristik 8 penjuru'
    },
    {
      id: 'corner',
      name: 'Bingkai Sudut (Corner Frame)',
      type: 'procedural',
      pattern: 'corner',
      defaultColor: '#18181c',
      desc: 'Bingkai sudut untuk tata letak halaman'
    },
    {
      id: 'text',
      name: 'Teks Jahitan (Pinyon Script)',
      type: 'text',
      defaultColor: '#ff6b9d',
      desc: 'Teks kaligrafi anggun font Pinyon Script'
    }
  ];

  // Procedural Pixel Bitmaps for authentic vector cross-stitch motifs
  const PROCEDURAL_PATTERNS = {
    bow: [
      ".........XXXXX........XXXXX........",
      ".......XXXXXXXX......XXXXXXX.......",
      "........XX....XXX..XXX....XX.......",
      ".......XXX.......XX.......XX.......",
      ".......XXX......XXXX......XX.......",
      ".XXX...XXX....XXXXXXXX....XX....XXX",
      "XXXXXX.XXXX...X..XX..X...XXX..XXXXX",
      ".....X..XXXXXX..X..X..XXXXXX..X....",
      "......X..XXXX..X....X..XXXX..X.....",
      "......XX.......X....X.......XX.....",
      "..............X......X.....X.......",
      ".........XXXX.........XXXXX........",
      "..........XXX..........XXX........."
    ],
    unicorn: [
      "...............................",
      "..................2............",
      ".................2.............",
      "............2..22..............",
      "...........22222...............",
      "...........222.11..............",
      ".........2.22.1111.............",
      ".........222.1.1111............",
      "..........22.11.1111...........",
      "...........2.111..11...........",
      "..........22.11111.............",
      ".........22.1.11111............",
      "...........111.111111....11....",
      "..........1111.1111111..1111...",
      "............11.11111111111.11..",
      "...........11.11111111111..11..",
      ".............11111111111.1..1..",
      "...........11111111111..111.1..",
      ".........1111111111......11....",
      "........1111111111......11.....",
      ".......1111111111.....111......",
      ".......111111111......11.......",
      "....2.2.111111.................",
      ".....2..11111.11...............",
      "....2....111.1111..............",
      "...22....111..111..............",
      "...22...111...111..............",
      "..2222.111....111..............",
      "..222..11......11..............",
      ".2222.11........11.............",
      ".222..11..11.....11............",
      "..22...11..11.....11...........",
      "..22...11..11......11..........",
      "..222.....11..1111.............",
      ".22222....11111111111..........",
      ".2.211111111111....111.........",
      "...2211111111....2.2222........",
      "....22211111......2.222........",
      "......2222.........222........."
    ],
    lily: [
      "..........................",
      "..........222.............",
      ".........22..2............",
      "........2222..1...........",
      "........2222..1...........",
      "........2222..1...........",
      ".......222222.1...........",
      ".........22...111.........",
      ".............11..22.......",
      ".............1....22......",
      ".............1...2222.....",
      ".............1...2222.....",
      "..............1..2222.....",
      "..........222.1.222222....",
      ".........2...21...22......",
      "........22....1...........",
      ".......2222...1.11........",
      ".......2222...11..2.......",
      ".......2222...1...22......",
      "..1...222222.1...2222.....",
      ".1......22...1...2222.....",
      ".1...........1...2222.....",
      ".1...........1..222222....",
      ".11...........1...22......",
      ".1111.........1.......1...",
      "..11111111....1........1..",
      "...111111111..1........11.",
      ".........1111..1......111.",
      "...........11..1......11..",
      "............1.1.....1111..",
      "............111.....111...",
      ".............11....1111...",
      ".............1...11111....",
      ".............1.111111.....",
      "..............11111.......",
      ".............111..........",
      "............11............",
      "...........11.............",
      "...........1..............",
      ".........................."
    ],
    medallion: [
      ".....................",
      ".......XX...XX.......",
      ".......XXXXXXX.......",
      "...X..X..XXX..X..X...",
      ".....XXXXXXXXXXX.....",
      "....XXXXX...XXXXX....",
      "...XXXXX.....XXXXX...",
      ".XX.XXXXXXXXXXXXX.XX.",
      ".XX.XX.X..X..X.XX.XX.",
      "..XXX..X..X..X..XXX..",
      "..XXX..XXXXXXX..XXX..",
      "..XXX..X..X..X..XXX..",
      ".XX.XX.X..X..X.XX.XX.",
      ".XX.XXXXXXXXXXXXX.XX.",
      "...XXXXX.....XXXXX...",
      "....XXXXX...XXXXX....",
      ".....XXXXXXXXXXX.....",
      "...X..X..XXX..X..X...",
      ".......XXXXXXX.......",
      ".......XX...XX.......",
      "....................."
    ],
    filigree: [
      "......XXXXX......",
      ".....XX.X.XX.....",
      "....XX..X..XX....",
      "....XX..X..XX....",
      "....XX..X..XX....",
      "....XX..X..XX....",
      "....XX..X..XX....",
      "......X...X......",
      "...XX.X.X.X.XX...",
      "..XXXXX.X.XXXXX..",
      ".XXXXXX.X.XXXXXX.",
      "XX...XX.X.XX...XX",
      "......X.X.X......",
      ".....XX.X.XX.....",
      "...XX...X...XX...",
      "...XX...X...XX...",
      "..XX....X....XX..",
      ".XXXX...X...XXXX.",
      "..XX....X....XX..",
      ".....XX.X.XX.....",
      ".....XX.X.XX.....",
      ".....XXX.XXX.....",
      "XXXXXXX.X.XXXXXXX",
      ".XXXXX..X..XXXXX.",
      "..XXXX..X..XXXX..",
      "....X...X...X....",
      "......X...X......",
      "....XX..X..XX....",
      "....XX..X..XX....",
      "....XX..X..XX....",
      "....XX..X..XX....",
      ".....XX.X.XX.....",
      "......XXXXX......"
    ],
    ornament: [
      "......XXX......",
      ".....XXXXX.....",
      "....XXXXXXX....",
      ".XXXXXXXXXXXXX.",
      ".XXXXXXX.XXXXX.",
      "XXXXXXX.XXXXXXX",
      "XXXXX.....XXXXX",
      "XX..XX...XX..XX",
      ".XX..XX.XX..XX.",
      ".....XX.XX.....",
      ".....XX.XX.....",
      "....XX...XX....",
      "....XX...XX....",
      "...XXXX.XXXX...",
      "..XXXXXXXXXXX..",
      "XXXXXXXXXXXXXXX",
      "XXXXXXXXXXXXXXX",
      "..XXXXXXXXXXX..",
      "...XXXX.XXXX...",
      "....XX...XX....",
      "....XX...XX....",
      ".....XX.XX.....",
      ".....XX.XX.....",
      ".XX..XX.XX..XX.",
      "XX..XX...XX..XX",
      "XXXXX.....XXXXX",
      "XXXXXXX.XXXXXXX",
      ".XXXXXXX.XXXXX.",
      ".XXXXXXXXXXXXX.",
      "....XXXXXXX....",
      ".....XXXXX.....",
      "......XXX......",
      ".......X......."
    ],
    rose: [
      "..........2222.........",
      "........22222222.......",
      ".......2222222222......",
      "......22222..22222.....",
      "......222.222.2222.....",
      "......222222222222.....",
      ".......2222222222......",
      "........22222222.......",
      "......1...2222...1.....",
      ".....111...11...111....",
      "....11111..11..11111...",
      "...1111111.11.1111111..",
      "....11111..11..11111...",
      ".....111...11...111....",
      ".......1...11...1......",
      "...........11..........",
      "..........111..........",
      "..........111..........",
      ".........1111..........",
      ".........111...........",
      "........111............",
      "........11.............",
      ".......11..............",
      "......11...............",
      ".....11................"
    ],
    heart: [
      '..XXXX...XXXX..',
      '.XXXXXX.XXXXXX.',
      'XXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXX',
      '.XXXXXXXXXXXXX.',
      '..XXXXXXXXXXX..',
      '...XXXXXXXXX...',
      '....XXXXXXX....',
      '.....XXXXX.....',
      '......XXX......',
      '.......X.......'
    ],
    star: [
      '.......X.......',
      '.......X.......',
      '..X....X....X..',
      '...X...X...X...',
      '....X..X..X....',
      '.....X.X.X.....',
      'XXXXXXX.XXXXXXX',
      '.....X.X.X.....',
      '....X..X..X....',
      '...X...X...X...',
      '..X....X....X..',
      '.......X.......',
      '.......X.......'
    ],
    corner: [
      'XXXXXXXXXXXXXXX',
      'X...X...X...X..',
      'X..............',
      'X...X..........',
      'X..............',
      'X...X..........',
      'X..............',
      'X...X..........',
      'X..............',
      'X..............'
    ]
  };

  const STITCH_RATIOS = {
    '4:5': { id: '4:5', name: '4:5 (Portrait)', W: 640, H: 800, cssAspect: '4 / 5', maxW: '360px' },
    '1:1': { id: '1:1', name: '1:1 (Square)', W: 600, H: 600, cssAspect: '1 / 1', maxW: '380px' },
    '9:16': { id: '9:16', name: '9:16 (Story)', W: 540, H: 960, cssAspect: '9 / 16', maxW: '290px' },
    '16:9': { id: '16:9', name: '16:9 (Landscape)', W: 800, H: 450, cssAspect: '16 / 9', maxW: '520px' },
    '4:3': { id: '4:3', name: '4:3 (Classic)', W: 640, H: 480, cssAspect: '4 / 3', maxW: '460px' }
  };

  // State
  const state = {
    ratio: '4:5',
    activeMotif: 'bow',
    primaryColor: '#ff6b9d',
    secondaryColor: '#18181c',
    bgType: 'transparent', // 'transparent' | 'aida' | 'photo' | 'white' | 'dark'
    scale: 1.0,
    stitchThickness: 1.0,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    customText: 'Indie Zine',
    customPhotoImg: null,
    cachedImages: {},
    isRendering: false
  };

  // Utilities
  function hexToRgb(hex) {
    if (!hex) return { r: 230, g: 57, b: 70 };
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  /* ============================================================
     CORE SINGLE CROSS-STITCH THREAD RENDERER
     ============================================================ */
  function drawSingleStitch(ctx, x, y, size, colorRgb) {
    const pad = Math.max(1, Math.round(size * 0.12));
    const lw = Math.max(1.8, Math.round(size * 0.32 * state.stitchThickness));
    const hlW = Math.max(0.7, lw * 0.35);

    const x1 = x + pad;
    const y1 = y + pad;
    const x2 = x + size - pad;
    const y2 = y + size - pad;

    ctx.save();
    ctx.lineCap = 'round';

    // 1. Soft drop shadow under the stitch
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = lw + 1.2;
    ctx.beginPath();
    ctx.moveTo(x1 + 0.8, y2 + 1.2);
    ctx.lineTo(x2 + 0.8, y1 + 1.2);
    ctx.moveTo(x1 + 0.8, y1 + 1.2);
    ctx.lineTo(x2 + 0.8, y2 + 1.2);
    ctx.stroke();

    // 2. Leg 1 (Under-stitch: bottom-left to top-right /)
    ctx.strokeStyle = colorRgb;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x1, y2);
    ctx.lineTo(x2, y1);
    ctx.stroke();

    // 3. Highlight on Leg 1 (silk thread sheen)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.lineWidth = hlW;
    ctx.beginPath();
    ctx.moveTo(x1, y2);
    ctx.lineTo(x2, y1);
    ctx.stroke();

    // 4. Center crossover shadow where Leg 2 passes over Leg 1
    ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, lw * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // 5. Leg 2 (Over-stitch: top-left to bottom-right \)
    ctx.strokeStyle = colorRgb;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 6. Highlight on Leg 2 (silk thread sheen)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = hlW;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.restore();
  }

  /* ============================================================
     IMAGE RECOLORING ENGINE (Isolates stitches & applies color)
     ============================================================ */
  function recolorImageStitch(img, colorHex, secondaryHex, motifId) {
    const cv = document.createElement('canvas');
    cv.width = img.naturalWidth || img.width;
    cv.height = img.naturalHeight || img.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, cv.width, cv.height);
    const data = imgData.data;
    const target = hexToRgb(colorHex || '#e63946');
    const target2 = secondaryHex ? hexToRgb(secondaryHex) : target;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const whiteness = Math.min(r, g, b);
      // Whiteness check (pure white or off-white background)
      if (whiteness > 232) {
        data[i + 3] = 0; // transparent
        continue;
      }

      const alpha = Math.min(255, Math.max(0, Math.round((246 - whiteness) * 3.2)));
      if (alpha <= 10) {
        data[i + 3] = 0;
        continue;
      }

      // Check if pixel belongs to secondary color
      let useSecondary = false;
      if (secondaryHex) {
        if (motifId === 'unicorn') {
          // Purple mane, horn and tail: Red is significantly higher than green
          useSecondary = (r > g + 15);
        } else if (motifId === 'medallion') {
          // Black accent stitches in folk medallion
          useSecondary = (r < 80 && g < 80 && b < 80);
        }
      }

      const activeTarget = useSecondary ? target2 : target;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      // Preserve thread texture / fiber shading
      const shade = Math.min(1.0, Math.max(0.25, lum / 215));

      data[i] = Math.round(activeTarget.r * (0.35 + 0.65 * shade));
      data[i + 1] = Math.round(activeTarget.g * (0.35 + 0.65 * shade));
      data[i + 2] = Math.round(activeTarget.b * (0.35 + 0.65 * shade));
      data[i + 3] = alpha;
    }

    ctx.putImageData(imgData, 0, 0);
    return cv;
  }

  /* ============================================================
     EDITORIAL SERPENTINE RIBBON GENERATOR
     Matches download (21).jpe: sweeping 3-stitch wide cross-stitch band
     ============================================================ */
  function renderEditorialRibbon(ctx, W, H, colorHex) {
    const s = 14 * state.scale;
    // Points along the serpentine S-curve
    const waypoints = [
      { x: W * 0.85, y: H * 0.10 },
      { x: W * 0.65, y: H * 0.12 },
      { x: W * 0.40, y: H * 0.16 },
      { x: W * 0.22, y: H * 0.24 },
      { x: W * 0.18, y: H * 0.35 },
      { x: W * 0.26, y: H * 0.44 },
      { x: W * 0.45, y: H * 0.48 },
      { x: W * 0.60, y: H * 0.46 },
      { x: W * 0.70, y: H * 0.52 },
      { x: W * 0.65, y: H * 0.62 },
      { x: W * 0.48, y: H * 0.68 },
      { x: W * 0.30, y: H * 0.67 },
      { x: W * 0.18, y: H * 0.75 },
      { x: W * 0.24, y: H * 0.86 },
      { x: W * 0.45, y: H * 0.88 },
      { x: W * 0.70, y: H * 0.85 },
      { x: W * 0.82, y: H * 0.78 }
    ];

    // Subdivide path smoothly
    const samples = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p0 = waypoints[Math.max(0, i - 1)];
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];

      const steps = 14;
      for (let t = 0; t < steps; t++) {
        const u = t / steps;
        // Catmull-Rom spline interpolation
        const u2 = u * u;
        const u3 = u2 * u;
        const x = 0.5 * ((2 * p1.x) +
          (-p0.x + p2.x) * u +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3);
        const y = 0.5 * ((2 * p1.y) +
          (-p0.y + p2.y) * u +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3);
        samples.push({ x, y });
      }
    }

    // Place 3-stitch wide cross-stitch band along the spline
    const placed = new Set();
    const rgb = colorHex;

    for (let i = 0; i < samples.length - 1; i++) {
      const cur = samples[i];
      const next = samples[i + 1];
      const dx = next.x - cur.x;
      const dy = next.y - cur.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      // 3 parallel strands for ribbon width
      [-1, 0, 1].forEach(offset => {
        const sx = cur.x + nx * (offset * s * 0.88);
        const sy = cur.y + ny * (offset * s * 0.88);
        const gx = Math.round(sx / (s * 0.85)) * (s * 0.85);
        const gy = Math.round(sy / (s * 0.85)) * (s * 0.85);
        const key = `${Math.round(gx)},${Math.round(gy)}`;
        if (!placed.has(key)) {
          placed.add(key);
          drawSingleStitch(ctx, gx, gy, s, rgb);
        }
      });
    }
  }

  /* ============================================================
     PROCEDURAL CROSS-STITCH PATTERNS (Rose, Heart, Star, Unicorn, Lily, Medallion, Filigree, Bow)
     Every motif renders as genuine vector cross-stitches with silk sheen & 3D crossover
     ============================================================ */
  function renderProceduralPattern(ctx, W, H, patternId, colorHex, secondaryHex) {
    const lines = PROCEDURAL_PATTERNS[patternId];
    if (!lines) return;

    const rows = lines.length;
    const cols = lines[0].length;
    const s = Math.min((W * 0.82) / cols, (H * 0.82) / rows) * state.scale;

    const startX = (W - cols * s) / 2;
    const startY = (H - rows * s) / 2;

    const target1 = hexToRgb(colorHex || '#ff6b9d');
    const colorRgb1 = `rgb(${target1.r}, ${target1.g}, ${target1.b})`;
    const target2 = secondaryHex ? hexToRgb(secondaryHex) : target1;
    const colorRgb2 = `rgb(${target2.r}, ${target2.g}, ${target2.b})`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ch = lines[r][c];
        if (ch === 'X' || ch === '1') {
          const x = startX + c * s;
          const y = startY + r * s;
          drawSingleStitch(ctx, x, y, s, colorRgb1);
        } else if (ch === '2') {
          const x = startX + c * s;
          const y = startY + r * s;
          drawSingleStitch(ctx, x, y, s, colorRgb2);
        }
      }
    }
  }

  /* ============================================================
     CROSS-STITCH CALLIGRAPHIC TYPOGRAPHY (Pinyon Script Font)
     ============================================================ */
  function renderStitchText(ctx, W, H, text, colorHex) {
    const str = text || 'Indie Zine';
    const offCv = document.createElement('canvas');
    offCv.width = W;
    offCv.height = H;
    const offCtx = offCv.getContext('2d');

    // Font size scaled to fit width nicely
    const baseFontSize = Math.min(130, Math.max(50, Math.floor((W * 0.82) / Math.max(5, str.length * 0.42)))) * state.scale;
    offCtx.font = `italic ${baseFontSize}px 'Pinyon Script', cursive, serif`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillStyle = '#ffffff';
    offCtx.fillText(str, W / 2, H / 2);

    // Sample the text pixels into cross stitches
    const imgData = offCtx.getImageData(0, 0, W, H);
    const data = imgData.data;

    // Cross-stitch grid step
    const s = Math.max(6, Math.min(13, Math.round(baseFontSize * 0.088)));
    const target = hexToRgb(colorHex || '#ff6b9d');
    const colorRgb = `rgb(${target.r}, ${target.g}, ${target.b})`;

    ctx.save();
    for (let y = 0; y < H - s; y += s) {
      for (let x = 0; x < W - s; x += s) {
        let sum = 0;
        let count = 0;
        for (let dy = 0; dy < s; dy += 2) {
          for (let dx = 0; dx < s; dx += 2) {
            const idx = ((y + dy) * W + (x + dx)) * 4;
            sum += data[idx + 3];
            count++;
          }
        }
        const avg = sum / (count || 1);
        if (avg > 36) {
          drawSingleStitch(ctx, x, y, s, colorRgb);
        }
      }
    }
    ctx.restore();
  }

  /* ============================================================
     BACKGROUND RENDERER (Aida Cloth, Photo, Dark, White)
     ============================================================ */
  function drawStageBackground(ctx, W, H, bgType) {
    if (bgType === 'transparent') {
      // Checkerboard indicator for transparency
      const chSize = 16;
      ctx.fillStyle = '#1c1c20';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#26262c';
      for (let y = 0; y < H; y += chSize) {
        for (let x = 0; x < W; x += chSize) {
          if ((Math.floor(x / chSize) + Math.floor(y / chSize)) % 2 === 0) {
            ctx.fillRect(x, y, chSize, chSize);
          }
        }
      }
      return;
    }

    if (bgType === 'aida') {
      // Natural Aida cloth fabric
      ctx.fillStyle = '#f7f4ed';
      ctx.fillRect(0, 0, W, H);

      // Fine woven grain
      const step = 10;
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = 'rgba(170, 150, 125, 0.22)';
      ctx.beginPath();
      for (let x = 0; x <= W; x += step) {
        ctx.moveTo(x, 0); ctx.lineTo(x, H);
      }
      for (let y = 0; y <= H; y += step) {
        ctx.moveTo(0, y); ctx.lineTo(W, y);
      }
      ctx.stroke();

      // Puncture holes
      ctx.fillStyle = 'rgba(60, 48, 36, 0.35)';
      ctx.beginPath();
      for (let y = 0; y <= H; y += step) {
        for (let x = 0; x <= W; x += step) {
          ctx.moveTo(x + 1, y);
          ctx.arc(x, y, 1, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      return;
    }

    const photoImg = state.customPhotoImg || (window.ZinePhotoEditor?.getCurrentImage ? window.ZinePhotoEditor.getCurrentImage() : null);
    if (bgType === 'photo' && photoImg) {
      drawImageCover(ctx, photoImg, 0, 0, W, H);
      // Subtle darkening overlay so stitches pop
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, W, H);
      return;
    }

    if (bgType === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      return;
    }

    if (bgType === 'dark') {
      ctx.fillStyle = '#141416';
      ctx.fillRect(0, 0, W, H);
      return;
    }
  }

  function drawImageCover(ctx, img, x, y, w, h) {
    if (!img) return;
    const nw = img.naturalWidth || img.width;
    const nh = img.naturalHeight || img.height;
    const scale = Math.max(w / nw, h / nh);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (nw - sw) / 2;
    const sy = (nh - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  /* ============================================================
     MAIN CROSS-STITCH STUDIO RENDER PIPELINE
     ============================================================ */
  function renderStudio() {
    const canvas = document.getElementById('stitch-studio-canvas');
    if (!canvas) return;

    const rConfig = STITCH_RATIOS[state.ratio] || STITCH_RATIOS['4:5'];
    const W = rConfig.W;
    const H = rConfig.H;

    const card = document.getElementById('stitch-card') || document.querySelector('.stitch-interactive-card') || document.querySelector('.stitch-canvas-card');
    if (card) {
      card.style.setProperty('--card-aspect', rConfig.cssAspect);
      card.style.setProperty('--card-max-w', rConfig.maxW);
      card.classList.toggle('bg-transparent', state.bgType === 'transparent');
    }

    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // 1. Draw Background
    drawStageBackground(ctx, W, H, state.bgType);

    // 2. Render Active Motif Layer
    renderMotifLayer(ctx, W, H);
  }

  function renderMotifLayer(ctx, W, H) {
    const motif = MOTIFS.find(m => m.id === state.activeMotif) || MOTIFS[0];

    ctx.save();
    if (state.offsetX || state.offsetY || state.rotation) {
      ctx.translate(W / 2 + (state.offsetX || 0), H / 2 + (state.offsetY || 0));
      if (state.rotation) ctx.rotate((state.rotation * Math.PI) / 180);
      ctx.translate(-W / 2, -H / 2);
    }

    if (motif.type === 'ribbon') {
      renderEditorialRibbon(ctx, W, H, state.primaryColor);
    } else if (motif.type === 'procedural') {
      renderProceduralPattern(ctx, W, H, motif.pattern, state.primaryColor, motif.twoTone ? state.secondaryColor : null);
    } else if (motif.type === 'text') {
      renderStitchText(ctx, W, H, state.customText, state.primaryColor);
    } else if (motif.type === 'image') {
      const cached = state.cachedImages[motif.id];
      if (cached && cached.complete) {
        drawRecoloredImageMotif(ctx, cached, W, H, motif);
      } else {
        loadMotifImage(motif, () => renderStudio());
      }
    }
    ctx.restore();
  }

  function drawRecoloredImageMotif(ctx, img, W, H, motif) {
    const recoloredCv = recolorImageStitch(img, state.primaryColor, motif.twoTone ? state.secondaryColor : null, motif.id);
    const nw = recoloredCv.width;
    const nh = recoloredCv.height;

    // Scale to fit stage nicely
    const baseScale = Math.min((W * 0.82) / nw, (H * 0.82) / nh) * state.scale;
    const dw = nw * baseScale;
    const dh = nh * baseScale;
    const dx = (W - dw) / 2;
    const dy = (H - dh) / 2;

    ctx.save();
    // Drop shadow under the whole motif layer
    ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.drawImage(recoloredCv, dx, dy, dw, dh);
    ctx.restore();
  }

  function loadMotifImage(motif, cb) {
    if (state.cachedImages[motif.id]) {
      if (cb) cb();
      return;
    }
    const src = (window.STITCH_IMAGE_DATA && window.STITCH_IMAGE_DATA[motif.id]) ? window.STITCH_IMAGE_DATA[motif.id] : motif.src;
    const img = new Image();
    img.onload = () => {
      state.cachedImages[motif.id] = img;
      if (cb) cb();
    };
    img.onerror = () => {
      console.warn('Gagal memuat motif:', motif.id);
    };
    img.src = src;
  }

  /* ============================================================
     EXPORT CANVAS WITHOUT CHECKERBOARD (Clean PNG)
     ============================================================ */
  function generateCleanStitchCanvas() {
    const rConfig = STITCH_RATIOS[state.ratio] || STITCH_RATIOS['4:5'];
    const W = rConfig.W;
    const H = rConfig.H;
    const outCv = document.createElement('canvas');
    outCv.width = W;
    outCv.height = H;
    const ctx = outCv.getContext('2d');

    // Only draw background if NOT transparent
    if (state.bgType !== 'transparent') {
      drawStageBackground(ctx, W, H, state.bgType);
    }

    renderMotifLayer(ctx, W, H);

    return outCv;
  }

  function exportStitchPNG() {
    const cv = generateCleanStitchCanvas();
    const link = document.createElement('a');
    link.download = `cross-stitch-${state.activeMotif}-${Date.now()}.png`;
    link.href = cv.toDataURL('image/png');
    link.click();
    if (window.toast) window.toast('ornamen kristik berhasil diunduh (PNG)!');
  }

  function addStitchToActiveZine() {
    if (!window.fabric) return;
    const cv = generateCleanStitchCanvas();
    const dataUrl = cv.toDataURL('image/png');

    fabric.Image.fromURL(dataUrl, img => {
      const canvas = (window.ZineApp && window.ZineApp.activeCanvas) ? window.ZineApp.activeCanvas() : null;
      if (!canvas) {
        if (window.showScreen) window.showScreen('editor');
        return;
      }

      const maxDim = 360;
      const scale = Math.min(maxDim / img.width, maxDim / img.height);
      img.set({
        left: (canvas.width - img.width * scale) / 2,
        top: (canvas.height - img.height * scale) / 2,
        scaleX: scale,
        scaleY: scale,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#000000',
        borderColor: '#ffffff',
        transparentCorners: false,
        cornerSize: 8,
        lockScalingFlip: true
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();

      if (window.showScreen) window.showScreen('editor');
      if (window.toast) window.toast('ornamen kristik ditambahkan ke kanvas zine!');
    });
  }

  /* ============================================================
     ZINE EDITOR TOOLBAR DRAWER (PropsDrawer Panel)
     Allows placing cross-stitch ornaments directly while editing zines
     ============================================================ */
  function openStitchDrawer() {
    const pd = document.getElementById('propsDrawer');
    if (!pd) return;

    pd.classList.add('open');
    pd.innerHTML = `
      <div class="props-head">
        <h3 class="display small">cross stitch</h3>
        <button type="button" class="round round-sub close-props" id="btn-close-stitch-drawer" aria-label="close">✕</button>
      </div>

      <div class="props-body">
        <!-- Motif Cards Grid -->
        <div class="props-group">
          <label class="props-label">PILIH MOTIF KRISTIK</label>
          <div class="stitch-drawer-grid">
            ${MOTIFS.map(m => `
              <button type="button" class="stitch-motif-card ${state.activeMotif === m.id ? 'active' : ''}" data-motif="${m.id}" title="${m.desc}">
                <span class="smc-name">${m.name.split(' (')[0]}</span>
                <span class="smc-sub">${m.id}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Color Swatches & Picker -->
        <div class="props-group">
          <div class="props-row" style="margin-bottom:6px">
            <label class="props-label" style="margin:0">WARNA BENANG</label>
            <span class="props-val" id="text-drawer-color">${state.primaryColor}</span>
          </div>
          <div class="pdt-palette-swatches" id="stitch-drawer-swatches" style="margin-bottom:8px">
            ${PRESET_COLORS.map(c => `
              <button type="button" class="pdt-color-swatch ${state.primaryColor === c.hex ? 'active' : ''}" data-color="${c.hex}" title="${c.name}" style="background:${c.hex};"></button>
            `).join('')}
          </div>
          <label class="pdt-custom-color-btn" style="width:100%">
            <input type="color" id="stitch-drawer-native-color" value="${state.primaryColor}" class="pdt-native-color-picker">
            <span>pilih warna kustom</span>
          </label>
        </div>

        <!-- Text input if text motif is selected -->
        <div class="props-group" id="group-drawer-stitch-text" style="display:${state.activeMotif === 'text' ? 'block' : 'none'}">
          <label class="props-label">KATA / TEKS KRISTIK</label>
          <input type="text" id="input-drawer-stitch-text" value="${state.customText}" class="pdt-input-text" maxlength="15" placeholder="Tulis kata...">
        </div>

        <!-- Scale Slider -->
        <div class="props-group">
          <div class="props-row">
            <label class="props-label" style="margin:0">SKALA UKURAN</label>
            <span class="props-val" id="text-drawer-stitch-scale">${Math.round(state.scale * 100)}%</span>
          </div>
          <input type="range" id="slider-drawer-stitch-scale" min="50" max="180" value="${Math.round(state.scale * 100)}" class="pdt-slider" style="width:100%">
        </div>

        <!-- Add Button -->
        <button type="button" class="pill pill-primary" id="btn-drawer-add-stitch" style="width:100%;margin-top:10px;justify-content:center">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>masukkan ke halaman</span>
        </button>
      </div>
    `;

    // Wire events
    const btnClose = document.getElementById('btn-close-stitch-drawer');
    if (btnClose) btnClose.addEventListener('click', () => {
      pd.classList.remove('open');
      if (window.hideProps) window.hideProps();
    });

    // Motif buttons
    pd.querySelectorAll('.stitch-motif-card').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeMotif = btn.dataset.motif;
        pd.querySelectorAll('.stitch-motif-card').forEach(b => b.classList.toggle('active', b === btn));
        const groupText = document.getElementById('group-drawer-stitch-text');
        if (groupText) groupText.style.display = state.activeMotif === 'text' ? 'block' : 'none';
      });
    });

    // Color Swatches
    pd.querySelectorAll('#stitch-drawer-swatches .pdt-color-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        state.primaryColor = btn.dataset.color;
        pd.querySelectorAll('#stitch-drawer-swatches .pdt-color-swatch').forEach(b => b.classList.toggle('active', b === btn));
        const txt = document.getElementById('text-drawer-color');
        if (txt) txt.textContent = state.primaryColor;
      });
    });

    // Native Color
    const nativeColor = document.getElementById('stitch-drawer-native-color');
    if (nativeColor) {
      nativeColor.addEventListener('input', e => {
        state.primaryColor = e.target.value;
        const txt = document.getElementById('text-drawer-color');
        if (txt) txt.textContent = state.primaryColor;
      });
    }

    // Scale slider
    const slScale = document.getElementById('slider-drawer-stitch-scale');
    if (slScale) {
      slScale.addEventListener('input', e => {
        state.scale = parseInt(e.target.value, 10) / 100;
        const txt = document.getElementById('text-drawer-stitch-scale');
        if (txt) txt.textContent = e.target.value + '%';
      });
    }

    // Text input
    const inText = document.getElementById('input-drawer-stitch-text');
    if (inText) {
      inText.addEventListener('input', e => {
        state.customText = e.target.value;
      });
    }

    // Add to Zine
    const btnAdd = document.getElementById('btn-drawer-add-stitch');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        addStitchToActiveZine();
      });
    }
  }

  /* ============================================================
     STUDIO UI WIRING & INITIALIZATION
     ============================================================ */
  function initStudioUI() {
    // 1. Motif Grid in Studio Drawer
    const motifGrid = document.getElementById('stitch-motif-grid');
    if (motifGrid) {
      motifGrid.innerHTML = MOTIFS.map(m => `
        <button type="button" class="pdt-item-btn ${state.activeMotif === m.id ? 'active' : ''}" data-motif="${m.id}">
          <span class="pdt-item-name">${m.name}</span>
        </button>
      `).join('');

      // Update motif label
      const updateMotifLabel = (id) => {
        const motif = MOTIFS.find(x => x.id === id);
        const lbl = document.getElementById('text-current-stitch-motif');
        if (lbl && motif) lbl.textContent = motif.name;
      };
      updateMotifLabel(state.activeMotif);

      motifGrid.querySelectorAll('.pdt-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          state.activeMotif = btn.dataset.motif;
          motifGrid.querySelectorAll('.pdt-item-btn').forEach(b => b.classList.toggle('active', b === btn));
          updateMotifLabel(state.activeMotif);

          // Auto-load default motif colors
          const motif = MOTIFS.find(x => x.id === state.activeMotif);
          if (motif) {
            if (motif.defaultColor) {
              state.primaryColor = motif.defaultColor;
              const nameEl = document.getElementById('text-current-stitch-color');
              if (nameEl) nameEl.textContent = state.primaryColor;
              const nativeColorIn = document.getElementById('stitch-input-custom-color');
              if (nativeColorIn) nativeColorIn.value = state.primaryColor;
              const swatchContainer = document.getElementById('stitch-color-swatches');
              if (swatchContainer) {
                swatchContainer.querySelectorAll('.pdt-color-swatch').forEach(b => b.classList.toggle('active', b.dataset.color === state.primaryColor));
              }
            }
            if (motif.defaultSecondary) {
              state.secondaryColor = motif.defaultSecondary;
              const nativeColor2 = document.getElementById('stitch-input-secondary-color');
              if (nativeColor2) nativeColor2.value = state.secondaryColor;
            }
          }

          // Toggle dual-tone picker if applicable
          const secRow = document.getElementById('row-secondary-color');
          if (secRow) secRow.style.display = (motif && motif.twoTone) ? 'flex' : 'none';

          const textRow = document.getElementById('row-stitch-text-input');
          if (textRow) textRow.style.display = state.activeMotif === 'text' ? 'flex' : 'none';

          renderStudio();
        });
      });
    }

    // 2. Thread Color Swatches in Studio
    const swatchContainer = document.getElementById('stitch-color-swatches');
    if (swatchContainer) {
      swatchContainer.innerHTML = PRESET_COLORS.map(c => `
        <button type="button" class="pdt-color-swatch ${state.primaryColor === c.hex ? 'active' : ''}" data-color="${c.hex}" title="${c.name}" style="background:${c.hex};"></button>
      `).join('');

      swatchContainer.querySelectorAll('.pdt-color-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
          state.primaryColor = btn.dataset.color;
          swatchContainer.querySelectorAll('.pdt-color-swatch').forEach(b => b.classList.toggle('active', b === btn));
          const nameEl = document.getElementById('text-current-stitch-color');
          if (nameEl) nameEl.textContent = state.primaryColor;
          renderStudio();
        });
      });
    }

    // 3. Native Color Input in Studio
    const nativeColorIn = document.getElementById('stitch-input-custom-color');
    if (nativeColorIn) {
      nativeColorIn.addEventListener('input', e => {
        state.primaryColor = e.target.value;
        const nameEl = document.getElementById('text-current-stitch-color');
        if (nameEl) nameEl.textContent = state.primaryColor;
        renderStudio();
      });
    }

    // Secondary Color Input (for two-tone motifs)
    const nativeColor2 = document.getElementById('stitch-input-secondary-color');
    if (nativeColor2) {
      nativeColor2.addEventListener('input', e => {
        state.secondaryColor = e.target.value;
        renderStudio();
      });
    }

    // 3.8. Ratio Switcher in Stitch Studio
    const ratioBtns = document.querySelectorAll('.srs-btn');
    ratioBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.ratio = btn.dataset.ratio;
        ratioBtns.forEach(b => b.classList.toggle('active', b === btn));
        renderStudio();
      });
    });

    // 4. Background Buttons in Studio
    const bgBtns = document.querySelectorAll('.stitch-bg-btn');
    bgBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.bgType = btn.dataset.bg;
        bgBtns.forEach(b => b.classList.toggle('active', b === btn));

        // If 'photo' bg chosen and no photo yet, trigger file input
        if (state.bgType === 'photo' && !state.customPhotoImg) {
          const photoInput = document.getElementById('stitch-photo-upload-input');
          if (photoInput) photoInput.click();
        }

        renderStudio();
      });
    });

    // Custom Photo Upload Input
    const photoInput = document.getElementById('stitch-photo-upload-input');
    if (photoInput) {
      photoInput.addEventListener('change', e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          const img = new Image();
          img.onload = () => {
            state.customPhotoImg = img;
            state.bgType = 'photo';
            bgBtns.forEach(b => b.classList.toggle('active', b.dataset.bg === 'photo'));
            renderStudio();
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    // 4.5. 3D Card Interactive Tilt & Drag-Drop (Identical to Photo Stencil)
    const stitchStage = document.getElementById('stitch-card-stage');
    const stitchCard = document.getElementById('stitch-card');
    if (stitchStage && stitchCard) {
      stitchStage.addEventListener('mousemove', e => {
        const rect = stitchStage.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        stitchCard.style.transform = `perspective(1000px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
      });
      stitchStage.addEventListener('mouseleave', () => {
        stitchCard.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
      });

      // Drag and drop photo directly onto cross-stitch stage
      stitchStage.addEventListener('dragover', e => { e.preventDefault(); });
      stitchStage.addEventListener('drop', e => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          const reader = new FileReader();
          reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
              state.customPhotoImg = img;
              state.bgType = 'photo';
              bgBtns.forEach(b => b.classList.toggle('active', b.dataset.bg === 'photo'));
              renderStudio();
            };
            img.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        }
      });

      // Click card to upload/change photo when in photo mode
      stitchCard.addEventListener('click', () => {
        if (state.bgType === 'photo' && photoInput) {
          photoInput.click();
        }
      });
    }

    // 5. Scale & Thickness Sliders
    const slScale = document.getElementById('stitch-slider-scale');
    if (slScale) {
      slScale.addEventListener('input', e => {
        state.scale = parseInt(e.target.value, 10) / 100;
        const valEl = document.getElementById('val-stitch-scale');
        if (valEl) valEl.textContent = e.target.value + '%';
        renderStudio();
      });
    }

    const slThick = document.getElementById('stitch-slider-thickness');
    if (slThick) {
      slThick.addEventListener('input', e => {
        state.stitchThickness = parseInt(e.target.value, 10) / 100;
        const valEl = document.getElementById('val-stitch-thickness');
        if (valEl) valEl.textContent = e.target.value + '%';
        renderStudio();
      });
    }

    const slRot = document.getElementById('stitch-slider-rotation');
    if (slRot) {
      slRot.addEventListener('input', e => {
        state.rotation = parseInt(e.target.value, 10);
        const valEl = document.getElementById('val-stitch-rotation');
        if (valEl) valEl.textContent = e.target.value + '°';
        renderStudio();
      });
    }

    const slPosY = document.getElementById('stitch-slider-pos-y');
    if (slPosY) {
      slPosY.addEventListener('input', e => {
        state.offsetY = parseInt(e.target.value, 10);
        const valEl = document.getElementById('val-stitch-pos-y');
        if (valEl) valEl.textContent = (state.offsetY > 0 ? '+' : '') + state.offsetY;
        renderStudio();
      });
    }

    const slPosX = document.getElementById('stitch-slider-pos-x');
    if (slPosX) {
      slPosX.addEventListener('input', e => {
        state.offsetX = parseInt(e.target.value, 10);
        const valEl = document.getElementById('val-stitch-pos-x');
        if (valEl) valEl.textContent = (state.offsetX > 0 ? '+' : '') + state.offsetX;
        renderStudio();
      });
    }

    // Custom Text Input
    const inText = document.getElementById('stitch-input-text');
    if (inText) {
      inText.addEventListener('input', e => {
        state.customText = e.target.value;
        renderStudio();
      });
    }

    // 5.5 Stitch Drawer Tab Switching
    const stitchDrawer = document.querySelector('.stitch-drawer');
    if (stitchDrawer) {
      const stitchDrawerTabs = stitchDrawer.querySelectorAll('.pdt-tab');
      stitchDrawerTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.dataset.stitchTab;
          if (!target) return;
          stitchDrawerTabs.forEach(t => t.classList.toggle('active', t === tab));
          stitchDrawer.querySelectorAll('.photo-tab-panel').forEach(p => {
            p.classList.toggle('active', p.id === 'stitch-tab-panel-' + target);
          });
        });
      });
    }

    // 6. Mode Switcher (Photo Stencil Cutout vs Cross Stitch Studio)
    const btnModeCutout = document.getElementById('btn-mode-cutout');
    const btnModeStitch = document.getElementById('btn-mode-stitch');
    const wsCutout = document.getElementById('workspace-cutout');
    const wsStitch = document.getElementById('workspace-stitch');

    if (btnModeCutout && btnModeStitch) {
      btnModeCutout.addEventListener('click', () => {
        btnModeCutout.classList.add('active');
        btnModeStitch.classList.remove('active');
        if (wsCutout) wsCutout.style.display = 'flex';
        if (wsStitch) wsStitch.style.display = 'none';
        // Reset drawer tab to style
        const tabStyle = document.querySelector('.photo-editor-drawer .pdt-tab[data-tab="style"]');
        if (tabStyle) tabStyle.click();
        if (window.ZinePhotoEditor?.render) window.ZinePhotoEditor.render();
      });

      btnModeStitch.addEventListener('click', () => {
        btnModeStitch.classList.add('active');
        btnModeCutout.classList.remove('active');
        if (wsCutout) wsCutout.style.display = 'none';
        if (wsStitch) wsStitch.style.display = 'flex';
        // Ensure active tab panel in stitch drawer is shown
        const activeTab = document.querySelector('.stitch-drawer .pdt-tab.active') || document.querySelector('.stitch-drawer .pdt-tab[data-stitch-tab="motif"]');
        if (activeTab) {
          const target = activeTab.dataset.stitchTab || 'motif';
          document.querySelectorAll('.stitch-drawer .photo-tab-panel').forEach(p => {
            p.classList.toggle('active', p.id === 'stitch-tab-panel-' + target);
          });
        }
        renderStudio();
      });
    }

    // 7. Save & Add to Zine Buttons
    const btnSave = document.getElementById('btn-stitch-export');
    if (btnSave) btnSave.addEventListener('click', exportStitchPNG);

    const btnAddZine = document.getElementById('btn-stitch-add-zine');
    if (btnAddZine) btnAddZine.addEventListener('click', addStitchToActiveZine);

    // Initial render
    renderStudio();
  }

  // Preload all image motifs from data URIs
  MOTIFS.forEach(m => {
    if (m.type === 'image') loadMotifImage(m, () => {});
  });

  // Preload Pinyon Script font
  if (document.fonts && document.fonts.load) {
    document.fonts.load("40px 'Pinyon Script'").then(() => {
      if (state.activeMotif === 'text') renderStudio();
    }).catch(() => {});
  }

  // Expose Global API
  window.ZineCrossStitch = {
    renderStudio,
    openDrawer: openStitchDrawer,
    exportPNG: exportStitchPNG,
    addToZine: addStitchToActiveZine,
    switchToStudio: () => {
      const btnStitch = document.getElementById('btn-mode-stitch');
      if (btnStitch) btnStitch.click();
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    initStudioUI();
  });
})();
