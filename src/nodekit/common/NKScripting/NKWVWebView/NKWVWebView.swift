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

import WebKit

extension WebView: NKScriptContextHost {

    public var NKid: Int { get { return objc_getAssociatedObject(self, unsafeAddressOf(NKJSContextId)) as! Int; } }

    public func NKgetScriptContext(id: Int, options: [String: AnyObject] = Dictionary<String, AnyObject>(),
        delegate cb: NKScriptContextDelegate) -> Void {
            log("+NodeKit WebView-JavaScriptCore JavaScript Engine E\(id)")
            objc_setAssociatedObject(self, unsafeAddressOf(NKJSContextId), id, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
            
            var item = Dictionary<String, AnyObject>()
            item["WebView"] = self
            NKScriptContextFactory._contexts[id] = item
            
            self.frameLoadDelegate =  NKWVWebViewDelegate(id: id, webView: self, delegate: cb)
    }
}

extension WebView {
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
}
