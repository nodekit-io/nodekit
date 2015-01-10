/*
 * Copyright 2015 Domabo.  Portions copyright Red Hat, Inc.
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

// PLATFORM: DARWIN

"use strict";

var util = require('util');
var Handle = process.binding('handle_wrap').Handle;

var Buffer = require('buffer').Buffer;

function Stream(stream) {
    this._stream = stream;
    this._onStreamData = Stream.prototype._onData.bind(this);
    this._onStreamEnd = Stream.prototype._onEnd.bind(this);
    
    this._stream.on( 'data', this._onStreamData );
    this._stream.on( 'end', this._onStreamEnd );
    Handle.call( this, this._stream );
}

util.inherits(Stream, Handle);

// ----------------------------------------

Stream.prototype._onData = function(chunk) {
    var b = new Buffer( chunk, 'base64');
    this.onread( b.length, b );
};

Stream.prototype._onEnd = function() {
    if (this._stream)
    {
    this._stream.removeListener( 'data', this._onStreamData );
    this._stream.removeListener( 'end', this._onStreamEnd );
        
        this._onStreamData = null;
        this._onStreamEnd = null;
        this._stream = null;
    };

    if ( this.onread ) {
        this.onread( -1 );
        this.onread = null;
    }
  
};

// ----------------------------------------

Stream.prototype.readStart = function() {
    this._stream.resume();
};

Stream.prototype.readStop = function() {
    this._stream.pause();
};

Stream.prototype.writeUtf8String = function(req, data) {
    this._stream.write(data, 'utf8');
};

Stream.prototype.writeAsciiString = function(req, data) {
    this._stream.write(data, 'ascii');
};

Stream.prototype.writeBuffer = function(req, data) {
    this._stream.write(data.toString('base64'), 'base64');
    req.oncomplete(0, this, req );
};

Stream.prototype.shutdown = function(req) {
 //   this._stream.close();
    req.oncomplete( 0, this, req );
};

module.exports.Stream = Stream;