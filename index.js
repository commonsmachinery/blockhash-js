// Perceptual image hash calculation tool based on algorithm descibed in
// Block Mean Value Based Image Perceptual Hashing by Bian Yang, Fan Gu and Xiamu Niu
//
// Copyright 2014 Commons Machinery http://commonsmachinery.se/
// Distributed under an MIT license, please see LICENSE in the top dir.

var PNG = require('png-js');
var jpeg = require('jpeg-js');
var core = require('blockhash-core');

var one_bits = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

/* Calculate the hamming distance for two hashes in hex format */
var hammingDistance = function(hash1, hash2) {
    var d = 0;
    var i;

    if (hash1.length !== hash2.length) {
        throw new Error("Can't compare hashes with different length");
    }

    for (i = 0; i < hash1.length; i++) {
        var n1 = parseInt(hash1[i], 16);
        var n2 = parseInt(hash2[i], 16);
        d += one_bits[n1 ^ n2];
    }
    return d;
};

var blockhashData = function(imgData, bits, method) {
    var hash;

    if (method === 1) {
        hash = core.bmvbhashEven(imgData, bits);
    }
    else if (method === 2) {
        hash = core.bmvbhash(imgData, bits);
    }
    else {
        throw new Error("Bad hashing method");
    }

    return hash;
};

var blockhash = function(src, bits, method, callback) {
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
                imgData = jpeg.decode(data);
            }

            if (!imgData) {
                throw new Error("Couldn't decode image");
            }

            // TODO: resize if required

            hash = blockhashData(imgData, bits, method);
            callback(null, hash);
        } catch (err) {
            callback(err, null);
        }
    };

    xhr.onerror = function(err) {
        callback(err, null);
    };

    xhr.send();
};

module.exports = {
  hammingDistance: hammingDistance,
  blockhash: blockhash,
  blockhashData: blockhashData
};
