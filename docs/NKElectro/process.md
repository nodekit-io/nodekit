![NK-Electro](../images/NKElectro.png?v01)
# process

The `process` object in {NK} Electro has the following differences from the one in
upstream node:

* `process.type` String - Process's type, can be `browser` (i.e. main process)
  or `renderer`.
* `process.resourcesPath` String - Path to JavaScript source code.
* `process.mas` Boolean - For OS X build, this value is `true` (for Mac App Store), for
  other builds it is `undefined`.

