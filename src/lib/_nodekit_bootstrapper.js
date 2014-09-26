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

var Startup = function Startup() {
    
    BootstrapModule.bootstrap('lib/_nodekit_process.js');
    
    process.binding = function(id) {
          return BootstrapModule._load('lib/bindings/' + id);
    };
    
    BootstrapModule.loadNodeSource(process.binding('natives'));
    
    console.log = io.nodekit.console.log;
    
    // save nextTick
    var _nextTick = process.nextTick;
    
    // run vanilla node.js startup
    BootstrapModule.bootstrap('lib/node.js');
    
    // restore nextTick
    process.nextTick = _nextTick;
    console.log = io.nodekit.console.log;
    console.warn = console.log;
   
    process._tickCallback();
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
    
    var append = "\r\n //" + " # source" + "URL=" + id;
    
    if (id.indexOf("/") > -1)
        return io.nodekit.fs.getSource(id) + append;
    
    if (BootstrapModule.nodeSourceExists(id)) {
        return BootstrapModule.getNodeSource(id) + append;
    }
    
    return io.nodekit.fs.getSource(id) + append;
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
        return eval(code);
    } catch (e) {
        io.nodekit.console.log(e.message + " - " + filename + " - " + e.stack);
        
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
            id = io.nodekit.fs.getFullPath(self.filename, id.substr(1));
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

// # sourceURL=bootstrapper.js

