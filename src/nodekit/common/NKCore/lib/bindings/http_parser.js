/*
 * Copyright (c) 2016 OffGrid Networks
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
 * Portions copyright RedHat;  Portions copyright Tim Caswell
 
 Copyright (c) 2015 Tim Caswell (https://github.com/creationix) and other contributors. All rights reserved.
 
 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var assert = require('assert');

exports.HTTPParser = HTTPParser;
function HTTPParser(type) {
    assert.ok(type === HTTPParser.REQUEST || type === HTTPParser.RESPONSE);
    this.type = type;
    this.state = type + '_LINE';
    this.info = {
    headers: [],
    upgrade: false
    };
    this.trailers = [];
    this.line = '';
    this.isChunked = false;
    this.connection = '';
    this.headerSize = 0; // for preventing too big headers
    this.body_bytes = null;
    this.isUserCall = false;
}
HTTPParser.REQUEST = 'REQUEST';
HTTPParser.RESPONSE = 'RESPONSE';
var kOnHeaders = HTTPParser.kOnHeaders = 0;
var kOnHeadersComplete = HTTPParser.kOnHeadersComplete = 1;
var kOnBody = HTTPParser.kOnBody = 2;
var kOnMessageComplete = HTTPParser.kOnMessageComplete = 3;

var compatMode0_12 = true;
Object.defineProperty(HTTPParser, 'kOnExecute', {
                      get: function () {
                      // hack for backward compatibility
                      compatMode0_12 = false;
                      return 4;
                      }
                      });

var methods = HTTPParser.methods = [
                                    'DELETE',
                                    'GET',
                                    'HEAD',
                                    'POST',
                                    'PUT',
                                    'CONNECT',
                                    'OPTIONS',
                                    'TRACE',
                                    'COPY',
                                    'LOCK',
                                    'MKCOL',
                                    'MOVE',
                                    'PROPFIND',
                                    'PROPPATCH',
                                    'SEARCH',
                                    'UNLOCK',
                                    'BIND',
                                    'REBIND',
                                    'UNBIND',
                                    'ACL',
                                    'REPORT',
                                    'MKACTIVITY',
                                    'CHECKOUT',
                                    'MERGE',
                                    'M-SEARCH',
                                    'NOTIFY',
                                    'SUBSCRIBE',
                                    'UNSUBSCRIBE',
                                    'PATCH',
                                    'PURGE',
                                    'MKCALENDAR',
                                    'LINK',
                                    'UNLINK'
                                    ];
HTTPParser.prototype.reinitialize = HTTPParser;
HTTPParser.prototype.close =
HTTPParser.prototype.pause =
HTTPParser.prototype.resume = function () {};
HTTPParser.prototype._compatMode0_11 = false;

var maxHeaderSize = 80 * 1024;
var headerState = {
REQUEST_LINE: true,
RESPONSE_LINE: true,
HEADER: true
};
HTTPParser.prototype.execute = function (chunk, start, length) {
    if (!(this instanceof HTTPParser)) {
        throw new TypeError('not a HTTPParser');
    }
    
    // backward compat to node < 0.11.4
    // Note: the start and length params were removed in newer version
    start = start || 0;
    length = typeof length === 'number' ? length : chunk.length;
    
    this.chunk = chunk;
    this.offset = start;
    var end = this.end = start + length;
    try {
        while (this.offset < end) {
            if (this[this.state]()) {
                break;
            }
        }
    } catch (err) {
        if (this.isUserCall) {
            throw err;
        }
        return err;
    }
    this.chunk = null;
    var length = this.offset - start
    if (headerState[this.state]) {
        this.headerSize += length;
        if (this.headerSize > maxHeaderSize) {
            return new Error('max header size exceeded');
        }
    }
    return length;
};

var stateFinishAllowed = {
REQUEST_LINE: true,
RESPONSE_LINE: true,
BODY_RAW: true
};
HTTPParser.prototype.finish = function () {
    if (!stateFinishAllowed[this.state]) {
        return new Error('invalid state for EOF');
    }
    if (this.state === 'BODY_RAW') {
        this.userCall()(this[kOnMessageComplete]());
    }
};

// These three methods are used for an internal speed optimization, and it also
// works if theses are noops. Basically consume() asks us to read the bytes
// ourselves, but if we don't do it we get them through execute().
HTTPParser.prototype.consume =
HTTPParser.prototype.unconsume =
HTTPParser.prototype.getCurrentBuffer = function () {};

//For correct error handling - see HTTPParser#execute
//Usage: this.userCall()(userFunction('arg'));
HTTPParser.prototype.userCall = function () {
    this.isUserCall = true;
    var self = this;
    return function (ret) {
        self.isUserCall = false;
        return ret;
    };
};

HTTPParser.prototype.nextRequest = function () {
    this.userCall()(this[kOnMessageComplete]());
    this.reinitialize(this.type);
};

HTTPParser.prototype.consumeLine = function () {
    var end = this.end,
    chunk = this.chunk;
    for (var i = this.offset; i < end; i++) {
        if (chunk[i] === 0x0a) { // \n
            var line = this.line + chunk.toString('ascii', this.offset, i);
            if (line.charAt(line.length - 1) === '\r') {
                line = line.substr(0, line.length - 1);
            }
            this.line = '';
            this.offset = i + 1;
            return line;
        }
    }
    //line split over multiple chunks
    this.line += chunk.toString('ascii', this.offset, this.end);
    this.offset = this.end;
};

var headerExp = /^([^: \t]+):[ \t]*((?:.*[^ \t])|)/;
var headerContinueExp = /^[ \t]+(.*[^ \t])/;
HTTPParser.prototype.parseHeader = function (line, headers) {
    var match = headerExp.exec(line);
    var k = match && match[1];
    if (k) { // skip empty string (malformed header)
        headers.push(k);
        headers.push(match[2]);
    } else {
        var matchContinue = headerContinueExp.exec(line);
        if (matchContinue && headers.length) {
            if (headers[headers.length - 1]) {
                headers[headers.length - 1] += ' ';
            }
            headers[headers.length - 1] += matchContinue[1];
        }
    }
};

var requestExp = /^([A-Z-]+) ([^ ]+) HTTP\/(\d)\.(\d)$/;
HTTPParser.prototype.REQUEST_LINE = function () {
    var line = this.consumeLine();
    if (!line) {
        return;
    }
    var match = requestExp.exec(line);
    if (match === null) {
        var err = new Error('Parse Error');
        err.code = 'HPE_INVALID_CONSTANT';
        throw err;
    }
    this.info.method = this._compatMode0_11 ? match[1] : methods.indexOf(match[1]);
    if (this.info.method === -1) {
        throw new Error('invalid request method');
    }
    if (match[1] === 'CONNECT') {
        this.info.upgrade = true;
    }
    this.info.url = match[2];
    this.info.versionMajor = +match[3];
    this.info.versionMinor = +match[4];
    this.body_bytes = 0;
    this.state = 'HEADER';
};

var responseExp = /^HTTP\/(\d)\.(\d) (\d{3}) ?(.*)$/;
HTTPParser.prototype.RESPONSE_LINE = function () {
    var line = this.consumeLine();
    if (!line) {
        return;
    }
    var match = responseExp.exec(line);
    if (match === null) {
        var err = new Error('Parse Error');
        err.code = 'HPE_INVALID_CONSTANT';
        throw err;
    }
    this.info.versionMajor = +match[1];
    this.info.versionMinor = +match[2];
    var statusCode = this.info.statusCode = +match[3];
    this.info.statusMessage = match[4];
    // Implied zero length.
    if ((statusCode / 100 | 0) === 1 || statusCode === 204 || statusCode === 304) {
        this.body_bytes = 0;
    }
    this.state = 'HEADER';
};

HTTPParser.prototype.shouldKeepAlive = function () {
    if (this.info.versionMajor > 0 && this.info.versionMinor > 0) {
        if (this.connection.indexOf('close') !== -1) {
            return false;
        }
    } else if (this.connection.indexOf('keep-alive') === -1) {
        return false;
    }
    if (this.body_bytes !== null || this.isChunked) { // || skipBody
        return true;
    }
    return false;
};

HTTPParser.prototype.HEADER = function () {
    var line = this.consumeLine();
    if (line === undefined) {
        return;
    }
    var info = this.info;
    if (line) {
        this.parseHeader(line, info.headers);
    } else {
        var headers = info.headers;
        for (var i = 0; i < headers.length; i += 2) {
            switch (headers[i].toLowerCase()) {
                case 'transfer-encoding':
                    this.isChunked = headers[i + 1].toLowerCase() === 'chunked';
                    break;
                case 'content-length':
                    this.body_bytes = +headers[i + 1];
                    break;
                case 'connection':
                    this.connection += headers[i + 1].toLowerCase();
                    break;
                case 'upgrade':
                    info.upgrade = true;
                    break;
            }
        }
        
        info.shouldKeepAlive = this.shouldKeepAlive();
        //problem which also exists in original node: we should know skipBody before calling onHeadersComplete
        var skipBody;
        if (compatMode0_12) {
            skipBody = this.userCall()(this[kOnHeadersComplete](info));
        } else {
            skipBody = this.userCall()(this[kOnHeadersComplete](info.versionMajor,
                                                                info.versionMinor, info.headers, info.method, info.url, info.statusCode,
                                                                info.statusMessage, info.upgrade, info.shouldKeepAlive));
        }
        
        if (info.upgrade) {
            this.nextRequest();
            return true;
        } else if (this.isChunked && !skipBody) {
            this.state = 'BODY_CHUNKHEAD';
        } else if (skipBody || this.body_bytes === 0) {
            this.nextRequest();
        } else if (this.body_bytes === null) {
            this.state = 'BODY_RAW';
        } else {
            this.state = 'BODY_SIZED';
        }
    }
};

HTTPParser.prototype.BODY_CHUNKHEAD = function () {
    var line = this.consumeLine();
    if (line === undefined) {
        return;
    }
    this.body_bytes = parseInt(line, 16);
    if (!this.body_bytes) {
        this.state = 'BODY_CHUNKTRAILERS';
    } else {
        this.state = 'BODY_CHUNK';
    }
};

HTTPParser.prototype.BODY_CHUNK = function () {
    var length = Math.min(this.end - this.offset, this.body_bytes);
    this.userCall()(this[kOnBody](this.chunk, this.offset, length));
    this.offset += length;
    this.body_bytes -= length;
    if (!this.body_bytes) {
        this.state = 'BODY_CHUNKEMPTYLINE';
    }
};

HTTPParser.prototype.BODY_CHUNKEMPTYLINE = function () {
    var line = this.consumeLine();
    if (line === undefined) {
        return;
    }
    assert.equal(line, '');
    this.state = 'BODY_CHUNKHEAD';
};

HTTPParser.prototype.BODY_CHUNKTRAILERS = function () {
    var line = this.consumeLine();
    if (line === undefined) {
        return;
    }
    if (line) {
        this.parseHeader(line, this.trailers);
    } else {
        if (this.trailers.length) {
            this.userCall()(this[kOnHeaders](this.trailers, ''));
        }
        this.nextRequest();
    }
};

HTTPParser.prototype.BODY_RAW = function () {
    var length = this.end - this.offset;
    this.userCall()(this[kOnBody](this.chunk, this.offset, length));
    this.offset = this.end;
};

HTTPParser.prototype.BODY_SIZED = function () {
    var length = Math.min(this.end - this.offset, this.body_bytes);
    this.userCall()(this[kOnBody](this.chunk, this.offset, length));
    this.offset += length;
    this.body_bytes -= length;
    if (!this.body_bytes) {
        this.nextRequest();
    }
};

// backward compat to node < 0.11.6
['Headers', 'HeadersComplete', 'Body', 'MessageComplete'].forEach(function (name) {
                                                                  var k = HTTPParser['kOn' + name];
                                                                  Object.defineProperty(HTTPParser.prototype, 'on' + name, {
                                                                                        get: function () {
                                                                                        return this[k];
                                                                                        },
                                                                                        set: function (to) {
                                                                                        // hack for backward compatibility
                                                                                        this._compatMode0_11 = true;
                                                                                        return (this[k] = to);
                                                                                        }
                                                                                        });
                                                                  });