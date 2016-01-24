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
 */

"use strict";

var util = require('util');
var Stream = process.binding('stream_wrap').Stream;
var TCP = process.binding( 'tcp_wrap').TCP;

function Pipe(ipc) {
  this._ipc = ipc;
  this._pipe = {};
   Stream.call( this, this._pipe );
}

util.inherits(Pipe, Stream);

Pipe.prototype._onDataWithHandle = function(result) {
    return new Error("Not Implemented");
}

Pipe.prototype.closeDownstream = function() {
    return new Error("Not Implemented");
}

Pipe.prototype._create = function(downstreamFd) {
    return new Error("Not Implemented");
}

Pipe.prototype.bind = function() {
    return new Error("Not Implemented");
};

Pipe.prototype.listen = function() {
    return new Error("Not Implemented");
};

Pipe.prototype.connect = function() {
    return new Error("Not Implemented");
};

Pipe.prototype.open = function(fd) {
    return new Error("Not Implemented");
};

Pipe.prototype.writeUtf8String = function(req,data,handle) {
    return new Error("Not Implemented");
};

module.exports.Pipe = Pipe;

module.exports.PipeConnectWrap = function PipeConnectWrap(){};
