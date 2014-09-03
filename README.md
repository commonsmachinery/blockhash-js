blockhash-js
============

This is a perceptual image hash calculation tool based on algorithm descibed in
Block Mean Value Based Image Perceptual Hashing by Bian Yang, Fan Gu and Xiamu Niu.

Usage
-----

This script requires png.js and jpgjs, which are linked as
git submodules.  To fetch them run:

    git submodule init
    git submodule update

Or you can download them directly (but the tests require the submodules):

* https://github.com/devongovett/png.js
* https://github.com/notmasteryet/jpgjs

To use the script in a page, add `<script src="blockhash.js"/>` to
your page and call `blockhash(src, bits, method, callback)`, where
`src` is an image URL, `bits` is the number of bits in a row, `method`
is a number 1-4 (see below), and `callback` is a function with
`(error, result)` signature.  On success, `result` will be array of
binary values.

The available methods are:

1. Quick and crude, non-overlapping blocks
2. Precise but slower, non-overlapping blocks

Method 3 is recommended as a good tradeoff between speed and good
matches on any image size.  The quick ones are only advisable when the
image width and height are an even multiple of the number of blocks
used.


Example
-------

    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="content-type" content="text/html; charset=UTF-8">

      <script src="png.js/zlib.js"></script>
      <script src="png.js/png.js"></script>
      <script src="jpgjs/jpg.js"></script>

      <script src="blockhash.js"></script>

      <script>
        var bits = 16;
        blockhash('test.png', bits, 1, function(error, result) {
            console.log('hash: ' + result);
        });
      </script>
    </head>
    <body>
    </body>
    </html>

License
-------

Copyright 2014 Commons Machinery http://commonsmachinery.se/

Distributed under an MIT license, please see LICENSE in the top dir.

Contact: dev@commonsmachinery.se
