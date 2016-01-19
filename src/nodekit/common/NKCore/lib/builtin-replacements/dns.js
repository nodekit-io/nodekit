!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.DNS=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright 2011 Timothy J Fontaine <tjfontaine@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE

"use strict";

exports.platform = require('./lib/platform');

exports.createServer = require('./lib/server').createServer;
exports.createUDPServer = require('./lib/server').createUDPServer;
exports.createTCPServer = require('./lib/server').createTCPServer;

var client = require('./lib/client');
exports.lookup = client.lookup;
exports.resolve = client.resolve;
exports.resolve4 = client.resolve4;
exports.resolve6 = client.resolve6;
exports.resolveMx = client.resolveMx;
exports.resolveTxt = client.resolveTxt;
exports.resolveSrv = client.resolveSrv;
exports.resolveNs = client.resolveNs;
exports.resolveCname = client.resolveCname;
exports.reverse = client.reverse;

var consts = require('native-dns-packet').consts;
exports.BADNAME = consts.BADNAME;
exports.BADRESP = consts.BADRESP;
exports.CONNREFUSED = consts.CONNREFUSED;
exports.DESTRUCTION = consts.DESTRUCTION;
exports.REFUSED = consts.REFUSED;
exports.FORMERR = consts.FORMERR;
exports.NODATA = consts.NODATA;
exports.NOMEM = consts.NOMEM;
exports.NOTFOUND = consts.NOTFOUND;
exports.NOTIMP = consts.NOTIMP;
exports.SERVFAIL = consts.SERVFAIL;
exports.TIMEOUT = consts.TIMEOUT;
exports.consts = consts;

var definedTypes = [
  'A',
  'AAAA',
  'NS',
  'CNAME',
  'PTR',
  'NAPTR',
  'TXT',
  'MX',
  'SRV',
  'SOA',
  'TLSA',
].forEach(function (type) {
  exports[type] = function (opts) {
    var obj = {};
    opts = opts || {};
    obj.type = consts.nameToQtype(type);
    obj.class = consts.NAME_TO_QCLASS.IN;
    Object.keys(opts).forEach(function (k) {
      if (opts.hasOwnProperty(k) && ['type', 'class'].indexOf(k) == -1) {
        obj[k] = opts[k];
      }
    });
    return obj;
  };
});

