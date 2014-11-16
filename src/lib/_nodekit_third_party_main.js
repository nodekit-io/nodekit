/*
* nodekit.io
*
* Copyright (c) 2014 Domabo. All Rights Reserved.
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


process.versions = { http_parser: '1.0', node: '0.10.4', v8: '3.14.5.8', ares: '1.9.0-DEV', uv: '0.10.3', zlib: '1.2.3', modules: '11', openssl: '1.0.1e' };

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

module._extensions['.js'] = function nodeappkit_module_jsread(module, filename) {
    var file = path.basename(filename);
    
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

/**
 * NODEKIT INITIALIZATION
 * Load Application package.json file, register owin/js server, and load debug application
 */

var invoke = module._load('lib/_nodekit_invoke.js');
io.nodekit.invokeContext = invoke.invokeContext;
io.nodekit.createEmptyContext = invoke.createEmptyContext;
io.nodekit.cancelContext = invoke.cancelContext;
io.nodekit.createServer = invoke.createServer;

process.package =  module._load('app/package.json', null, false);
// global.Browser = require('owinjs-browser.js');

module._load(process.package['main'], null, true);

io.nodekit.console.setTimeout(1, function(){
             io.nodekit.console.navigateTo(process.package["node-baseurl"] + process.package["node-main"], process.package.window.title)
                              });


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

// # sourceURL=nodekit_third_party_main.js

