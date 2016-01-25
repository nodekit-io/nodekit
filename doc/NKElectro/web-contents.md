![NK-Electro](../images/NKElectro.png?v01)
# WebContents

`WebContents` is an
[EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter).

It is responsible for rendering and controlling a web page and is a property of
the [`BrowserWindow`](browser-window.md) object. An instance is created for you automatically whenever a BrowserWindow is created.  An example of accessing the
`webContents` object:

```javascript
const BrowserWindow = require('electro').BrowserWindow;

var win = new BrowserWindow({width: 800, height: 1500});
win.loadURL("http://nodekit.io");

var webContents = win.webContents;
```

## Events

The `WebContents` object emits the following events:

### Event: 'did-finish-load'

Emitted when the navigation is done, i.e. the spinner of the tab has stopped
spinning, and the `onload` event was dispatched.

### Event: 'did-fail-load'

Returns:

* `event` Event
* `errorCode` Integer
* `errorDescription` String
* `validatedURL` String

This event is like `did-finish-load` but emitted when the load failed or was
cancelled, e.g. `window.stop()` is invoked.
The full list of error codes and their meaning is available [here](https://code.google.com/p/chromium/codesearch#chromium/src/net/base/net_error_list.h).

## Instance Methods

The `WebContents` object has the following instance methods:

### `webContents.loadURL(url[, options])`

* `url` URL
* `options` Object (optional), properties:
  * `httpReferrer` String - A HTTP Referrer url.
  * `userAgent` String - A user agent originating the request.
  * `extraHeaders` String - Extra headers separated by "\n"

Loads the `url` in the window, the `url` must contain the protocol prefix,
e.g. the `http://` or `file://`. If the load should bypass http cache then
use the `pragma` header to achieve it.

```javascript
const options = {"extraHeaders" : "pragma: no-cache\n"}
webContents.loadURL(url, options)
```

### `webContents.getURL()`

Returns URL of the current web page.

```javascript
var win = new BrowserWindow({width: 800, height: 600});
win.loadURL("http://github.com");

var currentURL = win.webContents.getURL();
```

### `webContents.getTitle()`

Returns the title of the current web page.

### `webContents.isLoading()`

Returns whether web page is still loading resources.

### `webContents.stop()`

Stops any pending navigation.

### `webContents.reload()`

Reloads the current web page.

### `webContents.reloadIgnoringCache()`

Reloads current page and ignores cache.

### `webContents.canGoBack()`

Returns whether the browser can go back to previous web page.

### `webContents.canGoForward()`

Returns whether the browser can go forward to next web page.

### `webContents.goBack()`

Makes the browser go back a web page.

### `webContents.goForward()`

Makes the browser go forward a web page.

### `webContents.setUserAgent(userAgent)`

* `userAgent` String

Overrides the user agent for this web page.

### `webContents.getUserAgent()`

Returns a `String` representing the user agent for this web page.

### `webContents.executeJavaScript(code[, userGesture])`

* `code` String
* `userGesture` Boolean (optional)

Evaluates `code` in page.

### `webContents.send(channel[, arg1][, arg2][, ...])`

* `channel` String
* `arg` (optional)

Send an asynchronous message to renderer process via `channel`, you can also
send arbitrary arguments. The renderer process can handle the message by
listening to the `channel` event with the `ipcRenderer` module.

An example of sending messages from the main process to the renderer process:

```javascript
// In the main process.
var window = null;
app.on('ready', function() {
  window = new BrowserWindow({width: 800, height: 600});
  window.loadURL('file://' + __dirname + '/index.html');
  window.webContents.on('did-finish-load', function() {
    window.webContents.send('ping', 'whoooooooh!');
  });
});
```

```html
<!-- index.html -->
<html>
<body>
  <script>
    require('electro').ipcRenderer.on('ping', function(event, message) {
      console.log(message);  // Prints "whoooooooh!"
    });
  </script>
</body>
</html>
```
