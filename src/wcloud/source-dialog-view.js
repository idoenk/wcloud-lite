/*!
 * wcloud-lite - SourceDialogView
 * Adapted from: https://github.com/timdream/wordcloud/blob/main/assets/source-dialog-view.js
 *
 * Copyright 2011, 2013-2019 Timothy Guan-tin Chien and other contributors.
 * Modified work Copyright (c) 2026 Idx
 * Released under the MIT license
 */

import { View } from './views.js';
import { attachModalDrag } from './utils/draggable.js';

const PANEL_TAB_MAP = {
  example: 'example',
  cp: 'copy-paste',
  file: 'upload',
};

export class SourceDialogView extends View {
  constructor(opts) {
    super();
    this.load(opts, {
      name: 'source-dialog',
      element: 'wc-source-dialog',
      menuElement: 'wc-source-menu',
      selectionElement: 'wc-source-selection',
      startBtnElement: 'wc-source-start-btn',
      panelContainerElement: 'wc-source-panels',
      optionBtnElement: 'wc-source-option-btn',
      texttypeToggleElement: 'wc-panel-texttype',
      texttypeToggle2Element: 'wc-panel-contenttype',
      aboutBtnElement: 'wc-source-about-btn',
    });

    this.currentPanel = null;
    this.panels = {};

    const menuLinks = this.menuElement.querySelectorAll('a[data-panel]');
    menuLinks.forEach((el) => {
      const option = document.createElement('option');
      option.value = el.getAttribute('data-panel');
      option.setAttribute('data-l10n-id', el.getAttribute('data-l10n-id'));
      option.textContent = el.textContent;
      this.selectionElement.appendChild(option);
    });

    this.menuElement.addEventListener('click', this);
    this.selectionElement.addEventListener('change', this);
    this.startBtnElement.addEventListener('click', this);
    this.panelContainerElement.addEventListener('submit', this);
    this.aboutBtnElement.addEventListener('click', this);
    this.optionBtnElement.addEventListener('click', this);
    this.texttypeToggleElement.addEventListener('change', this);
    this.texttypeToggle2Element.addEventListener('change', this);
  }

  afterShow() {
    if (this.currentPanel) {
      this.currentPanel.show();
    }
    attachModalDrag(this.element);
  }

  handleEvent(evt) {
    if (evt.type === 'submit') {
      evt.preventDefault();
      if (this.currentPanel) {
        this.currentPanel.submit();
      }
      return;
    }

    switch (evt.currentTarget) {
      case this.menuElement: {
        const link = evt.target.closest('a[data-panel]');
        if (!link) {
          return;
        }
        evt.preventDefault();
        const panelName = link.getAttribute('data-panel');
        if (!panelName || !this.panels[panelName]) {
          return;
        }
        this.selectPanel(this.panels[panelName]);
        break;
      }

      case this.selectionElement: {
        const panelName = evt.target.value;
        if (!panelName || !this.panels[panelName]) {
          return;
        }
        this.selectPanel(this.panels[panelName]);
        break;
      }

      case this.aboutBtnElement:
        evt.preventDefault();
        this.app.switchUIState(this.app.UI_STATE_ABOUT_DIALOG);
        break;

      case this.optionBtnElement:
        evt.preventDefault();
        this.app.refView = 'source';
        this.app.switchUIState(this.app.UI_STATE_OPTION_DIALOG);
        break;

      case this.startBtnElement:
        evt.preventDefault();
        if (this.currentPanel) {
          this.currentPanel.submit();
        }
        break;

      case this.texttypeToggleElement:
      case this.texttypeToggle2Element: {
        const targetId =
          evt.currentTarget.id === 'wc-panel-texttype'
            ? 'additional-wordlist-prop'
            : 'additional-panel-wordlist-prop';
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.classList.toggle('d-none', evt.currentTarget.value !== 'wordlist');
        }
        break;
      }
    }
  }

  submit(hash) {
    return this.app.pushUrlHash(hash);
  }

  selectPanel(panel) {
    this.showPanel(panel);
    const tabName = PANEL_TAB_MAP[panel.name];
    if (tabName && this.app) {
      this.app.pushUrlHash(`#tab:${tabName}`);
    }
  }

  showPanel(panel) {
    if (this.currentPanel) {
      this.currentPanel.hide();
    }
    panel.show();
    this.currentPanel = panel;

    if (this.app) {
      this.app.logAction('SourceDialogView::showPanel', panel.name);
    }
  }

  addPanel(panel) {
    this.panels[panel.name] = panel;
    panel.menuItemElement = this.menuElement.querySelector(`[data-panel="${panel.name}"]`);

    if (!panel.menuItemElement) {
      throw new Error(`menuItemElement not found for panel "${panel.name}".`);
    }

    const menuLi = panel.menuItemElement.parentElement;
    panel.selectionIndex = Array.prototype.indexOf.call(this.menuElement.children, menuLi);
    menuLi.removeAttribute('hidden');
    panel.dialog = this;

    if ('isSupported' in panel && !panel.isSupported) {
      menuLi.classList.add('disabled');
      panel.menuItemElement.removeAttribute('data-panel');
      return;
    }

    if (!this.currentPanel || panel.selectionIndex < this.currentPanel.selectionIndex) {
      this.showPanel(panel);
    }
  }
}
