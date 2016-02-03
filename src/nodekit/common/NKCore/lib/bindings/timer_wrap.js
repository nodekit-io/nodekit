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
this.global = this;

var NativeTimer = require('platform').Timer;
var util = require('util');
var Handle = process.binding('handle_wrap').Handle;

var kOnTimeout = 0;

function invokeTimeoutHandler() {
    return this[kOnTimeout].apply(this, arguments);
}

function Timer() {
    this._timer = new NativeTimer();
    this._timer.setOnTimeout(invokeTimeoutHandler.bind(this));
    Handle.call( this, this._timer );
}
util.inherits( Timer, Handle );

Timer.kOnTimeout = kOnTimeout;

Timer.prototype.start = function(msec, repeat) {
    this._timer.start(msec, repeat);
}

Timer.prototype.stop = function() {
    this._timer.stop();
    this._timer.dispose();
}

Timer.now = function() { var x = new Date().getTime(); return x }

module.exports.Timer = Timer;
