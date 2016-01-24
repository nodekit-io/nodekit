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
 */

var util=require('util');
var EventEmitter = require('events').EventEmitter;

function HTTPParser(type) {
    
    if ((type !== 'REQUEST') && (type !== 'RESPONSE'))
        throw new Error("REQUEST OR RESPONSE ONLY");
    
    this.state = type + '_LINE';
    this.info = {
    headers: [],
    updrade: false
    };
    
    this.lineState = "DATA";
    this.encoding = null;
    this.connection = null;
    this.body_bytes = null;
    this.headResponse = null;
   
    if (typeof(this.initialized) === 'undefined')
    {
        this.REQUEST = "REQUEST";
        this.RESPONSE = "RESPONSE";
        
        EventEmitter.call();
        
        this.initialized = true;
        this.on( 'headersComplete', HTTPParser.prototype._onHeadersComplete.bind(this) );
        this.on( 'body',            HTTPParser.prototype._onBody.bind(this) );
        this.on( 'messageComplete', HTTPParser.prototype._onMessageComplete.bind(this) );
    }
}

util.inherits(HTTPParser, EventEmitter);

HTTPParser.prototype.reinitialize = HTTPParser;
HTTPParser.prototype.finish = function () {
};


HTTPParser.kOnHeaders = 0;
HTTPParser.kOnHeadersComplete = 1;
HTTPParser.kOnBody = 2;
HTTPParser.kOnMessageComplete = 3;


var state_handles_increment = {
BODY_RAW: true,
BODY_SIZED: true,
BODY_CHUNK: true
};


HTTPParser.prototype._onHeadersComplete = function(info) {
    this.method          = info.method;
    this.url             = info.url;
    this.versionMajor    = info.versionMajor;
    this.versionMinor    = info.versionMinor;
    this.shouldKeepAlive = info.shouldKeepAlive;
    
    this.statusCode      = info.statusCode;
    this.statusMessage   = info.statusMessage;
    
    this.upgrade         = info.upgrade;
    
    // headers
    this.headers = info.headers;
    return this[HTTPParser.kOnHeadersComplete].call(this, info);
}

HTTPParser.prototype._onBody = function(chunk, offset, length) {
     return this[HTTPParser.kOnBody].call(this, chunk, offset, length);
}

HTTPParser.prototype._onMessageComplete = function(result) {
    this[HTTPParser.kOnMessageComplete].call(this);
}

HTTPParser.prototype.execute = function (buffer) {
    this.chunk = buffer;
    this.start = 0;
    this.offset = 0;
    this.end = buffer.length;
    
    while (this.offset < this.end && this.state !== "UNINITIALIZED") {
        var state = this.state;
        this[state]();
        if (!state_handles_increment[state]) {
            this.offset++;
        }
    }
};

HTTPParser.prototype.consumeLine = function () {
    if (this.captureStart === undefined) {
        this.captureStart = this.offset;
    }
    var byte = this.chunk[this.offset];
    if (byte === 0x0d && this.lineState === "DATA") { // \r
        this.captureEnd = this.offset;
        this.lineState = "ENDING";
        return;
    }
    if (this.lineState === "ENDING") {
        this.lineState = "DATA";
        if (byte !== 0x0a) {
            return;
        }
        var line = this.chunk.toString("ascii", this.captureStart, this.captureEnd);
        this.captureStart = undefined;
        this.captureEnd = undefined;
        return line;
    }
};

var requestExp = /^([A-Z]+) (.*) HTTP\/([0-9]).([0-9])$/;
HTTPParser.prototype.REQUEST_LINE = function () {
    var line = this.consumeLine();
    if (line === undefined) {
        return;
    }
    var match = requestExp.exec(line);
    this.info.method = HTTPParser.methods.indexOf(match[1]);
    if (match[1] === 'CONNECT') {
        this.info.upgrade = true;
    }
    this.info.url = match[2];
    this.info.versionMajor = match[3];
    this.info.versionMinor = match[4];
    this.state = "HEADER";
};

