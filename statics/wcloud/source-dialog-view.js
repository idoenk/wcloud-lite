'use strict';

var SourceDialogView = function SourceDialogView(opts) {
  this.load(opts, {
    name: 'source-dialog',
    element: 'wc-source-dialog',
    menuElement: 'wc-source-menu',
    selectionElement: 'wc-source-selection',
    startBtnElement: 'wc-source-start-btn',
    // dismissBtnElement: 'wc-source-dismiss-btn',
    panelContainerElement: 'wc-source-panels',
    optionBtnElement: 'wc-source-option-btn',
    texttypeToggleElement: 'wc-panel-texttype',
    texttypeToggle2Element: 'wc-panel-contenttype',
    aboutBtnElement: 'wc-source-about-btn'
  });

  this.currentPanel = null;
  this.panels = {};

  var selectionElement = this.selectionElement;
  var menuLinks = this.menuElement.getElementsByTagName('a');
  Array.prototype.forEach.call(menuLinks, function item(el) {
    var option = document.createElement('option');
    option.value = el.getAttribute('data-panel');
    option.setAttribute('data-l10n-id', el.getAttribute('data-l10n-id'));
    option.appendChild(document.createTextNode(el.textContent));
    selectionElement.appendChild(option);
  });

  this.menuElement.addEventListener('click', this);
  this.selectionElement.addEventListener('change', this);
  this.startBtnElement.addEventListener('click', this);
  // this.dismissBtnElement.addEventListener('click', this);
  this.panelContainerElement.addEventListener('submit', this);
  this.aboutBtnElement.addEventListener('click', this);
  this.optionBtnElement.addEventListener('click', this);
  this.texttypeToggleElement.addEventListener('change', this);
  this.texttypeToggle2Element.addEventListener('change', this);
};
SourceDialogView.prototype = new View();
SourceDialogView.prototype.afterShow = function sdv_afterShow() {
  if (this.currentPanel)
    this.currentPanel.show();

  var $el = $(this.element);
  var registered_name_drag_modals = ['source-dialog'];
  if(this.name && registered_name_drag_modals.indexOf(this.name) !== -1 && $el.length && !$el.hasClass('eventdrag')){
    var $dialog = $el.find('.modal-dialog'),
        dHeight = $dialog.outerHeight(),
        treshold = 80
    ;
    if (dHeight > 0)
      $el.css('min-height', (dHeight+treshold)+'px');

    if ($el.hasClass('draggable')){
      $el.find('.modal-dialog').draggable({
        opacity: .65,
        handle: ".modal-header, .modal-footer"
      })
    }

    $el.addClass('eventdrag');
  }
};
SourceDialogView.prototype.handleEvent = function sd_handleEvent(evt) {
  evt.preventDefault();
  if (evt.type == 'submit') {
    this.currentPanel.submit();
    return;
  }

  switch (evt.currentTarget) {
    case this.menuElement:
      var panelName = evt.target.getAttribute('data-panel');
      if (!panelName || !this.panels[panelName])
        return;

      this.showPanel(this.panels[panelName]);
      break;

    case this.selectionElement:
      var panelName = evt.target.value;
      if (!panelName || !this.panels[panelName])
        return;

      this.showPanel(this.panels[panelName]);
      break;

    case this.aboutBtnElement:
      this.app.switchUIState(this.app.UI_STATE_ABOUT_DIALOG);
      break;

    case this.optionBtnElement:
      this.app.switchUIState(this.app.UI_STATE_OPTION_DIALOG);
      break;

    case this.startBtnElement:
      this.currentPanel.submit();
      break;

    // case this.dismissBtnElement:
    //   top.location.href = SITE_URL;
    //   break;

    case this.texttypeToggleElement: case this.texttypeToggle2Element:
      var target = (evt.currentTarget.getAttribute('id') == 'wc-panel-texttype' ? '#additional-wordlist-prop' : '#additional-panel-wordlist-prop');

      if( evt.currentTarget.value == 'wordlist')
        $(target).removeClass('hide');
      else
        $(target).addClass('hide');
      break;
  }
};
SourceDialogView.prototype.submit = function sd_submit(hash) {
  return this.app.pushUrlHash(hash);
};
SourceDialogView.prototype.showPanel = function sd_showPanel(panel) {
  if (this.currentPanel)
    this.currentPanel.hide();
  ;
  panel.show();
  this.currentPanel = panel;

  if (this.app)
    this.app.logAction('SourceDialogView::showPanel', panel.name);
};
SourceDialogView.prototype.addPanel = function sd_addPanel(panel) {
  this.panels[panel.name] = panel;

  panel.menuItemElement =
    this.menuElement.querySelector('[data-panel="' + panel.name + '"]');

  panel.selectionIndex = Array.prototype.indexOf.call(
      this.menuElement.children, panel.menuItemElement.parentNode);

  if (!panel.menuItemElement)
    throw 'menuItemElement not found.';

  panel.menuItemElement.parentNode.removeAttribute('hidden');
  panel.dialog = this;

  if ('isSupported' in panel && !panel.isSupported) {
    panel.menuItemElement.parentNode.className += ' disabled';
    panel.menuItemElement.removeAttribute('data-panel');
    return;
  }

  if (!this.currentPanel)
    this.showPanel(panel);
};
