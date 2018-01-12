import { copy } from './utilities';

const baseConfig = {
  height: 0,
  width: 0,
  bgcolor: '#000',
};

class Pixel {
  constructor(x = 0, y = 0, config) {
    this.x = x;
    this.y = y;
    this.config = copy({}, baseConfig, config);
  }
  activate() {
    this.state = 1;
  }
  deActivate() {
    this.state = 0;
  }
  render(animation) {
    const context = animation.getContext();
    const w = this.config.width;
    const h = this.config.height;
    context.save();
    context.fillStyle(this.config.bgcolor);
    context.fillRect(this.x * w, this.y * h, w, h);
    context.restore();
    animation.renderOnCanvas();
  }
}

export default Pixel;
