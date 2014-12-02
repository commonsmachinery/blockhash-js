blockhash-js
============

This is a perceptual image hash calculation tool based on algorithm descibed in
Block Mean Value Based Image Perceptual Hashing by Bian Yang, Fan Gu and Xiamu Niu.

Installation
-----

This module is installed via npm:

```
  $ npm install blockhash
```

Use in the browser
-----
To use this library in the browser, you can build it with Browserify
with something like `browserify index.js --standalone blockhashjs >
blockhash.js`

Include it and `zlib.js` on your page:
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Blockhash</title>
  </head>
  <body>
    <script src="node_modules/png-js/zlib.js"></script>
    <script src="blockhash.js"></script>
    <script>
      var blockhash = blockhashjs.blockhash;
    </script>
  </body>
</html>
```

Call `blockhash(src, bits, method, callback)`, where
`src` is an image URL, `bits` is the number of bits in a row, `method`
is a number 1-2 (see below), and `callback` is a function with
`(error, result)` signature.  On success, `result` will be array of
binary values.

The available methods are:

1. Quick and crude, non-overlapping blocks
2. Precise but slower, non-overlapping blocks

Method 2 is recommended as a good tradeoff between speed and good
matches on any image size.  The quick ones are only advisable when the
image width and height are an even multiple of the number of blocks
used.

License
-------

Copyright 2014 Commons Machinery http://commonsmachinery.se/

Distributed under an MIT license, please see LICENSE in the top dir.

Contact: dev@commonsmachinery.se