exports.Question = function (opts) {
  var q = {}, qtype;

  opts = opts || {};

  q.name = opts.name;

  qtype = opts.type || consts.NAME_TO_QTYPE.A;
  if (typeof(qtype) === 'string' || qtype instanceof String)
    qtype = consts.nameToQtype(qtype.toUpperCase());

  if (!qtype || typeof(qtype) !== 'number')
    throw new Error("Question type must be defined and be valid");

  q.type = qtype;

  q.class = opts.class || consts.NAME_TO_QCLASS.IN;

  return q;
};
exports.Request = client.Request;

},{"./lib/client":2,"./lib/platform":5,"./lib/server":6,"native-dns-packet":15}],2:[function(require,module,exports){
// Copyright 2011 Timothy J Fontaine <tjfontaine@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE

'use strict';

var ipaddr = require('ipaddr.js'),
    net = require('net'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    PendingRequests = require('./pending'),
    Packet = require('./packet'),
    consts = require('native-dns-packet').consts,
    utils = require('./utils'),
    platform = require('./platform');

var A = consts.NAME_TO_QTYPE.A,
    AAAA = consts.NAME_TO_QTYPE.AAAA,
    MX = consts.NAME_TO_QTYPE.MX,
    TXT = consts.NAME_TO_QTYPE.TXT,
    NS = consts.NAME_TO_QTYPE.NS,
    CNAME = consts.NAME_TO_QTYPE.CNAME,
    SRV = consts.NAME_TO_QTYPE.SRV,
    PTR = consts.NAME_TO_QTYPE.PTR,
    TLSA = consts.NAME_TO_QTYPE.TLSA;

var debug = function() {};

if (process.env.NODE_DEBUG && process.env.NODE_DEBUG.match(/dns/)) {
debug = function debug() {
  var args = Array.prototype.slice.call(arguments);
  console.error.apply(this, ['client', Date.now().toString()].concat(args));
};
}

var Request = exports.Request = function(opts) {
  if (!(this instanceof Request)) return new Request(opts);

  this.question = opts.question;
  this.server = opts.server;

  if (typeof(this.server) === 'string' || this.server instanceof String)
    this.server = { address: this.server, port: 53, type: 'udp'};

  if (!this.server || !this.server.address || !net.isIP(this.server.address))
    throw new Error('Server object must be supplied with at least address');

  if (!this.server.type || ['udp', 'tcp'].indexOf(this.server.type) === -1)
    this.server.type = 'udp';

  if (!this.server.port)
    this.server.port = 53;

  this.timeout = opts.timeout || 4 * 1000;
  this.try_edns = opts.try_edns || false;

  this.fired = false;
  this.id = undefined;

  if (opts.cache || opts.cache === false) {
    this.cache = opts.cache;
  } else {
    this.cache = platform.cache;
  }
  debug('request created', this.question);
};
util.inherits(Request, EventEmitter);

Request.prototype.handle = function(err, answer, cached) {
  if (!this.fired) {
    debug('request handled', this.id, this.question);

    if (!cached && this.cache && this.cache.store && answer) {
      this.cache.store(answer);
    }

    this.emit('message', err, answer);
    this.done();
  }
};

Request.prototype.done = function() {
  debug('request finished', this.id, this.question);
  this.fired = true;
  clearTimeout(this.timer_);
  PendingRequests.remove(this);
  this.emit('end');
  this.id = undefined;
};

Request.prototype.handleTimeout = function() {
  if (!this.fired) {
    debug('request timedout', this.id, this.question);
    this.emit('timeout');
    this.done();
  }
};

Request.prototype.error = function(err) {
  if (!this.fired) {
    debug('request error', err, this.id, this.question);
    this.emit('error', err);
    this.done();
  }
};

Request.prototype.send = function() {
  debug('request starting', this.question);
  var self = this;

  if (this.cache && this.cache.lookup) {
    this.cache.lookup(this.question, function(results) {
      var packet;

      if (!results) {
        self._send();
      } else {
        packet = new Packet();
        packet.answer = results.slice();
        self.handle(null, packet, true);
      }
    });
  } else {
    this._send();
  }
};

Request.prototype._send = function() {
  debug('request not in cache', this.question);
  var self = this;

  this.timer_ = setTimeout(function() {
    self.handleTimeout();
  }, this.timeout);

  PendingRequests.send(self);
};

Request.prototype.cancel = function() {
  debug('request cancelled', this.id, this.question);
  this.emit('cancelled');
  this.done();
};

var _queue = [];

var sendQueued = function() {
  debug('platform ready sending queued requests');
  _queue.forEach(function(request) {
    request.start();
  });
  _queue = [];
};

platform.on('ready', function() {
  sendQueued();
});

if (platform.ready) {
  sendQueued();
}

var Resolve = function Resolve(opts, cb) {
  if (!(this instanceof Resolve)) return new Resolve(opts, cb);

  this.opts = util._extend({
    retryOnTruncate: true,
  }, opts);

  this._domain = opts.domain;
  this._rrtype = opts.rrtype;

  this._buildQuestion(this._domain);

  this._started = false;
  this._current_server = undefined;

  this._server_list = [];

  if (opts.remote) {
    this._server_list.push({
      address: opts.remote,
      port: 53,
      type: 'tcp',
    });
    this._server_list.push({
      address: opts.remote,
      port: 53,
      type: 'udp',
    });
  }

  this._request = undefined;
  this._type = 'getHostByName';
  this._cb = cb;

  if (!platform.ready) {
    _queue.push(this);
  } else {
    this.start();
  }
};
util.inherits(Resolve, EventEmitter);

Resolve.prototype.cancel = function() {
  if (this._request) {
    this._request.cancel();
  }
};

Resolve.prototype._buildQuestion = function(name) {
  debug('building question', name);
  this.question = {
    type: this._rrtype,
    class: consts.NAME_TO_QCLASS.IN,
    name: name
  };
};
exports.Resolve = Resolve;

Resolve.prototype._emit = function(err, answer) {
  debug('resolve end', this._domain);
  var self = this;
  process.nextTick(function() {
    if (err) {
      err.syscall = self._type;
    }
    self._cb(err, answer);
  });
};

Resolve.prototype._fillServers = function() {
  debug('resolve filling servers', this._domain);
  var tries = 0, s, t, u, slist;

  slist = platform.name_servers;
                                                                                    
  while (this._server_list.length < platform.attempts) {
    s = slist[tries % slist.length];

    u = {
      address: s.address,
      port: s.port,
      type: 'udp'
    };

    t = {
      address: s.address,
      port: s.port,
      type: 'tcp'
    };

    this._server_list.push(u);
    this._server_list.push(t);

    tries += 1;
  }

  this._server_list.reverse();
};

Resolve.prototype._popServer = function() {
  debug('resolve pop server', this._current_server, this._domain);
  this._server_list.splice(0, 1, this._current_server);
};

Resolve.prototype._preStart = function() {
  if (!this._started) {
    this._started = new Date().getTime();
    this.try_edns = platform.edns;

    if (!this._server_list.length)
      this._fillServers();
  }
};

Resolve.prototype._shouldContinue = function() {
  debug('resolve should continue', this._server_list.length, this._domain);
  return this._server_list.length;
};

Resolve.prototype._nextQuestion = function() {
  debug('resolve next question', this._domain);
};

Resolve.prototype.start = function() {
  if (!this._started) {
    this._preStart();
  }

  if (this._server_list.length === 0) {
    debug('resolve no more servers', this._domain);
    this.handleTimeout();
  } else {
    this._current_server = this._server_list.pop();
    debug('resolve start', this._current_server, this._domain);

    this._request = Request({
      question: this.question,
      server: this._current_server,
      timeout: platform.timeout,
      try_edns: this.try_edns
    });

    this._request.on('timeout', this._handleTimeout.bind(this));
    this._request.on('message', this._handle.bind(this));
    this._request.on('error', this._handle.bind(this));

    this._request.send();
  }
};

var NOERROR = consts.NAME_TO_RCODE.NOERROR,
    SERVFAIL = consts.NAME_TO_RCODE.SERVFAIL,
    NOTFOUND = consts.NAME_TO_RCODE.NOTFOUND,
    FORMERR = consts.NAME_TO_RCODE.FORMERR;

Resolve.prototype._handle = function(err, answer) {
  var rcode, errno;

  if (answer) {
    rcode = answer.header.rcode;
  }

  debug('resolve handle', rcode, this._domain);

  switch (rcode) {
    case NOERROR:
      // answer trucated retry with tcp
      //console.log(answer);
      if (answer.header.tc &&
          this.opts.retryOnTruncate &&
          this._shouldContinue()) {
        debug('truncated', this._domain, answer);
        this.emit('truncated', err, answer);
        
        // remove udp servers
        this._server_list = this._server_list.filter(function(server) {
          return server.type === 'tcp';
        });
        answer = undefined;
      }
      break;
    case SERVFAIL:
      if (this._shouldContinue()) {
        this._nextQuestion();
        //this._popServer();
      } else {
        errno = consts.SERVFAIL;
      }
      answer = undefined;
      break;
    case NOTFOUND:
      if (this._shouldContinue()) {
        this._nextQuestion();
      } else {
        errno = consts.NOTFOUND;
      }
      answer = undefined;
      break;
    case FORMERR:
      if (this.try_edns) {
        this.try_edns = false;
        //this._popServer();
      } else {
        errno = consts.FORMERR;
      }
      answer = undefined;
      break;
    default:
      if (!err) {
        errno = consts.RCODE_TO_NAME[rcode];
        answer = undefined;
      } else {
        errno = consts.NOTFOUND;
      }
      break;
  }

  if (errno || answer) {
    if (errno) {
      err = new Error(this._type + ' ' + errno);
      err.errno = err.code = errno;
    }
    this._emit(err, answer);
  } else {
    this.start();
  }
};

Resolve.prototype._handleTimeout = function() {
  var err;

  if (this._server_list.length === 0) {
    debug('resolve timeout no more servers', this._domain);
    err = new Error(this._type + ' ' + consts.TIMEOUT);
    err.errno = consts.TIMEOUT;
    this._emit(err, undefined);
  } else {
    debug('resolve timeout continue', this._domain);
    this.start();
  }
};

var resolve = function(domain, rrtype, ip, callback) {
  var res;

  if (!callback) {
    callback = ip;
    ip = undefined;
  }

  if (!callback) {
    callback = rrtype;
    rrtype = undefined;
  }

  rrtype = consts.NAME_TO_QTYPE[rrtype || 'A'];

  if (rrtype === PTR) {
    return reverse(domain, callback);
  }

  var opts = {
    domain: domain,
    rrtype: rrtype,
    remote: ip,
  };

  res = new Resolve(opts);

  res._cb = function(err, response) {
    var ret = [], i, a;

    if (err) {
      callback(err, response);
      return;
    }

    for (i = 0; i < response.answer.length; i++) {
      a = response.answer[i];
      if (a.type === rrtype) {
        switch (rrtype) {
          case A:
          case AAAA:
            ret.push(a.address);
            break;
          case consts.NAME_TO_QTYPE.MX:
            ret.push({
              priority: a.priority,
              exchange: a.exchange
            });
            break;
          case TXT:
          case NS:
          case CNAME:
          case PTR:
            ret.push(a.data);
            break;
          case SRV:
            ret.push({
              priority: a.priority,
              weight: a.weight,
              port: a.port,
              name: a.target
            });
            break;
          default:
            ret.push(a);
            break;
        }
      }
    }

    if (ret.length === 0) {
      ret = undefined;
    }

    callback(err, ret);
  };

  return res;
};
exports.resolve = resolve;

var resolve4 = function(domain, callback) {
  return resolve(domain, 'A', function(err, results) {
    callback(err, results);
  });
};
exports.resolve4 = resolve4;

var resolve6 = function(domain, callback) {
  return resolve(domain, 'AAAA', function(err, results) {
    callback(err, results);
  });
};
exports.resolve6 = resolve6;

var resolveMx = function(domain, callback) {
  return resolve(domain, 'MX', function(err, results) {
    callback(err, results);
  });
};
exports.resolveMx = resolveMx;

var resolveTxt = function(domain, callback) {
  return resolve(domain, 'TXT', function(err, results) {
    callback(err, results);
  });
};
exports.resolveTxt = resolveTxt;

var resolveSrv = function(domain, callback) {
  return resolve(domain, 'SRV', function(err, results) {
    callback(err, results);
  });
};
exports.resolveSrv = resolveSrv;

var resolveNs = function(domain, callback) {
  return resolve(domain, 'NS', function(err, results) {
    callback(err, results);
  });
};
exports.resolveNs = resolveNs;

var resolveCname = function(domain, callback) {
  return resolve(domain, 'CNAME', function(err, results) {
    callback(err, results);
  });
};
exports.resolveCname = resolveCname;

var resolveTlsa = function(domain, callback) {
  return resolve(domain, 'TLSA', function(err, results) {
    callback(err, results);
  });
};
exports.resolveTlsa = resolveTlsa;

var reverse = function(ip, callback) {
  var error, opts, res;

  if (!net.isIP(ip)) {
    error = new Error('getHostByAddr ENOTIMP');
    error.errno = error.code = 'ENOTIMP';
    throw error;
  }

  opts = {
    domain: utils.reverseIP(ip),
    rrtype: PTR
  };

  res = new Lookup(opts);

  res._cb = function(err, response) {
    var results = [];

    if (response) {
      response.answer.forEach(function(a) {
        if (a.type === PTR) {
          results.push(a.data);
        }
      });
    }

    if (results.length === 0) {
      results = undefined;
    }

    callback(err, results);
  };

  return res;
};
exports.reverse = reverse;

var Lookup = function(opts) {
  Resolve.call(this, opts);
  this._type = 'getaddrinfo';
};
util.inherits(Lookup, Resolve);

Lookup.prototype.start = function() {
  var self = this;

  if (!this._started) {
    this._search_path = platform.search_path.slice(0);
    this._preStart();
  }

  platform.hosts.lookup(this.question, function(results) {
    var packet;
    if (results && results.length) {
      debug('Lookup in hosts', results);
      packet = new Packet();
      packet.answer = results.slice();
      self._emit(null, packet);
    } else {
      debug('Lookup not in hosts');
      Resolve.prototype.start.call(self);
    }
  });
};

Lookup.prototype._shouldContinue = function() {
  debug('Lookup should continue', this._server_list.length,
        this._search_path.length);
  return this._server_list.length && this._search_path.length;
};

Lookup.prototype._nextQuestion = function() {
  debug('Lookup next question');
  this._buildQuestion([this._domain, this._search_path.pop()].join('.'));
};

var lookup = function(domain, family, callback) {
  var rrtype, revip, res;

  if (!callback) {
    callback = family;
    family = undefined;
  }

  if (!family) {
    family = 4;
  }

  revip = net.isIP(domain);

  if (revip === 4 || revip === 6) {
    process.nextTick(function() {
      callback(null, domain, revip);
    });
    return {};
  }

  if (!domain) {
    process.nextTick(function() {
      callback(null, null, family);
    });
    return {};
  }

  rrtype = consts.FAMILY_TO_QTYPE[family];

  var opts = {
    domain: domain,
    rrtype: rrtype
  };

  res = new Lookup(opts);

  res._cb = function(err, response) {
    var i, afamily, address, a, all;

    if (err) {
      callback(err, undefined, undefined);
      return;
    }

    all = response.answer.concat(response.additional);

    for (i = 0; i < all.length; i++) {
      a = all[i];

      if (a.type === A || a.type === AAAA) {
        afamily = consts.QTYPE_TO_FAMILY[a.type];
        address = a.address;
        break;
      }
    }

    callback(err, address, afamily);
  };

  return res;
};
exports.lookup = lookup;

},{"./packet":3,"./pending":4,"./platform":5,"./utils":7,"events":undefined,"ipaddr.js":8,"native-dns-packet":15,"net":undefined,"util":undefined}],3:[function(require,module,exports){
// Copyright 2011 Timothy J Fontaine <tjfontaine@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE

'use strict';

var NDP = require('native-dns-packet'),
    util = require('util');

var Packet = module.exports = function(socket) {
  NDP.call(this);
  this.address = undefined;
  this._socket = socket;
};
util.inherits(Packet, NDP);

Packet.prototype.send = function() {
  var buff, len, size;

  if (typeof(this.edns_version) !== 'undefined') {
    size = 4096;
  }

  this.payload = size = size || this._socket.base_size;

  buff = this._socket.buffer(size);
  len = Packet.write(buff, this);
  this._socket.send(len);
};

Packet.parse = function (msg, socket) {
  var p = NDP.parse(msg);
  p._socket = socket;
  return p;
};

Packet.write = NDP.write;

},{"native-dns-packet":15,"util":undefined}],4:[function(require,module,exports){
// Copyright 2012 Timothy J Fontaine <tjfontaine@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE

'use strict';

var net = require('net'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    Packet = require('./packet'),
    consts = require('native-dns-packet').consts,
    UDPSocket = require('./utils').UDPSocket,
    TCPSocket = require('./utils').TCPSocket;

var debug = function() {
  //var args = Array.prototype.slice.call(arguments);
  //console.log.apply(this, ['pending', Date.now().toString()].concat(args));
};

var SocketQueue = function(socket, server) {
  this._active = {};
  this._active_count = 0;
  this._pending = [];

  debug('created', server);

  this._server = server;

  this._socket = socket;
  this._socket.on('ready', this._onlisten.bind(this));
  this._socket.on('message', this._onmessage.bind(this));
  this._socket.on('close', this._onclose.bind(this));
  this._socket.bind(server);

  this._refd = true;
};
util.inherits(SocketQueue, EventEmitter);

SocketQueue.prototype.send = function(request) {
  debug('added', request.question);
  this._pending.push(request);
  this._fill();
};

SocketQueue.prototype.remove = function(request) {
  var req = this._active[request.id];
  var idx = this._pending.indexOf(request);

  if (req) {
    delete this._active[request.id];
    this._active_count -= 1;
    this._fill();
  }

  if (idx > -1)
    this._pending.splice(idx, 1);

  this._unref();
};

SocketQueue.prototype.close = function() {
  debug('closing', this._server);
  this._socket.close();
  this._socket = undefined;
  this.emit('close');
};

SocketQueue.prototype._fill = function() {
  debug('pre fill, active:', this._active_count, 'pending:',
        this._pending.length);

  while (this._listening && this._pending.length &&
         this._active_count < 100) {
    this._dequeue();
  }

  debug('post fill, active:', this._active_count, 'pending:',
        this._pending.length);
};

var random_integer = function() {
  return Math.floor(Math.random() * 50000 + 1);
};

SocketQueue.prototype._dequeue = function() {
  var req = this._pending.pop();
  var id, packet, dnssocket;

  if (req) {
    id = random_integer();

    while (this._active[id])
      id = random_integer();

    debug('sending', req.question, id);

    req.id = id;
    this._active[id] = req;
    this._active_count += 1;

    try {
      packet = new Packet(this._socket.remote(req.server));
      packet.header.id = id;
      packet.header.rd = 1;

      if (req.try_edns) {
        packet.edns_version = 0;
        //TODO when we support dnssec
        //packet.do = 1
      }

      packet.question.push(req.question);
      packet.send();

      this._ref();
    } catch (e) {
      req.error(e);
    }
  }
};

SocketQueue.prototype._onmessage = function(msg, remote) {
  var req, packet;

  debug('got a message', this._server);

  try {
    packet = Packet.parse(msg, remote);
    req = this._active[packet.header.id];
    debug('associated message', packet.header.id);
  } catch (e) {
    debug('error parsing packet', e);
  }

  if (req) {
    delete this._active[packet.header.id];
    this._active_count -= 1;
    req.handle(null, packet);
    this._fill();
  }

  this._unref();
};

SocketQueue.prototype._unref = function() {
  var self = this;
  this._refd = false;

  if (this._active_count <= 0) {
    if (this._socket.unref) {
      debug('unrefd socket');
      this._socket.unref();
    } else if (!this._timer) {
      this._timer = setTimeout(function() {
        self.close();
      }, 300);
    }
  }
};

SocketQueue.prototype._ref = function() {
  this._refd = true;
  if (this._socket.ref) {
    debug('refd socket');
    this._socket.ref();
  } else if (this._timer) {
    clearTimeout(this._timer);
    this._timer = null;
  }
};

SocketQueue.prototype._onlisten = function() {
  this._unref();
  this._listening = true;
  this._fill();
};

SocketQueue.prototype._onclose = function() {
  var req, err, self = this;

  debug('socket closed', this);

  this._listening = false;

  err = new Error('getHostByName ' + consts.TIMEOUT);
  err.errno = consts.TIMEOUT;

  while (this._pending.length) {
    req = this._pending.pop();
    req.error(err);
  }

  Object.keys(this._active).forEach(function(key) {
    var req = self._active[key];
    req.error(err);
    delete self._active[key];
    self._active_count -= 1;
  });
};

var serverHash = function(server) {
  if (server.type === 'tcp')
    return server.address + ':' + server.port;
  else
    return 'udp' + net.isIP(server.address);
};

var _sockets = {};

exports.send = function(request) {
  var hash = serverHash(request.server);
  var socket = _sockets[hash];

  if (!socket) {
    switch (hash) {
      case 'udp4':
      case 'udp6':
        socket = new SocketQueue(new UDPSocket(), hash);
        break;
      default:
        socket = new SocketQueue(new TCPSocket(), request.server);
        break;
    }

    socket.on('close', function() {
      delete _sockets[hash];
    });

    _sockets[hash] = socket;
  }

  socket.send(request);
};

exports.remove = function(request) {
  var hash = serverHash(request.server);
  var socket = _sockets[hash];
  if (socket) {
    socket.remove(request);
  }
};

},{"./packet":3,"./utils":7,"events":undefined,"native-dns-packet":15,"net":undefined,"util":undefined}],5:[function(require,module,exports){
// Copyright 2011 Timothy J Fontaine <tjfontaine@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE

'use strict';

var fs = require('fs'),
    EventEmitter = require('events').EventEmitter,
    net = require('net'),
    os = require('os'),
    util = require('util'),
    Cache = require('native-dns-cache'),
    consts = require('native-dns-packet').consts,
    path = require('path'),
    utils = require('./utils');

var A = consts.NAME_TO_QTYPE.A,
    AAAA = consts.NAME_TO_QTYPE.AAAA,
    PTR = consts.NAME_TO_QTYPE.PTR;

var Platform = function() {
  this._nsReady = false;
  this._hostsReady = false;

  Object.defineProperty(this, 'ready', {
    get: function() {
      return this._nsReady && this._hostsReady;
    }
  });

  this._watches = {};

  Object.defineProperty(this, 'watching', {
    get: function() {
      return Object.keys(this._watches).length > 0;
    },
    set: function(value) {
      var k;
      if (value)
        this._watchFiles();
      else {
        for (k in this._watches) {
          this._watches[k].close();
          delete this._watches[k];
        }
      }
    }
  });

  this.hosts = new Cache();

  this._initNameServers();
  this._initHostsFile();
  this._populate();

  this.cache = false; //new Cache();
};
util.inherits(Platform, EventEmitter);

Platform.prototype.reload = function() {
  this.emit('unready');
  this._initNameServers();
  this._initHostsFile();
  this._populate();
};

Platform.prototype._initNameServers = function() {
  this._nsReady = false;
  this.name_servers = [];
  this.search_path = [];
  this.timeout = 5 * 1000;
  this.attempts = 5;
  this.edns = false;
};

Platform.prototype._initHostsFile = function() {
  this._hostsReady = false;
  this.hosts.purge();
};

Platform.prototype._populate = function() {
  var hostsfile, self = this;

  switch (os.platform()) {
    case 'win32':
      this.name_servers = [{
          address: '8.8.8.8',
          port: 53},{
          address: '8.8.4.4',
          port: 53} ];
      self._nsReady = true;
      hostsfile = path.join(process.env.SystemRoot,
                        '\\System32\\drivers\\etc\\hosts');
      break;
 case 'ios':
    this.name_servers = [{
          address: '8.8.8.8',
          port: 53},{
          address: '8.8.4.4',
          port: 53} ];
    self._nsReady = true;
      hostsfile = '/etc/hosts';
      break;

    default:
      this.parseResolv();
      hostsfile = '/etc/hosts';
      break;
  }

  this._parseHosts(hostsfile);
};

Platform.prototype._watchFiles = function() {
  var self = this, watchParams;

  watchParams = {persistent: false};

  switch (os.platform()) {
    case 'win32':
      //TODO XXX FIXME: it would be nice if this existed
      break;
    default:
      this._watches.resolve = fs.watch('/etc/resolv.conf', watchParams,
          function(event, filename) {
            if (event === 'change') {
              self.emit('unready');
              self._initNameServers();
              self.parseResolv();
            }
          });
      this._watches.hosts = fs.watch('/etc/hosts', watchParams,
          function(event, filename) {
            if (event === 'change') {
              self.emit('unready');
              self._initHostsFile();
              self._parseHosts(hostsfile);
            }
          });
      break;
  }
};

Platform.prototype._checkReady = function() {
  if (this.ready) {
    this.emit('ready');
  }
};

Platform.prototype.parseResolv = function() {
  var self = this;

  fs.readFile('/etc/resolv.conf', 'ascii', function(err, file) {
    if (err) {
      throw err;
    }

    file.split(/\n/).forEach(function(line) {
      var i, parts, subparts;
      line = line.replace(/^\s+|\s+$/g, '');
      if (!line.match(/^#/)) {
        parts = line.split(/\s+/);
        switch (parts[0]) {
          case 'nameserver':
            self.name_servers.push({
              address: parts[1],
              port: 53
            });
            break;
          case 'domain':
            self.search_path = [parts[1]];
            break;
          case 'search':
            self.search_path = [parts.slice(1)];
            break;
          case 'options':
            for (i = 1; i < parts.length; i++) {
              subparts = parts[i].split(/:/);
              switch (subparts[0]) {
                case 'timeout':
                  self.timeout = parseInt(subparts[1], 10) * 1000;
                  break;
                case 'attempts':
                  self.attempts = parseInt(subparts[1], 10);
                  break;
                case 'edns0':
                  self.edns = true;
                  break;
              }
            }
            break;
        }
      }
    });

    self._nsReady = true;
    self._checkReady();
  });
};

Platform.prototype._parseHosts = function(hostsfile) {
  var self = this;

  fs.readFile(hostsfile, 'ascii', function(err, file) {
    var toStore = {};
    if (err) {
      throw err;
    }

    file.split(/\n/).forEach(function(line) {
      var i, parts, ip, revip, kind;
      line = line.replace(/^\s+|\s+$/g, '');
      if (!line.match(/^#/)) {
        parts = line.split(/\s+/);
        ip = parts[0];
        parts = parts.slice(1);
        kind = net.isIP(ip);

        if (parts.length && ip && kind) {
          /* IP -> Domain */
          revip = utils.reverseIP(ip);
          parts.forEach(function(domain) {
            var r = toStore[revip];
            if (!r)
              r = toStore[revip] = {};
            var t = r[PTR];
            if (!t)
              t = r[PTR] = [];
            t.push({
              type: PTR,
              class: 1,
              name: revip,
              data: domain,
              ttl: Infinity
            });
          });

          /* Domain -> IP */
          parts.forEach(function(domain) {
            var r = toStore[domain.toLowerCase()];
            if (!r) {
              r = toStore[domain.toLowerCase()] = {};
            }
            var type = kind === 4 ? A : AAAA;
            var t = r[type];
            if (!t)
              t = r[type] = [];
            t.push({
              type: type,
              name: domain.toLowerCase(),
              address: ip,
              ttl: Infinity
            });
          });
        }
      }
    });

    Object.keys(toStore).forEach(function (key) {
      self.hosts._store.set(self.hosts._zone, key, toStore[key]);
    });
    self._hostsReady = true;
    self._checkReady();
  });
};

module.exports = new Platform();

},{"./utils":7,"events":undefined,"fs":undefined,"native-dns-cache":10,"native-dns-packet":15,"net":undefined,"os":undefined,"path":undefined,"util":undefined}],6:[function(require,module,exports){
// Copyright 2011 Timothy J Fontaine <tjfontaine@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE

'use strict';

var dgram = require('dgram'),
    EventEmitter = require('events').EventEmitter,
    net = require('net'),
    util = require('util'),
    UDPSocket = require('./utils').UDPSocket,
    TCPSocket = require('./utils').TCPSocket,
    Packet = require('./packet');

var Server = function(opts) {
  var self = this;

  this._socket.on('listening', function() {
    self.emit('listening');
  });

  this._socket.on('close', function() {
    self.emit('close');
  });

  this._socket.on('error', function(err) {
    self.emit('socketError', err, self._socket);
  });
};
util.inherits(Server, EventEmitter);

Server.prototype.close = function() {
  this._socket.close();
};

Server.prototype.address = function() {
  return this._socket.address();
};

Server.prototype.handleMessage = function(msg, remote, address) {
  var request, response = new Packet(remote);

  try {
    request = Packet.parse(msg, remote);

    request.address = address;

    response.header.id = request.header.id;
    response.header.qr = 1;
    response.question = request.question;

    this.emit('request', request, response);
  } catch (e) {
    this.emit('error', e, msg, response);
  }
};

var UDPServer = function(opts) {
  var self = this;

  this._socket = dgram.createSocket(opts.dgram_type || 'udp4');

  this._socket.on('message', function(msg, remote) {
    self.handleMessage(msg, new UDPSocket(self._socket, remote), remote);
  });

  Server.call(this, opts);
};
util.inherits(UDPServer, Server);

UDPServer.prototype.serve = function(port, address) {
  this._socket.bind(port, address);
};

var TCPServer = function(opts) {
  var self = this;

  this._socket = net.createServer(function(client) {
    var tcp = new TCPSocket(client);
    var address = client.address();
    tcp.on('message', function(msg, remote) {
      self.handleMessage(msg, tcp, address);
    });
    tcp.catchMessages();
  });

  Server.call(this, opts);
};
util.inherits(TCPServer, Server);

TCPServer.prototype.serve = function(port, address) {
  this._socket.listen(port, address);
};

exports.createServer = function(opts) {
  return new UDPServer(opts || {});
};

exports.createUDPServer = function(opts) {
  return exports.createServer(opts);
};

exports.createTCPServer = function(opts) {
  return new TCPServer(opts || {});
};

},{"./packet":3,"./utils":7,"dgram":undefined,"events":undefined,"net":undefined,"util":undefined}],7:[function(require,module,exports){
// Copyright 2012 Timothy J Fontaine <tjfontaine@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE

var dgram = require('dgram'),
    EventEmitter = require('events').EventEmitter,
    ipaddr = require('ipaddr.js'),
    net = require('net'),
    util = require('util');

var UDPSocket = exports.UDPSocket = function(socket, remote) {
  this._socket = socket;
  this._remote = remote;
  this._buff = undefined;
  this.base_size = 512;
  this.bound = false;
  this.unref = undefined;
  this.ref = undefined;
};
util.inherits(UDPSocket, EventEmitter);

UDPSocket.prototype.buffer = function(size) {
  this._buff = new Buffer(size);
  return this._buff;
};

UDPSocket.prototype.send = function(len) {
  this._socket.send(this._buff, 0, len, this._remote.port,
                    this._remote.address);
};

UDPSocket.prototype.bind = function(type) {
  var self = this;

  if (this.bound) {
    this.emit('ready');
  } else {
    this._socket = dgram.createSocket(type);
    this._socket.on('listening', function() {
      self.bound = true;
      if (self._socket.unref) {
        self.unref = function() {
          self._socket.unref();
        }
        self.ref = function() {
          self._socket.ref();
        }
      }
      self.emit('ready');
    });

    this._socket.on('message', this.emit.bind(this, 'message'));

    this._socket.on('close', function() {
      self.bound = false;
      self.emit('close');
    });

    this._socket.bind();
  }
};

UDPSocket.prototype.close = function() {
  this._socket.close();
};

UDPSocket.prototype.remote = function(remote) {
  return new UDPSocket(this._socket, remote);
};

var TCPSocket = exports.TCPSocket = function(socket) {
  UDPSocket.call(this, socket);
  this.base_size = 4096;
  this._rest = undefined;
};
util.inherits(TCPSocket, UDPSocket);

TCPSocket.prototype.buffer = function(size) {
  this._buff = new Buffer(size + 2);
  return this._buff.slice(2);
};

TCPSocket.prototype.send = function(len) {
  this._buff.writeUInt16BE(len, 0);
  this._socket.write(this._buff.slice(0, len + 2));
};

TCPSocket.prototype.bind = function(server) {
  var self = this;

  if (this.bound) {
    this.emit('ready');
  } else {
    this._socket = net.connect(server.port, server.address);

    this._socket.on('connect', function() {
      self.bound = true;
      if (self._socket.unref) {
        self.unref = function() {
          self._socket.unref();
        }
        self.ref = function() {
          self._socket.ref();
        }
      }
      self.emit('ready');
    });

    this._socket.on('timeout', function() {
      self.bound = false;
      self.emit('close');
    });

    this._socket.on('close', function() {
      self.bound = false;
      self.emit('close');
    });

    this.catchMessages();
  }
};

TCPSocket.prototype.catchMessages = function() {
  var self = this;
  this._socket.on('data', function(data) {
    var len, tmp;
    if (!self._rest) {
      self._rest = data;
    } else {
      tmp = new Buffer(self._rest.length + data.length);
      self._rest.copy(tmp, 0);
      data.copy(tmp, self._rest.length);
      self._rest = tmp;
    }
    while (self._rest && self._rest.length > 2) {
      len = self._rest.readUInt16BE(0);
      if (self._rest.length >= len + 2) {
        self.emit('message', self._rest.slice(2, len + 2), self);
        self._rest = self._rest.slice(len + 2);
      } else {
        break;
      }
    }
  });
};

TCPSocket.prototype.close = function() {
  this._socket.end();
};

TCPSocket.prototype.remote = function() {
  return this;
};

exports.reverseIP = function(ip) {
  var address, kind, reverseip, parts;
  address = ipaddr.parse(ip.split(/%/)[0]);
  kind = address.kind();

  switch (kind) {
    case 'ipv4':
      address = address.toByteArray();
      address.reverse();
      reverseip = address.join('.') + '.IN-ADDR.ARPA';
      break;
    case 'ipv6':
      parts = [];
      address.toNormalizedString().split(':').forEach(function(part) {
        var i, pad = 4 - part.length;
        for (i = 0; i < pad; i++) {
          part = '0' + part;
        }
        part.split('').forEach(function(p) {
          parts.push(p);
        });
      });
      parts.reverse();
      reverseip = parts.join('.') + '.IP6.ARPA';
      break;
  }

  return reverseip;
};

},{"dgram":undefined,"events":undefined,"ipaddr.js":8,"net":undefined,"util":undefined}],8:[function(require,module,exports){
(function() {
  var expandIPv6, ipaddr, ipv4Part, ipv4Regexes, ipv6Part, ipv6Regexes, matchCIDR, root;

  ipaddr = {};

  root = this;

  if ((typeof module !== "undefined" && module !== null) && module.exports) {
    module.exports = ipaddr;
  } else {
    root['ipaddr'] = ipaddr;
  }

  matchCIDR = function(first, second, partSize, cidrBits) {
    var part, shift;
    if (first.length !== second.length) {
      throw new Error("ipaddr: cannot match CIDR for objects with different lengths");
    }
    part = 0;
    while (cidrBits > 0) {
      shift = partSize - cidrBits;
      if (shift < 0) {
        shift = 0;
      }
      if (first[part] >> shift !== second[part] >> shift) {
        return false;
      }
      cidrBits -= partSize;
      part += 1;
    }
    return true;
  };

  ipaddr.subnetMatch = function(address, rangeList, defaultName) {
    var rangeName, rangeSubnets, subnet, _i, _len;
    if (defaultName == null) {
      defaultName = 'unicast';
    }
    for (rangeName in rangeList) {
      rangeSubnets = rangeList[rangeName];
      if (toString.call(rangeSubnets[0]) !== '[object Array]') {
        rangeSubnets = [rangeSubnets];
      }
      for (_i = 0, _len = rangeSubnets.length; _i < _len; _i++) {
        subnet = rangeSubnets[_i];
        if (address.match.apply(address, subnet)) {
          return rangeName;
        }
      }
    }
    return defaultName;
  };

  ipaddr.IPv4 = (function() {
    function IPv4(octets) {
      var octet, _i, _len;
      if (octets.length !== 4) {
        throw new Error("ipaddr: ipv4 octet count should be 4");
      }
      for (_i = 0, _len = octets.length; _i < _len; _i++) {
        octet = octets[_i];
        if (!((0 <= octet && octet <= 255))) {
          throw new Error("ipaddr: ipv4 octet is a byte");
        }
      }
      this.octets = octets;
    }

    IPv4.prototype.kind = function() {
      return 'ipv4';
    };

    IPv4.prototype.toString = function() {
      return this.octets.join(".");
    };

    IPv4.prototype.toByteArray = function() {
      return this.octets.slice(0);
    };

    IPv4.prototype.match = function(other, cidrRange) {
      if (other.kind() !== 'ipv4') {
        throw new Error("ipaddr: cannot match ipv4 address with non-ipv4 one");
      }
      return matchCIDR(this.octets, other.octets, 8, cidrRange);
    };

    IPv4.prototype.SpecialRanges = {
      broadcast: [[new IPv4([255, 255, 255, 255]), 32]],
      multicast: [[new IPv4([224, 0, 0, 0]), 4]],
      linkLocal: [[new IPv4([169, 254, 0, 0]), 16]],
      loopback: [[new IPv4([127, 0, 0, 0]), 8]],
      "private": [[new IPv4([10, 0, 0, 0]), 8], [new IPv4([172, 16, 0, 0]), 12], [new IPv4([192, 168, 0, 0]), 16]],
      reserved: [[new IPv4([192, 0, 0, 0]), 24], [new IPv4([192, 0, 2, 0]), 24], [new IPv4([192, 88, 99, 0]), 24], [new IPv4([198, 51, 100, 0]), 24], [new IPv4([203, 0, 113, 0]), 24], [new IPv4([240, 0, 0, 0]), 4]]
    };

    IPv4.prototype.range = function() {
      return ipaddr.subnetMatch(this, this.SpecialRanges);
    };

    IPv4.prototype.toIPv4MappedAddress = function() {
      return ipaddr.IPv6.parse("::ffff:" + (this.toString()));
    };

    return IPv4;

  })();

  ipv4Part = "(0?\\d+|0x[a-f0-9]+)";

  ipv4Regexes = {
    fourOctet: new RegExp("^" + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "$", 'i'),
    longValue: new RegExp("^" + ipv4Part + "$", 'i')
  };

  ipaddr.IPv4.parser = function(string) {
    var match, parseIntAuto, part, shift, value;
    parseIntAuto = function(string) {
      if (string[0] === "0" && string[1] !== "x") {
        return parseInt(string, 8);
      } else {
        return parseInt(string);
      }
    };
    if (match = string.match(ipv4Regexes.fourOctet)) {
      return (function() {
        var _i, _len, _ref, _results;
        _ref = match.slice(1, 6);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          part = _ref[_i];
          _results.push(parseIntAuto(part));
        }
        return _results;
      })();
    } else if (match = string.match(ipv4Regexes.longValue)) {
      value = parseIntAuto(match[1]);
      return ((function() {
        var _i, _results;
        _results = [];
        for (shift = _i = 0; _i <= 24; shift = _i += 8) {
          _results.push((value >> shift) & 0xff);
        }
        return _results;
      })()).reverse();
    } else {
      return null;
    }
  };

  ipaddr.IPv6 = (function() {
    function IPv6(parts) {
      var part, _i, _len;
      if (parts.length !== 8) {
        throw new Error("ipaddr: ipv6 part count should be 8");
      }
      for (_i = 0, _len = parts.length; _i < _len; _i++) {
        part = parts[_i];
        if (!((0 <= part && part <= 0xffff))) {
          throw new Error("ipaddr: ipv6 part should fit to two octets");
        }
      }
      this.parts = parts;
    }

    IPv6.prototype.kind = function() {
      return 'ipv6';
    };

    IPv6.prototype.toString = function() {
      var compactStringParts, part, pushPart, state, stringParts, _i, _len;
      stringParts = (function() {
        var _i, _len, _ref, _results;
        _ref = this.parts;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          part = _ref[_i];
          _results.push(part.toString(16));
        }
        return _results;
      }).call(this);
      compactStringParts = [];
      pushPart = function(part) {
        return compactStringParts.push(part);
      };
      state = 0;
      for (_i = 0, _len = stringParts.length; _i < _len; _i++) {
        part = stringParts[_i];
        switch (state) {
          case 0:
            if (part === '0') {
              pushPart('');
            } else {
              pushPart(part);
            }
            state = 1;
            break;
          case 1:
            if (part === '0') {
              state = 2;
            } else {
              pushPart(part);
            }
            break;
          case 2:
            if (part !== '0') {
              pushPart('');
              pushPart(part);
              state = 3;
            }
            break;
          case 3:
            pushPart(part);
        }
      }
      if (state === 2) {
        pushPart('');
        pushPart('');
      }
      return compactStringParts.join(":");
    };

    IPv6.prototype.toByteArray = function() {
      var bytes, part, _i, _len, _ref;
      bytes = [];
      _ref = this.parts;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        part = _ref[_i];
        bytes.push(part >> 8);
        bytes.push(part & 0xff);
      }
      return bytes;
    };

    IPv6.prototype.toNormalizedString = function() {
      var part;
      return ((function() {
        var _i, _len, _ref, _results;
        _ref = this.parts;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          part = _ref[_i];
          _results.push(part.toString(16));
        }
        return _results;
      }).call(this)).join(":");
    };

    IPv6.prototype.match = function(other, cidrRange) {
      if (other.kind() !== 'ipv6') {
        throw new Error("ipaddr: cannot match ipv6 address with non-ipv6 one");
      }
      return matchCIDR(this.parts, other.parts, 16, cidrRange);
    };

    IPv6.prototype.SpecialRanges = {
      unspecified: [new IPv6([0, 0, 0, 0, 0, 0, 0, 0]), 128],
      linkLocal: [new IPv6([0xfe80, 0, 0, 0, 0, 0, 0, 0]), 10],
      multicast: [new IPv6([0xff00, 0, 0, 0, 0, 0, 0, 0]), 8],
      loopback: [new IPv6([0, 0, 0, 0, 0, 0, 0, 1]), 128],
      uniqueLocal: [new IPv6([0xfc00, 0, 0, 0, 0, 0, 0, 0]), 7],
      ipv4Mapped: [new IPv6([0, 0, 0, 0, 0, 0xffff, 0, 0]), 96],
      rfc6145: [new IPv6([0, 0, 0, 0, 0xffff, 0, 0, 0]), 96],
      rfc6052: [new IPv6([0x64, 0xff9b, 0, 0, 0, 0, 0, 0]), 96],
      '6to4': [new IPv6([0x2002, 0, 0, 0, 0, 0, 0, 0]), 16],
      teredo: [new IPv6([0x2001, 0, 0, 0, 0, 0, 0, 0]), 32],
      reserved: [[new IPv6([0x2001, 0xdb8, 0, 0, 0, 0, 0, 0]), 32]]
    };

    IPv6.prototype.range = function() {
      return ipaddr.subnetMatch(this, this.SpecialRanges);
    };

    IPv6.prototype.isIPv4MappedAddress = function() {
      return this.range() === 'ipv4Mapped';
    };

    IPv6.prototype.toIPv4Address = function() {
      var high, low, _ref;
      if (!this.isIPv4MappedAddress()) {
        throw new Error("ipaddr: trying to convert a generic ipv6 address to ipv4");
      }
      _ref = this.parts.slice(-2), high = _ref[0], low = _ref[1];
      return new ipaddr.IPv4([high >> 8, high & 0xff, low >> 8, low & 0xff]);
    };

    return IPv6;

  })();

  ipv6Part = "(?:[0-9a-f]+::?)+";

  ipv6Regexes = {
    "native": new RegExp("^(::)?(" + ipv6Part + ")?([0-9a-f]+)?(::)?$", 'i'),
    transitional: new RegExp(("^((?:" + ipv6Part + ")|(?:::)(?:" + ipv6Part + ")?)") + ("" + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "\\." + ipv4Part + "$"), 'i')
  };

  expandIPv6 = function(string, parts) {
    var colonCount, lastColon, part, replacement, replacementCount;
    if (string.indexOf('::') !== string.lastIndexOf('::')) {
      return null;
    }
    colonCount = 0;
    lastColon = -1;
    while ((lastColon = string.indexOf(':', lastColon + 1)) >= 0) {
      colonCount++;
    }
    if (string[0] === ':') {
      colonCount--;
    }
    if (string[string.length - 1] === ':') {
      colonCount--;
    }
    replacementCount = parts - colonCount;
    replacement = ':';
    while (replacementCount--) {
      replacement += '0:';
    }
    string = string.replace('::', replacement);
    if (string[0] === ':') {
      string = string.slice(1);
    }
    if (string[string.length - 1] === ':') {
      string = string.slice(0, -1);
    }
    return (function() {
      var _i, _len, _ref, _results;
      _ref = string.split(":");
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        part = _ref[_i];
        _results.push(parseInt(part, 16));
      }
      return _results;
    })();
  };

  ipaddr.IPv6.parser = function(string) {
    var match, parts;
    if (string.match(ipv6Regexes['native'])) {
      return expandIPv6(string, 8);
    } else if (match = string.match(ipv6Regexes['transitional'])) {
      parts = expandIPv6(match[1].slice(0, -1), 6);
      if (parts) {
        parts.push(parseInt(match[2]) << 8 | parseInt(match[3]));
        parts.push(parseInt(match[4]) << 8 | parseInt(match[5]));
        return parts;
      }
    }
    return null;
  };

  ipaddr.IPv4.isIPv4 = ipaddr.IPv6.isIPv6 = function(string) {
    return this.parser(string) !== null;
  };

  ipaddr.IPv4.isValid = ipaddr.IPv6.isValid = function(string) {
    var e;
    try {
      new this(this.parser(string));
      return true;
    } catch (_error) {
      e = _error;
      return false;
    }
  };

  ipaddr.IPv4.parse = ipaddr.IPv6.parse = function(string) {
    var parts;
    parts = this.parser(string);
    if (parts === null) {
      throw new Error("ipaddr: string is not formatted like ip address");
    }
    return new this(parts);
  };

  ipaddr.isValid = function(string) {
    return ipaddr.IPv6.isValid(string) || ipaddr.IPv4.isValid(string);
  };

  ipaddr.parse = function(string) {
    if (ipaddr.IPv6.isIPv6(string)) {
      return ipaddr.IPv6.parse(string);
    } else if (ipaddr.IPv4.isIPv4(string)) {
      return ipaddr.IPv4.parse(string);
    } else {
      throw new Error("ipaddr: the address has neither IPv6 nor IPv4 format");
    }
  };

  ipaddr.process = function(string) {
    var addr;
    addr = this.parse(string);
    if (addr.kind() === 'ipv6' && addr.isIPv4MappedAddress()) {
      return addr.toIPv4Address();
    } else {
      return addr;
    }
  };

}).call(this);

},{}],9:[function(require,module,exports){
// Copyright 2012 Timothy J Fontaine <tjfontaine@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE

'use strict';

var MemoryStore = require('./memory').MemoryStore;
var utils = require('./lookup');
var Lookup = utils.Lookup;
var util = require('util');
var Heap = require('binaryheap');

var MemoryStoreExpire = function (store, zone, opts) {
  opts = opts || {};
  this._store = store;
  this._zone = zone;
  this._max_keys = opts.max_keys;
  this._ttl = new Heap(true);
};

MemoryStoreExpire.prototype.get = function (domain, key, cb) {
  var self = this;
  this._store.get(domain, key, function (err, results) {
    var i, j, type, record;
    var nresults = {};
    var now = Date.now();

    for (i in results) {
      type = results[i];
      for (j in type) {
        record = type[j];
        record.ttl = Math.round((record._ttl_expires - now) / 1000)
        if (record.ttl > 0) {
          if (!nresults[i]) {
            nresults[i] = [];
          }
          nresults[i].push(record);
        } else {
          self._ttl.remove(record);
          self._store.delete(self._zone, record.name, record.type, function () {});
        }
      }
    }

    cb(err, nresults);
  });
};

MemoryStoreExpire.prototype.set = function (domain, key, data, cb) {
  var i, j, type, record, expires;
  var self = this;
  var now = Date.now();

  key = utils.ensure_absolute(key);

  for (i in data) {
    type = data[i];
    for (j in type) {
      record = type[j];
      expires = (record.ttl * 1000) + now;
      record._ttl_expires = expires;
      self._ttl.insert(record, expires);
    }
  }

  while (this._ttl.length > this._max_keys) {
    var record = this._ttl.pop();
    this._store.delete(this._zone, record.name, record.type);
  }

  this._store.set(domain, key, data, function (err, results) {
    if (cb)
      cb(err, results);
  });
};

MemoryStoreExpire.prototype.delete = function (domain, key, type, cb) {
  if (!cb) {
    cb = type;
    type = undefined;
  }

  var self = this;

  this._store.get(domain, utils.ensure_absolute(key), function (gerr, gresults) {
    var i, j, ktype, record;

    for (i in gresults) {
      ktype = gresults[i];
      for (j in ktype) {
        record = ktype[j];
        self._ttl.remove(record);
      }
    }

    if (!gresults) {
      if (cb)
        cb(gerr, gresults);
      return;
    }

    self._store.delete(domain, key, type, function (err, results) {
      if (cb)
        cb(err, results);
    });
  });
};

var Cache = module.exports = function (opts) {
  opts = opts || {};
  this._zone = '.' || opts.zone;
  this._store = undefined;
  this.purge = function () {
    this._store = new MemoryStoreExpire(opts.store || new MemoryStore(), this._zone, opts);
  }
  this.purge();
};

Cache.prototype.store = function (packet) {
  var self = this;
  var c = {};

  function each(record) {
    var r = c[record.name.toLowerCase()];
    var t;

    if (!r)
      r = c[record.name.toLowerCase()] = {};

    t = r[record.type];

    if (!t)
      t = r[record.type] = [];

    t.push(record);
  }

  packet.answer.forEach(each);
  packet.authority.forEach(each);
  packet.additional.forEach(each);  

  Object.keys(c).forEach(function (key) {
    self._store.set(self._zone, utils.ensure_absolute(key), c[key]);
  });
};

Cache.prototype.lookup = function (question, cb) {
  var self = this;
  Lookup(this._store, this._zone, question, function (err, results) {
    var i, record, found = false;

    for (i in results) {
      record = results[i];
      if (record.type == question.type) {
        found = true;
        break;
      }
    }

    if (results && !found) {
      self._store.delete(self._zone, utils.ensure_absolute(question.name));
      results.forEach(function (rr) {
        self._store.delete(self._zone, utils.ensure_absolute(rr.name));
      });
      results = null;
    }

    cb(results);
  });
};

},{"./lookup":11,"./memory":12,"binaryheap":13,"util":undefined}],10:[function(require,module,exports){
module.exports = require('./cache');
module.exports.MemoryStore = require('./memory').MemoryStore;
module.exports.Lookup = require('./lookup').Lookup;
module.exports.is_absolute = require('./lookup').is_absolute;
module.exports.ensure_absolute = require('./lookup').ensure_absolute;

},{"./cache":9,"./lookup":11,"./memory":12}],11:[function(require,module,exports){
// Copyright 2012 Timothy J Fontaine <tjfontaine@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE

var dgram = require('dgram'),
    EventEmitter = require('events').EventEmitter,
    net = require('net'),
    util = require('util');

var is_absolute = exports.is_absolute = function (f) {
  return f && /\.$/.test(f);
};

var ensure_absolute = exports.ensure_absolute = function (f) {
  if (!is_absolute(f))
    return f += '.';
  return f;
};

var CNAME = require('native-dns-packet').consts.NAME_TO_QTYPE.CNAME;

var Lookup = exports.Lookup = function (store, zone, question, cb) {
  if (!(this instanceof Lookup))
    return new Lookup(store, zone, question, cb);

  this.store = store;
  this.zone = zone;
  this.cb = cb;
  this.question = question;
  this.results = [];
  this.wildcard = undefined;

  this.name = ensure_absolute(question.name);

  this.store.get(this.zone, this.name, this.lookup.bind(this));
};

Lookup.prototype.send = function (err) {
  this.cb(err, this.results);
};

Lookup.prototype.lookup = function (err, results) {
  var type, ret, name, self = this;

  if (err)
    return this.send(err);

  if (!results) {
    if (!this.wildcard)
      this.wildcard = this.question.name;

    if (this.wildcard.toLowerCase() == this.zone.toLowerCase())
      return this.send();

    name = this.wildcard = this.wildcard.split('.').splice(1).join('.');

    // 'com.'.split('.').splice(1) will return empty string, we're at the end
    if (!this.wildcard)
      return this.send();

    name = '*.' + name;
  } else if (results[this.question.type]) {
    type = this.question.type;
    ret = results;
  } else if (results[CNAME]) {
    type = CNAME;
    ret = results;
    this.name = name = results[CNAME][0].data
  }

  if (ret) {
    ret = ret[type];
    ret.forEach(function (r) {
      var rr, k;

      if (self.wildcard && /^\*/.test(r.name)) {
        rr = {};
        for (k in r) {
          rr[k] = r[k];
        }
        rr.name = self.name;
      } else {
        rr = r;
      }

      self.results.push(rr);
    });
  }

  if (name)
    this.store.get(this.zone, ensure_absolute(name), this.lookup.bind(this));
  else
    this.send();
};

},{"dgram":undefined,"events":undefined,"native-dns-packet":15,"net":undefined,"util":undefined}],12:[function(require,module,exports){
// Copyright 2012 Timothy J Fontaine <tjfontaine@gmail.com>
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN

'use strict';

var MemoryStore = exports.MemoryStore = function (opts) {
  this._store = {};
};

MemoryStore.prototype.get = function (domain, key, cb) {
  var d = domain.toLowerCase();
  var k = key.toLowerCase();
  var result = this._store[d];

  if (result)
    result = result[k];

  process.nextTick(function () {
    cb(null, result);
  });
};

MemoryStore.prototype.set = function (domain, key, data, cb) {
  var d = domain.toLowerCase();
  var k = key.toLowerCase();
  var result_domain = this._store[d];

  if (!result_domain)
    result_domain = this._store[d] = {};

  result_domain[k] = data;

  if (cb) {
    process.nextTick(function () {
      cb(null, data);
    });
  }
};

MemoryStore.prototype.delete = function (domain, key, type, cb) {
  var d, k;

  if (!cb) {
    cb = type;
    type = undefined;
  }

  if (!cb) {
    cb = key;
    type = undefined;
  }

  d = this._store[domain.toLowerCase()];

  if (d && key)
    k = d[key.toLowerCase()];

  if (domain && key && type) {
    if (d && k) {
      delete k[type];
    }
  } else if (domain && key) {
    if (d) {
      delete d[k];
    }
  } else if (domain) {
    if (d) {
      delete this._store[domain.toLowerCase()];
    }
  }

  if (cb) {
    process.nextTick(function () {
      cb(null, domain);
    });
  }
};

},{}],13:[function(require,module,exports){
// Copyright 2012 Timothy J Fontaine <tjfontaine@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE

'use strict';

var assert = require('assert');

var Heap = function(min) {
  this.length = 0;
  this.root = undefined;
  if (min) {
    this._comparator = this._smallest;
  } else {
    this._comparator = this._largest;
  }
};

Heap.init = function(obj, key) {
  obj._parent = null;
  obj._left = null;
  obj._right = null;
  obj._key = key;
  return obj;
};

Heap.prototype.count = function (node) {
  if (!node) return 0;

  var c = 1;

  c += this.count(node._left);
  c += this.count(node._right);

  return c;
};

Heap.prototype.insert = function(obj, key) {
  var insert, node;

  this.length += 1;

  node = Heap.init(obj, key);

  if (!this.root) {
    this.root = node;
  } else {
    insert = this._last();

    node._parent = insert;

    if (!insert._left)
      insert._left = node;
    else
      insert._right = node;

    this._up(node);
  }

  this._head();

  return node;
};

Heap.prototype.pop = function() {
  var ret, last;

  if (!this.root)
    return null;

  return this.remove(this.root);
};

Heap.prototype.remove = function(node) {
  var ret, last;

  ret = node;
  last = this._last();

  if (last._right)
    last = last._right;
  else
    last = last._left;

  this.length -= 1;

  if (!last) {
    if (ret == this.root)
      this.root = null;
    return ret;
  }

  if (ret == last) {
    if (ret._parent._left == node)
      ret._parent._left = null;
    else
      ret._parent._right = null;
    last = ret._parent;
    ret._parent = null;
  } else if (!ret._left && !ret._right) {
    // we're trying to remove an element without any children and its not the last
    // move the last under its parent and heap-up
    if (last._parent._left == last) last._parent._left = null;
    else last._parent._right = null;

    if (ret._parent._left == ret) ret._parent._left = last;
    else ret._parent._right = last;

    last._parent = ret._parent;

    ret._parent = null;

    // TODO in this case we shouldn't later also do a down, but it should only visit once
    this._up(last);
  } else {
    this._delete_swap(ret, last);
  }

  if (ret == this.root)
    this.root = last;

  this._down(last);
  this._head();

  return ret;
};

// TODO this probably isn't the most efficient way to ensure that we're always
// at the root of the tree, but it works for now
Heap.prototype._head = function() {
  if (!this.root)
    return;

  var tmp = this.root;
  while (tmp._parent) {
    tmp = tmp._parent;
  }

  this.root = tmp;
};

// TODO is there a more efficient way to store this instead of an array?
Heap.prototype._last = function() {
  var path, pos, mod, insert;

  pos = this.length;
  path = [];
  while (pos > 1) {
    mod = pos % 2;
    pos = Math.floor(pos / 2);
    path.push(mod);
  }

  insert = this.root;

  while (path.length > 1) {
    pos = path.pop();
    if (pos === 0)
      insert = insert._left;
    else
      insert = insert._right;
  }

  return insert;
};

Heap.prototype._swap = function(a, b) {
  var cleft, cright, tparent;

  cleft = b._left;
  cright = b._right;

  if (a._parent) {
    if (a._parent._left == a) a._parent._left = b;
    else a._parent._right = b;
  }

  b._parent = a._parent;
  a._parent = b;

  // This assumes direct descendents
  if (a._left == b) {
    b._left = a;
    b._right = a._right;
    if (b._right) b._right._parent = b;
  } else {
    b._right = a;
    b._left = a._left;
    if (b._left) b._left._parent = b;
  }

  a._left = cleft;
  a._right = cright;

  if (a._left) a._left._parent = a;
  if (a._right) a._right._parent = a;

  assert.notEqual(a._parent, a, "A shouldn't refer to itself");
  assert.notEqual(b._parent, b, "B shouldn't refer to itself");
};

Heap.prototype._delete_swap = function(a, b) {
  if (a._left != b) b._left = a._left;
  if (a._right != b) b._right = a._right;

  if (b._parent._left == b) b._parent._left = null;
  else b._parent._right = null;

  if (a._parent) {
    if (a._parent._left == a) a._parent._left = b;
    else a._parent._right = b;
  }

  b._parent = a._parent;

  if (b._left) b._left._parent = b;
  if (b._right) b._right._parent = b;

  a._parent = null;
  a._left = null;
  a._right = null;
};

Heap.prototype._smallest = function(heap) {
  var small = heap;

  if (heap._left && heap._key > heap._left._key) {
    small = heap._left;
  }

  if (heap._right && small._key > heap._right._key) {
    small = heap._right;
  }

  return small;
};

Heap.prototype._largest = function(heap) {
  var large = heap;

  if (heap._left && heap._key < heap._left._key) {
    large = heap._left;
  }

  if (heap._right && large._key < heap._right._key) {
    large = heap._right;
  }

  return large;
};

Heap.prototype._up = function(node) {
  if (!node || !node._parent)
    return;

  var next = this._comparator(node._parent);

  if (next != node._parent) {
    this._swap(node._parent, node);
    this._up(node);
  }
};

Heap.prototype._down = function(node) {
  if (!node)
    return;

  var next = this._comparator(node);
  if (next != node) {
    this._swap(node, next);
    this._down(node);
  }
};

var util = require('util');

Heap.prototype.print = function(stream) {
  stream.write('digraph {\n');
  Heap._print(this.root, stream);
  stream.write('}\n');
};

Heap._print = function(heap, stream) {
  if (!heap) return;

  if (heap._left) {
    stream.write(util.format('' + heap._key, '->', heap._left._key, '\n'));
    Heap._print(heap._left, stream);
  }

  if (heap._right) {
    stream.write(util.format('' + heap._key, '->', heap._right._key, '\n'));
    Heap._print(heap._right, stream);
  }
};

module.exports = Heap;

},{"assert":undefined,"util":undefined}],14:[function(require,module,exports){
// Copyright 2011 Timothy J Fontaine <tjfontaine@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE

'use strict';

function reverse_map(src) {
  var dst = {},
      k;

  for (k in src) {
    if (src.hasOwnProperty(k)) {
      dst[src[k]] = k;
    }
  }
  return dst;
}

/* http://www.iana.org/assignments/dns-parameters */
var NAME_TO_QTYPE = exports.NAME_TO_QTYPE = {
  A: 1,
  NS: 2,
  MD: 3,
  MF: 4,
  CNAME: 5,
  SOA: 6,
  MB: 7,
  MG: 8,
  MR: 9,
  'NULL': 10,
  WKS: 11,
  PTR: 12,
  HINFO: 13,
  MINFO: 14,
  MX: 15,
  TXT: 16,
  RP: 17,
  AFSDB: 18,
  X25: 19,
  ISDN: 20,
  RT: 21,
  NSAP: 22,
  'NSAP-PTR': 23,
  SIG: 24,
  KEY: 25,
  PX: 26,
  GPOS: 27,
  AAAA: 28,
  LOC: 29,
  NXT: 30,
  EID: 31,
  NIMLOC: 32,
  SRV: 33,
  ATMA: 34,
  NAPTR: 35,
  KX: 36,
  CERT: 37,
  A6: 38,
  DNAME: 39,
  SINK: 40,
  OPT: 41,
  APL: 42,
  DS: 43,
  SSHFP: 44,
  IPSECKEY: 45,
  RRSIG: 46,
  NSEC: 47,
  DNSKEY: 48,
  DHCID: 49,
  NSEC3: 50,
  NSEC3PARAM: 51,
  TLSA: 52,
  HIP: 55,
  NINFO: 56,
  RKEY: 57,
  TALINK: 58,
  CDS: 59,
  SPF: 99,
  UINFO: 100,
  UID: 101,
  GID: 102,
  UNSPEC: 103,
  TKEY: 249,
  TSIG: 250,
  IXFR: 251,
  AXFR: 252,
  MAILB: 253,
  MAILA: 254,
  ANY: 255,
  URI: 256,
  CAA: 257,
  TA: 32768,
  DLV: 32769
};
exports.QTYPE_TO_NAME = reverse_map(NAME_TO_QTYPE);

exports.nameToQtype = function(n) {
  return NAME_TO_QTYPE[n.toUpperCase()];
};

exports.qtypeToName = function(t) {
  return exports.QTYPE_TO_NAME[t];
};

var NAME_TO_QCLASS = exports.NAME_TO_QCLASS = {
  IN: 1
};
exports.QCLASS_TO_NAME = reverse_map(NAME_TO_QCLASS);

exports.FAMILY_TO_QTYPE = {
  4: NAME_TO_QTYPE.A,
  6: NAME_TO_QTYPE.AAAA
};
exports.QTYPE_TO_FAMILY = {};
exports.QTYPE_TO_FAMILY[exports.NAME_TO_QTYPE.A] = 4;
exports.QTYPE_TO_FAMILY[exports.NAME_TO_QTYPE.AAAA] = 6;

exports.NAME_TO_RCODE = {
  NOERROR: 0,
  FORMERR: 1,
  SERVFAIL: 2,
  NOTFOUND: 3,
  NOTIMP: 4,
  REFUSED: 5,
  YXDOMAIN: 6, //Name Exists when it should not
  YXRRSET: 7, //RR Set Exists when it should not
  NXRRSET: 8, //RR Set that should exist does not
  NOTAUTH: 9,
  NOTZONE: 10,
  BADVERS: 16,
  BADSIG: 16, // really?
  BADKEY: 17,
  BADTIME: 18,
  BADMODE: 19,
  BADNAME: 20,
  BADALG: 21,
  BADTRUNC: 22
};
exports.RCODE_TO_NAME = reverse_map(exports.NAME_TO_RCODE);

exports.BADNAME = 'EBADNAME';
exports.BADRESP = 'EBADRESP';
exports.CONNREFUSED = 'ECONNREFUSED';
exports.DESTRUCTION = 'EDESTRUCTION';
exports.REFUSED = 'EREFUSED';
exports.FORMERR = 'EFORMERR';
exports.NODATA = 'ENODATA';
exports.NOMEM = 'ENOMEM';
exports.NOTFOUND = 'ENOTFOUND';
exports.NOTIMP = 'ENOTIMP';
exports.SERVFAIL = 'ESERVFAIL';
exports.TIMEOUT = 'ETIMEOUT';

},{}],15:[function(require,module,exports){
module.exports = require('./packet');
module.exports.consts = require('./consts');

},{"./consts":14,"./packet":19}],16:[function(require,module,exports){
// Copyright 2012 Timothy J Fontaine <tjfontaine@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE

var util = require('util');
var VError = require('verror');

var BufferCursor = module.exports = function(buff, noAssert) {
  if (!(this instanceof BufferCursor))
    return new BufferCursor(buff, noAssert);

  this._pos = 0;

  this._noAssert = noAssert;

  if (this._noAssert === undefined)
    this._noAssert = true;

  this.buffer = buff;
  this.length = buff.length;
};

var BCO = BufferCursor.BufferCursorOverflow = function(length, pos, size) {
  this.kind = 'BufferCursorOverflow';
  this.length = length;
  this.position = pos;
  this.size = size;
  VError.call(this,
              'BufferCursorOverflow: length %d, position %d, size %d',
              length,
              pos,
              size);
};
util.inherits(BCO, VError);

BufferCursor.prototype._move = function(step) {
  this._checkWrite(step);
  this._pos += step;
};

BufferCursor.prototype._checkWrite = function(size) {
  var shouldThrow = false;

  var length = this.length;
  var pos = this._pos;

  if (size > length)
    shouldThrow = true;

  if (length - pos < size)
    shouldThrow = true;

  if (shouldThrow) {
    var bco = new BCO(length,
                      pos,
                      size);
    throw bco;
  }
}

BufferCursor.prototype.seek = function(pos) {
  if (pos < 0)
    throw new VError(new RangeError('Cannot seek before start of buffer'),
                     'Negative seek values not allowed: %d', pos);

  if (pos > this.length)
    throw new VError(new RangeError('Trying to seek beyond buffer'),
                     'Requested %d position is beyond length %d',
                     pos, this.length);

  this._pos = pos;
  return this;
};

BufferCursor.prototype.eof = function() {
  return this._pos == this.length;
};

BufferCursor.prototype.toByteArray = function(method) {
  var arr = [], i, part, count;

  if (!method) {
    method = 'readUInt8';
    part = 1;
  }

  if (method.indexOf('16') > 0)
    part = 2;
  else if (method.indexOf('32') > 0)
    part = 4;

  count = this.length / part;

  for (i = 0; i < this.buffer.length; i += part) {
    arr.push(this.buffer[method](i));
  }
  return arr;
};

BufferCursor.prototype.tell = function() {
  return this._pos;
};

BufferCursor.prototype.slice = function(length) {
  var end, b;

  if (length === undefined) {
    end = this.length;
  } else {
    end = this._pos + length;
  }

  b = new BufferCursor(this.buffer.slice(this._pos, end));
  this.seek(end);

  return b;
};

BufferCursor.prototype.toString = function(encoding, length) {
  var end, ret;

  if (length === undefined) {
    end = this.length;
  } else {
    end = this._pos + length;
  }

  if (!encoding) {
    encoding = 'utf8';
  }

  ret = this.buffer.toString(encoding, this._pos, end);
  this.seek(end);
  return ret;
};

// This method doesn't need to _checkWrite because Buffer implicitly truncates
// to the length of the buffer, it's the only method in Node core that behaves
// this way by default
BufferCursor.prototype.write = function(value, length, encoding) {
  var end, ret;

  ret = this.buffer.write(value, this._pos, length, encoding);
  this._move(ret);
  return this;
};

BufferCursor.prototype.fill = function(value, length) {
  var end;

  if (length === undefined) {
    end = this.length;
  } else {
    end = this._pos + length;
  }

  this._checkWrite(end - this._pos);

  this.buffer.fill(value, this._pos, end);
  this.seek(end);
  return this;
};

// This prototype is not entirely like the upstream Buffer.copy, instead it
// is the target buffer, and accepts the source buffer -- since the target
// buffer knows its starting position
BufferCursor.prototype.copy = function copy(source, sourceStart, sourceEnd) {
  var sBC = source instanceof BufferCursor;

  if (isNaN(sourceEnd))
    sourceEnd = source.length;

  if (isNaN(sourceStart)) {
    if (sBC)
      sourceStart = source._pos;
    else
      sourceStart = 0;
  }

  var length = sourceEnd - sourceStart;

  this._checkWrite(length);

  var buf = sBC ? source.buffer : source;

  buf.copy(this.buffer, this._pos, sourceStart, sourceEnd);

  this._move(length);
  return this;
};

BufferCursor.prototype.readUInt8 = function() {
  var ret = this.buffer.readUInt8(this._pos, this._noAssert);
  this._move(1);
  return ret;
};

BufferCursor.prototype.readInt8 = function() {
  var ret = this.buffer.readInt8(this._pos, this._noAssert);
  this._move(1);
  return ret;
};

BufferCursor.prototype.readInt16BE = function() {
  var ret = this.buffer.readInt16BE(this._pos, this._noAssert);
  this._move(2);
  return ret;
};

BufferCursor.prototype.readInt16LE = function() {
  var ret = this.buffer.readInt16LE(this._pos, this._noAssert);
  this._move(2);
  return ret;
};

BufferCursor.prototype.readUInt16BE = function() {
  var ret = this.buffer.readUInt16BE(this._pos, this._noAssert);
  this._move(2);
  return ret;
};

BufferCursor.prototype.readUInt16LE = function() {
  var ret = this.buffer.readUInt16LE(this._pos, this._noAssert);
  this._move(2);
  return ret;
};

BufferCursor.prototype.readUInt32LE = function() {
  var ret = this.buffer.readUInt32LE(this._pos, this._noAssert);
  this._move(4);
  return ret;
};

BufferCursor.prototype.readUInt32BE = function() {
  var ret = this.buffer.readUInt32BE(this._pos, this._noAssert);
  this._move(4);
  return ret;
};

BufferCursor.prototype.readInt32LE = function() {
  var ret = this.buffer.readInt32LE(this._pos, this._noAssert);
  this._move(4);
  return ret;
};

BufferCursor.prototype.readInt32BE = function() {
  var ret = this.buffer.readInt32BE(this._pos, this._noAssert);
  this._move(4);
  return ret;
};

BufferCursor.prototype.readFloatBE = function() {
  var ret = this.buffer.readFloatBE(this._pos, this._noAssert);
  this._move(4);
  return ret;
};

BufferCursor.prototype.readFloatLE = function() {
  var ret = this.buffer.readFloatLE(this._pos, this._noAssert);
  this._move(4);
  return ret;
};

BufferCursor.prototype.readDoubleBE = function() {
  var ret = this.buffer.readDoubleBE(this._pos, this._noAssert);
  this._move(8);
  return ret;
};

BufferCursor.prototype.readDoubleLE = function() {
  var ret = this.buffer.readDoubleLE(this._pos, this._noAssert);
  this._move(8);
  return ret;
};

BufferCursor.prototype.writeUInt8 = function(value) {
  this._checkWrite(1);
  this.buffer.writeUInt8(value, this._pos, this._noAssert);
  this._move(1);
  return this;
};

BufferCursor.prototype.writeInt8 = function(value) {
  this._checkWrite(1);
  this.buffer.writeInt8(value, this._pos, this._noAssert);
  this._move(1);
  return this;
};

BufferCursor.prototype.writeUInt16BE = function(value) {
  this._checkWrite(2);
  this.buffer.writeUInt16BE(value, this._pos, this._noAssert);
  this._move(2);
  return this;
};

BufferCursor.prototype.writeUInt16LE = function(value) {
  this._checkWrite(2);
  this.buffer.writeUInt16LE(value, this._pos, this._noAssert);
  this._move(2);
  return this;
};

BufferCursor.prototype.writeInt16BE = function(value) {
  this._checkWrite(2);
  this.buffer.writeInt16BE(value, this._pos, this._noAssert);
  this._move(2);
  return this;
};

BufferCursor.prototype.writeInt16LE = function(value) {
  this._checkWrite(2);
  this.buffer.writeInt16LE(value, this._pos, this._noAssert);
  this._move(2);
  return this;
};

BufferCursor.prototype.writeUInt32BE = function(value) {
  this._checkWrite(4);
  this.buffer.writeUInt32BE(value, this._pos, this._noAssert);
  this._move(4);
  return this;
};

BufferCursor.prototype.writeUInt32LE = function(value) {
  this._checkWrite(4);
  this.buffer.writeUInt32LE(value, this._pos, this._noAssert);
  this._move(4);
  return this;
};

BufferCursor.prototype.writeInt32BE = function(value) {
  this._checkWrite(4);
  this.buffer.writeInt32BE(value, this._pos, this._noAssert);
  this._move(4);
  return this;
};

BufferCursor.prototype.writeInt32LE = function(value) {
  this._checkWrite(4);
  this.buffer.writeInt32LE(value, this._pos, this._noAssert);
  this._move(4);
  return this;
};

BufferCursor.prototype.writeFloatBE = function(value) {
  this._checkWrite(4);
  this.buffer.writeFloatBE(value, this._pos, this._noAssert);
  this._move(4);
  return this;
};

BufferCursor.prototype.writeFloatLE = function(value) {
  this._checkWrite(4);
  this.buffer.writeFloatLE(value, this._pos, this._noAssert);
  this._move(4);
  return this;
};

BufferCursor.prototype.writeDoubleBE = function(value) {
  this._checkWrite(8);
  this.buffer.writeDoubleBE(value, this._pos, this._noAssert);
  this._move(8);
  return this;
};

BufferCursor.prototype.writeDoubleLE = function(value) {
  this._checkWrite(8);
  this.buffer.writeDoubleLE(value, this._pos, this._noAssert);
  this._move(8);
  return this;
};

},{"util":undefined,"verror":17}],17:[function(require,module,exports){
/*
 * verror.js: richer JavaScript errors
 */

var mod_assert = require('assert');
var mod_util = require('util');

var mod_extsprintf = require('extsprintf');

/*
 * Public interface
 */

/* So you can 'var VError = require('verror')' */
module.exports = VError;
/* For compatibility */
VError.VError = VError;
/* Other exported classes */
VError.WError = WError;
VError.MultiError = MultiError;

/*
 * VError([cause], fmt[, arg...]): Like JavaScript's built-in Error class, but
 * supports a "cause" argument (another error) and a printf-style message.  The
 * cause argument can be null or omitted entirely.
 *
 * Examples:
 *
 * CODE                                    MESSAGE
 * new VError('something bad happened')    "something bad happened"
 * new VError('missing file: "%s"', file)  "missing file: "/etc/passwd"
 *   with file = '/etc/passwd'
 * new VError(err, 'open failed')          "open failed: file not found"
 *   with err.message = 'file not found'
 */
function VError(options)
{
	var args, causedBy, ctor, tailmsg;

	if (options instanceof Error || typeof (options) === 'object') {
		args = Array.prototype.slice.call(arguments, 1);
	} else {
		args = Array.prototype.slice.call(arguments, 0);
		options = undefined;
	}

	tailmsg = args.length > 0 ?
	    mod_extsprintf.sprintf.apply(null, args) : '';
	this.jse_shortmsg = tailmsg;
	this.jse_summary = tailmsg;

	if (options) {
		causedBy = options.cause;

		if (!causedBy || !(options.cause instanceof Error))
			causedBy = options;

		if (causedBy && (causedBy instanceof Error)) {
			this.jse_cause = causedBy;
			this.jse_summary += ': ' + causedBy.message;
		}
	}

	this.message = this.jse_summary;
	Error.call(this, this.jse_summary);

	if (Error.captureStackTrace) {
		ctor = options ? options.constructorOpt : undefined;
		ctor = ctor || arguments.callee;
		Error.captureStackTrace(this, ctor);
	}
}

mod_util.inherits(VError, Error);
VError.prototype.name = 'VError';

VError.prototype.toString = function ve_toString()
{
	var str = (this.hasOwnProperty('name') && this.name ||
		this.constructor.name || this.constructor.prototype.name);
	if (this.message)
		str += ': ' + this.message;

	return (str);
};

VError.prototype.cause = function ve_cause()
{
	return (this.jse_cause);
};


/*
 * Represents a collection of errors for the purpose of consumers that generally
 * only deal with one error.  Callers can extract the individual errors
 * contained in this object, but may also just treat it as a normal single
 * error, in which case a summary message will be printed.
 */
function MultiError(errors)
{
	mod_assert.ok(errors.length > 0);
	this.ase_errors = errors;

	VError.call(this, errors[0], 'first of %d error%s',
	    errors.length, errors.length == 1 ? '' : 's');
}

mod_util.inherits(MultiError, VError);



/*
 * Like JavaScript's built-in Error class, but supports a "cause" argument which
 * is wrapped, not "folded in" as with VError.	Accepts a printf-style message.
 * The cause argument can be null.
 */
function WError(options)
{
	Error.call(this);

	var args, cause, ctor;
	if (typeof (options) === 'object') {
		args = Array.prototype.slice.call(arguments, 1);
	} else {
		args = Array.prototype.slice.call(arguments, 0);
		options = undefined;
	}

	if (args.length > 0) {
		this.message = mod_extsprintf.sprintf.apply(null, args);
	} else {
		this.message = '';
	}

	if (options) {
		if (options instanceof Error) {
			cause = options;
		} else {
			cause = options.cause;
			ctor = options.constructorOpt;
		}
	}

	Error.captureStackTrace(this, ctor || this.constructor);
	if (cause)
		this.cause(cause);

}

mod_util.inherits(WError, Error);
WError.prototype.name = 'WError';


WError.prototype.toString = function we_toString()
{
	var str = (this.hasOwnProperty('name') && this.name ||
		this.constructor.name || this.constructor.prototype.name);
	if (this.message)
		str += ': ' + this.message;
	if (this.we_cause && this.we_cause.message)
		str += '; caused by ' + this.we_cause.toString();

	return (str);
};

WError.prototype.cause = function we_cause(c)
{
	if (c instanceof Error)
		this.we_cause = c;

	return (this.we_cause);
};

},{"assert":undefined,"extsprintf":18,"util":undefined}],18:[function(require,module,exports){
/*
 * extsprintf.js: extended POSIX-style sprintf
 */

var mod_assert = require('assert');
var mod_util = require('util');

/*
 * Public interface
 */
exports.sprintf = jsSprintf;

/*
 * Stripped down version of s[n]printf(3c).  We make a best effort to throw an
 * exception when given a format string we don't understand, rather than
 * ignoring it, so that we won't break existing programs if/when we go implement
 * the rest of this.
 *
 * This implementation currently supports specifying
 *	- field alignment ('-' flag),
 * 	- zero-pad ('0' flag)
 *	- always show numeric sign ('+' flag),
 *	- field width
 *	- conversions for strings, decimal integers, and floats (numbers).
 *	- argument size specifiers.  These are all accepted but ignored, since
 *	  Javascript has no notion of the physical size of an argument.
 *
 * Everything else is currently unsupported, most notably precision, unsigned
 * numbers, non-decimal numbers, and characters.
 */
function jsSprintf(fmt)
{
	var regex = [
	    '([^%]*)',				/* normal text */
	    '%',				/* start of format */
	    '([\'\\-+ #0]*?)',			/* flags (optional) */
	    '([1-9]\\d*)?',			/* width (optional) */
	    '(\\.([1-9]\\d*))?',		/* precision (optional) */
	    '[lhjztL]*?',			/* length mods (ignored) */
	    '([diouxXfFeEgGaAcCsSp%jr])'	/* conversion */
	].join('');

	var re = new RegExp(regex);
	var args = Array.prototype.slice.call(arguments, 1);
	var flags, width, precision, conversion;
	var left, pad, sign, arg, match;
	var ret = '';
	var argn = 1;

	mod_assert.equal('string', typeof (fmt));

	while ((match = re.exec(fmt)) !== null) {
		ret += match[1];
		fmt = fmt.substring(match[0].length);

		flags = match[2] || '';
		width = match[3] || 0;
		precision = match[4] || '';
		conversion = match[6];
		left = false;
		sign = false;
		pad = ' ';

		if (conversion == '%') {
			ret += '%';
			continue;
		}

		if (args.length === 0)
			throw (new Error('too few args to sprintf'));

		arg = args.shift();
		argn++;

		if (flags.match(/[\' #]/))
			throw (new Error(
			    'unsupported flags: ' + flags));

		if (precision.length > 0)
			throw (new Error(
			    'non-zero precision not supported'));

		if (flags.match(/-/))
			left = true;

		if (flags.match(/0/))
			pad = '0';

		if (flags.match(/\+/))
			sign = true;

		switch (conversion) {
		case 's':
			if (arg === undefined || arg === null)
				throw (new Error('argument ' + argn +
				    ': attempted to print undefined or null ' +
				    'as a string'));
			ret += doPad(pad, width, left, arg.toString());
			break;

		case 'd':
			arg = Math.floor(arg);
			/*jsl:fallthru*/
		case 'f':
			sign = sign && arg > 0 ? '+' : '';
			ret += sign + doPad(pad, width, left,
			    arg.toString());
			break;

		case 'j': /* non-standard */
			if (width === 0)
				width = 10;
			ret += mod_util.inspect(arg, false, width);
			break;

		case 'r': /* non-standard */
			ret += dumpException(arg);
			break;

		default:
			throw (new Error('unsupported conversion: ' +
			    conversion));
		}
	}

	ret += fmt;
	return (ret);
}

function doPad(chr, width, left, str)
{
	var ret = str;

	while (ret.length < width) {
		if (left)
			ret += chr;
		else
			ret = chr + ret;
	}

	return (ret);
}

/*
 * This function dumps long stack traces for exceptions having a cause() method.
 * See node-verror for an example.
 */
function dumpException(ex)
{
	var ret;

	if (!(ex instanceof Error))
		throw (new Error(jsSprintf('invalid type for %%r: %j', ex)));

	/* Note that V8 prepends "ex.stack" with ex.toString(). */
	ret = 'EXCEPTION: ' + ex.constructor.name + ': ' + ex.stack;

	if (ex.cause && typeof (ex.cause) === 'function') {
		var cex = ex.cause();
		if (cex) {
			ret += '\nCaused by: ' + dumpException(cex);
		}
	}

	return (ret);
}

},{"assert":undefined,"util":undefined}],19:[function(require,module,exports){
// Copyright 2011 Timothy J Fontaine <tjfontaine@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE

// TODO: change the default UDP packet size that node-dns sends
//       from 4096 to conform to these:
//       - [requestor's payload size](https://tools.ietf.org/html/rfc6891#section-6.2.3)
//       - [responders's payload size](https://tools.ietf.org/html/rfc6891#section-6.2.4)

'use strict';

var consts = require('./consts'),
    BufferCursor = require('buffercursor'),
    BufferCursorOverflow = BufferCursor.BufferCursorOverflow,
    ipaddr = require('ipaddr.js'),
    assert = require('assert'),
    util = require('util');

function assertUndefined(val, msg) {
  assert(typeof val != 'undefined', msg);
}

var Packet = module.exports = function() {
  this.header = {
    id: 0,
    qr: 0,
    opcode: 0,
    aa: 0,
    tc: 0,
    rd: 1,
    ra: 0,
    res1: 0,
    res2: 0,
    res3: 0,
    rcode: 0
  };
  this.question = [];
  this.answer = [];
  this.authority = [];
  this.additional = [];
  this.edns_options = [];   // TODO: DEPRECATED! Use `.edns.options` instead!
  this.payload = undefined; // TODO: DEPRECATED! Use `.edns.payload` instead!
};

var LABEL_POINTER = 0xC0;

var isPointer = function(len) {
  return (len & LABEL_POINTER) === LABEL_POINTER;
};

function nameUnpack(buff) {
  var len, comp, end, pos, part, combine = '';

  len = buff.readUInt8();
  comp = false;
  end = buff.tell();

  while (len !== 0) {
    if (isPointer(len)) {
      len -= LABEL_POINTER;
      len = len << 8;
      pos = len + buff.readUInt8();
      if (!comp)
        end = buff.tell();
      buff.seek(pos);
      len = buff.readUInt8();
      comp = true;
      continue;
    }

    part = buff.toString('ascii', len);

    if (combine.length)
      combine = combine + '.' + part;
    else
      combine = part;

    len = buff.readUInt8();

    if (!comp)
      end = buff.tell();
  }

  buff.seek(end);

  return combine;
}

function namePack(str, buff, index) {
  var offset, dot, part;

  while (str) {
    if (index[str]) {
      offset = (LABEL_POINTER << 8) + index[str];
      buff.writeUInt16BE(offset);
      break;
    } else {
      index[str] = buff.tell();
      dot = str.indexOf('.');
      if (dot > -1) {
        part = str.slice(0, dot);
        str = str.slice(dot + 1);
      } else {
        part = str;
        str = undefined;
      }
      buff.writeUInt8(part.length);
      buff.write(part, part.length, 'ascii');
    }
  }

  if (!str) {
    buff.writeUInt8(0);
  }
}

var
  WRITE_HEADER              = 100001,
  WRITE_TRUNCATE            = 100002,
  WRITE_QUESTION            = 100003,
  WRITE_RESOURCE_RECORD     = 100004,
  WRITE_RESOURCE_WRITE      = 100005,
  WRITE_RESOURCE_DONE       = 100006,
  WRITE_RESOURCE_END        = 100007,
  WRITE_EDNS                = 100008,
  WRITE_END                 = 100009,
  WRITE_A     = consts.NAME_TO_QTYPE.A,
  WRITE_AAAA  = consts.NAME_TO_QTYPE.AAAA,
  WRITE_NS    = consts.NAME_TO_QTYPE.NS,
  WRITE_CNAME = consts.NAME_TO_QTYPE.CNAME,
  WRITE_PTR   = consts.NAME_TO_QTYPE.PTR,
  WRITE_SPF   = consts.NAME_TO_QTYPE.SPF,
  WRITE_MX    = consts.NAME_TO_QTYPE.MX,
  WRITE_SRV   = consts.NAME_TO_QTYPE.SRV,
  WRITE_TXT   = consts.NAME_TO_QTYPE.TXT,
  WRITE_SOA   = consts.NAME_TO_QTYPE.SOA,
  WRITE_OPT   = consts.NAME_TO_QTYPE.OPT,
  WRITE_NAPTR = consts.NAME_TO_QTYPE.NAPTR,
  WRITE_TLSA  = consts.NAME_TO_QTYPE.TLSA;

function writeHeader(buff, packet) {
  assert(packet.header, 'Packet requires "header"');
  buff.writeUInt16BE(packet.header.id & 0xFFFF);
  var val = 0;
  val += (packet.header.qr << 15) & 0x8000;
  val += (packet.header.opcode << 11) & 0x7800;
  val += (packet.header.aa << 10) & 0x400;
  val += (packet.header.tc << 9) & 0x200;
  val += (packet.header.rd << 8) & 0x100;
  val += (packet.header.ra << 7) & 0x80;
  val += (packet.header.res1 << 6) & 0x40;
  val += (packet.header.res2 << 5) & 0x20;
  val += (packet.header.res3 << 4) & 0x10;
  val += packet.header.rcode & 0xF;
  buff.writeUInt16BE(val & 0xFFFF);
  assert(packet.question.length == 1, 'DNS requires one question');
  // aren't used
  buff.writeUInt16BE(1);
  // answer offset 6
  buff.writeUInt16BE(packet.answer.length & 0xFFFF);
  // authority offset 8
  buff.writeUInt16BE(packet.authority.length & 0xFFFF);
  // additional offset 10
  buff.writeUInt16BE(packet.additional.length & 0xFFFF);
  return WRITE_QUESTION;
}

function writeTruncate(buff, packet, section, val) {
  // XXX FIXME TODO truncation is currently done wrong.
  // Quote rfc2181 section 9
  // The TC bit should not be set merely because some extra information
  // could have been included, but there was insufficient room.  This
  // includes the results of additional section processing.  In such cases
  // the entire RRSet that will not fit in the response should be omitted,
  // and the reply sent as is, with the TC bit clear.  If the recipient of
  // the reply needs the omitted data, it can construct a query for that
  // data and send that separately.
  //
  // TODO IOW only set TC if we hit it in ANSWERS otherwise make sure an
  // entire RRSet is removed during a truncation.
  var pos;

  buff.seek(2);
  val = buff.readUInt16BE();
  val |= (1 << 9) & 0x200;
  buff.seek(2);
  buff.writeUInt16BE(val);
  switch (section) {
    case 'answer':
      pos = 6;
      // seek to authority and clear it and additional out
      buff.seek(8);
      buff.writeUInt16BE(0);
      buff.writeUInt16BE(0);
      break;
    case 'authority':
      pos = 8;
      // seek to additional and clear it out
      buff.seek(10);
      buff.writeUInt16BE(0);
      break;
    case 'additional':
      pos = 10;
      break;
  }
  buff.seek(pos);
  buff.writeUInt16BE(count - 1); // TODO: count not defined!
  buff.seek(last_resource);      // TODO: last_resource not defined!
  return WRITE_END;
}

function writeQuestion(buff, val, label_index) {
  assert(val, 'Packet requires a question');
  assertUndefined(val.name, 'Question requires a "name"');
  assertUndefined(val.type, 'Question requires a "type"');
  assertUndefined(val.class, 'Questionn requires a "class"');
  namePack(val.name, buff, label_index);
  buff.writeUInt16BE(val.type & 0xFFFF);
  buff.writeUInt16BE(val.class & 0xFFFF);
  return WRITE_RESOURCE_RECORD;
}

function writeResource(buff, val, label_index, rdata) {
  assert(val, 'Resource must be defined');
  assertUndefined(val.name, 'Resource record requires "name"');
  assertUndefined(val.type, 'Resource record requires "type"');
  assertUndefined(val.class, 'Resource record requires "class"');
  assertUndefined(val.ttl, 'Resource record requires "ttl"');
  namePack(val.name, buff, label_index);
  buff.writeUInt16BE(val.type & 0xFFFF);
  buff.writeUInt16BE(val.class & 0xFFFF);
  buff.writeUInt32BE(val.ttl & 0xFFFFFFFF);
  rdata.pos = buff.tell();
  buff.writeUInt16BE(0); // if there is rdata, then this value will be updated
                         // to the correct value by 'writeResourceDone'
  return val.type;
}

function writeResourceDone(buff, rdata) {
  var pos = buff.tell();
  buff.seek(rdata.pos);
  buff.writeUInt16BE(pos - rdata.pos - 2);
  buff.seek(pos);
  return WRITE_RESOURCE_RECORD;
}

function writeIp(buff, val) {
  //TODO XXX FIXME -- assert that address is of proper type
  assertUndefined(val.address, 'A/AAAA record requires "address"');
  val = ipaddr.parse(val.address).toByteArray();
  val.forEach(function(b) {
    buff.writeUInt8(b);
  });
  return WRITE_RESOURCE_DONE;
}

function writeCname(buff, val, label_index) {
  assertUndefined(val.data, 'NS/CNAME/PTR record requires "data"');
  namePack(val.data, buff, label_index);
  return WRITE_RESOURCE_DONE;
}

// For <character-string> see: http://tools.ietf.org/html/rfc1035#section-3.3
// For TXT: http://tools.ietf.org/html/rfc1035#section-3.3.14
function writeTxt(buff, val) {
  //TODO XXX FIXME -- split on max char string and loop
  assertUndefined(val.data, 'TXT record requires "data"');
  for (var i=0,len=val.data.length; i<len; i++) {
    var dataLen = Buffer.byteLength(val.data[i], 'utf8');
    buff.writeUInt8(dataLen);
    buff.write(val.data[i], dataLen, 'utf8');
  }
  return WRITE_RESOURCE_DONE;
}

function writeMx(buff, val, label_index) {
  assertUndefined(val.priority, 'MX record requires "priority"');
  assertUndefined(val.exchange, 'MX record requires "exchange"');
  buff.writeUInt16BE(val.priority & 0xFFFF);
  namePack(val.exchange, buff, label_index);
  return WRITE_RESOURCE_DONE;
}

// SRV: https://tools.ietf.org/html/rfc2782
// TODO: SRV fixture failing for '_xmpp-server._tcp.gmail.com.srv.js'
function writeSrv(buff, val, label_index) {
  assertUndefined(val.priority, 'SRV record requires "priority"');
  assertUndefined(val.weight, 'SRV record requires "weight"');
  assertUndefined(val.port, 'SRV record requires "port"');
  assertUndefined(val.target, 'SRV record requires "target"');
  buff.writeUInt16BE(val.priority & 0xFFFF);
  buff.writeUInt16BE(val.weight & 0xFFFF);
  buff.writeUInt16BE(val.port & 0xFFFF);
  namePack(val.target, buff, label_index);
  return WRITE_RESOURCE_DONE;
}

function writeSoa(buff, val, label_index) {
  assertUndefined(val.primary, 'SOA record requires "primary"');
  assertUndefined(val.admin, 'SOA record requires "admin"');
  assertUndefined(val.serial, 'SOA record requires "serial"');
  assertUndefined(val.refresh, 'SOA record requires "refresh"');
  assertUndefined(val.retry, 'SOA record requires "retry"');
  assertUndefined(val.expiration, 'SOA record requires "expiration"');
  assertUndefined(val.minimum, 'SOA record requires "minimum"');
  namePack(val.primary, buff, label_index);
  namePack(val.admin, buff, label_index);
  buff.writeUInt32BE(val.serial & 0xFFFFFFFF);
  buff.writeInt32BE(val.refresh & 0xFFFFFFFF);
  buff.writeInt32BE(val.retry & 0xFFFFFFFF);
  buff.writeInt32BE(val.expiration & 0xFFFFFFFF);
  buff.writeInt32BE(val.minimum & 0xFFFFFFFF);
  return WRITE_RESOURCE_DONE;
}

// http://tools.ietf.org/html/rfc3403#section-4.1
function writeNaptr(buff, val, label_index) {
  assertUndefined(val.order, 'NAPTR record requires "order"');
  assertUndefined(val.preference, 'NAPTR record requires "preference"');
  assertUndefined(val.flags, 'NAPTR record requires "flags"');
  assertUndefined(val.service, 'NAPTR record requires "service"');
  assertUndefined(val.regexp, 'NAPTR record requires "regexp"');
  assertUndefined(val.replacement, 'NAPTR record requires "replacement"');
  buff.writeUInt16BE(val.order & 0xFFFF);
  buff.writeUInt16BE(val.preference & 0xFFFF);
  buff.writeUInt8(val.flags.length);
  buff.write(val.flags, val.flags.length, 'ascii');
  buff.writeUInt8(val.service.length);
  buff.write(val.service, val.service.length, 'ascii');
  buff.writeUInt8(val.regexp.length);
  buff.write(val.regexp, val.regexp.length, 'ascii');
  namePack(val.replacement, buff, label_index);
  return WRITE_RESOURCE_DONE;
}

// https://tools.ietf.org/html/rfc6698
function writeTlsa(buff, val) {
  assertUndefined(val.usage, 'TLSA record requires "usage"');
  assertUndefined(val.selector, 'TLSA record requires "selector"');
  assertUndefined(val.matchingtype, 'TLSA record requires "matchingtype"');
  assertUndefined(val.buff, 'TLSA record requires "buff"');
  buff.writeUInt8(val.usage);
  buff.writeUInt8(val.selector);
  buff.writeUInt8(val.matchingtype);
  buff.copy(val.buff);
  return WRITE_RESOURCE_DONE;
}

function makeEdns(packet) {
  packet.edns = {
    name: '',
    type: consts.NAME_TO_QTYPE.OPT,
    class: packet.payload,
    options: [],
    ttl: 0
  };
  packet.edns_options = packet.edns.options; // TODO: 'edns_options' is DEPRECATED!
  packet.additional.push(packet.edns);
  return WRITE_HEADER;
}

function writeOpt(buff, val) {
  var opt;
  for (var i=0, len=val.options.length; i<len; i++) {
    opt = val.options[i];
    buff.writeUInt16BE(opt.code);
    buff.writeUInt16BE(opt.data.length);
    buff.copy(opt.data);
  }
  return WRITE_RESOURCE_DONE;
}

Packet.write = function(buff, packet) {
  var state = WRITE_HEADER,
      val,
      section,
      count,
      rdata,
      last_resource,
      label_index = {};

  buff = new BufferCursor(buff);

  // the existence of 'edns' in a packet indicates that a proper OPT record exists
  // in 'additional' and that all of the other fields in packet (that are parsed by
  // 'parseOpt') are properly set. If it does not exist, we assume that the user
  // is requesting that we create one for them.
  if (typeof packet.edns_version !== 'undefined' && typeof packet.edns === "undefined")
    state = makeEdns(packet);

  // TODO: this is unnecessarily inefficient. rewrite this using a
  //       function table instead. (same for Packet.parse too).
  while (true) {
    try {
      switch (state) {
        case WRITE_HEADER:
          state = writeHeader(buff, packet);
          break;
        case WRITE_TRUNCATE:
          state = writeTruncate(buff, packet, section, last_resource);
          break;
        case WRITE_QUESTION:
          state = writeQuestion(buff, packet.question[0], label_index);
          section = 'answer';
          count = 0;
          break;
        case WRITE_RESOURCE_RECORD:
          last_resource = buff.tell();
          if (packet[section].length == count) {
            switch (section) {
              case 'answer':
                section = 'authority';
                state = WRITE_RESOURCE_RECORD;
                break;
              case 'authority':
                section = 'additional';
                state = WRITE_RESOURCE_RECORD;
                break;
              case 'additional':
                state = WRITE_END;
                break;
            }
            count = 0;
          } else {
            state = WRITE_RESOURCE_WRITE;
          }
          break;
        case WRITE_RESOURCE_WRITE:
          rdata = {};
          val = packet[section][count];
          state = writeResource(buff, val, label_index, rdata);
          break;
        case WRITE_RESOURCE_DONE:
          count += 1;
          state = writeResourceDone(buff, rdata);
          break;
        case WRITE_A:
        case WRITE_AAAA:
          state = writeIp(buff, val);
          break;
        case WRITE_NS:
        case WRITE_CNAME:
        case WRITE_PTR:
          state = writeCname(buff, val, label_index);
          break;
        case WRITE_SPF:
        case WRITE_TXT:
          state = writeTxt(buff, val);
          break;
        case WRITE_MX:
          state = writeMx(buff, val, label_index);
          break;
        case WRITE_SRV:
          state = writeSrv(buff, val, label_index);
          break;
        case WRITE_SOA:
          state = writeSoa(buff, val, label_index);
          break;
        case WRITE_OPT:
          state = writeOpt(buff, val);
          break;
        case WRITE_NAPTR:
          state = writeNaptr(buff, val, label_index);
          break;
        case WRITE_TLSA:
          state = writeTlsa(buff, val);
          break;
        case WRITE_END:
          return buff.tell();
        default:
          if (typeof val.data !== 'object')
            throw new Error('Packet.write Unknown State: ' + state);
          // write unhandled RR type
          buff.copy(val.data);
          state = WRITE_RESOURCE_DONE;
      }
    } catch (e) {
      if (e instanceof BufferCursorOverflow) {
        state = WRITE_TRUNCATE;
      } else {
        throw e;
      }
    }
  }
};

function parseHeader(msg, packet) {
  packet.header.id = msg.readUInt16BE();
  var val = msg.readUInt16BE();
  packet.header.qr = (val & 0x8000) >> 15;
  packet.header.opcode = (val & 0x7800) >> 11;
  packet.header.aa = (val & 0x400) >> 10;
  packet.header.tc = (val & 0x200) >> 9;
  packet.header.rd = (val & 0x100) >> 8;
  packet.header.ra = (val & 0x80) >> 7;
  packet.header.res1 = (val & 0x40) >> 6;
  packet.header.res2 = (val & 0x20) >> 5;
  packet.header.res3 = (val & 0x10) >> 4;
  packet.header.rcode = (val & 0xF);
  packet.question = new Array(msg.readUInt16BE());
  packet.answer = new Array(msg.readUInt16BE());
  packet.authority = new Array(msg.readUInt16BE());
  packet.additional = new Array(msg.readUInt16BE());
  return PARSE_QUESTION;
}

function parseQuestion(msg, packet) {
  var val = {};
  val.name = nameUnpack(msg);
  val.type = msg.readUInt16BE();
  val.class = msg.readUInt16BE();
  packet.question[0] = val;
  assert(packet.question.length === 1);
  // TODO handle qdcount > 1 in practice no one sends this
  return PARSE_RESOURCE_RECORD;
}

function parseRR(msg, val, rdata) {
  val.name = nameUnpack(msg);
  val.type = msg.readUInt16BE();
  val.class = msg.readUInt16BE();
  val.ttl = msg.readUInt32BE();
  rdata.len = msg.readUInt16BE();
  return val.type;
}

function parseA(val, msg) {
  var address = '' +
    msg.readUInt8() +
    '.' + msg.readUInt8() +
    '.' + msg.readUInt8() +
    '.' + msg.readUInt8();
  val.address = address;
  return PARSE_RESOURCE_DONE;
}

function parseAAAA(val, msg) {
  var address = '';
  var compressed = false;

  for (var i = 0; i < 8; i++) {
    if (i > 0) address += ':';
    // TODO zero compression
    address += msg.readUInt16BE().toString(16);
  }
  val.address = address;
  return PARSE_RESOURCE_DONE;
}

function parseCname(val, msg) {
  val.data = nameUnpack(msg);
  return PARSE_RESOURCE_DONE;
}

function parseTxt(val, msg, rdata) {
  val.data = [];
  var end = msg.tell() + rdata.len;
  while (msg.tell() != end) {
    var len = msg.readUInt8();
    val.data.push(msg.toString('utf8', len));
  }
  return PARSE_RESOURCE_DONE;
}

function parseMx(val, msg, rdata) {
  val.priority = msg.readUInt16BE();
  val.exchange = nameUnpack(msg);
  return PARSE_RESOURCE_DONE;
}

// TODO: SRV fixture failing for '_xmpp-server._tcp.gmail.com.srv.js'
//       https://tools.ietf.org/html/rfc2782
function parseSrv(val, msg) {
  val.priority = msg.readUInt16BE();
  val.weight = msg.readUInt16BE();
  val.port = msg.readUInt16BE();
  val.target = nameUnpack(msg);
  return PARSE_RESOURCE_DONE;
}

function parseSoa(val, msg) {
  val.primary = nameUnpack(msg);
  val.admin = nameUnpack(msg);
  val.serial = msg.readUInt32BE();
  val.refresh = msg.readInt32BE();
  val.retry = msg.readInt32BE();
  val.expiration = msg.readInt32BE();
  val.minimum = msg.readInt32BE();
  return PARSE_RESOURCE_DONE;
}

// http://tools.ietf.org/html/rfc3403#section-4.1
function parseNaptr(val, msg) {
  val.order = msg.readUInt16BE();
  val.preference = msg.readUInt16BE();
  var len = msg.readUInt8();
  val.flags = msg.toString('ascii', len);
  len = msg.readUInt8();
  val.service = msg.toString('ascii', len);
  len = msg.readUInt8();
  val.regexp = msg.toString('ascii', len);
  val.replacement = nameUnpack(msg);
  return PARSE_RESOURCE_DONE;
}

function parseTlsa(val, msg, rdata) {
  val.usage = msg.readUInt8();
  val.selector = msg.readUInt8();
  val.matchingtype = msg.readUInt8();
  val.buff = msg.slice(rdata.len - 3).buffer; // 3 because of the 3 UInt8s above.
  return PARSE_RESOURCE_DONE;
}

// https://tools.ietf.org/html/rfc6891#section-6.1.2
// https://tools.ietf.org/html/rfc2671#section-4.4
//       - [payload size selection](https://tools.ietf.org/html/rfc6891#section-6.2.5)
function parseOpt(val, msg, rdata, packet) {
  // assert first entry in additional
  rdata.buf = msg.slice(rdata.len);

  val.rcode = ((val.ttl & 0xFF000000) >> 20) + packet.header.rcode;
  val.version = (val.ttl >> 16) & 0xFF;
  val.do = (val.ttl >> 15) & 1;
  val.z = val.ttl & 0x7F;
  val.options = [];

  packet.edns = val;
  packet.edns_version = val.version; // TODO: return BADVERS for unsupported version! (Section 6.1.3)

  // !! BEGIN DEPRECATION NOTICE !!
  // THESE FIELDS MAY BE REMOVED IN THE FUTURE!
  packet.edns_options = val.options;
  packet.payload = val.class;
  // !! END DEPRECATION NOTICE !!

  while (!rdata.buf.eof()) {
    val.options.push({
      code: rdata.buf.readUInt16BE(),
      data: rdata.buf.slice(rdata.buf.readUInt16BE()).buffer
    });
  }
  return PARSE_RESOURCE_DONE;
}

var
  PARSE_HEADER          = 100000,
  PARSE_QUESTION        = 100001,
  PARSE_RESOURCE_RECORD = 100002,
  PARSE_RR_UNPACK       = 100003,
  PARSE_RESOURCE_DONE   = 100004,
  PARSE_END             = 100005,
  PARSE_A     = consts.NAME_TO_QTYPE.A,
  PARSE_NS    = consts.NAME_TO_QTYPE.NS,
  PARSE_CNAME = consts.NAME_TO_QTYPE.CNAME,
  PARSE_SOA   = consts.NAME_TO_QTYPE.SOA,
  PARSE_PTR   = consts.NAME_TO_QTYPE.PTR,
  PARSE_MX    = consts.NAME_TO_QTYPE.MX,
  PARSE_TXT   = consts.NAME_TO_QTYPE.TXT,
  PARSE_AAAA  = consts.NAME_TO_QTYPE.AAAA,
  PARSE_SRV   = consts.NAME_TO_QTYPE.SRV,
  PARSE_NAPTR = consts.NAME_TO_QTYPE.NAPTR,
  PARSE_OPT   = consts.NAME_TO_QTYPE.OPT,
  PARSE_SPF   = consts.NAME_TO_QTYPE.SPF,
  PARSE_TLSA  = consts.NAME_TO_QTYPE.TLSA;
  

Packet.parse = function(msg) {
  var state,
      pos,
      val,
      rdata,
      section,
      count;

  var packet = new Packet();

  pos = 0;
  state = PARSE_HEADER;

  msg = new BufferCursor(msg);

  while (true) {
    switch (state) {
      case PARSE_HEADER:
        state = parseHeader(msg, packet);
        break;
      case PARSE_QUESTION:
        state = parseQuestion(msg, packet);
        section = 'answer';
        count = 0;
        break;
      case PARSE_RESOURCE_RECORD:
        // console.log('PARSE_RESOURCE_RECORD: count = %d, %s.len = %d', count, section, packet[section].length);
        if (count === packet[section].length) {
          switch (section) {
            case 'answer':
              section = 'authority';
              count = 0;
              break;
            case 'authority':
              section = 'additional';
              count = 0;
              break;
            case 'additional':
              state = PARSE_END;
              break;
          }
        } else {
          state = PARSE_RR_UNPACK;
        }
        break;
      case PARSE_RR_UNPACK:
        val = {};
        rdata = {};
        state = parseRR(msg, val, rdata);
        break;
      case PARSE_RESOURCE_DONE:
        packet[section][count++] = val;
        state = PARSE_RESOURCE_RECORD;
        break;
      case PARSE_A:
        state = parseA(val, msg);
        break;
      case PARSE_AAAA:
        state = parseAAAA(val, msg);
        break;
      case PARSE_NS:
      case PARSE_CNAME:
      case PARSE_PTR:
        state = parseCname(val, msg);
        break;
      case PARSE_SPF:
      case PARSE_TXT:
        state = parseTxt(val, msg, rdata);
        break;
      case PARSE_MX:
        state = parseMx(val, msg);
        break;
      case PARSE_SRV:
        state = parseSrv(val, msg);
        break;
      case PARSE_SOA:
        state = parseSoa(val, msg);
        break;
      case PARSE_OPT:
        state = parseOpt(val, msg, rdata, packet);
        break;
      case PARSE_NAPTR:
        state = parseNaptr(val, msg);
        break;
      case PARSE_TLSA:
        state = parseTlsa(val, msg, rdata);
        break;
      case PARSE_END:
        return packet;
      default:
        //console.log(state, val);
        val.data = msg.slice(rdata.len);
        state = PARSE_RESOURCE_DONE;
        break;
    }
  }
};

},{"./consts":14,"assert":undefined,"buffercursor":16,"ipaddr.js":8,"util":undefined}]},{},[1])(1)
});