var responseExp = /^HTTP\/([0-9]).([0-9]) (\d+) ([^\n\r]+)$/;
HTTPParser.prototype.RESPONSE_LINE = function () {
    var line = this.consumeLine();
    if (line === undefined) {
        return;
    }
    var match = responseExp.exec(line);
    var versionMajor = this.info.versionMajor = match[1];
    var versionMinor = this.info.versionMinor = match[2];
    var statusCode = this.info.statusCode = Number(match[3]);
    this.info.statusMsg = match[4];
    // Implied zero length.
    if ((statusCode / 100 | 0) === 1 || statusCode === 204 || statusCode === 304) {
        this.body_bytes = 0;
    }
    if (versionMajor === '1' && versionMinor === '0') {
        this.connection = 'close';
    }
    this.state = "HEADER";
};

var headerExp = /^([^:]*): *(.*)$/;
HTTPParser.prototype.HEADER = function () {
    var line = this.consumeLine();
    if (line === undefined) {
        return;
    }
    if (line) {
        var match = headerExp.exec(line);
        var k = match && match[1];
        var v = match && match[2];
        if (k) { // skip empty string (malformed header)
            if (!this.preserveCase) {
                k = k.toLowerCase();
            }
            this.info.headers.push(k);
            this.info.headers.push(v);
            if (this.preserveCase) {
                k = k.toLowerCase();
            }
            if (k === 'transfer-encoding') {
                this.encoding = v;
            } else if (k === 'content-length') {
                this.body_bytes = parseInt(v, 10);
            } else if (k === 'connection') {
                this.connection = v;
            } else if (k === 'upgrade') {
                this.info.upgrade = true;
            }
        }
    } else {
        this.emit('headersComplete', this.info);
        if (this.info.upgrade) {
            this._onMessageComplete();
            this.state = 'UNINITIALIZED';
        } else if (this.headResponse) {
            this._onMessageComplete();
            this.state = 'UNINITIALIZED';
        } else if (this.encoding === 'chunked') {
            this.state = "BODY_CHUNKHEAD";
        } else if (this.body_bytes === null) {
            this.state = "BODY_RAW";
        } else {
            this.state = "BODY_SIZED";
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
        this.emit('messageComplete');
        
        this.state = 'BODY_CHUNKEMPTYLINEDONE';
    } else {
        this.state = 'BODY_CHUNK';
    }
};

HTTPParser.prototype.BODY_CHUNKEMPTYLINE = function () {
    var line = this.consumeLine();
    if (line === undefined) {
        return;
    }
    if (line === undefined) {
        return;
    }
    this.state = 'BODY_CHUNKHEAD';
};

HTTPParser.prototype.BODY_CHUNKEMPTYLINEDONE = function () {
    var line = this.consumeLine();
    if (line === undefined) {
        return;
    }
    this.state = 'UNINITIALIZED';
};

HTTPParser.prototype.BODY_CHUNK = function () {
    var length = Math.min(this.end - this.offset, this.body_bytes);
    this.emit('body', this.chunk, this.offset, length);
    this.offset += length;
    this.body_bytes -= length;
    if (!this.body_bytes) {
        this.state = 'BODY_CHUNKEMPTYLINE';
    }
};

HTTPParser.prototype.BODY_RAW = function () {
    var length = this.end - this.offset;
    this.onBody(this.chunk, this.offset, length);
    this.offset += length;
};

HTTPParser.prototype.BODY_SIZED = function () {
    var length = Math.min(this.end - this.offset, this.body_bytes);
    this.onBody(this.chunk, this.offset, length);
    this.offset += length;
    this.body_bytes -= length;
    if (!this.body_bytes) {
        this._onMessageComplete();
        this.state = 'UNINITIALIZED';
    }
};

HTTPParser.REQUEST = "REQUEST";
HTTPParser.RESPONSE = "RESPONSE";

HTTPParser.methods = [
                      "DELETE",
                      "GET",
                      "HEAD",
                      "POST",
                      "PUT",
                      "CONNECT",
                      "OPTIONS",
                      "TRACE",
                      "COPY",
                      "LOCK",
                      "MKCOL",
                      "MOVE",
                      "PROPFIND",
                      "PROPPATCH",
                      "SEARCH",
                      "UNLOCK",
                      "REPORT",
                      "MKACTIVITY",
                      "CHECKOUT",
                      "MERGE",
                      "MSEARCH",
                      "NOTIFY",
                      "SUBSCRIBE",
                      "UNSUBSCRIBE",
                      "PATCH",
                      "PURGE"];

module.exports.HTTPParser = HTTPParser;

