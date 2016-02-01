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

import UIKit
import WebKit
import JavaScriptCore

internal struct NKUIWebView {
   internal static var __globalWebViews: [UIWebView] = []
}

extension UIWebView: NKScriptContextHost {

    public var NKid: Int { get { return objc_getAssociatedObject(self, unsafeAddressOf(NKJSContextId)) as! Int; } }

    public func NKgetScriptContext(id: Int, options: [String: AnyObject] = Dictionary<String, AnyObject>(),
        delegate cb: NKScriptContextDelegate) -> Void {

        log("+NodeKit UIWebView-JavaScriptCore JavaScript Engine E\(id)")
     
        objc_setAssociatedObject(self, unsafeAddressOf(NKJSContextId), id, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)

        var item = Dictionary<String, AnyObject>()
        item["UIWebView"] = self
        NKScriptContextFactory._contexts[id] = item
        self.delegate = NKUIWebViewDelegate(id: id, webView: self, delegate: cb)

      }
}

extension UIWebView {
    var currentJSContext: JSContext? {
        get {
            let key = unsafeAddressOf(JSContext)
            return objc_getAssociatedObject(self, key) as? JSContext
        }
        set(context) {
            let key = unsafeAddressOf(JSContext)
            objc_setAssociatedObject(self, key, context, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        }
    }

    func registerForJSContext(callback cb: (JSContext)-> Void) {
        let key = unsafeAddressOf(JSContextCallback)
        let value = JSContextCallback(callback: cb)
        objc_setAssociatedObject(self, key, value, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        if NKUIWebView.__globalWebViews.contains(self) { return }
        NKUIWebView.__globalWebViews.append(self)
    }

    func unRegisterForJSContext() {
        if let index =  NKUIWebView.__globalWebViews.indexOf(self) {
             NKUIWebView.__globalWebViews.removeAtIndex(index)
        }
    }

    // always called on main thread
    func bindJSContext(context: JSContext) {
        self.currentJSContext = context
        let value = objc_getAssociatedObject(self, unsafeAddressOf(JSContextCallback))
        guard (value != nil) else {return;}
        guard let cb = value as? JSContextCallback else {return;}
        cb.callback(context)
    }

    // helper object to store a callback in objc association dictionary
    private class JSContextCallback: NSObject {
        init(callback: (JSContext)-> Void) {
            self.callback = callback
        }
        var callback: ((JSContext)-> Void)! = nil
    }
}
