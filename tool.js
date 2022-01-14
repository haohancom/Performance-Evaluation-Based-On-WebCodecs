'use strict';

let w = 1920;
let h = 1080;
let frame_counter = 0;
let frame_number = 100;
let dataList = [];

let codec_string = "avc1.42E01F";
let bit_rate = 12_000_000; // 12 Mbps
let frame_rate = 60;
let threshold = 10;
var encoder;
var decoder;
const chunks = [];
const config = {
    codec: codec_string, //H264: 42e01f
    width: w,
    height: h,
    bitrate: bit_rate, // 2 Mbps
    framerate: frame_rate,
};


self.addEventListener('message', function (e) {
    let data = e.data;
    switch (data.cmd) {
        case 'start':
            self.postMessage('WORKER STARTED: ' + data.msg);
            initEncoder();
            initDecoder();
            process()
                .then(() => {self.postMessage('WORKER DONE')});
            break;
        case 'stop':
            self.postMessage('WORKER STOPPED');
            self.close(); // Terminates the worker.
            break;
        default:
            self.postMessage('Unknown command: ' + data.msg);
    };
}, false);

async function process() {
    prepareData();
    await encodeProcess();
    await decodeProcess();
}

async function encodeProcess() {
    let t0 = performance.now();
    for (let i = 0; i < frame_number; ++i) {
        await encode(i);
    }
    let t1 = performance.now();
    let total_time = t1 - t0;
    let avg_time = total_time / frame_number;
    postMessage("total encode time : " + total_time);
    postMessage("avg encode time : " + avg_time);
    if (avg_time > threshold) {
        postMessage('encode result : TAT');
    } else {
        postMessage('encode result : ^_^');
    }
}


async function decodeProcess() {
    let t0 = performance.now();
    for (var chunk of chunks) {
        // decoder.decode(chunks);
        await new Promise( () => {
            decoder.decode(chunks);
        })
    }
    let t1 = performance.now();
    let total_time = t1 - t0;
    let avg_time = total_time / frame_number;
    postMessage("total decode time : " + total_time);
    postMessage("avg decode time : " + avg_time);
    if (avg_time > threshold) {
        postMessage('decode result : TAT');
    } else {
        postMessage('decode result : ^_^');
    }
}

async function encode(index) {

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

function initDecoder() {
    const init = {
        output: () => {},
        error: (e) => {
            postMessage(e.message);
        }
    };

    decoder = new VideoDecoder(init);
    decoder.configure(config);
}

function initEncoder() {
    const init = {
        // todo : output doesn't work
        output: (chunk) => {
            const buffer = new ArrayBuffer(chunk.byteLength)
            chunk.copyTo(buffer);
            let chunkObj = new EncodedVideoChunk({
                timestamp: chunk.timestamp,
                duration: chunk.duration,
                type: chunk.type,
                data: buffer,
            });

            chunks.push(chunkObj);
        },
        error: (e) => {
            postMessage(e.message);
        }
    };

    encoder = new VideoEncoder(init);
    encoder.configure(config);
}