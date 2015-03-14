'use strict';

var Fetcher = function Fetcher() { };
Fetcher.prototype.LABEL_VERB = LoadingView.prototype.LABEL_LOADING;
Fetcher.prototype.normWeight = function fc_normWeight(iword, weight, wordlength){
  var M_PI  = 3.14159265358979323846; // pi
  var settings = this.app.data;
  var tresh_sbx = -(M_PI / 1.1);
  var radVal = ( ((M_PI/2) + tresh_sbx) * iword) / wordlength;

  var tresh_arb_max = .5;
  var tresh_arb_skew = (settings.skewnessTreshold ? parseFloat(settings.skewnessTreshold) : .5);
  var cosRad = Math.cos(radVal) / ( Math.sqrt(iword+1) / Math.pow((iword+1)*tresh_arb_max, tresh_arb_skew) );
  return (weight * cosRad);
};

var TextFetcher = function TextFetcher() {
  this.types = ['text', 'base64'];
};
TextFetcher.prototype = new Fetcher();
TextFetcher.prototype.stop = function tf_stop() {
  clearTimeout(this.timer);
};
TextFetcher.prototype.getData = function tf_getData(dataType, data) {
  if (dataType === 'text' && !data) {
    data = this.app.views['source-dialog'].panels['cp'].textareaElement.value;
  } else if (dataType === 'base64') {
    data = decodeURIComponent(escape(window.atob(data)));
  } else {
    data = decodeURIComponent(data);
  }

  // Make sure we call the handler methods as async callback.
  this.timer = setTimeout((function tf_gotData() {
    this.app.handleData(data, 'Custom TextData');
  }).bind(this), 0);
};

var FileFetcher = function FileFetcher() {
  this.types = ['file'];
};
FileFetcher.prototype = new Fetcher();
FileFetcher.prototype.stop = function ff_stop() {
  if (!this.reader)
    return;

  this.reader.abort();
  this.reader = null;
};
FileFetcher.prototype.getData = function ff_getData(dataType, data) {
  var filePanelView = this.app.views['source-dialog'].panels['file'];
  var fileElement = filePanelView.fileElement;
  if (!fileElement.files.length) {
    this.app.reset();
    this.app.views['source-dialog'].showPanel(filePanelView);
    return;
  }

  var file = fileElement.files[0];
  var reader = this.reader = new FileReader();
  reader.onloadend = (function fr_loadend(evt) {
    if (reader !== this.reader)
      return; // aborted

    var hash, text = reader.result;
    
    if( filePanelView.contenttypeElement.value == 'wordlist' ){
      // normalize values to be come: <FREQ><TAB><WORD>
      var elorder = filePanelView.formatorderElement;
      var elseparator = filePanelView.separatorElement;
      var parts, lines = [];
      var map_separator = {
        sep_colon: ":",
        sep_tab: "\t",
        sep_comma: ",",
        sep_semicolon: ";",
        sep_pipe: "|",
        sep_space: " "
      }, tmptext = '';

      if( "undefined" == typeof map_separator[elseparator.value] ){
        // unknown separator
        return;
      }
      
      lines = text.split("\n");
      if( elorder.value == 'wordfreq' ){
        for(var i=0; i<lines.length; i++){
          parts = lines[i].split( map_separator[elseparator.value] );
          tmptext += parts[1]+"\t"+parts[0]+"\n";
        }
      }
      else{
        if( elseparator.value != "sep_tab" ){
          for(var i=0; i<lines.length; i++){
            parts = lines[i].split( map_separator[elseparator.value] );
            tmptext += parts[0]+"\t"+parts[1]+"\n";
          }
        }
        else
          tmptext = text;
      }
      text = tmptext;


      if (window.btoa) {
        // Protect the encoded string with base64 to workaround Safari bug,
        // which improve sharability of the URL.
        hash = '#base64-list:' +
          window.btoa(unescape(encodeURIComponent(text)));
      } else {
        hash = '#list:' + encodeURIComponent(text);
      }
      var hashPushed = this.app.pushUrlHash(hash);
      if (!hashPushed) {
        // The hash is too long and is being rejected in IE.
        // let's use the short hash instead.
        this.app.pushUrlHash('#list');
      }
    }
    else
      this.app.handleData(text);
  }).bind(this);
  reader.readAsText(file, filePanelView.encodingElement.value || 'UTF-8');
};

