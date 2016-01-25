![NK-Electro](../images/NKElectro.png?v01)
# protocol

The `protocol` module can register a custom protocol or intercept an existing
protocol.

An example of implementing a protocol that has the same effect as the
`file://` protocol:

```javascript
const electro = require('electro');
const app = electron.app;
const path = require('path');

app.on('ready', function() {
    var protocol = electro.protocol;
    protocol.registerFileProtocol('nk', function(request, callback) {
      var url = request.url.substr(7);
      callback({path: path.normalize(__dirname + '/' + url)});
    }, function (error) {
      if (error)
        console.error('Failed to register protocol')
    });
});
```

**Note:** This module is recommended only be used after the `ready` event in the `app`
module is emitted

## Methods

The `protocol` module has the following methods:

### `protocol.createServer(scheme, [handler])`

* `scheme` String
* `handler` Function (optional)

Registers a protocol of `scheme` that will return a `BrowserServer` object that is behaves almost identically to the `http` server in Node.js.  You can listen to requests (or provide a handler that is automatically subscribed to the request event), and the callback is called using a standard `function(req, res)` signature just like a node server.  In fact you can also call the `listen(host, port)` method on the `BrowserServer` object to also start an http server using the same handler.

The remaining methods are included for compatibility with Electron, but we recommend transitioning to the createServer approach.

### `protocol.registerFileProtocol(scheme, handler[, completion])`

* `scheme` String
* `handler` Function
* `completion` Function (optional)

Registers a protocol of `scheme` that will send the file as a response. The
`handler` will be called with `handler(request, callback)` when a `request` is
going to be created with `scheme`. `completion` will be called with
`completion(null)` when `scheme` is successfully registered or
`completion(error)` when failed.

To handle the `request`, the `callback` should be called with either the file's
path or an object that has a `path` property, e.g. `callback(filePath)` or
`callback({path: filePath})`.

When `callback` is called with nothing, a number, or an object that has an
`error` property, the `request` will fail with the `error` number you
specified. 

### `protocol.registerBufferProtocol(scheme, handler[, completion])`

* `scheme` String
* `handler` Function
* `completion` Function (optional)

Registers a protocol of `scheme` that will send a `Buffer` as a response. The
`callback` should be called with either a `Buffer` object or an object that
has the `data` and `mimeType` properties (`charset` not required as already implicit in `Buffer` definition)

Example:

```javascript
protocol.registerBufferProtocol('nk', function(request, callback) {
  callback({mimeType: 'text/html', data: new Buffer('<h5>Response</h5>')});
}, function (error) {
  if (error)
    console.error('Failed to register protocol')
});
```

### `protocol.registerStringProtocol(scheme, handler[, completion])`

* `scheme` String
* `handler` Function
* `completion` Function (optional)

Registers a protocol of `scheme` that will send a `String` as a response. The
`callback` should be called with either a `String` or an object that has the
`data`, `mimeType`, and `charset` properties.

### `protocol.registerHttpProtocol(scheme, handler[, completion])`

* `scheme` String
* `handler` Function
* `completion` Function (optional)

Registers a protocol of `scheme` that will send an HTTP request as a response.
The `callback` should be called with an object that has the `url`, `method`,
`referrer`, `uploadData` and `session` properties.  

Currently only `url` is supported, but this enables 302 URL redirects.


### `protocol.unregisterProtocol(scheme[, completion])`

* `scheme` String
* `completion` Function (optional)

Unregisters the custom protocol of `scheme`.

### `protocol.isProtocolHandled(scheme, callback)`

* `scheme` String
* `callback` Function

The `callback` will be called with a boolean that indicates whether there is
already a handler for `scheme`.

