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
import ObjectiveC

public class NKScriptValueNative: NKScriptValue {
    private let key = unsafeAddressOf(NKScriptValue)
    private var proxy: NKScriptInvocation!
    final var plugin: AnyObject { return proxy.target }

    // Create from, Convert to and Compare with Native Objects
    //  init!(object value: AnyObject!, inContext context: NKScriptContext!)
    //  func toObject() -> AnyObject!
    //  func toObjectOfClass(expectedClass: AnyClass!) -> AnyObject!
    //  func isEqualToObject(value: AnyObject!) -> Bool
    //  func isEqualWithTypeCoercionToObject(value: AnyObject!) -> Bool
    //  func isInstanceOf(value: AnyObject!) -> Bool

   init(object value: AnyObject, inContext context: NKScriptContext!) {
        let plugin: AnyClass = value.dynamicType
        let channel = objc_getAssociatedObject(plugin, unsafeAddressOf(NKScriptChannel)) as! NKScriptChannel
        let pluginNamespace = channel.principal.namespace
        let id = channel.nativeFirstSequence
        let namespace = pluginNamespace + "[" + String(id) + "]"
    
        super.init(namespace: namespace, channel: channel, origin: nil)
    
        channel.instances[id] = self;
        log("+E\(context!.NKid) Instance \(id) \(unsafeAddressOf(value)) is bound to \(namespace)")
    
        proxy = bindObject(value)
        syncCreationWithProperties()
    }

    init(namespace: String, channel: NKScriptChannel, object: AnyObject) {
        super.init(namespace: namespace, channel: channel, origin: nil)
        proxy = bindObject(object)
        log("+E\(context!.NKid) Instance \(unsafeAddressOf(object)) is bound to \(namespace)")
    }

    init?(namespace: String, channel: NKScriptChannel, arguments: [AnyObject]?) {
        super.init(namespace: namespace, channel: channel, origin: nil)
        let cls: AnyClass = channel.typeInfo.plugin
        let member = channel.typeInfo[""]
        guard member != nil, case .Initializer(let selector, let arity) = member! else {
            log("!Plugin class \(cls) is not a constructor")
            return nil
        }

        var arguments = arguments?.map(wrapScriptObject) ?? []
        var promise: NKScriptValue?
        if arity == Int32(arguments.count) - 1 || arity < 0 {
            promise = arguments.last as? NKScriptValue
            arguments.removeLast()
        }
        if selector == "initByScriptWithArguments:" {
            arguments = [arguments]
        }

        let args: [Any!] = arguments.map { $0 !== NSNull() ? ($0 as Any) : nil }
        guard let instance = NKScriptInvocation.construct(cls, initializer: selector, withArguments: args) else {
            log("!Failed to create instance for plugin class \(cls)")
            return nil
        }

        proxy = bindObject(instance)
        syncProperties()
        promise?.invokeMethod("resolve", withArguments: [self], completionHandler: nil)
        
        log("+E\(context!.NKid) Instance \(unsafeAddressOf(instance)) created for \(namespace)")
        
    }

    deinit {
        (plugin as? NKScriptExport)?.finalizeForScript?()
        unbindObject(plugin)
    }

    private func bindObject(object: AnyObject) -> NKScriptInvocation {
        let option: NKScriptInvocation.Option
        if let queue = channel.queue {
            option = .Queue(queue: queue)
        } else if let thread = channel.thread {
            option = .Thread(thread: thread)
        } else {
            option = .None
        }
        let proxy = NKScriptInvocation(target: object, option: option)

        objc_setAssociatedObject(object, key, self, objc_AssociationPolicy.OBJC_ASSOCIATION_ASSIGN)

        // Start KVO
        if object is NSObject {
            for (_, member) in channel.typeInfo.filter({ $1.isProperty }) {
                let key = member.getter!.description
                object.addObserver(self, forKeyPath: key, options: NSKeyValueObservingOptions.New, context: nil)
            }
        }
        return proxy
    }
    private func unbindObject(object: AnyObject) {
        objc_setAssociatedObject(object, key, nil, objc_AssociationPolicy.OBJC_ASSOCIATION_ASSIGN)

        // Stop KVO
        if object is NSObject {
            for (_, member) in channel.typeInfo.filter({ $1.isProperty }) {
                let key = member.getter!.description
                object.removeObserver(self, forKeyPath: key, context: nil)
            }
        }

        proxy = nil
    }
    private func syncProperties() {
        var script = ""
        for (name, member) in channel.typeInfo.filter({ $1.isProperty }) {
            let val: AnyObject! = proxy.call(member.getter!, withObjects: nil)
            script += "\(namespace).$properties['\(name)'] = \(self.context.NKserialize(val));\n"
        }
        context?.NKevaluateJavaScript(script, completionHandler: nil)
    }

