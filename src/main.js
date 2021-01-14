import { getEmotions } from './modules/emotionClassification.js';
import defaultImgUrl from './assets/img/group.jpg';


const CANVAS = document.getElementById('imgCanvas');
const CTX = CANVAS.getContext('2d');
const IMG_UPLOAD_ELEMENT = document.getElementById('imgUpload');
const FACES_SECTION = document.getElementById('faces');


/**
 * Plot the given Image Object to the canvas.
 * 
 * @param {HTMLElement} img
 */
const plotImg = (img) => {
    if (img instanceof HTMLElement === false) {
        throw Error('The handed over img is no HTMLElement');
    }
    // Calculate the factor to scale the image to the same width as the canvas.
    const scale = CANVAS.width / img.width;
    // Set canvas height to scaled img height
    CANVAS.height = img.height * scale;
    // Clear the canvas
    CTX.clearRect(0, 0, CANVAS.width, CANVAS.height);
    // Draw the scaled image onto the canvas
    CTX.drawImage(img, 0, 0, CANVAS.width, CANVAS.height);
};


/**
 * Plots a rectangle with emotion annotation onto the main canvas
 * 
 * @param {HTMLElement} img
 * @param {Object} facePositions
 * @param {Array} emotions
 */
const plotClassificationResults = (img, facePositions, emotions) => {
    // Set plot styles
    const textOffsetLeft = -10;
    const textOffsetTop = 7;
    CTX.lineWidth = '3';
    CTX.strokeStyle = '#00ff00';
    CTX.font = '20px Arial';
    // Plot each facePosition and the according emotions label
    for (let i = 0; i < facePositions.length; i++) {
        let { topLeft, bottomRight } = facePositions[i];
        // Calculate transformation scale between canvas and img
        const scale = CANVAS.width / img.width;
        // Apply scale
        topLeft[0] *= scale;
        topLeft[1] *= scale;
        bottomRight[0] *= scale;
        bottomRight[1] *= scale;
        // Calculate rectangle dimensions
        const rectSize = [bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]];
        // Render a rectangle for each detected face.
        CTX.strokeRect(topLeft[0], topLeft[1], rectSize[0], rectSize[1]);
        // Print detected emotion on top of rectangle.
        CTX.fillText(emotions[i].emoji, topLeft[0] + textOffsetLeft, topLeft[1] + textOffsetTop);
    }
};


/**
 * Creates a wrapper div and appends it to the DOM.
 * Inserts a canvas displaying a face and a paragraph displaying the predicted
 * emotion into the wrapper.
 * 
 * @param {Uint8ClampedArray} imgData 
 * @param {String} emotion 
 */
const displayFaceImageWithAnnotations = (imgData, emotion) => {
    // Create wrapper to deploy content into
    const wrapper = document.createElement('DIV');
    wrapper.classList.add('face-image__wrapper');
    // Create canvas and context to plot image into
    const canvas = document.createElement('CANVAS');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    // Create new Image Object containing the imgData
    let img = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < imgData.length && i < img.data.length; i++) {
        img.data[i] = imgData[i];
    }
    // Plot img to canvas
    ctx.putImageData(img, 0, 0);
    // Add canvas to wrapper
    wrapper.appendChild(canvas);
    // Create label
    const label = document.createElement('P');
    label.innerHTML = `${emotion.emoji} ${emotion.label}`;
    // Add label to canvas
    wrapper.appendChild(label);
    // Append wrapper element to DOM
    FACES_SECTION.appendChild(wrapper);
};


/**
 * Controlls the image processing, from plots to classification back
 * to plots again.
 * 
 * @param {Image} img 
 */
const processImg = async (img) => {
    // Plot the image onto the canvas
    plotImg(img)
    // Classify the given img
    const { facePositions, faceImages, emotions } = await getEmotions(img);
    // Plot classification results on top of image background
    plotClassificationResults(img, facePositions, emotions);
    // Display each detected face as own image with classification annotations
    for (let i = 0; i < faceImages.length; i++) {
        displayFaceImageWithAnnotations(faceImages[i], emotions[i]);
    }
};


/**
 * Create a new image from src and start processing it.
 * 
 * @param {String} src - image src
 */
const runPipeline = (src) => {
    // Create a new image from src
    const imgObj = new Image();
    imgObj.src = src;
    // Process image after loaded
    imgObj.onload = () => processImg(imgObj);
};


/**
 * Handle file Uploads
 */
IMG_UPLOAD_ELEMENT.onchange = () => {
    const img = IMG_UPLOAD_ELEMENT.files[0];
    // Create a reader and read the uploaded image
    const reader = new FileReader();
    reader.onload = (e) => {
        // Run the pipeline with the uploaded image
        runPipeline(e.target.result);
    };
    reader.readAsDataURL(img);
};


/**
 * Initially run the pipeline with a default img
 */
runPipeline(defaultImgUrl);