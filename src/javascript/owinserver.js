//MODULE DEPENDENCIES

var events = require('events');
var util = require('util');
var cancellationTokenSource = require('cancellation');
var stream = require('stream');
var Freelist = require('freelist').FreeList;
var contextFactory = new Freelist('context', 5, function() {
                         return Object.create(function OwinContext() {});
                           });

//CLASS OBJECTS

/**
 * An Owin Server
 *
 * @class OwinServer
 *
 * @constructor
 * @public
 */
function OwinServer(){};


/**
 * The shared Event Host used for communication between Objective-C and all Server Applications on this Server
 *
 * Inherits from Node EventEmitter
 *
 * @class OwinEventHost, shared instance private_OwinEventHost
 *
 * @constructor
 * @private
 */
function OwinEventHost(){};
util.inherits(OwinEventHost, events.EventEmitter);

var private_OwinEventHost = new OwinEventHost();

//JAVASCRIPT PUBLIC METHODS

/**
 * Javascript function not exposed to Objective-C to create an Owin Server hook.
 * Translates an appFunc into a nodeFunc to make it easier to call using Node EventEmitter
 *
 * @function createEmptyContext
 *
 * @param appFunc - An OWIN/JS (promise) function(owin)
 * @param appId (optional) - a unique Id for the app
 * @returns (OwinServer) - the Owin Server Object
 * @public
 */
exports.createOwinServer = function createOwinServer(appFunc, appId) {
    if (!appId)
        appId = "default";
    
    var server = new OwinServer();
    var nodeFunc = function(owin, callback) {
        var promise = appFunc.call(owin, owin);
        if ((promise) && (typeof promise.then !== "undefined")) {promise.then( function(value){callback(null, value);},function(err){callback(err);} );}
        else {callback(null, promise);}
    };
    private_OwinEventHost.addListener('request-'+appId, nodeFunc);
    return server;
}

//OBJECTIVE-C PUBLIC METHODS


/**
 * Javascript function exposed to Objective-C called once per request to create the intial OWIN context.
 * Does nothing than create an empty Object, but is written in Javascript to keep primary source of data here,
 * and to use a constructor specific to OWIN/JS (vs a generic object).  This allows applications to update 
 * the prototype object if necessary
 *
 * Public to allow visibility from Objective-C.  Not intended for use outside of nodeAppFunc.
 *
 * @function createEmptyContext
 *
 * @param context - the base owin context dictionary
 * @returns (OwinContext) - the Owin Context object
 * @public
 */
exports.createEmptyContext = function() {
    return Object.create(function OwinContext() {});
     // return contextFactory.alloc();
}

/**
 * Javascript function exposed to Objective-C called once per request to create the intial OWIN context.
 * Does nothing than create an empty Object, but is written in Javascript to keep primary source of data here,
 * and to use a constructor specific to OWIN/JS (vs a generic object).  This allows applications to update
 * the prototype object if necessary
 *
 * Public to allow visibility from Objective-C.  Not intended for use outside of nodeAppFunc.
 *
 * @function createEmptyContext
 *
 * @param context - the base owin context dictionary
 * @returns (OwinContext) - the Owin Context object
 * @public
 */
exports.cancelContext = function(context) {
    context["nodeAppKit.callCancelledSource"].cancel("cancelled by browser");
}

/**
 * Javascript function exposed to Objective-C called once per request.
 * Adds a few basic properties, invokes the Application NodeFunc/AppFunc by emitting the request event,
 * waits for a return response callback, processes and passes back to Objective-C on the callback
 * 
 * Public to allow visibility from Objective-C.  Not intended for use outside of nodeAppFunc.
 *
 * @function invokeContext
 *
 * @param context - the base owin context dictionary
 * @param callBack - the Objective-C block callback
 * @public
 */
exports.invokeContext = function invokeContext(context, callBack) {
    private_addDefaultFields(context);
    
    context["nodeAppKit.OnSendingHeaderListeners"] = [];
    
    context["server.OnSendingHeaders"] = function OnSendingHeaders(callback, state) {
        this["nodeAppKit.OnSendingHeaderListeners"].push({callback: callback, state: state});
    }
    
    private_OwinEventHost.emit('request-'+context["server.appId"], context, function invokeContextCallback(err, value)
                               {
                               
                               // Call On Sending Headers
                               var listeners = context["nodeAppKit.OnSendingHeaderListeners"];
                               for (var i = 0; i <  listeners.length; i++) {
                               listeners.callback(listeners.state);
                               }
                               listeners = null;
                               
                               
                               // TODO : SAVE RESPONSE COOKIES TO CACHE
                               
                               // Add to Headers
                               context["owin.ResponseHeaders"]["Access-Control-Allow-Origin"]= "*";
                      //         context["owin.ResponseBody"] = context["owin.ResponseBody"].getBody();
                    
                               callBack(err, value);
                               
                               for (var _key in context) {
                               if (context.hasOwnProperty(_key))
                                  delete context[_key];
                               };
                               contextFactory.free(context);
                               context = null;
                               });
    
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
function ResponseStream(context) {
    Writable.call(this, {decodeStrings: false});
    this.context = context;
    this.headersSent = false;
    
 }

exports.createResponseStream = function(context) {
    context["owin.ResponseBody"] = new ResponseStream(context);
};

var Writable = stream.Writable;
util.inherits(ResponseStream, Writable);

ResponseStream.prototype._write = function responseStreamWrite(chunk, enc, next){
    if (!this.headersSent)
    {
        this.headersSent = true;
        // Call On Sending Headers
        var listeners = this.context["nodeAppKit.OnSendingHeaderListeners"];
        for (var i = 0; i <  listeners.length; i++) {
            listeners.callback(listeners.state);
        }
        listeners = null;
    }
    
    this.context["owin._ResponseBodyChunk"] = chunk;
    if (util.isBuffer(chunk))
    {
        this._writeBuffer();
    }
    else
        this._writeString();
    this.context["owin._ResponseBodyChunk"] = null;
    next();
};

/**
* Represnets a Node Writeable Stream
*
* @class ResponseStreamString
* @constructor
*/
function ResponseStreamString() {
    Writable.call(this, {decodeStrings: false});
    this.bodyChunks = []
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

//PRIVATE METHODS

/**
 * Add response and other default fields the base OWIN context supplied by the Objective-C server
 *
 * @function private_addDefaultFields
 * @param context - the base owin context dictionary
 * @private
 */
function private_addDefaultFields(context) {
     var tokenSource = new cancellationTokenSource();
    
    context["owin.RequestBody"] = new RequestStream();
    context["owin.ResponseHeaders"] = {};
    context["owin.ResponseStatusCode"] = null;
    context["owin.ResponseReasonPhrase"] = "";
    context["owin.ResponseProtocol"] = "HTTP/1.1";
    context["owin.ResponseHeaders"]["Content-Length"]= "-1";
   // context["owin.ResponseBody"] = new ResponseStreamString();
    
    // common Keys and other owin properties
    context["nodeAppKit.callCancelledSource"] =  tokenSource;
    context["owin.Version"] = "1.0";
    context["owin.callCancelled"] = tokenSource.token;
    
    if (context["owin.RequestScheme"] == "debug")
        context["server.appId"] = "debug";
    else
        context["server.appId"] = "default";
}

