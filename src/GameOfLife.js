import {
  MathFloor,
  maxNum,
  getRandomInt,
  randomRGBA,
  deepMerge,
  curry,
  $,
  $new,
  $clone,
} from './utilities';
import {
  isDefined,
  isInteger,
  isInTheRange,
  isInTheBody,
  isString,
  isBoolean,
  isNumber,
  isCanvas,
  isGreatherThan,
  isColor,
} from './is';
import { validateConfig } from './configValidator';
import Pixel from './Pixel';
import Animation from './Animation';
import BufferWorker from './workers/Buffer.worker';

const canvasWidthMinValue = 200;
const canvasHeightMinValue = 200;

const cssNamespace = 'gofl';

const baseConfig = {
  selectors: Object.freeze({
    gofl: `.${cssNamespace}`,
    timeFrame: `#${cssNamespace}__timeFrame`,
  }),
  canvas: {
    width: {
      defaultValue: 800,
      minValue: canvasWidthMinValue,
      rules: [isInteger, isGreatherThan(canvasWidthMinValue)],
    },
    height: {
      defaultValue: 500,
      minValue: canvasHeightMinValue,
      rules: [isInteger, isGreatherThan(canvasHeightMinValue)],
    },
    fullScreen: {
      defaultValue: false,
      rules: [isBoolean],
    },
    showGrid: {
      defaultValue: true,
      rules: [isBoolean],
    },
    showGridAtStartup: {
      defaultValue: false,
      rules: [isBoolean],
    },
    showFps: {
      defaultValue: false,
      rules: [isBoolean],
    },
  },
  pixel: {
    height: {
      defaultValue: 10,
      minValue: 1,
      rules: [isInteger, isInTheRange(1, 10)],
    },
    width: {
      defaultValue: 10,
      minValue: 1,
      rules: [isInteger, isInTheRange(1, 10)],
    },
    bgcolor: {
      defaultValue: `#000`,
      rules: [isColor],
    },
    randomColors: {
      defaultValue: false,
      rules: [isBoolean],
    },
  },
  randomPixels: {
    defaultValue: 1000,
    rules: [isInteger, isInTheRange(0, 10)],
  },
  timeFrame: {
    record: {
      defaultValue: false,
      rules: [isBoolean],
    },
    show: {
      defaultValue: false,
      rules: [isBoolean],
    },
    $element: {
      defaultValue: () => {
        const selector = baseConfig.selectors.timeFrame;
        let $element = $(selector);
        if (!isDefined($element)) {
          $element = $new('DIV');
        }
        return $element;
      },
      rules: [isInTheBody],
    },
    useSnapshots: {
      defaultValue: false,
      rules: [isBoolean],
    },
    snapshots: {
      scale: {
        defaultValue: 0.3,
        minValue: 0.1,
        rules: [isNumber, isInTheRange(0.1, maxNum)],
      },
      quality: {
        defaultValue: 0.9,
        minValue: 0.1,
        maxValue: 1,
        rules: [isNumber, isInTheRange(0.1, 1)],
      },
    },
  },
  splash: {
    showSplash: {
      defaultValue: true,
      rules: [isBoolean],
    },
    text: {
      defaultValue: 'The Game of Life',
      rules: [isString],
    },
    useMusicEffect: {
      defaultValue: true,
      rules: [isBoolean],
    },
    musicEffect: {
      path: {
        defaultValue: 'public/light-bulb.wav',
        rules: [isString],
      },
    },
  },
};

const bufferWorker = new BufferWorker();

const generateRndPixels = (length, rows, cols, pxConfig = baseConfig.pixel) => {
  const matrix = new Uint32Array(cols * rows);
  const pixels = [];

  // eslint-disable-next-line no-cond-assign
  for (let i = length; (i -= 1); ) {
    const x = getRandomInt(cols + 1);
    const y = getRandomInt(rows + 1);
    pixels.push(new Pixel(x, y, pxConfig));
    matrix[x + y * cols] = 1;
  }

  return {
    matrix,
    pixels,
  };
};

