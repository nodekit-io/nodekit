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
import WebKit

internal class NKWKWebViewDelegate: NSObject, WKNavigationDelegate {

    weak var delegate: NKScriptContextDelegate?
    var id: Int

    init(id: Int, webView: WKWebView, delegate cb: NKScriptContextDelegate) {
        self.delegate = cb
        self.id = id
        super.init()
        objc_setAssociatedObject(webView, unsafeAddressOf(self), self, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }

    func webView(webView: WKWebView,
        didFinishNavigation navigation: WKNavigation!) {
            if (self.delegate == nil) {return;}

            let didFinishNavigation = {() -> Void in
                guard let callback = self.delegate else {return;}

                webView.navigationDelegate = nil
                objc_setAssociatedObject(webView, unsafeAddressOf(self), nil, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
                self.delegate = nil

                callback.NKScriptEngineReady(webView)
            }

            if (NSThread.isMainThread()) {
                didFinishNavigation()
            } else {
                dispatch_async(dispatch_get_main_queue(), didFinishNavigation)
            }
    }
}

internal class NKWKWebViewUIDelegate: NSObject, WKUIDelegate {

    init(webView: WKWebView) {
        super.init()
        objc_setAssociatedObject(webView, unsafeAddressOf(self), self, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }

    func webView(webView: WKWebView,
        runJavaScriptTextInputPanelWithPrompt prompt: String,
        defaultText: String?,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: (String?) -> Void) {
            if (prompt == "nk.Signal") {
                NKEventEmitter.global.once(defaultText!, handler: completionHandler)
            } else {
                completionHandler(nil)
            }
    }
}
