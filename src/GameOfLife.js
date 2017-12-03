import {
  MathFloor,
  getRandomInt,
  is,
  isDefined,
  isColor,
  randomRGBA,
  deepMerge,
  curry,
} from './utilities';
import Pixel from './Pixel';
import Animation from './Animation';
import BufferWorker from './workers/Buffer.worker';

const minNum = Number.MIN_SAFE_INTEGER;
const maxNum = Number.MAX_SAFE_INTEGER;

const isCanvas = is('HTMLCanvasElement');
const isObj = is('Object');
const isNumber = is('Number');
const isBoolean = is('Boolean');
const isFunction = is('Function');

const isInteger = x => is('Number')(x) && parseInt(x, 10) === x;
const isInTheRange = (min = 0, max) => x => x >= min && x <= max;
const isGreatherThan = y => x => x > y;
const evaluateRules = (rules, value) =>
  rules.reduce((r, check) => {
    const test = check(value);
    return r && test;
  }, true);

// const minWidth = 300;
// const minHeight = 100;

const canvasWidthMinValue = 200;
const canvasHeightMinValue = 200;

const baseConfig = {
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
      defaultValue: true,
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
      defaultValue: x => document.querySelector(x || '#goflTimeFrame'),
      rules: [isDefined],
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
};

const setMinMaxRange = (defaultValue, minValue, maxValue) => userValue => {
  // Do the evaluation only for numerical datatype
  if (!isNumber(defaultValue)) {
    return defaultValue;
  }

  let result;
  if (userValue < minValue) {
    result = minValue;
  } else if (userValue > maxValue) {
    result = maxValue;
  } else {
    result = defaultValue;
  }
  return result;
};

/* eslint-disable no-param-reassign */
const validateConfig = (base, config = {}, target = {}) =>
  Object.keys(base).reduce((result, prop) => {
    const subItem = base[prop];
    const { defaultValue: subValue, rules = [] } = subItem;

    // When the item contains a default value it means that it's a leaf
    if (isDefined(subValue)) {
      const defaultValue = isFunction(subValue) ? subValue() : subValue;
      const { minValue, maxValue } = subItem;
      const setRange = setMinMaxRange(defaultValue, minValue, maxValue);
      const userValue =
        isDefined(config) && isDefined(config[prop])
          ? config[prop]
          : defaultValue;
      const isValid = evaluateRules(rules, userValue);
      result[prop] = isValid ? userValue : setRange(userValue);
      // If the default value has a number data type, and minValue or maxValue
      // has been defined for the current property, use them (if any) or set
      // them as the minimum or maximum safe number respectively
      if (
        isNumber(defaultValue) &&
        (isDefined(minValue) || isDefined(maxValue))
      ) {
        result[`${prop}_min`] = minValue || minNum;
        result[`${prop}_max`] = maxValue || maxNum;
      }
    } else if (!isObj(subItem)) {
      result[prop] = subItem;
    } else {
      // When the subItem is an Object itself
      // Use recursion to iterate its items
      result[prop] = validateConfig(subItem, config[prop], result[prop]);
    }

    return result;
  }, target);
/* eslint-enable no-param-reassign */

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

const createNewCanvas = () => {
  const $canvas = document.createElement('CANVAS');
  document.body.appendChild($canvas);
  return $canvas;
};

const initCanvas = ($element, config) => {
  const $canvas = isCanvas($element) ? $element : createNewCanvas();
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
  const maxY = cols * pixelConfig.height;
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
    context.lineTo(maxY, r * pixelConfig.height);
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
    context.lineTo(c * pixelConfig.height, maxY);
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
  context.font('18pt Calibri');
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
  list.classList.add('gameOfLifeLog__list');
  Object.keys(step).forEach(property => {
    const value = `${step[property]}`;
    const item = document.createElement('LI');
    const keyDescription = document.createElement('SPAN');
    const valDescription = document.createElement('SPAN');

    item.classList.add('gameOfLifeLog__item');
    keyDescription.classList.add('gameOfLifeLog__itemKey');
    valDescription.classList.add('gameOfLifeLog__itemValue');

    if (isDefined(value.match(/data:image\//))) {
      const img = document.createElement('IMG');
      img.classList.add('gameOfLife__snapshot');
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

    this.config = initColsRows(this);
    this.buffer = initBuffer(this.config);

    this.frames = [];
    this.$timeFrame = document.querySelector('#gofTimeFrame');

    this.animation = new Animation(this.$canvas);
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
