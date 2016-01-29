/*
 * Copyright (c) 2016 OffGrid Networks.  Portions Copyright 2014 Red Hat, Inc.
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
//var Stream = process.binding('stream_wrap').Stream;

function guessHandleType(fd) {
  if ( fd <= 2 ) {
   // if ( process.isatty( fd ) ) {
      return 'TTY';
   // }
   // return 'PIPE';
  }

  return 'FILE';
}

function isTTY(fd) {
    return false;
  return guessHandleType(fd) == 'TTY';
}

function TTY(fd, readable) {
}

//util.inherits(TTY,Stream);

TTY.prototype.getWindowSize = function(out) {
    out[0] = 80;
    out[1] = 25;
}

TTY.prototype.setRawMode = function(rawMode) {
  this._stream.setRawMode( rawMode );
}

TTY.prototype.writeUtf8String = function(req,data) {
    io.nodekit.platform.console.log("TTY:" + data);
    req.oncomplete(0, this, req);
};

module.exports.guessHandleType = guessHandleType;
module.exports.isTTY = isTTY;
module.exports.TTY = TTY;
