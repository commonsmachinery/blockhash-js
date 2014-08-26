/* global describe, it, before */

var expect = require('expect.js');
var glob = require('glob');
var path = require('path');

var bmvbhash_data = require('../blockhash.js').bmvbhash_data;

// attempt to load jpgjs using vm
var vm = require('vm');
var fs = require('fs');
vm.runInThisContext(fs.readFileSync(require.resolve('../jpgjs/jpg.js')));

// use standard require to load png.js
var PNG = require('../png.js/png-node.js');

var testFiles = glob.sync('test/data/*.jpg');

testFiles.forEach(function(fn) {
    describe(fn, function(){
        var basename = path.basename(fn, '.jpg');
        var bits = 16;

        [1, 2, 3, 4].forEach(function(m) {
            it('method' + m, function(done) {
                var jpg, data, imgData, hash, expectedHash;

                data = new Uint8Array(fs.readFileSync(fn));
                jpg = new JpegImage();
                jpg.parse(data);

                imgData = {
                    width: jpg.width,
                    height: jpg.height,
                    data: new Uint8Array(jpg.width * jpg.height * 4)
                };

                jpg.copyToImageData(imgData);
                hash = bmvbhash_data(imgData, bits, m);

                expectedHash = fs.readFileSync("test/data/" + basename + "_" + bits + "_" + m + ".txt", {
                    encoding: 'utf-8'
                }).split(/\s/)[1];

                expect(expectedHash).to.be(hash.join(""));

                done();
            });
        });
    });
})
