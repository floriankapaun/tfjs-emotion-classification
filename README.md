# tfjs-emotion-classification

Image emotion classification based on [Tensorflow.js](https://www.tensorflow.org/js) and [Webpack](https://webpack.js.org/).

![A group of girls with rectangles around their faces and annotations about their emotion](./docs/demo.jpg)

Check out the [demo](https://floriankapaun.github.io/tfjs-emotion-classification/) and upload your own picture.

## Setup

I'm using yarn for my examples, but you could easily use npm as well.

Install dependencies

    yarn install

Run dev server

    yarn serve

Build

    yarn build

## About

What this thing does is:

1. Find faces in an image using tfjs [BlazeFace detector](https://github.com/tensorflow/tfjs-models/tree/master/blazeface)
2. Extract those faces, and prepare them for classification (resize, grayscale, normalize, ...)
3. Classify the emotion of each found face using a converted version of this [open-sourced CNN model](https://github.com/oarriaga/face_classification) trained on the FER-2013 dataset.

## Credits

- [brendansudol](https://github.com/brendansudol) did something similar with React and faceapi.js which was the basis for my project. Check out his [repository](https://github.com/brendansudol/faces)
- Example Foto Credit: [Omar Lopez](https://unsplash.com/photos/auEe5lKHZCw) on Unsplash