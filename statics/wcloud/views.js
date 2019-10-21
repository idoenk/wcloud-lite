'use strict';

// Super light-weight prototype-based objects and inherences
var View = function View() { };
View.prototype.load = function v_load(properties, defaultProperties) {
  var el = null;
  properties = properties || {};
  for (var name in defaultProperties) {
    if (name in this)
      break;

    this[name] = (name in properties) ?
      properties[name] : defaultProperties[name];

    if (name === 'element' || /Element$/.test(name)) {
      this[name] = (typeof this[name] === 'string') ?
        document.getElementById(this[name]) : this[name];
    }
    else if (/Modal$/.test(name)){

      this[name] = document.querySelector(this[name]);
    }
  }
};
View.prototype.show = function v_show(currentState, nextState) {
  if (('beforeShow' in this) &&
      this.beforeShow.apply(this, arguments) === false) {
    return false;
  }

  this.element.removeAttribute('hidden');

  if ('afterShow' in this) {

    this.afterShow.apply(this, arguments);
  }

  var $el = $(this.element),
      registered_name_drag_modals = ['list-dialog', 'about-dialog', 'option-dialog']
  ;

  if(this.name && registered_name_drag_modals.indexOf(this.name) !== -1
    && $el.length && !$el.hasClass('eventdrag')){
    var $dialog = $el.find('.modal-dialog'),
        dHeight = $dialog.outerHeight(),
        treshold = 80
    ;

    if (this.name == 'option-dialog')
      treshold = 400;

    if (dHeight > 0)
      $el.css('min-height', (dHeight+treshold)+'px');

    if ($el.hasClass('draggable')){
      $el.find('.modal-dialog').draggable({
        opacity: .65,
        handle: ".modal-header, .modal-footer"
      });
    }

    $el.addClass('eventdrag');
  }

  return true;
};
View.prototype.hide = function v_hide(currentState, nextState) {
  if (('beforeHide' in this) &&
      this.beforeHide.apply(this, arguments) === false) {
    return false;
  }

  this.element.setAttribute('hidden', true);

  if ('afterHide' in this) {
    this.afterHide.apply(this, arguments);
  }
  return true;
};

var LanguageSwitcherView = function LanguageSwitcher(opts) {
  this.load(opts, {
    element: 'wc-language'
  });

  var defaultLanguage = navigator.language || navigator.userLanguage;
  defaultLanguage = defaultLanguage.replace(/-[a-z]{2}$/i, function(str) {
    return str.toUpperCase();
  });

  // Collect the information about available languages from HTML.
  var langs = this.langs = [];
  Array.prototype.forEach.call(this.element.children, function lang(el) {
    langs.push(el.value);
    if (el.value === defaultLanguage)
      el.selected = true;
  });

  if (langs.indexOf(defaultLanguage) === -1) {
    // Default to the first one.
    this.element.selectedIndex = 0;
  }

  // 'localized' is a CustomEvent dispatched by l10n.js
  document.addEventListener('localized', this);
  this.element.addEventListener('change', this);
};
LanguageSwitcherView.prototype = new View();
LanguageSwitcherView.prototype.handleEvent = function lsv_handleEvent(evt) {
  switch (evt.type) {
    case 'change':
      document.webL10n.setLanguage(this.element.value);
      this.app.logAction('LanguageSwitcherView::change', this.element.value);
      break;

    case 'localized':
      this.app.logAction('LanguageSwitcherView::localized',
                          document.documentElement.lang);
      break;
  }
};

var LoadingView = function LoadingView(opts) {
  this.load(opts, {
    name: 'loading',
    element: 'wc-loading',
    labelElement: 'wc-loading-label'
  });

  this.stringIds = [
    'downloading',
    'loading',
    'analyzing',
    'no_data',
    'no_list_output'
  ];
};
LoadingView.prototype = new View();
LoadingView.prototype.LABEL_DOWNLOADING = 0;
LoadingView.prototype.LABEL_LOADING = 1;
LoadingView.prototype.LABEL_ANALYZING = 2;
LoadingView.prototype.LABEL_ERROR_DATA = 3;
LoadingView.prototype.LABEL_ERROR_LIST = 4;
LoadingView.prototype.beforeShow = function l_beforeShow(state, nextState) {
  if (nextState === this.app.UI_STATE_ERROR_WITH_DASHBOARD) {
    this.element.className = 'error';
  } else {
    this.element.className = '';
  }
};
LoadingView.prototype.updateLabel = function l_updateLabel(stringId) {
  if (!this.stringIds[stringId])
    throw 'Undefined stringId ' + stringId;

  this.labelElement.setAttribute('data-l10n-id', this.stringIds[stringId]);
  __(this.labelElement);
};

