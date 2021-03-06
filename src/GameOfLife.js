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
  $css,
} from './utilities';
import {
  isDefined,
  safeisNaN,
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
import { neonLightEffect } from './neonEffect';
import { validateConfig } from './configValidator';
import Pixel from './Pixel';
import Animation from './Animation';
import BufferWorker from './workers/Buffer.worker';

const canvasWidthMinValue = 200;
const canvasHeightMinValue = 200;

const nameSpace = 'gofl';

const baseConfig = {
  selectors: Object.freeze({
    gofl: `.${nameSpace}`,
    timeFrame: `#${nameSpace}__timeFrame`,
    frameList: `#${nameSpace}__frameList`,
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
        const selector = baseConfig.selectors.frameList;
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
        defaultValue: 0.5,
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
    fontFamily: {
      defaultValue: 'Arial Black',
      rules: [isString],
    },
    fontSize: {
      defaultValue: 70,
      rules: [isInteger],
    },
    isUpperCase: {
      defaultValue: true,
      rules: [isBoolean],
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
      volume: {
        defaultValue: 0.3,
        minValue: 0.1,
        maxValue: 1,
        rules: [isNumber, isInTheRange(0.1, 1)],
      },
    },
  },
};

const bufferWorker = new BufferWorker();

/**
 * Generates a list of random pixels
 *
 * @param      {number}  length  The length
 * @param      {number}  rows    The rows
 * @param      {number}  cols    The cols
 * @param      {Object}  config  The Pixel's configuration object
 * @return     {Object}  An Object containing a Matrix and a list of Pixels
 */
const generateRndPixels = (length, rows, cols, config) => {
  const matrix = new Uint32Array(cols * rows);
  const pixels = [];

  // eslint-disable-next-line no-cond-assign
  for (let i = length; (i -= 1); ) {
    const x = getRandomInt(cols + 1);
    const y = getRandomInt(rows + 1);
    pixels.push(new Pixel(x, y, config));
    matrix[x + y * cols] = 1;
  }

  return {
    matrix,
    pixels,
  };
};

/**
 * Checks if the number of random pixels defined within the config object is
 * valid.
 *
 * @param      {number}  length  The length of random pixels
 * @param      {number}  rows    The number of rows
 * @param      {number}  cols    The number of cols
 * @return     {number}  The minimum number of random pixels
 */
const validateRndNumber = (length, rows, cols) => {
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

/**
 * Initializes the primary canvas element
 *
 * @param      {HTMLCanvasElement}    $element  The canvas element
 * @param      {Object}    config    The configuration object
 * @return     {HTMLCanvasElement}  The initialized canvas HTML element
 */
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

  if (!safeisNaN($canvasWidth) && hasMinimumWidth($canvasWidth)) {
    finalWidth = $canvasWidth;
  }

  if (!safeisNaN($canvasHeight) && hasMinimumHeight($canvasHeight)) {
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

/**
 * Initializes the splash canvas element and calls the neon effect
 *
 * @param      {HTMLCanvasElement}  $splash  The splash canvas
 * @param      {HTMLCanvasElement}  $canvas  The canvas element
 * @param      {Object}  config   The configuration object
 * @return     {undefined}
 */
const initSplash = ($splash, $canvas, config) => {
  const { text, useMusicEffect, musicEffect } = config.splash;
  const parent = $canvas.parentNode;
  const container = $new('DIV', parent);

  container.setAttribute('style', 'position:relative');
  $canvas.setAttribute('style', 'z-index:0');
  $splash.setAttribute('style', 'position:absolute;top:0;z-index:10');
  $splash.classList.add(`${nameSpace}__animation`);

  // When necessary, use the music effect
  if (useMusicEffect === true) {
    const audio = $new('AUDIO', document.body);
    const source = $new('SOURCE', audio);
    audio.setAttribute('autoplay', '');
    audio.volume = musicEffect.volume;
    source.setAttribute('src', `${musicEffect.path}`);
  }

  container.appendChild($splash);
  container.appendChild($canvas);

  neonLightEffect($splash, text, config);
};

/**
 * Calculates the number of cols and rows the canvas contains and add the
 * information to the main confing object
 *
 * @param      {Object}    ctx     The gameOfLife context
 * @return     {Object}  An augmented copy of the config object containing the
 *                       estimated number of cols and rows
 */
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

/**
 * Initilizes a Buffer containing the following information: a Matrix,
 * a list of Pixels, the number of rows and cols of the Matrix
 *
 * @param      {Object}  config  The configuration object
 * @return     {Object}  A Buffer Object
 */
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

/**
 * Draws a grid on a Canvas
 *
 * @param      {Object}  anim         The animation object
 * @param      {number}  cols         The cols
 * @param      {number}  rows         The rows
 * @param      {Object}  pixelConfig  The pixel configuration
 * @return     {undefined}
 */
const drawGrid = (anim, cols, rows, pixelConfig) => {
  const context = anim.getContext();
  const minY = 0;
  const maxYrows = cols * pixelConfig.height;
  const maxYcols = rows * pixelConfig.height;
  const minX = 0;
  const iStrokeWidth = 1;
  const iTranslate = (iStrokeWidth % 2) / 2;
  let r = rows;
  let c = cols;

  // Draw ROWS
  // eslint-disable-next-line no-cond-assign
  while ((r -= 1)) {
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
  // eslint-disable-next-line no-cond-assign
  while ((c -= 1)) {
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

/**
 * Draws fps on a Canvas
 *
 * @param      {Object}  anim    The animation Object
 * @param      {(number|string)}  fps     The fps value
 * @return     {undefined}
 */
const drawFps = (anim, fps) => {
  const context = anim.getContext();
  context.fillStyle('black');
  context.fillRect(context.canvas.width - 100, 0, 100, 30);
  context.font('13pt monospace');
  context.fillStyle('red');
  context.fillText(`fps: ${fps.toFixed(1)}`, context.canvas.width - 93, 22);
  anim.renderOnCanvas();
};

/**
 * Draws pixels on a Canvas
 *
 * @param      {Object}  anim    The animation Object
 * @param      {Array}  pixels  A list of pixels
 * @param      {Object}  config  The configuration Object
 * @return     {undefined}
 */
const drawPixels = (anim, pixels, config) => {
  const { randomColors, bgcolor: configColor, width, height } = config.pixel;
  let i = pixels.length || 0;
  // eslint-disable-next-line no-cond-assign
  while ((i -= 1)) {
    const { x, y } = pixels[i];
    const bgcolor = randomColors === true ? randomRGBA() : configColor;
    const pixel = new Pixel(x, y, { bgcolor, width, height });
    pixel.render(anim);
  }
};

/**
 * Takes a snapshoot a particular canvas and returns an Image
 *
 * @param      {HTMLCanvasElement}  $canvas  The canvas element
 * @param      {number}  [scale]    The scale value
 * @param      {number}  [quality ] The quality value
 * @return     {Promise}   A promise
 */
const takeSnapshot = ($canvas, scale = 1, quality = 0.9) =>
  new Promise((resolve, reject) => {
    const newImg = $new('IMG');
    const canvasCopy = $new('CANVAS');
    const ctxCopy = canvasCopy.getContext('2d');
    const { height, width } = $canvas;
    const scaledWidth = scale * width;
    const scaledHeight = scale * height;

    canvasCopy.width = scaledWidth;
    canvasCopy.height = scaledHeight;

    canvasCopy.style.width = `${scaledWidth}px`;
    canvasCopy.style.height = `${scaledHeight}px`;

    ctxCopy.imageSmoothingEnabled = false;

    ctxCopy.scale(scale, scale);

    ctxCopy.drawImage($canvas, 0, 0);

    try {
      canvasCopy.toBlob(
        blob => {
          const url = URL.createObjectURL(blob);
          newImg.onload = () => URL.revokeObjectURL(url);
          newImg.src = url;
          newImg.classList.add(`${nameSpace}__snapshot`);
        },
        'image/jpeg',
        quality,
      );
    } catch (error) {
      reject(error);
    }

    resolve(newImg);
  });

/**
 * An Helper function which is used to define the items that are used to compose
 * the timeFrame HTML element
 *
 * @param      {Object}  anim     The animation Object
 * @param      {HTMLCanavasElement}  $canvas  The canvas element
 * @param      {Object}  config   The configuration Object
 * @param      {Array}  pixels   The pixels Object
 * @return     {Object}  An Object containing an HTML list and a Frame Object
 */
const frameHelper = (anim, $canvas, config, pixels) => {
  // Define the frame Object
  const frame = {
    frame__number: anim.getFrame(),
    time: anim.getTime(),
    number_of_Cells: pixels.length,
  };
  const { useSnapshots } = config.timeFrame;
  const { scale, quality } = config.timeFrame.snapshots;

  const list = $new('UL');
  const frameNumberItem = $new('LI');
  const timeItem = $new('LI');
  const numberOfCellItem = $new('LI');
  const screenShotItem = $new('LI');

  // Set CSS classes
  // to LIST
  list.classList.add(`${nameSpace}__log-list`);
  // to ITEMS
  frameNumberItem.classList.add(`${nameSpace}__log-item`);
  timeItem.classList.add(`${nameSpace}__log-item`);
  numberOfCellItem.classList.add(`${nameSpace}__log-item`);
  screenShotItem.classList.add(`${nameSpace}__log-item`);

  // Define items' content
  frameNumberItem.innerHTML = `<span class="${nameSpace}__log-itemKey">
                                Frame Number
                              </span>
                              <span class="${nameSpace}__log-itemValue">
                              ${frame.frame__number}
                             </span>`;

  timeItem.innerHTML = `<span class="${nameSpace}__log-itemKey">
                                Time
                              </span>
                              <span class="${nameSpace}__log-itemValue">
                              ${frame.time}
                             </span>`;

  numberOfCellItem.innerHTML = `<span class="${nameSpace}__log-itemKey">
                                Number Of Cells
                              </span>
                              <span class="${nameSpace}__log-itemValue">
                              ${frame.number_of_Cells}
                             </span>`;

  if (useSnapshots === true) {
    takeSnapshot($canvas, scale, quality).then(
      img => screenShotItem.appendChild(img),
      reason => console.error('Something went wrong', reason),
    );
  }

  // Append all the children to the list
  list.appendChild(frameNumberItem);
  list.appendChild(numberOfCellItem);
  list.appendChild(timeItem);
  list.appendChild(screenShotItem);

  return {
    frame,
    list,
  };
};

/**
 * Handles the timeFrame element
 *
 * @param      {Object}  ctx     The gameOfLife context
 * @param      {Array}  pixels  The list of pixels
 * @return     {undefined}
 */
const handleTimeFrame = (ctx, pixels) => {
  const { animation, $canvas, config, frames, timeFrame } = ctx;
  const createFrame = curry(frameHelper)(animation, $canvas, config);
  const { record: recordFrames, show: showTimeFrame } = config.timeFrame;
  const lastFrame = frames[frames.length - 1];
  // When necessary, record frames and render them
  if (recordFrames === true) {
    const { frame, list } = createFrame(pixels);
    // When the current frame is equal to the last one, simply skip
    if (
      isDefined(lastFrame) &&
      (frame.frame__number === lastFrame.frame__number &&
        frame.time === lastFrame.time &&
        frame.number_of_Cells === lastFrame.number_of_Cells)
    ) {
      return;
    }
    if (showTimeFrame === true && isDefined(list)) {
      window.requestAnimationFrame(() => timeFrame.appendChild(list));
    }
    frames.push(frame);
  }
};

/** Class representing the Game of life. */
class GameOfLife {
  /**
   * Create a Game of Life
   * @param {HTMLCanvasElement} $canvas - The main canvas element
   * @param {Object} [config] - An optional configuration object
   */
  constructor($canvas, config) {
    const self = this;
    let fps = 0;

    this.pixels = [];
    this.config = validateConfig(baseConfig, config);
    this.$canvas = initCanvas($canvas, this.config);
    this.$splash = $clone(this.$canvas, 'gofl__splash');
    this.$splashCSS = $css(this.$splash);

    this.config = initColsRows(this);
    this.buffer = initBuffer(this.config);

    this.frames = [];
    this.timeFrame = document.createDocumentFragment();
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
        anim.frame += 1;

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

  /**
   * Set the pixels' color to a random value
   * @return {undefined}
   */
  setRandomPixelColor() {
    const { randomColors } = this.config.pixel.randomColors;
    this.config.pixel.randomColors = !randomColors;
  }

  /**
   * Starts the Game
   * @return {undefined}
   */
  start() {
    // if the animation is not started yet
    if (this.isAnimating() === false) {
      // hide the splash canvas by removing its animation class and by setting
      // its opacity to zero
      this.$splash.classList.remove(`${nameSpace}__animation`);
      this.$splashCSS('opacity', 0);
      drawPixels(this.animation, this.buffer.pixels, this.config);
      handleTimeFrame(this, this.buffer.pixels);
      this.animation.start();
    }
  }

  /**
   * Returns the animation's status
   * @return {Boolean} True if the animation is running, False otherwise
   */
  isAnimating() {
    return this.animation.isAnimating();
  }

  /**
   * Pauses the Game
   * @return {undefined}
   */
  pause() {
    if (this.isAnimating() === true) {
      // show the splash canvas
      this.$splashCSS('opacity', 0.1);
      this.animation.stop();
    }
  }

  /**
   * Resumes a paused Game
   * @return {undefined}
   */
  resume() {
    if (this.isAnimating() === false) {
      // hide the splash canvas
      this.$splashCSS('opacity', 0);
      this.animation.start();
    }
  }

  /**
   * Stops a Game
   * @return {undefined}
   */
  stop() {
    if (this.isAnimating() === true) {
      this.animation.stop();
      const { $element: $frameList } = this.config.timeFrame;
      // when the frameList contains a least one child append it to
      if (this.timeFrame.childElementCount > 0) {
        $frameList.innerHTML = '';
        window.requestAnimationFrame(() => {
          $frameList.appendChild(this.timeFrame);
          $frameList.parentNode.setAttribute('style', 'visibility:visible');
        });
      }
    }
  }

  /**
   * Sets the record config value. If True the system starts record on the
   * timeFrame
   * @param {boolean} value - True for start recording.
   * @return {undefined}
   */
  startRecording(value) {
    if (isBoolean(value)) {
      this.config.timeFrame.record = value;
    }
  }
}

export default GameOfLife;
