class Context {
  constructor($canvas) {
    this.canvas = $canvas;
    this.context = this.canvas.getContext('2d');
    this.$offScreenCanvas = this.canvas.cloneNode();
    this.ctx = this.$offScreenCanvas.getContext('2d');
    this.calls = [];
    this.initMethods();
  }
  initMethods() {
    const methods = {
      save: () => this.ctx.save(),
      restore: () => this.ctx.restore(),
      fill: () => this.ctx.fill(),
      fillStyle: style => {
        this.ctx.fillStyle = style;
      },
      font: style => {
        this.ctx.font = style;
      },
      lineTo: (x, y) => this.ctx.lineTo(x, y),
      lineWidth: width => {
        this.ctx.lineWith = width;
      },
      moveTo: (x, y) => this.ctx.moveTo(x, y),
      stroke: () => this.ctx.stroke(),
      rect: (x, y, width, height) => this.ctx.rect(x, y, width, height),
      clearRect: (x, y, width, height) =>
        this.ctx.clearRect(x, y, width, height),
      fillRect: (x, y, width, height) => this.ctx.fillRect(x, y, width, height),
      fillText: (txt, x, y, maxWidth) => this.ctx.fillText(txt, x, y, maxWidth),
    };

    const scope = this;
    const addMethod = (name, method) => {
      scope[name] = (...args) => {
        scope.record(name, args);
        method.apply(scope, args);
      };
    };

    Object.entries(methods).forEach(entry => {
      const [name, method] = entry;
      addMethod(name, method);
    });
  }

  clear() {
    this.clearRect(
      0,
      0,
      this.$offScreenCanvas.width,
      this.$offScreenCanvas.height,
    );
    this.context.clearRect(
      0,
      0,
      this.$offScreenCanvas.width,
      this.$offScreenCanvas.height,
    );
  }

  getContext() {
    return this;
  }
  getCanvas() {
    return this.$offScreenCanvas;
  }

  /**
   * Handles the rendering on a visible canvas. If the argument
   * @param {HTMLCanvasElement} The resulting canvas
   * @returns {void}
   */
  renderOnCanvas(canvas) {
    this.context.drawImage(canvas || this.$offScreenCanvas, 0, 0);
  }

  assign(k, v) {
    this.ctx[k] = v;
  }
  record(methodName, args) {
    this.calls.push({ name: methodName, args });
  }
  getCalls() {
    return this.calls;
  }
}

export default Context;