var ListDialogView = function ListDialogView(opts) {
  this.load(opts, {
    name: 'list-dialog',
    element: 'wc-list-dialog',
    textElement: 'wc-list-edit',
    cancelBtnElement: 'wc-list-cancel-btn',
    confirmBtnElement: 'wc-list-confirm-btn',
    closeBtnModal: '#wc-list-dialog button.close'
  });

  this.cancelBtnElement.addEventListener('click', this);
  this.confirmBtnElement.addEventListener('click', this);
  this.closeBtnModal.addEventListener('click', this);
};
ListDialogView.prototype = new View();
ListDialogView.prototype.beforeShow = function ldv_beforeShow() {
  this.textElement.value = this.app.data.list.map(function mapItem(item) {
    return item[1] + '\t' + item[0];
  }).join('\n');
};
ListDialogView.prototype.afterShow = function ldv_afterShow() {
  this.textElement.focus();
};
ListDialogView.prototype.handleEvent = function ldv_handleEvent(evt) {

  // switch (evt.target) {
  switch (evt.currentTarget) {
    case this.confirmBtnElement:
      this.submit();

      break;

    case this.cancelBtnElement:
    case this.closeBtnModal:
      this.close();

      break;
  }
};
ListDialogView.prototype.submit = function ldv_submit() {
  var el = this.textElement;
  var hash;
  if (window.btoa) {
    // Protect the encoded string with base64 to workaround Safari bug,
    // which improve sharability of the URL.
    hash = '#base64-list:' +
      window.btoa(unescape(encodeURIComponent(el.value)));
  } else {
    hash = '#list:' + encodeURIComponent(el.value);
  }

  var hashPushed = this.app.pushUrlHash(hash);
  if (!hashPushed) {
    // The hash is too long and is being rejected in IE.
    // let's use the short hash instead.
    this.app.pushUrlHash('#list');
  }
};
ListDialogView.prototype.close = function ldv_close() {
  this.app.switchUIState(this.app.UI_STATE_DASHBOARD);
};

var AboutDialogView = function AboutDialogView(opts) {
  this.load(opts, {
    name: 'about-dialog',
    element: 'wc-about-dialog',
    donateElement: 'wc-about-donate',
    donateContentElement: 'wc-about-donate-content',
    contentElement: 'wc-about-content',
    closeBtnElement: 'wc-about-close-btn',
    closeBtnModal: '#wc-about-dialog button.close'
  });

  this.loaded = false;

  this.closeBtnElement.addEventListener('click', this);
  this.contentElement.addEventListener('click', this);
  this.closeBtnModal.addEventListener('click', this);
  this.donateContentElement.addEventListener('submit', this);
  document.addEventListener('localized', this);
};
AboutDialogView.prototype = new View();
AboutDialogView.prototype.beforeShow = function adv_beforeShow() {
  this.app.logAction('AboutDialogView::view');

  this.loaded = true;
  var lang = document.webL10n.getLanguage();
  !1 && this.loadContent(lang, true);
};
AboutDialogView.prototype.afterShow = function ldv_afterShow() {
  var $el = $(this.element);
};
AboutDialogView.prototype.loadContent = function adv_loadContent(lang, first) {
  // Everything would be a *lot* easier
  // if we could have seamless iframe here...
  var iframe = document.createElement('iframe');
  iframe.src = 'about.' + lang + '.html';
  this.contentElement.appendChild(iframe);

  iframe.onload = (function contentLoaded() {
    // Import nodes to this document
    var content = document.importNode(
      iframe.contentWindow.document.body, true);

    // Create a document fragment; move all the children to it.
    var docFrag = document.createDocumentFragment();
    while (content.firstElementChild) {
      docFrag.appendChild(content.firstElementChild);
    }

    // Append the children to the container.
    var container = this.contentElement;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(docFrag);
  }).bind(this);
  if (first) {
    iframe.onerror = (function contentLoadError() {
      this.loaded = false;
      if (!this.element.hasAttribute('hidden')) {
        this.app.switchUIState(this.app.UI_STATE_SOURCE_DIALOG);
      }
    }).bind(this);
  }

  if (window.DONATE_HTML) {
    var lang = document.documentElement.lang;
    this.donateElement.removeAttribute('hidden');
    this.donateContentElement.innerHTML =
      window.DONATE_HTML.replace(/%lang/, lang.replace(/-/, '_'));
  }
};
AboutDialogView.prototype.handleEvent = function adv_handleEvent(evt) {
  if (evt.type === 'localized') {
    this.loaded = false;

    return;
  }

  switch (evt.currentTarget) {
    case this.contentElement:
      if (evt.target.tagName !== 'A')
        break;

      evt.preventDefault();
      window.open(evt.target.href);
      this.app.logAction('AboutDialogView::externalLink', evt.target.href);

      break;

    case this.donateContentElement:
      this.app.logAction('AboutDialogView::donateLink');

      break;

    case this.closeBtnElement:
    case this.closeBtnModal:
      this.close();

      break;
  }
};
AboutDialogView.prototype.close = function adv_close() {
  this.app.switchUIState(this.app.UI_STATE_SOURCE_DIALOG);
};

