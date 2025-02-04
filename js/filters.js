// filters.js
// Contains functions to handle filters and checks

export function convertImageToGrayscale(ctx, width, height) {
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const gray = 0.3 * r + 0.59 * g + 0.11 * b;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  ctx.putImageData(imageData, 0, 0);
}

export function applyBoxBlur(ctx, width, height, radius) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tempData = new Uint8ClampedArray(data);

  function getIndex(x, y) {
    return (y * width + x) * 4;
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let totalR = 0,
        totalG = 0,
        totalB = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          const idx = getIndex(nx, ny);
          totalR += tempData[idx];
          totalG += tempData[idx + 1];
          totalB += tempData[idx + 2];
          count++;
        }
      }
      const i = getIndex(x, y);
      data[i] = totalR / count;
      data[i + 1] = totalG / count;
      data[i + 2] = totalB / count;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function isGrayscale(r, g, b, tolerance) {
  const maxVal = Math.max(r, g, b);
  const minVal = Math.min(r, g, b);
  return maxVal - minVal <= tolerance;
}

// Brightness/Contrast Adjustment
export function adjustBrightnessContrast(
  ctx,
  width,
  height,
  brightness,
  contrast,
) {
  // brightness: -100 to 100
  // contrast: -100 to 100
  // normalize to scale: brightness adds to all, contrast changes slope
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;

  // convert contrast percentage to factor
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    // apply brightness/contrast on each channel
    data[i] = clamp(contrastFactor * (data[i] - 128) + 128 + brightness);
    data[i + 1] = clamp(
      contrastFactor * (data[i + 1] - 128) + 128 + brightness,
    );
    data[i + 2] = clamp(
      contrastFactor * (data[i + 2] - 128) + 128 + brightness,
    );
  }

  ctx.putImageData(imageData, 0, 0);
}

// Gamma Correction
export function applyGammaCorrection(ctx, width, height, gamma) {
  let imageData = ctx.getImageData(0, 0, width, height);
  let data = imageData.data;
  const invGamma = 1.0 / gamma;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(Math.pow(data[i] / 255, invGamma) * 255);
    data[i + 1] = clamp(Math.pow(data[i + 1] / 255, invGamma) * 255);
    data[i + 2] = clamp(Math.pow(data[i + 2] / 255, invGamma) * 255);
  }

  ctx.putImageData(imageData, 0, 0);
}

// Sharpening Filter
export function applySharpen(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const tempData = new Uint8ClampedArray(data);

  // Simple sharpen kernel
  //  0  -1   0
  // -1   5  -1
  //  0  -1   0

  function getIndex(x, y) {
    return (y * width + x) * 4;
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sumR = 0,
        sumG = 0,
        sumB = 0;

      // center pixel
      let idx = getIndex(x, y);
      sumR += tempData[idx] * 5;
      sumG += tempData[idx + 1] * 5;
      sumB += tempData[idx + 2] * 5;

      // up
      idx = getIndex(x, y - 1);
      sumR += tempData[idx] * -1;
      sumG += tempData[idx + 1] * -1;
      sumB += tempData[idx + 2] * -1;

      // down
      idx = getIndex(x, y + 1);
      sumR += tempData[idx] * -1;
      sumG += tempData[idx + 1] * -1;
      sumB += tempData[idx + 2] * -1;

      // left
      idx = getIndex(x - 1, y);
      sumR += tempData[idx] * -1;
      sumG += tempData[idx + 1] * -1;
      sumB += tempData[idx + 2] * -1;

      // right
      idx = getIndex(x + 1, y);
      sumR += tempData[idx] * -1;
      sumG += tempData[idx + 1] * -1;
      sumB += tempData[idx + 2] * -1;

      // place new pixel
      idx = getIndex(x, y);
      data[idx] = clamp(sumR);
      data[idx + 1] = clamp(sumG);
      data[idx + 2] = clamp(sumB);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// Otsu's Threshold computation for adaptive thresholding
export function applyOtsuThreshold(imageData) {
  // compute histogram
  const data = imageData.data;
  const hist = new Array(256).fill(0);
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    const val = data[i]; // assuming grayscale
    hist[val]++;
    total++;
  }

  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let mB, mF;
  let maxVar = 0;
  let threshold = 0;

  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;
    sumB += i * hist[i];
    mB = sumB / wB;
    mF = (sum - sumB) / wF;
    let varBetween = wB * wF * (mB - mF) * (mB - mF);
    if (varBetween > maxVar) {
      maxVar = varBetween;
      threshold = i;
    }
  }

  return threshold;
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}