const validateRndNumber = (length = baseConfig.randomPixels, rows, cols) => {
  const num = isNumber(length) ? length : 1;
  const totCells = rows * cols;
  let minPixels = totCells * 10 / 100;
  const percentage = num * 100 / totCells;

  // If the config value is lesser then 10% of the total amount of cells
  // set it as 10%
  if (percentage < 10) {
    minPixels = num;
  } else if (percentage > 100) {
    // If the choosed value is greater than 100% use 100%
    minPixels = totCells;
  }

  return Math.floor(minPixels);
};

const initCanvas = ($element, config) => {
  const $canvas = isCanvas($element) ? $element : $new('CANVAS', document.body);
  const { width, height, fullScreen } = config.canvas;
  const $canvasWidth = parseInt($canvas.getAttribute('width'), 10);
  const $canvasHeight = parseInt($canvas.getAttribute('height'), 10);
  const hasMinimumWidth = isGreatherThan(canvasWidthMinValue);
  const hasMinimumHeight = isGreatherThan(canvasHeightMinValue);
  let finalWidth = width;
  let finalHeight = height;

  /*
   * The rules used to define the final Canvas' size are as follow:
   * (in order of priority) :
   *   [1] - `fullScreen` option
   *   [2] - Width & height parameter used to define the HTML canvas element
   *   [3] - Width & height defined into the canvas config object
   *
   */

  if (!Number.isNaN($canvasWidth) && hasMinimumWidth($canvasWidth)) {
    finalWidth = $canvasWidth;
  }

  if (!Number.isNaN($canvasHeight) && hasMinimumHeight($canvasHeight)) {
    finalHeight = $canvasHeight;
  }

  // If fullScreen is defined, use it
  if (isDefined(fullScreen) && fullScreen === true) {
    finalWidth = window.innerWidth;
    finalHeight = window.innerHeight;
  }

  $canvas.width = finalWidth;
  $canvas.height = finalHeight;

  return $canvas;
};

const getBlurValue = blur => {
  const { userAgent } = navigator;
  if (userAgent && userAgent.indexOf('Firefox/4') !== -1) {
    const kernelSize = blur < 8 ? blur / 2 : Math.sqrt(blur * 2);
    const blurRadius = Math.ceil(kernelSize);
    return blurRadius * 2;
  }
  return blur;
};

const createInterlace = (size, color1, color2) => {
  const proto = $new('canvas').getContext('2d');
  proto.canvas.width = size * 2;
  proto.canvas.height = size * 2;
  proto.fillStyle = color1; // top-left
  proto.fillRect(0, 0, size, size);
  proto.fillStyle = color2; // top-right
  proto.fillRect(size, 0, size, size);
  proto.fillStyle = color2; // bottom-left
  proto.fillRect(0, size, size, size);
  proto.fillStyle = color1; // bottom-right
  proto.fillRect(size, size, size, size);
  const pattern = proto.createPattern(proto.canvas, 'repeat');
  pattern.data = proto.canvas.toDataURL();
  return pattern;
};

const getMetrics = (text, font) => {
  const op8x8 = createInterlace(8, '#FFF', '#eee');
  const image = $new('IMG');
  image.width = 42;
  image.height = 1;
  image.src = op8x8.data;
  image.style.cssText = 'display: inline';
  let metrics = $('#metrics');
  const parent = isDefined(metrics) ? metrics.firstChild : $new('SPAN');
  if (isDefined(metrics)) {
    metrics.style.cssText = 'display: block';
    parent.firstChild.textContent = text;
  } else {
    // setting up html used for measuring text-metrics
    parent.appendChild(document.createTextNode(text));
    parent.appendChild(image);
    metrics = $new('div');
    metrics.id = 'metrics';
    metrics.appendChild(parent);
    document.body.insertBefore(metrics, document.body.firstChild);
  }

  // direction of the text
  const { direction } = window.getComputedStyle(document.body, '');

  // getting css equivalent of ctx.measureText()
  parent.style.cssText = `font:${font}; white-space: nowrap; display: inline;`;

  const width = parent.offsetWidth;
  const height = parent.offsetHeight;

  // capturing the "top" and "bottom" baseline
  parent.style.cssText = `font:${font}; white-space: nowrap; display: block;`;
  const top = image.offsetTop;
  const bottom = top - height;

  // capturing the "middle" baseline
  parent.style.cssText = `font:${font};
                          white-space: nowrap;
                          line-height: 0;
                          display: block;`;
  const middle = image.offsetTop + 1;

  // capturing "1em"
  parent.style.cssText = `font:${font}; white-space: nowrap; height: 1em;
  display: block;`;
  parent.firstChild.textContent = '';
  const em = parent.offsetHeight;

  // cleanup
  metrics.style.display = 'none';

  return {
    direction,
    top,
    em,
    middle,
    bottom,
    height,
    width,
  };
};

