var util = require('util');
var Stream = require('stream');
var Writable = Stream.Writable;
var Readable = Stream.Readable;
var EventEmitter = require('events').EventEmitter;

var owinConnect = require('./owinConnect.js');
var owinContextHelpers = require('./owinContextHelpers.js');
var const_Instance = require('./guid.js').guid();
var constants = require('./owinConstants.js');

/**
 * Run Once Self Initiating Function
 *
 * @method init
 * @returns (void)
 * @private
 */
(function  init() {
 var _temp_context = new OwinDefaultContext();   // use for adding properties
 owinContextHelpers.refreshPrototype(_temp_context, "owin.Request", OwinRequest.prototype)
 owinContextHelpers.refreshPrototype(_temp_context, "owin.Response", OwinResponse.prototype)
 owinContextHelpers.refreshPrototype(_temp_context, "owin.", OwinOwin.prototype)
 owinContextHelpers.refreshPrototype(_temp_context, "server.", OwinServer.prototype)
 owinContextHelpers.refreshPrototype(_temp_context, "owinjs.", OwinNodeKit.prototype)
 
 owinContextHelpers.cloneBodyPrototypeAlias(OwinResponse.prototype,EventEmitter.prototype, "owin.ResponseBody");
 owinContextHelpers.cloneBodyPrototypeAlias(OwinResponse.prototype,Stream.prototype, "owin.ResponseBody");
 owinContextHelpers.cloneBodyPrototypeAlias(OwinResponse.prototype,Writable.prototype, "owin.ResponseBody");
 
 owinContextHelpers.cloneBodyPrototypeAlias(OwinRequest.prototype,EventEmitter.prototype, "owin.RequestBody");
 owinContextHelpers.cloneBodyPrototypeAlias(OwinRequest.prototype,Stream.prototype, "owin.RequestBody");
 owinContextHelpers.cloneBodyPrototypeAlias(OwinRequest.prototype,Readable.prototype, "owin.RequestBody");
 
 _temp_context = null;
 }).call(this);


// PUBLIC EXPORTS
exports.createContext = function() {
 return new OwinDefaultContext();
 }

/**
 * Expands owin context object with various helper methods;  called for every request context passing through OWIN/JS
 *
 * @method private_refreshPrototype
 * @param propertyList (object)  a representative OWIN context with all desired properties set (to null, default or value)
 * @param owinPrefix (string)  the Owin  prefix to search for (e.g., "owin.Request")
 * @param owinObject (object)  the javascript object on which to add the prototypes (e.g., context.Request)
 * @returns (void)
 * @private
 */
exports.expandContext = expandContext;

function expandContext(context, addReqRes) {
    var isOwinJsNative = true;
    
    if (context.req)
        isOwinJsNative = false;
    
    context.request = new OwinRequest(context);
    context.response = new OwinResponse(context);
    context.owin = new OwinOwin(context);
    context.server = new OwinServer(context);
    context.nodeKit = new OwinNodeKit(context);
    
    if (context[constants.owinjs.id] != const_Instance)
    {
        console.log("OwinJS/owinjs started; instance=" + const_Instance);
        
        // add default aliases to owinContext if needed;  not currently in default OWIN/JS spec
        // owinContextHelpers.refreshPrototypeOwinContext(context);
        
        Object.defineProperty(context.constructor.prototype, constants.owinjs.id, {value : const_Instance,
                              writable : false, enumerable : true, configurable : false});
        
        context.constructor.prototype.toString = function()
        {
            return util.inspect(this).replace(/\n/g,"\r");
        }
        
        if (isOwinJsNative)
            initOwinNativeContextPrototype(context.constructor.prototype);
    }
    
    if (isOwinJsNative)
        owinConnect.addReqRes(context);
};

/**
 * Represents an OWIN/JS request Object.
 *
 * Properties are generated dynamically from all the owin context elements starting with "owin.Request"
 *
 * @class OwinRequest
 * @constructor
 */
function OwinRequest(owin){ this.context = owin;};

/**
 * Represents an OWIN/JS response Object.
 *
 * Properties are generated dynamically from all the owin context elements starting with "owin.Request"
 *
 * @class owinResponse
 * @constructor
 */

function OwinResponse(owin){  this.context = owin;  };

/**
 * Representss an OWIN/JS owin Object
 *
 * @class OwinOwin
 * @constructor
 */
function OwinOwin(owin){ this.context = owin;  };


/**
 * Representss an OWIN/JS server Object
 *
 * @class OwinServer
 * @constructor
 */
function OwinServer(owin){ this.context = owin;  };

