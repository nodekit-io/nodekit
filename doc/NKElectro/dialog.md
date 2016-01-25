![NK-Electro](../images/NKElectro.png?v01)
# dialog

The `dialog` module provides APIs to show native system dialogs, such as opening
files or alerting, so web applications can deliver the same user experience as
native applications.

An example of showing a dialog to select multiple files and directories:

```javascript
var win = ...;  // BrowserWindow in which to show the dialog
const dialog = require('electro').dialog;
console.log(dialog.showOpenDialog({ properties: [ 'openFile', 'openDirectory', 'multiSelections' ]}));
```

## Methods

The `dialog` module has the following methods:

### `dialog.showOpenDialog([browserWindow, ]options[, callback])`

* `browserWindow` BrowserWindow (optional)
* `options` Object
  * `title` String
  * `defaultPath` String
  * `filters` Array
  * `properties` Array - Contains which features the dialog should use, can
    contain `openFile`, `openDirectory`, `multiSelections` and
    `createDirectory`
* `callback` Function (optional)

On success this method returns an array of file paths chosen by the user,
otherwise it returns `undefined`.

The `filters` specifies an array of file types that can be displayed or
selected when you want to limit the user to a specific type. For example:

```javascript
{
  filters: [
    { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
    { name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] },
    { name: 'Custom File Type', extensions: ['as'] },
    { name: 'All Files', extensions: ['*'] }
  ]
}
```

The `extensions` array should contain extensions without wildcards or dots (e.g.
`'png'` is good but `'.png'` and `'*.png'` are bad). To show all files, use the
`'*'` wildcard (no other wildcard is supported).

If a `callback` is passed, the API call will be asynchronous and the result
will be passed via `callback(filenames)`

### `dialog.showSaveDialog([browserWindow, ]options[, callback])`

* `browserWindow` BrowserWindow (optional)
* `options` Object
  * `title` String
  * `defaultPath` String
  * `filters` Array
* `callback` Function (optional)

On success this method returns the path of the file chosen by the user,
otherwise it returns `undefined`.

The `filters` specifies an array of file types that can be displayed, see
`dialog.showOpenDialog` for an example.

If a `callback` is passed, the API call will be asynchronous and the result
will be passed via `callback(filename)`

### `dialog.showMessageBox([browserWindow, ]options[, callback])`

 * `browserWindow` BrowserWindow (optional)
 * `options` Object
   * `type` String - Can be `"none"`, `"info"`, `"error"`, or `"warning"`. 
   * `buttons` Array - Array of texts for buttons.
   * `message` String - Content of the message box.
   * `detail` String - Extra information of the message.
 * `callback` Function

Shows a message box, it will block the process until the message box is closed.
It returns the index of the clicked button.

If a `callback` is passed, the API call will be asynchronous and the result
will be passed via `callback(response)`.

### `dialog.showErrorBox(title, content)`

Displays a modal dialog that shows an error message.

This API can be called safely before the `ready` event the `app` module emits,
it is usually used to report errors in early stage of startup. 
