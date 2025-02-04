// core.js
// Handles main image processing logic, loading images, and calling filters

import {
  isGrayscale,
  convertImageToGrayscale,
  applyBoxBlur,
  adjustBrightnessContrast,
  applyGammaCorrection,
  applySharpen,
  applyOtsuThreshold,
} from "./filters.js";

export function processAllImages(originalImages, options, updateUI) {
  updateUI("loading", true);

  let processedCount = 0;
  const results = [];

  originalImages.forEach((imgObj) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Preprocess steps
      updateUI("preprocess", {
        ctx,
        width: canvas.width,
        height: canvas.height,
        options,
      });

      // Create a mask of which pixels were originally grayscale
      let originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      let originallyGrayscaleMask = new Uint8Array(width * height);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = originalData.data[idx];
          const g = originalData.data[idx + 1];
          const b = originalData.data[idx + 2];
          originallyGrayscaleMask[y * width + x] = isGrayscale(
            r,
            g,
            b,
            options.tol,
          )
            ? 1
            : 0;
        }
      }

      // If adaptive threshold selected and threshold mode is enabled
      let adaptiveThreshold = null;
      if (options.useThreshold && options.adaptiveMethod === "otsu") {
        // Otsu works best on grayscale image data
        // If the user wants Otsu and the image isn't already grayscale, it's recommended to do grayscale pre-processing
        const preData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        adaptiveThreshold = applyOtsuThreshold(preData);
      }

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];

        if (isGrayscale(r, g, b, options.tol)) {
          let currentThreshold = options.thresh;
          if (adaptiveThreshold !== null) {
            currentThreshold = adaptiveThreshold;
          }

          if (options.useThreshold) {
            // threshold mode
            const grayVal = 0.3 * r + 0.59 * g + 0.11 * b;
            const newVal = grayVal < currentThreshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = newVal;

            // Only apply transparency if this pixel was originally grayscale
            if (options.doTransparent && originallyGrayscaleMask[i / 4] === 1) {
              if (options.transparencyColor === "black" && newVal === 0) {
                data[i + 3] = 0;
              } else if (
                options.transparencyColor === "white" &&
                newVal === 255
              ) {
                data[i + 3] = 0;
              } else {
                data[i + 3] = 255;
              }
            } else {
              data[i + 3] = 255;
            }
          } else {
            // inversion mode
            const avg = (r + g + b) / 3;
            const inverted = 255 - avg;
            const roundedInverted = Math.round(inverted);
            data[i] = data[i + 1] = data[i + 2] = inverted;

            // Only apply transparency if this pixel was originally grayscale
            if (options.doTransparent && originallyGrayscaleMask[i / 4] === 1) {
              if (
                options.transparencyColor === "black" &&
                roundedInverted === 0
              ) {
                data[i + 3] = 0;
              } else if (
                options.transparencyColor === "white" &&
                roundedInverted === 255
              ) {
                data[i + 3] = 0;
              } else {
                data[i + 3] = 255;
              }
            } else {
              data[i + 3] = 255;
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      results.push({ canvas, filename: `processed_${imgObj.filename}` });
      processedCount++;
      if (processedCount === originalImages.length) {
        updateUI("loading", false);
        updateUI("result", results);
      }
    };
    img.src = imgObj.dataURL;
  });
}
