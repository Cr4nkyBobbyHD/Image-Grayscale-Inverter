# Advanced Image Grayscale-Inverter

This project allows you to upload images and apply various transformations, such as grayscale conversion, thresholding, brightness/contrast adjustments, and optional transparency for black or white pixels. It’s particularly useful for images containing text, enabling you to produce cleaner, high-contrast results.

## Features
- **Grayscale Tolerance:** Control how strictly pixels must match to be considered grayscale.
- **Threshold Mode (Custom or Otsu):** Convert grayscale pixels to pure black or white based on a fixed threshold or automatically computed one (Otsu’s method).
- **Pre-Processing Options:**  
  - Convert to Grayscale first  
  - Apply a Light Blur to reduce noise  
  - Adjust Brightness, Contrast, and Gamma  
  - Apply a Sharpening filter for crisper details
- **Transparency:** Make all black or white pixels transparent after processing, while preserving original non-grayscale colors as opaque.
- **Live Preview:** Automatically reprocess the image as you change settings.
- **Ctrl+V Functionality** Just press Ctrl+V and the Image in your Clipboard will be loaded.
- **Copy to Clipboard** Press the Copy to Clipboard button to Copy the Image to your Clipboard. 
 
## Usage
1. Open the [GitHub Pages link](https://Cr4nkyBobbyHD.github.io/Image-Grayscale-Inverter/) in your browser.
2. Click **"Choose Files"** and select one or more images from your computer.
3. Adjust the controls (tolerance, threshold, pre-processing filters) as desired.
4. If Live Preview is on, changes appear automatically. Otherwise, click **"Apply Changes"**.
5. Once satisfied, you can **"Download Image"** or **"Download All as ZIP"** for batch downloads.

## Development
- The project is written in HTML, CSS, and JavaScript.
- Simply clone this repository and open `index.html` in your browser or serve it locally with a simple server (e.g., `python -m http.server`).

## Contributing
Feel free to open issues or submit pull requests to enhance functionality, introduce new filters, or improve usability.

## License
This project is available under the [MIT License](LICENSE).
