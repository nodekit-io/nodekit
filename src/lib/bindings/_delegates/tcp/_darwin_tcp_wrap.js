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
var StreamWrap = process.binding('stream_wrap').Stream;
var Duplex = require('stream').Duplex;
var EventEmitter = require('events').EventEmitter;
var Buffer = require('buffer');

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

function TCP(tcp) {
    
    if ((tcp !== null)  && (typeof(tcp) !== 'undefined'))
    {
         this._stream = tcp.stream;
    } else
    {
        this._tcp = io.nodekit.tcp.createSocket();
        
        // Server
        this._tcp.on( "connection", TCP.prototype._onConnection.bind(this));
        
        // Client
        this._tcp.on( "afterConnect", TCP.prototype._onAfterConnect.bind(this) );
        
        this._stream = this._tcp.stream;
        
    }
    
    StreamWrap.call( this, this._stream);
}

util.inherits(TCP, StreamWrap);

Object.defineProperty(TCP.prototype, '_fd', {
                      get: function() {
                      return this._tcp.fd;
                      }
                      });


// ----------------------------------------
// Server
// ----------------------------------------
TCP.prototype._onConnection = function(stream) {
    var err;
    var clientHandle = new TCP(stream);
    this.onconnection(err, clientHandle);
};

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
};

// ----------------------------------------

TCP.prototype.getpeername = function(out) {
    var remote = this._tcp.remoteAddress;
    out.address = remote.address;
    out.port    = remote.port;
    out.family  = 'IPv4';
};

TCP.prototype.getsockname = function(out) {
    var local = this._tcp.localAddress;
    out.address = local.address;
    out.port    = local.port;
    out.family  ='IPv4';
};

TCP.prototype.bind6 = function(addr,port) {
    return new Error( "ipv6 not supported" );
};

TCP.prototype.bind = function(addr, port) {
    if (addr == "0.0.0.0")
        addr = "127.0.0.1";
    this._tcp.bind( addr, port);
};

TCP.prototype.listen = function(backlog) {
    this._tcp.listen(backlog);
};

TCP.prototype.connect = function(req, addr, port) {
    this._req = req;
    this._tcp.connect(addr,port);
};

module.exports.TCP = TCP;


/* CONVERT native _tcp to node Stream
 *
 * Dependencies:
 * source.writeString(data)
 * source.on('end')
 * source.on('data', function(chunk))
 *
 */

io.nodekit.createNativeStream = function() {
    var source = new EventEmitter();
    source.stream =  new NativeStream(source);
    return source;
};

function NativeStream(source) {
    Duplex.call( this, { encoding: 'utf8'});
    
    this._source = source;
    var self = this;
    
    source.on('end', function() {
              self.push(null);
              });
    
    source.on('data', function(chunk) {
              self.push(chunk, 'utf8')
              });
};

util.inherits(NativeStream, Duplex);

NativeStream.prototype._read = function NativeStreamRead(size) {
}

NativeStream.prototype.close = function NativeStreamClose() {
    if (typeof(this._source) != 'undefined')
        this._source.close();
};

NativeStream.prototype._write = function NativeStreamWrite(chunk, enc, cb) {
    
    if (util.isBuffer(chunk))
    {
        this._source.writeString(data.toString('utf8'));
    }
    else if ((enc == 'utf8') || (enc == 'utf-8'))
    {
         this._source.writeString(chunk);
    }
    else
    {
        var buf = new Buffer(chunk, enc);
        this._source.writeString(data.toString('utf8'));
    }
    
    cb();
};

