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

    var method1_pixdiv = function(data, bits) {
        var i, j, x, y, ii, avgvalue;
        var weight_top, weight_bottom, weight_left, weight_right;
        var block_top, block_bottom, block_left, block_right;
        var y_mod, y_frac, y_int;
        var x_mod, x_frac, x_int;

        var block_width = data.width / bits;
        var block_height = data.height / bits;

        var result = [];

        // initialize blocks array with 0s
        var blocks = [];
        for (i = 0; i < bits; i++) {
            blocks.push([]);
            for (j = 0; j < bits; j++) {
                blocks[i].push(0);
            }
        }

        for (y = 0; y < data.height; y++) {
            y_mod = (y + 1) % block_height;
            y_frac = y_mod - Math.floor(y_mod);
            y_int = y_mod - y_frac;

            weight_top = (1 - y_frac);
            weight_bottom = (y_frac);

            // y_int will be 0 on bottom/right borders and on block boundaries
            if (y_int > 0 || (y + 1) === data.height) {
                block_top = block_bottom = Math.floor(y / block_height);
            } else {
                block_top = Math.floor(y / block_height);
                block_bottom = Math.ceil(y / block_height);
            }

            for (x = 0; x < data.width; x++) {
                var ii = (y * data.width + x) * 4;
                var avgvalue = (data.data[ii] + data.data[ii+1] + data.data[ii+2] + data.data[ii+3]) / 4.0;

                x_mod = (x + 1) % block_width;
                x_frac = x_mod - Math.floor(x_mod);
                x_int = x_mod - x_frac;

                weight_left = (1 - x_frac);
                weight_right = x_frac;

                // x_int will be 0 on bottom/right borders and on block boundaries
                if (x_int > 0 || (x + 1) === data.width) {
                    block_left = block_right = Math.floor(x / block_width);
                } else {
                    block_left = Math.floor(x / block_width);
                    block_right = Math.ceil(x / block_width);
                }

                // add weighted pixel value to relevant blocks
                blocks[block_top][block_left] += avgvalue * weight_top * weight_left;
                blocks[block_top][block_right] += avgvalue * weight_top * weight_right;
                blocks[block_bottom][block_left] += avgvalue * weight_bottom * weight_left;
                blocks[block_bottom][block_right] += avgvalue * weight_bottom * weight_right;
            }
        }

        for (i = 0; i < bits; i++) {
            for (j = 0; j < bits; j++) {
                result.push(blocks[i][j]);
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
                else if (method === 3) {
                    hash = method1_pixdiv(imgData, bits);
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
