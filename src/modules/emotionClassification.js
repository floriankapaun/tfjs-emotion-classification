import * as tf from '@tensorflow/tfjs-core';
import { loadLayersModel } from '@tensorflow/tfjs-layers';
// Using CPU backend, because webgl isn't supported and wasm isn't supporting
// blazeface as of now.
import '@tensorflow/tfjs-backend-cpu';
// Blazeface model is used for face detection
import * as blazeface from '@tensorflow-models/blazeface';
// Emotion classification model
import emotionClassificationModelUrl from '../assets/model/model.json';
// Imports for webpack to compile the shards to dist
import shard1 from '../assets/model/group1-shard1of1';
import shard2 from '../assets/model/group2-shard1of1';
import shard3 from '../assets/model/group3-shard1of1';
import shard4 from '../assets/model/group4-shard1of1';
import shard5 from '../assets/model/group5-shard1of1';
import shard6 from '../assets/model/group6-shard1of1';
import shard7 from '../assets/model/group7-shard1of1';
import shard8 from '../assets/model/group8-shard1of1';
import shard9 from '../assets/model/group9-shard1of1';
import shard10 from '../assets/model/group10-shard1of1';
import shard11 from '../assets/model/group11-shard1of1';
import shard12 from '../assets/model/group12-shard1of1';
import shard13 from '../assets/model/group13-shard1of1';
import shard14 from '../assets/model/group14-shard1of1';
import shard15 from '../assets/model/group15-shard1of1';
import shard16 from '../assets/model/group16-shard1of1';
import shard17 from '../assets/model/group17-shard1of1';
import shard18 from '../assets/model/group18-shard1of1';
import shard19 from '../assets/model/group19-shard1of1';


const TF_BACKEND = 'cpu';
const CLASSIFIER_IMG_DIMENSIONS = [48, 48];
const EMOTION = {
    0: { label: 'angry', emoji: '😠' },
    1: { label: 'disgust', emoji: '🤢' },
    2: { label: 'fear', emoji: '😨' },
    3: { label: 'happy', emoji: '🙂' },
    4: { label: 'sad', emoji: '🙁' },
    5: { label: 'surprise', emoji: '😯' },
    6: { label: 'neutral', emoji: '😐' },
};


/**
 * Detects faces using tfjs blazeface model and returns them.
 * 
 * @param {HTMLElement} img 
 * 
 * @returns {Array}
 */
const getFaces = async (img) => {
    // Load blazeface for face detection
    const model = await blazeface.load();
    // Predict face position(s)
    const returnTensors = false;
    const flipHorizontal = false;
    const annotateBoxes = false;
    const facePositions = await model.estimateFaces(img, returnTensors, flipHorizontal, annotateBoxes);
    // The current face positions are rectangular probably not square as we need them to be.
    // In order to prevent stretching we'll increase the size get squares.
    for (const position of facePositions) {
        const topLeft = [position.topLeft[1], position.topLeft[0]];
        const bottomRight = [position.bottomRight[1], position.bottomRight[0]];
        const width = bottomRight[1] - topLeft[1];
        const height = bottomRight[0] - topLeft[0]
        const difference = width - height;
        position.topLeft[1] -= (difference / 2);
        position.bottomRight[1] += (difference / 2);
    }
    return facePositions
};


/**
 * Crops face out of full image and prepares the result for classification.
 * 
 * @param {Tensor} img 
 * @param {Object} position - face position
 * 
 * @returns {Tensor} - prepared face img
 */
const getFaceImage = async (img, position) => {
    // Get image dimensions [height, width]
    const imgDimensions = img.shape.slice(1, 3);
    // Switch x and y values
    const topLeft = [position.topLeft[1], position.topLeft[0]];
    const bottomRight = [position.bottomRight[1], position.bottomRight[0]];
    // Normalize topLeft and bottomRight position
    const normalizedTopLeft = tf.div(topLeft, imgDimensions).dataSync();
    const normalizedBottomRight = tf.div(bottomRight, imgDimensions).dataSync();
    // Configure box to crop by
    const box = tf.concat([normalizedTopLeft, normalizedBottomRight]).expandDims(0);
    // Crop image to face only (box) and resize to correct dimensions for classifier
    const faceImage = tf.image.cropAndResize(img, box, [0], CLASSIFIER_IMG_DIMENSIONS);
    // Normalize color values from [0, 255] to [0, 1].
    const normalizedFaceImage = faceImage
        .div(tf.scalar(255));
    // Convert normalizedFaceImage to grayscale. Therefore compute
    // mean of R, G, and B values, then expand dimensions to get
    // propper shape: [1, height, width, 1]
    return normalizedFaceImage
        .mean(3, false)
        .toFloat()
        .expandDims(3);
};


/**
 * Classifies the emotion of a face
 * 
 * @param {Tensor} img - face only; size 48x48; grayscale;
 * 
 * @returns {Object} - emotion containing 'label' and 'emoji'
 */
const classifyEmotion = async (img) => {
    const model = await loadLayersModel(emotionClassificationModelUrl);
    const predictions = await model.predict(img).data();
    const indexOfMaxValue = predictions.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
    return EMOTION[indexOfMaxValue];
};


/**
 * Detects faces in an image, crops them out and classifies their emotions.
 * 
 * @param {HTMLElement} img 
 * 
 * @returns {Object} - including 'facePositions', 'faceImages' and 'emotions'
 */
export const getEmotions = async (img) => {
    // Setup tensorflow backend
    await tf.setBackend(TF_BACKEND);
    // Find faces and their positions in img
    const facePositions = await getFaces(img);
    if (facePositions.length === 0) return false;
    // Convert img to tensor and reshape to [1, height, width, 3]
    const imgTensor = tf.browser.fromPixels(img).expandDims(0);
    // Get cropped face images – ready for classification
    const faceImages = await Promise.all(
        facePositions.map((position) => getFaceImage(imgTensor, position))
    );
    if (faceImages.length === 0) return false;
    // Classify each face image
    const emotions = await Promise.all(
        faceImages.map((img) => classifyEmotion(img))
    );
    // Encode extracted face images for return
    const encodedFaceImages = [];
    for (const img of faceImages) {
        const reshapedImg = img.reshape([...CLASSIFIER_IMG_DIMENSIONS, 1]);
        encodedFaceImages.push(await tf.browser.toPixels(reshapedImg));
    }
    return {
        facePositions,
        faceImages: encodedFaceImages,
        emotions,
    };
}