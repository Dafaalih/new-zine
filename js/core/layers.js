(function () {
  'use strict';

  /* ============================================================
     ZINE MAKER — LAYERS PANEL & CONTEXT MENU (layers.js)
     1. Left-docked interactive layers list
     2. Right-click context menu (duplicate, delete, flip, rotate, layers)
     ============================================================ */

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  let panelEl = null;
  let contextMenuEl = null;
  let isPanelOpen = true; // default open on desktop, auto-collapsed on narrow screens

  function isHelperObject(o) {
    if (!o) return true;
    if (o._isCropRect) return true;
    if (o.hoverCursor === 'default' && o.fill === 'rgba(0,0,0,0.45)') return true; // crop dims
    const name = o.name || '';
    if (name.startsWith('frame-') || name.startsWith('label-') || name.startsWith('badge-')) return true;
    return false;
  }

  function getActiveCanvas() {
    return window.ZineApp?.activeCanvas?.() || null;
  }

  function getActivePage() {
    return window.ZineApp?.activePage?.() || null;
  }

  /* ------------------------------------------------------------
     DOM CREATION: LAYERS PANEL
     ------------------------------------------------------------ */
  function createLayersPanel() {
    if (panelEl) return panelEl;

    const aside = document.createElement('aside');
    aside.id = 'layers-panel';
    aside.className = 'layers-panel';
    aside.setAttribute('aria-label', 'layers');

    aside.innerHTML = `
      <div class="lp-header">
        <div class="lp-title-wrap">
          <svg class="lp-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 18l9 5 9-5"/>
          </svg>
          <span class="lp-title">layers</span>
          <span class="lp-count" id="lp-count">0</span>
        </div>
        <div class="lp-header-actions">
          <button class="lp-btn-icon" id="lp-btn-up" title="bring forward">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>
          </button>
          <button class="lp-btn-icon" id="lp-btn-down" title="send backward">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
      </div>
      <div class="lp-list" id="lp-list" role="listbox" aria-label="canvas layers">
        <!-- layer items injected here -->
      </div>
    `;

    // Insert on the right side of screen-editor
    const editor = $('#screen-editor');
    if (editor) {
      editor.appendChild(aside);
    }

    panelEl = aside;
    isPanelOpen = true;

    // Up / Down layer reorder
    aside.querySelector('#lp-btn-up').addEventListener('click', () => {
      if (window.ZineApp?.applyLayer) window.ZineApp.applyLayer('forward');
      renderLayers();
    });
    aside.querySelector('#lp-btn-down').addEventListener('click', () => {
      moveSelectedBackward();
      renderLayers();
    });

    return aside;
  }

  function togglePanel() {
    createLayersPanel();
    isPanelOpen = true;
    panelEl.classList.remove('collapsed');
  }

  function openPanel() {
    createLayersPanel();
    isPanelOpen = true;
    panelEl.classList.remove('collapsed');
  }

  function closePanel() {
    createLayersPanel();
    isPanelOpen = true;
    panelEl.classList.remove('collapsed');
  }

  /* ------------------------------------------------------------
     LAYER HELPERS: Move Above Background Frames
     ------------------------------------------------------------ */
  function moveSelectedBackward() {
    const c = getActiveCanvas();
    if (!c) return;
    const objs = c.getActiveObjects();
    if (!objs.length) return;

    const all = c.getObjects();
    // Find highest index of background frame
    let minAllowedIndex = 0;
    all.forEach((o, idx) => {
      if (o.name && o.name.startsWith('frame-')) {
        minAllowedIndex = Math.max(minAllowedIndex, idx + 1);
      }
    });

    objs.forEach(o => {
      const curIdx = all.indexOf(o);
      if (curIdx > minAllowedIndex) {
        c.sendBackwards(o);
      }
    });
    c.requestRenderAll();
    if (window.ZineApp?.markChange) window.ZineApp.markChange();
  }

  /* ------------------------------------------------------------
     LAYER SVG ICONS
     ------------------------------------------------------------ */
  const LAYER_ICONS = {
    rect: '<svg class="lp-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
    circle: '<svg class="lp-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/></svg>',
    triangle: '<svg class="lp-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 3 22 21 2 21"/></svg>',
    text: '<svg class="lp-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
    image: '<svg class="lp-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    doodle: '<svg class="lp-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/><path d="M14 5l3 3"/></svg>',
    texture: '<svg class="lp-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    star: '<svg class="lp-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    group: '<svg class="lp-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M7 7h10v10H7z" stroke-dasharray="2 2"/></svg>',
    object: '<svg class="lp-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>'
  };

  /* ------------------------------------------------------------
     RENDER LAYERS LIST
     ------------------------------------------------------------ */
  function getLayerIconAndName(obj) {
    if (!obj) return { icon: LAYER_ICONS.object, name: 'object' };
    const type = (obj.type || '').toLowerCase();

    if (obj._isTextureOverlay) {
      return { icon: LAYER_ICONS.texture, name: 'texture overlay' };
    }

    if (type === 'group') {
      const count = obj.getObjects ? obj.getObjects().length : 0;
      return { icon: LAYER_ICONS.group, name: `group (${count})` };
    }

    if (type === 'textbox' || type === 'i-text' || type === 'text') {
      const txt = (obj.text || obj.rawText || '').trim().replace(/\n/g, ' ');
      const preview = txt ? (txt.length > 20 ? txt.slice(0, 18) + '…' : txt) : 'text';
      return { icon: LAYER_ICONS.text, name: preview };
    }

    if (type === 'image') {
      return { icon: LAYER_ICONS.image, name: 'photo' };
    }

    if (type === 'path') {
      return { icon: LAYER_ICONS.doodle, name: 'doodle' };
    }

    if (type === 'rect') return { icon: LAYER_ICONS.rect, name: 'rectangle' };
    if (type === 'circle') return { icon: LAYER_ICONS.circle, name: 'circle' };
    if (type === 'triangle') return { icon: LAYER_ICONS.triangle, name: 'triangle' };

    const name = obj.name || obj.type || 'object';
    return { icon: LAYER_ICONS.object, name: name };
  }

  function renderLayers() {
    createLayersPanel();
    const listEl = $('#lp-list');
    const countEl = $('#lp-count');
    if (!listEl) return;

    const c = getActiveCanvas();
    if (!c) {
      listEl.innerHTML = '<div class="lp-empty">no active canvas</div>';
      if (countEl) countEl.textContent = '0';
      return;
    }

    const allObjects = c.getObjects();
    // Filter out helper frames, badges, labels, and crop rects
    const userObjects = allObjects.filter(o => !isHelperObject(o));
    if (countEl) countEl.textContent = String(userObjects.length);

    if (!userObjects.length) {
      listEl.innerHTML = '<div class="lp-empty">no layers yet.<br>add text, photo, or shape.</div>';
      return;
    }

    const activeObjects = c.getActiveObjects();

    // Display in TOP TO BOTTOM order (highest stack index first)
    const reversed = userObjects.slice().reverse();

    let html = '';
    reversed.forEach((obj, revIdx) => {
      const isSelected = activeObjects.includes(obj);
      const isLocked = !obj.selectable && !obj.evented;
      const isHidden = obj.visible === false;
      const { icon, name } = getLayerIconAndName(obj);

      html += `
        <div class="lp-item ${isSelected ? 'selected' : ''} ${isHidden ? 'hidden-layer' : ''} ${isLocked ? 'locked-layer' : ''}"
             data-index="${allObjects.indexOf(obj)}"
             draggable="true"
             role="option"
             aria-selected="${isSelected}">
          <span class="lp-item-type">${icon}</span>
          <span class="lp-item-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
          <div class="lp-item-actions">
            <button class="lp-item-btn lp-btn-vis" title="${isHidden ? 'show layer' : 'hide layer'}" data-action="toggle-vis">
              ${isHidden 
                ? '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
                : '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
              }
            </button>
            <button class="lp-item-btn lp-btn-lock" title="${isLocked ? 'unlock layer' : 'lock layer'}" data-action="toggle-lock">
              ${isLocked
                ? '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
                : '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>'
              }
            </button>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;

    // Drag and drop layer reordering
    let draggedObj = null;

    listEl.querySelectorAll('.lp-item').forEach(itemEl => {
      const idx = parseInt(itemEl.dataset.index, 10);
      const targetObj = allObjects[idx];
      if (!targetObj) return;

      // Prevent dragging when clicking buttons
      itemEl.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('mousedown', () => itemEl.setAttribute('draggable', 'false'));
        btn.addEventListener('mouseup', () => itemEl.setAttribute('draggable', 'true'));
      });

      itemEl.addEventListener('dragstart', e => {
        draggedObj = targetObj;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(idx));
        itemEl.classList.add('lp-dragging');
      });

      itemEl.addEventListener('dragover', e => {
        if (!draggedObj || draggedObj === targetObj) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = itemEl.getBoundingClientRect();
        const isAbove = (e.clientY - rect.top) < (rect.height / 2);
        itemEl.classList.toggle('lp-drop-above', isAbove);
        itemEl.classList.toggle('lp-drop-below', !isAbove);
      });

      itemEl.addEventListener('dragleave', () => {
        itemEl.classList.remove('lp-drop-above', 'lp-drop-below');
      });

      itemEl.addEventListener('dragend', () => {
        draggedObj = null;
        listEl.querySelectorAll('.lp-item').forEach(el => {
          el.classList.remove('lp-dragging', 'lp-drop-above', 'lp-drop-below');
        });
      });

      itemEl.addEventListener('drop', e => {
        e.preventDefault();
        itemEl.classList.remove('lp-drop-above', 'lp-drop-below');
        if (!draggedObj || draggedObj === targetObj) return;

        const all = c.getObjects();
        let minAllowedIndex = 0;
        all.forEach((o, i) => {
          if (o.name && o.name.startsWith('frame-')) minAllowedIndex = i + 1;
        });

        const rect = itemEl.getBoundingClientRect();
        const isAbove = (e.clientY - rect.top) < (rect.height / 2);

        const fromIdx = all.indexOf(draggedObj);
        const toIdx = all.indexOf(targetObj);
        if (fromIdx === -1 || toIdx === -1) return;

        let newIdx;
        if (isAbove) {
          newIdx = fromIdx < toIdx ? toIdx : toIdx + 1;
        } else {
          newIdx = fromIdx < toIdx ? toIdx - 1 : toIdx;
        }

        newIdx = Math.max(minAllowedIndex, Math.min(all.length - 1, newIdx));

        c.moveTo(draggedObj, newIdx);
        c.requestRenderAll();
        if (window.ZineApp?.markChange) window.ZineApp.markChange();
        renderLayers();
      });

      // Click to select (with Ctrl/Cmd/Shift multi-select support)
      itemEl.addEventListener('click', e => {
        if (e.target.closest('.lp-item-btn')) return; // action buttons handled separately
        if (targetObj.visible === false) return; // can't select hidden

        const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;

        if (isMulti) {
          const currentObjs = c.getActiveObjects().slice();
          let newSelected = [];

          if (currentObjs.includes(targetObj)) {
            // Already selected: toggle off
            newSelected = currentObjs.filter(o => o !== targetObj);
          } else {
            // Add to selection
            newSelected = [...currentObjs, targetObj];
          }

          c.discardActiveObject();

          if (newSelected.length === 1) {
            c.setActiveObject(newSelected[0]);
          } else if (newSelected.length > 1) {
            const activeSel = new fabric.ActiveSelection(newSelected, { canvas: c });
            c.setActiveObject(activeSel);
            activeSel.setCoords();
          }

          c.requestRenderAll();
          if (window.ZineApp?.refreshProps) window.ZineApp.refreshProps();
          renderLayers();
        } else {
          // Normal single select
          c.discardActiveObject();
          c.setActiveObject(targetObj);
          c.requestRenderAll();
          if (window.ZineApp?.refreshProps) window.ZineApp.refreshProps();
          renderLayers();
        }
      });

      // Toggle visibility
      const visBtn = itemEl.querySelector('[data-action="toggle-vis"]');
      if (visBtn) {
        visBtn.addEventListener('click', e => {
          e.stopPropagation();
          targetObj.visible = targetObj.visible === false ? true : false;
          if (targetObj.visible === false && c.getActiveObjects().includes(targetObj)) {
            c.discardActiveObject();
          }
          c.requestRenderAll();
          if (window.ZineApp?.markChange) window.ZineApp.markChange();
          renderLayers();
        });
      }

      // Toggle lock
      const lockBtn = itemEl.querySelector('[data-action="toggle-lock"]');
      if (lockBtn) {
        lockBtn.addEventListener('click', e => {
          e.stopPropagation();
          const locked = !targetObj.selectable && !targetObj.evented;
          targetObj.selectable = locked;
          targetObj.evented = locked;
          if (!locked && c.getActiveObjects().includes(targetObj)) {
            c.discardActiveObject();
          }
          c.requestRenderAll();
          if (window.ZineApp?.markChange) window.ZineApp.markChange();
          renderLayers();
        });
      }
    });
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  /* ------------------------------------------------------------
     DOM CREATION: RIGHT-CLICK CONTEXT MENU
     ------------------------------------------------------------ */
  let lastRightClickTarget = null;

  function createContextMenu() {
    if (contextMenuEl) return contextMenuEl;

    const div = document.createElement('div');
    div.id = 'zine-context-menu';
    div.className = 'zine-context-menu hidden';
    div.innerHTML = `
      <div class="cm-item cm-obj-action" data-action="duplicate">
        <span class="cm-label">duplicate</span>
        <span class="cm-key">Ctrl+D</span>
      </div>
      <div class="cm-item cm-obj-action cm-image-only" data-action="replace-photo">
        <span class="cm-label">replace photo</span>
      </div>
      <div class="cm-item cm-obj-action" data-action="delete">
        <span class="cm-label">delete</span>
        <span class="cm-key">Del</span>
      </div>
      <div class="cm-divider cm-obj-action cm-group-divider"></div>
      <div class="cm-item cm-obj-action cm-group-action" data-action="group">
        <span class="cm-label">group</span>
        <span class="cm-key">Ctrl+G</span>
      </div>
      <div class="cm-item cm-obj-action cm-ungroup-action" data-action="ungroup">
        <span class="cm-label">ungroup</span>
        <span class="cm-key">Ctrl+Shift+G</span>
      </div>
      <div class="cm-divider cm-obj-action"></div>
      <div class="cm-item cm-obj-action" data-action="flip-h">
        <span class="cm-label">flip horizontal</span>
      </div>
      <div class="cm-item cm-obj-action" data-action="flip-v">
        <span class="cm-label">flip vertical</span>
      </div>
      <div class="cm-item cm-obj-action" data-action="rotate180">
        <span class="cm-label">rotate 180°</span>
      </div>
      <div class="cm-divider cm-obj-action"></div>
      <div class="cm-item cm-obj-action" data-action="layer-front">
        <span class="cm-label">bring to front</span>
        <span class="cm-key">Ctrl+]</span>
      </div>
      <div class="cm-item cm-obj-action" data-action="layer-forward">
        <span class="cm-label">bring forward</span>
      </div>
      <div class="cm-item cm-obj-action" data-action="layer-backward">
        <span class="cm-label">send backward</span>
      </div>
      <div class="cm-item cm-obj-action" data-action="layer-back">
        <span class="cm-label">send to back</span>
        <span class="cm-key">Ctrl+[</span>
      </div>
      <div class="cm-divider cm-obj-action"></div>
      <div class="cm-item cm-obj-action" data-action="lock-toggle">
        <span class="cm-label" id="cm-lock-label">lock object</span>
      </div>

      <!-- Canvas actions when right-clicking empty area -->
      <div class="cm-item cm-canvas-action" data-action="canvas-paste">
        <span class="cm-label">paste</span>
        <span class="cm-key">Ctrl+V</span>
      </div>
      <div class="cm-item cm-canvas-action" data-action="canvas-select-all">
        <span class="cm-label">select all</span>
        <span class="cm-key">Ctrl+A</span>
      </div>
      <div class="cm-divider cm-canvas-action"></div>
      <div class="cm-item cm-canvas-action" data-action="toggle-layers">
        <span class="cm-label">toggle layers panel</span>
      </div>
      <div class="cm-item cm-canvas-action" data-action="canvas-fit">
        <span class="cm-label">fit to screen</span>
      </div>
    `;

    document.body.appendChild(div);
    contextMenuEl = div;

    // Actions click
    div.addEventListener('click', e => {
      const item = e.target.closest('.cm-item');
      if (!item) return;
      const act = item.dataset.action;
      executeContextAction(act);
      hideContextMenu();
    });

    // Dismiss on click outside
    window.addEventListener('pointerdown', e => {
      if (contextMenuEl && !contextMenuEl.classList.contains('hidden')) {
        if (!e.target.closest('#zine-context-menu')) {
          hideContextMenu();
        }
      }
    }, true);

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') hideContextMenu();
    });

    return div;
  }

  function showContextMenu(x, y) {
    createContextMenu();
    const c = getActiveCanvas();
    if (!c) return;

    const hasSelection = c.getActiveObjects().length > 0;
    const objs = c.getActiveObjects();

    // Toggle items based on whether objects are selected
    const objItems = contextMenuEl.querySelectorAll('.cm-obj-action');
    const canvasItems = contextMenuEl.querySelectorAll('.cm-canvas-action');

    objItems.forEach(el => el.classList.toggle('hidden', !hasSelection));
    canvasItems.forEach(el => el.classList.toggle('hidden', hasSelection));

    if (hasSelection) {
      const isLocked = objs.every(o => !o.selectable && !o.evented);
      const lockLabel = $('#cm-lock-label');
      if (lockLabel) lockLabel.textContent = isLocked ? 'unlock object' : 'lock object';

      // Show "replace photo" only when a single image is selected
      const hasImage = objs.length === 1 && objs[0].type === 'image';
      const replaceItems = contextMenuEl.querySelectorAll('.cm-image-only');
      replaceItems.forEach(el => el.classList.toggle('hidden', !hasImage));

      // Group / Ungroup visibility
      const activeObj = c.getActiveObject();
      const isMulti = objs.length > 1 || (activeObj && activeObj.type === 'activeSelection');
      const isGroup = (objs.length === 1 && objs[0].type === 'group') || (activeObj && activeObj.type === 'group');

      const groupItems = contextMenuEl.querySelectorAll('.cm-group-action');
      const ungroupItems = contextMenuEl.querySelectorAll('.cm-ungroup-action');
      const groupDividers = contextMenuEl.querySelectorAll('.cm-group-divider');

      groupItems.forEach(el => el.classList.toggle('hidden', !isMulti));
      ungroupItems.forEach(el => el.classList.toggle('hidden', !isGroup));
      groupDividers.forEach(el => el.classList.toggle('hidden', !isMulti && !isGroup));
    }

    contextMenuEl.classList.remove('hidden');

    // Clamp coordinates to viewport so it never goes off-screen
    const w = contextMenuEl.offsetWidth || 200;
    const h = contextMenuEl.offsetHeight || 300;
    const maxX = window.innerWidth - w - 12;
    const maxY = window.innerHeight - h - 12;
    const posX = Math.max(12, Math.min(x, maxX));
    const posY = Math.max(12, Math.min(y, maxY));

    contextMenuEl.style.left = posX + 'px';
    contextMenuEl.style.top = posY + 'px';
  }

  function hideContextMenu() {
    if (contextMenuEl) {
      contextMenuEl.classList.add('hidden');
    }
  }

  function executeContextAction(act) {
    const app = window.ZineApp;
    if (!app) return;

    switch (act) {
      case 'group':
        if (app.groupSelection) app.groupSelection();
        break;
      case 'ungroup':
        if (app.ungroupSelection) app.ungroupSelection();
        break;
      case 'duplicate':
        if (app.duplicateSelection) app.duplicateSelection();
        break;
      case 'delete':
        if (app.deleteSelection) app.deleteSelection();
        break;
      case 'replace-photo': {
        const c = getActiveCanvas();
        if (c) {
          const objs = c.getActiveObjects();
          const imgObj = objs.find(o => o.type === 'image');
          if (imgObj && window.replacePhoto) window.replacePhoto(imgObj);
        }
        break;
      }
      case 'flip-h':
        if (app.flipSelection) app.flipSelection('h');
        break;
      case 'flip-v':
        if (app.flipSelection) app.flipSelection('v');
        break;
      case 'rotate180':
        if (app.rotate180) app.rotate180();
        break;
      case 'layer-front':
        if (app.applyLayer) app.applyLayer('front');
        break;
      case 'layer-forward':
        if (app.applyLayer) app.applyLayer('forward');
        break;
      case 'layer-backward':
        moveSelectedBackward();
        break;
      case 'layer-back':
        moveSelectedBackward();
        break;
      case 'lock-toggle': {
        const c = getActiveCanvas();
        if (c) {
          const objs = c.getActiveObjects();
          const currentlyLocked = objs.every(o => !o.selectable && !o.evented);
          objs.forEach(o => {
            o.selectable = currentlyLocked;
            o.evented = currentlyLocked;
          });
          if (!currentlyLocked) c.discardActiveObject();
          c.requestRenderAll();
          if (app.markChange) app.markChange();
          renderLayers();
        }
        break;
      }
      case 'canvas-paste': {
        const keyEvent = new KeyboardEvent('keydown', { key: 'v', code: 'KeyV', ctrlKey: true, bubbles: true });
        window.dispatchEvent(keyEvent);
        break;
      }
      case 'canvas-select-all': {
        const c = getActiveCanvas();
        if (c) {
          const selectableObjs = c.getObjects().filter(o => !isHelperObject(o) && o.selectable !== false);
          if (selectableObjs.length) {
            c.discardActiveObject();
            const sel = new fabric.ActiveSelection(selectableObjs, { canvas: c });
            c.setActiveObject(sel);
            c.requestRenderAll();
            renderLayers();
          }
        }
        break;
      }
      case 'toggle-layers':
        togglePanel();
        break;
      case 'canvas-fit': {
        const btn = $('#toolbar [data-tool="fit"]');
        if (btn) btn.click();
        break;
      }
    }
    renderLayers();
  }

  /* ------------------------------------------------------------
     BIND CANVAS EVENTS & CONTEXTMENU
     ------------------------------------------------------------ */
  function isTargetInActiveSelection(canvas, target, e) {
    if (!canvas) return false;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) return false;

    // Direct match with active object (single object, group, or ActiveSelection)
    if (target && activeObj === target) return true;

    // Check if target is in getActiveObjects()
    const activeList = canvas.getActiveObjects() || [];
    if (target && activeList.includes(target)) return true;

    // Check if activeObj is ActiveSelection or Group that contains target
    if (target) {
      if (typeof activeObj.contains === 'function' && activeObj.contains(target)) return true;
      if (Array.isArray(activeObj._objects) && activeObj._objects.includes(target)) return true;
      if (typeof activeObj.getObjects === 'function' && activeObj.getObjects().includes(target)) return true;
    }

    // Check if pointer falls within the active object's bounding box / area
    if (e) {
      try {
        const ptr = canvas.getPointer(e);
        if (activeObj.containsPoint && activeObj.containsPoint(ptr)) return true;
        const br = activeObj.getBoundingRect ? activeObj.getBoundingRect(true, true) : null;
        if (br && ptr.x >= br.left && ptr.x <= br.left + br.width && ptr.y >= br.top && ptr.y <= br.top + br.height) {
          return true;
        }
      } catch (_) {}
    }

    return false;
  }

  function wireCanvasListeners() {
    createContextMenu();

    // Use CAPTURE phase so it intercepts the event before Fabric's stopEvent
    window.addEventListener('contextmenu', e => {
      const editor = $('#screen-editor');
      if (!editor || !editor.classList.contains('active')) return;

      // Allow default context menu on text inputs / textareas
      if (e.target.closest('input, textarea, [contenteditable="true"]')) return;

      // Don't intercept clicks inside other popups/modals
      if (e.target.closest('#propsDrawer, #toolbar, .text-panel, .figma-color-picker, .modal-overlay, .projects-modal-overlay')) {
        return;
      }

      // Check if clicked in stage, canvas, or layers panel
      const stageScroll = $('#stage-scroll');
      const layersPanel = $('#layers-panel');
      const inStage = stageScroll && (stageScroll.contains(e.target) || stageScroll === e.target);
      const inLayers = layersPanel && (layersPanel.contains(e.target) || layersPanel === e.target);

      if (!inStage && !inLayers) return;

      e.preventDefault();
      e.stopPropagation();

      const c = getActiveCanvas();
      if (!c) return;

      // If clicked on canvas, identify the object under the cursor
      if (inStage) {
        let target = lastRightClickTarget || c.findTarget(e);

        // If target was not found directly, check coordinate bounds
        if (!target) {
          const ptr = c.getPointer(e);
          const objs = c.getObjects().filter(o => !isHelperObject(o));
          for (let i = objs.length - 1; i >= 0; i--) {
            if (objs[i].containsPoint && objs[i].containsPoint(ptr)) {
              target = objs[i];
              break;
            }
          }
        }

        // Check if right-clicked target or pointer is already inside the current active selection
        if (isTargetInActiveSelection(c, target, e)) {
          // Keep current selection intact (preserve multi-selection or group)
        } else if (target && !isHelperObject(target)) {
          // Right-clicked an unselected object: select it
          c.discardActiveObject();
          c.setActiveObject(target);
          c.requestRenderAll();
          renderLayers();
        } else {
          // Right-clicked empty canvas background: clear selection to show canvas actions
          c.discardActiveObject();
          c.requestRenderAll();
          renderLayers();
        }
      } else if (inLayers) {
        const itemEl = e.target.closest('.lp-item');
        if (itemEl) {
          const idx = parseInt(itemEl.dataset.index, 10);
          const all = c.getObjects();
          const targetObj = all[idx];
          if (targetObj && !isHelperObject(targetObj)) {
            if (!isTargetInActiveSelection(c, targetObj)) {
              c.discardActiveObject();
              c.setActiveObject(targetObj);
              c.requestRenderAll();
              renderLayers();
            }
          }
        }
      }

      showContextMenu(e.clientX, e.clientY);
    }, true);

    // Auto-sync layers on canvas changes & capture right-click target from Fabric
    const syncEvents = ['selection:created', 'selection:updated', 'selection:cleared', 'object:added', 'object:removed', 'object:modified'];

    function attachToCanvas(canvas) {
      if (!canvas || canvas.__layersWired) return;
      canvas.__layersWired = true;

      // Fabric mouse:down to track right-click target
      canvas.on('mouse:down', opt => {
        if (opt.button === 3 || (opt.e && opt.e.button === 2)) {
          lastRightClickTarget = (opt.target && !isHelperObject(opt.target)) ? opt.target : null;
          if (lastRightClickTarget) {
            // If right-clicked target is not part of current selection, update selection
            if (!isTargetInActiveSelection(canvas, lastRightClickTarget, opt.e)) {
              canvas.discardActiveObject();
              canvas.setActiveObject(lastRightClickTarget);
              canvas.requestRenderAll();
              renderLayers();
            }
          }
        } else {
          lastRightClickTarget = null;
        }
      });

      syncEvents.forEach(evt => {
        canvas.on(evt, () => {
          setTimeout(renderLayers, 20);
        });
      });
    }

    // Attach to current active canvas and watch for changes
    setInterval(() => {
      const c = getActiveCanvas();
      if (c) attachToCanvas(c);
    }, 500);

    // Initial render
    setTimeout(renderLayers, 100);
  }

  /* ------------------------------------------------------------
     STYLES
     ------------------------------------------------------------ */
  function injectStyles() {
    if ($('#layers-styles')) return;

    const style = document.createElement('style');
    style.id = 'layers-styles';
    style.textContent = `
      /* Left Docked Permanent Layers Panel */
      .layers-panel {
        position: absolute;
        top: 52px;
        left: 0;
        right: auto;
        bottom: 0;
        width: 240px;
        background: #0a0a0f;
        border-right: 1.5px solid rgba(255, 255, 255, 0.15);
        border-left: none;
        display: flex;
        flex-direction: column;
        z-index: 50;
        box-shadow: 4px 0 24px rgba(0,0,0,0.5);
      }
      .lp-header {
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 12px;
        border-bottom: 1.5px solid rgba(255, 255, 255, 0.12);
        background: #0e0e14;
        flex-shrink: 0;
      }
      .lp-title-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #fff;
      }
      .lp-icon {
        color: #ffffff !important;
      }
      .lp-title {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: -0.01em;
        text-transform: lowercase;
      }
      .lp-count {
        font-size: 10px;
        background: rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.7);
        padding: 1px 6px;
        border-radius: 999px;
      }
      .lp-header-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .lp-btn-icon {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.15);
        color: #bbb;
        width: 24px;
        height: 24px;
        border-radius: 3px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s;
        padding: 0;
      }
      .lp-btn-icon:hover {
        background: #fff;
        color: #000;
        border-color: #fff;
      }
      .lp-list {
        flex: 1;
        overflow-y: auto;
        padding: 6px 0;
      }
      .lp-empty {
        padding: 30px 16px;
        text-align: center;
        font-size: 12px;
        color: rgba(255,255,255,0.4);
        line-height: 1.5;
      }
      .lp-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        cursor: pointer;
        user-select: none;
        color: rgba(255,255,255,0.85);
        font-size: 12px;
        border-left: 2px solid transparent;
        transition: background 0.1s, color 0.1s;
      }
      .lp-item:hover {
        background: rgba(255,255,255,0.06);
        color: #fff;
      }
      .lp-item[draggable="true"] {
        cursor: grab;
      }
      .lp-item[draggable="true"]:active {
        cursor: grabbing;
      }
      .lp-item.lp-dragging {
        opacity: 0.35 !important;
        background: rgba(47, 10, 233, 0.25) !important;
      }
      .lp-item.lp-drop-above {
        box-shadow: inset 0 2px 0 0 #000000, 0 -2px 0 0 #000000 !important;
      }
      .lp-item.lp-drop-below {
        box-shadow: inset 0 -2px 0 0 #000000, 0 2px 0 0 #000000 !important;
      }
      .lp-item.selected {
        background: #000000 !important;
        color: #fff !important;
        border-left-color: #fff;
      }
      .lp-item.hidden-layer {
        opacity: 0.45;
      }
      .lp-item-type {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        color: #ffffff !important;
        opacity: 0.9;
      }
      .lp-type-icon {
        width: 14px;
        height: 14px;
        display: inline-block;
        stroke: #ffffff !important;
      }
      .lp-item.selected .lp-item-type {
        color: #fff !important;
        opacity: 1;
      }
      .lp-item-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: inherit;
        letter-spacing: -0.01em;
      }
      .lp-item-actions {
        display: flex;
        align-items: center;
        gap: 2px;
        opacity: 0.4;
        transition: opacity 0.15s;
      }
      .lp-item:hover .lp-item-actions,
      .lp-item.selected .lp-item-actions {
        opacity: 1;
      }
      .lp-item-btn {
        background: transparent;
        border: none;
        color: inherit;
        width: 20px;
        height: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        border-radius: 2px;
      }
      .lp-item-btn:hover {
        background: rgba(255,255,255,0.2);
      }

      /* Context Menu */
      .zine-context-menu {
        position: fixed;
        background: #0e0e14;
        border: 1.5px solid rgba(255,255,255,0.2);
        box-shadow: 0 10px 32px rgba(0,0,0,0.85);
        padding: 6px 0;
        z-index: 10002;
        min-width: 190px;
        color: #fff;
        font-family: inherit;
        user-select: none;
      }
      .zine-context-menu.hidden {
        display: none !important;
      }
      .cm-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 7px 14px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        letter-spacing: -0.01em;
        text-transform: lowercase;
        transition: background 0.1s;
      }
      .cm-item:hover {
        background: #000000;
        color: #fff;
      }
      .cm-key {
        font-size: 10px;
        color: rgba(255,255,255,0.45);
        margin-left: 14px;
      }
      .cm-item:hover .cm-key {
        color: rgba(255,255,255,0.8);
      }
      .cm-divider {
        height: 1px;
        background: rgba(255,255,255,0.12);
        margin: 5px 0;
      }

      /* Adjust stage padding on desktop when layers open */
      @media (min-width: 768px) {
        .screen-editor {
          padding-left: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /* ------------------------------------------------------------
     INITIALIZE
     ------------------------------------------------------------ */
  function init() {
    injectStyles();
    createLayersPanel();
    createContextMenu();
    wireCanvasListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ZineLayers = {
    toggle: togglePanel,
    open: openPanel,
    close: closePanel,
    refresh: renderLayers
  };

})();

