// ui.js
// Handles attaching event listeners, updating UI elements, etc.

import {processAllImages} from './core.js';
import {convertImageToGrayscale, applyBoxBlur, adjustBrightnessContrast, applyGammaCorrection, applySharpen} from './filters.js';

const fileInput = document.getElementById('fileInput');
const batchDownloadBtn = document.getElementById('batchDownloadBtn');
const applyChangesBtn = document.getElementById('applyChangesBtn');
const imagesContainer = document.getElementById('imagesContainer');
const loadingText = document.getElementById('loadingText');

const toleranceRange = document.getElementById('toleranceRange');
const toleranceValue = document.getElementById('toleranceValue');
const thresholdMode = document.getElementById('thresholdMode');
const thresholdRange = document.getElementById('thresholdRange');
const thresholdValue = document.getElementById('thresholdValue');
const convertToGray = document.getElementById('convertToGray');
const applyBlurCheck = document.getElementById('applyBlur');
const makeTransparent = document.getElementById('makeTransparent');
const adaptiveThresholdSelect = document.getElementById('adaptiveThresholdSelect');
const thresholdContainer = document.getElementById('thresholdContainer');

const brightnessRange = document.getElementById('brightnessRange');
const brightnessValue = document.getElementById('brightnessValue');
const contrastRange = document.getElementById('contrastRange');
const contrastValue = document.getElementById('contrastValue');
const gammaRange = document.getElementById('gammaRange');
const gammaValue = document.getElementById('gammaValue');
const applySharpenCheck = document.getElementById('applySharpen');
const livePreview = document.getElementById('livePreview');

let originalImages = [];

toleranceRange.addEventListener('input', () => {
    toleranceValue.textContent = toleranceRange.value;
    triggerLiveUpdate();
});
thresholdRange.addEventListener('input', () => {
    thresholdValue.textContent = thresholdRange.value;
    triggerLiveUpdate();
});
brightnessRange.addEventListener('input', () => {
    brightnessValue.textContent = brightnessRange.value;
    triggerLiveUpdate();
});
contrastRange.addEventListener('input', () => {
    contrastValue.textContent = contrastRange.value;
    triggerLiveUpdate();
});
gammaRange.addEventListener('input', () => {
    gammaValue.textContent = gammaRange.value;
    triggerLiveUpdate();
});

thresholdMode.addEventListener('change', () => {
    updateThresholdUI();
    triggerLiveUpdate();
});
convertToGray.addEventListener('change', triggerLiveUpdate);
applyBlurCheck.addEventListener('change', triggerLiveUpdate);
makeTransparent.addEventListener('change', triggerLiveUpdate);
applySharpenCheck.addEventListener('change', triggerLiveUpdate);
adaptiveThresholdSelect.addEventListener('change', () => {
    updateThresholdUI();
    triggerLiveUpdate();
});
livePreview.addEventListener('change', () => {
    if (livePreview.checked) {
        reprocessImages();
    } else {
        applyChangesBtn.style.display = 'inline-block';
    }
});

document.querySelectorAll('input[name="transColor"]').forEach(radio => {
    radio.addEventListener('change', triggerLiveUpdate);
});

fileInput.addEventListener('change', () => {
    const files = fileInput.files;
    if (!files || files.length === 0) return;

    originalImages = [];
    imagesContainer.innerHTML = '';
    batchDownloadBtn.style.display = 'none';
    applyChangesBtn.style.display = 'none';

    let loadedCount = 0;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImages.push({ dataURL: e.target.result, filename: file.name });
            loadedCount++;
            if (loadedCount === files.length) {
                reprocessImages();
            }
        };
        reader.readAsDataURL(file);
    });
});

applyChangesBtn.addEventListener('click', () => {
    reprocessImages();
});

let livePreviewTimeout = null;
function triggerLiveUpdate() {
    if (livePreview.checked) {
        if (livePreviewTimeout) {
            clearTimeout(livePreviewTimeout);
        }
        livePreviewTimeout = setTimeout(() => {
            reprocessImages();
        }, 300);
    }
}

export function reprocessImages() {
    if (originalImages.length === 0) return;
    const options = {
        tol: parseInt(toleranceRange.value, 10),
        thresh: parseInt(thresholdRange.value, 10),
        useThreshold: thresholdMode.checked,
        doGray: convertToGray.checked,
        doBlur: applyBlurCheck.checked,
        doTransparent: makeTransparent.checked,
        transparencyColor: document.querySelector('input[name="transColor"]:checked').value,
        brightness: parseInt(brightnessRange.value, 10),
        contrast: parseInt(contrastRange.value, 10),
        gamma: parseFloat(gammaRange.value),
        applySharpen: applySharpenCheck.checked,
        adaptiveMethod: adaptiveThresholdSelect.value
    };

    processAllImages(originalImages, options, updateUI);
}

