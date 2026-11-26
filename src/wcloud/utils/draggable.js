/*!
 * wcloud-lite - Vanilla Pointer Events Modal Drag Helper
 * Origin: https://github.com/idoenk/wcloud-lite
 *
 * Copyright (c) 2026 Idx
 * Released under the MIT license
 */

const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, label, .btn-close';

/**
 * Lightweight vanilla Pointer Events modal drag helper (replaces jQuery UI .draggable()).
 */
export function attachModalDrag(modalEl) {
  if (!modalEl || !modalEl.classList.contains('draggable') || modalEl.dataset.draggableAttached) {
    return;
  }

  const dialogEl = modalEl.querySelector('.modal-dialog');
  if (!dialogEl) {
    return;
  }

  const handles = dialogEl.querySelectorAll('.modal-header, .modal-footer');
  if (!handles.length) {
    return;
  }

  let dragState = null;

  const onPointerDown = (evt) => {
    if (evt.button !== 0 && evt.pointerType === 'mouse') {
      return;
    }
    if (evt.target.closest(INTERACTIVE_SELECTOR)) {
      return;
    }

    const startOffsetX = Number.parseFloat(dialogEl.dataset.dragX || '0') || 0;
    const startOffsetY = Number.parseFloat(dialogEl.dataset.dragY || '0') || 0;

    dragState = {
      pointerId: evt.pointerId,
      startX: evt.clientX,
      startY: evt.clientY,
      startOffsetX,
      startOffsetY,
      handle: evt.currentTarget,
    };

    modalEl.classList.add('dragging');
    try {
      evt.currentTarget.setPointerCapture(evt.pointerId);
    } catch {
      // Fallback gracefully if capture is unavailable
    }
  };

  const onPointerMove = (evt) => {
    if (!dragState || evt.pointerId !== dragState.pointerId) {
      return;
    }

    const nextX = dragState.startOffsetX + (evt.clientX - dragState.startX);
    const nextY = dragState.startOffsetY + (evt.clientY - dragState.startY);
    dialogEl.dataset.dragX = String(nextX);
    dialogEl.dataset.dragY = String(nextY);
    dialogEl.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
  };

  const endDrag = (evt) => {
    if (!dragState || evt.pointerId !== dragState.pointerId) {
      return;
    }

    modalEl.classList.remove('dragging');
    try {
      dragState.handle.releasePointerCapture(evt.pointerId);
    } catch {
      // Ignore if already released
    }
    dragState = null;
  };

  handles.forEach((handle) => {
    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
  });

  modalEl.dataset.draggableAttached = '1';
}