function neonLightEffect($canvas, text) {
  const ctx = $canvas.getContext('2d');
  const cnvW = $canvas.width;
  const cnvH = $canvas.height;
  const font = '70px "Holtwood One SC", Futura, Helvetica, sans-serif';
  const jitter = 25; // the distance of the maximum jitter
  let offsetX = cnvW / 2;
  let offsetY = cnvH / 2;
  const blur = getBlurValue(100);
  // save state
  ctx.save();
  ctx.font = font;

  // calculate width + height of text-block
  const metrics = getMetrics(text, font);

  offsetX -= metrics.width / 2;
  offsetY -= metrics.height;
  // create clipping mask around text-effect
  ctx.rect(
    offsetX - blur / 2,
    offsetY - blur / 2,
    offsetX + metrics.width + blur,
    metrics.height + blur,
  );
  ctx.clip();
  // create shadow-blur to mask rainbow onto
  // (since shadowColor doesn't accept gradients)
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,1)';
  ctx.shadowOffsetX = metrics.width + blur;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = blur;
  ctx.fillText(text, -metrics.width + offsetX - blur, offsetY + metrics.top);
  ctx.restore();
  // create the rainbow linear-gradient
  const gradient = ctx.createLinearGradient(0, 0, metrics.width, 0);
  gradient.addColorStop(0, 'rgba(255, 0, 0, 1)');
  gradient.addColorStop(0.15, 'rgba(255, 255, 0, 1)');
  gradient.addColorStop(0.3, 'rgba(0, 255, 0, 1)');
  gradient.addColorStop(0.5, 'rgba(0, 255, 255, 1)');
  gradient.addColorStop(0.65, 'rgba(0, 0, 255, 1)');
  gradient.addColorStop(0.8, 'rgba(255, 0, 255, 1)');
  gradient.addColorStop(1, 'rgba(255, 0, 0, 1)');
  // change composite so source is applied within the shadow-blur
  ctx.globalCompositeOperation = 'source-atop';
  // apply gradient to shadow-blur
  ctx.fillStyle = gradient;
  ctx.fillRect(
    offsetX - jitter - 30,
    offsetY - 30,
    metrics.width + offsetX + 100,
    metrics.height + offsetY + 100,
  );
  // change composite to mix as light
  ctx.globalCompositeOperation = 'lighter';
  // multiply the layer
  ctx.globalAlpha = 0.7;
  ctx.drawImage(ctx.canvas, 0, 0);
  ctx.drawImage(ctx.canvas, 0, 0);
  ctx.globalAlpha = 1;
  // draw white-text ontop of glow
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillText(text, offsetX, offsetY + metrics.top);
  // created jittered stroke
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  let i = 10;

  // eslint-disable-next-line no-cond-assign
  while ((i -= 1)) {
    const left = jitter / 2 - Math.random() * jitter;
    const top = jitter / 2 - Math.random() * jitter;
    ctx.strokeText(text, left + offsetX, top + offsetY + metrics.top);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.20)';
  ctx.strokeText(text, offsetX, offsetY + metrics.top);
  ctx.restore();
}

const initSplash = ($splash, $canvas, config) => {
  const { text, useMusicEffect, musicEffect } = config.splash;
  const parent = $canvas.parentNode;
  const container = $new('DIV', parent);

  container.setAttribute('style', 'position:relative');
  $canvas.setAttribute('style', 'z-index:0');
  $splash.setAttribute('style', 'position:absolute;top:0;z-index:10');
  $splash.classList.add(`${cssNamespace}__animation`);

  // When necessary, use the music effect
  if (useMusicEffect === true) {
    const audio = $new('AUDIO', document.body);
    const source = $new('SOURCE', audio);
    audio.setAttribute('autoplay', '');
    source.setAttribute('src', `${musicEffect.path}`);
  }

  container.appendChild($splash);
  container.appendChild($canvas);

  neonLightEffect($splash, text);
};

