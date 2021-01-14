import { getEmotions } from './modules/emotionClassification.js';
import defaultImgUrl from './assets/img/group.jpg';

const canvas = document.getElementById('imgCanvas');
const ctx = canvas.getContext('2d');
const imgUploadElement = document.getElementById('imgUpload');
const facesSection = document.getElementById('faces');

const plot = async (img) => {
    // Make the img as wide as the canvas width "auto" height
    const scale = canvas.width / img.width;
    // Resize canvas to new img height
    canvas.height = img.height * scale;
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw the scaled image onto the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // Classify the given img
    const result = await getEmotions(img);
    // Print classification results
    ctx.lineWidth = '3';
    ctx.strokeStyle = '#00ff00';
    // ctx.font = '30px Arial';
    for (let i = 0; i < result.facePositions.length; i++) {
        const scale = canvas.width / result.img.width;
        const start = result.facePositions[i].topLeft;
        const end = result.facePositions[i].bottomRight;
        start[0] *= scale;
        start[1] *= scale;
        end[0] *= scale;
        end[1] *= scale;
        const size = [end[0] - start[0], end[1] - start[1]];
        // Render a rectangle for each detected face.
        ctx.strokeRect(start[0], start[1], size[0], size[1]);
        // Print mood
        ctx.fillText(result.emotions[i], start[0], start[1]);
        const faceCanvas = document.createElement('CANVAS');
        const faceCtx = faceCanvas.getContext('2d');
        faceCanvas.width = 48;
        faceCanvas.height = 48;
        let imgData = faceCtx.createImageData(faceCanvas.width, faceCanvas.height);
        for (let j = 0; j < result.faceImages[i].length; j++) {
            imgData.data[j] = result.faceImages[i][j];
        }
        faceCtx.putImageData(imgData, 0, 0);
        facesSection.appendChild(faceCanvas);
    }
};

const uploadImage = () => {
    const img = imgUploadElement.files[0];
    // Create a reader and read the uploaded image
    const reader = new FileReader();
    reader.onload = (e) => {
        // Display the uploaded image
        const imgObj = new Image();
        imgObj.src = e.target.result;
        imgObj.onload = () => {
            plot(imgObj);
            const result = getEmotions(imgObj);
        }
    };
    reader.readAsDataURL(img);
};

const init = () => {
    //Create a new Image object.
    const imgObj = new Image();
    imgObj.src = defaultImgUrl;
    imgObj.onload = () => plot(imgObj);
};

imgUploadElement.onchange = () => uploadImage();

init();