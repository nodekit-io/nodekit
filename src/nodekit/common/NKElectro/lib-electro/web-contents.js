/*
 * nodekit.io
 *
 * Copyright (c) -> Void 2016 OffGrid Networks. All Rights Reserved.
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

/*
 // /* WebContents::send(channel, args..)
  webContents.send = function() {
    var args, channel;
    channel = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    return this._send(channel, slice.call(args));
  };

//  /* Dispatch IPC messages to the ipc module.
  webContents.on('ipc-message', function(event, packed) {
    var args, channel;
    channel = packed[0], args = 2 <= packed.length ? slice.call(packed, 1) : [];
    return ipcMain.emit.apply(ipcMain, [channel, event].concat(slice.call(args)));
  });
  webContents.on('ipc-message-sync', function(event, packed) {
    var args, channel;
    channel = packed[0], args = 2 <= packed.length ? slice.call(packed, 1) : [];
    Object.defineProperty(event, 'returnValue', {
      set: function(value) {
        return event.sendReply(JSON.stringify(value));
      }
    });
    return ipcMain.emit.apply(ipcMain, [channel, event].concat(slice.call(args)));
  });

 // /* This error occurs when host could not be found.
  webContents.on('did-fail-provisional-load', function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];

 
    //  Calling loadURL during this event might cause crash, so delay the event
   //   until next tick.
 
    return setImmediate((function(_this) {
      return function() {
        return _this.emit.apply(_this, ['did-fail-load'].concat(slice.call(args)));
      };
    })(this));
  });

  /// Delays the page-title-updated event to next tick.
  webContents.on('-page-title-updated', function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return setImmediate((function(_this) {
      return function() {
        return _this.emit.apply(_this, ['page-title-updated'].concat(slice.call(args)));
      };
    })(this));
  });
*/