const initColsRows = ctx => {
  const configCopy = deepMerge({}, ctx.config);
  const { $canvas } = ctx;
  const { pixel } = ctx.config;

  const cols = MathFloor($canvas.width / pixel.width);
  const rows = MathFloor($canvas.height / pixel.height);

  // Add cols and rows to the new config object
  configCopy.canvas.cols = cols;
  configCopy.canvas.rows = rows;

  return configCopy;
};

const initBuffer = config => {
  const { cols, rows } = config.canvas;
  const { pixel, randomPixels } = config;

  const numOfPixels = validateRndNumber(randomPixels, rows, cols);
  const { pixels, matrix } = generateRndPixels(numOfPixels, rows, cols, pixel);

  return {
    pixels,
    matrix,
    cols,
    rows,
  };
};

const drawGrid = (anim, cols, rows, pixelConfig) => {
  const context = anim.getContext();
  const minY = 0;
  const maxYrows = cols * pixelConfig.height;
  const maxYcols = rows * pixelConfig.height;
  const minX = 0;
  const iStrokeWidth = 1;
  const iTranslate = (iStrokeWidth % 2) / 2;

  // Draw ROWS
  for (let r = 1; r < rows; r += 1) {
    context.translate(iTranslate, 0);
    context.save();
    context.beginPath();
    context.strokeStyle('rgba(0, 0, 0, 1)');
    context.moveTo(minX, r * pixelConfig.height);
    context.lineTo(maxYrows, r * pixelConfig.height);
    context.lineWidth(iStrokeWidth);
    context.stroke();
    context.restore();

    // reset the translation back to zero
    context.translate(-iTranslate, 0);
  }

  // Draw COLUMNS
  for (let c = 1; c < cols; c += 1) {
    context.translate(iTranslate, 0);
    context.save();
    context.beginPath();
    context.strokeStyle('rgba(0, 0, 0, 1)');
    context.moveTo(c * pixelConfig.width, minY);
    context.lineTo(c * pixelConfig.height, maxYcols);
    context.lineWidth(iStrokeWidth);
    context.stroke();
    context.restore();

    // reset the translation back to zero
    context.translate(-iTranslate, 0);
  }

  anim.renderOnCanvas();
};

const drawFps = (anim, fps) => {
  const context = anim.getContext();
  context.fillStyle('black');
  context.fillRect(context.canvas.width - 100, 0, 100, 30);
  context.font('13pt monospace');
  context.fillStyle('red');
  context.fillText(`fps: ${fps.toFixed(1)}`, context.canvas.width - 93, 22);
  anim.renderOnCanvas();
};

const drawPixels = (anim, pixels, config) => {
  const configCopy = deepMerge({}, config.pixel);
  const { randomColors, bgcolor } = config.pixel;
  let i = pixels.length || 0;
  // eslint-disable-next-line no-cond-assign
  while ((i -= 1)) {
    const { x, y } = pixels[i];
    configCopy.bgcolor = randomColors === true ? randomRGBA() : bgcolor;
    const pixel = new Pixel(x, y, configCopy);
    pixel.render(anim);
  }
};

const takeSnapshot = ($canvas, scale = 1, quality = 0.9) => {
  // const pixelRatio = window.devicePixelRatio || 1;
  const canvasCopy = document.createElement('CANVAS');
  const ctxCopy = canvasCopy.getContext('2d');
  const { height, width } = $canvas;

  canvasCopy.width = scale * width;
  canvasCopy.height = scale * height;

  canvasCopy.style.width = `${scale * width}px`;
  canvasCopy.style.height = `${scale * height}px`;

  ctxCopy.mozImageSmoothingEnabled = false;
  ctxCopy.imageSmoothingEnabled = false;

  ctxCopy.scale(scale, scale);

  ctxCopy.drawImage($canvas, 0, 0);

  return canvasCopy.toDataURL('image/png', quality);
};

const frameHelper = (anim, $canvas, config, pixels) => {
  const frame = {
    frame__number: anim.getFrame(),
    time: anim.getTime(),
    number_of_Cells: pixels.length,
  };
  const { scale, quality, useSnapshots } = config.timeFrame;

  if (useSnapshots === true) {
    frame.dataURL = takeSnapshot($canvas, scale, quality);
  }

  return frame;
};

