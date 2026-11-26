/*!
 * wcloud-lite - CanvasView
 * Adapted from: https://github.com/timdream/wordcloud/blob/main/assets/canvas-view.js
 *
 * Copyright 2011, 2013-2019 Timothy Guan-tin Chien and other contributors.
 * Modified work Copyright (c) 2026 Idx
 * Released under the MIT license
 */

import { WordCloud, __ } from '../timdream/index.js';
import { View } from './views.js';

export class CanvasView extends View {
  constructor(opts) {
    super();
    this.load(opts, {
      name: 'canvas',
      element: 'wc-canvas',
      canvasElement: 'wc-canvas-canvas',
      hoverElement: 'wc-canvas-hover',
      hoverLabelElement: 'wc-canvas-hover-label',
    });

    window.addEventListener('resize', this);
    this.canvasElement.addEventListener('wordcloudstop', this);

    this.documentWidth = window.innerWidth;
    this.documentHeight = window.innerHeight;
    this.cssTransformProperty = 'transform';

    const style = this.canvasElement.style;
    ['transform', 'webkitTransform', 'msTransform', 'oTransform'].some((prop) => {
      if (!(prop in style)) {
        return false;
      }
      this.cssTransformProperty = prop;
      return true;
    });

    this.idleOption = {
      fontFamily: 'Times, serif',
      color: 'rgba(255, 255, 255, 0.8)',
      rotateRatio: 0.5,
      backgroundColor: 'transparent',
      wait: 75,
      list: (() => {
        const list = [];
        const nums = [5, 4, 3, 2, 2];
        const words = (
          'Arai,Awan,Bodjal,Boira,Bulud,Bulut,Caad,Chmura,Clood,' +
          'Cloud,Cwmwl,Dampog,Debesis,Ewr,Felhő,Hodei,Hûn,Koumoul,Leru,Lipata,' +
          "Mixtli,Moln,Mây,Méga,Mākoņi,Neul,Niula,Nivulu,Nor,Nouage,Nuage,Nube," +
          'Nubes,Nubia,Nubo,Nuvem,Nuvi,Nuvia,Nuvola,Nwaj,Nívol,Nóvvla,Nùvoła,' +
          "Nùvula,Núvol,Nûl,Nûlêye,Oblaci,Oblak,Phuyu,Pil'v,Pilv,Pilvi,Qinaya," +
          "Rahona,Rakun,Retë,Scamall,Sky,Ský,Swarken,Ulap,Vo'e,Wingu,Wolcen," +
          'Wolk,Wolke,Wollek,Wulke,dilnu,Νέφος,Абр,Болот,Болытлар,Булут,' +
          'Бұлттар,Воблакі,Облак,Облака,Хмара,Үүл,Ամպ,וואלקן,ענן,' +
          'ابر,بادل,بدل,سحاب,ورېځ,ھەور,ܥܢܢܐ,' +
          'ढग,बादल,सुपाँय्,মেঘ,ਬੱਦਲ,વાદળ,முகில்,' +
          'మేఘం,മേഘം,เมฆ,སྤྲིན།,ღრუბელი,ᎤᎶᎩᎸ,ᓄᕗᔭᖅ,云,雲,구름'
        ).split(',');

        nums.forEach((n) => {
          words.forEach((w) => {
            list.push([w, n]);
          });
        });

        return list;
      })(),
    };
  }

  beforeShow(state, nextState) {
    this.handleStateTransition(state, nextState);
  }

  beforeHide(state, nextState) {
    this.handleStateTransition(state, nextState);
  }

  handleStateTransition(state, nextState) {
    switch (nextState) {
      case this.app.UI_STATE_SOURCE_DIALOG:
        if (state === this.app.UI_STATE_ABOUT_DIALOG || state === this.app.UI_STATE_OPTION_DIALOG) {
          break;
        }
        this.drawIdleCloud();
        break;

      case this.app.UI_STATE_LOADING:
      case this.app.UI_STATE_WORKING:
        this.empty();
        break;
    }
  }

  handleEvent(evt) {
    switch (evt.type) {
      case 'resize':
        this.documentWidth = window.innerWidth;
        this.documentHeight = window.innerHeight;
        break;

      case 'wordclouddrawn':
        if (evt.detail && evt.detail.drawn) {
          break;
        }
        evt.preventDefault();
        break;

      case 'wordcloudstop':
        this.canvasElement.removeEventListener('wordclouddrawn', this);
        break;

      case 'mousemove': {
        const hw = this.documentWidth / 2;
        const hh = this.documentHeight / 2;
        const x = (-(hw - evt.pageX) / hw) * this.TILT_DEPTH;
        const y = ((hh - evt.pageY) / hh) * this.TILT_DEPTH;

        this.canvasElement.style[this.cssTransformProperty] =
          `scale(1.2) translateZ(0) rotateX(${y}deg) rotateY(${x}deg)`;
        break;
      }
    }
  }

  setDimension(width, height) {
    const el = this.canvasElement;
    const w = width || this.documentWidth;
    const h = height || this.documentHeight;
    el.setAttribute('width', String(w));
    el.setAttribute('height', String(h));
    this.element.style.marginLeft = `${-w / 2}px`;
    this.element.style.marginTop = `${-h / 2}px`;
  }

  draw(option) {
    if (this.app.DEBUG_LOG) {
      console.log('CanvasView::draw', option);
    }

    this.canvasElement.lang = '';
    this.hoverElement.setAttribute('hidden', '');
    option.hover = this.handleHover.bind(this);

    WordCloud(this.canvasElement, option);
  }

  handleHover(item, dimension) {
    const el = this.hoverElement;
    if (!item || !dimension) {
      el.setAttribute('hidden', '');
      return;
    }

    el.removeAttribute('hidden');
    el.style.left = `${dimension.x}px`;
    el.style.top = `${dimension.y}px`;
    el.style.width = `${dimension.w}px`;
    el.style.height = `${dimension.h}px`;

    this.hoverDimension = dimension;
    this.hoverLabelElement.setAttribute(
      'data-l10n-args',
      JSON.stringify({ word: item[0], count: item[1] })
    );
    __(this.hoverLabelElement);
  }

  drawIdleCloud() {
    const el = this.canvasElement;
    const width = this.documentWidth;
    const height = this.documentHeight;

    if (!('ontouchstart' in window)) {
      document.addEventListener('mousemove', this);
    }

    this.canvasElement.style[this.cssTransformProperty] = 'scale(1.2)';
    this.setDimension(width, height);

    this.idleOption.gridSize = Math.round((16 * width) / 1024);
    this.idleOption.weightFactor = (size) => (Math.pow(size, 2.3) * width) / 1024;

    el.lang = 'en';
    el.addEventListener('wordclouddrawn', this);

    WordCloud(el, this.idleOption);
    this.hoverElement.setAttribute('hidden', '');
  }

  empty() {
    document.removeEventListener('mousemove', this);
    this.canvasElement.style[this.cssTransformProperty] = '';

    WordCloud(this.canvasElement, {
      backgroundColor: 'transparent',
      list: [],
    });
  }
}

CanvasView.prototype.TILT_DEPTH = 10;
