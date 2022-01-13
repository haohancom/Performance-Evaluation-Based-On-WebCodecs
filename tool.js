'use strict';

let w = 1920;
let h = 1080;
let frame_counter = 0;
let frame_number = 100;
let dataList = [];

let codec_string = "vp09.00.10.08";
var encoder;

async function drawWithInterval() {
    prepareData();
    let t0 = performance.now();

    for (let i= 0; i< frame_number; ++i) {
       draw(i);
    }
    let t1 = performance.now();
    log("total time : " + (t1 - t0));
}

async function draw(index) {

    const init = {timestamp: 0, codedWidth: w, codedHeight: h, format: 'RGBA'};

    let frame = new VideoFrame(dataList[index], init);
    frame_counter++;
    const insert_keyframe = (frame_counter % 10) === 0;

    let t0 = performance.now();
    encoder.encode(frame, {keyFrame: insert_keyframe});
    let t1 = performance.now();
    log("encode time : " + (t1 - t0));
    frame.close();
    if (frame_counter === frame_number) {
        encoder.close();
        log("done");
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
        // dataList.push(data);
        dataList[i] = data;
    }
}

function log(str) {
    document.querySelector('textarea').value += str + '\n';
}

function initEncoder() {
    const init = {
        output: () => {}, // do nothing
        error: (e) => {
            log(e.message);
        }
    };
    const config = {
        codec: codec_string,
        width: w,
        height: h,
        bitrate: 12_000_000,
        framerate: 60,
    };
    encoder = new VideoEncoder(init);
    encoder.configure(config);
}