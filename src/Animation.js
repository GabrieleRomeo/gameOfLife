import Context from './Context';
/**
 * Class for animation.
 * Revised version of the animation.js by Eric Rowell
 *
 * @class      Animation (name)
 */
class Animation {
  /**
   * Create an Animation
   * @param {number} $canvasElement - The HTML canvas object
   */
  constructor($canvasElement) {
    this.$canvasElement = $canvasElement;
    this.context = Context($canvasElement);
    this.t = 0;
    this.timeInterval = 0;
    this.startTime = 0;
    this.lastTime = 0;
    this.frame = 0;
    this.animating = false;

    window.requestAnimationFrame = (callback => {
      return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        (() => window.setTimeout(callback, 1000 / 60))
      );
    })();
  }
  /**
   * Get the Canvas element.
   * @return {HTMLCanvasElement} The Canvas element.
   */
  getCanvas() {
    return this.$canvasElement;
  }
  /**
   * Get the Canvas's context object.
   * @return {Context} The context object.
   */
  getContext() {
    return this.context;
  }
  /**
   * Clear the Canvas
   * @return {void}
   */
  clear() {
    this.context.clearRect(
      0,
      0,
      this.$canvasElement.width,
      this.$canvasElement.height,
    );
  }
  /**
   * Set the function that will execute for each animation frame
   * @param {Function} The stage function
   */
  setStage(stage) {
    this.stage = stage;
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
    this.frame++;
    const date = new Date();
    const time = date.getTime();

    this.timeInterval = time - this.lastTime;
    this.t += this.timeInterval;

    if (this.stage !== undefined) {
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
