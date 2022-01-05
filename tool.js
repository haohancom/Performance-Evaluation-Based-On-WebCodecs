'use strict';

async function drawWithInterval() {
    for (let i= 0; i< frame_number; ++i) {
        await draw(time_delay);
    }
}

function draw(delay) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            for (let i = 0; i <= w * h * 4; ++i) {
                data[i] = Math.floor(Math.random() * 255 + 1);
            }

            const init = {timestamp: 0, codedWidth: w, codedHeight: h, format: 'RGBA'};

            let frame = new VideoFrame(data, init);
            frame_counter++;
            const insert_keyframe = (frame_counter % 150) === 0;

            let t0 = performance.now();
            encoder.encode(frame, {keyFrame: insert_keyframe});
            let t1 = performance.now();
            log("encode time : " + (t1 - t0));
            frame.close();
            if (frame_counter === frame_number) {
                encoder.close();
                log("done");
            }

            canvasContext.putImageData(imageData, 0, 0);
            resolve();
        }, delay);
    });
}

function RGB2YUV(width, height, rgbaArray){
    var output = new Uint8Array(module.HEAPU8.buffer, ptr, options.width * options.height * 3/2);

    var uOffset = width * height;
    var vOffset = uOffset + (uOffset >> 2);
    for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
            var sampleIndex = ((i >> 1 << 1) * width ) +  (j >> 1 << 1);
            var UVIndex =  ((i >> 1) * (width >> 1)) +  (j >> 1);
            var r = rgbaArray[4*(i*width + j)];
            var g = rgbaArray[4*(i*width + j) + 1];
            var b = rgbaArray[4*(i*width + j) + 2];
            output[i*width + j] = ((66 * r + 129 * g + 25 * b) >> 8) + 16;
            if(sampleIndex === i*width + j){
                output[uOffset +UVIndex] =  ((-38 * r + -74 * g + 112 * b) >> 8) + 128;
                output[vOffset + UVIndex] = ((112 * r + -94 * g + -18 * b) >> 8) + 128;
            }
        }
    }
    return output;
}