var ListFetcher = function ListFetcher() {
  this.types = ['list', 'base64-list'];
};
ListFetcher.prototype = new Fetcher();
ListFetcher.prototype.stop = function lf_stop() {
  clearTimeout(this.timer);
};
ListFetcher.prototype.getData = function lf_getData(dataType, data) {
  var text;
  if (dataType === 'list' && !data) {
    text = this.app.views['list-dialog'].textElement.value;
  } else if (dataType === 'base64-list') {
    text = decodeURIComponent(escape(window.atob(data)));
  } else {
    text = decodeURIComponent(data);
  }
  var textlist = text.split('\n');
  var settings = this.app.data;

  var vol = 0;
  var iword = 0;
  var list = [];
  var that = this;

  /*
  var normWeight = function wca_normWeight(iword, weight, wordlength){
    const M_PI  = 3.14159265358979323846; // pi
    var tresh_sbx = -(M_PI / 1.1);
    var radVal = ( ((M_PI/2) + tresh_sbx) * iword) / wordlength;

    var tresh_arb_max = .5;
    var tresh_arb_skew = (settings.skewnessTreshold ? parseFloat(settings.skewnessTreshold) : .5);
    var cosRad = Math.cos(radVal) / ( Math.sqrt(iword+1) / Math.pow((iword+1)*tresh_arb_max, tresh_arb_skew) );
    return (weight * cosRad);
  };
  */

  textlist.forEach(function eachItem(line) {
    var item = line.split('\t').reverse();

    if( settings.skewNormalize )
      item[1] = that.normWeight(iword, item[1], textlist.length);

    if (!line || !item[0] || !item[1])
      return;

    item[1] = parseInt(item[1], 10);
    if (isNaN(item[1]))
      return;

    vol += item[0].length * item[1] * item[1];
    list.push(item);
    iword++;
  });

  // Make sure we call the handler methods as async callback.
  this.timer = setTimeout((function bf_gotData() {
    this.app.handleList(list, vol);
  }).bind(this), 0);
};

var JSONPFetcher = function JSONPFetcher() {};
JSONPFetcher.prototype = new Fetcher();
JSONPFetcher.prototype.LABEL_VERB = LoadingView.prototype.LABEL_DOWNLOADING;
JSONPFetcher.prototype.CALLBACK_PREFIX = 'JSONPCallbackX';
JSONPFetcher.prototype.TIMEOUT = 30 * 1000;
JSONPFetcher.prototype.reset =
JSONPFetcher.prototype.stop = function jpf_stop() {
  this.currentRequest = undefined;
  clearTimeout(this.timer);
};
JSONPFetcher.prototype.handleEvent = function jpf_handleEvent(evt) {
  var el = evt.target;
  window[el.getAttribute('data-callback-name')] = undefined;
  this.currentRequest = undefined;
  clearTimeout(this.timer);

  el.parentNode.removeChild(el);

  if (evt.type === 'error') {
    this.handleResponse();
  }
};
JSONPFetcher.prototype.getNewCallback = function jpf_getNewCallback() {
  // Create a unique callback name for this request.
  var callbackName = this.CALLBACK_PREFIX +
    Math.random().toString(36).substr(2, 8).toUpperCase();

  // Install the callback
  window[callbackName] = (function jpf_callback() {
    // Ignore any response that is not coming from the currentRequest.
    if (this.currentRequest !== callbackName)
      return;
    this.currentRequest = undefined;
    clearTimeout(this.timer);

    // send the callback name and the data back
    this.handleResponse.apply(this, arguments);
  }).bind(this);

  return callbackName;
};
JSONPFetcher.prototype.requestData = function jpf_requestJSONData(url) {
  var callbackName = this.currentRequest = this.getNewCallback();

  url += (url.indexOf('?') === -1) ? '?' : '&';
  url += 'callback=' + callbackName;

  var el = this.scriptElement = document.createElement('script');
  el.src = url;
  el.setAttribute('data-callback-name', callbackName);
  el.addEventListener('load', this);
  el.addEventListener('error', this);

  document.documentElement.firstElementChild.appendChild(el);

  clearTimeout(this.timer);
  this.timer = setTimeout(function jpf_timeout() {
    window[callbackName]();
  }, this.TIMEOUT);
};

