![NK-Electro](../images/NKElectro.png?v01)
# BrowserWindow

The `BrowserWindow` class gives you the ability to create a browser window. For
example:

```javascript
// In the main process.
const BrowserWindow = require('electro').BrowserWindow;

var win = new BrowserWindow({ width: 800, height: 600, show: false });
win.on('closed', function() {
  win = null;
});

win.loadURL('https://nodekit.io');
win.show();
```

## Class: BrowserWindow

`BrowserWindow` is an
[EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter).

It creates a new `BrowserWindow` with native properties as set by the `options`.

### `new BrowserWindow([options])`

* `options` Object
  * `width` Integer - Window's width in pixels. Default is `800`.
  * `height` Integer - Window's height in pixels. Default is `600`.
  * `title` String - Default window title. Default is `"Electron"`.
  * `backgroundColor` String - Window's background color as Hexadecimal value,
    like `#66CD00` or `#FFF` or `#80FFFFFF` (alpha is supported). Default is
    `#000` (black) for Linux and Windows, `#FFF` for Mac (or clear if
    transparent).
  

## Events

The `BrowserWindow` object emits the following events:

### Event: 'did-finish-load'

Emitted when the navigation is done, i.e. the spinner of the tab has stopped
spinning, and the `onload` event was dispatched.

### Event: 'did-fail-load'

This event emitted when the load failed or was cancelled.


## Methods

The `BrowserWindow` object has the following methods:

### `BrowserWindow.getAllWindows()`

Returns an array of all opened browser windows.

### `BrowserWindow.getFocusedWindow()`

Returns the window that is focused in this application, otherwise returns `null`.

### `BrowserWindow.fromWebContents(webContents)`

* `webContents` [WebContents](web-contents.md)

Find a window according to the `webContents` it owns.

### `BrowserWindow.fromId(id)`

* `id` Integer

Find a window according to its ID.

## Instance Properties

Objects created with `new BrowserWindow` have the following properties:

```javascript
// In this example `win` is our instance
var win = new BrowserWindow({ width: 800, height: 600 });
```

### `win.webContents`

The `WebContents` object this window owns, all web page related events and
operations will be done via it.

See the [`webContents` documentation](web-contents.md) for its methods and
events.

### `win.id`

The unique ID of this window.

## Instance Methods

Objects created with `new BrowserWindow` have the following instance methods:

### `win.close()`

Try to close the window, this has the same effect with user manually clicking
the close button of the window. 

### `win.loadURL(url[, options])`

Same as `webContents.loadURL(url[, options])`.

### `win.reload()`

Same as `webContents.reload`.


### `win.show()`

Shows and gives focus to the window.


### `win.hide()`

Hides the window.

