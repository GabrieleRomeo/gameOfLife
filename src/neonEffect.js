import { $, $new, gcss } from './utilities';
import { isDefined } from './is';

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

export const neonLightEffect = ($canvas, strTxt, config) => {
  const { fontFamily, fontSize, isUpperCase } = config.splash;
  const $canvasCSS = gcss($canvas);
  const $canvasBorder = Number.parseInt($canvasCSS('border-width'), 10) || 0;
  const $canvasPadding = Number.parseInt($canvasCSS('padding-width'), 10) || 0;
  const minRatio = 1.5;
  const ctx = $canvas.getContext('2d');
  const cnvWidth = $canvas.width;
  const cnvHeight = $canvas.height;
  let font = `${fontSize}px ${fontFamily}`;
  const jitter = 25; // the distance of the maximum jitter
  let offsetX = cnvWidth / 2;
  let offsetY = cnvHeight / 2;
  const blur = getBlurValue(100);
  const text = isUpperCase === true ? strTxt.toUpperCase() : strTxt;

  // calculate width + height of text-block
  let metrics = getMetrics(text, font);
  const { width: fontWidth } = metrics;
  const textRatio = cnvWidth / fontWidth;

  // The the splash's text ratio must be equal or greater than the minRatio
  if (textRatio < minRatio) {
    font = `${fontSize * textRatio / minRatio}px ${fontFamily}`;
    metrics = getMetrics(text, font);
  }

  offsetX -= metrics.width / 2 - $canvasBorder - $canvasPadding;
  offsetY -= metrics.height - $canvasBorder - $canvasPadding;

  const metricsY = offsetY + metrics.top;

  // save state
  ctx.save();
  ctx.font = font;

  // create clipping mask around text-effect
  ctx.rect(
    offsetX - blur / 4,
    offsetY - blur - jitter,
    offsetX + metrics.width,
    metrics.height + blur + jitter + 20,
  );
  ctx.clip();
  // create shadow-blur to mask rainbow onto
  // (since shadowColor doesn't accept gradients)
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,1)';
  ctx.shadowOffsetX = metrics.width + blur + 30;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = blur;
  ctx.fillText(text, -metrics.width + offsetX - blur, metricsY);
  ctx.restore();
  // create the rainbow linear-gradient
  const gradient = ctx.createLinearGradient(
    0,
    0,
    metrics.width + offsetX - blur,
    0,
  );
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
    offsetX - jitter,
    offsetY - jitter - blur,
    metrics.width + offsetX + 120,
    metrics.height + offsetY + jitter,
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
  ctx.fillText(text, offsetX, metricsY);
  // created jittered stroke
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  let i = 10;

  // eslint-disable-next-line no-cond-assign
  while ((i -= 1)) {
    const left = jitter / 2 - Math.random() * jitter;
    const top = jitter / 2 - Math.random() * jitter;
    ctx.strokeText(text, left + offsetX, top + metricsY);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.20)';
  ctx.strokeText(text, offsetX, metricsY);
  ctx.restore();
};
