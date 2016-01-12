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
import WebKit

extension WKWebView: NKScriptContext {
    
    public var NKid: Int { get { return objc_getAssociatedObject(self, unsafeAddressOf(NKJSContextId)) as! Int; } }
    
    public func NKloadPlugin(object: AnyObject, namespace: String, options: Dictionary<String, AnyObject> = Dictionary<String, AnyObject>() ) -> AnyObject? {
        let bridge = options["PluginBridge"] as? NKScriptPluginType ?? NKScriptPluginType.NKScriptPlugin
        
        switch bridge {
        case .JSExport:
            NSException(name: "Not Supported", reason: "WKWebView does not support JSExport protocol", userInfo: nil).raise()
            return nil;
        case .NKScriptPlugin:
            let channel = NKScriptChannel(context: self)
            channel.userContentController = self;
            return channel.bindPlugin(object, toNamespace: namespace)
            
        }
    }

    public func NKinjectJavaScript(script: NKScriptSource) -> AnyObject? {
        return NKWKUserScript(context: (self as WKWebView), script: script)
    }
    
    public func NKevaluateJavaScript(javaScriptString: String,
        completionHandler: ((AnyObject?,
        NSError?) -> Void)?) {
            self.evaluateJavaScript(javaScriptString, completionHandler: completionHandler);
    }
    
    // Synchronized evaluateJavaScript
    // It returns nil if script is a statement or its result is undefined.
    // So, Swift cannot map the throwing method to Objective-C method.
    public func NKevaluateJavaScript(script: String) throws -> AnyObject? {
        var result: AnyObject?
        var error: NSError?
        var done = false
        let timeout = 3.0
        if NSThread.isMainThread() {
            evaluateJavaScript(script) {
                (obj: AnyObject?, err: NSError?)->Void in
                result = obj
                error = err
                done = true
            }
            while !done {
                let reason = CFRunLoopRunInMode(kCFRunLoopDefaultMode, timeout, true)
                if reason != CFRunLoopRunResult.HandledSource {
                    break
                }
            }
        } else {
            let condition: NSCondition = NSCondition()
            dispatch_async(dispatch_get_main_queue()) {
                [weak self] in
                self?.evaluateJavaScript(script) {
                    (obj: AnyObject?, err: NSError?)->Void in
                    condition.lock()
                    result = obj
                    error = err
                    done = true
                    condition.signal()
                    condition.unlock()
                }
            }
            condition.lock()
            while !done {
                if !condition.waitUntilDate(NSDate(timeIntervalSinceNow: timeout)) {
                    break
                }
            }
            condition.unlock()
        }
        if error != nil { throw error! }
        if !done {
            log("!Timeout to evaluate script: \(script)")
        }
        return result
    }

    // Wrapper method of synchronized evaluateJavaScript for Objective-C
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
}

extension WKWebView: NKScriptContentController {
    internal func NKaddScriptMessageHandler (scriptMessageHandler: NKScriptMessageHandler, name: String)
    {
        let handler : WKScriptMessageHandler = NKWKMessageHandler(name: name, messageHandler: scriptMessageHandler)
        self.configuration.userContentController.addScriptMessageHandler(handler, name: name)
    }
    
    internal func NKremoveScriptMessageHandlerForName (name: String)
    {
        self.configuration.userContentController.removeScriptMessageHandlerForName(name)
    }
}

