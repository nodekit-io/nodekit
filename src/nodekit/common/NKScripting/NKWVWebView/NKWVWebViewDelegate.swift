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

public class NKWVWebViewDelegate: NSObject, WebFrameLoadDelegate {

    weak var delegate: NKScriptContextDelegate?
    weak var webView: WebView?
    var context: JSContext?
    var id: Int

    init(id: Int, webView: WebView, delegate cb: NKScriptContextDelegate) {
        self.delegate = cb
        self.webView = webView
        self.context = nil
        self.id = id
        super.init()
        objc_setAssociatedObject(webView, unsafeAddressOf(self), self, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }

    public func webView(sender: WebView!, didCreateJavaScriptContext context: JSContext!, forFrame: WebFrame!) {
         let didCreateContext = {() -> Void in
            guard let webView = self.webView else {return;}
            if (forFrame !== webView.mainFrame) {return}
            guard let callback = self.delegate else {return;}
            let id = self.id
            self.context = context
            webView.currentJSContext = context
            objc_setAssociatedObject(context, unsafeAddressOf(NKJSContextId), id, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)

            callback.NKScriptEngineDidLoad(context)
        }

        if (NSThread.isMainThread()) {
            didCreateContext()
        } else {
            dispatch_async(dispatch_get_main_queue(), didCreateContext)
        }

    }

    public func webView(sender: WebView!,
        didFinishLoadForFrame frame: WebFrame!) {
            if (self.delegate == nil) {return;}

            let didFinishLoad = {() -> Void in
                guard let webView = self.webView else {return;}
                if (frame !== webView.mainFrame) {return}
                guard let callback = self.delegate else {return;}

                self.webView!.frameLoadDelegate = nil
                objc_setAssociatedObject(webView, unsafeAddressOf(self), nil, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN_NONATOMIC)
                self.delegate = nil
                self.webView = nil
                guard let context = self.context else { return; }
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