var FeedFetcher = function FeedFetcher() {
  this.types = ['rss', 'feed'];

  this.params = [
    ['v', '1.0'],
    ['scoring', this.FEED_API_SCORING],
    ['num', this.FEED_API_NUM]
  ];
};
FeedFetcher.prototype = new JSONPFetcher();
FeedFetcher.prototype.FEED_API_LOAD_URL =
  'https://ajax.googleapis.com/ajax/services/feed/load';
FeedFetcher.prototype.FEED_API_CALLBACK_PREFIX = 'FeedFetcherCallback';
FeedFetcher.prototype.FEED_API_NUM = '-1';
FeedFetcher.prototype.FEED_API_SCORING = 'h';
FeedFetcher.prototype.ENTRY_REGEXP =
  /<[^>]+?>|\(.+?\.\.\.\)|\&\w+\;|<script.+?\/script\>/ig;
FeedFetcher.prototype.getData = function rf_getData(dataType, data) {
  var params = [].concat(this.params);

  params.push(['q', data]);
  params.push(['context', 'ctx']);

  var url = this.FEED_API_LOAD_URL + '?' + params.map(function kv(param) {
    return param[0] + '=' + encodeURIComponent(param[1]);
  }).join('&');

  this.requestData(url);

};
FeedFetcher.prototype.handleResponse = function rf_handleResponse(contextValue,
                                                                 responseObject,
                                                                 responseStatus,
                                                                 errorDetails) {
  // Return empty text if we couldn't get the data.
  if (!contextValue || responseStatus !== 200) {
    this.app.handleData('');
    return;
  }

  var text = [];
  responseObject.feed.entries.forEach((function process(entry) {
    text.push(entry.title);
    text.push(entry.content.replace(this.ENTRY_REGEXP, ''));
    text.push('');
  }).bind(this));
  this.app.handleData(text.join('\n'),
    _('feed-title', { title: responseObject.feed.title }));
};

var WikipediaFetcher = function WikipediaFetcher(opts) {
  this.types = ['wiki', 'wikipedia'];

  this.params = [
    ['action', 'query'],
    ['prop', 'revisions'],
    ['rvprop', 'content'],
    ['redirects', '1'],
    ['format', 'json'],
    ['rvparse', '1']
  ];
};
WikipediaFetcher.prototype = new JSONPFetcher();
WikipediaFetcher.prototype.WIKIPEDIA_API_URL =
  'https://%lang.wikipedia.org/w/api.php';
WikipediaFetcher.prototype.DEFAULT_LANG = 'en';
WikipediaFetcher.prototype.PARSED_WIKITEXT_REGEXP =
  /<[^>]+?>|\(.+?\.\.\.\)|\&\w+\;|<script.+?\/script\>/ig;
WikipediaFetcher.prototype.getData = function wf_getData(dataType, data) {
  var params = [].concat(this.params);

  var dataTypeArr = dataType.split('.');
  var lang = (dataTypeArr[1]) ? dataTypeArr[1] : this.DEFAULT_LANG;

  if (dataTypeArr[2]) {
    params.push(['converttitles', dataTypeArr[2]]);
  }

  params.push(['titles', data]);

  var url = this.WIKIPEDIA_API_URL.replace(/%lang/, lang) + '?' +
  params.map(function kv(param) {
    return param[0] + '=' + encodeURIComponent(param[1]);
  }).join('&');

  this.requestData(url);
};
WikipediaFetcher.prototype.handleResponse = function wf_handleResponse(res) {
  if (!res) {
    this.app.handleData('');
    return;
  }

  var pageId = Object.keys(res.query.pages)[0];
  var page = res.query.pages[pageId];
  if (!('revisions' in page)) {
    this.app.handleData('');
    return;
  }

  var text = page.revisions[0]['*'].replace(this.PARSED_WIKITEXT_REGEXP, '');
  this.app.handleData(text, _('wikipedia-title', { title: page.title }));
};

