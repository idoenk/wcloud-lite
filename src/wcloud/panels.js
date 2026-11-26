/*!
 * wcloud-lite - Source Input Panels (Copy & Paste, File, Example)
 * Adapted from: https://github.com/timdream/wordcloud/blob/main/assets/panels.js
 *
 * Copyright 2011, 2013-2019 Timothy Guan-tin Chien and other contributors.
 * Modified work Copyright (c) 2026 Idx
 * Released under the MIT license
 */

import { _, __ } from '../timdream/index.js';
import { View } from './views.js';
import { encodeBase64Utf8, normalizeWordListText } from './utils/text-parser.js';

export class PanelView extends View {
  beforeShow() {
    this.menuItemElement.parentElement.classList.add('active');
    this.menuItemElement.classList.add('active');
    this.dialog.selectionElement.selectedIndex = this.selectionIndex;
  }

  afterShow() {
    const el = this.element.querySelector('input, button, select, textarea');
    if (el) {
      el.focus();
    }
  }

  beforeHide() {
    this.menuItemElement.parentElement.classList.remove('active');
    this.menuItemElement.classList.remove('active');
  }
}

export class ExamplePanelView extends PanelView {
  constructor(opts) {
    super();
    this.load(opts, {
      name: 'example',
      element: 'wc-panel-example',
      supportMsgElement: 'wc-panel-example-support-msg',
      wikipediaTermElement: 'example-wikipedia-term',
    });
    this.checked = false;
  }

  beforeShow(...args) {
    super.beforeShow(...args);

    if (this.checked) {
      return;
    }

    if (!this.dialog.app.isFullySupported) {
      this.supportMsgElement.removeAttribute('hidden');
    }

    const firstRadio = this.element.querySelector('[name="example"]');
    if (firstRadio && !this.element.querySelector('[name="example"]:checked')) {
      firstRadio.checked = true;
    }

    this.checked = true;
  }

  submit() {
    const selected = this.element.querySelector('[name="example"]:checked');
    if (!selected) {
      return;
    }

    if (selected.value === 'wikipedia') {
      const term =
        (this.wikipediaTermElement?.value || '').trim() ||
        this.wikipediaTermElement?.placeholder ||
        'Cloud';
      this.dialog.submit(`#wikipedia:${encodeURIComponent(term)}`);
      return;
    }

    this.dialog.submit(`#${selected.value}`);
  }
}

export class CPPanelView extends PanelView {
  constructor(opts) {
    super();
    this.load(opts, {
      name: 'cp',
      element: 'wc-panel-cp',
      textareaElement: 'wc-panel-cp-textarea',
      texttypeElement: 'wc-panel-texttype',
      formatorderElement: 'wc-panel-formatorder',
      separatorElement: 'wc-panel-separator',
    });
  }

  submit() {
    const rawText = this.textareaElement.value;
    if (!rawText.trim().length) {
      return;
    }

    const isWordList = this.texttypeElement.value === 'wordlist';
    let payloadText = rawText;

    if (isWordList) {
      payloadText = normalizeWordListText(
        rawText,
        this.formatorderElement.value,
        this.separatorElement.value
      );
      if (!payloadText) {
        return;
      }
    }

    let submitted = false;
    if (window.btoa) {
      submitted = this.dialog.submit(
        (isWordList ? '#base64-list:' : '#base64:') + encodeBase64Utf8(payloadText)
      );
    } else {
      submitted = this.dialog.submit(
        (isWordList ? '#list:' : '#text:') + encodeURIComponent(payloadText)
      );
    }

    if (!submitted) {
      this.dialog.submit(isWordList ? '#list' : '#text');
    }
  }
}

export class FilePanelView extends PanelView {
  constructor(opts) {
    super();
    this.load(opts, {
      name: 'file',
      element: 'wc-panel-file',
      fileElement: 'wc-panel-file-file',
      fileLabelElement: 'wc-panel-file-file-label',
      encodingElement: 'wc-panel-file-encoding',
      contenttypeElement: 'wc-panel-contenttype',
      formatorderElement: 'wc-panel-file-formatorder',
      separatorElement: 'wc-panel-file-separator',
    });

    if (!this.isSupported) {
      return;
    }

    this.updateLabel(this.fileElement.files.length);
    this.fileElement.addEventListener('change', this);
  }

  handleEvent() {
    this.updateLabel(this.fileElement.files.length);
  }

  updateLabel(count) {
    this.fileLabelElement.setAttribute('data-l10n-args', JSON.stringify({ n: count }));
    __(this.fileLabelElement);
  }

  submit() {
    const el = this.fileElement;
    if (!el.files.length) {
      return;
    }

    const file = el.files[0];
    const isPlainText = file.type === 'text/plain' || (!file.type && /\.txt$/i.test(file.name));
    if (!isPlainText) {
      window.alert(_('plain-text-file-please'));
      return;
    }

    this.dialog.submit('#file');
  }
}

FilePanelView.prototype.isSupported = Boolean(window.FileReader);
