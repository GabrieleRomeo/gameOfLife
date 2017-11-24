import {
  MathFloor,
  getRandomInt,
  is,
  isDefined,
  isColor,
  randomRGBA,
  flatten,
} from './utilities';
import Pixel from './Pixel';
import Animation from './Animation';
import BufferWorker from './workers/Buffer.worker';

const isCanvas = is('HTMLCanvasElement');
const isObj = is('Object');
const isNumber = is('Number');
const isBoolean = is('Boolean');
const isInteger = x => is('Number')(x) && parseInt(x, 10) === x;
const isInTheRange = (min = 0, max) => x => min >= x && x <= max;
const isGreatherThan = y => x => x > y;
const evaluateRules = (rules, value) =>
  rules.reduce((r, check) => {
    const test = check(value);
    return r && test;
  }, true);

const minWidth = 300;
const minHeight = 100;

const canvasWidthMinValue = 200;
const canvasHeightMinValue = 200;

const baseConfig = {
  canvas: {
    width: {
      defaultValue: 800,
      minValue: canvasWidthMinValue,
      rules: [isInteger],
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
  },
  pixel: {
    height: {
      defaultValue: 10,
      rules: [isInteger, isInTheRange(1, 10)],
    },
    width: {
      defaultValue: 10,
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
};

const evaluateResult = (
  defaultValue,
  minValue,
  maxValue = Number.MAX_SAFE_INTEGER,
) => userValue => {
  // Take the evaluation only for numerical datatype
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
const validateConfig = (base, config, target = {}) =>
  Object.keys(base).reduce((result, prop) => {
    const subObject = base[prop];

    if (isDefined(subObject.defaultValue)) {
      const { defaultValue, minValue, maxValue } = subObject;
      const rEval = evaluateResult(defaultValue, minValue, maxValue);
      const userValue = config[prop];
      const isValid = evaluateRules(subObject.rules, userValue);
      result[prop] = isValid ? userValue : rEval(userValue);
    } else if (!isObj(subObject)) {
      result[prop] = subObject;
    } else {
      result[prop] = {};
      Object.keys(subObject).forEach(innerProp => {
        const innerValue = base[prop][innerProp];
        if (!isObj(innerValue)) {
          result[prop][innerProp] = innerValue;
        } else {
          // The value actually is an Object
          const { defaultValue, minValue, maxValue } = base[prop][innerProp];
          const userValue = config[prop][innerProp];
          const rEval = evaluateResult(defaultValue, minValue, maxValue);
          const isValid = evaluateRules(innerValue.rules, userValue);

          result[prop][innerProp] = isValid ? userValue : rEval(userValue);
        }
      });
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

const initCanvas = ($element, ctx) => {
  const $canvas = isCanvas($element) ? $element : createNewCanvas();
  const $canvasWidth = $canvas.width;
  const $canvasHeight = $canvas.height;
  const { width, height } = ctx.config.canvas;
  const { fullScreen } = ctx.config;
  let finalWidth = minWidth;
  let finalHeight = minHeight;

  /*
   * The rules used to define the final Canvas' size are the following ones
   * (in order of priority) :
   *   [1] - `fullScreen` option set to true
   *   [2] - Width & height in the config object
   *   [3] - Width & height parameter used to define the HTML canvas element
   *   [4] - minWidth & minHeight is no one of the previous option has been used
   *
   */

  // Define Width
  if (isDefined(width) && isNumber(width)) {
    if (width > minWidth) {
      finalWidth = width;
    }
  } else if ($canvasWidth >= minWidth) {
    finalWidth = $canvasWidth;
  }

  // Define Height
  if (isDefined(height) && isNumber(height)) {
    if (height > minHeight) {
      finalHeight = height;
    }
  } else if ($canvasHeight > minHeight) {
    finalHeight = $canvasHeight;
  }

  // If the fullScreen option has been used, it wins
  if (isDefined(fullScreen) && fullScreen === true) {
    finalWidth = window.innerWidth;
    finalHeight = window.innerHeight;
  }

  $canvas.width = finalWidth;
  $canvas.height = finalHeight;

  return $canvas;
};

const initBuffer = ctx => {
  const { $canvas } = ctx;
  const { pixel, randomPixels } = ctx.config;

  const cols = MathFloor($canvas.width / pixel.width);
  const rows = MathFloor($canvas.height / pixel.height);

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

const drawPixels = (anim, pixels, pixelConfig) => {
  let i = pixels.length || 0;
  // eslint-disable-next-line no-cond-assign
  while ((i -= 1)) {
    const { x, y } = pixels[i];
    // eslint-disable-next-line no-param-reassign
    pixelConfig.bgcolor = randomRGBA();
    const pixel = new Pixel(x, y, pixelConfig);
    pixel.render(anim);
  }
};

class GameOfLife {
  constructor($canvas, config) {
    const self = this;
    let fps = 0;

    this.pixels = [];
    this.test = flatten(validateConfig(baseConfig, config));
    this.config = validateConfig(baseConfig, config);
    this.$canvas = initCanvas($canvas, this);
    this.buffer = initBuffer(this);

    this.animation = new Animation(this.$canvas);

    drawGrid(
      this.animation,
      this.buffer.cols,
      this.buffer.rows,
      this.config.pixel,
    );

    this.animation.setStage(function animationLoop() {
      const anim = this;

      // update pixels and matrix
      bufferWorker.postMessage({
        buffer: self.buffer,
      });

      if (anim.getFrame() % 10 === 0) {
        fps = anim.getFps();
      }

      bufferWorker.onmessage = event => {
        // clear the canvas
        anim.clear();

        drawGrid(anim, event.data.cols, event.data.rows, self.config.pixel);
        // draw Pixels
        drawPixels(anim, event.data.pixels, self.config.pixel);
        // Update the Buffer
        self.buffer.pixels = event.data.pixels;
        self.buffer.matrix = event.data.matrix;
      };

      drawFps(anim, fps);
    });
  }

  /*
   * ||||
   * ||||
   * ||||
   * ||||
   * With
   * ‘x’ = the row number (i.e. height or distance from the top of the Matrix)
   * ‘y’ the column number (i.e. width or distance from the left of the Matrix)
   * Then to get the index (x, y) use the below formula:
   *    pixels[x][y] = 1d[ y + x * Total_number_of_columns_in_the_matrix ]
   * x = 1
   * y = 3
   * 3 + (1 * 4)
  */

  toDataURL() {
    return this.canvas.toDataURL();
  }

  setRandomPixelColor() {
    const { randomColors } = this.config.pixel.randomColors;
    this.config.pixel.randomColors = !randomColors;
  }

  start() {
    drawPixels(this.animation, this.buffer.pixels, this.config.pixel);
    this.animation.start();
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