var GooglePlusFetcher = function GooglePlusFetcher(opts) {
  this.types = ['googleplus'];

  this.params = [
    ['maxResults', '100'],
    ['alt', 'json'],
    ['pp', '1']
  ];
};
GooglePlusFetcher.prototype = new JSONPFetcher();
GooglePlusFetcher.prototype.GOOGLE_PLUS_API_URL =
  'https://www.googleapis.com/plus/v1/people/%source/activities/public';
GooglePlusFetcher.prototype.POST_REGEXP =
  /<[^>]+?>|\(.+?\.\.\.\)|\&\w+\;|<script.+?\/script\>/ig;
GooglePlusFetcher.prototype.getData = function gpf_getData(dataType, data) {
  var googlePlusPanelView =
    this.app.views['source-dialog'].panels['googleplus'];
  var accessToken = googlePlusPanelView.accessToken;

  if (!accessToken) {
    // XXX: can we login user from here?
    // User would lost the id kept in hash here.
    this.app.logAction('GooglePlusFetcher::getData::reset');
    this.app.reset();
    this.app.views['source-dialog'].showPanel(googlePlusPanelView);
    return;
  }

  var params = [].concat(this.params);
  params.push(['access_token', accessToken]);

  var url = this.GOOGLE_PLUS_API_URL.replace(/%source/, data) + '?' +
  params.map(function kv(param) {
    return param[0] + '=' + encodeURIComponent(param[1]);
  }).join('&');

  this.requestData(url);
};
GooglePlusFetcher.prototype.handleResponse = function gpf_handleResponse(res) {
  if (!res || res.error || !res.items) {
    this.app.handleData('');
    return;
  }

  var text = res.items.map((function gpf_map(item) {
    return item.object.content.replace(this.POST_REGEXP, '');
  }).bind(this)).join('');

  // XXX: we cannot get the user's name from this request
  this.app.handleData(text, _('google-plus-title'));
};

var COSCUPFetcher = function COSCUPFetcher(opts) {
  this.types = ['coscup'];
  this.fields = ['name', 'speaker', 'bio', 'abstract'];
};
COSCUPFetcher.prototype = new JSONPFetcher();
COSCUPFetcher.prototype.API_URL = 'http://coscup.org/%year/api/program';
COSCUPFetcher.prototype.HTML_REGEXP =
  /<[^>]+?>|\(.+?\.\.\.\)|\&\w+\;|<script.+?\/script\>/ig;
COSCUPFetcher.prototype.getData = function cf_getData(dataType, data) {
  var year = this.year = data;
  this.requestData(this.API_URL.replace(/%year/, year));
};
COSCUPFetcher.prototype.handleResponse = function cf_handleResponse(res) {
  if (!res) {
    this.app.handleData('');
    return;
  }

  var text = [];
  var fields = this.fields;
  var HTML_REGEXP = this.HTML_REGEXP;
  var programs = (Array.isArray(res)) ? res : res['program'];

  programs.forEach(function cf_handleProgram(program) {
    fields.forEach(function cf_fields_forEach(field) {
      if (program[field])
        text.push(program[field].replace(HTML_REGEXP, ''));
    });
  });

  this.app.handleData(text.join('\n'), _('coscup-title', { year: this.year }));
};

var FacebookFetcher = function FacebookFetcher() {
  this.types = ['facebook'];
};
FacebookFetcher.prototype = new Fetcher();
FacebookFetcher.prototype.LABEL_VERB = LoadingView.prototype.LABEL_DOWNLOADING;
FacebookFetcher.prototype.FACEBOOK_GRAPH_FIELDS =
  'name,notes.limit(500).fields(subject,message),' +
  'feed.limit(2500).fields(from.fields(id),message)';
