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

    var bits_to_hexhash = function(bitsArray) {
        var hex = [];
        for (var i = 0; i < bitsArray.length; i += 4) {
            var nibble = bitsArray.slice(i, i + 4);
            hex.push(parseInt(nibble.join(''), 2).toString(16));
        }

        return hex.join('');
    };

    var method1 = function(data, bits) {
        var blocksize_x = Math.floor(data.width / bits);
        var blocksize_y = Math.floor(data.height / bits);

        var result = [];

        for (var y = 0; y < bits; y++) {
            for (var x = 0; x < bits; x++) {
                var total = 0;

                for (var iy = 0; iy < blocksize_y; iy++) {
                    for (var ix = 0; ix < blocksize_x; ix++) {
                        var cx = x * blocksize_x + ix;
                        var cy = y * blocksize_y + iy;
                        var ii = (cy * data.width + cx) * 4;
                        total += data.data[ii] + data.data[ii+1] + data.data[ii+2] + data.data[ii+3];
                    }
                }

                result.push(total);
            }
        }

        var m = median(result);
        for (var i = 0; i < bits * bits; i++) {
            result[i] = result[i] < m ? 0 : 1;
        }

        return bits_to_hexhash(result);
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
                        total += data.data[ii] + data.data[ii+1] + data.data[ii+2] + data.data[ii+3];
                    }
                }

                result.push(total);
            }
        }

        var m = median(result);
        for (var i = 0; i < bits * bits; i++) {
            result[i] = result[i] < m ? 0 : 1;
        }

        return bits_to_hexhash(result);
    };

    var method_pixdiv = function(data, bits, overlap) {
        var result = [];

        function onepass(block_width, block_height, x_offset, y_offset, maxblocks) {
            var i, j, x, y, ii, avgvalue;
            var weight_top, weight_bottom, weight_left, weight_right;
            var block_top, block_bottom, block_left, block_right;
            var y_mod, y_frac, y_int;
            var x_mod, x_frac, x_int;

            // initialize blocks array with 0s
            var blocks = [];
            for (i = 0; i < maxblocks; i++) {
                blocks.push([]);
                for (j = 0; j < maxblocks; j++) {
                    blocks[i].push(0);
                }
            }

            for (y = y_offset; y < data.height; y++) {
                y_mod = (y - y_offset + 1) % block_height;
                y_frac = y_mod - Math.floor(y_mod);
                y_int = y_mod - y_frac;

                weight_top = (1 - y_frac);
                weight_bottom = (y_frac);

                // y_int will be 0 on bottom/right borders and on block boundaries
                if (y_int > 0 || (y + 1) === data.height) {
                    block_top = block_bottom = Math.floor((y - y_offset) / block_height);
                } else {
                    block_top = Math.floor((y - y_offset) / block_height);
                    block_bottom = Math.ceil((y - y_offset) / block_height);
                }

                // stop after reaching maxblocks, in case we're doing 4-pass analysis with overlapping blocks
                if (block_bottom == maxblocks) {
                    break;
                }

                for (x = x_offset; x < data.width; x++) {
                    var ii = (y * data.width + x) * 4;
                    var avgvalue = data.data[ii] + data.data[ii+1] + data.data[ii+2] + data.data[ii+3];

                    x_mod = (x - x_offset + 1) % block_width;
                    x_frac = x_mod - Math.floor(x_mod);
                    x_int = x_mod - x_frac;

                    weight_left = (1 - x_frac);
                    weight_right = x_frac;

                    // x_int will be 0 on bottom/right borders and on block boundaries
                    if (x_int > 0 || (x + 1) === data.width) {
                        block_left = block_right = Math.floor((x - x_offset) / block_width);
                    } else {
                        block_left = Math.floor((x - x_offset) / block_width);
                        block_right = Math.ceil((x - x_offset) / block_width);
                    }

                    // stop after reaching maxblocks, in case we're doing 4-pass analysis with overlapping blocks
                    if (block_right == maxblocks) {
                        break;
                    }

                    // add weighted pixel value to relevant blocks
                    blocks[block_top][block_left] += avgvalue * weight_top * weight_left;
                    blocks[block_top][block_right] += avgvalue * weight_top * weight_right;
                    blocks[block_bottom][block_left] += avgvalue * weight_bottom * weight_left;
                    blocks[block_bottom][block_right] += avgvalue * weight_bottom * weight_right;
                }
            }
            return blocks;
        }

        if (overlap) {
            var overlap_width = data.width / (bits + 1);
            var overlap_height = data.height / (bits + 1);
            var block_width = overlap_width * 2;
            var block_height = overlap_height * 2;

            var blocks1 = onepass(block_width, block_height, 0, 0, Math.floor(bits / 2));
            var blocks2 = onepass(block_width, block_height, Math.floor(overlap_width), 0, Math.floor(bits / 2));
            var blocks3 = onepass(block_width, block_height, 0, Math.floor(overlap_height), Math.floor(bits / 2));
            var blocks4 = onepass(block_width, block_height, Math.floor(overlap_width), Math.floor(overlap_height), Math.floor(bits / 2));

            for (i = 0; i < bits / 2; i++) {
                for (j = 0; j < bits / 2; j++) {
                    result.push(blocks1[i][j]);
                    result.push(blocks2[i][j]);
                }
                for (j = 0; j < bits / 2; j++) {
                    result.push(blocks3[i][j]);
                    result.push(blocks4[i][j]);
                }
            }
        } else {
            var block_width = data.width / bits;
            var block_height = data.height / bits;
            var blocks = onepass(block_width, block_height, 0, 0, bits);

            for (i = 0; i < bits; i++) {
                for (j = 0; j < bits; j++) {
                    result.push(blocks[i][j]);
                }
            }
        }

        var m = median(result);
        for (var i = 0; i < bits * bits; i++) {
            result[i] = result[i] < m ? 0 : 1;
        }

        return bits_to_hexhash(result);
    };

    var bmvbhash_data = function(imgData, bits, method) {
        var hash;

        if (method === 1) {
            hash = method1(imgData, bits);
        }
        else if (method === 2) {
            hash = method2(imgData, bits);
        }
        else if (method === 3) {
            hash = method_pixdiv(imgData, bits, false);
        }
        else if (method === 4) {
            hash = method_pixdiv(imgData, bits, true);
        }
        else {
            throw new Error("Bad hashing method");
        }

        return hash;
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

                hash = bmvbhash_data(imgData, bits, method);
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
    root.bmvbhash_data = bmvbhash_data;
})(this);
