//MODULE DEPENDENCIES

var events = require('events');
var util = require('util');
var stream = require('stream');
var EventEmitter = require('events').EventEmitter;

//OBJECTIVE-C PUBLIC METHODS

/**
 * An Browser Http Server
 *
 * @class BrowserServer
 *
 * @constructor
 * @public
 */
function BrowserServer(){};

exports.createServer = function(requestListener) {
    var server = new BrowserServer();
    private_BrowserEventHost.addListener('request', requestListener);
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


/**
 * Javascript function exposed to Swift/Objective-C called once per request to create the intial http context.
 * Does nothing than create an empty Object, but is written in Javascript to keep primary source of data here,
 * and to use a constructor specific to NodeKit (vs a generic object).  This allows applications to update
 * the prototype object if necessary
 *
 * Public to allow visibility from Swift/Objective-C.  Not intended for use outside of NodeKit.
 *
 * @function createEmptyContext
 *
 * @param context - the base http context dictionary
 * @returns (httpContext) - the Http Context object
 * @public
 */
exports.createEmptyContext = function() {
    try{
        var context = Object.create(function HttpContext() {});
        context.socket = new EventEmitter();
        context.req = new IncomingMessage(context.socket);
        context.res = new OutgoingMessage(context.socket);
        return context;
    }
    catch (e)
    {
        io.nodekit.console.error(e, "createEmptyContext in _nodekit_invoke");
    }
}

/**
 * Javascript function exposed to Swift/Objective-C called to cancel an Http Context
  *
 * @function cancelContext
 *
 * @param owinContext - the base Http context dictionary
 * @returns (void)
 * @public
 */
exports.cancelContext = function(httpContext) {
    try{
        
        httpContext.socket.emit("close");
    }
    catch (e)
    {
        io.nodekit.console.error(e, "cancelContext in _nodekit_invoke");
    }
}

/**
 * Javascript function exposed to Swift/Objective-C called once per request.
 * Adds a few basic properties, invokes the Application NodeFunc/AppFunc by emitting the request event,
 * waits for a return response callback, processes and passes back to Swift/Objective-C on the callback
 *
 * Public to allow visibility from Swift/Objective-C.  Not intended for use outside of nodeAppFunc.
 *
 * @function invokeContext
 *
 * @param httpContext - the base Http context dictionary
 * @param callBack - the Objective-C block callback
 * @public
 */
exports.invokeContext = function invokeContext(httpContext, callBack) {
    
    try{
   
        httpContext.res.on('finish', function() {
                                  var data = httpContext.res.getBody();
                                  httpContext["_chunk"] = data;
                                  httpContext.res.headers["Access-Control-Allow-Origin"] = "*";
                                  callBack();
                                  
                                  for (var _key in httpContext) {
                                  if (httpContext.hasOwnProperty(_key))
                                  delete httpContext[_key];
                                  };
                                  //   contextFactory.free(context);
                                  httpContext = null;
                                  data = null;

                                  });
        
        private_BrowserEventHost.emit("request", httpContext.req, httpContext.res);
        
    }  catch (e)
    {
       io.nodekit.console.error(e, "invokeContext in _nodekit_invoke");
    }
};

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
    Writable.call(this, {decodeStrings: false});
    this.bodyChunks = [];
  }

var Writable = stream.Writable;
util.inherits(ResponseStreamString, Writable);

ResponseStreamString.prototype._write = function ResponseStreamStringWrite(chunk, enc, next) {
    this.bodyChunks.push(chunk);
    next();
};

ResponseStreamString.prototype.getBody = function ResponseStreamGetBody() {
    return this.bodyChunks.join('');
};

/**
 * Represents an Http Incoming Request Message
 *
 * @class IncomingMessage
 * @constructor
 */
function IncomingMessage(socket) {
    RequestStream.call(this);
    this.socket = socket;
    this.connection = socket;
    this.httpVersion = null;
    this.complete = false;
    this.headers = {};
    this.readable = true;
    this.url = '';
    this.method = null;
    
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



