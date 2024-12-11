// download.js
// Handles batch downloading of processed images

const batchDownloadBtn = document.getElementById('batchDownloadBtn');
const imagesContainer = document.getElementById('imagesContainer');

batchDownloadBtn.addEventListener('click', () => {
    // JSZip is globally available since you included the CDN script in index.html
    const zip = new JSZip();
    const imageBlocks = imagesContainer.querySelectorAll('.image-block');
    imageBlocks.forEach(block => {
        const canvas = block.querySelector('canvas');
        const fileName = block.getAttribute('data-filename');
        const dataURL = canvas.toDataURL('image/png').split(',')[1];
        zip.file(fileName, dataURL, { base64: true });
    });

    zip.generateAsync({ type: "blob" }).then(function (content) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'processed_images.zip';
        link.click();
    });
});
