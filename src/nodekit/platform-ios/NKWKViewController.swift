/*
* nodekit.io
*
* Copyright (c) 2015 Domabo. All Rights Reserved.
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
    
    override public func loadView() {
       let config = WKWebViewConfiguration()
       let webPrefs = WKPreferences();
        
       var urlpath = NSBundle.mainBundle().pathForResource("StartupSplash", ofType: "html", inDirectory: "splash/views/")
        
        if (urlpath == nil)
        {
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
            name: "interOp");
        
        webView = WKWebView(frame:CGRectZero, configuration: config)
        webView!.backgroundColor = UIColor(netHex: 0x2690F6)
        
        webView!.opaque = false;
        webView!.backgroundColor = UIColor.clearColor()

        //If you want to implement the delegate
        //webView?.navigationDelegate = self
        
        
        NSURLProtocol.registerClass(NKUrlProtocolLocalFile)
        NSURLProtocol.registerClass(NKUrlProtocolCustom)
        
        NKJavascriptBridge.registerStringViewer({ (msg: String?, title: String?) -> () in
            self.webView!.loadHTMLString(msg!, baseURL: NSURL(string: "about:blank"))
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
        
    }
    
    override public func viewDidLoad() {
        super.viewDidLoad()
        
        view.backgroundColor = UIColor(netHex: 0xFFCE54)
        
        // Do any additional setup after loading the view, typically from a nib.
    }
    
    override public func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
  public func userContentController(userContentController: WKUserContentController, didReceiveScriptMessage message: WKScriptMessage)
    {
        print(message.description)
    }
    
}

public extension UIColor {
    convenience public init(red: Int, green: Int, blue: Int) {
        assert(red >= 0 && red <= 255, "Invalid red component")
        assert(green >= 0 && green <= 255, "Invalid green component")
        assert(blue >= 0 && blue <= 255, "Invalid blue component")
        
        self.init(red: CGFloat(red) / 255.0, green: CGFloat(green) / 255.0, blue: CGFloat(blue) / 255.0, alpha: 1.0)
    }
    
    convenience public init(netHex:Int) {
        self.init(red:(netHex >> 16) & 0xff, green:(netHex >> 8) & 0xff, blue:netHex & 0xff)
    }
}
