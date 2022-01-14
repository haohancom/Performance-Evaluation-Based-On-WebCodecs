'use strict';

let w = 1920;
let h = 1080;
let frame_counter = 0;
let frame_number = 100;
let dataList = [];

let codec_string = "vp09.00.10.08";
let bit_rate = 12_000_000;
let frame_rate = 60;
var encoder;

self.addEventListener('message', function (e) {
    let data = e.data;
    switch (data.cmd) {
        case 'start':
            self.postMessage('WORKER STARTED: ' + data.msg);
            initEncoder();
            drawWithInterval().then(() => {self.postMessage('WORKER DONE')});
            break;
        case 'stop':
            self.postMessage('WORKER STOPPED');
            self.close(); // Terminates the worker.
            break;
        default:
            self.postMessage('Unknown command: ' + data.msg);
    };
}, false);

async function drawWithInterval() {
    prepareData();

    let t0 = performance.now();
    for (let i= 0; i< frame_number; ++i) {
       await draw(i);
    }
    let t1 = performance.now();
    postMessage("total time : " + (t1 - t0));
    postMessage("avg time : " + ((t1 - t0) / frame_number))
}

async function draw(index) {

    const init = {timestamp: 0, codedWidth: w, codedHeight: h, format: 'RGBA'};

    let frame = new VideoFrame(dataList[index], init);
    frame_counter++;
    const insert_keyframe = (frame_counter % 10) === 0;

    let t0 = performance.now();
    encoder.encode(frame, {keyFrame: insert_keyframe});
    let t1 = performance.now();
    postMessage("encode time : " + (t1 - t0));
    frame.close();
    if (frame_counter === frame_number) {
        encoder.close();
        postMessage("done");
    }
}

function prepareData() {
    for (let i = 0; i < frame_number; ++i) {
        let data=  new Uint8Array(w * h * 4);
        for (let j = 0; j <= w * h; ++j) {
            let random = Math.floor(Math.random() * 16777215 + 1);

            // r
            data[j * 4] = random & 255;

            // g
            random = random >> 8;
            data[j * 4 + 1] = random & 255;

            // b
            random = random >> 8;
            data[j * 4 + 2] = random;

            // a
            data[j * 4 + 3] = 255;
        }
        dataList[i] = data;
    }
}

function initEncoder() {
    const init = {
        output: () => {}, // do nothing
        error: (e) => {
            postMessage(e.message);
        }
    };
    const config = {
        codec: codec_string,
        width: w,
        height: h,
        bitrate: bit_rate,
        framerate: frame_rate,
    };
    encoder = new VideoEncoder(init);
    encoder.configure(config);
}