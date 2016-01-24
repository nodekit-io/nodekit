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

var util = require('util');
var Stream = require('stream');

function TCP() {
    Stream.call(this);
    this._clientSocket = null;
}

util.inherits(TCP, Stream);

Object.defineProperty( TCP.prototype, '_fd', {
  get: function() {
    return this._tcp.fd;
  }
})

TCP.prototype.close = function (callback) {
    if (this._clientSocket)
        this._clientSocket.close();

    TCP.super_.prototype.close.call(this, callback);
};

// ----------------------------------------
// Server
// ----------------------------------------
TCP.prototype._onConnection = function(result) {
    return new Error("Not Implemented");
}

// ----------------------------------------

TCP.prototype.getpeername = function(out) {
    return new Error("Not Implemented");
}

TCP.prototype.getsockname = function(out) {
    return new Error("Not Implemented");
}

TCP.prototype.bind6 = function(addr,port) {
  return new Error( "ipv6 not supported" );
}

TCP.prototype.bind = function(addr, port) {
    return new Error("Not Implemented");
}

TCP.prototype.listen = function(backlog) {
    return new Error("Not Implemented");
}

TCP.prototype.connect = function (req, addr, port) {
    var self = this;
    this._req = req;
    this._clientSocket = new Windows.Networking.Sockets.StreamSocket();
    clientSocket.connectAsync(new Windows.Networking.HostName(addr), port).then(function () {
        var status = 0;
        var handle = self;
        var readable = true;
        var writable = true;

        self.setStreams(self._clientSocket.inputStream, self._clientSocket.outputStream);

        var oncomplete = self._req.oncomplete;
        delete this._req.oncomplete;
        oncomplete(status, handle, self._req, readable, writable);
    });
}

TCP.prototype.setNoDelay = function (enable) {
    this._clientSocket.control.noDelay = enable;
};

TCP.prototype.setKeepAlive = function (enable, delay) {
    this._clientSocket.control.keepAlive = enable;
};

TCP.prototype.shutdown = function (req) {
    req.oncomplete(0, this, req);
};

module.exports.TCP = TCP;