/**
 * Represents an OWIN/JS nodeKit Object
 *
 * @class OwinNodeKit
 * @constructor
 */
function OwinNodeKit(owin){ this.context = owin;  };


/**
 * Run Once Self Initiating Function to create prototype methods on OwinRequest, OwinResponse, OwinServer etc.
 *
 * @method init
 * @returns (void)
 * @private
 */
(function initPrototypes(){
 Object.defineProperty(OwinRequest.prototype, "host", {   get: function () {
                       return this.context[constants.owinjs.getRequestHeader]("host");
                       }});
 
 Object.defineProperty(OwinRequest.prototype, "originalUrl", {   get: function () {
                       var owin = this.context;
                       var uri =
                       owin["owin.RequestScheme"] +
                       "://" +
                       owin.host +
                       owin["owin.RequestPathBase"] +
                       owin["owin.RequestPath"];
                       
                       if (owin["owin.RequestQueryString"] != "")
                       uri += "?" + owin["owin.RequestQueryString"];
                       
                       return uri;
                       }});
 
 OwinResponse.prototype.writeHead= function(){this.context[constants.owinjs.writeHead].apply(this.context, Array.prototype.slice.call(arguments));};
 OwinResponse.prototype.getHeader= function(){this.context[constants.owinjs.getResponseHeader].apply(this.context, Array.prototype.slice.call(arguments));};
 OwinResponse.prototype.removeHeader = function(){this.context[constants.owinjs.removeResponseHeader].apply(this.context, Array.prototype.slice.call(arguments));};
 OwinResponse.prototype.setHeader = function(){this.context[constants.owinjs.setResponseHeader].apply(this.context, Array.prototype.slice.call(arguments));};
 OwinRequest.prototype.getHeader = function(){this.context[constants.owinjs.getRequestHeader].apply(this.context, Array.prototype.slice.call(arguments));};

 
 }).call(this);


function initOwinNativeContextPrototype(contextPrototype){
    
    contextPrototype[constants.owinjs.writeHead] = function OwinResponseWriteHead(statusCode, headers)
    {
        this["owin.ResponseStatusCode"] = statusCode;
        
        var keys = Object.keys(headers);
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (k)
            {
                this[constants.owinjs.setResponseHeader].call(this, k, headers[k]);
            }
        }
    };
    
    contextPrototype[constants.owinjs.setResponseHeader] = function OwinResponseSetHeader(key, val)
    {
        private_setIgnoreCase(this["owin.ResponseHeaders"], key, val);
    }
    
    contextPrototype[constants.owinjs.getResponseHeader] = function OwinResponseGetHeader(key)
    {
        return private_getIgnoreCase(this["owin.ResponseHeaders"], key);
    }
    
    contextPrototype[constants.owinjs.removeResponseHeader] = function OwinResponseRemoveHeader(key, value)
    {
          return private_deleteIgnoreCase(this["owin.ResponseHeaders"], key);
    }
    
    contextPrototype[constants.owinjs.getRequestHeader] = function OwinResponseGetHeader(key)
    {
        return private_getIgnoreCase(this["owin.RequestHeaders"], key);
     }
}

/**
 * Creates a new OWIN/JS Context Object with all empty or default fields
 *
 * @class OwinDefaultContext
 * @constructor
 */
function OwinDefaultContext() {
    this["owin.RequestHeaders"] = {};
    this["owin.RequestMethod"] = "";
    this["owin.RequestPath"] = "";
    this["owin.RequestPathBase"] = "";
    this["owin.RequestProtocol"] = "";
    this["owin.RequestQueryString"] ="";
    this["owin.RequestScheme"] = "";
    this["owin.RequestBody"] = {};
    
    this["owin.ResponseHeaders"] = {};
    this["owin.ResponseStatusCode"] = null;
    this["owin.ResponseReasonPhrase"] = "";
    this["owin.ResponseProtocol"] = "";
    this["owin.ResponseBody"] = {};
    this["owin.ResponseHeaders"]["Content-Length"]= "-1";
    
    this[constants.commonkeys.AppId] = "";
    this[constants.commonkeys.CallCancelledSoure] = {};
    this["owin.Version"] = "";
    this["owin.callCancelled"] = {};
};

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

exports.shrinkContext = function(context) {
    delete context.request.context;
    delete context.response.context;
    delete context.owin.context ;
    delete context.server.context ;
    delete context.nodeKit.context ;
    delete context.req.context;
    delete context.res.context;
    
    delete context.request;
    delete context.response;
    delete context.owin ;
    delete context.server ;
    delete context.nodeKit ;
    delete context.req;
    delete context.res;
    }

