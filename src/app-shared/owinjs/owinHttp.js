var path = require('path');
var url = require('url');
var util = require('util');
var constants = require('./owinConstants.js');

var cancellationTokenSource = require('./cancellation.js');
var owinContextHelpers = require('./owinContextHelpers.js');
var OwinContextModule = require('./owinContext.js');
var initialized = false;

exports = module.exports = function toHttp(appFunc) {
    if (!initialized)
    {
        init();
        initialized = true;
    }
    return function(req, res) {
        var owin = new OwinContext(req,res);
        appFunc(owin).then(
                           function(result) { Dispose(owin);   owin = null; },
                           function(err) { Dispose(owin); owin=null;}
                           );
    }
};

/**
 * Represents an OWIN/JS bridge to Node.js http ServerResponse Object
 *
 * @class OwinHttpServerResponseBridge
 * @constructor
 */

function OwinContext(req, res) {
    console.log("owin/js http bridge: url path " + req.url);
    this.req = req;
    this.res = res;
    res.setHeader('X-Powered-By', 'OWIN-JS');
    
    var context = this;
    this._callCancelledSource = new cancellationTokenSource();
    
    context["owin.CallCancelled"] = this._callCancelledSource.token;
    context["owin.ResponseStatusCode"] = null;
    context[constants.commonkeys.AppId] = "node-http";
    
//    if (!context[constants.owinjs.getResponseHeader]("Content-Length"))
  //     context[constants.owinjs.setResponseHeader]("Content-Length", "-1");
  }

function init(){
    
    var ctx= OwinContext.prototype;
    
    Object.defineProperty(ctx, "owin.RequestHeaders", {
                          get: function () {return this.req.headers; }
                          });
    
    Object.defineProperty(ctx, "owin.RequestMethod", {
                          get: function () { return this.req.method;  },
                          set: function (val) { this.req.method = val;    }
                          });
    
    Object.defineProperty(ctx, "owin.RequestPath", {
                          get: function () { return url.parse(this.req.url).pathname; },
                          set: function (val) {
                          var uri = val;
                          var uriQuery =  url.parse(this.req.url).query;
                          if (uriQuery != "")
                          uri += "?" + uriQuery;
                          this.req.url = uri;
                          }
                          });
    
    Object.defineProperty(ctx, "owin.RequestPathBase", {
                          get: function () { return "" },
                          set: function (val) {
                          if (!this.req.originalUrl)
                          this.req.originalUrl = this.req.url;
                          var uri = path.join(val, this.req.url);
                          this.req.url = uri;
                          }
                          });
    
    Object.defineProperty(ctx, "owin.RequestProtocol", {
                          get: function () {return "HTTP/" + this.req.httpVersion; }
                          });
    
    Object.defineProperty(ctx, "owin.RequestQueryString", {
                          get: function () {  return  url.parse(this.req.url).query; },
                          set: function (val) {
                          var uri = url.parse(this.req.url).pathname;
                          var uriQuery =  val;
                          if (uriQuery != "")
                          uri += "?" + uriQuery;
                          this.req.url = uri;
                          }
                          });
    
    Object.defineProperty(ctx, "owin.RequestScheme", {
                          get: function () { return "http"; }
                          });
    
    Object.defineProperty(ctx, "owin.RequestBody", {
                          get: function () { return this.req;}
                          });
    
    Object.defineProperty(ctx, "owin.ResponseHeaders", {
                          get: function () {return this.res._headers; }
                          });
    
    Object.defineProperty(ctx, "owin.ResponseStatusCode", {
                          get: function () { return this.res.statusCode; },
                          set: function (val) { this.res.statusCode = val;    }
                          });
    
    Object.defineProperty(ctx, "owin.ResponseReasonPhrase", {
                          get: function () { return "";   },
                          set: function (val) { /* ignore */    }
                          });
    
    Object.defineProperty(ctx, "owin.ResponseProtocol", {
                          get: function () {  return "HTTP/" + this.req.httpVersion; },
                          set: function (val) { /* ignore */  }
                          });
    
    Object.defineProperty(ctx, "owin.ResponseBody", {
                          get: function () { return this.res; }
                          });
    
    Object.defineProperty(ctx, constants.commonkeys.AppId, {
                          get: function () { return this._appId; },
                          set: function (val) { this._appId = val;    }
                          });
    
    Object.defineProperty(ctx, constants.commonkeys.CallCancelledSource, {
                          get: function() { return this._callCancelledSource;},
                          set: function (val) { this._callCancelledSource = val; }
                          });
    
    Object.defineProperty(ctx, "owin.Version", {
                          get: function () { return "1.0";  }
                          });
    
    Object.defineProperty(ctx, "owin.callCancelled", {
                          get: function () {  return this._callCancelled; },
                          set: function (val) { this._callCancelled = val;    }
                          });
    
    ctx[constants.owinjs.setResponseHeader] = function(){this.res.setHeader.apply(this.res, Array.prototype.slice.call(arguments));};
    ctx[constants.owinjs.getResponseHeader] = function(){this.res.getHeader.apply(this.res, Array.prototype.slice.call(arguments));};
    ctx[constants.owinjs.removeResponseHeader] = function(){this.res.removeHeader.apply(this.res, Array.prototype.slice.call(arguments));};
    ctx[constants.owinjs.writeHead] = function(){this.res.writeHead.apply(this.res, Array.prototype.slice.call(arguments));};
    ctx[constants.owinjs.getRequestHeader] = function (key) { return this.req.headers[key];  }
    
    console.log("http -> OWIN/JS server initialized");
}

/**
 * Clean up owin context *
 * @class Dispose
 * @private
 */

function Dispose(owin) {
    owin.req = null;
    owin.res = null;
    }
