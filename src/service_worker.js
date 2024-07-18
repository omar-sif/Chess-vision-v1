import * as tf from '@tensorflow/tfjs'

const IMAGE_SIZE = 240

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        title: "Import",
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
        chrome.tabs.sendMessage(tab.id, message, (response) => {
            console.log(response);
            chrome.tabs.create({
                url: response.data
            });
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
}
const predictor = new FenPredictor();


