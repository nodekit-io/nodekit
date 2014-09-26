/*
 * Copyright 2014 Domabo
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    zlib_delegate = require('./delegates/zlib/binding.js').Zlib

exports.NONE = 0;
exports.DEFLATE = 1;
exports.INFLATE = 2;
exports.GZIP = 3;
exports.GUNZIP = 4;
exports.DEFLATERAW = 5;
exports.INFLATERAW = 6;
exports.UNZIP = 7;

function Zlib(mode) {
  if (!(this instanceof Zlib)) return new Zlib(mode);
  this._delegate = new zlib_delegate(mode);
  this._delegate.on('error', this._onError.bind(this));
}

util.inherits(Zlib, EventEmitter);
module.exports.Zlib = Zlib;

Zlib.prototype.init = function(windowBits, level, memLevel, strategy, dictionary) {
    return _delegate.init(windowBits, level, memLevel, strategy, dictionary);
};

Zlib.prototype.params = function(level, strategy) {
    return _delegate.params(level, strategy);
};

Zlib.prototype.reset = function() {
    return _delegate.reset();
};

Zlib.prototype.close = function() {
    return _delegate.close();
};

Zlib.prototype.write = function(flushFlag, chunk, inOffset, inLen, outBuffer, outOffset, outLen) {
    return _delegate.write(flushFlag, chunk, inOffset, inLen, outBuffer, outOffset, outLen);
};

Zlib.prototype.writeSync = function(flushFlag, chunk, inOffset, inLen, outBuffer, outOffset, outLen) {
    return _delegate.writeSync(flushFlag, chunk, inOffset, inLen, outBuffer, outOffset, outLen);
};

Zlib.prototype._onError = function(result) {
    this.onerror(result.error.message, result.result);
};
