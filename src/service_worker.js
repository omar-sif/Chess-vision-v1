import * as tf from '@tensorflow/tfjs'


chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        title: "Analyze position",
        id: "test",
        contexts: [
            "image"
        ]
    });
});
chrome.contextMenus.onClicked.addListener((item, tab) => {
    if (item.menuItemId === "test") {
        const message = {
            action: "find board",
            data: item.srcUrl
        };
        chrome.tabs.sendMessage(tab.id, message, async (response) => {
            if (response && response.action === 'RESULT_IMAGE') {
                // chrome.tabs.create({ url: response.dataUrl })
                const fen = await predictor.analyze(response.data);
                console.log(fen)
                chrome.tabs.create({ url: `https://lichess.org/analysis/fromPosition/${fen}` })

            }
        });
    }
});
class FenPredictor {
    constructor() {
        this.loadModel();
    }
    async loadModel() {
        console.log("loading model ...");
        try {
            this.model = await tf.loadLayersModel("./model.json");
            tf.tidy(() => {
                this.model.predict(tf.zeros([
                    1,
                    30,
                    30,
                    3
                ]));
            });
            console.log("model loaded");
        } catch (e) {
            console.error("unable to load model", e);
        }
    }

    async analyze(image) {
        if (!this.model) {
            console.log('Still loading model ...');
        }
        const preprocessedImage = this.preprocess(image);
        const input = tf.tensor(preprocessedImage)
        const prediction = await this.model.predict(input).argMax(1).reshape([-1, 8, 8]);
        const values = await prediction.dataSync();
        console.log(Array.from(values))
        const predictionArray = await prediction.array();
        console.log(predictionArray)
        const fen = this.fenFromOneHot(predictionArray[0])
        console.log(fen)
        return fen;

    }
    preprocess(rawImage) {
        return this.imageToSquares(this.prePreprocess(rawImage))
    }

    prePreprocess(image) {
        console.log(image)
        const rawImage = image
        // raw image is the u8int clamped array that the content script says, this will be the first step 
        // of the preprocessing
        var array = new Array(240);

        for (let i = 0; i < 240; i++) {
            array[i] = new Array(240);

            for (let j = 0; j < 240; j++) {
                var index = (i * 240 + j) * 4;
                var average = (rawImage[index] + rawImage[index + 1] + rawImage[index + 2]) / 3 // convert to grayscale
                array[i][j] = [average, average, average];
            }
        }

        var minVals = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
        var maxVals = [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE];

        // Find min and max values for each channel
        for (let y = 0; y < 240; y++) {
            for (let x = 0; x < 240; x++) {
                for (let c = 0; c < 3; c++) {
                    var pixelValue = array[y][x][c];
                    minVals[c] = Math.min(minVals[c], pixelValue);
                    maxVals[c] = Math.max(maxVals[c], pixelValue);
                }
            }
        }

        // Normalize each channel independently
        for (var y = 0; y < 240; y++) {
            for (var x = 0; x < 240; x++) {
                for (var c = 0; c < 3; c++) {
                    array[y][x][c] = (array[y][x][c] - minVals[c]) / (maxVals[c] - minVals[c]);
                }
            }
        }
        console.log(array)
        return array

    }

    // Assuming 'im' is your input image (3D array with dimensions (height, width, 3))
    imageToSquares(imageArray) {
        const height = imageArray.length;
        const width = imageArray[0].length;

        const squares = [];

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                // Calculate the starting and ending indices for the current square
                const startY = Math.floor(i * height / 8);
                const endY = Math.floor((i + 1) * height / 8);
                const startX = Math.floor(j * width / 8);
                const endX = Math.floor((j + 1) * width / 8);

                // Extract the sub-image for the current square
                const square = [];

                for (let y = startY; y < endY; y++) {
                    const row = [];
                    for (let x = startX; x < endX; x++) {
                        row.push(imageArray[y][x]);
                    }
                    square.push(row);
                }

                squares.push(square);
            }
        }
        console.log(squares)
        return squares
    }

    fenFromOneHot(oneHotArray) {

        const pieceSymbols = 'prbnkqPRBNKQ';
        let output = '';

        for (let j = 0; j < oneHotArray.length; j++) {
            const row = oneHotArray[j];

            for (let i = 0; i < row.length; i++) {
                if (row[i] === 12) {
                    output += ' '
                }
                else {
                    output += pieceSymbols.charAt(row[i]);
                };
            }

            if (j !== 7) {
                output += '/';
            }
        }

        for (let i = 8; i > 0; i--) {
            const spaces = ' '.repeat(i);
            output = output.replace(new RegExp(spaces, 'g'), String(i));
        }

        return output;

    }

}
const predictor = new FenPredictor();


