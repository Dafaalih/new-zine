/* ============================================================
   ZINE MAKER — FIGMA-STYLE CANVAS RULERS (ruler.js)
   Draws pixel rulers around the active artboard synchronized with
   zoom, panning, scrolling, and cursor tracking.
   ============================================================ */
(function () {
  'use strict';

  const mousePos = { x: null, y: null };
  let animId = null;

  function createRulerDOM() {
    const editor = document.querySelector('#screen-editor');
    if (!editor) return false;

    if (document.getElementById('ruler-corner')) return true;

    const corner = document.createElement('div');
    corner.id = 'ruler-corner';
    corner.className = 'ruler-corner';
    corner.textContent = 'px';
    corner.setAttribute('title', 'units in pixels');

    const topCv = document.createElement('canvas');
    topCv.id = 'ruler-top';
    topCv.className = 'ruler-top';

    const leftCv = document.createElement('canvas');
    leftCv.id = 'ruler-left';
    leftCv.className = 'ruler-left';

    editor.appendChild(corner);
    editor.appendChild(topCv);
    editor.appendChild(leftCv);

    return true;
  }

  function getActiveCanvas() {
    if (window.ZineApp && window.ZineApp.activeCanvas) {
      return window.ZineApp.activeCanvas();
    }
    const stage = document.querySelector('#stage');
    if (!stage) return null;
    const activeWrap = stage.querySelector('.page-wrap:not([style*="display: none"])');
    if (activeWrap && activeWrap.querySelector('canvas')) {
      const el = activeWrap.querySelector('canvas');
      return el.__fabric || null;
    }
    return null;
  }

  function drawRulers() {
    const editor = document.querySelector('#screen-editor');
    if (!editor || !editor.classList.contains('active')) return;

    createRulerDOM();

    const stageScroll = document.querySelector('#stage-scroll');
    const stage = document.querySelector('#stage');
    const topCv = document.getElementById('ruler-top');
    const leftCv = document.getElementById('ruler-left');
    const corner = document.getElementById('ruler-corner');
    const editorTop = editor.querySelector('.editor-top');

    if (!stageScroll || !stage || !topCv || !leftCv || !corner) return;

    const topH = editorTop ? editorTop.offsetHeight : 52;
    const scrollRect = stageScroll.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();

    const RULER_SIZE = 22; // 22px width / height

    // Account for layers panel width so rulers sit to the right of it
    const layersPanel = document.querySelector('#layers-panel');
    const LP_W = (layersPanel && layersPanel.offsetParent !== null) ? layersPanel.offsetWidth : 0;

    // Align ruler elements to the right of the layers panel
    corner.style.top = topH + 'px';
    corner.style.left = Math.round(scrollRect.left + LP_W) + 'px';
    corner.style.width = RULER_SIZE + 'px';
    corner.style.height = RULER_SIZE + 'px';

    topCv.style.top = topH + 'px';
    topCv.style.left = Math.round(scrollRect.left + LP_W + RULER_SIZE) + 'px';

    leftCv.style.top = (topH + RULER_SIZE) + 'px';
    leftCv.style.left = Math.round(scrollRect.left + LP_W) + 'px';

    const dpr = window.devicePixelRatio || 1;
    const topW = Math.max(10, Math.floor(scrollRect.width - RULER_SIZE - LP_W) - 1);
    const topHeight = RULER_SIZE;
    const leftW = RULER_SIZE;
    const leftH = Math.max(10, Math.floor(scrollRect.height - RULER_SIZE) - 1);

    if (topCv.width !== Math.round(topW * dpr) || topCv.height !== Math.round(topHeight * dpr)) {
      topCv.width = Math.round(topW * dpr);
      topCv.height = Math.round(topHeight * dpr);
      topCv.style.width = topW + 'px';
      topCv.style.height = topHeight + 'px';
    }

    if (leftCv.width !== Math.round(leftW * dpr) || leftCv.height !== Math.round(leftH * dpr)) {
      leftCv.width = Math.round(leftW * dpr);
      leftCv.height = Math.round(leftH * dpr);
      leftCv.style.width = leftW + 'px';
      leftCv.style.height = leftH + 'px';
    }

    const c = getActiveCanvas();
    const curZoom = c ? c.getZoom() : 1;

    // Origin of artboard (0, 0) relative to top ruler and left ruler
    const originX = stageRect.left - (scrollRect.left + LP_W + RULER_SIZE);
    const originY = stageRect.top - (scrollRect.top + RULER_SIZE);

    // Pick dynamic interval based on zoom so labels have comfortable space
    const candidateIntervals = [10, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
    const interval = candidateIntervals.find(v => v * curZoom >= 55) || 5000;
    const minorStep = interval / 5;

    // ==================== 1. DRAW TOP RULER ====================
    const ctxT = topCv.getContext('2d');
    ctxT.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxT.clearRect(0, 0, topW, topHeight);

    // Background
    ctxT.fillStyle = '#181818';
    ctxT.fillRect(0, 0, topW, topHeight);

    // Artboard span highlight
    const artboardW = c ? c.getWidth() : (1748 * curZoom);
    ctxT.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctxT.fillRect(originX, 0, artboardW, topHeight);

    // Border line at bottom
    ctxT.fillStyle = '#2c2c2c';
    ctxT.fillRect(0, topHeight - 1, topW, 1);

    ctxT.font = '9px "Inter", Arial, sans-serif';
    ctxT.textAlign = 'left';
    ctxT.textBaseline = 'top';

    const minDesignX = Math.floor((-originX) / (curZoom * minorStep)) * minorStep;
    const maxDesignX = Math.ceil((topW - originX) / (curZoom * minorStep)) * minorStep;

    for (let dX = minDesignX; dX <= maxDesignX; dX += minorStep) {
      const screenX = Math.round(originX + dX * curZoom);
      if (screenX < 0 || screenX > topW) continue;

      const isMajor = Math.abs(dX % interval) < 0.001;
      const isMedium = Math.abs(dX % (interval / 2)) < 0.001;

      ctxT.beginPath();
      ctxT.strokeStyle = isMajor ? '#777777' : (isMedium ? '#444444' : '#2b2b2b');
      ctxT.lineWidth = 1;
      const tickLen = isMajor ? 9 : (isMedium ? 5 : 3);
      ctxT.moveTo(screenX + 0.5, topHeight - tickLen);
      ctxT.lineTo(screenX + 0.5, topHeight - 1);
      ctxT.stroke();

      if (isMajor) {
        ctxT.fillStyle = '#999999';
        ctxT.fillText(String(Math.round(dX)), screenX + 3, 2);
      }
    }

    // Hairline indicator on top ruler
    if (mousePos.x !== null) {
      const mx = mousePos.x - (scrollRect.left + LP_W + RULER_SIZE);
      if (mx >= 0 && mx <= topW) {
        ctxT.strokeStyle = '#000000';
        ctxT.lineWidth = 1.5;
        ctxT.beginPath();
        ctxT.moveTo(mx + 0.5, 0);
        ctxT.lineTo(mx + 0.5, topHeight);
        ctxT.stroke();
      }
    }

    // ==================== 2. DRAW LEFT RULER ====================
    const ctxL = leftCv.getContext('2d');
    ctxL.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxL.clearRect(0, 0, leftW, leftH);

    // Background
    ctxL.fillStyle = '#181818';
    ctxL.fillRect(0, 0, leftW, leftH);

    // Artboard span highlight
    const artboardH = c ? c.getHeight() : (1240 * curZoom);
    ctxL.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctxL.fillRect(0, originY, leftW, artboardH);

    // Border line at right
    ctxL.fillStyle = '#2c2c2c';
    ctxL.fillRect(leftW - 1, 0, 1, leftH);

    ctxL.font = '9px "Inter", Arial, sans-serif';

    const minDesignY = Math.floor((-originY) / (curZoom * minorStep)) * minorStep;
    const maxDesignY = Math.ceil((leftH - originY) / (curZoom * minorStep)) * minorStep;

    for (let dY = minDesignY; dY <= maxDesignY; dY += minorStep) {
      const screenY = Math.round(originY + dY * curZoom);
      if (screenY < 0 || screenY > leftH) continue;

      const isMajor = Math.abs(dY % interval) < 0.001;
      const isMedium = Math.abs(dY % (interval / 2)) < 0.001;

      ctxL.beginPath();
      ctxL.strokeStyle = isMajor ? '#777777' : (isMedium ? '#444444' : '#2b2b2b');
      ctxL.lineWidth = 1;
      const tickLen = isMajor ? 9 : (isMedium ? 5 : 3);
      ctxL.moveTo(leftW - tickLen, screenY + 0.5);
      ctxL.lineTo(leftW - 1, screenY + 0.5);
      ctxL.stroke();

      if (isMajor) {
        ctxL.save();
        ctxL.translate(2, screenY);
        ctxL.rotate(-Math.PI / 2);
        ctxL.fillStyle = '#999999';
        ctxL.textAlign = 'center';
        ctxL.textBaseline = 'top';
        ctxL.fillText(String(Math.round(dY)), 0, 2);
        ctxL.restore();
      }
    }

    // Hairline indicator on left ruler
    if (mousePos.y !== null) {
      const my = mousePos.y - (scrollRect.top + RULER_SIZE);
      if (my >= 0 && my <= leftH) {
        ctxL.strokeStyle = '#000000';
        ctxL.lineWidth = 1.5;
        ctxL.beginPath();
        ctxL.moveTo(0, my + 0.5);
        ctxL.lineTo(leftW, my + 0.5);
        ctxL.stroke();
      }
    }
  }

  function scheduleRulerDraw() {
    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(drawRulers);
  }

  // Bind mouse and scroll events
  function init() {
    const stageScroll = document.querySelector('#stage-scroll');
    if (stageScroll) {
      stageScroll.addEventListener('scroll', scheduleRulerDraw, { passive: true });
      stageScroll.addEventListener('mousemove', e => {
        mousePos.x = e.clientX;
        mousePos.y = e.clientY;
        scheduleRulerDraw();
      });
      stageScroll.addEventListener('mouseleave', () => {
        mousePos.x = null;
        mousePos.y = null;
        scheduleRulerDraw();
      });
    }

    window.addEventListener('resize', scheduleRulerDraw);

    // Redraw after canvas changes
    const observer = new MutationObserver(scheduleRulerDraw);
    const stage = document.querySelector('#stage');
    if (stage) {
      observer.observe(stage, { attributes: true, childList: true, subtree: true });
    }

    // Redraw periodically only when editor screen is active
    setInterval(() => {
      const editor = document.querySelector('#screen-editor');
      if (editor && editor.classList.contains('active')) {
        scheduleRulerDraw();
      }
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.drawRulers = scheduleRulerDraw;
})();

