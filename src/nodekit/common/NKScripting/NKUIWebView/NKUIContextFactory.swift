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
import JavaScriptCore
import UIKit

extension NKJSContextFactory {
    
   public func createContextUIWebView(options: [String: AnyObject] = Dictionary<String, AnyObject>(), delegate cb: NKScriptContextDelegate)
    {
        let id = NKJSContextFactory.sequenceNumber
        log("+Starting NodeKit UIWebView-JavaScriptCore JavaScript Engine \(id)")
        let webView:UIWebView = UIWebView(frame: CGRectZero)
        var item = Dictionary<String, AnyObject>()
        
        NKJSContextFactory._contexts[id] = item;
        webView.delegate = NKUIWebViewDelegate(webView: webView, delegate: cb);
        
        
        webView.loadHTMLString("<HTML><BODY>NodeKit UIWebView: JavaScriptCore VM \(id)</BODY></HTML>", baseURL: NSURL(string: "nodekit: core"))
        item["UIWebView"] = webView
    }
}