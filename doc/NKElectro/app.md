![NK-Electro](../images/NKElectro.png?v01)
{NK} Electro is an API for {NK} NodeKit applications that facilitate application lifecycle and user interface tasks.  It is inspired by the Atom Electron application programming interface, and is generally a lighter-weight but code-compatible subset.

# app

The `app` module is responsible for controlling the application's lifecycle.

The following example shows how to open the main window when the application is ready to start:

```javascript
const app = require('electro').app;
const BrowserWindow = require('electro').BrowserWindow
app.on('ready', function() {
  var window = new BrowserWindow();
});
```

## Events

The `app` object emits the following events:

### Event: 'will-finish-launching'

Emitted when the application has finished basic startup. In most cases, you should just do everything in the `ready` event handler.

### Event: 'ready'

Emitted when {NK} has finished initialization.

### Event: 'will-quit'

Emitted when all windows have been closed and the application will quit.

### Event: 'quit'

Emitted when the application is quitting.

## Methods

The `app` object has the following methods:

### `app.quit()`

Try to close all windows and exit immediately. 

### `app.exit(exitCode)`

* `exitCode` Integer

Exits immediately with `exitCode`.

All windows will be closed immediately without asking user and the `before-quit`
and `will-quit` events will not be emitted.

### `app.getAppPath()`

Returns the current application directory.

### `app.getPath(name)`

* `name` String

Retrieves a path to a special directory or file associated with `name`. On
failure an `Error` is thrown.

You can request the following paths by the name:

* `home` User's home directory.
* `appData` Per-user application data directory, which by default points to:
  * `%APPDATA%` on Windows
  * `$XDG_CONFIG_HOME` or `~/.config` on Linux
  * `~/Library/Application Support` on OS X
* `userData` The directory for storing your app's configuration files, which by
  default it is the `appData` directory appended with your app's name.
* `temp` Temporary directory.
* `exe` The current executable file.
* `module` The `libchromiumcontent` library.
* `desktop` The current user's Desktop directory.
* `documents` Directory for a user's "My Documents".
* `downloads` Directory for a user's downloads.
* `music` Directory for a user's music.
* `pictures` Directory for a user's pictures.
* `videos` Directory for a user's videos.

### `app.getVersion()`

Returns the version of the loaded application (from the application's `package.json` file).

### `app.getName()`

Returns the current application's name, which is the name in the application's
`package.json` file.

Usually the `name` field of `package.json` is a short lowercased name, according
to the npm modules spec. 

