![NK-Electro](../images/NKElectro.png?v01)
# ipcRenderer

The `ipcRenderer` module is an instance of the
[EventEmitter](https://nodejs.org/api/events.html) class. It provides a few
methods so you can send synchronous and asynchronous messages from the render
process (web page) to the main process.  You can also receive replies from the
main process.

See [ipcMain](ipc-main.md) for code examples.


## Listening for Messages

The `ipcRenderer` module has the following method to listen for events:

### `ipcRenderer.on(channel, callback)`

* `channel` String - The event name.
* `callback` Function

When the event occurs the `callback` is called with an `event` object and
arbitrary arguments.  

### `ipcRenderer.removeListener(channel, callback)`

* `channel` String - The event name.
* `callback` Function - The reference to the same function that you used for
  `ipcRenderer.on(channel, callback)`

Once done listening for messages, if you no longer want to activate this
callback and for whatever reason can't merely stop sending messages on the
channel, this function will remove the callback handler for the specified
channel.

### `ipcRenderer.removeAllListeners(channel)`

* `channel` String - The event name.

This removes *all* handlers to this ipc channel.

### `ipcMain.once(channel, callback)`

Use this in place of `ipcMain.on()` to fire handlers meant to occur only once,
as in, they won't be activated after one call of `callback`

## Sending Messages

The `ipcRenderer` module has the following methods for sending messages:

### `ipcRenderer.send(channel[, arg1][, arg2][, ...])`

* `channel` String - The event name.
* `arg` (optional)

Send an event to the main process asynchronously via a `channel`, you can also
send arbitrary arguments. The main process handles it by listening for the
`channel` event with `ipcMain`.

## IPC Event

The `event` object passed to the `callback` has the following methods:

### `event.returnValue`

Set this to the value to be returned in a synchronous message.

### `event.sender`

Returns the `webContents` that sent the message, you can call
`event.sender.send` to reply to the asynchronous message, see
[webContents.send](web-contents.md) for more information.
