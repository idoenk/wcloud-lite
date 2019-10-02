'use strict';

var WordCloudApp = function WordCloudApp() {
  // Special code here to handle non-supported browser case.
  if (!((window.WordFreq && window.WordFreq.isSupported) ||
        (window.WordFreqSync && window.WordFreqSync.isSupported)) ||
      !WordCloud.isSupported ||
      !Object.keys ||
      !Array.prototype.map ||
      !Array.prototype.forEach ||
      !Array.prototype.indexOf ||
      !Function.prototype.bind ||
      !('onhashchange' in window)) {
    window.onload = function wca_browserDisabled() {
      var view = document.getElementById('wc-browser-support');
      try {
        delete view.hidden;
      } catch (e) {}
      if (view.removeAttribute) {
        view.removeAttribute('hidden');
      }
    };
    this.isSupported = false;
    this.logAction('WordCloudApp::isSupported::false');

    return;
  }
  // show activity in console log
  this.DEBUG_LOG = ("undefined" != typeof _DEBUG_ && _DEBUG_);

  this.isSupported = true;
  this.logAction('WordCloudApp::isSupported::true');

  this.isFullySupported = (function checkFullySupport() {
    if (!FilePanelView.prototype.isSupported)
      return false;

    // Check for real canvas.toBlob() method.
    if (window.HTMLCanvasElement.prototype.toBlob)
      return true;

    // If not, see if we should shim it.
    var hasBlobConstructor = window.Blob && (function tryBlob() {
      try {
        return Boolean(new Blob());
      } catch (e) {
        return false;
      }
    }());
    var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder ||
      window.MozBlobBuilder || window.MSBlobBuilder;

    return !!((hasBlobConstructor || BlobBuilder) && window.atob &&
      window.ArrayBuffer && window.Uint8Array);
  })();

  this.logAction('WordCloudApp::isFullySupported::' + this.isFullySupported);

  window.addEventListener('load', this);

  this.fetchers = {};
  this.views = {};
  this.currentUIState = this.UI_STATE_LOADING;

  // This array decides which view to show() when the UI state changes.
  this.UIStateViewMap = [
    ['loading'],
    ['canvas', 'source-dialog'],
    ['loading', 'dashboard'],
    ['canvas', 'dashboard'],
    ['canvas', 'dashboard', 'list-dialog'],
    ['loading', 'dashboard'],
    ['canvas', 'dashboard', 'sharer-dialog'],
    ['canvas', 'about-dialog'],
    ['canvas', 'option-dialog']
  ];

  this.wordfreqOption = {
    // workerUrl: './assets/wordfreq/src/wordfreq.worker.js?_=@@timestamp'
    workerUrl: ASSET_WCLOUD_URI+'wordfreq/src/wordfreq.worker.js?_=@@timestamp'
  };

  this.shapes = [
    { shape: 'circle' },
    {
      shape: function shapeSquare(theta) {
        var thetaPrime = (theta + Math.PI / 4) % (2 * Math.PI / 4);
        return 1 / (Math.cos(thetaPrime) + Math.sin(thetaPrime));
      }
    },
    { shape: 'triangle-forward',
      ellipticity: 1 },
    { shape: 'star',
      ellipticity: 1 },
    { shape: 'pentagon',
      ellipticity: 1 },
    { shape: 'love',
      ellipticity: 1 }
  ];

  var sansSerifFonts = '"Trebuchet MS", Arial, sans-serif';

  // http://ethantw.net/projects/lab/css-reset/
  var serifFonts = '"Libre Baskerville", "Times New Roman", serif';

  var randomColorGenerator = function randomColorGenerator(colors) {
    return (function getRandomColor() {
      return colors[Math.floor(Math.random() * colors.length)];
    });
  };

  this.themes = [
    {
      fontFamily: serifFonts,
      // Sublime Text 2 colors
      colorset: ['#66d9ef', '#a6e22d', '#fd9720', '#a6e22a','#a581ff', '#f92772'],
      // color: randomColorGenerator(['#66d9ef', '#a6e22d', '#fd9720', '#a6e22a','#a581ff', '#f92772']),
      backgroundColor: '#272822'
    },
    {
      fontFamily: sansSerifFonts,
      // http://colorschemedesigner.com/#3o51Ay9OG-dM6
      colorset: ['#07ABDA', '#63D6F6', '#0F7BDC', '#69B4F7',
                '#00DBB6', '#376F65'],
      // color: randomColorGenerator(['#07ABDA', '#63D6F6', '#0F7BDC', '#69B4F7',
      //                             '#00DBB6', '#376F65', '#004438', '#5FF7DD']),
      backgroundColor: '#004438'
    },
    {
      fontFamily: serifFonts,
      // http://colorschemedesigner.com/#3P12ps0JkrdYC
      colorset: ['#2F55D1', '#4058A5', '#133193', '#98AFFD'],
      // color: randomColorGenerator(['#2F55D1', '#4058A5', '#133193', '#98AFFD']),
      backgroundColor: '#e3e9fd'
    },
    {
      fontFamily: sansSerifFonts,
      // http://colorschemedesigner.com/#0052fMBoqHVtk
      colorset: ['#c30000', '#c37a00', '#650281',
                 '#de3333', '#de5c5c', '#7e602c',
                 '#633e00', '#481e53'],
      // color: randomColorGenerator(['#c30000', '#c37a00', '#650281',
      //                              '#de3333', '#de5c5c', '#7e602c',
      //                              '#633e00', '#481e53']),
      backgroundColor: '#edd1a4'
    },
    {
      fontFamily: sansSerifFonts,
      colorset: false,
      color: function getRandomDarkColor() {
        return 'rgb(' +
          Math.floor(Math.random() * 128 + 48).toString(10) + ',' +
          Math.floor(Math.random() * 128 + 48).toString(10) + ',' +
          Math.floor(Math.random() * 128 + 48).toString(10) + ')';
      },
      backgroundColor: '#eee'
    },
    {
      fontFamily: serifFonts,
      colorset: false,
      color: 'random-light',
      backgroundColor: '#000'
    },
    {
      fontFamily: serifFonts,
      // http://colorschemedesigner.com/#0c31R3Wd1wyfM
      colorset: ['#979E8F', '#575d51', '#3a3f42', '#42361d'],
      // color: randomColorGenerator(['#3a3f42', '#575d51', '#42361d']),
      backgroundColor: '#8d8380'
    },
    {
      fontFamily: serifFonts,
      // http://colorschemedesigner.com/#3M42q7muY.l1e
      colorset: ['#f0f4bc', '#f7e4be', '#9a80a4', '#848da6'],
      // color: randomColorGenerator(['#f7e4be', '#f0f4bc', '#9a80a4', '#848da6']),
      backgroundColor: '#223564'
    },
    {
      fontFamily: serifFonts,
      colorset: '#d0d0d0',
      // color: '#d0d0d0',
      backgroundColor: '#999'
    },
    {
      fontFamily: sansSerifFonts,
      colorset: 'rgba(255,255,255,0.8)',
      // color: 'rgba(255,255,255,0.8)',
      backgroundColor: '#353130'
    },
    {
      fontFamily: sansSerifFonts,
      colorset: 'rgba(0,0,0,0.7)',
      // color: 'rgba(0,0,0,0.7)',
      backgroundColor: 'rgba(255, 255, 255, 1)' //opaque white
    }
  ];

  for(var i=0; i<this.themes.length; i++){
    if("undefined" == typeof this.themes[i].color){
      if(typeof this.themes[i].colorset == 'string')
        this.themes[i].color = this.themes[i].colorset;
      else if(typeof this.themes[i].colorset != 'function' && this.themes[i].colorset)
        this.themes[i].color = randomColorGenerator(this.themes[i].colorset);
    }
  }

  this.data = {
    theme: 0,
    shape: 0,
    gridSize: undefined,
    weightFactor: undefined
  };
  this.data.custom_themeIndex = this.themes.length;
  this.themes.push({});


  // text, [fonts]
  this.fontsets = [
    ["Arial", '"Trebuchet MS", "Arial Unicode MS"'],
    ["Liberation Serif", '"Liberation Serif"'],
    ["Times New Roman", '"Libre Baskerville", "Times New Roman"'],
    ["Open Sans", '"Open Sans","sans-serif"'],
    ["Candara", 'Candara'],
    ["Verdana", 'Verdana'],
    ["Impact", 'Impact'],
    ["Droid", '"Droid Sans"'],
    ["FingerPaint", 'FingerPaint'],
    ["JollyLodger", 'JollyLodger'],
    ["Ubuntu", 'Ubuntu'],
    ["Lobster", 'Lobster'],
    ["Chlorinar Turtles", 'Chlorinar'],
    ["Comic Sans", 'LDFComicSans']
  ];
  this.pushFonts();
};
WordCloudApp.prototype.addView = function wca_addView(view) {
  this.views[view.name] = view;
  view.app = this;
};
WordCloudApp.prototype.addFetcher = function wca_addFetcher(fetcher) {
  fetcher.types.forEach((function(type) {
    this.fetchers[type] = fetcher;
  }).bind(this));
  fetcher.app = this;
};
WordCloudApp.prototype.pushUrlHash = function wca_pushUrlHash(hash) {
  if (hash === window.location.hash) {
    // Simply ask to re-reute the same hash we have here
    // without creating a new history stack.
    this.route();

    return true;
  }

  // This two flags are introduced so that when [Back] button
  // of the dashboard is pressed, reset() can actually go back one step
  // in the browser history instead of always pushing a new url hash.
  // This is not bullet-proof, unfortunately.
  this.backToReset = !window.location.hash.substr(1);
  this.lastUrlHashChangePushedByScript = true;

  // If the hash exceeds URL length limit set by IE,
  // we will catch an error here.
  try {
    window.location.hash = hash;
  } catch (e) {
    return false;
  }
  return true;
};
WordCloudApp.prototype.reset = function wca_reset() {
  if (!window.location.hash.substr(1))
    return;

  if (this.backToReset) {
    // Go back
    window.history.back();
  } else {
    // Stack a new entry into history stack
    this.pushUrlHash('');
  }
};
WordCloudApp.prototype.UI_STATE_LOADING = 0;
WordCloudApp.prototype.UI_STATE_SOURCE_DIALOG = 1;
WordCloudApp.prototype.UI_STATE_WORKING = 2;
WordCloudApp.prototype.UI_STATE_DASHBOARD = 3;
WordCloudApp.prototype.UI_STATE_LIST_DIALOG = 4;
WordCloudApp.prototype.UI_STATE_ERROR_WITH_DASHBOARD = 5;
WordCloudApp.prototype.UI_STATE_SHARER_DIALOG = 6;
WordCloudApp.prototype.UI_STATE_ABOUT_DIALOG = 7;
WordCloudApp.prototype.UI_STATE_OPTION_DIALOG = 8;
WordCloudApp.prototype.switchUIState = function wca_switchUIState(state) {
  if (!this.UIStateViewMap[state])
    throw 'Undefined state ' + state;

  if (document.activeElement &&
      document.activeElement !== document.body) {
    document.activeElement.blur();
  }

  var UIs = Object.keys(this.views);
  var currentUIState = this.currentUIState;
  UIs.forEach((function showOrHide(viewName) {
    this.views[viewName][
      (this.UIStateViewMap[state].indexOf(viewName) !== -1) ?
      'show' : 'hide'](currentUIState, state);
  }).bind(this));

  this.currentUIState = state;
};
WordCloudApp.prototype.handleData = function wca_handleData(text, title) {
  this.logAction('WordCloudApp::handleData', title + ' (' + text.length + ')');

  if (!text.length) {
    this.switchUIState(this.UI_STATE_ERROR_WITH_DASHBOARD);
    this.views.loading.updateLabel(
      this.views.loading.LABEL_ERROR_DATA);
    return;
  }

  this.currentFetcher = undefined;
  this.views.loading.updateLabel(
    this.views.loading.LABEL_ANALYZING);

  this.data.title = title;

  var volume;
  if (WordFreq) {
    this.wordfreq =
      WordFreq(this.wordfreqOption).process(text)
      .getVolume(function gotVolume(vol) {
        volume = vol;
      }).getList((function gotList(list) {
        this.wordfreq = undefined;
        this.handleList(list, volume);
      }).bind(this));
  } else {
    // Use WordFreqSync.
    // Use setTimeout to leave this function loop first.
    this.wordfreq = setTimeout((function runWordFreqSync() {
      var wordfreqsync = WordFreqSync(this.wordfreqOption);
      var list = wordfreqsync.process(text);
      var volume = wordfreqsync.getVolume();

      this.wordfreq = undefined;
      this.handleList(list, volume);
    }).bind(this));
  }
};
WordCloudApp.prototype.stopHandleData = function wca_stopHandleData() {
  if (!this.wordfreq)
    return;

  // Stop any current WordFreq async operation,
  // or the timer that would invoke WordFreqSync.
  if (typeof this.wordfreq === 'object') {
    this.wordfreq.stop(false);
  } else {
    clearTimeout(this.wordfreq);
  }
  this.wordfreq = undefined;
};
WordCloudApp.prototype.handleList = function wca_handleList(list, vol) {
  this.logAction('WordCloudApp::handleList', list.length);
  this.logAction('WordCloudApp::handleList vol=', vol);

  if (!list.length) {
    this.switchUIState(this.UI_STATE_ERROR_WITH_DASHBOARD);
    this.views.loading.updateLabel(
      this.views.loading.LABEL_ERROR_LIST);
    return;
  }

  this.switchUIState(this.UI_STATE_DASHBOARD);

  this.data.list = list;
  this.logAction('WordCloudApp::handleList list=');
  console.log(list);

  if( "undefined" == typeof this.data.gridSize)
    this.data.gridSize = 5;


  // this.data.theme = Math.floor(Math.random() * this.themes.length);
  this.calculateWeightFactor(vol);

  this.draw();
};
WordCloudApp.prototype.draw = function wca_draw() {
  var canvasView = this.views.canvas;
  canvasView.setDimension();
  
  // early rewrite localstorage when in dashboard panel
  if( this.dashboardEvent )
    this.setStorage();

  canvasView.draw( this.getWordCloudOption() );
  this.setStorage();

  var parsedHash = this.parseHash();
  this.logAction('WordCloudApp::draw::' + parsedHash[0],
                  parsedHash[1].substr(0, 128));
};
WordCloudApp.prototype.getCanvasElement = function wcp_getCanvasElement() {
  return this.views['canvas'].canvasElement;
};
WordCloudApp.prototype.calculateWeightFactor =
  function wca_calculateWeightFactor(vol) {
    var width = this.views.canvas.documentWidth;
    var height = this.views.canvas.documentHeight;
    this.data.weightFactor = Math.sqrt(width * height / vol);

    // set this as the lower bound of resizing font
    this.data.unitweightFactor = (this.data.weightFactor/3);
  };
