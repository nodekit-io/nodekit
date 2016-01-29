/*
 * nodekit.io
 *
 * Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
 * Portions Copyright (c) 2013 GitHub, Inc. under MIT License
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

// Bindings
// func registerCustomProtocol(scheme: String, handler: NKScriptValue, completion: NKScriptValue?) -> Void {
// func unregisterCustomProtocol(scheme: String, completion: NKScriptValue?) -> Void {
// func callbackWriteData(id: Int, res: Dictionary<String, AnyObject>) -> Void {
// func callbackEnd(id: Int, res: Dictionary<String, AnyObject>) -> Void {
// func isProtocolHandled(scheme: String, callback: NKScriptValue) -> Void {

var protocol = io.nodekit.electro.protocol

protocol._init = function() {
    this.callbacks = {}
    this.on('nk.IPCReplytoRenderer', function(sender, channel, replyId, result) {
            callbacks[replyId].call(self, result);
            delete callbacks[replyId];
            });
}

protocol.registerStandardSchemes = function(schemes) { /* do nothing */}

protocol.registerServiceWorkerSchemes = function(schemes) {/* do nothing */}

protocol.registerFileProtocol = function(scheme, handler, completion) {
    callbacks[scheme.toLowerCase()] = handler;
    this.registerCustomProtocol(scheme, this.callbackFile, completion);
}

protocol.registerBufferProtocol = function(scheme, handler, completion) {
    callbacks[scheme.toLowerCase()] = handler;
    this.registerCustomProtocol(scheme, this.callbackBuffer, completion);
}

protocol.registerStringProtocol = function(scheme, handler, completion) {
    callbacks[scheme.toLowerCase()] = handler;
    this.registerCustomProtocol(scheme, this.callbackString, completion);
}

protocol.registerHttpProtocol = function(scheme, handler, completion) {
    callbacks[scheme.toLowerCase()] = handler;
    this.registerCustomProtocol(scheme, this.callbackHttp, completion);
}

protocol.unregisterProtocol = function(scheme, completion) {
    delete callbacks[scheme.toLowerCase()];
    this.unregisterCustomProtocol(scheme, completion);
}

protocol.callbackFile = function(request) {
    var handler = this.callbacks[request["scheme"]];
    var id = request["id"];
    var self = this;
    handler(request, function(arg){
            
            if (typeof arg === 'string') {
                self.callbackEnd(id, {'path': arg})
             } else {
                self.callbackEnd(id, arg)
            }
            id = null;
        })
}

protocol.callbackBuffer = function(request) {
    var handler = this.callbacks[request["scheme"]];
    var id = request["id"];
    var self = this;
    handler(request, function(arg){
            if (Buffer.isBuffer(arg)) {
                    var statusCode = 200;
                    var header = {'Content-Type': 'text/html; charset=utf-8'}
                   self.callbackEnd(id, {'data': arg.toString('base64'), 'headers': header, 'statusCode': statusCode })
             } else {
                        var contentType = arg['mimeType'] || 'text/html'
                        var charset = arg['charset'] || 'utf-8'
                        var header = {'Content-Type': contentType + "; charset=" + charset}
                        var statusCode = arg['statusCode'] || 200;
                        self.callbackEnd(id, {'data': arg['data'].toString('base64'), 'headers': header, 'statusCode': statusCode } )
             }
            id = null;
        })
}

protocol.callbackString = function(request) {
    var handler = this.callbacks[request["scheme"]];
    var id = request["id"];
    var self = this;
    handler(request, function(arg){
            if (typeof arg === 'string') {
            // TO DO CHECK FOR CHARSET AND CONVERT TO BUFFER IF UTF16 or other than UTF8
            var header = {'Content-Type': 'text/html; charset=utf-8'}
            var statusCode = 200;
            
            self.callbackEnd(id, {'data': btoa(arg), 'headers': header, 'statusCode': statusCode })
            } else {
                var contentType = arg['mimeType'] || 'text/html'
                var charset = arg['charset'] || 'utf-8'
                var header = {'Content-Type': contentType + "; charset=" + charset}
                var statusCode = arg['statusCode'] || 200;
                self.callbackEnd(id, {'data': btoa(arg['data']), 'headers': header, 'statusCode': statusCode } )
            }
            id = null;
            })
}


protocol.callbackHttp = function(request) {
    var handler = this.callbacks[request["scheme"]];
    var id = request["id"];
    var self = this;
    
    handler(request, function(arg){
            if (arg["url"])
            {
                var url = arg["url"];
            var header = {'location': url, 'referer': arg["referrer"] }
                self.callbackEnd(id, {'statusCode': 302, 'headers': header})
            } else
            {
                throw new Error('HTTP request to request unsupported, only redirects');
            }
            id = null;
            })
}

protocol.interceptFileProtocol = function(scheme, handler, completion) {
    this.registerFileProtocol(scheme, handler, completion);
}
protocol.interceptStringProtocol = function(scheme, handler, completion) {
    this.registerStringProtocol(scheme, handler, completion);
}
protocol.interceptBufferProtocol = function(scheme, handler, completion) {
   this.registerBufferProtocol(scheme, handler, completion);
}
protocol.interceptHttpProtocol = function(scheme, handler, completion) {
   this.registerHttpProtocol(scheme, handler, completion);
}
protocol.uninterceptProtocol = function(scheme, completion) {
   this.unregisterProtocol(scheme, handler, completion);
}

// Polyfill for atob and btoa
// Copyright (c) 2011..2012 David Chambers <dc@hashify.me>
!function(){function t(t){this.message=t}var r="undefined"!=typeof exports?exports:this,e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";t.prototype=new Error,t.prototype.name="InvalidCharacterError",r.btoa||(r.btoa=function(r){for(var o,n,a=String(r),i=0,c=e,d="";a.charAt(0|i)||(c="=",i%1);d+=c.charAt(63&o>>8-i%1*8)){if(n=a.charCodeAt(i+=.75),n>255)throw new t("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");o=o<<8|n}return d}),r.atob||(r.atob=function(r){var o=String(r).replace(/=+$/,"");if(o.length%4==1)throw new t("'atob' failed: The string to be decoded is not correctly encoded.");for(var n,a,i=0,c=0,d="";a=o.charAt(c++);~a&&(n=i%4?64*n+a:a,i++%4)?d+=String.fromCharCode(255&n>>(-2*i&6)):0)a=e.indexOf(a);return d})}();