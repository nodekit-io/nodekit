![NK-Core](../images/NKCore.png?v01)
# Zlib

    Native U8IntArray Javascript Replacement that is Node.js API compatible
    
You can access this module with:

    var zlib = require('zlib');


## Examples

Compressing or decompressing a file can be done by piping an
fs.ReadStream into a zlib stream, then into an fs.WriteStream.

    var gzip = zlib.createGzip();
    var fs = require('fs');
    var inp = fs.createReadStream('input.txt');
    var out = fs.createWriteStream('input.txt.gz');

    inp.pipe(gzip).pipe(out);

Compressing or decompressing data in one step can be done by using
the convenience methods.

    var input = '.................................';
    zlib.deflate(input, function(err, buffer) {
      if (!err) {
        console.log(buffer.toString('base64'));
      }
    });

    var buffer = new Buffer('eJzT0yMAAGTvBe8=', 'base64');
    zlib.unzip(buffer, function(err, buffer) {
      if (!err) {
        console.log(buffer.toString());
      }
    });

To use this module in an HTTP client or server, use the
[accept-encoding](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3)
on requests, and the
[content-encoding](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.11)
header on responses.

**Note: these examples are drastically simplified to show
the basic concept.**  Zlib encoding can be expensive, and the results
ought to be cached.  See [Memory Usage Tuning](#zlib_memory_usage_tuning)
below for more information on the speed/memory/compression
tradeoffs involved in zlib usage.

    // client request example
    var zlib = require('zlib');
    var http = require('http');
    var fs = require('fs');
    var request = http.get({ host: 'izs.me',
                             path: '/',
                             port: 80,
                             headers: { 'accept-encoding': 'gzip,deflate' } });
    request.on('response', function(response) {
      var output = fs.createWriteStream('izs.me_index.html');

      switch (response.headers['content-encoding']) {
        // or, just use zlib.createUnzip() to handle both cases
        case 'gzip':
          response.pipe(zlib.createGunzip()).pipe(output);
          break;
        case 'deflate':
          response.pipe(zlib.createInflate()).pipe(output);
          break;
        default:
          response.pipe(output);
          break;
      }
    });

    // server example
    // Running a gzip operation on every request is quite expensive.
    // It would be much more efficient to cache the compressed buffer.
    var zlib = require('zlib');
    var http = require('http');
    var fs = require('fs');
    http.createServer(function(request, response) {
      var raw = fs.createReadStream('index.html');
      var acceptEncoding = request.headers['accept-encoding'];
      if (!acceptEncoding) {
        acceptEncoding = '';
      }

      // Note: this is not a conformant accept-encoding parser.
      // See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
      if (acceptEncoding.match(/\bdeflate\b/)) {
        response.writeHead(200, { 'content-encoding': 'deflate' });
        raw.pipe(zlib.createDeflate()).pipe(response);
      } else if (acceptEncoding.match(/\bgzip\b/)) {
        response.writeHead(200, { 'content-encoding': 'gzip' });
        raw.pipe(zlib.createGzip()).pipe(response);
      } else {
        response.writeHead(200, {});
        raw.pipe(response);
      }
    }).listen(1337);

## zlib.createGzip([options])

Returns a new [Gzip](#zlib_class_zlib_gzip) object with an
[options](#zlib_options).

## zlib.createGunzip([options])

Returns a new [Gunzip](#zlib_class_zlib_gunzip) object with an
[options](#zlib_options).

## zlib.createDeflate([options])

Returns a new [Deflate](#zlib_class_zlib_deflate) object with an
[options](#zlib_options).

## zlib.createInflate([options])

Returns a new [Inflate](#zlib_class_zlib_inflate) object with an
[options](#zlib_options).

## zlib.createDeflateRaw([options])

Returns a new [DeflateRaw](#zlib_class_zlib_deflateraw) object with an
[options](#zlib_options).

## zlib.createInflateRaw([options])

Returns a new [InflateRaw](#zlib_class_zlib_inflateraw) object with an
[options](#zlib_options).

## zlib.createUnzip([options])

Returns a new [Unzip](#zlib_class_zlib_unzip) object with an
[options](#zlib_options).


## Class: zlib.Zlib

Not exported by the `zlib` module. It is documented here because it is the base
class of the compressor/decompressor classes.

### zlib.flush([kind], callback)

`kind` defaults to `zlib.Z_FULL_FLUSH`.

Flush pending data. Don't call this frivolously, premature flushes negatively
impact the effectiveness of the compression algorithm.

### zlib.params(level, strategy, callback)

Dynamically update the compression level and compression strategy.
Only applicable to deflate algorithm.

### zlib.reset()

Reset the compressor/decompressor to factory defaults. Only applicable to
the inflate and deflate algorithms.

## Class: zlib.Gzip

Compress data using gzip.

## Class: zlib.Gunzip

Decompress a gzip stream.

## Class: zlib.Deflate

Compress data using deflate.

## Class: zlib.Inflate

Decompress a deflate stream.

## Class: zlib.DeflateRaw

Compress data using deflate, and do not append a zlib header.

## Class: zlib.InflateRaw

Decompress a raw deflate stream.

## Class: zlib.Unzip

Decompress either a Gzip- or Deflate-compressed stream by auto-detecting
the header.

## Convenience Methods

<!--type=misc-->

All of these take a string or buffer as the first argument, an optional second
argument to supply options to the zlib classes and will call the supplied
callback with `callback(error, result)`.

Every method has a `*Sync` counterpart, which accept the same arguments, but
without a callback.

## zlib.deflate(buf[, options], callback)
## zlib.deflateSync(buf[, options])

Compress a string with Deflate.

## zlib.deflateRaw(buf[, options], callback)
## zlib.deflateRawSync(buf[, options])

Compress a string with DeflateRaw.

## zlib.gzip(buf[, options], callback)
## zlib.gzipSync(buf[, options])

Compress a string with Gzip.

## zlib.gunzip(buf[, options], callback)
## zlib.gunzipSync(buf[, options])

Decompress a raw Buffer with Gunzip.

## zlib.inflate(buf[, options], callback)
## zlib.inflateSync(buf[, options])

Decompress a raw Buffer with Inflate.

## zlib.inflateRaw(buf[, options], callback)
## zlib.inflateRawSync(buf[, options])

Decompress a raw Buffer with InflateRaw.

## zlib.unzip(buf[, options], callback)
## zlib.unzipSync(buf[, options])

Decompress a raw Buffer with Unzip.

