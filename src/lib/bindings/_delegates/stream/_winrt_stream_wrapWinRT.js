/*
 * Copyright 2014 Domabo.  Portions copyright Red Hat, Inc.
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

// PLATFORM: WINRT

"use strict";

var util = require('util');
var Handle = process.binding('handle_wrap').Handle;
var Buffer = require('buffer');
var Timers = require('timers');
var chunkSize = 4096;

function Stream() {
   Handle.call( this, this._stream );
}

util.inherits(Stream, Handle);

Stream.prototype.close = function (callback) {
    this.readStop();
    this._reader.close();
    this._writer.close();
    Stream.super_.prototype.close.call(this, callback);
};

Stream.prototype.setStreams = function (inputstream, outputstream) {
    var writer = new Windows.Storage.Streams.DataWriter(outputstream);
    self._writer = writer;
    self._writer.unicodeEncoding = Windows.Storage.Streams.UnicodeEncoding.utf8;
    self._writer.byteOrder = Windows.Storage.Streams.ByteOrder.littleEndian;

    var reader = new Windows.Storage.Streams.DataReader(inputstream);
    reader.inputStreamOptions = Windows.Storage.Streams.InputStreamOptions.Partial;
};

Stream.prototype.readStart = function() {
    readLoop(this);
};

var readLoop = function (self) {
    self._reader.loadAsync(chunkSize).done(function (numBytes) {
        if (numBytes > 0)
            {
        var bytes = new Uint8Array(numBytes);
        self._reader.readBytes(bytes);
        var buffer = new Buffer(bytes);
        self.onread(numBytes, bufbuffer)
        self._readLoopTimer = Timers.setTimeOut(readLoop, 500, self);
        }
        else
        {
            //successfully read 0 bytes;  EOF or socket closed
            self.onread(-1);
        }
    });
}

Stream.prototype.readStop = function () {
    Timers.clearTimeout(this._readLoopTimer);
};

Stream.prototype.writeUtf8String = function(req,data) {
    this._writer.writeString(data);
    req.oncomplete(0, this, req);
};

Stream.prototype.writeAsciiString = function(req,data) {
    this._writer.writeBytes(asciiStringToBytes(data));
    req.oncomplete(0, this, req);
};

Stream.prototype.writeBuffer = function (req, data) {
    data = arrayBuffer(data);
    this._writer.writeBytes(data);
    req.oncomplete(0, this, req);

    /* TO DO CONVERT TO ASYNC ALONG LINES OF:
    *
    var self = this;
    data = arrayBuffer(data);
    self.writeQueueSize += data.byteLength;
    var req = {
       oncomplete: noop,
       bytes: data.byteLength
      };
    this._writer.writeBytesAsync(data).then(function(bytesWritten){
      self.writeQueueSize -= bytesWritten;
      req.oncomplete(0, self, req);
    });
    return req;
  */
};

var arrayBuffer = function (data) {
    if (data.constructor.name !== 'ArrayBuffer') {
        var array = new Uint8Array(data.length);
        for (var i = 0; i < array.length; i++) {
            var value = data[i];
            array[i] = value;
        }
        data = array.buffer;
    }
    return data;
};

var asciiStringToBytes = function(str) {
    var ch, st, re = [];
    for (var i = 0; i < str.length; i++) {
        ch = str.charCodeAt(i);  // get char 
        st = [];                 // set up "stack"
        do {
            st.push(ch & 0xFF);  // push byte to stack
            ch = ch >> 8;          // shift value down by 1 byte
        }
        while (ch);
        // add stack contents to result
        // done because chars have "wrong" endianness
        re = re.concat(st.reverse());
    }
    // return an array of bytes
    return re;
}

module.exports.Stream = Stream;
