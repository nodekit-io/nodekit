var path = require('path');
var url = require('url');
var owinContextHelpers = require('./owinContextHelpers.js');

// PUBLIC EXPORTS

/**
 * Expands owin context object with various helper methods
 *
 * @method addReqRes
 *
 * @param context (object)  the javascript object on which to add the prototypes (i.e., the OWIN/JS context)
 * @returns (void)
 * @public
 */
exports.addReqRes = function addReqRes(context) {
    context.req = new OwinHttpServerRequestBridge(context);
    context.res = new OwinHttpServerResponseBridge(context);
 };

/**
 * Representss an OWIN/JS bridge to Node.js http ServerRequest Object
 *
 * @class OwinHttpServerRequestBridge
 * @constructor
 */
function OwinHttpServerRequestBridge(owin){ this.context = owin;  };

/**
 * Representss an OWIN/JS bridge to Node.js http ServerResponse Object
 *
 * @class OwinHttpServerResponseBridge
 * @constructor
 */
function OwinHttpServerResponseBridge(owin){ this.context = owin;  };

/**
 * Self initiating method to create the prototype properties on the bridges to match http ServerRequest and ServerResponse objects
 *
 * @method init_InstallRequestResponsePrototypes
 * @private
 */
(function init_InstallRequestResponsePrototypes()
 {
 
 //REQUEST
 var req= OwinHttpServerRequestBridge;
 
 Object.defineProperty(req.prototype, "socket", { get: function () {  return {}  } });
 Object.defineProperty(req.prototype, "connection", { get: function () {  return {}  } });
 
 Object.defineProperty(req.prototype, "httpVersion", {
                       get: function () { return  this.context["owin.RequestProtocol"].split("/")[1];
                       },
                       set: function (val) { throw ("not implemented");    }
                       });
 
 Object.defineProperty(req.prototype, "httpVersionMajor", {
                       get: function () { return this.context["owin.RequestProtocol"].split("/")[1].split(".")[0];
                       },
                       set: function (val) { throw ("not implemented");    }
                       });
 
 Object.defineProperty(req.prototype, "httpVersionMinor", {
                       get: function () { return this.context["owin.RequestProtocol"].split("/")[1].split(".")[1];
                       },
                       set: function (val) { throw ("not implemented");    }
                       });
 
 Object.defineProperty(req.prototype, "originalUrl", {
                       get: function () {
                       if (!this._originalurl)
                       this._originalUrl = this.url;
                       return this._originalurl;
                       }
                       });
 
 Object.defineProperty(req.prototype, "url", {
                       get: function () {
                       var uri =
                       this.context["owin.RequestPath"];
                       
                       if (this.context["owin.RequestQueryString"] != "")
                       uri += "?" + this.context["owin.RequestQueryString"];
                       return uri;
                       
                       }, set: function (val) {
                       if (!this._originalurl)
                       this._originalUrl = this.url;
                       var urlParsed = url.parse(val);
                       this.context["owin.RequestPathBase"] = "";
                       this.context["owin.RequestPath"] = urlParsed.pathName;
                       this.context["owin.RequestQueryString"] = urlParsed.query;
                       }
                       });
 
 Object.defineProperty(req.prototype, "complete", {
                       get: function () {  return false;   }
                       });
 
 Object.defineProperty(req.prototype, "headers", {
                       get: function () {  return this.context["owin.RequestHeaders"];   }
                       });
 
 Object.defineProperty(req.prototype, "rawHeaders", {
                       get: function () {
                       var ret = [];
                       for(var key in this.context["owin.RequestHeaders"]){
                       ret.push(key);
                       ret.push(this.context["owin.RequestHeaders"]);
                       };
                       return ret;
                       }
                       });
 
 Object.defineProperty(req.prototype, "trailers", {
                       get: function () {  return {};   }
                       });
 
 Object.defineProperty(req.prototype, "rawTrailers", {
                       get: function () {  return []; }
                       });
 
 
 Object.defineProperty(req.prototype, "readable", {
                       get: function () {  return true ; }
                       });
 
 
 Object.defineProperty(req.prototype, "method", {
                       get: function () {  return this.context["owin.RequestMethod"];   },
                       set: function (val) {  this.context["owin.RequestMethod"] = val;    }
                       });
 
 req.prototype.getHeader = function(key)
 {
 return this.context.request.getHeader(key);
 }

 
 
 //RESPONSE
  var res= OwinHttpServerResponseBridge;
 
 Object.defineProperty(res.prototype, "socket", { get: function () {  return {}  } });
 Object.defineProperty(res.prototype, "connection", { get: function () {  return {}  } });
 
 Object.defineProperty(res.prototype, "statusCode", {
                       get: function () { return this.context["owin.ResponseStatusCode"];  },
                       set: function (val) { return this.context["owin.ResponseStatusCode"] = val;  },
                       });
 
 Object.defineProperty(res.prototype, "headersSent", {
                       get: function () { return  false;  }
                       });
 
 Object.defineProperty(res.prototype, "sendDate", {
                       get: function () { return true; },
                       set: function (val) { /* ignore */  },
                       });
 
 
 res.prototype.status =  function (code) { this.context["owin.ResponseStatusCode"] = code; return this;}
 
 
 res.prototype.writeContinue = function writeContinue(statusCode, headers)
 {
 throw {name : "NotImplementedError", message : "writeContinue HTTP 100 not implemented per OWIN/JS spec;  instead server must implement"};
 }
 
 res.prototype.setTimeout = function setTimeout(msecs, callback)
 {
 throw {name : "NotImplementedError", message : "set Timeout not implemented as no sockets needed in OWIN/JS"};
 }
 
 res.prototype.addTrailers = function addTrailers(trailers)
 {
 throw {name : "NotImplementedError", message : "HTTP Trailers (trailing headers) not supported"};
 }
 
 res.prototype.setHeader = function(key, value)
 {
 this.context.response.setHeader(key, value);
 }
 
 res.prototype.getHeader = function(key)
 {
 return this.context.response.getHeader(key);
 }
 
 res.prototype.removeHeader = function(key)
 {
 this.context.response.removeHeader(key);
 }
 
 res.prototype.writeHead = function(statusCode, reasonPhrase, headers)
 {
 this.context.response.writeHead(statusCode, reasonPhrase, headers);
 }
 
 //ADD BODY PROTOYPE ALIASES FOR REQUEST AND RESPONSE

 var Stream = require('stream');
 var Writable = Stream.Writable;
 var Readable = Stream.Readable;
 var EventEmitter = require('events').EventEmitter;

 owinContextHelpers.cloneBodyPrototypeAlias(req.prototype,EventEmitter.prototype, "owin.RequestBody");
 owinContextHelpers.cloneBodyPrototypeAlias(req.prototype,Stream.prototype, "owin.RequestBody");
 owinContextHelpers.cloneBodyPrototypeAlias(req.prototype,Readable.prototype, "owin.RequestBody");
 
 owinContextHelpers.cloneBodyPrototypeAlias(res.prototype,EventEmitter.prototype, "owin.ResponseBody");
 owinContextHelpers.cloneBodyPrototypeAlias(res.prototype,Stream.prototype, "owin.ResponseBody");
 owinContextHelpers.cloneBodyPrototypeAlias(res.prototype,Writable.prototype, "owin.ResponseBody");
 
 }).call(global);