WordCloudApp.prototype.getWordCloudOption = function wca_getWordCloudOption() {
  var option = { };
  var themeKeys;
  var dataKeys = Object.keys(this.data);
  dataKeys.forEach((function copyThemeValues(key) {
    option[key] = this.data[key];
  }).bind(this));

  // intercept localstorage Options 
  var dataLSOptions = this.getStorageOptions();
  console.log(dataLSOptions);
  if( "undefined" != typeof dataLSOptions.theme && !isNaN(dataLSOptions.theme) )
    this.data.theme = parseInt(dataLSOptions.theme);


  if( this.data.theme !== this.data.custom_themeIndex ){

    themeKeys = Object.keys(this.themes[this.data.theme]);
    themeKeys.forEach((function copyThemeValues(key) {
      option[key] = this.themes[this.data.theme][key];
    }).bind(this));

    if( dataLSOptions.directFont )
      option["directFont"] = dataLSOptions.directFont;
  }
  else{
    
    var randomColorGenerator = function randomColorGenerator(colors) {
      return (function getRandomColor() {
        return colors[Math.floor(Math.random() * colors.length)];
      });
    };
    
    var custom_themeIndex = this.data.custom_themeIndex;
    if( "undefined" == typeof this.data.custom )
      this.data.custom = dataLSOptions.custom;

    this.themes[custom_themeIndex] = this.data.custom;

    themeKeys = Object.keys(this.themes[custom_themeIndex]);
    themeKeys.forEach((function copyThemeValues(key) {
      option[key] = this.themes[custom_themeIndex][key];
    }).bind(this));
  }


  if( "undefined" != typeof dataLSOptions.shape )
    this.data.shape = parseInt(dataLSOptions.shape);

  var shapeKeys = Object.keys(this.shapes[this.data.shape]);
  shapeKeys.forEach((function copyThemeValues(key) {
    option[key] = this.shapes[this.data.shape][key];
  }).bind(this));


  // Manual injection
  if( "undefined" != typeof dataLSOptions.skewNormalize )
    this.data.skewNormalize  = option['skewNormalize'] = dataLSOptions.skewNormalize;

  if( "undefined" != typeof dataLSOptions.skewnessTreshold )
    this.data.skewnessTreshold  = option['skewnessTreshold'] = parseFloat(dataLSOptions.skewnessTreshold);


  return option;
};
WordCloudApp.prototype.getStorageOptions = function wca_getStorageOptions(){
  var SO = new StoreOptions();
  var oo = SO.get('storeoptions');
  return (oo && typeof oo === 'string'  ? JSON.parse(oo) : oo);
};
WordCloudApp.prototype.setStorage = function wca_setStorageOptions(){
  var SO = new StoreOptions();
  var options_={}, appdata = this.data;
  var excludefields = ['title','list'];
  options_ = this.getStorageOptions();

  for(var field in appdata){
    if("string" == typeof field && excludefields.indexOf(field) === -1 ){
      options_[field] = appdata[field];
    }
    else{
      // PASSS....
      if( this.DEBUG_LOG )
        console.log('passing field='+field);
    }
  }
  if( appdata['custom'] )
    options_['custom'] = appdata['custom'];

  if( this.DEBUG_LOG ){
    console.log('SO.set=');
    console.log(options_);
  }
  SO.set('storeoptions', options_);
};


