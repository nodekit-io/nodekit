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

var electro = {
    'app': io.nodekit.electro.app,
    'autoUpdater': "not implemented",
    'BrowserWindow': io.nodekit.electro.BrowserWindow,
    'contentTracing': "not implemented",
    'dialog': io.nodekit.electro.dialog,
    'ipcMain': io.nodekit.electro.ipcMain,
    'Menu': io.nodekit.electro.Menu,
    'MenuItem': io.nodekit.electro.MenuItem,
    'powerMonitor': "not implemented",
    'powerSaveBlocker': "not implemented",
    'protocol': io.nodekit.electro.protocol,
    'session': "not implemented",
    'WebContents': io.nodekit.electro.WebContents,
    'Tray': "not implemented"
}

electro.protocol.createServer = require('electro_protocol').createServer

module.exports = electro