var OptionDialogView = function OptionDialogView(opts){
  this.load(opts, {
    name: 'option-dialog',
    element: 'wc-option-dialog',
    contentElement: 'wc-option-content',
    closeBtnElement: 'wc-option-close-btn',
    applyBtnElement: 'wc-option-apply-btn',
    closeBtnModal: '#wc-option-dialog button.close'
  });

  this.loaded = false;

  this.closeBtnElement.addEventListener('click', this);
  this.applyBtnElement.addEventListener('click', this);
  this.contentElement.addEventListener('click', this);
  this.closeBtnModal.addEventListener('click', this);

  document.addEventListener('localized', this);

  this.dataoption = this.preloadStore();
};
OptionDialogView.prototype = new View();
/*
* preload options from localStorage
*/
OptionDialogView.prototype.preloadStore = function odv_preloadStore(){
  var SO = new StoreOptions();
  var options = SO.get('storeoptions');
  if("undefined" != typeof options && options){}
  else{
    SO.set('storeoptions',{});
  }
  options = SO.get('storeoptions');
  return options;
};
OptionDialogView.prototype.beforeShow = function odv_beforeShow() {
  this.app.logAction('OptionDialogView::view');

  this.loaded = true;
  var lang = document.webL10n.getLanguage();
  this.loadContent(lang, true);
};
OptionDialogView.prototype.loadContent = function odv_loadContent(lang, first){

  // carefull this might keep doin whenever dialog is showed
  var cp = {};
  var app = this.app;
  var $wraper, $dialog = $('#wc-option-dialog');

  if( app.DEBUG_LOG )
    console.log('Inside loadContent, ' + lang);

  var initiate_colorpick = function initiate_colorpick($btn_){
    var currentColor;
    var defaultColor = 'ffffff';

    var $par = $btn_.closest('.item');
    var $colorText = $par.find('.color-value');
    var $tgt_wrap_colorpick = $par.find('.wrap-color-picker');
    var cfield = String($btn_.attr('id'));

    cp[cfield] = ColorPicker(
      $tgt_wrap_colorpick.find('.slide').get(0),
      $tgt_wrap_colorpick.find('.picker').get(0),
      function(hex, hsv, rgb, mousePicker, mouseSlide) {
        currentColor = hex;
        ColorPicker.positionIndicators(
          $tgt_wrap_colorpick.find('.slide-indicator').get(0),
          $tgt_wrap_colorpick.find('.picker-indicator').get(0),
          mouseSlide, mousePicker
          );
        $btn_.css('background', hex);
        $colorText.val(String(hex).replace(/\#/g,''))
      });
    if( $btn_.attr('id') == 'btn-pickcolor' )
      defaultColor = '363636';

    cp[cfield].setHex('#'+defaultColor);
    $colorText.val(defaultColor);
  };
  var build_colorpick_palette = function build_colorpick_palette(){
    if( app.DEBUG_LOG )
      console.log('inside build_colorpick_palette')
    var $tpl, $target = $('#wrap-pane1B');
    var tplstring = '';
    var ncolor = 5;

    // loop it up
    for(var i=0; i<ncolor; i++){
      $tpl = $('<div></div>').html($('#tplcolorpick').html()).clone(false);
      $tpl.find('.btn-pickcolor').attr('id', 'btn-pickcolor-palette-'+i);
      $tpl.find('.color-value').attr('id', 'color-value-palette-'+i);
      $tpl.find('.wrap-color-picker').attr('id', 'wrap-picker-palette-'+i);
      tplstring += $tpl.html();
    }
    
    $target.html( tplstring );

    $target.find('.btn-pickcolor').each(function(){
      // initiate ColorPicker
      initiate_colorpick($(this));
    });
  };

  var toggle_themes = function($btn){
    var $li = $btn.closest('li'),
        $par = $btn.closest('.controls'),
        $tabb = $btn.closest('.tabbable'),
        mode = $btn.data('name'),
        $partheme = $par.find('.wrap-themes-outer')
    ;
    if (!mode) 
      return !1;

    // reset hide all
    $partheme
      .find('.itemwrap')
      .addClass('hide');

    $partheme
      .find('.wrap-'+mode)
      .removeClass('hide');

    $tabb.find('ul.menu-themes>li')
      .removeClass('active')
      .find('[name="themes"]')
        .prop('checked', false)
        .removeAttr('checked');

    $li
      .addClass('active')
      .find('[name="themes"]')
        .prop('checked', true)
        .attr('checked', 'checked');
  };


  if (!$dialog.hasClass('events') ){

    // dynamic-design

    // build & initiate colorPicker for custom palette
    build_colorpick_palette();
    
    // initiate ColorPicker
    initiate_colorpick($dialog.find('#btn-pickcolor'));

    initiate_colorpick($dialog.find('#btn-pickcolor-dualtone-topword'));
    initiate_colorpick($dialog.find('#btn-pickcolor-dualtone-otherword'));

    // build DOM for palette preset
    var $target = $dialog.find('.wrap-preset .wrap-themes'),
        tplthemes = '',
        tplrandomcolor = '',
        subtpltheme = '',
        subtpl_backgr = '',
        colorset = false
    ;

    for(var i=0; i<app.themes.length; i++){
      if(app.data.custom_themeIndex == i)
        continue;

      colorset = app.themes[i].colorset;
      tplthemes += '<div class="theme" data-theme="'+(i+1)+'">';
      tplrandomcolor += '<label class="radio randomcolor">'
        +'<input type="radio" name="randomcolor" value="style-'+(i+1)+'">'
      ;

      if( "undefined" != typeof colorset ){
        
        subtpltheme = '<div class="unitpalete">{{SUBTPL_BACKGR}}';
        subtpl_backgr = '<div class="pbox pbox-bkg" title="Background" style="background-color:'+app.themes[i].backgroundColor+';"></div>';
        
        if( "object" == typeof colorset && colorset ){
          for(var j=0; j<colorset.length; j++)
            subtpltheme += '<div class="pbox pbox-palette"><span class="boxc" style="background-color:'+colorset[j]+'"></span>'
              +'<input class="ctext" value="'+String(colorset[j]).replace(/\#/g,'').toUpperCase()+'" readonly="readonly" />' 
              +'</div>';
        }
        else if( colorset )
          subtpltheme += '<div class="pbox keduax" style="background-color:'+colorset+'"></div>';
        else
          subtpltheme += '<div class="pbox randomize" title="'+("string" == typeof app.themes[i].color ? '-random-'+app.themes[i].color : '')+'" style="background-color:#fff">random'+("string" == typeof app.themes[i].color ? '-'+app.themes[i].color : '')+'</div>';

        subtpltheme += '</div>';
        tplthemes += subtpltheme.replace('{{SUBTPL_BACKGR}}', subtpl_backgr);
        tplrandomcolor += subtpltheme.replace('{{SUBTPL_BACKGR}}', '');
      }

      tplthemes += '</div>';
      tplrandomcolor += ''
        +'<button type="button" class="btn btn-sm btn-default btn-detailcolor" title="Detail Color Code">'
          +'<i class="fa fa-bars" aria-hidden="true"></i>'
        +'</button>';
      tplrandomcolor += '</label>';
    }
    $target.html( tplthemes );
    $dialog.find('.wrap-custom .wrap-color-random').html( tplrandomcolor );


    // -=-=-=-=-=-=-=



    // themes toogle
    $dialog.find('ul.menu-themes>li>a').each(function(){
      $(this).click(function(e){
        e.preventDefault();

        toggle_themes($(this));
      })
    });

    // textclor toogle
    $('#fcolor-custom, #fcolor-random').each(function(){
      $(this).click(function(){
        var $me = $(this);
        var $par = $me.closest('.controls');
        $par.find('[class*=wrap-color-]').addClass('hide');
        if( $me.val() == 'random' ){
          $par.find('.wrap-color-random').removeClass('hide');
        }
        else{
          $par.find('.wrap-color-custom').removeClass('hide');
        }
      });
    });

    // detail color in palette
    $dialog.find('.ctext').each(function(){
      $(this).click(function(e){
        e.preventDefault();
        $(this).select();
      })
    });

    $dialog.find('.btn-detailcolor').each(function(){
      $(this).click(function(){
        var $me = $(this),
          $par = $me.closest('.randomcolor'),
          $target = $par.find('.unitpalete')
        ;
        if( $target.hasClass('listing') ){
          $target.removeClass('listing');
        }
        else{
          $target.addClass('listing');
        }
      });
    });


    $dialog.find('.btn-pickcolor').each(function(){
      $(this).click(function(){
        var $me = $(this);
        var $par = $me.parent();
        var $tgt_wrap_colorpick = $par.next();
        
        var action_els = ['.input-prepend', '.btn-clear'];
        if( $tgt_wrap_colorpick.hasClass('hide') ){
          $.each(action_els, function(){
            $par.find(this).removeClass('hide');
          });
          $tgt_wrap_colorpick.removeClass('hide');

          $me.attr('data-title', $me.attr('title'));
          $me.attr('title', $me.attr('data-current'));
        }
        else{
          $.each(action_els, function(){
            $par.find(this).addClass('hide');
          });
          $tgt_wrap_colorpick.addClass('hide');

          $me.attr('title', $me.attr('data-title'));
        }
      })
    });
    
    $dialog.find('.btn-clear').each(function(){
      $(this).click(function(){
        var $me = $(this);
        var $par = $me.closest('.item');
        var $btn = $par.find('.btn-pickcolor');
        var cfield = String($btn.attr('id'));
        if( "undefined" != typeof cp[cfield] ){
          cp[cfield].setHex('#ffffff');
          $par.find('.color-value').val('ffffff');
        }
      });
    });

    $dialog.find('.color-value').each(function(){
      $(this).on('blur', function(){
        var $me = $(this);
        var val = $(this).val().trim();
        var $par = $me.closest('.item');
        var $btn = $par.find('.btn-pickcolor');
        var cfield = String($btn.attr('id'));
        if( /^\w{6}/.test(val) && "undefined" != typeof cp[cfield] ){
          cp[cfield].setHex( '#'+val.toUpperCase() );
        }
      }).focus(function(){
        $(this).select();
      });
    });
    $dialog.find('.input-group-addon').each(function(){
      var $me = $(this), $next = $me.next();
      if ($next.hasClass('color-value'))
        $me.click(function(){
          $next.focus();
        });
    });

    $dialog.find('.nav-tabs > li > a').each(function(){
      $(this).click(function(){
        var $me = $(this);
        var $par = $me.closest('.nav');
        $par.find('[type=radio]').prop('checked', false);
        $me.find('[type=radio]').prop('checked', true);
      });
    })
    
    $dialog.find('.wrap-shapes .shape').each(function(){
      $(this).click(function(){
        var $me = $(this);
        var $par_ = $me.closest('.controls');

        $par_.find('.wrap-shapes .shape').removeClass('selected');
        $par_.find('#inputShape').val($me.data('shape'));
        $me.addClass('selected');
      });
    });

    $dialog.find('.wrap-themes .theme').each(function(){
      $(this).click(function(){
        var $me = $(this);
        var $par_ = $me.closest('.controls');

        $par_.find('.wrap-themes .theme').removeClass('selected');
        $par_.find('#inputTheme').val($me.data('theme'));
        $me.addClass('selected');
      });
    });

    $dialog.find('#specific-word').click(function(){
      var $me = $(this);
      var $par = $me.closest('.item');
      if( $me.is(':checked') ){
        $par.find('#nword').prop('disabled', true);
        $par.find('#wrap-specific-wordlist').removeClass('hide');
      }
      else{
        $par.find('#nword').prop('disabled', false);
        $par.find('#wrap-specific-wordlist').addClass('hide');
      }
    });

    $dialog.find('#ncolor').change(function(){
      var $me = $(this);
      var ncolor = $me.val();
      var $wrapcolor = $('#wrap-pane1B');
      var $items = $wrapcolor.find('.item');

      if( app.DEBUG_LOG )
        console.log('change to '+$me.val());
      
      $items.addClass('hide');
      for(var i=0; i<ncolor; i++)
        $items.eq(i).removeClass('hide');
    });

    $dialog.find('#skew-normalize').click(function(){
      var $par = $(this).closest('.controls');
      var $skew = $par.find('#skew-treshold')
      $skew.prop('disabled', !$(this).is(':checked'));
    });

    $dialog.addClass('events');
  }



  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // redesign based on latest localStorage options
  var options = app.getStorageOptions();

  if (app.DEBUG_LOG){
    console.log(options);
    console.log('redesign option-dialog');
  }

  if ("undefined" != typeof options.theme){
    $wraper = $('.wrap-themes');
    $wraper.find('.theme').removeClass('selected');
    $wraper
      .find('.theme[data-theme='+(options.theme+1)+']')
      .addClass('selected');
  }
  else{
    $('.wrap-themes>.theme').first()
      .trigger('click');
  }

  if ("undefined" != typeof options.shape){
    $wraper = $('.wrap-shapes');
    $wraper.find('.shape').removeClass('selected');
    $wraper.find('.shape[data-shape='+options.shape+']').addClass('selected');
  }

  if ("undefined" != typeof options.panelpos){
    $wraper = $dialog.find('#panel-possition');
    $wraper.find('[selected]').prop('selected', false);
    $wraper.find('[value='+options.panelpos+']').prop('selected', true);
  }

  if ("undefined" != typeof options.skewNormalize){
    $dialog.find('#skew-normalize').prop('checked', options.skewNormalize);

    if ("undefined" != typeof options.skewnessTreshold)
      $dialog.find('#skew-treshold')
        .val(options.skewnessTreshold)
        .prop('disabled', !options.skewNormalize);
  }


  console.log('options.custom_themeIndex='+options.custom_themeIndex);
  console.log('options.theme='+options.theme);
  if (options.custom_themeIndex && options.custom_themeIndex == options.theme){
    $dialog
      .find('ul.menu-themes>li>a[data-name="custom"]')
      .trigger('click');

    var custom = options.custom,
        customcolor = (custom ? custom.color : {}),
        cpfield = 'btn-pickcolor',
        $fontlist = $dialog.find('#font-custom'),
        fontparts = String(custom.fontFamily).split(",")
    ;

    // background
    if( "undefined" != typeof cp[cpfield] ){
      
      cp[cpfield].setHex( custom.backgroundColor );
    }

    // font
    if ($fontlist.length){
      $fontlist.prop('selected', false);
      $fontlist.find('option[value*="'+String(fontparts[0]).replace(/\"/g,'')+'"]').prop('selected', true);
    }
    
    if (custom.textcolorType == 'random'){
      $dialog.find('#fcolor-random').trigger('click');
      if (custom.textcolorRandomName){
        $dialog.find('[name=randomcolor]').prop('checked', false);
        $dialog.find('[name=randomcolor][value="'+custom.textcolorRandomName+'"]').prop('checked', true);
      }
    }
    else{
      $dialog.find('#fcolor-custom').trigger('click');
      if (customcolor && customcolor.type)
        customcolor = {type:'dualtone'};


      if( customcolor.type == 'dualtone' ){
        // dualtone should be the first tab

        if (customcolor.topword){
          cp['btn-pickcolor-dualtone-topword'] && 
          cp['btn-pickcolor-dualtone-topword'].setHex(customcolor.topword);
          $dialog.find('#value-pickcolor-topword').val(String(customcolor.topword).replace(/\#/g,''));
        }
        if (customcolor.topword){
          cp['btn-pickcolor-dualtone-otherword'] &&
          cp['btn-pickcolor-dualtone-otherword'].setHex(customcolor.otherword);
          $dialog.find('#value-pickcolor-otherword').val(String(customcolor.otherword).replace(/\#/g,''));
        }
        if (custom.backgroundColor){
          cp['btn-pickcolor'] &&
          cp['btn-pickcolor'].setHex(custom.backgroundColor);
          $dialog.find('#value-pickcolor-background').val(String(custom.backgroundColor).replace(/\#/g,''));
        }
        if( customcolor.backgroundColor )
          $dialog.find('#nword').val(customcolor.nword);

        if (customcolor.wordlist && customcolor.wordlist.length){
          if (!$dialog.find('#specific-word').is(':checked'))
            $dialog.find('#specific-word').trigger('click');
          $dialog.find('#specific-wordlist').val(customcolor.wordlist.join('\n'));
        }
      }
      else if( customcolor.type == 'palette' ){
        // someother tab (N/A)
        $dialog.find('.wrap-color-custom .nav-tabs a[href="#lB"]').trigger('click');
        var $ncolor = $dialog.find('#ncolor'),
            ccolorset = customcolor.ccolorset||[],
            icolor = 0
        ;

        $ncolor.find('[selected]').prop('selected', false);
        $ncolor.find('[value='+custom.ncolor+']').prop('selected', true);
        if (ccolorset.length)
          $dialog.find('#wrap-pane1B .color-value').each(function(i, el){
            icolor++;

            var $me = $(this),
                $item = $me.closest('.item'),
                cpfield = ''
            ;
            if( ccolorset[i] ){
              $me.val( ccolorset[i] );
              cpfield = String($item.find('.btn-pickcolor').attr('id'));
              if( "undefined" != typeof cp[cpfield] )
                cp[cpfield].setHex( ccolorset[i] );

              $item.removeClass('hide');
            }

            if (icolor > custom.ncolor){
              $item.addClass('hide');
              return true;
            }
          });
      }
    }
  }
  else{
    $dialog
      .find('ul.menu-themes>li>a[data-name="preset"]')
      .trigger('click');
  }
};
OptionDialogView.prototype.handleEvent = function odv_handleEvent(evt) {
  if (evt.type === 'localized') {
    this.loaded = false;
    return;
  }

  switch (evt.currentTarget) {
    case this.applyBtnElement:
      this.app.logAction('OptionDialogView::apply');
      this.apply();
    break;

    case this.closeBtnElement:
    case this.closeBtnModal:
      this.close();

      break;
  }
};
OptionDialogView.prototype.close = function odv_close() {
  if( this.app.DEBUG_LOG )
    console.log('this.app.refView='+this.app.refView);

  if( "undefined" !== typeof this.app.refView && this.app.refView == 'dashboard' )
    this.app.switchUIState(this.app.UI_STATE_DASHBOARD);
  else
    this.app.switchUIState(this.app.UI_STATE_SOURCE_DIALOG);
};
OptionDialogView.prototype.apply = function odv_apply() {
  var $el, $parent = $(this.element);
  var custom, opt = {};
  var app = this.app;
  
  // themes
  $el = $parent.find('[name=themes]:checked');
  if( $el.val() == 'preset' ){
    
    app.data.theme = parseInt($parent.find('.wrap-preset .selected').data('theme'))-1;
    app.data.custom = null;
    delete app.data.custom;
  }
  // custom
  else{
    app.data.theme = app.data.custom_themeIndex;

    var customcolorset;
    custom = {
        backgroundColor: '#'+$parent.find('#value-pickcolor-background').val(),
        fontFamily: $parent.find('.font-list option:selected').val(),
        textcolorType: null, // [custom,random]
        color: null,
      }
    ;

    custom.textcolorType = ($parent.find('#fcolor-random').is(':checked') ? 'random' : 'custom');

    // text-color [random,custom]
    // random text-color
    if( $parent.find('#fcolor-random').is(':checked') ){
      var $selected_random_color = $parent.find('[type=radio][name=randomcolor]:checked');
      custom.textcolorRandomName = $selected_random_color.val();

      switch( $selected_random_color.val() ){
        case 'style-1':
          customcolorset = ['#66d9ef', '#a6e22d', '#fd9720',
                            '#a6e22a','#a581ff', '#f92772'];
          break;
        case 'style-2':
          customcolorset = ['#07ABDA', '#63D6F6', '#0F7BDC',
                            '#69B4F7','#00DBB6', '#376F65',
                            '#004438', '#5FF7DD'];
          break;
        case 'style-3':
          customcolorset = ['#2F55D1', '#4058A5', '#133193', '#98AFFD'];
          break;
        case 'style-4':
          customcolorset = ['#c30000', '#c37a00', '#650281',
                            '#de3333', '#de5c5c', '#7e602c',
                            '#633e00', '#481e53'];
          break;
        case 'style-5':
          customcolorset = function getRandomDarkColor() {
            return 'rgb(' +
              Math.floor(Math.random() * 128 + 48).toString(10) + ',' +
              Math.floor(Math.random() * 128 + 48).toString(10) + ',' +
              Math.floor(Math.random() * 128 + 48).toString(10) + ')';
          };
          break;
        case 'style-6':
          customcolorset = 'random-light';
          break;
        case 'style-7':
          customcolorset = ['#3a3f42', '#575d51', '#42361d'];
          break;
        case 'style-8':
          customcolorset = ['#f7e4be', '#f0f4bc', '#9a80a4', '#848da6'];
          break;
        case 'style-9':
          customcolorset = '#d0d0d0';
          break;
        case 'style-10':
          customcolorset = 'rgba(255,255,255,0.2)';
          break;
        case 'style-11':
          customcolorset = 'rgba(0,0,0,0.7)';
          break;
      }
      custom.color = customcolorset;


      // capsulate color function generator
      if( "object" === typeof custom.color ){
        custom.color = (function randomColorGenerator(colors) {
          return (function getRandomColor() {
            return colors[Math.floor(Math.random() * colors.length)];
          });
        })(custom.color);
      }
    }

    // custom text-color
    else{
      // which tab... (for now we just have single tab: dualtone)
      var $activetab = $parent.find('.wrap-color-custom .nav-tabs li [type=radio]:checked');
      var is_topword = !$parent.find('#specific-word').is(':checked');
      var ccolor = {};
      ccolor.flag = 'custom-textcolor';
      ccolor.type = $activetab.val();
      if( $activetab.val() == 'dualtone' ){
        if( is_topword ){
          ccolor.nword = $parent.find('#nword').val();
          if( !ccolor.nword )
            ccolor.nword = 3;
        }
        else{
          var wordlist = [],
            wordist_ = $parent.find('#specific-wordlist').val().split('\n');
          for(var i=0; i<wordist_.length; i++)
            wordlist.push( wordist_[i].trim().toLowerCase() );

          ccolor.wordlist = wordlist;
        }

        ccolor.topword = '#'+$parent.find('#value-pickcolor-topword').val();
        ccolor.otherword = '#'+$parent.find('#value-pickcolor-otherword').val();

        custom.color = ccolor;
      }
      else if( $activetab.val() == 'palette' ){
        custom.ncolor = $parent.find('#ncolor').val();

        // some other tab (N/A)
        var icolor = 0;
        
        ccolor['colorgen'] = function(){};
        ccolor['ccolorset'] = [];
        $('#wrap-pane1B .color-value').each(function(){
          icolor++;
          ccolor.ccolorset.push('#'+String($(this).val()).replace('#',''));
          if( icolor >= custom.ncolor )
            return false;
        });
        custom.color = ccolor;
      }
    }

    if( app.DEBUG_LOG )
      console.log(custom);

    app.data.custom = custom;
    app.themes[app.data.custom_themeIndex] = custom;
  }

  // shapes
  app.data.shape = $parent.find('.wrap-shapes .selected').data('shape');

  // shapes
  app.data.skewNormalize = ($parent.find('#skew-normalize').is(':checked') ? true : false);

  var skew = $parent.find('#skew-treshold').val();
  if( skew < 0 || skew > .5 )
    skew = .5;
  app.data.skewnessTreshold = parseFloat(skew);


  // panel positioning
  app.data.panelpos = $parent.find('#panel-possition').val();
  if( app.data.panelpos != 'fixed-top' ){
    $('#btn-pickfont').closest('.btn-group').addClass('dropup');
  }
  else{
    $('#btn-pickfont').closest('.btn-group').removeClass('dropup');
  }
  app.reposPanel();


  // saving
  app.setStorage();
  if( "undefined" !== typeof this.app.refView && this.app.refView == 'dashboard' ){
    this.app.switchUIState(this.app.UI_STATE_DASHBOARD);
    this.app.draw();
  }
  else
    this.app.switchUIState(this.app.UI_STATE_SOURCE_DIALOG);
};



var SNSPushView = function SNSPushView(opts) {
  this.load(opts, {
    name: 'sns-push',
    element: 'wc-sns-push',
    facebookElement: 'wc-sns-facebook',
    googlePlusElement: 'wc-sns-google-plus'
  });

  if (document.webL10n.getReadyState() === 'complete') {
    this.loadButtons();
  }
  window.addEventListener('localized', this);
};
SNSPushView.prototype = new View();
SNSPushView.prototype.FACEBOOK_BUTTON_URL =
  'https://www.facebook.com/plugins/like.php?href=%url&' +
  'layout=box_count&show_faces=false&width=55&' +
  'action=like&font=trebuchet+ms&colorscheme=light&height=65&locale=%lang';
SNSPushView.prototype.GOOGLEPLUS_BUTTON_URL =
  'https://plusone.google.com/u/0/_/+1/fastbutton?url=%url&' +
  'size=tall&count=true&annotation=bubble&lang=%lang';
SNSPushView.prototype.loadButtons = function spv_loadButtons() {
  var url = window.location.href;
  if (url.indexOf('#') !== -1) {
    url = url.replace(/#.*$/, '').replace(/\?.*$/, '');
  }
  var lang = document.documentElement.lang;

  this.updateFrame(this.facebookElement,
    this.FACEBOOK_BUTTON_URL
    .replace(/%url/, encodeURIComponent(url))
    .replace(/%lang/, lang.replace(/-/, '_')));

  this.updateFrame(this.googlePlusElement,
    this.GOOGLEPLUS_BUTTON_URL
    .replace(/%url/, encodeURIComponent(url))
    .replace(/%lang/, lang));
};
SNSPushView.prototype.updateFrame = function spv_updateFrame(container, url) {
  while (container.firstElementChild) {
    container.removeChild(container.firstElementChild);
  }

  var iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allowTransparency', 'true');
  container.appendChild(iframe);
};
SNSPushView.prototype.handleEvent = function spv_handleEvent(evt) {
  switch (evt.type) {
    case 'localized':
      this.loadButtons();

      break;
  }
};


/* Keystroke */
$(document).keyup(function(e) {
  if (e.keyCode == 27) {
    var $modal = $('[role="dialog"].modal:not([hidden])').first();
    // Found one?
    if (!$modal.length)
      return !1;

    // Does modal has escapable & close button
    if (!($modal.hasClass('escapable') && $modal.find('.close').length))
      return !1;

    $modal.find('.close')
      .trigger('click');

    return true;
  }
});