WordCloudApp.prototype.tooglePanel = function wca_tooglePanel(flag){
  var $wcdashboard = $('#wc-dashboard');
  if( !flag ){
    $wcdashboard.find('.navbar').addClass('hide');
    $wcdashboard.find('.wrap-toogleside').removeClass('hide');
  }
  else{
    $wcdashboard.find('.navbar').removeClass('hide');
    $wcdashboard.find('.wrap-toogleside').addClass('hide');
  }
};
WordCloudApp.prototype.reposPanel = function wca_reposPanel(position){
  if("undefined" == typeof position)
    position = (this.data.panelpos ? this.data.panelpos : 'fixed-bottom-left');

  $('#wc-dashboard')
    .removeClass('fixed-top fixed-bottom-left fixed-bottom')
    .addClass( position );

  if( this.data.panelpos != 'fixed-top' )
    $('#btn-pickfont').closest('.btn-group').addClass('dropup');
  else
    $('#btn-pickfont').closest('.btn-group').removeClass('dropup');
};
WordCloudApp.prototype.pushFonts = function wca_pushFonts(){
  // build fonts set
  var $target, tplthemes = '';
  for(var f=0; f<this.fontsets.length; f++)
    tplthemes+= '<option value=\''+this.fontsets[f][1]+'\'>'+this.fontsets[f][0]+'</option>';
  $('#font-custom').html( tplthemes );

  // font for dashboard menus
  tplthemes = '';
  $target = $('#dashboard-dropdown-fonts');
  if( $target.length ){
    for(var f=0; f<this.fontsets.length; f++)
      tplthemes += '<li><a href="javascript:;" data-action="swfont" data-font=\''+this.fontsets[f][1]+'\'>'+this.fontsets[f][0]+'</a></li>';
    $target.html( tplthemes );
  }
};




