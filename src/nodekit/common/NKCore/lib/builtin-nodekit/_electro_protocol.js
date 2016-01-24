/*
 * nodekit.io
 *
 * Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
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

//MODULE DEPENDENCIES

var events = require('events');
var util = require('util');
var stream = require('stream');
var http = require('http');
var EventEmitter = require('events').EventEmitter;
var protocol = io.nodekit.protocol

/**
 * An Browser Http Server
 *
 * @class BrowserServer
 *
 * @constructor
 * @public
 */
function BrowserServer(scheme){
    EventEmitter.call(this)
    this.scheme = scheme.toLowerCase();
    protocol.registerCustomProtocol(scheme, this.invoke);
    
};

util.inherits(BrowserServer, EventEmitter);

BrowserServer.prototype.listen = function(port, host) {
    private_BrowserEventHost.addListener('request', this.requestListener);
    if (!!port)
    {
        var that = this
        var httpServer = http.createServer(function(req, res){that.emit('request', req, res););
        httpServer.listen(port, host);
    }
};

BrowserServer.prototype.invoke = function(request) {
    var id = request["id"];
    
    var context = Object.create(function HttpContext() {});
    context.socket = new EventEmitter();
    var req = new IncomingMessage(context.socket);
    context.req = req;
    context.res = new OutgoingMessage(context.socket);;
    
    req.method = request["method"] || 'GET'
    req.url = request["url"]
    req.headers = request["headers"] || []
    req.headers["Content-Length"] = request["length"]
    
    if (req.method == 'POST')
    {
        req.body.setData(request["body"])
        req.headers["Content-Length"] = request["length"]
    }
    
    context.res.on('finish', function() {
                   var res = context.res;
                   var data = res.getBody();
                   res.headers["access-control-allow-origin"] = "*";
                   this.callbackEnd(id, {'data': data, 'headers': res.headers, 'statusCode': res.statusCode } )
                   
                   for (var _key in context) {
                   if (context.hasOwnProperty(_key))
                   delete context[_key];
                   };
                   context = null;
                   data = null;
                   res=null;
                   
                   });
    try {
        this.emit("request", context.req, context.res);
        
    }  catch (e)
    {
        console.error(e);
    }
    
}

exports.createServer = function(scheme, requestListener) {
    var server = new BrowserServer(scheme);
    if (requestListener)
        server.on('request', requestListener);
    return server;
};

/**
 * The shared Event Host used for communication between Swift/Objective-C and all Server Applications on this Server
 *
 * Inherits from Node EventEmitter
 *
 * @class BrowserEventHost, shared instance private_BrowserEventHost
 *
 * @constructor
 * @private
 */
function BrowserEventHost(){};
util.inherits(BrowserEventHost, events.EventEmitter);

var private_BrowserEventHost = new BrowserEventHost();

// INTERNAL CLASSES

/**
 * Represents a Node Reabable Stream
 *
 * @class RequestStream
 * @constructor
 */
function RequestStream()
{
    this.data = "";
}

var Readable = stream.Readable;
util.inherits(RequestStream, Readable);

RequestStream.prototype.setData = function RequestStreamSetData(str)
{
    Readable.call(this, { highWaterMark: str.length});
    this.data = str;
};

RequestStream.prototype._read = function RequestStreamRead(size) {
    this.push(this.data);
    this.push(null);
};


/**
 * Represnets a Node Writeable Stream
 *
 * @class ResponseStream
 * @constructor
 */

/*
 function ResponseStream(httpContext) {
 Writable.call(this, {decodeStrings: false});
 this.httpContext = httpContext;
 this.headersSent = false;
 }
 
 exports.createResponseStream = function(httpContext) {
 httpContext["response.body"] = new ResponseStream(context);
 };
 
 
 var Writable = stream.Writable;
 util.inherits(ResponseStream, Writable);
 
 ResponseStream.prototype._write = function responseStreamWrite(chunk, enc, next){
 if (!this.headersSent)
 {
 this.headersSent = true;
 // Call On Sending Headers
 var listeners = this.httpContext["io.nodekit.OnSendingHeaderListeners"];
 for (var i = 0; i <  listeners.length; i++) {
 listeners.callback(listeners.state);
 }
 listeners = null;
 }
 
 this.httpContext["_chunk"] = chunk;
 if (util.isBuffer(chunk))
 {
 this._writeBuffer();
 }
 else
 this._writeString();
 this.httpContext["_chunk"] = null;
 next();
 };
 */

/**
 * Represents a Node Writeable Stream
 *
 * @class ResponseStreamString
 * @constructor
 */
function ResponseStreamString() {
    Writable.call(this, {decodeStrings: true});
    this.bodyChunks = [];
}

var Writable = stream.Writable;
util.inherits(ResponseStreamString, Writable);

ResponseStreamString.prototype._write = function ResponseStreamStringWrite(chunk, enc, next) {
    this.bodyChunks.push(chunk);
    next();
};

ResponseStreamString.prototype.getBody = function ResponseStreamGetBody() {
    return Buffer.concat(this.bodyChunks).toString('base64');
};



/**
 * Represents an Http Incoming Request Message
 *
 * @class IncomingMessage
 * @constructor
 */
function IncomingMessage(socket) {
    this.socket = socket;
    this.connection = socket;
    this.httpVersion = null;
    this.complete = false;
    this.headers = {};
    this.readable = true;
    this.url = '';
    this.method = null;
    this.body = new RequestStream()
    
    
    this.httpVersionMajor =  1;
    this.httpVersionMinor = 1;
    this.httpVersion =   this.httpVersionMajor + "." + this.httpVersionMinor;
}

Object.defineProperty(IncomingMessage.prototype, "rawHeaders", {
                      get: function () {
                      var ret = [];
                      for(var key in this.headers){
                      ret.push(key);
                      ret.push(this.headers);
                      };
                      return ret;
                      }
                      });

Object.defineProperty(IncomingMessage.prototype, "trailers", {
                      get: function () {  return {};   }
                      });

Object.defineProperty(IncomingMessage.prototype, "rawTrailers", {
                      get: function () {  return []; }
                      });

IncomingMessage.prototype.getHeader = function HttpBrowserRequestGetHeader(key)
{
    return private_getIgnoreCase(this.headers, key);
}

IncomingMessage.prototype.destroy = function(error) {
}

/**
 * Represents an Http Outgoing Response Message
 *
 * @class OutgoingMessage
 * @constructor
 */
function OutgoingMessage(socket) {
    ResponseStreamString.call(this);
    this.socket = socket;
    this.connection = socket;
    this.writable = true;
    this.chunkedEncoding = false;
    this.shouldKeepAlive = true;
    this.useChunkedEncodingByDefault = true;
    this.sendDate = true;
    this.finished = false;
    this.headers = {};
}

util.inherits(OutgoingMessage, ResponseStreamString);

OutgoingMessage.prototype.status =  function (code) { this.statusCode = code; return this;};

OutgoingMessage.prototype.writeContinue = function writeContinue(statusCode, headers)
{
    throw {name : "NotImplementedError", message : "writeContinue HTTP 100 not implemented;  instead server must implement"};
};

OutgoingMessage.prototype.setTimeout = function setTimeout(msecs, callback)
{
    throw {name : "NotImplementedError", message : "set Timeout not implemented as no sockets needed"};
};

OutgoingMessage.prototype.addTrailers = function addTrailers(trailers)
{
    throw {name : "NotImplementedError", message : "HTTP Trailers (trailing headers) not supported"};
};

OutgoingMessage.prototype.writeHead = function HttpBrowserResponseWriteHead(statusCode, headers)
{
    this.statusCode = statusCode;
    
    var keys = Object.keys(headers);
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k)
        {
            this.setHeader.call(this, k, headers[k]);
        }
    }
};

