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

var BrowserWindow = io.nodekit.electro.BrowserWindow

var _browserWindows = {}

BrowserWindow.prototype._init = function() {
    this._id = this.id;
    _browserWindows["w" + this._id] = this;
};

BrowserWindow.prototype._deinit = function() {
    delete _browserWindows["w" + this._id];
    this.webContents._deinit();
    this.webContents = nil;
    this._id = nil;
};


BrowserWindow.fromId = function(id) {
    return _browserWindows["w" + id];
};

BrowserWindow.getAllWindows = function() {
    return Object.keys(_browserWindows).map(function (key) {return _browserWindows[key]});
};

BrowserWindow.getFocusedWindow = function() {
    var i, len, window, windows;
    windows = BrowserWindow.getAllWindows();
    for (i = 0, len = windows.length; i < len; i++) {
        window = windows[i];
        if (window.isFocused()) {
            return window;
        }
    }
    return null;
};

BrowserWindow.fromWebContents = function(webContents) {
    var i, len, ref1, window, windows;
    windows = BrowserWindow.getAllWindows();
    for (i = 0, len = windows.length; i < len; i++) {
        window = windows[i];
        if ((ref1 = window.webContents) != null ? ref1.equal(webContents) : void 0) {
            return window;
        }
    }
};

/* Helpers. */

BrowserWindow.prototype.loadURL = function() {
    return this.webContents.loadURL.apply(this.webContents, arguments);
};

BrowserWindow.prototype.getURL = function() {
    return this.webContents.getURL();
};

BrowserWindow.prototype.reload = function() {
    return this.webContents.reload.apply(this.webContents, arguments);
};

BrowserWindow.prototype.send = function() {
    return this.webContents.send.apply(this.webContents, arguments);
};

BrowserWindow.prototype.openDevTools = function() {
    return this.webContents.openDevTools.apply(this.webContents, arguments);
};

BrowserWindow.prototype.closeDevTools = function() {
    return this.webContents.closeDevTools();
};

BrowserWindow.prototype.isDevToolsOpened = function() {
    return this.webContents.isDevToolsOpened();
};

BrowserWindow.prototype.isDevToolsFocused = function() {
    return this.webContents.isDevToolsFocused();
};

BrowserWindow.prototype.toggleDevTools = function() {
    return this.webContents.toggleDevTools();
};

BrowserWindow.prototype.inspectElement = function() {
    return this.webContents.inspectElement.apply(this.webContents, arguments);
};

BrowserWindow.prototype.inspectServiceWorker = function() {
    return this.webContents.inspectServiceWorker();
};
