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

process.native = io.nodekit.platform.process;

this.global = this;

process._asyncFlags = {};
process.moduleLoadList = [];

process._setupDomainUse = function () { };
process.cwd = function cwd() { return process.workingDirectory; };
process.isatty = false;

process.versions = { http_parser: '1.0', node: '0.12.9', v8: '3.14.5.8', ares: '1.9.0-DEV', uv: '0.10.3', zlib: '1.2.3', modules: '11', openssl: '1.0.1e' };
process.version = 'v0.12.9';
process.execArgv = ['--nodekit'];
process.arch = 'x64';
process.umask = function () { return parseInt('0777', 8); }
process._needImmediateCallbackValue = false;

Object.defineProperty(process, '_needImmediateCallback', {
                      get: function () {
                      return process._needImmediateCallbackValue;
                      },
                      set: function (v) {
                      process._needImmediateCallbackValue = (v ? true : false);
                      if (v)
                      process.nextTick(process.checkImmediate);
                      }
                      });

process.checkImmediate = function () {
    this._immediateCallback();
    this._needImmediateCallbackValue = false;
}.bind(process);

process._nextTick = (function () {
                     var canSetTimeOut = typeof window !== 'undefined'
                     && window.setTimeout;
                     
                     var canSetImmediate = typeof window !== 'undefined'
                     && window.setImmediate;
                     
                     var canPost = typeof window !== 'undefined'
                     && window.postMessage && window.addEventListener;
                     
                    if (canSetImmediate) {
                    return function (f) { return window.setImmediate(f) };
                   }
                     
                     if (canPost) {
                     var queue = [];
                     window.addEventListener('message', function (ev) {
                                             var source = ev.source;
                                             if ((source === window || source === null) && ev.data === 'process-tick') {
                                             ev.stopPropagation();
                                             if (queue.length > 0) {
                                             var fn = queue.shift();
                                             fn();
                                             }
                                             }
                                             }, true);
                     
                     return function nextTick(fn) {
                     queue.push(fn);
                     window.postMessage('process-tick', '*');
                     };
                     }
                     

                     return function (f) { return process.native.nextTick(f); };
                     
                     })();


process._setupAsyncListener = function (asyncFlags, runAsyncQueue, loadAsyncQueue, unloadAsyncQueue) {
    process._runAsyncQueue = runAsyncQueue;
    process._loadAsyncQueue = loadAsyncQueue;
    process._unloadAsyncQueue = unloadAsyncQueue;
};

process._setupNextTick = function (tickInfo, _tickCallback, _runMicrotasks) {
    _runMicrotasks.runMicrotasks = function () { };
    process._tickCallback = _tickCallback;
    process.nextTick = process._nextTick;
    //    _tickCallback();
};

process.evalSync = function(script, filename) {
    try {
        return eval(script);
    } catch (e) {
        if (e instanceof SyntaxError) {
            
            /*   var source =script.split(/\r?\n/);
             var line = 0;
             for (i = Math.max(1, e.line-5); i < Math.min(source.length, e.line + 5); i++) {
             console.log(i + " " + source[i-1])
             if (i == e.line)
             console.log(" " + Array(e.column).join(" ") + "^")
             } */
            console.log("Syntax Error in " + ( filename) )
            console.log(e.message);
        } else {
            throw( e );
        }
    }
}



