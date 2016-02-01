/*
* nodekit.io
*
* Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
* Portions Copyright 2015 XWebView
* Portions Copyright (c) 2014 Intel Corporation.  All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

import Foundation

public class NKScriptValue: NSObject {

    public let namespace: String
    private weak var _channel: NKScriptChannel?
    public var channel: NKScriptChannel { return _channel!; }
    public var context: NKScriptContext! { return _channel!.context!; }
    weak var origin: NKScriptValue!

    // This object is a plugin object.
    init(namespace: String, channel: NKScriptChannel, origin: NKScriptValue?) {
        self.namespace = namespace
        self._channel = channel
        super.init()
        self.origin = origin ?? self
    }

    // The object is a stub for a JavaScript object which was retained as an argument.
    private var reference = 0
    convenience init(reference: Int, channel: NKScriptChannel, origin: NKScriptValue) {
        let namespace = "\(origin.namespace).$references[\(reference)]"
        self.init(namespace: namespace, channel: channel, origin: origin)
        self.reference = reference
    }

    deinit {
        let script: String
        if reference == 0 {
            script = "delete \(namespace)"
        } else if origin != nil {
            script = "\(origin.namespace).$releaseObject(\(reference))"
        } else {
            assertionFailure()
            return
        }
        context?.NKevaluateJavaScript(script, completionHandler: nil)
    }

    // Create from, Convert to and Compare with Native Objects
    //    init!(object value: AnyObject!, inContext context: NKScriptContext!)
    //   func toObject() -> AnyObject!
    //   func toObjectOfClass(expectedClass: AnyClass!) -> AnyObject!
    //  func isEqualToObject(value: AnyObject!) -> Bool
    //  func isEqualWithTypeCoercionToObject(value: AnyObject!) -> Bool
    //  func isInstanceOf(value: AnyObject!) -> Bool

    
    public func testLog() {
        log("testLog");
    }

    // Async JavaScript object operations
    public func constructWithArguments(arguments: [AnyObject]!, completionHandler: ((AnyObject?, NSError?) -> Void)?) {
        let exp = "new " + scriptForCallingMethod(nil, arguments: arguments)
        evaluateExpression(exp, completionHandler: completionHandler)
    }
   
    public func callWithArguments(arguments: [AnyObject]!, completionHandler: ((AnyObject?, NSError?) -> Void)?) {
        dispatch_async(NKScriptChannel.defaultQueue) {() -> Void in
            
            let exp = self.scriptForCallingMethod(nil, arguments: arguments)
            self.evaluateExpression(exp, completionHandler: completionHandler)
        }
    }
  
    public func invokeMethod(method: String!, withArguments arguments: [AnyObject]!, completionHandler: ((AnyObject?, NSError?) -> Void)?) {
        dispatch_async(NKScriptChannel.defaultQueue) {() -> Void in
            
            let exp = self.scriptForCallingMethod(method, arguments: arguments)
            self.evaluateExpression(exp, completionHandler: completionHandler)
        }
    }
  
    public func defineProperty(property: String!, descriptor: AnyObject!) {
        let exp = "Object.defineProperty(\(namespace), \(property), \(self.context.NKserialize(descriptor)))"
        evaluateExpression(exp, completionHandler: nil)
    }
    
    public func deleteProperty(property: String!) -> Void {
        evaluateExpression("delete \(scriptForFetchingProperty(property))", completionHandler: nil)
    }
 
    public func hasProperty(property: String!, completionHandler: ((AnyObject?, NSError?) -> Void)?) {
        evaluateExpression("\(scriptForFetchingProperty(property)) != undefined", completionHandler: completionHandler)
    }
    
    public func valueForProperty(property: String!, completionHandler: ((AnyObject?, NSError?) -> Void)?) {
        evaluateExpression(scriptForFetchingProperty(property), completionHandler: completionHandler)
    }
    
    public func setValue(value: AnyObject!, forProperty property: String!) {
        context?.NKevaluateJavaScript(scriptForUpdatingProperty(property, value: value), completionHandler: nil)
    }
    
    public func valueAtIndex(index: Int, completionHandler: ((AnyObject?, NSError?) -> Void)?) {
        evaluateExpression("\(namespace)[\(index)]", completionHandler: completionHandler)
    }
    
    public func setValue(value: AnyObject!, atIndex index: Int) {
        context?.NKevaluateJavaScript("\(namespace)[\(index)] = \(self.context.NKserialize(value))", completionHandler: nil)
    }
    
    // Private JavaScript scripts and helpers
    
    private func scriptForFetchingProperty(name: String!) -> String {
        if name == nil {
            return namespace
        } else if name.isEmpty {
            return "\(namespace)['']"
        } else if let idx = Int(name) {
            return "\(namespace)[\(idx)]"
        } else {
            return "\(namespace).\(name)"
        }
    }
    private func scriptForUpdatingProperty(name: String!, value: AnyObject?) -> String {
        return scriptForFetchingProperty(name) + " = " + self.context.NKserialize(value)
    }
    private func scriptForCallingMethod(name: String!, arguments: [AnyObject]?) -> String {

        let args = arguments?.map(NKserialize) ?? []
        return "(function line_eval(){ try { return " + scriptForFetchingProperty(name) + "(" + args.joinWithSeparator(", ") + ")" + "} catch(ex) { console.log(ex.toString()); return ex} })()"
    }

    private func NKserialize(object: AnyObject?) -> String {
        var obj: AnyObject? = object
        if let val = obj as? NSValue {
            obj = val as? NSNumber ?? val.nonretainedObjectValue
        }

        if let o = obj as? NKScriptValue {
            return o.namespace
        } else if let o1 = obj as? NKScriptExport {
            if let o2 = o1 as? NSObject {
                if let scriptObject = o2.NKscriptObject {
                    return scriptObject.namespace
                } else {
                    let scriptObject = NKScriptValueNative(object: o2, inContext: self.context)
                    objc_setAssociatedObject(o2, unsafeAddressOf(NKScriptValue), scriptObject, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
                    return scriptObject.namespace
                }
            }
        } else if let s = obj as? String {
            let d = try? NSJSONSerialization.dataWithJSONObject([s], options: NSJSONWritingOptions(rawValue: 0))
            let json = NSString(data: d!, encoding: NSUTF8StringEncoding)!
            return json.substringWithRange(NSMakeRange(1, json.length - 2))
        } else if let n = obj as? NSNumber {
            if CFGetTypeID(n) == CFBooleanGetTypeID() {
                return n.boolValue.description
            }
            return n.stringValue
        } else if let date = obj as? NSDate {
            return "\"\(date.toJSONDate())\""
        } else if let _ = obj as? NSData {
            // TODO: map to Uint8Array object
        } else if let a = obj as? [AnyObject] {
            return "[" + a.map(self.NKserialize).joinWithSeparator(", ") + "]"
        } else if let d = obj as? [String: AnyObject] {
            return "{" + d.keys.map {"\"\($0)\": \(self.NKserialize(d[$0]!))"}.joinWithSeparator(", ") + "}"
        } else if obj === NSNull() {
            return "null"
        } else if obj == nil {
            return "undefined"
        }
        return "'\(obj!.description)'"
    }

   private func evaluateExpression(expression: String, completionHandler: ((AnyObject?, NSError?) -> Void)?) {
        guard let completionHandler = completionHandler else {
            context?.NKevaluateJavaScript(expression, completionHandler: nil)
            return
        }
        context?.NKevaluateJavaScript(scriptForRetaining(expression)) {
            [weak self](result: AnyObject?, error: NSError?)->Void in
            completionHandler(self?.wrapScriptObject(result) ?? result, error)
        }
    }

    private func scriptForRetaining(script: String) -> String {
        return origin != nil ? "\(origin.namespace).$retainObject(\(script))" : script
    }

    internal func wrapScriptObject(object: AnyObject!) -> AnyObject! {
        if let dict = object as? [String: AnyObject] where dict["$sig"] as? NSNumber == 0x5857574F {
            if let num = dict["$ref"] as? NSNumber {
                return NKScriptValue(reference: num.integerValue, channel: channel, origin: self)
            } else if let namespace = dict["$ns"] as? String {
                return NKScriptValue(namespace: namespace, channel: channel, origin: self)
            }
        }
        return object
    }
}

extension NKScriptValue {
    // DOM objects
    public var windowObject: NKScriptValue { get {
        return NKScriptValue(namespace: "window", channel: self.channel, origin: self.origin) }
    }
    public var documentObject: NKScriptValue { get {
        return NKScriptValue(namespace: "document", channel: self.channel, origin: self.origin) }
    }
}
