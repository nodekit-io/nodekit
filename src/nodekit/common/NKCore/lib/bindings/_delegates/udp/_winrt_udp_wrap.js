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


var Handle = process.binding('handle_wrap').Handle,
    util   = require('util');


var UDP = function() {
  if (!(this instanceof UDP)) return new UDP();
  Handle.call(this, "TODO: REPLACE WITH DELEGATE");
};
util.inherits(UDP, Handle);

exports.UDP = UDP;

UDP.prototype.bind = function(ip, port, flags) {
    return new Error("Not Implemented");
};

UDP.prototype.bind6 = function(ip, port, flags) {
    return new Error("Not Implemented");
};

UDP.prototype.recvStart = function() {
    return new Error("Not Implemented");
};

UDP.prototype.send = function(req, buffer, offset, length, port, address) {
    return new Error("Not Implemented");
};

UDP.prototype.send6 = function(req, buffer, offset, length, port, address) {
    return new Error("Not Implemented");
};

UDP.prototype.recvStop = function() {
    return new Error("Not Implemented");
};

UDP.prototype.getsockname = function(out) {
    return new Error("Not Implemented");
};

UDP.prototype.addMembership = function(mcastAddr, ifaceAddr) {
    return new Error("Not Implemented");
};

UDP.prototype.dropMembership = function () {
    return new Error("Not Implemented");
};

UDP.prototype.setMulticastTTL = function(arg) {
    return new Error("Not Implemented");
};

UDP.prototype.setMulticastLoopback = function(arg) {
    return new Error("Not Implemented");
};

UDP.prototype.setBroadcast = function(arg) {
    return new Error("Not Implemented");
};

UDP.prototype.setTTL = function(arg) {
    return new Error("Not Implemented");
};

