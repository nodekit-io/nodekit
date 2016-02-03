/*
 * nodekit.io
 *
 * Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
 * Portions Copyright 2015 XWebView
 * Portions Copyright (c) 2014 Intel Corporation.  All rights reserved.
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
var exports;

var NKScripting = (function NKScriptingRunOnce(exports) {
    var global = this;
    
    global.onerror = function(msg, url, line, col, err) {

        console.error(err.stack || err.toString())
    };

    this.Blob = (typeof Blob === 'undefined') ? {} : Blob;
    this.File = (typeof File === 'undefined') ? {} : File;
    this.FileList = (typeof FileList === 'undefined') ? {} : FileList;
    this.ImageData = (typeof ImageData === 'undefined') ? {} : ImageData;
    this.MessagePort = (typeof MessagePort === 'undefined') ? {} : MessagePort;
                   var syncRef = 0;
    var NKScripting = function NKScriptingObject(channelName) {

        var channel = webkit.messageHandlers[channelName];
        if (!channel) throw 'channel has not established';

        if (!channel.postMessageSync)
                   {
                   channel.postMessageSync = function(){
                   var args = arguments;
                   var obj = args[0]
                   if (!obj['$opcode'])
                     return channel.postMessage.apply(this, args);
                    var id = "s" + syncRef++
                   obj["$nk.sync"] = true;
                   obj["$id"] = id;
                   channel.postMessage.apply(this, args);
                   return window.prompt("nk.Signal", id);
                   }
                   }
                   
        Object.defineProperty(this, '$channel', {
            'configurable': true,
            'value': channel
        });
        Object.defineProperty(this, '$references', {
            'configurable': true,
            'value': []
        });
        Object.defineProperty(this, '$lastRefID', {
            'configurable': true,
            'value': 1,
            'writable': true
        });
                   
        this.events = {}
    }
 
    exports = NKScripting;

    if (typeof window !== 'undefined')
                   {
        if (window.webkit)
            this.webkit = webkit;
        else
            this.webkit = NKScripting;
                   }
    else
        this.webkit = NKScripting;


    NKScripting.messageHandlers = {};

    NKScripting.createNamespace = function(namespace, object) {
        function callback(p, c, i, a) {
            if (i < a.length - 1)
                return (p[c] = p[c] || {});
            if (p[c] instanceof NKScripting)
                p[c].dispose();
            return (p[c] = object || {});
        }
        return namespace.split('.').reduce(callback, global);
    }

    NKScripting.createPlugin = function(channelName, namespace, base) {
        if (typeof(base) === "string") {
            // Plugin object is a constructor
            return NKScripting.createConstructor(channelName, namespace, base);
        }

        if (base instanceof Object) {
            // Plugin is a mixin object which contains both JavaScript and native methods/properties.
            var properties = {};
            Object.getOwnPropertyNames(NKScripting.prototype).forEach(function(p) {
                properties[p] = Object.getOwnPropertyDescriptor(this, p);
            }, NKScripting.prototype);
            base.__proto__ = Object.create(Object.getPrototypeOf(base), properties);
            NKScripting.call(base, channelName);
         } else {
            base = new NKScripting(channelName);
        }
        return NKScripting.createNamespace(namespace, base);
    }

    NKScripting.createConstructor = function(channelName, namespace, type) {
        var ctor = function() {
            // Instance must can be accessed by native object in global context.
            var ctor = this.constructor;
        //    while (ctor[ctor.$lastInstID] != undefined)
                ++ctor.$lastInstID;
            Object.defineProperty(this, '$instanceID', {'configurable': true,'value': ctor.$lastInstID});
            Object.defineProperty(this, '$properties', {'configurable': true, 'value': {}});
            ctor[this.$instanceID] = this;
            NKScripting.invokeNative.apply(this, arguments);
            this.events = {};
            if (this._init) this._init();
        }

        // Principal instance (which id is 0) is the prototype object.
        var proto = new NKScripting(channelName);
        ctor.prototype = proto;
        ctor = ctor.bind(null, '+' + (type || '#p'));
        proto.constructor = ctor;
        ctor.prototype = proto;  // comment this line to hide prototype object
        ctor.$lastInstID = 1;
        ctor.dispose = function() {
            Object.keys(this).forEach(function(i) {
                if (this[i] instanceof NKScripting)
                    this[i].dispose();
            }, this);
            proto.dispose();
            delete this.$lastInstID;
        }
     ctor.NKcreateForNative = function(idString) {
        var id = idString + 0;
        var instance = Object.create(proto, {
                '$instanceID': {'configurable': true,'value': id},
                '$properties': {'configurable': true,'value': {} }
              });
             this[instance.$instanceID] = instance;
                   instance.events = {}
                   
             if (instance._init)  instance._init();
              return instance;
        }
                   
        NKScripting.createNamespace(namespace, ctor);
        return proto;
    }
                   
                   NKScripting.defineProperty = function (obj, prop, value, writable) {
                   var desc = {
                   'configurable': false,
                   'enumerable': true
                   };
                   if (writable) {
                   // For writable property, any change of its value must be synchronized to native object.
                   if (!obj.$properties)
                   Object.defineProperty(obj, '$properties', {
                                         'configurable': true,
                                         'value': {}
                                         });
                   obj.$properties[prop] = value;
                   desc.get = function () {
                   return this.$properties[prop];
                   }
                   if (obj.constructor.$lastInstID)
                   { desc.set = function (v) {
                   NKScripting.invokeNative.call(this, prop, v);
                   } } else
                   desc.set = NKScripting.invokeNative.bind(obj, prop);
                   } else {
                   desc.value = value;
                   desc.writable = false;
                   }
                   Object.defineProperty(obj, prop, desc);
                   }

    NKScripting.invokeNative = function(name) {
        if (typeof(name) != 'string' && !(name instanceof String))
            throw 'Invalid invocation';

        var args = Array.prototype.slice.call(arguments, 1);
        if (name.lastIndexOf('#') >= 0) {
            // Parse type coding
            var t = name.split('#');
            name = t[0];
            args.length = parseInt(t[1], 10) || args.length;
            if (t[1].slice(-1) == 'p') {
                // Return a Promise object for async operation
                args.unshift(name);
                return Promise((function(args, resolve, reject) {
                    args[args.length - 1] = {
                        'resolve': resolve,
                        'reject': reject
                    };
                    NKScripting.invokeNative.apply(this, args);
                }).bind(this, args));
            }
        }

        var operand = [];
        if (this.$properties && this.$properties.hasOwnProperty(name)) {
            // Update property
            operand = this.$retainObject(args[0]);
            this.$properties[name] = args[0];
        } else {
            // Invoke method
            args.forEach(function(v, i, a) {
                operand[i] = this.$retainObject(v);
            }, this);
            // Set null for omitted arguments
            if (operand.length < args.length)
                operand.fill(null, operand.length, args.length);
        }
        if ((name == "+") || (name.indexOf("Sync", operand.length - "Sync".length) !== -1))
                   { var result = this.$channel.postMessageSync({
                                                               '$opcode': name,
                                                               '$operand': operand,
                                                               '$target': this.$instanceID
                                                                });
                    return JSON.parse(result, JSON.dateParser);
                   }
                   else
        this.$channel.postMessage({
            '$opcode': name,
            '$operand': operand,
            '$target': this.$instanceID
        });
    }

    NKScripting.shouldPassByValue = function(obj) {
        // See comment in Source/WebCore/bindings/js/SerializedScriptValue.cpp
        var terminal = [
            ArrayBuffer, Blob, Boolean, DataView, Date,
            File, FileList, Float32Array, Float64Array,
            ImageData, Int16Array, Int32Array, Int8Array,
            MessagePort, Number, RegExp, String, Uint16Array,
            Uint32Array, Uint8Array, Uint8ClampedArray
        ];
        var container = [Array, Map, Object, Set];
        if (obj instanceof Object) {
            if (terminal.some(function(ctor) {
                    return obj.constructor === ctor;
                }))
                return true;
            if (container.some(function(ctor) {
                    return obj.constructor === ctor;
                })) {
                var self = arguments.callee;
                return Object.getOwnPropertyNames(obj).every(function(prop) {
                    return self(obj[prop]);
                });
            }
            return false;
        }
        return true;
    }


    NKScripting.prototype = {
        $retainObject: function(obj, force) {
            if (!force && NKScripting.shouldPassByValue(obj))
                return obj;

            while (this.$references[this.$lastRefID] != undefined)
                ++this.$lastRefID;
            this.$references[this.$lastRefID] = obj;
            return {
                '$sig': 0x5857574F,
                '$ref': this.$lastRefID++
            };
        },
        $releaseObject: function(refid) {
            delete this.$references[refid];
            this.$lastRefID = refid;
        },
        dispose: function() {
            this.$channel.postMessage({
                '$opcode': '-',
                '$target': this.$instanceID
            });

            delete this.$channel;
            delete this.$properties;
            delete this.$references;
            delete this.$lastRefID;
            delete this.events;
                   
            if (this.$instanceID) {
                // Dispose instance
            //    this.constructor.$lastInstID = this.$instanceID + 10;
                delete this.constructor[this.$instanceID];
                delete this.$instanceID;
                this.__proto__ = Object.getPrototypeOf(this.__proto__);
            }
            this.__proto__ = Object.getPrototypeOf(this.__proto__);
        }
    }
                   
    /* Polyfill indexOf. */
    var indexOf;

    if (typeof Array.prototype.indexOf === 'function') {
        indexOf = function (haystack, needle) {
            return haystack.indexOf(needle);
        };
    } else {
        indexOf = function (haystack, needle) {
            var i = 0, length = haystack.length, idx = -1, found = false;

            while (i < length && !found) {
                if (haystack[i] === needle) {
                    idx = i;
                    found = true;
                }

                i++;
            }

            return idx;
        };
    };
    
    NKScripting.prototype.on = function (event, listener) {
        if (typeof this.events[event] !== 'object') {
            this.events[event] = [];
        }

        this.events[event].push(listener);
    };

    NKScripting.prototype.removeListener = function (event, listener) {
        var idx;

        if (typeof this.events[event] === 'object') {
            idx = indexOf(this.events[event], listener);

            if (idx > -1) {
                this.events[event].splice(idx, 1);
            }
        }
    };

    NKScripting.prototype.emit = function (event) {
        var i, listeners, length, args = [].slice.call(arguments, 1);
               
        if (typeof this.events[event] === 'object') {
            listeners = this.events[event].slice();
            length = listeners.length;

            for (i = 0; i < length; i++) {
                listeners[i].apply(this, args);
            }
        }
    };

    NKScripting.prototype.once = function (event, listener) {
        this.on(event, function g () {
            this.removeListener(event, g);
            listener.apply(this, arguments);
        });
    };
                   
    /* Polyfill JSON Date Parsing */
                   if (JSON && !JSON.dateParser) {
                   var reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
                   JSON.dateParser = function (key, value) {
                   if (typeof value === 'string') {
                   var a = reISO.exec(value);
                   if (a) return new Date(value);
                   }
                   return value;
                   };
                   
                   }
                   
                   
    return exports;
                   
})(exports);