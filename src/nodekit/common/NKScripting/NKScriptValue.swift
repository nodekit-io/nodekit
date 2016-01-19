public protocol NKScriptValue {
    
    var context: NKScriptContext! { get }
    var namespace: String {get}
    var channel: NKScriptChannel { get }
  
    func callWithArguments(arguments arguments: [AnyObject]!, completionHandler: ((AnyObject?, NSError?) -> Void)?)
    func invokeMethod(method: String!, withArguments arguments: [AnyObject]!, completionHandler: ((AnyObject?, NSError?) -> Void)?)
    func callWithArguments(arguments arguments: [AnyObject]!) throws -> AnyObject!
    func invokeMethod(method: String!, withArguments arguments: [AnyObject]!) throws -> AnyObject!
    func callWithArguments(arguments arguments: [AnyObject]!, error: NSErrorPointer) -> AnyObject!
    func invokeMethod(method: String!, withArguments arguments: [AnyObject]!, error: NSErrorPointer) -> AnyObject!
    func constructWithArguments(arguments arguments: [AnyObject]!, completionHandler: ((AnyObject?, NSError?) -> Void)?)
    func constructWithArguments(arguments arguments: [AnyObject]!) throws -> AnyObject
    
    func defineProperty(property: String!, descriptor: AnyObject!)
    func deleteProperty(property: String!) -> Bool
    func hasProperty(property: String!) -> Bool
    func valueForProperty(property: String!) -> AnyObject?
    func setValue(value: AnyObject!, forProperty property: String!)
    func valueAtIndex(index: Int) -> AnyObject?
    func setValue(value: AnyObject!, atIndex index: Int)
    
    subscript(name: String) -> AnyObject? {get set}
    subscript(index: Int) -> AnyObject? {get set}
    var windowObject: NKScriptValueObject {get }
    var documentObject: NKScriptValueObject {get }
}