    private func syncCreationWithProperties() {
        let namespaceComponents = namespace.componentsSeparatedByString("[")
        let namespacePlugin = namespaceComponents[0]
        let id = namespaceComponents[1].componentsSeparatedByString("]")[0]

        var script = ""

        script += "var instance = \(namespacePlugin).NKcreateForNative(\(id));\n"

        for (name, member) in channel.typeInfo.filter({ $1.isProperty }) {
            let val: AnyObject! = proxy.call(member.getter!, withObjects: nil)
            script += "instance.$properties['\(name)'] = \(self.context.NKserialize(val));\n"
        }
        context?.NKevaluateJavaScript(script, completionHandler: nil)
    }

    // Dispatch operation to plugin object
    internal func invokeNativeMethod(name: String, withArguments arguments: [AnyObject]) {
        if let selector = channel.typeInfo[name]?.selector {
            var args = arguments.map(wrapScriptObject)
            if plugin is NKScriptExport && name.isEmpty && selector == Selector("invokeDefaultMethodWithArguments:") {
                args = [args]
            }
            proxy.asyncCall(selector, withObjects: args)
        }
    }

    internal func invokeNativeMethodSync(name: String, withArguments arguments: [AnyObject]) -> AnyObject! {
        if let selector = channel.typeInfo[name]?.selector {
            var args = arguments.map(wrapScriptObject)
            if plugin is NKScriptExport && name.isEmpty && selector == Selector("invokeDefaultMethodWithArguments:") {
                args = [args]
            }
            return proxy.call(selector, withObjects: args)
        }
        return nil
    }
    internal func updateNativeProperty(name: String, withValue value: AnyObject) {
        if let setter = channel.typeInfo[name]?.setter {
            let val: AnyObject = wrapScriptObject(value)
            proxy.asyncCall(setter, withObjects: [val])
        }
    }

    // override methods of NKScriptValue
    override public func invokeMethod(method: String!, withArguments arguments: [AnyObject]!, completionHandler: ((AnyObject?, NSError?) -> Void)?) {
        if let selector = channel.typeInfo[method]?.selector {
            let result: AnyObject! = proxy.call(selector, withObjects: arguments)
            completionHandler?(result, nil)
        } else {
            super.invokeMethod(method, withArguments: arguments, completionHandler: completionHandler)
        }
    }

     override public func setValue(value: AnyObject!, forProperty property: String!) {
        if channel.typeInfo[property]?.setter != nil {
            proxy[property] = value
        } else {
            assert(channel.typeInfo[property] == nil, "Property '\(property)' is readonly")
            super.setValue(value, forProperty: property)
        }
    }
    
    override public func valueForProperty(property: String!, completionHandler: ((AnyObject?, NSError?) -> Void)?) {
        if let getter = channel.typeInfo[property]?.getter {
            completionHandler?(proxy.call(getter, withObjects: nil), nil)
        }
        super.valueForProperty(property, completionHandler: completionHandler)
    }
    
    public func valueForPropertyNative(property: String!) -> AnyObject? {
        if let getter = channel.typeInfo[property]?.getter {
            return proxy.call(getter, withObjects: nil)
        }
        return nil
    }

    // KVO for syncing properties
    override public func observeValueForKeyPath(keyPath: String?, ofObject object: AnyObject?, change: [String : AnyObject]?, context: UnsafeMutablePointer<Void>) {
        guard let scriptContext = self.context, var prop = keyPath else { return }
        if channel.typeInfo[prop] == nil {
            if let scriptNameForKey = (object.dynamicType as? NKScriptExport.Type)?.scriptNameForKey {
                prop = prop.withCString(scriptNameForKey) ?? prop
            }
            assert(channel.typeInfo[prop] != nil)
        }
        let script = "\(namespace).$properties['\(prop)'] = \(self.context.NKserialize(change?[NSKeyValueChangeNewKey]))"
        scriptContext.NKevaluateJavaScript(script, completionHandler: nil)
    }
}

public extension NSObject {
    var NKscriptObject: NKScriptValue? {
        return objc_getAssociatedObject(self, unsafeAddressOf(NKScriptValue)) as? NKScriptValue
    }
}
