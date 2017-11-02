class Context {
  constructor($canvasElement) {
    this.ctx = $canvasElement.getContext('2d');
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
      lineTo: (x, y) => this.ctx.lineTo(x, y),
      moveTo: (x, y) => this.ctx.moveTo(x, y),
      stroke: () => this.ctx.stroke(),
      rect: (x, y, width, height) => this.ctx.rect(x, y, width, height),
      clearRect: (x, y, width, height) =>
        this.ctx.clearRect(x, y, width, height),
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
