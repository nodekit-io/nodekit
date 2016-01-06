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

public class NKJavaScriptCore: JSContext {}

extension NKJavaScriptCore: NKScriptContext {
    public func loadPlugin(object: AnyObject, namespace: String) -> NKScriptObject? {
        let channel = NKScriptChannel(context: self)
        return channel.bindPlugin(object, toNamespace: namespace)
    }
}

extension NKJavaScriptCore {
    public func addScriptMessageHandler (scriptMessageHandler: NKScriptMessageHandler, name: String)
    {
        let context: JSContext = self
        let name = name;
        
        guard let messageHandlers = context.valueForKey("NKScripting")?.valueForKey("messageHandlers") else {return }
        
        var namedHandler : JSValue;
        if (messageHandlers.hasProperty(name))
        {
            namedHandler = messageHandlers.valueForProperty(name)
        } else {
            namedHandler = JSValue(object: Dictionary<String, AnyObject>(), inContext: context)
            messageHandlers.setValue(namedHandler, forProperty: name)
        }
        
        let postMessage: @convention(block) [String: AnyObject] -> () = { body in
            scriptMessageHandler.userContentController(didReceiveScriptMessage: NKScriptMessage(name: name, body: body))
        }
        
        namedHandler.setValue(unsafeBitCast(postMessage, AnyObject.self), forProperty: "postMessage:")
        
    }
    
    public func removeScriptMessageHandlerForName (name: String)
    {
        let context: JSContext = self
        let cleanup = "delete nkNodeKit.messageHandlers.\(name)"
        context.evaluateScript(cleanup)
    }
}

extension NKJavaScriptCore {
    
    public func injectJavaScript(script: NKScriptSource) -> AnyObject {
        return NKJSCScript(context: self, script: script)
    }
    
    public func evaluateJavaScript(javaScriptString: String,
        completionHandler: ((AnyObject?,
        NSError?) -> Void)?) {
            
            let result = self.evaluateScript(javaScriptString);
            completionHandler?(result, nil);
    }
   
    public func evaluateJavaScript(script: String) throws -> AnyObject? {
        let result = evaluateScript(script)
        return result
    }
    
    public func evaluateJavaScript(script: String, error: NSErrorPointer) -> AnyObject? {
        var result: AnyObject?
        var err: NSError?
        do {
            result = try evaluateJavaScript(script)
        } catch let e as NSError {
            err = e
        }
        if error != nil { error.memory = err }
        return result
    }

}
