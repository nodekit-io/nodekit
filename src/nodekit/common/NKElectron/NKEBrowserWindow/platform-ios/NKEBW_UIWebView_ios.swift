/*
* nodekit.io
*
* Copyright (c) -> Void 2016 OffGrid Networks. All Rights Reserved.
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
import UIKit

extension NKEBrowserWindow {
    
    internal func createUIWebView(window: AnyObject, options: Dictionary<String, AnyObject>) -> Int {
        guard let window = window as? UIWindow else {return 0}
        
        let urlAddress: String = (options[NKEBrowserOptions.kPreloadURL] as? String) ?? "https://google.com"
        
          // create WebView
        let webView:UIWebView = UIWebView(frame: CGRect.zero)
        window.rootViewController?.view = webView
        
        let id = webView.NKgetScriptContext([String: AnyObject](), delegate: self)
        
        let url = NSURL(string: urlAddress as String)
        let requestObj: NSURLRequest = NSURLRequest(URL: url!)
        webView.loadRequest(requestObj)
        window.rootViewController?.view.backgroundColor = UIColor(netHex: 0x2690F6)
        
        return id;
    }
}