/*
 * Copyright 2014 Domabo; Portions Copyright 2014 Red Hat
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
var StreamWrap = require('stream_wrap');
var EventEmitter = require(‘events’).EventEmitter;

function tcpEventEmitter() {
}

util.inherits(tcpEventEmitter, EventEmitter);

// tcpEventEmitter.prototype.whatever = function() { }


/* TCP Binding
 * Behaves like a stream and inherits stream_wrap
 *
 * Dependencies:
 * io.nodekit.tcp.createSocket() that returns _tcp EventEmitter and NativeStream
 * _tcp.on("connection", function(_tcp))
 * _tcp.on("afterConnect", function())
 * _tcp.on('data', function(chunk))
 * _tcp.on('end')
 * _tcp.writeBytes(data)
 * _tcp.fd returns {}
 * _tcp.remoteAddress  returns {String addr, int port}
 * _tcp.localAddress returns {String addr, int port}
 * _tcp.bind(String addr, int port)
 * _tcp.listen(int backlog)
 * _tcp.connect(String addr, int port)
 * _tcp.close()
 *
 */


function TCP(stream) {
    
    if (stream !== null)
    {
        this._stream = stream;
    } else
    {
        this._tcp = new tcpEventEmitter();
        
        // Server
        this._tcp.on( "connection", TCP.prototype._onConnection.bind(this) );
        
        // Client
        this._tcp.on( "afterConnect", TCP.prototype._onAfterConnect.bind(this) );
        
        var _tcp = io.nodekit.tcp.createSocket();
    }
    
    StreamWrap.call( this, this._tcp);
}


util.inherits(TCP, StreamWrap);

Object.defineProperty( TCP.prototype, '_fd', {
                      get: function() {
                      return this._tcp.fd;
                      }
})


// ----------------------------------------
// Server
// ----------------------------------------
TCP.prototype._onConnection = function(stream) {
    var err;
    var clientHandle = new TCP(stream);
    this.onconnection(err, clientHandle);
}

// ----------------------------------------
// Client
// ----------------------------------------
TCP.prototype._onAfterConnect = function() {
    var status = 0;
    var handle = this;   
    var readable = true;
    var writable = true;
    
    if ( this._req ) {
        var oncomplete = this._req.oncomplete;
        delete this._req.oncomplete;
        oncomplete( status, handle, this._req, readable, writable );
    }
}

// ----------------------------------------

TCP.prototype.getpeername = function(out) {
    var remote = this._tcp.remoteAddress;
    out.address = remote.address;
    out.port    = remote.port;
    out.family  = 'IPv4';
}

TCP.prototype.getsockname = function(out) {
    var local = this._tcp.localAddress;
    out.address = local.address;
    out.port    = local.port;
    out.family  ='IPv4';
}

TCP.prototype.bind6 = function(addr,port) {
    return new Error( "ipv6 not supported" );
}

TCP.prototype.bind = function(addr, port) {
    this._tcp.bind( addr, port);
}

TCP.prototype.listen = function(backlog) {
    this._tcp.listen(backlog);
}

TCP.prototype.connect = function(req, addr, port) {
    this._req = req;
    this._tcp.connect(addr,port);
}

module.exports.TCP = TCP;


/* CONVERT native _tcp to node Stream
 *
 * Dependencies:
 * source.writeBytes(data)
 * source.on('end')
 * source.on('data', function(chunk))
 *
 */

io.nodekit.createNativeStream = function() {
    var source = new EventEmitter();
    return new NativeStream(source);
}

function NativeStream(source) {
    Duplex.call( this);
    this._source = source;
    var self = this;
    
    source.on('end', function() {
              self.push(null);
              });
    
    source.on('data', function(chunk) {
           self.push(chunk)
              });
    
}

util.inherits(NativeStream, Duplex);

NativeStream.prototype._read = function NativeStreamRead(size) {
};

NativeStream..prototype._write = function NativeStreamWrite(chunk, enc, cb) {
    if (util.isBuffer(chunk))
    {
        var data = arrayBuffer(chunk);
        this._source.writeBytes(data)
    }
    else
    {
        var buf = new Buffer(chunk, enc);
        var data = arrayBuffer(chunk);
        this._source.writeBytes(data)
    }
    cb();
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