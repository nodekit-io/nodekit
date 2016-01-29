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
module = require('module');
var util = require('util');
var path = require('path');
util.isBuffer = Buffer.isBuffer;
global.process.sources = [];
var EventEmitter = require('events').EventEmitter;

console.warn = console.log;

DTRACE_NET_SERVER_CONNECTION = function(){};
DTRACE_NET_STREAM_END= function(){};
DTRACE_NET_SOCKET_READ  = function(){};
DTRACE_NET_SOCKET_WRITE = function(){};
DTRACE_HTTP_SERVER_REQUEST = function(){};
DTRACE_HTTP_SERVER_RESPONSE = function(){};
DTRACE_HTTP_CLIENT_REQUEST = function(){};
DTRACE_HTTP_CLIENT_RESPONSE = function(){};
COUNTER_NET_SERVER_CONNECTION = function(){};
COUNTER_NET_SERVER_CONNECTION_CLOSE = function(){};
COUNTER_HTTP_SERVER_REQUEST = function(){};
COUNTER_HTTP_SERVER_RESPONSE = function(){};
COUNTER_HTTP_CLIENT_REQUEST = function(){};
COUNTER_HTTP_CLIENT_RESPONSE = function(){};


/**
 * Register javascript Module loader to add sourceURL to end of every file
 *
 */

module._extensions['.js'] = function nodekit_module_jsread(module, filename) {
    var file = filename.replace(process.execPath, "");
    
    var append = "\r\n //" + "# source" + "URL=" + file + "\r\n";
    
    var content = require('fs').readFileSync(filename, 'utf8') + append;
    global.process.sources[file] = content;
    module._compile(stripBOM(content), filename);
};

function stripBOM(content) {
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    return content;
}

var dns = require('dns');
dns.platform.name_servers = [
                             {
                             address: '8.8.8.8',
                             port: 53
                             },
                             {
                             address: '8.8.4.4',
                             port: 53
                             }
                             ];

if (Error.captureStackTrace === undefined) {
    Error.captureStackTrace = function (obj) {
        if (Error.prepareStackTrace) {
            var frame = {
            isEval: function () { return false; },
            getFileName: function () { return "filename"; },
            getLineNumber: function () { return 1; },
            getColumnNumber: function () { return 1; },
            getFunctionName: function () { return "functionName" }
            };
            
            obj.stack = Error.prepareStackTrace(obj, [frame, frame, frame]);
        } else {
            obj.stack = obj.stack || obj.name || "Error";
        }
    };
    
}

/**
 * NODEKIT INITIALIZATION
 * Load Application package.json file, register request/response server, and load debug application
 */

console.log("Starting PACKAGE.JSON");
// INVOKE MAIN APP
process.package =  module._load('app/package.json', null, false);
process.argv = ["node", __dirname + "/" + process.package['main']]
module._load(process.package['main'], null, true);

process.nextTick(function(){
                 process.native.emit("nk.jsApplicationReady");
                 });
