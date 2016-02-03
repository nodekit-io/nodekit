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


extension NKE_BrowserWindow {

    internal func WKScriptEnvironmentReady() -> Void {
          (self._webView as! WKWebView).navigationDelegate = self
          self._events.emit("did-finish-load", self._id)
    }

    internal func createWKWebView(options: Dictionary<String, AnyObject>) -> Int {

        let id = NKScriptContextFactory.sequenceNumber

        let createBlock = {() -> Void in

            let window = self.createWindow(options) as! UIWindow
            self._window = window

            let urlAddress: String = (options[NKEBrowserOptions.kPreloadURL] as? String) ?? "https://google.com"

            let url: NSURL?
            if (urlAddress == "file:///splash/views/StartupSplash.html") {
                var urlpath = NSBundle.mainBundle().pathForResource("StartupSplash", ofType: "html", inDirectory: "splash/views/")

                if (urlpath == nil) {
                    urlpath = NSBundle(forClass: NKNodeKit.self).pathForResource("StartupSplash", ofType: "html", inDirectory: "splash/views/")
                }


                url = NSURL.fileURLWithPath(urlpath!)
            } else {
                url = NSURL(string: urlAddress)
            }

            let config = WKWebViewConfiguration()
            let webPrefs = WKPreferences()

            webPrefs.javaScriptEnabled = true
            webPrefs.javaScriptCanOpenWindowsAutomatically = false
            config.preferences = webPrefs

            let webView = WKWebView(frame: CGRect.zero, configuration: config)
            self._webView = webView

            // webView.opaque = false
            // webView.backgroundColor = UIColor.clearColor()

            window.rootViewController?.view = webView

            webView.NKgetScriptContext(id, options: [String: AnyObject](), delegate: self)

            let requestObj: NSURLRequest = NSURLRequest(URL: url!)

            webView.loadRequest(requestObj)
            window.rootViewController?.view.backgroundColor = UIColor(netHex: 0x2690F6)
        }

        if (NSThread.isMainThread()) {
            createBlock()
        } else {
            dispatch_async(dispatch_get_main_queue(), createBlock)
        }

        return id
    }
}


extension NKE_BrowserWindow: WKNavigationDelegate {

    func webView(webView: WKWebView,
        didFinishNavigation navigation: WKNavigation!) {
        self._events.emit("did-finish-load", self._id)
    }

    func webView(webView: WKWebView,
        didFailNavigation navigation: WKNavigation!,
        withError error: NSError) {
            self._events.emit("did-fail-loading", (self._id,  error.description))
    }

    func webView(webView: WKWebView,
        didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: NSError) {
            self._events.emit("did-fail-loading", (self._id,  error.description))
    }
}
