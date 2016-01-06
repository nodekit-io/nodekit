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

class NKScriptBindingObject : NKScriptObject {
    private let key = unsafeAddressOf(NKScriptObject)
    private var proxy: NKScriptInvocation!
    final var plugin: AnyObject { return proxy.target }

    init(namespace: String, channel: NKScriptChannel, object: AnyObject) {
        super.init(namespace: namespace, channel: channel, origin: nil)
        proxy = bindObject(object)
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
        var promise: NKScriptObject?
        if arity == Int32(arguments.count) - 1 || arity < 0 {
            promise = arguments.last as? NKScriptObject
            arguments.removeLast()
        }
        if selector == "initByScriptWithArguments:" {
            arguments = [arguments]
        }

        let args: [Any!] = arguments.map{ $0 !== NSNull() ? ($0 as Any) : nil }
        guard let instance = NKScriptInvocation.construct(cls, initializer: selector, withArguments: args) else {
            log("!Failed to create instance for plugin class \(cls)")
            return nil
        }

        proxy = bindObject(instance)
        syncProperties()
        promise?.callMethod("resolve", withArguments: [self], completionHandler: nil)
    }

    deinit {
        (plugin as? NKScriptPlugin)?.finalizeForScript?()
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
    }
    private func syncProperties() {
        var script = ""
        for (name, member) in channel.typeInfo.filter({ $1.isProperty }) {
            let val: AnyObject! = proxy.call(member.getter!, withObjects: nil)
            script += "\(namespace).$properties['\(name)'] = \(serialize(val));\n"
        }
        context?.evaluateJavaScript(script, completionHandler: nil)
    }

    // Dispatch operation to plugin object
    func invokeNativeMethod(name: String, withArguments arguments: [AnyObject]) {
        if let selector = channel.typeInfo[name]?.selector {
            var args = arguments.map(wrapScriptObject)
            if plugin is NKScriptPlugin && name.isEmpty && selector == Selector("invokeDefaultMethodWithArguments:") {
                args = [args];
            }
            proxy.asyncCall(selector, withObjects: args)
        }
    }
    func updateNativeProperty(name: String, withValue value: AnyObject) {
        if let setter = channel.typeInfo[name]?.setter {
            let val: AnyObject = wrapScriptObject(value)
            proxy.asyncCall(setter, withObjects: [val])
        }
    }

    // override methods of NKScriptObject
    override func callMethod(name: String, withArguments arguments: [AnyObject]?, completionHandler: ((AnyObject?, NSError?) -> Void)?) {
        if let selector = channel.typeInfo[name]?.selector {
            let result: AnyObject! = proxy.call(selector, withObjects: arguments)
            completionHandler?(result, nil)
        } else {
            super.callMethod(name, withArguments: arguments, completionHandler: completionHandler)
        }
    }
    override func callMethod(name: String, withArguments arguments: [AnyObject]?) throws -> AnyObject! {
        if let selector = channel.typeInfo[name]?.selector {
            return proxy.call(selector, withObjects: arguments)
        }
        return try super.callMethod(name, withArguments: arguments)
    }
    override func value(forProperty name: String) -> AnyObject? {
        if let getter = channel.typeInfo[name]?.getter {
            return proxy.call(getter, withObjects: nil)
        }
        return super.value(forProperty: name)
    }
    override func setValue(value: AnyObject?, forProperty name: String) {
        if channel.typeInfo[name]?.setter != nil {
            proxy[name] = value
        } else {
            assert(channel.typeInfo[name] == nil, "Property '\(name)' is readonly")
            super.setValue(value, forProperty: name)
        }
    }

    // KVO for syncing properties
    override func observeValueForKeyPath(keyPath: String?, ofObject object: AnyObject?, change: [String : AnyObject]?, context: UnsafeMutablePointer<Void>) {
        guard let scriptContext = self.context, var prop = keyPath else { return }
        if channel.typeInfo[prop] == nil {
            if let scriptNameForKey = (object.dynamicType as? NKScriptPlugin.Type)?.scriptNameForKey {
                prop = prop.withCString(scriptNameForKey) ?? prop
            }
            assert(channel.typeInfo[prop] != nil)
        }
        let script = "\(namespace).$properties['\(prop)'] = \(serialize(change?[NSKeyValueChangeNewKey]))"
        scriptContext.evaluateJavaScript(script, completionHandler: nil)
    }
}

public extension NSObject {
    var scriptObject: NKScriptObject? {
        return objc_getAssociatedObject(self, unsafeAddressOf(NKScriptObject)) as? NKScriptObject
    }
}
