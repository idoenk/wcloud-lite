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

  sourceDialogView.addPanel(new ExamplePanelView());
  // sourceDialogView.addPanel(new LWPanelView());
  sourceDialogView.addPanel(new CPPanelView());
  sourceDialogView.addPanel(new FilePanelView());
  /*
  sourceDialogView.addPanel(new WikipediaPanelView());
  sourceDialogView.addPanel(new FacebookPanelView());
  sourceDialogView.addPanel(new GooglePlusPanelView());
  // sourceDialogView.addPanel(new TwitterPanelView());

  sourceDialogView.addPanel(new FeedPanelView());
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'blogger',
    element: 'wc-panel-blogger',
    inputElement: 'wc-panel-blogger-id',
    template: 'http://%s.blogspot.com/feeds/posts/default'
  }));
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'tumblr',
    element: 'wc-panel-tumblr',
    inputElement: 'wc-panel-tumblr-id',
    template: 'http://%s.tumblr.com/rss'
  }));
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'wordpresscom',
    element: 'wc-panel-wordpresscom',
    inputElement: 'wc-panel-wordpresscom-id',
    template: 'https://%s.wordpress.com/feed/'
  }));
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'pixnet',
    element: 'wc-panel-pixnet',
    inputElement: 'wc-panel-pixnet-id',
    template: 'http://%s.pixnet.net/blog/feed/rss'
  }));
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'wretchcc',
    element: 'wc-panel-wretchcc',
    inputElement: 'wc-panel-wretchcc-id',
    template: 'http://www.wretch.cc/blog/%s&rss20=1'
  }));
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'plurk',
    element: 'wc-panel-plurk',
    inputElement: 'wc-panel-plurk-id',
    template: 'http://www.plurk.com/%s.xml'
  }));
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'twitter',
    element: 'wc-panel-twitter',
    inputElement: 'wc-panel-twitter-id',
    template: 'http://twitter.com/statuses/user_timeline/%s.rss'
  }));
  sourceDialogView.addPanel(new FeedPanelView({
    name: 'yamblog',
    element: 'wc-panel-yamblog',
    inputElement: 'wc-panel-yamblog-id',
    template: 'http://blog.yam.com/rss.php?blog_id=%s&num=1000'
  }));
  */

  // buat dapetin/parse local feeds, eg: detik, kompas, etc
  // app.addFetcher(new LocalFeedFetcher());
  // app.fetchers['localfeeds'].init();


  app.addFetcher(new TextFetcher());
  app.addFetcher(new FileFetcher());
  app.addFetcher(new ListFetcher());
  app.addFetcher(new FeedFetcher());
  app.addFetcher(new COSCUPFetcher());
  app.addFetcher(new WikipediaFetcher());
  // app.addFetcher(new FacebookFetcher());
  // app.addFetcher(new GooglePlusFetcher());
})();
