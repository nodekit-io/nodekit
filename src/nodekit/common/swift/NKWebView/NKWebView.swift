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

import WebKit

public class NKWebView: WKWebView, NKScriptContext, NKScriptContentController  {
    
    public var ScriptContentController: NKScriptContentController?
    
    public func loadPlugin(object: AnyObject, namespace: String) -> NKScriptObject? {
        let channel = NKScriptChannel(context: self)
        return channel.bindPlugin(object, toNamespace: namespace)
    }
    
    public func prepareForPlugin() {
        let key = unsafeAddressOf(NKScriptChannel)
        if objc_getAssociatedObject(self, key) != nil { return }
        
        ScriptContentController = self;
        
        let bundle = NSBundle(forClass: NKWebView.self)
        guard let path = bundle.pathForResource("nkscripting", ofType: "js"),
            let source = try? NSString(contentsOfFile: path, encoding: NSUTF8StringEncoding) else {
                die("Failed to read provision script: nkscripting")
        }
        
        let nkPlugin = self.injectJavaScript(NKScript(source: source as String, asFilename: path, namespace: "NKScripting"))
        objc_setAssociatedObject(self, key, nkPlugin, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        log("+WKWebView(\(unsafeAddressOf(self))) is ready for loading plugins")
    }
    
    public func injectJavaScript(script: NKScript) -> AnyObject {
        return NKWVScript(context: self, script: script)
    }
    
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
        let webview = self as WKWebView
        let handler : WKScriptMessageHandler = NKWVMessageHandler(name: name, messageHandler: scriptMessageHandler, scriptContentController: self)
        webview.configuration.userContentController.addScriptMessageHandler(handler, name: name)
        
    }
    
    public func removeScriptMessageHandlerForName (name: String)
    {
       let webview = self as WKWebView
        webview.configuration.userContentController.removeScriptMessageHandlerForName(name)
    }
}

extension NKWebView: WKUIDelegate {
     private func _alert(title title: String?, message: String?) {
        let myPopup: NSAlert = NSAlert()
        myPopup.messageText = message ?? "NodeKit"
        myPopup.informativeText = title!
        myPopup.alertStyle = NSAlertStyle.WarningAlertStyle
        myPopup.addButtonWithTitle("OK")
        myPopup.runModal()
    }
    
    public func webView(webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: () -> Void) {

        _alert(title: self.title, message: message)
    }
    
    public func webView(webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: (String?) -> Void) {
        
            completionHandler("hello from native;  you sent: " + prompt);

    }
}