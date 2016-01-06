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

public class NKScriptObject : NSObject {
    public let namespace: String
    public unowned let channel: NKScriptChannel
    public var context: NKScriptContext? { return channel.context }
    weak var origin: NKScriptObject!

    // This object is a plugin object.
    init(namespace: String, channel: NKScriptChannel, origin: NKScriptObject?) {
        self.namespace = namespace
        self.channel = channel
        super.init()
        self.origin = origin ?? self
    }

    // The object is a stub for a JavaScript object which was retained as an argument.
    private var reference = 0
    convenience init(reference: Int, channel: NKScriptChannel, origin: NKScriptObject) {
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
        context?.evaluateJavaScript(script, completionHandler: nil)
    }

    // Evaluate JavaScript expression
    public func evaluateExpression(expression: String) throws -> AnyObject? {
        return wrapScriptObject(try context?.evaluateJavaScript(scriptForRetaining(expression)))
    }
    public func evaluateExpression(expression: String, error: NSErrorPointer) -> AnyObject? {
        return wrapScriptObject(context?.evaluateJavaScript(expression, error: error))
    }
    public func evaluateExpression(expression: String, completionHandler: ((AnyObject?, NSError?) -> Void)?) {
        guard let completionHandler = completionHandler else {
            context?.evaluateJavaScript(expression, completionHandler: nil)
            return
        }
        context?.evaluateJavaScript(scriptForRetaining(expression)) {
            [weak self](result: AnyObject?, error: NSError?)->Void in
            completionHandler(self?.wrapScriptObject(result) ?? result, error)
        }
    }
    private func scriptForRetaining(script: String) -> String {
        return origin != nil ? "\(origin.namespace).$retainObject(\(script))" : script
    }

    func wrapScriptObject(object: AnyObject!) -> AnyObject! {
        if let dict = object as? [String: AnyObject] where dict["$sig"] as? NSNumber == 0x4E4B5756 {
            if let num = dict["$ref"] as? NSNumber {
                return NKScriptObject(reference: num.integerValue, channel: channel, origin: self)
            } else if let namespace = dict["$ns"] as? String {
                return NKScriptObject(namespace: namespace, channel: channel, origin: self)
            }
        }
        return object
    }

    func serialize(object: AnyObject?) -> String {
        var obj: AnyObject? = object
        if let val = obj as? NSValue {
            obj = val as? NSNumber ?? val.nonretainedObjectValue
        }

        if let o = obj as? NKScriptObject {
            return o.namespace
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
            return "(new Date(\(date.timeIntervalSince1970 * 1000)))"
        } else if let _ = obj as? NSData {
            // TODO: map to Uint8Array object
        } else if let a = obj as? [AnyObject] {
            return "[" + a.map(serialize).joinWithSeparator(", ") + "]"
        } else if let d = obj as? [String: AnyObject] {
            return "{" + d.keys.map{"'\($0)': \(self.serialize(d[$0]!))"}.joinWithSeparator(", ") + "}"
        } else if obj === NSNull() {
            return "null"
        } else if obj == nil {
            return "undefined"
        }
        return "'\(obj!.description)'"
    }

    // JavaScript object operations
    public func construct(arguments arguments: [AnyObject]?, completionHandler: ((AnyObject?, NSError?) -> Void)?) {
        let exp = "new " + scriptForCallingMethod(nil, arguments: arguments)
        evaluateExpression(exp, completionHandler: completionHandler)
    }
    public func call(arguments arguments: [AnyObject]?, completionHandler: ((AnyObject?, NSError?) -> Void)?) {
        let exp = scriptForCallingMethod(nil, arguments: arguments)
        evaluateExpression(exp, completionHandler: completionHandler)
    }
    public func callMethod(name: String, withArguments arguments: [AnyObject]?, completionHandler: ((AnyObject?, NSError?) -> Void)?) {
        let exp = scriptForCallingMethod(name, arguments: arguments)
        evaluateExpression(exp, completionHandler: completionHandler)
    }
    
    public func construct(arguments arguments: [AnyObject]?) throws -> AnyObject {
        let exp = "new \(scriptForCallingMethod(nil, arguments: arguments))"
        guard let result = try evaluateExpression(exp) else {
            NSException(name: "JavaScriptExceptionOccurred", reason: "NKScriptObject.construct", userInfo: nil).raise()
            return "";
        }
        return result
    }
    public func call(arguments arguments: [AnyObject]?) throws -> AnyObject! {
        return try evaluateExpression(scriptForCallingMethod(nil, arguments: arguments))
    }
    public func callMethod(name: String, withArguments arguments: [AnyObject]?) throws -> AnyObject! {
        return try evaluateExpression(scriptForCallingMethod(name, arguments: arguments))
    }
    public func call(arguments arguments: [AnyObject]?, error: NSErrorPointer) -> AnyObject! {
        return evaluateExpression(scriptForCallingMethod(nil, arguments: arguments), error: error)
    }
    public func callMethod(name: String, withArguments arguments: [AnyObject]?, error: NSErrorPointer) -> AnyObject! {
        return evaluateExpression(scriptForCallingMethod(name, arguments: arguments), error: error)
    }
    
    public func defineProperty(name: String, descriptor: [String:AnyObject]) -> AnyObject? {
        let exp = "Object.defineProperty(\(namespace), \(name), \(serialize(descriptor)))"
        return try! evaluateExpression(exp)
    }
    public func deleteProperty(name: String) -> Bool {
        let result: AnyObject? = try! evaluateExpression("delete \(scriptForFetchingProperty(name))")
        return (result as? NSNumber)?.boolValue ?? false
    }
    public func hasProperty(name: String) -> Bool {
        let result: AnyObject? = try! evaluateExpression("\(scriptForFetchingProperty(name)) != undefined")
        return (result as? NSNumber)?.boolValue ?? false
    }
    
    public func value(forProperty name: String) -> AnyObject? {
        return try! evaluateExpression(scriptForFetchingProperty(name))
    }
    public func setValue(value: AnyObject?, forProperty name:String) {
        context?.evaluateJavaScript(scriptForUpdatingProperty(name, value: value), completionHandler: nil)
    }
    public func value(atIndex index: UInt) -> AnyObject? {
        return try! evaluateExpression("\(namespace)[\(index)]")
    }
    public func setValue(value: AnyObject?, atIndex index: UInt) {
        context?.evaluateJavaScript("\(namespace)[\(index)] = \(serialize(value))", completionHandler: nil)
    }
    
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
        return scriptForFetchingProperty(name) + " = " + serialize(value)
    }
    private func scriptForCallingMethod(name: String!, arguments: [AnyObject]?) -> String {
        let args = arguments?.map(serialize) ?? []
        return scriptForFetchingProperty(name) + "(" + args.joinWithSeparator(", ") + ")"
    }
}

extension NKScriptObject {
    // Subscript as property accessor
    public subscript(name: String) -> AnyObject? {
        get {
            return value(forProperty: name)
        }
        set {
            setValue(newValue, forProperty: name)
        }
    }
    public subscript(index: UInt) -> AnyObject? {
        get {
            return value(atIndex: index)
        }
        set {
            setValue(newValue, atIndex: index)
        }
    }
}

extension NKScriptObject {
    // DOM objects
    public var windowObject: NKScriptObject {
        return NKScriptObject(namespace: "window", channel: self.channel, origin: self.origin)
    }
    public var documentObject: NKScriptObject {
        return NKScriptObject(namespace: "document", channel: self.channel, origin: self.origin)
    }
}
