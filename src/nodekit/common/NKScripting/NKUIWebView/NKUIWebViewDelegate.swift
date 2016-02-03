/*
* nodekit.io
*
* Copyright (c) 2016 OffGrid Networks. All Rights Reserved.
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
import UIKit
import WebKit
import JavaScriptCore

internal class NKUIWebViewDelegate: NSObject, UIWebViewDelegate {

    weak var delegate: NKScriptContextDelegate?
    weak var webView: UIWebView?
    var context: JSContext?
    var id: Int

    init(id: Int, webView: UIWebView, delegate cb: NKScriptContextDelegate) {
        self.delegate = cb
        self.webView = webView
        self.context = nil
        self.id = id
        super.init()
        objc_setAssociatedObject(webView, unsafeAddressOf(self), self, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        webView.registerForJSContext(callback: self.gotJavaScriptContext)
    }

    private func gotJavaScriptContext(context: JSContext) {
        if (self.delegate == nil) {return;}

        guard let callback = self.delegate else {return;}
        self.context = context
        objc_setAssociatedObject(context, unsafeAddressOf(NKJSContextId), self.id, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        
        callback.NKScriptEngineDidLoad(context)
    }

    internal func webViewDidFinishLoad(webView: UIWebView) {
        if (self.delegate == nil) {return;}

        let didFinishLoad = {() -> Void in
            guard let webView = self.webView else {return;}
            guard let callback = self.delegate else {return;}
            webView.delegate = nil
            objc_setAssociatedObject(self.context, unsafeAddressOf(self), nil, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
            self.delegate = nil
            self.webView = nil
            guard let context = self.context else {return;}
            self.context = nil
            callback.NKScriptEngineReady(context)
        }

        if (NSThread.isMainThread()) {
            didFinishLoad()
        } else {
            dispatch_async(dispatch_get_main_queue(), didFinishLoad)
        }

    }
}

extension NSObject {
    func webView(webView: UIWebView!, didCreateJavaScriptContext context: JSContext!, forFrame frame: AnyObject!) {
        let didCreateJavaScriptContext = {() -> Void in
            // thread-safe on main thread

            let array = NKUIWebView.__globalWebViews
            for var index = array.count - 1; index >= 0; --index {
                let webView = array[index]
                let checksum = "__NKUIWebView\(webView.hash)"
                webView.stringByEvaluatingJavaScriptFromString("var \(checksum) = '\(checksum)'")
                let jschecksum = context.objectForKeyedSubscript(checksum).toString()
                webView.stringByEvaluatingJavaScriptFromString("delete \(checksum)")
                if (jschecksum == checksum) {
                    webView.bindJSContext(context)
                    break
                }
            }
        }

        if (NSThread.isMainThread()) {
            didCreateJavaScriptContext()
        } else {
            dispatch_async(dispatch_get_main_queue(), didCreateJavaScriptContext)
        }
    }
}