WordCloudApp.prototype.getWordCloudOption_OLD = function wca_getWordCloudOption() {
  var option = { };

  if( this.DEBUG_LOG ){
    console.log('data=');
    console.log(this.data);
  }
  var dataKeys = Object.keys(this.data);
  dataKeys.forEach((function copyThemeValues(key) {
    option[key] = this.data[key];
  }).bind(this));

  var themeKeys = Object.keys(this.themes[this.data.theme]);
  themeKeys.forEach((function copyThemeValues(key) {
    option[key] = this.themes[this.data.theme][key];
  }).bind(this));

  var shapeKeys = Object.keys(this.shapes[this.data.shape]);
  shapeKeys.forEach((function copyThemeValues(key) {
    option[key] = this.shapes[this.data.shape][key];
  }).bind(this));
  if( this.DEBUG_LOG )
    console.log(option);

  return option;
};
WordCloudApp.prototype.showSharer = function wca_showSharer() {
  this.switchUIState(this.UI_STATE_SHARER_DIALOG);
};
WordCloudApp.prototype.route = function wca_route() {
  var hash = window.location.hash.substr(1);

  if (this.backToReset && !this.lastUrlHashChangePushedByScript)
    this.backToReset = false;

  this.lastUrlHashChangePushedByScript = false;

  // Stop any current fetcher async operation
  if (this.currentFetcher) {
    this.currentFetcher.stop();
    this.currentFetcher = undefined;
  }

  this.stopHandleData();

  if (!hash) {
    this.switchUIState(this.UI_STATE_SOURCE_DIALOG);
    this.logAction('WordCloudApp::route::source-dialog');

    return;
  }

  var parsedHash = this.parseHash();
  var dataType = parsedHash[0];
  var data = parsedHash[1];
  parsedHash = undefined;

  this.logAction('WordCloudApp::route::' + dataType, data.substr(0, 128));

  var fetcherType = (dataType.indexOf('.') === -1) ?
    dataType : dataType.split('.')[0];

  if (fetcherType in this.fetchers) {
    this.switchUIState(this.UI_STATE_WORKING);
    var fetcher = this.currentFetcher = this.fetchers[fetcherType];
    this.views.loading.updateLabel(fetcher.LABEL_VERB);
    fetcher.getData(dataType, data);
  } else {
    // Can't handle such data. Reset the URL hash.
    this.reset();
  }
};
WordCloudApp.prototype.logAction = function wca_logAction(action, label, val) {
  if( this.DEBUG_LOG )
    console.log(action+(label?'; '+label:'') + (val ? '; '+val:''));

  if (!window._gaq)
    return;

  var msgs = ['_trackEvent', 'Word Cloud'];
  if (action !== undefined) {
    msgs.push(action.toString());
    if (label !== undefined) {
      msgs.push(label.toString());
      if (val !== undefined) {
        msgs.push(parseFloat(val, 10));
      }
    }
  }
  window._gaq.push(msgs);
};
WordCloudApp.prototype.parseHash = function wca_parseHash() {
  var hash = window.location.hash.substr(1);
  var dataType, data;
  hash.match(/^([^:]+):?(.*)$/).forEach(function matchHash(str, i) {
    switch (i) {
      case 1:
        dataType = str;
        break;

      case 2:
        data = str;
        break;
    }
  });

  return [dataType, data];
};
WordCloudApp.prototype.handleEvent = function wca_handleEvent(evt) {
  switch (evt.type) {
    case 'load':
      // Remove the load listener
      window.removeEventListener('load', this);

      // Start listening to hashchange
      window.addEventListener('hashchange', this);
      // Process the current hash
      this.route();
      break;

    case 'hashchange':
      this.route();
      break;
  }
};
WordCloudApp.prototype.uninit = function wca_uninit() {
  window.removeEventListener('load', this);
  window.removeEventListener('hashchange', this);
};


