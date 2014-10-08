/*
 * Copyright 2014 Domabo
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

(function(process) {
    
  process.nextTick = (function () {
                     
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
                     
                     if (canSetImmediate) {
                        return function nextTick(fn) {setTimeout(fn, 0);};
                     }
                     
                      return function(f) {return io.nodekit.console.nextTick(f); };
                     
                     })();

    process._asyncFlags = {};
    process.moduleLoadList = [];
    
    process._setupAsyncListener = function(asyncFlags, runAsyncQueue, loadAsyncQueue, unloadAsyncQueue) {
        process._runAsyncQueue = runAsyncQueue;
        process._loadAsyncQueue = loadAsyncQueue;
        process._unloadAsyncQueue = unloadAsyncQueue;
    };
    
    process._setupNextTick = function(tickInfo, tickCallback) {
        process._tickInfo = tickInfo;
        process._tickCallback = tickCallback;
        tickCallback();
    };
    
    process._setupDomainUse = function() {};
    process.cwd = function cwd() { return  process.workingDirectory; };
    process.isatty = false;
 
    process.versions = { http_parser: '1.0', node: '0.10.4', v8: '3.14.5.8', ares: '1.9.0-DEV', uv: '0.10.3', zlib: '1.2.3', modules: '11', openssl: '1.0.1e' };
 
  //  Error.captureStackTrace = function() {};

    
});
