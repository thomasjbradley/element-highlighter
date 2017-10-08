(function () {
  'use strict';

  const config = {
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
      main:not(.unit), article:not(.unit), section:not(.unit), aside:not(.unit), footer:not(.unit), nav:not(.unit),
      .grid, .embed
    `,
  };

  const styles = {
    container: `
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    `,
    box: `
      position: absolute;
      outline: 2px solid {{color}};
      outline-offset: {{offset}}px;
    `,
    label: `
      padding: .1em .3em;
      position: absolute;
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
    let container = document.getElementById(config.containerId);

    if (!container) {
      container = document.createElement('div');
      container.id = config.containerId;
      container.setAttribute('style', css(styles.container));
      container.style.height = `${getDocumentHeight()}px`;
      document.body.appendChild(container);
    }

    return container;
  };

  const createBox = function (elem, color, opts = {}) {
    const box = document.createElement('div');

    box.setAttribute('style', css(styles.box, {
      color: color,
      offset: (opts.offset) ? opts.offset : 0,
    }));
    box.style.top = `${elem.offsetTop}px`;
    box.style.left = `${elem.offsetLeft}px`;
    box.style.width = `${elem.offsetWidth}px`;
    box.style.height = `${elem.offsetHeight}px`;
    box.classList.add(config.boxClass);

    return box;
  };

  const createLabel = function (elem, color, opts = {}) {
    const label = document.createElement('span');
    let labelCoords = {
      top: elem.offsetTop,
      left: elem.offsetLeft,
      right: document.documentElement.clientWidth - (elem.offsetLeft + elem.offsetWidth),
    };

    label.setAttribute('style', css(styles.label, {
      color: color,
    }));
    label.classList.add(config.labelClass);

    if (opts.labelText) {
      label.innerText = (typeof opts.labelText === 'function') ? opts.labelText(elem) : opts.labelText;
    } else {
      label.innerText = elem.tagName.toUpperCase();
    }

    if (opts.offset && opts.offset > 0) {
      labelCoords.top -= opts.offset;
      labelCoords.right -= opts.offset;
      label.style.top = `${labelCoords.top}px`;
      label.style.right = `${labelCoords.right}px`;
    } else {
      label.style.top = `${labelCoords.top}px`;
      label.style.left = `${labelCoords.left}px`;
    }

    return label;
  };

  const highlightElem = function (elem, container, opts = {}) {
    const color = getRandomColor();
    const box = createBox(elem, color, opts);
    const label = createLabel(elem, color, opts);

    container.appendChild(label);
    container.appendChild(box);
  };

  const highlightElements = function (elems, opts = {}) {
    const container = createContainer();

    for (let elem of elems) {
      opts.offset = (elem.matches(config.offsetBoxSelectors)) ? 2 : 0;

      if (!elem.matches(config.ignoreSelectors)) {
        highlightElem(elem, container, opts);
      }
    }
  };

  const highlightByClassList = function (classes, labelTextDef) {
    if (!labelTextDef) labelTextDef = (elem) => '.' + [].filter.call(elem.classList, (cls) => classes.indexOf(cls) > -1).join(' .');

    highlightElements(document.querySelectorAll(`.${classes.join(',.')}`), {
      labelText: labelTextDef,
    });
  };

  const highlightSemantics = function () {
    highlightElements(document.querySelectorAll('body *'));
  };

  const highlightModules = function () {
    highlightByClassList(['img-flex']);
    highlightByClassList(['list-group', 'list-group-inline']);
    highlightByClassList(['btn', 'btn-ghost', 'btn-light']);
    highlightByClassList(['embed', 'embed-16by9', 'embed-1by1', 'embed-4by3', 'embed-iso216', 'embed-3by2', 'embed-2by3', 'embed-golden', 'embed-16by9', 'embed-185by100', 'embed-24by10', 'embed-3by1', 'embed-4by1', 'embed-5by1']);
    highlightByClassList(['media', 'media-img', 'media-body', 'media-img-reversed', 'media-img-stacked']);
  };

  const highlightGrids = function () {
    highlightByClassList(['grid']);
    highlightByClassList(['unit'], (elem) => {
      let matchingClasses = [].filter.call(elem.classList, (cls) => {
        if (cls === 'unit') return true;
        if (/^unit\-\d/.test(cls)) return true;
        return /^[a-z]{1,2}\-\d+(\-\d+)?$/i.test(cls);
      });

      return '.' + matchingClasses.join(' .');
    });
  };

  const findHighlightType = function () {
    const userHighlightTypeElem = document.querySelector('[data-element-highlighter]');
    let highlightType = config.highlightType;

    if (userHighlightTypeElem && userHighlightTypeElem.dataset.elementHighlighter) {
      highlightType = userHighlightTypeElem.dataset.elementHighlighter;
    }

    return highlightType;
  };

  const init = function () {
    const highlightType = findHighlightType();

    freezeBodyWidth();

    if (highlightType.indexOf('semantic') > -1) highlightSemantics();
    if (highlightType.indexOf('module') > -1) highlightModules();
    if (highlightType.indexOf('grid') > -1) highlightGrids();
  };

  const whenDocumentIsReady = function (next) {
    const waitImgs = document.querySelectorAll('img, picture');
    const waitMedia = document.querySelectorAll('video, audio');
    let totalListeners = 2 + waitImgs.length + waitMedia.length;
    let checker, finalChecker;

    finalChecker = setTimeout(() => next(), 4000);

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
        clearTimeout(finalChecker);
        return next();
      }
    }, 75);
  };

  whenDocumentIsReady(init);
}());
