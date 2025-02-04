// ui.js
import { processAllImages } from "./core.js";
import {
  convertImageToGrayscale,
  applyBoxBlur,
  adjustBrightnessContrast,
  applyGammaCorrection,
  applySharpen,
} from "./filters.js";

// ---------------------------------
// DOM-Elemente selektieren
// ---------------------------------
const fileInput = document.getElementById("fileInput");
const batchDownloadBtn = document.getElementById("batchDownloadBtn");
const applyChangesBtn = document.getElementById("applyChangesBtn");
const imagesContainer = document.getElementById("imagesContainer");
const loadingText = document.getElementById("loadingText");

const toleranceRange = document.getElementById("toleranceRange");
const toleranceValue = document.getElementById("toleranceValue");
const thresholdMode = document.getElementById("thresholdMode");
const thresholdRange = document.getElementById("thresholdRange");
const thresholdValue = document.getElementById("thresholdValue");
const convertToGray = document.getElementById("convertToGray");
const applyBlurCheck = document.getElementById("applyBlur");
const blurRadiusRange = document.getElementById("blurRadiusRange");
const blurRadiusValue = document.getElementById("blurRadiusValue");

const makeTransparent = document.getElementById("makeTransparent");
const adaptiveThresholdSelect = document.getElementById(
  "adaptiveThresholdSelect",
);
const thresholdContainer = document.getElementById("thresholdContainer");

const brightnessRange = document.getElementById("brightnessRange");
const brightnessValue = document.getElementById("brightnessValue");
const contrastRange = document.getElementById("contrastRange");
const contrastValue = document.getElementById("contrastValue");
const gammaRange = document.getElementById("gammaRange");
const gammaValue = document.getElementById("gammaValue");
const applySharpenCheck = document.getElementById("applySharpen");
const livePreview = document.getElementById("livePreview");

