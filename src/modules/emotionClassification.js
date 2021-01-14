import * as tf from '@tensorflow/tfjs-core';
import { loadLayersModel } from '@tensorflow/tfjs-layers';
// Using CPU backend, because webgl isn't supported and wasm isn't supporting
// blazeface as of now.
import '@tensorflow/tfjs-backend-cpu';
// Blazeface model is used for face detection
import * as blazeface from '@tensorflow-models/blazeface';

const TF_BACKEND = 'cpu';
const CLASSIFIER_IMG_DIMENSIONS = [48, 48];

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
    // Normalize topLeft and bottomRight position
    const topLeft = [position.topLeft[1], position.topLeft[0]];
    const bottomRight = [position.bottomRight[1], position.bottomRight[0]];
    const normalizedTopLeft = tf.div(topLeft, imgDimensions);
    const normalizedBottomRight = tf.div(bottomRight, imgDimensions);
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

    return {
        img,
        facePositions,
        faceImages: encodedFaceImages,
        emotions,
    };
}