var FacebookSDKLoader = function FacebookSDKLoader() {
  if (!FACEBOOK_APP_ID)
    throw 'No FACEBOOK_APP_ID defined.';

  this.loaded = false;
};
FacebookSDKLoader.prototype.load = function fsl_load(callback) {
  if (this.loaded)
    throw 'FacebookSDKLoader shouldn\'t be reused.';
  this.loaded = true;

  // If API is already available, run the callback synchronizely.
  if (window.FB) {
    callback();
    return;
  }

  // If there is already a fbAsyncInit(), we should wrap it.
  if (window.fbAsyncInit) {
    var originalFbAsyncInit = window.fbAsyncInit;
    window.fbAsyncInit = (function fbpv_fbAsyncInit() {
      window.fbAsyncInit = null;

      originalFbAsyncInit();
      callback();
    }).bind(this);

    return;
  }

  // Insert fb-root
  var el = document.createElement('div');
  el.id = 'fb-root';
  document.body.insertBefore(el, document.body.firstChild);

  // Load the SDK Asynchronously
  (function loadFacebookSDK(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = '//connect.facebook.net/en_US/all.js';
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
  var channelUrl = window.FACEBOOK_CHANNEL_URL ||
    document.location.href.replace(/\/(index.html)?(#.*)?$/i,
                                   '/facebook-channel.html');

  window.fbAsyncInit = function fbpv_fbAsyncInit() {
    window.fbAsyncInit = null;

    FB.init({
      appId: FACEBOOK_APP_ID,
      channelUrl: channelUrl
    });

    callback();
  };
};


var StoreOptions = function StoreOptions(){
  this.cache = null;
};
StoreOptions.prototype.get = function sto_get(name){
  return store.get(name);
};
StoreOptions.prototype.set = function sto_get(name, value){
  store.set(name, value);
};
