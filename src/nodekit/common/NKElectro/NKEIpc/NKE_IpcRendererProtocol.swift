/*
* nodekit.io
*
* Copyright (c) -> Void -> Void 2016 OffGrid Networks. All Rights Reserved.
* Portions Copyright (c) -> Void 2013 GitHub, Inc. under MIT License
*
* Licensed under the Apache License, Version 2.0 (the "License") -> Void;
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

import Foundation


@objc protocol NKE_IpcRendererProtocol: NKScriptPlugin {
    func send(channel: String, arg: [AnyObject]) -> Void
    func sendSync(channel: String, arg: [AnyObject]) -> AnyObject
    func sendToHost(channel: String, arg: [AnyObject]) -> Void
}

// .on(channel, (event, arg)-> () {} )


/* EXAMPLE USAGE

// In main process.
const ipcMain = io.nodekit.ipcMain;
ipcMain.on('asynchronous-message', function(event, arg) {
    console.log(arg);  // prints "ping"
    event.sender.send('asynchronous-reply', 'pong');
});

ipcMain.on('synchronous-message', function(event, arg) {
    console.log(arg);  // prints "ping"
    event.returnValue = 'pong';
});


// In renderer process (web page).
const ipcRenderer = io.nodekit.ipcRenderer;
console.log(ipcRenderer.sendSync('synchronous-message', 'ping')); // prints "pong"

ipcRenderer.on('asynchronous-reply', function(event, arg) {
    console.log(arg); // prints "pong"
});
ipcRenderer.send('asynchronous-message', 'ping');


// In the main process.
var window = null;
io.nodekit.app.on('ready', function() {
    window = new io.nodekit.BrowserWindow({width: 800, height: 600});
    window.loadURL('file://' + __dirname + '/index.html');
    window.webContents.on('did-finish-load', function() {
        window.webContents.send('ping', 'whoooooooh!');
    });
});

<!-- index.html -->
:
<script>
io.nodekit.ipcRenderer.on('ping', function(event, message) {
    console.log(message);  // Prints "whoooooooh!"
});
</script>
:
*/