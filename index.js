(function () {
  'use strict';

  const options = {
    highlightType: 'semantics',
    containerId: '__element-highlighter-container',
    boxClass: '__element-highlighter-box',
    labelClass: '__element-highlighter-label',
    ignoreSelectors: `
      div:not(.grid):not(.unit):not(.embed), script, span, br,
      li:not(:first-child), dt:not(:first-child), dd:not(:nth-child(2)),
      p + p,
      blockquote + blockquote, blockquote + blockquote *,
      figure + figure, figure + figure *
    `,
    offsetBoxSelectors: `
      ol, dl,
      blockquote,
      main, article, section, aside, footer, nav
    `,
  };

  const styles = {
    container: `
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    `,
    containerChildren: `

    `,
    box: `
      position: absolute;
      outline: 2px solid {{color}};
      outline-offset: {{offset}}px;
    `,
    label: `
      left: 0;
      padding: .1em .3em;
      position: absolute;
      top: 0;
      z-index: 1000;
      background-color: {{color}};
      color: #fff;
      font: bold 1.1rem/1 Menlo, Consolas, monospace;
      text-shadow: 0 0 1px 1px #000;
    `,
  };

  const getRandomInt = function (min, max) {
    // The maximum is exclusive and the minimum is inclusive
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min)) + min;
  };

  const getRandomColor = function () {
    let colorValues = '0123456789abcdef';
    let randRed = colorValues[getRandomInt(0, colorValues.length)];
    let randGreen = colorValues[getRandomInt(0, colorValues.length)];
    let randBlue = colorValues[getRandomInt(0, colorValues.length)];

    return `#${randRed}${randGreen}${randBlue}`;
  };

  const css = function (styles, opts = {}) {
    Object.keys(opts).forEach((key) => {
      styles = styles.replace(new RegExp(`{{${key}}}`), opts[key]);
    });

    return styles.trim().replace(/\;\s*/g, ';').replace(/\:\s*/g, ':');
  };

  const getDocumentHeight = function () {
    return Math.max(
      document.documentElement.clientHeight,
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );
  };

  const freezeBodyWidth = function () {
    document.body.style.overflowX = 'hidden';
  };

  const createContainer = function () {
    let container = document.getElementById(options.containerId);

    if (!container) {
      container = document.createElement('div');
      container.id = options.containerId;
      container.setAttribute('style', css(styles.container));
      container.style.height = `${getDocumentHeight()}px`;
      document.body.appendChild(container);
    }

    return container;
  };

  const createBox = function (elem, color, offset = 0) {
    const box = document.createElement('div');

    box.setAttribute('style', css(styles.box, {
      color: color,
      offset: offset,
    }));
    box.style.top = `${elem.offsetTop}px`;
    box.style.left = `${elem.offsetLeft}px`;
    box.style.width = `${elem.offsetWidth}px`;
    box.style.height = `${elem.offsetHeight}px`;
    box.classList.add(options.boxClass);

    return box;
  };

  const createLabel = function (elem, color, offset = 0) {
    const label = document.createElement('span');

    label.setAttribute('style', css(styles.label, {
      color: color,
    }));
    label.innerText = elem.tagName.toUpperCase();
    label.classList.add(options.labelClass);

    if (offset > 0) {
      label.style.left = 'auto';
      label.style.right = `-${offset}px`;
      label.style.top = `-${offset}px`;
    }

    return label;
  };

  const highlightElem = function (elem, container, offset) {
    const color = getRandomColor();
    const box = createBox(elem, color, offset);
    const label = createLabel(elem, color, offset);

    box.appendChild(label);
    container.appendChild(box);
  };

  const highlightSemantics = function () {
    const container = createContainer();
    const allElems = document.querySelectorAll('body *');

    for (let elem of allElems) {
      const offset = (elem.matches(options.offsetBoxSelectors)) ? 2 : 0;

      if (!elem.matches(options.ignoreSelectors)) {
        highlightElem(elem, container, offset);
      }
    }
  };

  const findHighlightType = function () {
    const userHighlightTypeElem = document.querySelector('[data-element-highlighter]');
    let highlightType = options.highlightType;

    if (userHighlightTypeElem && userHighlightTypeElem.dataset.elementHighlighter) {
      highlightType = userHighlightTypeElem.dataset.elementHighlighter;
    }

    return highlightType;
  };

  const init = function () {
    const highlightType = findHighlightType();

    freezeBodyWidth();

    if (highlightType.indexOf('semantics') > -1) highlightSemantics();
  };

  const whenDocumentIsReady = function (next) {
    const waitImgs = document.querySelectorAll('img, picture');
    const waitMedia = document.querySelectorAll('video, audio');
    let totalListeners = 2 + waitImgs.length + waitMedia.length;
    let checker;

    window.addEventListener('load', () => totalListeners--);
    document.fonts.ready.then(() => totalListeners--);

    for (let elem of waitImgs) {
      elem.addEventListener('load', () => requestAnimationFrame(() => totalListeners--));
    }

    for (let elem of waitMedia) {
      elem.addEventListener('loadedmetadata', () => requestAnimationFrame(() => totalListeners--));
    }

    checker = setInterval(() => {
      if (totalListeners <= 0) {
        clearInterval(checker);
        return next();
      }
    }, 75);
  };

  whenDocumentIsReady(init);
}());
