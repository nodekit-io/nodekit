![NK-Scripting](../images/NKScripting.png?v01)
# NKScriptMessage

Standard message format for communication from JavaScript to native plugins.

## Instance Properties

### `name: String`
The name of the object being passed

### `body: AnyObject`
A composite object that can be serialized over the wire

The conversion is performed as follows, similar to the table
in the Apple WebKit source code, JSValue.h

```
//
// When converting between JavaScript values and Native objects a copy is
// performed. Values of types listed below are copied to the corresponding
// types on conversion in each direction. For NSDictionaries, entries in the
// dictionary that are keyed by strings are copied onto a JavaScript object.
// For dictionaries and arrays, conversion is recursive, with the same object
// conversion being applied to all entries in the collection.
//
//               Swift type          |  Objective-C type  |   JavaScript type
// ----------------------------------+--------------------+---------------------
//    nil                            |        nil         |     undefined
//    NSNull                         |       NSNull       |        null
//   String                          |      NSString      |       string
//  NSNumber, Int32, UInt32, Double  |      NSNumber      |       number
//  Dictionary<NSObject, AnyObject>  |    NSDictionary    |   Object object
//  [AnyObject]!                     |      NSArray       |    Array object
//  NSDate!                          |      NSDate        |     Date object
//  Bool                             |       BOOL         |       boolean
//   
```

## NKScriptMessageHandler delegate

### `func userContentController(didReceiveScriptMessage message: NKScriptMessage)`
Called whenever an asynchronous script message has been received by Native from Javascript

### `func userContentControllerSync(didReceiveScriptMessage message: NKScriptMessage) -> AnyObject!`
Called whenever a synchronous script message has been received by Native from Javascript.  The Javascript engine thread will wait until a reply is sent (generally the blocking is not CPU intensive by using the native dialog prompt or native synchronous thread transfer mechanisms of the platform)