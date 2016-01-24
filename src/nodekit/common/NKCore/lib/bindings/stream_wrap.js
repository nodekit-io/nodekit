/*
 * Copyright (c) 2016 OffGrid Networks; Portions Copyright 2014 Red Hat
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

var _delegate;

switch(process.platform) {
    case 'darwin':
    case 'ios':
        _delegate = require('./_delegates/stream/_darwin_stream_wrap.js');
        break;
    case 'win32':
        _delegate = require('./_delegates/tcp/_winrt_stream_wrap.js');
        break;
    default:
        _delegate = require('./_delegates/tcp/_browser_stream_wrap.js');
        break;
}

exports.Stream = _delegate.Stream;
exports.ShutdownWrap = function ShutdownWrap(){};
exports.WriteWrap = function WriteWrap(){};