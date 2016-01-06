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

public class NKWebView: WKWebView {}

extension NKWebView: NKScriptContext {
    public func loadPlugin(object: AnyObject, namespace: String) -> NKScriptObject? {
        let channel = NKScriptChannel(context: self)
        return channel.bindPlugin(object, toNamespace: namespace)
    }
}

extension NKWebView {
    public func addScriptMessageHandler (scriptMessageHandler: NKScriptMessageHandler, name: String)
    {
         let handler : WKScriptMessageHandler = NKWVMessageHandler(name: name, messageHandler: scriptMessageHandler)
        self.configuration.userContentController.addScriptMessageHandler(handler, name: name)
    }
    
    public func removeScriptMessageHandlerForName (name: String)
    {
        self.configuration.userContentController.removeScriptMessageHandlerForName(name)
    }
}

extension NKWebView {
    public func injectJavaScript(script: NKScriptSource) -> AnyObject {
        return NKWVUserScript(context: (self as WKWebView), script: script)
    }
    // Synchronized evaluateJavaScript
    // It returns nil if script is a statement or its result is undefined.
    // So, Swift cannot map the throwing method to Objective-C method.
    public func evaluateJavaScript(script: String) throws -> AnyObject? {
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


