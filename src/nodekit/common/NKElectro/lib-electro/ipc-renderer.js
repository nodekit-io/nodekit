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
// func ipcSend(channel: String, replyId: String, arg: [AnyObject]) -> Void {
// func ipcReply(dest: Int, channel: String, replyId: String, result: AnyObject) -> Void {
// event "emit", withArguments: ["nk.IPCtoRenderer", item.sender, item.channel, item.replyId, item.arg], completionHandler: nil)
// evet "emit", withArguments: ["nk.IPCReplytoRenderer", item.sender, item.channel, item.replyId, item.arg[0]],

var ipcRenderer = io.nodekit.electro.ipcRenderer

ipcRenderer._init = function() {
    
    this.callbacks = {};
    this.counter = 0;

    this.on('nk.IPCReplytoRenderer', function(sender, channel, replyId, result) {
            this.callbacks[replyId].call(this, null, result);
            delete this.callbacks[replyId];
            });
    
    this.on('nk.IPCtoRenderer', function(sender, channel, replyId, result) {
            
            var event = { 'sender': this }
            
            if ((replyId) !== "") {
            event.sendReply = function(result) {
               this.sender.ipcReply(0, channel, replyId, result);
            }
            
            Object.defineProperty(event, 'returnValue', {
                                  set: function(result) { this.sendReply(result); },
                                  enumerable: true,
                                  configurable: true,
                                  });
            }
            
            this.emit(channel, event, arg)

            });
}

//send(channel [[,arg]...] [,callback])
ipcRenderer.send = function() {
    var slice = Array.prototype.slice;
    var args, channel;
    channel = arguments[0]
    
    if (arguments.length < 2)
    {
        args = []
        callback = null;
    }
    else
    {
        args = slice.call(arguments, 1)
        if (typeof (args[args.length -1]) === "function")
        {
            callback = args[args.length -1]
            if (args.length > 1)
                args = slice.call(args, 0, args.length - 1)
                else
                    args = []
                    } else
                        callback = null;
        
    }
    
    var replyId;
    
    if (callback) {
        replyId = "i" + this.counter++;
        this.callbacks[replyId] = callback;
    } else
        replyId = "";
    
    this.ipcSend(channel, replyId, args)
    
    // TO DO: expire callback table entry in case of non response
};

ipcRenderer._init();