OutgoingMessage.prototype.setHeader = function HttpBrowserResponseSetHeader(key, val)
{
    private_setIgnoreCase(this.headers, key, val);
};

OutgoingMessage.prototype.getHeader = function HttpBrowserResponseGetHeader(key)
{
    return private_getIgnoreCase(this.headers, key);
};

OutgoingMessage.prototype.removeHeader = function HttpBrowserResponseRemoveHeader(key, value)
{
    return private_deleteIgnoreCase(this.headers, key);
};

OutgoingMessage.prototype.statusCode = 200;
OutgoingMessage.prototype.statusMessage = undefined;

//PRIVATE METHODS


/**
 * Adds or updates a javascript object, case insensitive for key property
 *
 * @method private_setIgnoreCase
 * @param obj (object)  the object to search
 * @param key (string) the new or existing property name
 * @param val (string) the new property value
 * @private
 */
function private_setIgnoreCase(obj, key, val)
{
    key = key.toLowerCase();
    for(var p in obj){
        if(obj.hasOwnProperty(p) && key == p.toLowerCase()){
            obj[p] = val;
            return;
        }
    }
    obj[key] = val;
}

/**
 * Returns a javascript object, case insensitive for key property
 *
 * @method private_setIgnoreCase
 * @param obj (object)  the object to search
 * @param key (string) the new or existing property name
 * @param val (string) the new property value
 * @private
 */
function private_getIgnoreCase(obj, key)
{
    key = key.toLowerCase();
    for(var p in obj){
        if(obj.hasOwnProperty(p) && key == p.toLowerCase()){
            return obj[p];
        }
    }
    return null;
}

/**
 * Returns a javascript object, case insensitive for key property
 *
 * @method private_setIgnoreCase
 * @param obj (object)  the object to search
 * @param key (string) the new or existing property name
 * @return (bool) true if successful, false if not
 * @private
 */
function private_deleteIgnoreCase(obj, key)
{
    key = key.toLowerCase();
    for(var p in obj){
        if(obj.hasOwnProperty(p) && key == p.toLowerCase()){
            delete obj[p];
            return true;
        }
    }
    return false;
}



