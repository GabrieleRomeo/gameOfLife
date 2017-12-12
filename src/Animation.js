import Context from './Context';
import { copy } from './utilities';

const baseConfig = {};

/**
 * Class for animation.
 * Revised & improved version of the animation.js by Eric Rowell
 *
 * @class      Animation (name)
 */
class Animation {
  /**
   * Create an Animation
   * @param {number} $canvasElement - The HTML canvas object
   */
  constructor($onScreenCanvas, config = {}) {
    this.config = copy({}, baseConfig, config);
    this.canvas = $onScreenCanvas;
    this.context = new Context(this.canvas);
    this.t = 0;
    this.timeInterval = 0;
    this.startTime = 0;
    this.lastTime = 0;
    this.frame = 0;
    this.animating = false;

    window.requestAnimationFrame = (callback =>
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      (() => window.setTimeout(callback, 1000 / 60)))();
  }
  /**
   * Get the Canvas element.
   * @return {HTMLCanvasElement} The Canvas element.
   */
  getCanvas() {
    return this.$offScreenCanvas;
  }
  /**
   * Get the Canvas's context object.
   * @return {Context} The context object.
   */
  getContext() {
    return this.context.getContext();
  }
  /**
   * Clear the Canvas
   * @return {void}
   */
  clear() {
    this.context.clear();
  }
  /**
   * Set the function that will execute for each animation frame
   * @param {Function} The stage function
   */
  setStage(stage) {
    this.stage = stage;
  }
  /**
   * Handles the rendering on the canvas
   * @returns {void}
   */
  renderOnCanvas() {
    this.context.renderOnCanvas();
  }
  /**
   * Get the animation's state
   * @param {Boolean} True if the animation is running, False otherwise
   */
  isAnimating() {
    return this.animating;
  }
  /**
   * Get the frame number
   * @returns {Number} the frame number
   */
  getFrame() {
    return this.frame;
  }
  /**
   * Get the running time (in milliseconds) of the animation
   * @returns {Number} the time (in milliseconds) that animation has been
   *                   running
   */
  getTime() {
    return this.t;
  }
  /**
   * Get the time (in milliseconds) between the last frame and current one
   * @returns {Number} the time (in milliseconds) between the last frame and
   *                   current frame
   */
  getTimeInterval() {
    return this.timeInterval;
  }
  /**
   * Get the current FPS
   * @returns {Number} the current frame per second of the animation
   */
  getFps() {
    return this.timeInterval > 0 ? 1000 / this.timeInterval : 0;
  }

  /**
   * Handles the animation loop
   * @returns {void}
   */
  animationLoop() {
    this.frame += 1;
    const date = new Date();
    const time = date.getTime();

    this.timeInterval = time - this.lastTime;
    this.t += this.timeInterval;

    if (this.stage !== undefined && this.animating === true) {
      this.stage();
    }

    if (this.animating) {
      requestAnimationFrame(() => this.animationLoop());
    }
  }
  /**
   * Starts the animation
   * @returns {void}
   */
  start() {
    this.animating = true;
    this.startTime = new Date().getTime();
    this.lastTime = this.startTime;

    if (this.stage !== undefined) {
      this.stage();
    }

    this.animationLoop();
  }
  /**
   * Stops the animation
   * @returns {void}
   */
  stop() {
    this.animating = false;
  }
}

export default Animation;
