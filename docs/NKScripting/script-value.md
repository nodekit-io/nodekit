![NK-Scripting](../images/NKScripting.png?v01)
# NKScriptValue

A `NKScriptValue` is a reference to a value within the JavaScript object space of a
a `NKScriptContext` via a particular `NKScriptChannel`. They may be otherwise pure javascript
objects (in which case NKScriptValue is a simple wrapper over the communication channel) or may be hybrid native/javascript objects, otherwise known as {NK} Scripting plugin objects.

 Where an instance method is invoked upon a `NKScriptValue`, and this returns another `NKScriptValue`, the returned JSValue will originate from the same `NKScriptContext` as the `NKScriptValue` on which the method was invoked.

For all methods taking arguments to be passed to JavaScript, arguments will be converted
into a JavaScript value according to the conversion specified in the `NKScriptMessage` documentation.

Passing native objects that cannot be passed by value (e.g., strings, numbers, booleans, are all passed by value) but that do inherit `NKScriptExport` will be passed using their corresponding NKScriptValue wrapper (if it exists).
 
## Instance Methods

### `constructWithArguments(arguments: [AnyObject]!, completionHandler: ((AnyObject?, NSError?) -> Void)?)`
Call this value as a constructor passing the specified arguments.

### `constructWithArguments(arguments: [AnyObject]!) throws -> AnyObject`
Call this value as a constructor passing the specified arguments.

### `callWithArguments(arguments: [AnyObject]!, completionHandler: ((AnyObject?, NSError?) -> Void)?)`
Call this value as a function passing the specified arguments.

### `callWithArguments(arguments: [AnyObject]!) -> AnyObject!`
Call this value as a function passing the specified arguments.

### `callWithArguments(arguments: [AnyObject]!, error: NSErrorPointer) -> AnyObject!`
Call this value as a function passing the specified arguments.

### `invokeMethod(method: String!, withArguments arguments: [AnyObject]!, completionHandler: ((AnyObject?, NSError?) -> Void)?)`
Access the property named "method" from this value; call the value resulting
from the property access as a function, passing this value as the "this"
value, and the specified arguments.

### `invokeMethod(method: String!, withArguments arguments: [AnyObject]!) throws -> AnyObject!`
Access the property named "method" from this value; call the value resulting
from the property access as a function, passing this value as the "this"
value, and the specified arguments.
 
### `invokeMethod(method: String!, withArguments arguments: [AnyObject]!, error: NSErrorPointer) -> AnyObject!`
Access the property named "method" from this value; call the value resulting
from the property access as a function, passing this value as the "this"
value, and the specified arguments.

### `defineProperty(property: String!, descriptor: AnyObject!)` 
This method may be used to create a data or accessor property on an object;
this method operates in accordance with the Object.defineProperty method in
the JavaScript language.

### `deleteProperty(property: String!) -> Bool`
Delete a property from the value, returns YES if deletion is successful

### `hasProperty(property: String!) -> Bool`
Returns YES if property is present on the value.
This method has the same function as the JavaScript operator "in".

### `valueForProperty(property: String!) -> AnyObject?`
Access a property from the value. This method will return the JavaScript value
'undefined' if the property does not exist.

### `setValue(value: AnyObject!, forProperty property: String!)`
Set a property on the value

### `valueAtIndex(index: Int) -> AnyObject?`
Access an indexed property from the value. This method will return the
JavaScript value 'undefined' if no property exists at that index. 

### `setValue(value: AnyObject!, atIndex index: Int)`
Set an indexed property on the value. For NKScriptValues that are JavaScript arrays, 
indices greater than UINT_MAX - 1 will not affect the length of the array
