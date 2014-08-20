blockhash-js
============

This is a perceptual image hash calculation tool based on algorithm descibed in
Block Mean Value Based Image Perceptual Hashing by Bian Yang, Fan Gu and Xiamu Niu.

A paper describing the algorithm can be found in doc/ directory.

Usage
-----

This script requires png.js and jpgjs, which can be downloaded from:

* https://github.com/devongovett/png.js
* https://github.com/notmasteryet/jpgjs

To use the script in a page, add `<script src="blockhash.js"/>` to your page and
call `bmvbhash(src, bits, method, callback)`, where `src` is an image URL, `bits`
is the number of bits in a row, `method` can be either 1 (non-overlapping) or 2
(overlapping), and `callback` is a function with `(error, result)` signature.
On success, `result` will be array of binary values.

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
        bmvbhash('test.png', bits, 1, function(error, result) {
          for (var y = 0; y < bits; y++) {
              console.log(result.slice(y * bits, y * bits + bits).join(""));
          }
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