// Profile-spezifische Felder
const profileNameInput = document.getElementById("profileNameInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const loadProfileBtn = document.getElementById("loadProfileBtn");
const profileSelect = document.getElementById("profileSelect");

let originalImages = [];

// ---------------------------------
// Event-Listener für die Regler etc.
// ---------------------------------
toleranceRange.addEventListener("input", () => {
  toleranceValue.textContent = toleranceRange.value;
  triggerLiveUpdate();
});
thresholdRange.addEventListener("input", () => {
  thresholdValue.textContent = thresholdRange.value;
  triggerLiveUpdate();
});
blurRadiusRange.addEventListener("input", () => {
  blurRadiusValue.textContent = blurRadiusRange.value;
  triggerLiveUpdate();
});
brightnessRange.addEventListener("input", () => {
  brightnessValue.textContent = brightnessRange.value;
  triggerLiveUpdate();
});
contrastRange.addEventListener("input", () => {
  contrastValue.textContent = contrastRange.value;
  triggerLiveUpdate();
});
gammaRange.addEventListener("input", () => {
  gammaValue.textContent = gammaRange.value;
  triggerLiveUpdate();
});

thresholdMode.addEventListener("change", () => {
  updateThresholdUI();
  triggerLiveUpdate();
});
convertToGray.addEventListener("change", triggerLiveUpdate);
applyBlurCheck.addEventListener("change", triggerLiveUpdate);
makeTransparent.addEventListener("change", triggerLiveUpdate);
applySharpenCheck.addEventListener("change", triggerLiveUpdate);
adaptiveThresholdSelect.addEventListener("change", () => {
  updateThresholdUI();
  triggerLiveUpdate();
});
livePreview.addEventListener("change", () => {
  if (livePreview.checked) {
    reprocessImages();
  } else {
    applyChangesBtn.style.display = "inline-block";
  }
});
document.querySelectorAll('input[name="transColor"]').forEach((radio) => {
  radio.addEventListener("change", triggerLiveUpdate);
});

// ---------------------------------
// Datei-Upload
// ---------------------------------
fileInput.addEventListener("change", () => {
  const files = fileInput.files;
  if (!files || files.length === 0) return;

  originalImages = [];
  imagesContainer.innerHTML = "";
  batchDownloadBtn.style.display = "none";
  applyChangesBtn.style.display = "none";

  let loadedCount = 0;
  Array.from(files).forEach((file) => {
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

applyChangesBtn.addEventListener("click", () => {
  reprocessImages();
});

// ---------------------------------
// Live-Preview-Logik
// ---------------------------------
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

// ---------------------------------
// Haupt-Funktion: Neu verarbeiten
// ---------------------------------
export function reprocessImages() {
  if (originalImages.length === 0) return;

  const options = {
    tol: parseInt(toleranceRange.value, 10),
    thresh: parseInt(thresholdRange.value, 10),
    useThreshold: thresholdMode.checked,
    doGray: convertToGray.checked,
    doBlur: applyBlurCheck.checked,
    blurRadius: parseInt(blurRadiusRange.value, 10),
    doTransparent: makeTransparent.checked,
    transparencyColor: document.querySelector(
      'input[name="transColor"]:checked',
    ).value,
    brightness: parseInt(brightnessRange.value, 10),
    contrast: parseInt(contrastRange.value, 10),
    gamma: parseFloat(gammaRange.value),
    applySharpen: applySharpenCheck.checked,
    adaptiveMethod: adaptiveThresholdSelect.value,
  };

  processAllImages(originalImages, options, updateUI);
}

// ---------------------------------
// updateUI: Callback von processAllImages
// ---------------------------------
function updateUI(state, payload) {
  if (state === "loading") {
    loadingText.style.display = payload ? "block" : "none";
  } else if (state === "result") {
    const results = payload;
    imagesContainer.innerHTML = `<div class="live-preview flex-gap">
            <input type="checkbox" id="livePreview" />
            <label class="checkbox-radio-label" for="livePreview">
                Enable Live Preview
            </label>
            <span class="info-button"
                title="Automatically reprocess images as you adjust settings. Might be laggy on large images.">
                ?
            </span>
        </div>
    `;
    results.forEach((res) => {
      const block = document.createElement("div");
      block.className = "image-block";
      block.setAttribute("data-filename", res.filename);

      const perImageDownloadBtn = document.createElement("button");
      perImageDownloadBtn.className = "download-btn";
      perImageDownloadBtn.textContent = "Download Image";
      perImageDownloadBtn.addEventListener("click", () => {
        const link = document.createElement("a");
        link.download = `${res.filename}.png`;
        link.href = res.canvas.toDataURL("image/png");
        link.click();
      });

      // Copy-to-Clipboard
      const copyToClipboardBtn = document.createElement("button");
      copyToClipboardBtn.className = "download-btn";
      copyToClipboardBtn.textContent = "Copy to Clipboard";
      copyToClipboardBtn.addEventListener("click", async () => {
        try {
          res.canvas.toBlob(async (blob) => {
            if (!blob) {
              alert("Failed to copy image.");
              return;
            }
            const item = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([item]);
            alert("Image copied to clipboard!");
          });
        } catch (err) {
          console.error(err);
          alert(
            "Failed to write to clipboard. Possibly unsupported browser or permissions denied.",
          );
        }
      });

      block.appendChild(res.canvas);
      block.appendChild(perImageDownloadBtn);
      block.appendChild(copyToClipboardBtn);
      imagesContainer.appendChild(block);
    });
    batchDownloadBtn.style.display = "inline-block";
    applyChangesBtn.style.display = livePreview.checked ? "none" : "inline-block";
  } else if (state === "preprocess") {
    const { ctx, width, height, options } = payload;

    // Vorverarbeitung
    if (options.doGray) {
      convertImageToGrayscale(ctx, width, height);
    }
    if (options.doBlur && options.blurRadius > 0) {
      applyBoxBlur(ctx, width, height, options.blurRadius);
    }
    if (options.brightness !== 0 || options.contrast !== 0) {
      adjustBrightnessContrast(
        ctx,
        width,
        height,
        options.brightness,
        options.contrast,
      );
    }
    if (options.gamma !== 1.0) {
      applyGammaCorrection(ctx, width, height, options.gamma);
    }
    if (options.applySharpen) {
      applySharpen(ctx, width, height);
    }
  }
}

// ---------------------------------
// Schwellenwert-UI anpassen
// ---------------------------------
function updateThresholdUI() {
  const method = adaptiveThresholdSelect.value;
  const shouldShow = method === "custom" && thresholdMode.checked;
  thresholdContainer.style.display = shouldShow ? "block" : "none";
}

// ---------------------------------
// Reset-Logik
// ---------------------------------
function resetUIToDefaults() {
  toleranceRange.value = 5;
  toleranceValue.textContent = "5";

  thresholdMode.checked = false;
  thresholdRange.value = 128;
  thresholdValue.textContent = "128";
  adaptiveThresholdSelect.value = "custom";

  convertToGray.checked = false;
  applyBlurCheck.checked = false;
  blurRadiusRange.value = 1;
  blurRadiusValue.textContent = "1";

  brightnessRange.value = 0;
  brightnessValue.textContent = "0";
  contrastRange.value = 0;
  contrastValue.textContent = "0";
  gammaRange.value = 1.0;
  gammaValue.textContent = "1.0";
  applySharpenCheck.checked = false;
  makeTransparent.checked = false;

  document.querySelector('input[name="transColor"][value="black"]').checked =
    true;
  livePreview.checked = false;

  updateThresholdUI();
}

// ---------------------------------
// Zugriff für andere Module
// ---------------------------------
export function getImages() {
  return originalImages;
}

// ---------------------------------
// Paste-Event (Strg+V) fürs Clipboard
// ---------------------------------
document.addEventListener("paste", (e) => {
  const items = e.clipboardData.items;
  let imageFound = false;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.startsWith("image/")) {
      imageFound = true;
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (event) => {
        originalImages = [
          {
            dataURL: event.target.result,
            filename: "pasted_image.png",
          },
        ];
        imagesContainer.innerHTML = "";
        batchDownloadBtn.style.display = "none";
        applyChangesBtn.style.display = "none";
        reprocessImages();
      };
      reader.readAsDataURL(file);
      break;
    }
  }
  if (!imageFound) {
    console.log("No image found in clipboard.");
  }
});

// ---------------------------------
// Profile speichern / laden
// ---------------------------------
saveProfileBtn.addEventListener("click", () => {
  const profileName = profileNameInput.value.trim();
  if (!profileName) {
    alert("Bitte einen Profilnamen eingeben.");
    return;
  }
  saveProfile(profileName);
  updateProfileSelect();
});

loadProfileBtn.addEventListener("click", () => {
  const selected = profileSelect.value;
  if (!selected) {
    alert("Bitte ein Profil aus der Liste auswählen.");
    return;
  }
  loadProfile(selected);
});

// Profile-Speicher-Funktionen
function saveProfile(profileName) {
  const profileData = getCurrentProfileSettings();
  const storedString = localStorage.getItem("imageProfiles");
  let allProfiles = {};
  if (storedString) {
    allProfiles = JSON.parse(storedString);
  }
  allProfiles[profileName] = profileData;
  localStorage.setItem("imageProfiles", JSON.stringify(allProfiles));
  alert(`Profil "${profileName}" wurde gespeichert.`);
}

function loadProfile(profileName) {
  const storedString = localStorage.getItem("imageProfiles");
  if (!storedString) {
    alert("Keine Profile gefunden.");
    return;
  }
  const allProfiles = JSON.parse(storedString);
  const profileData = allProfiles[profileName];
  if (!profileData) {
    alert(`Profil "${profileName}" nicht vorhanden.`);
    return;
  }
  applyProfileSettings(profileData);
  reprocessImages();
  alert(`Profil "${profileName}" wurde geladen.`);
}

function getCurrentProfileSettings() {
  return {
    tol: parseInt(toleranceRange.value, 10),
    thresh: parseInt(thresholdRange.value, 10),
    useThreshold: thresholdMode.checked,
    doGray: convertToGray.checked,
    doBlur: applyBlurCheck.checked,
    blurRadius: parseInt(blurRadiusRange.value, 10),
    doTransparent: makeTransparent.checked,
    transparencyColor: document.querySelector(
      'input[name="transColor"]:checked',
    ).value,
    brightness: parseInt(brightnessRange.value, 10),
    contrast: parseInt(contrastRange.value, 10),
    gamma: parseFloat(gammaRange.value),
    applySharpen: applySharpenCheck.checked,
    adaptiveMethod: adaptiveThresholdSelect.value,
    livePreview: livePreview.checked,
  };
}

function applyProfileSettings(profileData) {
  toleranceRange.value = profileData.tol;
  thresholdRange.value = profileData.thresh;
  thresholdMode.checked = profileData.useThreshold;
  convertToGray.checked = profileData.doGray;
  applyBlurCheck.checked = profileData.doBlur;
  blurRadiusRange.value = profileData.blurRadius;
  makeTransparent.checked = profileData.doTransparent;

  document.querySelector(
    `input[name="transColor"][value="${profileData.transparencyColor}"]`,
  ).checked = true;

  brightnessRange.value = profileData.brightness;
  contrastRange.value = profileData.contrast;
  gammaRange.value = profileData.gamma;
  applySharpenCheck.checked = profileData.applySharpen;
  adaptiveThresholdSelect.value = profileData.adaptiveMethod;
  livePreview.checked = profileData.livePreview;

  // UI-Textwerte aktualisieren
  thresholdValue.textContent = thresholdRange.value;
  toleranceValue.textContent = toleranceRange.value;
  blurRadiusValue.textContent = blurRadiusRange.value;
  brightnessValue.textContent = brightnessRange.value;
  contrastValue.textContent = contrastRange.value;
  gammaValue.textContent = gammaRange.value;

  // Apply-Button-Logik
  applyChangesBtn.style.display = livePreview.checked ? "none" : "inline-block";
  updateThresholdUI();
}

// Dropdown aktualisieren
function updateProfileSelect() {
  profileSelect.innerHTML = '<option value="">-- please choose --</option>';
  const storedString = localStorage.getItem("imageProfiles");
  if (!storedString) return;
  const allProfiles = JSON.parse(storedString);
  Object.keys(allProfiles).forEach((profileName) => {
    const option = document.createElement("option");
    option.value = profileName;
    option.textContent = profileName;
    profileSelect.appendChild(option);
  });
}

// ---------------------------------
// Beim Laden: UI zurücksetzen, Profile-Dropdown updaten,
// LivePreview-Einstellung laden
// ---------------------------------
window.addEventListener("load", () => {
  updateProfileSelect();
  resetUIToDefaults();

  const storedPreviewSetting = localStorage.getItem("livePreviewEnabled");
  if (storedPreviewSetting !== null) {
    livePreview.checked = storedPreviewSetting === "true";
    applyChangesBtn.style.display = livePreview.checked
      ? "none"
      : "inline-block";
  }
});

livePreview.addEventListener("change", () => {
  localStorage.setItem("livePreviewEnabled", livePreview.checked);
  applyChangesBtn.style.display = livePreview.checked ? "none" : "inline-block";
  if (livePreview.checked && originalImages.length > 0) {
    reprocessImages();
  }
});
