'use strict';

// start.js start the world. It is not be covered in the tests.
(function start() {
  // shortcut for document.webL10n.translate
  if (window.__ === undefined) {
    window.__ = document.webL10n.translate;
  }

  // Depend on the browser support, one of these shouldn't exist,
  // at least on the main event loop.
  if (WordFreq.isSupported) {
    WordFreqSync = null;
  } else {
    WordFreq = null;
  }

  // Start the app.
  var app = new WordCloudApp();
  if (!app.isSupported)
    return;

  var langSwitcherView = new LanguageSwitcherView();
  langSwitcherView.app = app;

  // var snsPushView = new SNSPushView();
  // snsPushView.show();

  app.addView(new CanvasView());
  app.addView(new LoadingView());
  app.addView(new DashboardView());
  app.addView(new ListDialogView());
  app.addView(new SharerDialogView());
  app.addView(new AboutDialogView());
  app.addView(new OptionDialogView());

  var sourceDialogView = new SourceDialogView();
  app.addView(sourceDialogView);

  // First added will be selected
  sourceDialogView.addPanel(new CPPanelView());
  sourceDialogView.addPanel(new FilePanelView());
  sourceDialogView.addPanel(new ExamplePanelView());


  // buat dapetin/parse local feeds, eg: detik, kompas, etc
  // app.addFetcher(new LocalFeedFetcher());
  // app.fetchers['localfeeds'].init();

  app.addFetcher(new TextFetcher());
  app.addFetcher(new FileFetcher());
  app.addFetcher(new ListFetcher());
  app.addFetcher(new FeedFetcher());
  app.addFetcher(new COSCUPFetcher());
  app.addFetcher(new WikipediaFetcher());
})();
