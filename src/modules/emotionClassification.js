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
    0: 'angry',
    1: 'disgust',
    2: 'fear',
    3: 'happy',
    4: 'sad',
    5: 'surprise',
    6: 'neutral',
};

const getFaces = async (img) => {
    // Load blazeface for face detection
    const model = await blazeface.load();
    // Predict and return face position(s)
    const returnTensors = false;
    const flipHorizontal = false;
    const annotateBoxes = false;
    return model.estimateFaces(img, returnTensors, flipHorizontal, annotateBoxes);
};

const getFaceImage = async (img, position) => {
    // Get image dimensions [height, width]
    const imgDimensions = img.shape.slice(1, 3);
    // The current face position is rectangular but might not be square.
    // In order to prevent stretching we'll increase the size to be square.
    let topLeft = [position.topLeft[1], position.topLeft[0]];
    let bottomRight = [position.bottomRight[1], position.bottomRight[0]];
    const width = bottomRight[1] - topLeft[1];
    const height = bottomRight[0] - topLeft[0]
    const difference = width - height;
    topLeft[0] -= (difference / 2);
    bottomRight[0] += (difference / 2);
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

export const getEmotion = async (img) => {
    const model = await loadLayersModel(emotionClassificationModelUrl);
    const predictions = await model.predict(img).data();
    const indexOfMaxValue = predictions.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
    return EMOTION[indexOfMaxValue];
};

export const getEmotions = async (img) => {
    // Setup tensorflow backend
    await tf.setBackend(TF_BACKEND);
    // Convert img to tensor and reshape to [1, height, width, 3]
    let imgTensor = tf.browser.fromPixels(img).expandDims(0);
    // Find faces and their positions in img
    const facePositions = await getFaces(img);
    if (facePositions.length === 0) return false;
    // Get cropped face images ready for classification
    const faceImages = await Promise.all(
        facePositions.map((position) => getFaceImage(imgTensor, position))
    );
    if (faceImages.length === 0) return false;
    // Encode face images for display
    const encodedFaceImages = [];
    for (const img of faceImages) {
        const preparedImg = tf.abs(img.reshape([...CLASSIFIER_IMG_DIMENSIONS, 1]));
        encodedFaceImages.push(await tf.browser.toPixels(preparedImg));
    }
    // Classify each face image
    const emotions = await Promise.all(
        faceImages.map((img) => getEmotion(img))
    );

    return {
        img,
        facePositions,
        faceImages: encodedFaceImages,
        emotions,
    };
}