function updateUI(state, payload) {
    if (state === 'loading') {
        loadingText.style.display = payload ? 'block' : 'none';
    } else if (state === 'result') {
        const results = payload;
        imagesContainer.innerHTML = '';
        results.forEach(res => {
            const block = document.createElement('div');
            block.className = 'image-block';
            block.setAttribute('data-filename', res.filename);

            const perImageDownloadBtn = document.createElement('button');
            perImageDownloadBtn.className = 'download-btn';
            perImageDownloadBtn.textContent = 'Download Image';
            perImageDownloadBtn.addEventListener('click', () => {
                const link = document.createElement('a');
                link.download = `${res.filename}.png`;
                link.href = res.canvas.toDataURL('image/png');
                link.click();
            });

            // Add "Copy to Clipboard" button
            const copyToClipboardBtn = document.createElement('button');
            copyToClipboardBtn.className = 'download-btn';
            copyToClipboardBtn.textContent = 'Copy to Clipboard';
            copyToClipboardBtn.addEventListener('click', async () => {
                try {
                    res.canvas.toBlob(async (blob) => {
                        if (!blob) {
                            alert('Failed to copy image.');
                            return;
                        }
                        const item = new ClipboardItem({ [blob.type]: blob });
                        await navigator.clipboard.write([item]);
                        alert('Image copied to clipboard!');
                    });
                } catch (err) {
                    console.error(err);
                    alert('Failed to write to clipboard. Possibly unsupported browser or permissions denied.');
                }
            });

            block.appendChild(res.canvas);
            block.appendChild(perImageDownloadBtn);
            block.appendChild(copyToClipboardBtn);
            imagesContainer.appendChild(block);
        });
        batchDownloadBtn.style.display = 'inline-block';
        applyChangesBtn.style.display = livePreview.checked ? 'none' : 'inline-block';
    } else if (state === 'preprocess') {
        const {ctx, width, height, options} = payload;
        if (options.doGray) {
            convertImageToGrayscale(ctx, width, height);
        }
        if (options.doBlur) {
            applyBoxBlur(ctx, width, height, 1);
        }
        if (options.brightness !== 0 || options.contrast !== 0) {
            adjustBrightnessContrast(ctx, width, height, options.brightness, options.contrast);
        }
        if (options.gamma !== 1.0) {
            applyGammaCorrection(ctx, width, height, options.gamma);
        }
        if (options.applySharpen) {
            applySharpen(ctx, width, height);
        }
    }
}

function updateThresholdUI() {
    const method = adaptiveThresholdSelect.value;
    const shouldShow = (method === 'custom' && thresholdMode.checked);

    if (shouldShow) {
        thresholdContainer.style.display = 'block';
    } else {
        thresholdContainer.style.display = 'none';
    }
}

function resetUIToDefaults() {
    toleranceRange.value = 5; toleranceValue.textContent = '5';
    thresholdMode.checked = false;
    thresholdRange.value = 128; thresholdValue.textContent = '128';
    adaptiveThresholdSelect.value = 'custom';
    convertToGray.checked = false;
    applyBlurCheck.checked = false;
    brightnessRange.value = 0; brightnessValue.textContent = '0';
    contrastRange.value = 0; contrastValue.textContent = '0';
    gammaRange.value = 1.0; gammaValue.textContent = '1.0';
    applySharpenCheck.checked = false;
    makeTransparent.checked = false;
    document.querySelector('input[name="transColor"][value="black"]').checked = true;
    livePreview.checked = false;

    updateThresholdUI();
}

window.addEventListener('load', resetUIToDefaults);

export function getImages() {
    return originalImages;
}

// Add paste event listener for Ctrl+V
document.addEventListener('paste', (e) => {
    // Check if there's an image in the clipboard
    const items = e.clipboardData.items;
    let imageFound = false;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
            imageFound = true;
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (event) => {
                // Replace current images with this single pasted image
                originalImages = [{
                    dataURL: event.target.result,
                    filename: 'pasted_image.png'
                }];
                imagesContainer.innerHTML = '';
                batchDownloadBtn.style.display = 'none';
                applyChangesBtn.style.display = 'none';
                reprocessImages();
            };
            reader.readAsDataURL(file);
            break;
        }
    }

    if (!imageFound) {
        console.log('No image found in clipboard.');
        // You could alert the user, but silently ignoring is also fine.
    }
});
