import { emotionClassification } from './modules/emotionClassification.js';
import defaultImgUrl from './assets/img/group.jpg';

const canvas = document.getElementById('imgCanvas');
const ctx = canvas.getContext('2d');
const imgUploadElement = document.getElementById('imgUpload');

const plot = (img) => {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Fit the image into the canvas like background-size: contain
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    // Calculate the top position of the image on the canvas
    const y = (canvas.height / 2) - (img.height / 2) * scale;
    // Draw the scaled image onto the canvas
    ctx.drawImage(img, 0, y, img.width * scale, img.height * scale);
};

const uploadImage = () => {
    const img = imgUploadElement.files[0];
    // Create a reader and read the uploaded image
    const reader = new FileReader();
    reader.onload = (e) => {
        // Display the uploaded image
        const imgObj = new Image();
        imgObj.src = e.target.result;
        imgObj.onload = () => plot(imgObj);
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