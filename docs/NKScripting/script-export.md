![NK-Scripting](../images/NKScripting.png?v01)
# NKScriptExport

A protocol representing a native {NK} Scripting plugin. To create a plugin, just create any Swift or Objective-C class that inherits from `NSObject` and (optionally) implements this protocol. 

While plugins can simply be any object that inherits from `NSObject` or can implement a protocol that inherits `JSExport`, the use of `NKScriptExport` allows for improved native-native and javascript-javascript referencing of plugin objects, as well as allows customization of the stub scripts etc.

## Instance Properties

### `channelIdentifier: String { get }`
A unique identifier for the channel used for Native-Javascript communication for this particular instance of this plugin, otherwise generated automatically

## Instance methods

### `func rewriteGeneratedStub(stub: String, forKey: String) -> String`
A callback that is called for each selector/property, and then once with a key of '.local' for the stub inside the `exports` wrapper and then with key of `.global` for the entire stub.  See the source code for {NK} Electro plugins for examples of how to use this method to pair each native plugin with a Javascript code file.

## Class/Static methods

### `static func attachTo(context: NKScriptContext)`
A convenience method to call `NKLoadPlugin` on the context provided, but creating an instance of the plugin as needed.  Allows for loading multiple plugins in easy to read format:

```swift
    NKE_App.attachTo(context);
    NKE_BrowserWindow.attachTo(context);
    NKE_WebContentsBase.attachTo(context);
    NKE_Dialog.attachTo(context);
    NKE_IpcMain.attachTo(context);
    NKE_Menu.attachTo(context);
    NKE_Protocol.attachTo(context);
  ```

### `static func scriptNameForKey(name: UnsafePointer<Int8>) -> String?`
A callback that is called for each property to override the name.  Not generally used but included for completeness


### `static func scriptNameForSelector(selector: Selector) -> String?`
A callback that is called for each method selector to override the name. Typically used to indicate which native `init` method should be mapped to `""` for `new constructor()` calls from Javascript. 

### `static func isKeyExcludedFromScript(name: UnsafePointer<Int8>) -> Bool`
A callback that is called for each property to return true if the property should unusually not be made available to Javascript.  All properties starting with `_` underscore and all private properties are automatically excluded.

### `static func isSelectorExcludedFromScript(name: UnsafePointer<Int8>) -> Bool`
A callback that is called for each method selector to return true if the property should unusually not be made available to Javascript.  All methods starting with `_` underscore and all private properties are automatically excluded.


