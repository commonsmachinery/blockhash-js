// Perceptual image hash calculation tool based on algorithm descibed in
// Block Mean Value Based Image Perceptual Hashing by Bian Yang, Fan Gu and Xiamu Niu
//
// Copyright 2014 Commons Machinery http://commonsmachinery.se/
// Distributed under an MIT license, please see LICENSE in the top dir.

(function (root, undef) {

    var median = function(data) {
        var mdarr = data.slice(0);
        mdarr.sort(function(a, b) { return a-b; });
        if (mdarr.length % 2 === 0) {
            return (mdarr[mdarr.length/2] + mdarr[mdarr.length/2 + 1]) / 2.0;
        }
        return mdarr[Math.floor(mdarr.length/2)];
    };

    var method1 = function(data, bits) {
        var blocksize_x = data.width / bits;
        var blocksize_y = data.height / bits;

        var result = [];

        for (var y = 0; y < bits; y++) {
            for (var x = 0; x < bits; x++) {
                var total = 0;

                for (var iy = 0; iy < blocksize_y; iy++) {
                    for (var ix = 0; ix < blocksize_x; ix++) {
                        var cx = x * blocksize_x + ix;
                        var cy = y * blocksize_y + iy;
                        var ii = (cy * data.width + cx) * 4;
                        total += (data.data[ii] + data.data[ii+1] + data.data[ii+2] + data.data[ii+3]) / 4.0;
                    }
                }

                result.push(total);
            }
        }

        var m = median(result);
        for (var i = 0; i < bits * bits; i++) {
            result[i] = result[i] < m ? 0 : 1;
        }

        return result;
    };

    var method2 = function(data, bits) {
        var overlap_x = Math.floor(data.width / (bits + 1));
        var overlap_y = Math.floor(data.height / (bits + 1));
        var blocksize_x = overlap_x * 2;
        var blocksize_y = overlap_y * 2;

        var result = [];

        for (var y = 0; y < bits; y++) {
            for (var x = 0; x < bits; x++) {
                var total = 0;

                for (var iy = 0; iy < blocksize_y; iy++) {
                    for (var ix = 0; ix < blocksize_x; ix++) {
                        var cx = x * overlap_x + ix;
                        var cy = y * overlap_y + iy;
                        var ii = (cy * data.width + cx) * 4;
                        total += (data.data[ii] + data.data[ii+1] + data.data[ii+2] + data.data[ii+3]) / 4.0;
                    }
                }

                result.push(total);
            }
        }

        var m = median(result);
        for (var i = 0; i < bits * bits; i++) {
            result[i] = result[i] < m ? 0 : 1;
        }

        return result;
    };

    var bmvbhash = function(src, bits, method, callback) {
        var xhr;

        xhr = new XMLHttpRequest();
        xhr.open('GET', src, true);
        xhr.responseType = "arraybuffer";

        xhr.onload = function() {
            var data, contentType, imgData, jpg, png, hash;

            data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
            contentType = xhr.getResponseHeader('content-type');

            try {
                if (contentType === 'image/png') {
                    png = new PNG(data);

                    imgData = {
                        width: png.width,
                        height: png.height,
                        data: new Uint8Array(png.width * png.height * 4)
                    };

                    png.copyToImageData(imgData, png.decodePixels());
                }
                else if (contentType === 'image/jpeg') {
                    jpg = new JpegImage();
                    jpg.parse(data);

                    imgData = {
                        width: jpg.width,
                        height: jpg.height,
                        data: new Uint8Array(jpg.width * jpg.height * 4)
                    };

                    jpg.copyToImageData(imgData);
                }

                if (!imgData) {
                    throw new Error("Couldn't decode image");
                }

                // TODO: resize if required

                if (method === 1) {
                    hash = method1(imgData, bits);
                }
                else if (method === 2) {
                    hash = method2(imgData, bits);
                }
                else {
                    throw new Error("Bad hashing method");
                }

                callback(null, hash);
            } catch (err) {
                callback(err, null);
            }
        };

        xhr.onerror = function(err) {
            callback(err, null);
        }

        xhr.send();
    };

    root.bmvbhash = bmvbhash;
})(this);
