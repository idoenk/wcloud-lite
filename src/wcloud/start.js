/*!
 * wcloud-lite - Application Bootstrap
 * Adapted from: https://github.com/timdream/wordcloud/blob/main/assets/start.js
 *
 * Copyright 2011, 2013-2019 Timothy Guan-tin Chien and other contributors.
 * Modified work Copyright (c) 2026 Idx
 * Released under the MIT license
 */

import { WordFreq, __ } from '../timdream/index.js';
import { WordCloudApp } from './app.js';
import {
  AboutDialogView,
  LanguageSwitcherView,
  ListDialogView,
  LoadingView,
  OptionDialogView,
  installEscapeModalHandler,
} from './views.js';
import { CanvasView } from './canvas-view.js';
import { SourceDialogView } from './source-dialog-view.js';
import { DashboardView } from './dashboard-view.js';
import { CPPanelView, ExamplePanelView, FilePanelView } from './panels.js';
import { FileFetcher, ListFetcher, TextFetcher, WikipediaFetcher } from './fetchers.js';

export function startApp() {
  if (window.__ === undefined) {
    window.__ = __;
  }

  // Only keep sync worker fallback when Web Workers are unsupported.
  if (WordFreq && WordFreq.isSupported && 'WordFreqSync' in window) {
    // Keep WordFreqSync available if a runtime falls back (e.g. restricted worker contexts).
  }

  const app = new WordCloudApp();
  if (!app.isSupported) {
    return null;
  }

  const langSwitcherView = new LanguageSwitcherView();
  langSwitcherView.app = app;

  app.addView(new CanvasView());
  app.addView(new LoadingView());
  app.addView(new DashboardView());
  app.addView(new ListDialogView());
  app.addView(new AboutDialogView());
  app.addView(new OptionDialogView());

  const sourceDialogView = new SourceDialogView();
  app.addView(sourceDialogView);

  // First added panel is selected by default
  sourceDialogView.addPanel(new CPPanelView());
  sourceDialogView.addPanel(new FilePanelView());
  sourceDialogView.addPanel(new ExamplePanelView());

  // Active fetchers only (Google+, COSCUP, Facebook, LocalFeed, Feed removed)
  app.addFetcher(new TextFetcher());
  app.addFetcher(new FileFetcher());
  app.addFetcher(new ListFetcher());
  app.addFetcher(new WikipediaFetcher());

  installEscapeModalHandler();

  return app;
}
