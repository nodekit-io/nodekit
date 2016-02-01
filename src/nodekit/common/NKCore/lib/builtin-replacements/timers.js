/*
* nodekit.io
*
* Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
* Portions Copyright © 2012 J. Ryan Stinnett <jryans@gmail.com>
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
var nextTick = process.nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;
var nativeTimeout = io.nodekit.platform.process.setTimeout;

exports.setTimeout = function() {
    
   return new Timeout(apply.call(nativeTimeout, global, arguments), clearTimeout);
};
exports.setInterval2 = function() {
    return new Timeout(apply.call(setInterval, global, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { if (timeout) timeout.close(); };

function Timeout(id, clearFn) {
    this._id = id;
    this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
    this._clearFn.call(global, this._id);
};

exports.enroll = function(item, msecs) {
    clearTimeout(item._idleTimeoutId);
    item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
    clearTimeout(item._idleTimeoutId);
    item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
    clearTimeout(item._idleTimeoutId);
    
    var msecs = item._idleTimeout;
    if (msecs >= 0) {
        item._idleTimeoutId = nativeTimeout(function onTimeout() {
                                         if (item._onTimeout)
                                         item._onTimeout();
                                         }, msecs);
    }
};

exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
    var id = nextImmediateId++;
    var args = arguments.length < 2 ? false : slice.call(arguments, 1);
    
    immediateIds[id] = true;
    
    nextTick(function onNextTick() {
             if (immediateIds[id]) {
              if (args) {
             fn.apply(null, args);
             } else {
             fn.call(null);
             }
             exports.clearImmediate(id);
             }
             });
    
    return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
    delete immediateIds[id];
};