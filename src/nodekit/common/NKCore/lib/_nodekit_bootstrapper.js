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

var native = io.nodekit.platform;

var Startup = function Startup() {
    
    if (!process)
        throw new Error("NK Core cannot be booted before NK Core Platform plugins")
    
    process.binding = function(id) {
           return BootstrapModule._load('lib/bindings/' + id);
    };
    
    BootstrapModule.loadNodeSource(process.binding('natives'));
    
    console.log = native.console.log;
    
    // run vanilla node.js startup
    BootstrapModule.bootstrap('lib/node.js');
    
    global.setImmediate = function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }
        
    console.log = native.console.log;
    console.warn = console.log;
    native.console.error = BootstrapModule.error;
   try
    {
       process._tickCallback();
    }
    catch (e)
    {
        NKconsole.error(e, "tickCallBack in nodekit_bootstrapper");
    }
 }

/* *******************************************************
 * BootstrapModule
 *
 */

function BootstrapModule(id) {
    this.filename = id + '.js';
    this.id = id;
    this.exports = {};
    this.loaded = false;
    this.bootstrapper = true;
}

BootstrapModule.getSource = function(id) {
    
    if (id.indexOf("/") > -1)
    {
        var source = atob(native.fs.getSourceSync(id))
        var append = "\r\n //# sourceURL=io.nodekit.core/" + id + "\r\n";
        return source + append;
    }
    
    if (BootstrapModule.nodeSourceExists(id)) {
        return BootstrapModule.getNodeSource(id) + append;
    }

    var source = atob(native.fs.getSourceSync(id))
    var append = "\r\n //# sourceURL=io.nodekit.core/" + id + "\r\n";
    return source + append;

}

BootstrapModule._cache = {};

BootstrapModule._load = function(id)
{
    if (id == 'native_module') {
        return BootstrapModule;
    }
    
    var cached = BootstrapModule.getCached(id);
    if (cached) {
        return cached.exports;
    }
    
    process.moduleLoadList.push('BootstrapModule ' + id);
    
    var bootstrapModule = new BootstrapModule(id);
    
    bootstrapModule.cache();
    bootstrapModule.compile();
    
    return bootstrapModule.exports;
};

BootstrapModule.error = function(e, source)
{
    native.console.log("ERROR OCCURED via " + source);
    native.console.log("EXCEPTION: " + e);
    
    native.console.log(JSON.stringify(e));
    var message = "";
    var sourceFile = "unknown";
    
    if (e.sourceURL)
    {
        sourceFile = e.sourceURL.replace("file://","");
    }
    
    message += "<head></head>";
    message += "<body>";
    message += "<h1>Exception</h1>";
    message += "<h2>" + e + "</h2>";
    message += "<p><i>" + e["message"] +"</i> in file " + sourceFile + ": " + e.line;
    
    
    if (e.sourceURL)
    {
        source = global.process.sources[sourceFile];
        if (source)
        {
            message += "<h3>Source</h3>";
            message += "<pre id='preview' style='font-family: monospace; tab-size: 3; -moz-tab-size: 3; -o-tab-size: 3; -webkit-tab-size: 3;'><ol>";
            message += "<li>" + source.split("\n").join("</li><li>") + "</li>";
            message += "</ol></pre>";
        }
    }
    
    if (e.stack)
    {
        message += "<h3>Call Stack</h3>";
        message += "<pre id='preview' style='font-family: monospace;'><ul>";
        message += "<li>" + e.stack.split("\n").join("</li><li>").split("file://").join("") + "</li>";
        message += "</ul></pre>";
    }
    
    message += "</body>";
    native.console.loadString(message, "Debug");
    native.console.log("EXCEPTION: " + e);
    native.console.log("Source: " + sourceFile );
    native.console.log("Stack: " + e.stack );
};

BootstrapModule.bootstrap = function(id) {
    // process.moduleLoadList.push('BootstrapModule ' + id);
    var source = BootstrapModule.getSource(id);
    var fn = BootstrapModule.runInThisContext(source, { filename: id , displayErrors: true});
    return fn(process);
};

BootstrapModule.getCached = function(id) {
    return BootstrapModule._cache[id];
};

BootstrapModule.runInThisContext = function(code, options) {
    options = options || {};
    
    var filename = options.filename || '<eval>';
    var displayErrors = options.displayErrors || false;
    
    try {
        return process.evalSync(code, filename);
    } catch (e) {
        native.console.log(e.message + " - " + filename + " - " + e.stack);
        
    }
}

BootstrapModule.wrap = function(script) {
    return BootstrapModule.wrapper[0] + script + BootstrapModule.wrapper[1];
};

BootstrapModule.wrapper = [
                           '(function (exports, require, module, __filename, __dirname) { ',
                           '\n});'
                           ];

BootstrapModule.prototype.cache = function() {
    BootstrapModule._cache[this.id] = this;
};

BootstrapModule.prototype.compile = function() {
    var self = this;
    
    var reqFunc = function(id) {
        if (id[0] == ".")
        {
            id = native.fs.getFullPathSync(self.filename, id.substr(1));
        }
        
        return BootstrapModule._load(id);
    };
    
    var source = BootstrapModule.getSource(this.id);
    source = BootstrapModule.wrap(source);
    var fn = BootstrapModule.runInThisContext(source, { filename: this.filename , displayErrors: true});
    fn(this.exports, reqFunc, this, this.filename);
    this.loaded = true;
};

BootstrapModule._nodeSource = {};

BootstrapModule.loadNodeSource = function(_natives) {
      BootstrapModule._nodeSource = _natives;
}

BootstrapModule.nodeSourceExists = function(id) {
return BootstrapModule._nodeSource.hasOwnProperty(id);
}

BootstrapModule.getNodeSource = function(id) {
    return BootstrapModule._nodeSource[id];
}

Startup();

// Polyfill for atob and btoa
// Copyright (c) 2011..2012 David Chambers <dc@hashify.me>
!function(){function t(t){this.message=t}var r="undefined"!=typeof exports?exports:this,e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";t.prototype=new Error,t.prototype.name="InvalidCharacterError",r.btoa||(r.btoa=function(r){for(var o,n,a=String(r),i=0,c=e,d="";a.charAt(0|i)||(c="=",i%1);d+=c.charAt(63&o>>8-i%1*8)){if(n=a.charCodeAt(i+=.75),n>255)throw new t("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");o=o<<8|n}return d}),r.atob||(r.atob=function(r){var o=String(r).replace(/=+$/,"");if(o.length%4==1)throw new t("'atob' failed: The string to be decoded is not correctly encoded.");for(var n,a,i=0,c=0,d="";a=o.charAt(c++);~a&&(n=i%4?64*n+a:a,i++%4)?d+=String.fromCharCode(255&n>>(-2*i&6)):0)a=e.indexOf(a);return d})}();