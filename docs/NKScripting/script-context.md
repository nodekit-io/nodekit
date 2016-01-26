![NK-Scripting](../images/NKScripting.png?v01)
# NKScriptContext

A protocol representing a native scripting engine.  On Apple (`darwin`) platforms this a `NKScriptContext` can be an extended (enhanced) version of `WKWebView` or the JavascriptCore `JSContext`

The following example shows how to create a `NKScriptContext`:

```swift
   NKScriptContextFactory().createContext(["Engine": NKEngineType.JavaScriptCore.rawValue], delegate: self)
```

## Properties

### var NKid: Int { get }
A unique identifier for the `NKScriptContext`

## Methods

### `context.NKloadPlugin(object: AnyObject, namespace: String, options: Dictionary<String, AnyObject>) -> AnyObject?`
Load the {NK} Plugin represented by the object or class provided at the given Javascript namespace.  A class instance (object) should be provided for singleton plugins; the instance will represent the principal.  A class (`.self`) is provided for plugins for which the class constructor can be called (from Javascript or other native plugins).  For example:

```javascript
context.NKloadPlugin(NKC_FileSystem(), namespace: "io.nodekit.fs", options: [String:AnyObject]());
context.NKloadPlugin(NKEBrowserWindow, namespace: "io.nodekit.electro.BrowserWindow", options: [String:AnyObject]());
```

### `context.NKinjectJavaScript(script: NKScriptSource) -> AnyObject?`
Inject the script source code represented by the `NKScriptSource` into the Javascript context.  It will be executed upon injection. Return an object which must be retained by the caller (to avoid garbage collection)

```javascript
// Inject script
let script = context.NKinjectJavaScript(NKScriptSource(source: "console.log('hello world')", asFilename: "test.js"))
//
// Retain object on context using a class name HelloWorldTest
objc_setAssociatedObject(context, unsafeAddressOf(HelloWorldTest), script, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN)
```

### `context.NKevaluateJavaScript(javaScriptString: String, completionHandler: ((AnyObject?,NSError?) -> Void)?)`
Evaluate the script source code represented by the `String` in the current Javascript context;  no object is retained, and unlike injection if the context reloads this script will generally not be re-executed
This is generally a simple wrapper over the native `WKWebView` or `JSContext` methods which are similar but not identically named.

### `context.NKevaluateJavaScript(script: String) throws -> AnyObject?`
Synchronous version (Swift)

### `context.NKevaluateJavaScript(script: String, error: NSErrorPointer) -> AnyObject?`
Synchronous version (Objective-C)

### `context.NKserialize(object: AnyObject?) -> String`
Internal method used to serialize a composite object;  for example dates are converted to ISO JSON format, native objects known to `NKScripting` (by adherance to `NKScriptExport` protocol) are passed by Javascript reference (created if necessary), etc..   Since the communicaiton method varies by javascript engine host (JavascriptCore vs WKWebView vs UIWebView etc. ), its possible that different serialization results may be needed.