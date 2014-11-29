/*
 * Copyright 2014 Domabo.  Portions Copyright 2014 Red Hat, Inc.
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

var util = require('util');
var Handle = process.binding('handle_wrap').Handle;
var kOnTimeout = 0;

function invokeTimeoutHandler() {
    return this[kOnTimeout].apply(this, arguments);
}

function Timer() {
    this._nativeTimer = io.nodekit.console.timer();
    this._nativeTimer.onTimeout = invokeTimeoutHandler.bind(this);

    Handle.call( this, this._nativeTimer );
}

util.inherits( Timer, Handle );

Timer.kOnTimeout = kOnTimeout;

Timer.now = function() { return new Date().getTime(); }


Timer.prototype.start = function(delay, period) {
     this._nativeTimer.start(delay, period);
     return 0;
 };
 
 Timer.prototype.stop = function() {
     this._nativeTimer.stop();
     return 0;
 };
 
 Timer.prototype.setRepeat = function(period) {
      this._nativeTimer.repeatPeriod = period;
 };
 
 Timer.prototype.getRepeat = function() {
    return this._nativeTimer.repeatPeriod;
 };
 
 Timer.prototype.again = function() {
     if (!this[kOnTimeout]) {
         return -22;
     }
         
     var repeatPeriod = this.getRepeat();
     if (repeatPeriod) {
         this.stop();
         this.start(repeatPeriod, repeatPeriod);
     }
     return 0;
 };

module.exports.Timer = Timer;
