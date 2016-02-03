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

// Binding Protocol
// func ipcSend(channel: String, replyId: String, arg: [AnyObject]) -> Void
// func ipcReply(dest: Int, channel: String, replyId: String, result: AnyObject) -> Void
// event "nk.IPCtoMain": item.sender, item.channel, item.replyId, item.arg
// event "nk.IPCReplytoMain": item.sender, item.channel, item.replyId, item.arg[0]

var ipcMain = io.nodekit.electro.ipcMain

ipcMain.on('nk.IPCtoMain', function (sender, channel, replyId, arg) {
    var webContents = io.nodekit.electro.BrowserWindow.fromId(sender).webContents;

    var event = { 'sender': webContents }

    if ((replyId) !== "") {
        event.sendReply = function (result) {
            this.sender.ipcReply(0, channel, replyId, result);
        }

        Object.defineProperty(event, 'returnValue', {
            set: function (result) { this.sendReply(result); },
            enumerable: true,
            configurable: true,
        });
    }

    this.emit(channel, event, arg)
});

ipcMain.on('nk.IPCReplytoMain', function (sender, channel, replyId, result) {
    var webContents = io.nodekit.electro.BrowserWindow.fromId(sender).webContents;

    var event = { 'sender': webContents }

    if ((replyId) !== "") {
        event.reply = function (result) {
            this.sender.ipcReply(0, channel, replyId, result);
        }

        Object.defineProperty(event, 'returnValue', {
            set: function (newValue) { this.reply(result); },
            enumerable: true,
            configurable: true,
        });
    }

    this.emit(channel, event, arg)
});