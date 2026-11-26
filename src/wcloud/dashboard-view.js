/*!
 * wcloud-lite - DashboardView
 * Adapted from: https://github.com/timdream/wordcloud/blob/main/assets/dashboard-view.js
 *
 * Copyright 2011, 2013-2019 Timothy Guan-tin Chien and other contributors.
 * Modified work Copyright (c) 2026 Idx
 * Released under the MIT license
 */

import { Dropdown } from '../vendor/index.js';
import { _ } from '../timdream/index.js';
import { View } from './views.js';

export class DashboardView extends View {
  constructor(opts) {
    super();
    this.load(opts, {
      name: 'dashboard',
      element: 'wc-dashboard',
    });

    // Event delegation covers both static toolbar buttons and dynamic dropdown font items.
    this.element.addEventListener('click', this);

    const fontToggleBtn = document.getElementById('btn-pickfont');
    if (fontToggleBtn) {
      this.fontDropdown = Dropdown.getOrCreateInstance(fontToggleBtn);
    }
  }

  beforeShow(state, nextState) {
    this.syncControls(nextState);
    this.syncActiveFont();
  }

  beforeHide(state, nextState) {
    this.syncControls(nextState);
  }

  syncActiveFont() {
    const app = this.app;
    const dropdownList = document.getElementById('dashboard-dropdown-fonts');
    if (!app || !dropdownList) {
      return;
    }

    const activeFont =
      app.data.custom_themeIndex === app.data.theme && app.data.custom
        ? app.data.custom.fontFamily
        : app.data.directFont || app.themes[app.data.theme]?.fontFamily || '';
    const primaryFont = String(activeFont).split(',')[0].replace(/"/g, '').trim();

    const links = Array.from(dropdownList.querySelectorAll('a[data-font]'));
    let matched = links.find((link) => link.dataset.font === activeFont);
    if (!matched && primaryFont) {
      matched = links.find((link) => link.dataset.font.includes(primaryFont));
    }

    links.forEach((link) => {
      link.classList.toggle('active', link === matched);
    });
  }

  syncControls(nextState) {
    const ctlBtns = this.element.querySelectorAll('[data-canvas-ctl]');
    const saved = this.app.getStorageOptions();
    if (saved && saved.panelpos) {
      this.app.reposPanel(saved.panelpos);
    } else {
      this.app.reposPanel(this.app.data.panelpos);
    }

    const enable = nextState === this.app.UI_STATE_DASHBOARD;
    ctlBtns.forEach((el) => {
      el.classList.toggle('disabled', !enable);
      if ('disabled' in el) {
        el.disabled = !enable;
      }
    });
  }

  handleEvent(evt) {
    const el = evt.target.closest('[data-action]');
    if (!el || !this.element.contains(el)) {
      return;
    }

    if (el.classList.contains('disabled') || el.disabled) {
      evt.preventDefault();
      return;
    }

    const app = this.app;
    const action = el.getAttribute('data-action');
    app.logAction('DashboardView::action', action);

    app.dashboardEvent = true;
    app.refView = 'dashboard';

    switch (action) {
      case 'back':
        app.refView = 'source';
        app.reset();
        break;

      case 'refresh':
        app.draw();
        break;

      case 'edit':
        app.switchUIState(app.UI_STATE_LIST_DIALOG);
        break;

      case 'option':
        app.switchUIState(app.UI_STATE_OPTION_DIALOG);
        break;

      case 'toogle-hide':
        app.tooglePanel(false);
        break;

      case 'toogle-show':
        app.tooglePanel(true);
        break;

      case 'swfont': {
        evt.preventDefault();
        const fontFamily = el.getAttribute('data-font');
        if (app.data.custom_themeIndex === app.data.theme && app.data.custom) {
          app.data.custom.fontFamily = fontFamily;
        } else {
          app.data.directFont = fontFamily;
        }
        this.syncActiveFont();
        if (this.fontDropdown) {
          this.fontDropdown.hide();
        }
        app.draw();
        break;
      }

      case 'theme': {
        const hasCustom = Boolean(app.data.custom);
        const maxThemes = hasCustom ? app.themes.length : app.data.custom_themeIndex;
        app.data.theme = (app.data.theme + 1) % maxThemes;
        this.syncActiveFont();
        app.draw();
        break;
      }

      case 'shape':
        app.data.shape = (app.data.shape + 1) % app.shapes.length;
        app.draw();
        break;

      case 'size+':
        app.data.weightFactor += app.data.unitweightFactor;
        app.draw();
        break;

      case 'size-':
        if (app.data.weightFactor <= app.data.unitweightFactor) {
          break;
        }
        app.data.weightFactor -= app.data.unitweightFactor;
        app.draw();
        break;

      case 'gap+':
        app.data.gridSize += 1;
        app.draw();
        break;

      case 'gap-':
        if (app.data.gridSize <= 2) {
          break;
        }
        app.data.gridSize -= 1;
        app.draw();
        break;

      case 'save': {
        const url = app.getCanvasElement().toDataURL('image/png');
        const filename = `wordcloud-${Date.now()}.png`;
        el.setAttribute('download', filename);

        if ('download' in document.createElement('a')) {
          el.href = url;
          window.setTimeout(() => {
            el.href = '#';
          }, 0);
        } else {
          evt.preventDefault();
          const win = window.open('', '_blank', 'width=600,height=400,resizable=yes,menubar=yes');
          if (win) {
            const doc = win.document;
            doc.title = _('image-popup-title');
            doc.body.innerHTML = '';
            const img = doc.createElement('img');
            img.id = 'popup-image';
            img.src = url;
            doc.body.appendChild(img);
          }
        }
        break;
      }
    }

    app.dashboardEvent = null;
  }
}
