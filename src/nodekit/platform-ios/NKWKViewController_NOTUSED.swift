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
import Foundation
import WebKit
 public class NKWKViewController: UIViewController, WKScriptMessageHandler {

    private var webView: WKWebView?
    private var webView2: UIWebView?

    override public func loadView() {
       let config = WKWebViewConfiguration()
       let webPrefs = WKPreferences()

       var urlpath = NSBundle.mainBundle().pathForResource("StartupSplash", ofType: "html", inDirectory: "splash/views/")

        if (urlpath == nil) {
              urlpath = NSBundle(forClass: NKNodeKit.self).pathForResource("StartupSplash", ofType: "html", inDirectory: "splash/views/")
        }


        let url = NSURL.fileURLWithPath(urlpath!)


        webPrefs.javaScriptEnabled = true
        webPrefs.javaScriptCanOpenWindowsAutomatically = false
        //   webPrefs.loadsImagesAutomatically = true
        //   webPrefs.allowsAnimatedImages = true
        //   webPrefs.allowsAnimatedImageLooping = true
        //   webPrefs.shouldPrintBackgrounds = true
        //   webPrefs.userStyleSheetEnabled = false
        //   [webview setApplicationNameForUserAgent:appname];
        //   [webview setDrawsBackground:false];

        config.preferences = webPrefs
        config.userContentController.addScriptMessageHandler(self,
            name: "interOp")

        webView = WKWebView(frame:CGRect.zero, configuration: config)
        webView!.backgroundColor = UIColor(netHex: 0x2690F6)

        webView!.opaque = false
        webView!.backgroundColor = UIColor.clearColor()

        //If you want to implement the delegate
        //webView?.navigationDelegate = self


        NSURLProtocol.registerClass(NKUrlProtocolLocalFile)
        NSURLProtocol.registerClass(NKUrlProtocolCustom)

        NKJavascriptBridge.registerStringViewer({ (msg: String?, title: String?) -> () in
            self.webView!.loadHTMLString(msg!, baseURL: NSURL(string: "nodekit:renderer"))
            return
        })


        NKJavascriptBridge.registerNavigator ({ (uri: String?, title: String?) -> () in
            let requestObj: NSURLRequest = NSURLRequest(URL: NSURL(string: uri!)!)
            self.webView!.loadRequest(requestObj)
            return
        })


        let requestObj: NSURLRequest = NSURLRequest(URL: url)
        webView!.loadRequest(requestObj)
        view = webView


  /*      let id = NKScriptContextFactory.sequenceNumber
        log("+Starting NodeKit UIWebView-JavaScriptCore JavaScript Engine \(id)")
        let webView:UIWebView = UIWebView(frame: CGRectZero)
        var item = Dictionary<String, AnyObject>()

        webView.opaque = false;
        webView.backgroundColor = UIColor.clearColor()

        NKScriptContextFactory._contexts[id] = item;
        webView.delegate = NKUIWebViewDelegate(webView: webView, delegate: self);

         webView.loadHTMLString("<HTML><BODY>NodeKit UIWebView: JavaScriptCore VM \(id)</BODY></HTML>", baseURL: NSURL(string: "nodekit: core"))
        item["UIWebView"] = webView
        view = webView */
    }

    override public func viewDidLoad() {
        super.viewDidLoad()

       view.backgroundColor = UIColor(netHex: 0x2690F6)

        // Do any additional setup after loading the view, typically from a nib.
    }

    override public func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }


}
