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



public class NKJavaScriptCore: JSContext, NKScriptContext, NKScriptContentController {
    
   public var ScriptContentController: NKScriptContentController?
    
    public func loadPlugin(object: AnyObject, namespace: String) -> NKScriptObject? {
         let channel = NKScriptChannel(context: self)
        return channel.bindPlugin(object, toNamespace: namespace)
    }
    
    public func evaluateJavaScript(javaScriptString: String,
        completionHandler: ((AnyObject?,
        NSError?) -> Void)?) {
            
            let result = self.evaluateScript(javaScriptString);
            completionHandler?(result, nil);
    }
    
    
    public func prepareForPlugin () {
        let key = unsafeAddressOf(NKScriptChannel)
        if objc_getAssociatedObject(self, key) != nil { return }
        
        ScriptContentController = self;
        
        let bundle = NSBundle(forClass: NKScriptChannel.self)
        guard let path = bundle.pathForResource("nkscripting", ofType: "js"),
            let source = try? NSString(contentsOfFile: path, encoding: NSUTF8StringEncoding) else {
                die("Failed to read provision script: nkwebview")
        }
        
        let nkPlugin = self.injectJavaScript(NKScript(source: source as String, asFilename: path, namespace: "NKScripting"))
        objc_setAssociatedObject(self, key, nkPlugin, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        log("+WKWebView(\(unsafeAddressOf(self))) is ready for loading plugins")
    }
    
    public func injectJavaScript(script: NKScript) -> AnyObject {
        return NKJSCScript(context: self, script: script)
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
    
    public func addScriptMessageHandler (scriptMessageHandler: NKScriptMessageHandler, name: String)
    {
        let context: JSContext = self
        
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
            scriptMessageHandler.userContentController(self, didReceiveScriptMessage: NKScriptMessage(name: name, body: body))
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


