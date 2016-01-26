![NK-Scripting](../images/NKScripting.png?v01)
# NKScriptContextFactory

A factory to create an instance of the native scripting engine.  On Apple (`darwin`) platforms this a `NKScriptContext` can be an extended (enhanced) version of `WKWebView` or the JavascriptCore `JSContext`

## Methods

### `context.createContext(options: [String: AnyObject], cb: NKScriptContextDelegate)`
Creates an engine corresponding to the `Engine` option which is an `NKEngineType`

* `NKEngineType.JavaScriptCore`: Creates a new JavaScript virtual machine and `JSContext`
* `NKEngineType.Nitro`: Creates a hidden `WKWebView` 
* `NKEngineType.UIWebView`: Creates a hidden `WebView` or `UIWebView` and passes the corresponding `JSContext` to the delegate provided

The delegate is called back when the `NKScriptContext` has been identified/created and when it is ready for application usage.

```swift
   NKScriptContextFactory().createContext(["Engine": NKEngineType.JavaScriptCore.rawValue], delegate: self)
   // delegate method
   public func NKScriptEngineLoaded(context: NKScriptContext) -> Void {
      // save a (weak) reference to script context
   }
   // delegate method
   func NKApplicationReady(id: Int, context: NKScriptContext?) -> Void {
       // do something when application ready
   }
```