FacebookFetcher.prototype.NOTE_REGEXP =
  /<[^>]+?>|\(.+?\.\.\.\)|\&\w+\;|<script.+?\/script\>/ig;
FacebookFetcher.prototype.stop = function fbf_stop() {
  // FB.api doesn't comes with a method to cancel the request.
  this.currentPath = undefined;
};
FacebookFetcher.prototype.getData = function fbf_getData(dataType, data) {
  var facebookPanelView = this.app.views['source-dialog'].panels['facebook'];

  // If we are not ready, bring user back to the facebook panel.
  if (!facebookPanelView.isReadyForFetch()) {

    // XXX: can we login user from here?
    // User would lost the id kept in hash here.
    this.app.logAction('FacebookFetcher::getData::reset');
    this.app.reset();
    this.app.views['source-dialog'].showPanel(facebookPanelView);
    return;
  }

  var path = this.currentPath = '/' + encodeURIComponent(data) +
    '?fields=' + this.FACEBOOK_GRAPH_FIELDS;

  FB.api(path, (function gotFacebookAPIData(res) {
    // Ignore any response that does not match currentPath.
    if (this.currentPath !== path)
      return;
    this.currentPath = undefined;

    this.handleResponse(res);
  }).bind(this));
};
FacebookFetcher.prototype.handleResponse = function fbf_handleResponse(res) {
  if (!res || res.error) {
    this.app.handleData('');
    return;
  }

  var text = [];

  if (res.notes && res.notes.data) {
    var NOTE_REGEXP = this.NOTE_REGEXP;
    res.notes.data.forEach(function forEachNote(note) {
      if (note.subject)
        text.push(note.subject);
      if (note.message)
        text.push(note.message.replace(NOTE_REGEXP, ''));
    });
  }

  if (res.feed && res.feed.data) {
    res.feed.data.forEach(function forEachData(entry) {
      // Get rid of birthday messages on the wall.
      if (entry.from.id !== res.id)
        return;

      if (entry.message)
        text.push(entry.message);
    });
  }

  this.app.handleData(text.join('\n'), _('facebook-title', { name: res.name }));
};

var LocalFeedFetcher = function LocalFeedFetcher(){
  this.types = ['localfeeds'];
};
LocalFeedFetcher.prototype = new JSONPFetcher();
LocalFeedFetcher.prototype.FEED_API_LOAD_URL =
  SITE_URL+'tools/get_localfeed';
LocalFeedFetcher.prototype.FEED_API_CALLBACK_PREFIX = 'LocalFeedFetcherCallback';
LocalFeedFetcher.prototype.init = function lrf_init() {
  var that = this;
  setTimeout(function(){ that.getData() }, 1000);
};
LocalFeedFetcher.prototype.getData = function lrf_getData() {
  var url = this.FEED_API_LOAD_URL+'?';
  this.app.logAction('LocalFeedFetcher::getData::'+url);

  this.requestData(url);
};

LocalFeedFetcher.prototype.handleResponse = function rf_handleResponse(contextValue,
                                                                 responseObject,
                                                                 responseStatus,
                                                                 errorDetails) {
  
  // Return empty text if we couldn't get the data.
  if ( !contextValue ) {
    this.app.handleData('');
    return;
  }

  var targetform = document.getElementById('wc-panel-example');
  var toreplace = targetform.querySelector('.throbber.local-feeds');
  
  
  var divwrap = document.createElement('div');
  contextValue.forEach(function(entry){
    var label = document.createElement('label');
    var input = document.createElement('input');
    var span = document.createElement('span');
    span.textContent = entry.name;
    input.setAttribute('type', 'radio');
    input.setAttribute('name', 'example');
    input.setAttribute('value', 'feed:'+entry.value);

    label.setAttribute('class', 'radio');
    label.appendChild(input);
    label.appendChild(span);
    targetform.appendChild(label);
  });
  targetform.removeChild(toreplace);
};