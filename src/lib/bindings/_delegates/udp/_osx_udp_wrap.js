/*
 * Copyright 2014 Domabo
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


var Handle = process.binding('handle_wrap').Handle;
var util   = require('util');
var EventEmitter = require('events').EventEmitter;
var Buffer = require('buffer').Buffer;

/* UDP Binding
 * Behaves like a EventEmitter and inherits handle_wrap
 *
 * Dependencies:
 * io.nodekit.socket.createUdp() that returns _udp EventEmitter
 * _udp.bind(ip, port, flags)
 * _udp.recvStart()
 * _udp.send(buffer, offset, length, port, address)
 * _udp.recvStop()
 * _udp.localAddress returns {String address, int port}
 * _udp.remoteAddress  returns {String address, int port}
 * _udp.addMembership(mcastAddr, ifaceAddr)
 * _udp.dropMembership(mcastAddr, ifaceAddr)
 * _udp.setMulticastTTL(ttl)
 * _udp.setMulticastLoopback(flag);
 * _udp.setBroadcast(flag);
 * _udp.setTTL(ttl);
 *
 * emits 'recv'  (base64 chunk)
 *
 */

var UDP = function() {
    if (!(this instanceof UDP)) return new UDP();
    this._udp = io.nodekit.socket.createUdp();
    
    Handle.call(this, this._udp);
    this._handle.on('recv', UDP.prototype._onRecv.bind(this));
};

util.inherits(UDP, Handle);
module.exports.UDP = UDP;

UDP.prototype._onRecv(chunk) {
    if (typeof this.onmessage === 'function') {
        if (result.error) {
            throw Error(result.error);
        }
        
        var buf = new Buffer( chunk, 'base64');
        remote = this._udp.remoteAddress,
        rinfo = {};
        if (remote) {
            rinfo.address = remote.address;
            rinfo.port = remote.port;
        }
        
        this.onmessage(buf.length, this, buf, rinfo);

    }
}

UDP.prototype.bind = function(ip, port, flags) {
    var e = this._udp.bind(ip, port, flags);
    if (e !== "OK" ) return new Error(e);
};

UDP.prototype.bind6 = function(ip, port, flags) {
    return new Error( "ipv6 not supported" );
};

UDP.prototype.recvStart = function() {
    this._udp.recvStart();
};

UDP.prototype.send = function(req, buffer, offset, length, port, address) {
    this._udp.send(buffer, offset, length, port, address);
    if (req.oncomplete) {
        req.oncomplete();
    }
};

UDP.prototype.send6 = function(req, buffer, offset, length, port, address) {
      return new Error( "ipv6 not supported" );
};

UDP.prototype.recvStop = function() {
    this._udp.recvStop();
};


UDP.prototype.getsockname = function(out) {
    var local = this._udp.localAddress;
    out.address = local.address;
    out.port    = local.port;
    out.family  ='IPv4';
};


UDP.prototype.addMembership = function(mcastAddr, ifaceAddr) {
    this._udp.addMembership(mcastAddr, ifaceAddr);
};

UDP.prototype.dropMembership = function(mcastAddr, ifaceAddr) {
    this._udp.dropMembership(mcastAddr, ifaceAddr);
};

UDP.prototype.setMulticastTTL = function(ttl) {
    this._udp.setMulticastTTL(ttl);
};

UDP.prototype.setMulticastLoopback = function(flag) {
    this._udp.setMulticastLoopback(flag);
};

UDP.prototype.setBroadcast = function(flag) {
    this._udp.setBroadcast(flag);
};

UDP.prototype.setTTL = function(ttl) {
    this._udp.setTTL(ttl);
};

/* CONVERT native _tcp to node Stream
 *
 * Dependencies:
 * source.writeString(data)
 * source.on('end')
 * source.on('data', function(chunk))
 *
 */