const renderTimeFrame = ($element, step) => {
  const list = document.createElement('UL');
  list.classList.add(`${cssNamespace}__log-list`);
  Object.keys(step).forEach(property => {
    const value = `${step[property]}`;
    const item = document.createElement('LI');
    const keyDescription = document.createElement('SPAN');
    const valDescription = document.createElement('SPAN');

    item.classList.add(`${cssNamespace}__log-item`);
    keyDescription.classList.add(`${cssNamespace}__log-itemKey`);
    valDescription.classList.add(`${cssNamespace}__log-itemValue`);

    if (isDefined(value.match(/data:image\//))) {
      const img = document.createElement('IMG');
      img.classList.add(`${cssNamespace}__snapshot`);
      img.src = value;
      item.appendChild(img);
    } else {
      // Add key description
      keyDescription.textContent = property.split('_').join(' ');
      valDescription.append(value);

      // Append key and value descriptions to the item
      item.appendChild(keyDescription);
      item.appendChild(valDescription);
    }

    // Append the item to the list
    list.appendChild(item);
  });
  window.requestAnimationFrame(() => $element.appendChild(list));
};

const handleTimeFrame = (ctx, pixels) => {
  const { animation, $canvas, config, frames } = ctx;
  const { $element: $timeFrame } = config.timeFrame;
  const createFrame = curry(frameHelper)(animation, $canvas, config);
  const { record: recordFrames, show: showTimeFrame } = config.timeFrame;
  // When necessary, record frames and render them
  if (recordFrames === true) {
    const frame = createFrame(pixels);
    if (showTimeFrame === true) {
      renderTimeFrame($timeFrame, frame);
    }
    frames.push(frame);
  }
};

class GameOfLife {
  constructor($canvas, config) {
    const self = this;
    let fps = 0;

    this.pixels = [];
    this.config = validateConfig(baseConfig, config);
    this.$canvas = initCanvas($canvas, this.config);
    this.$splash = $clone(this.$canvas, 'gofl__splash');

    this.config = initColsRows(this);
    this.buffer = initBuffer(this.config);

    this.frames = [];
    this.animation = new Animation(this.$canvas);

    if (this.config.splash.showSplash === true) {
      initSplash(this.$splash, this.$canvas, this.config);
    }

    // When necessary, draw the grid at startup time
    if (this.config.canvas.showGridAtStartup === true) {
      drawGrid(
        this.animation,
        this.config.canvas.cols,
        this.config.canvas.rows,
        this.config.pixel,
      );
    }

    // Set the animation stage
    this.animation.setStage(function animationLoop() {
      const anim = this;
      const { showGrid, showFps, cols, rows } = self.config.canvas;

      if (anim.getFrame() % 10 === 0) {
        fps = anim.getFps();
      }

      // update pixels and matrix
      bufferWorker.postMessage({
        buffer: self.buffer,
      });

      bufferWorker.onmessage = event => {
        const { pixels, matrix } = event.data;

        // clear the canvas
        anim.clear();

        // draw Pixels
        drawPixels(anim, pixels, self.config);

        handleTimeFrame(self, pixels);

        if (showGrid === true) {
          drawGrid(anim, cols, rows, self.config.pixel);
        }

        if (showFps === true) {
          drawFps(anim, fps);
        }

        // Update the Buffer
        self.buffer.pixels = pixels;
        self.buffer.matrix = matrix;
      };
    });
  }

  toDataURL() {
    return this.canvas.toDataURL();
  }

  setRandomPixelColor() {
    const { randomColors } = this.config.pixel.randomColors;
    this.config.pixel.randomColors = !randomColors;
  }

  start() {
    // if the animation is not started yet
    if (this.animation.isAnimating() === false) {
      drawPixels(this.animation, this.buffer.pixels, this.config);
      handleTimeFrame(this, this.buffer.pixels);
      this.animation.start();
    }
  }
  pause() {
    this.animation.stop();
  }
  resume() {
    this.animation.start();
  }
  stop() {
    this.animation.stop();
  }
}

export default GameOfLife;
