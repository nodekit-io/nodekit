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

import JavaScriptCore

extension JSContext: NKScriptContext {
    
    public func NKloadPlugin(object: AnyObject, namespace: String, options: Dictionary<String, AnyObject> = Dictionary<String, AnyObject>() ) -> AnyObject? {
        let bridge = NKScriptPluginType(rawValue: (options["PluginBridge"] as? Int)!) ?? NKScriptPluginType.NKScriptPlugin
        switch bridge {
        case .JSExport:
            self.setObjectForNamespace(object, namespace: namespace);
            log("+Plugin object \(object) is bound to \(namespace) with JSExport channel")
            return object;
        default:
            let channel = NKScriptChannel(context: self)
            channel.userContentController = self;
            return channel.bindPlugin(object, toNamespace: namespace)
        }
    }

    public func NKinjectJavaScript(script: NKScriptSource) -> AnyObject? {
        return NKJSCScript(context: self, script: script)
    }
    
    public func NKevaluateJavaScript(javaScriptString: String,
        completionHandler: ((AnyObject?,
        NSError?) -> Void)?) {
            
            let result = self.evaluateScript(javaScriptString);
            completionHandler?(result, nil);
    }
   
    public func NKevaluateJavaScript(script: String) throws -> AnyObject? {
        let result = evaluateScript(script)
        return result
     }
    
    public func NKevaluateJavaScript(script: String, error: NSErrorPointer) -> AnyObject? {
        var result: AnyObject?
        var err: NSError?
        do {
            result = try NKevaluateJavaScript(script)
        } catch let e as NSError {
            err = e
        }
        if error != nil { error.memory = err }
        return result
    }
    
    // private methods
    private func setObjectForNamespace(object: AnyObject, namespace: String) -> Void {
        let global = self.globalObject;
        
        var fullNameArr = namespace.characters.split{$0 == "."}.map(String.init)
        let lastItem = fullNameArr.removeLast()
        if (fullNameArr.isEmpty) {
            self.setObject(object, forKeyedSubscript: lastItem)
            return;
        }
        
        let jsv = fullNameArr.reduce(global, combine: {previous, current in
            if (previous.hasProperty(current)) {
                return previous.objectForKeyedSubscript(current);
            }
            let _jsv = JSValue(newObjectInContext: self);
            previous.setObject(_jsv, forKeyedSubscript: current);
            return _jsv;
        } )
        jsv.setObject(object, forKeyedSubscript: lastItem);
    }
}

extension JSContext: NKScriptContentController {
    internal func NKaddScriptMessageHandler (scriptMessageHandler: NKScriptMessageHandler, name: String)
    {
        let context: JSContext = self
        let name = name;
        
        guard let messageHandlers = context.objectForKeyedSubscript("NKScripting")?.objectForKeyedSubscript("messageHandlers") else {return }
        
        var namedHandler : JSValue;
        if (messageHandlers.hasProperty(name))
        {
            namedHandler = messageHandlers.objectForKeyedSubscript(name)
        } else {
            namedHandler = JSValue(object: Dictionary<String, AnyObject>(), inContext: context)
            messageHandlers.setObject(namedHandler, forKeyedSubscript: name)
        }
        
        let postMessage: @convention(block) [String: AnyObject] -> () = { body in
            scriptMessageHandler.userContentController(didReceiveScriptMessage: NKScriptMessage(name: name, body: body))
        }
        
        namedHandler.setObject(unsafeBitCast(postMessage, AnyObject.self), forKeyedSubscript: "postMessage")
        
    }
    
    internal func NKremoveScriptMessageHandlerForName (name: String)
    {
        let context: JSContext = self
        let cleanup = "delete NKScripting.messageHandlers.\(name)"
        context.evaluateScript(cleanup)
    }
}
