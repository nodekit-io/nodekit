//
//  ViewController.swift
//  NodeKitMobile
//
//  Created by Guy on 12/12/15.
//  Copyright © 2015 limerun. All rights reserved.
//

import UIKit
import Foundation
import WebKit
class NKWKViewController: UIViewController, WKScriptMessageHandler {
    
    
    private var webView: WKWebView?
    
    override func loadView() {
       let config = WKWebViewConfiguration()
       let webPrefs = WKPreferences();
       let urlpath = NSBundle.mainBundle().pathForResource("StartupSplash", ofType: "html", inDirectory: "splash/views/")
       let url = NSURL.fileURLWithPath(urlpath!)
        print(url);
        
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
        webView!.backgroundColor = UIColor(netHex: 0xFFCE54)
        
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
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        view.backgroundColor = UIColor(netHex: 0xFFCE54)
        
        // Do any additional setup after loading the view, typically from a nib.
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    func userContentController(userContentController: WKUserContentController, didReceiveScriptMessage message: WKScriptMessage)
    {
        print(message.description)
    }
    
}

extension UIColor {
    convenience init(red: Int, green: Int, blue: Int) {
        assert(red >= 0 && red <= 255, "Invalid red component")
        assert(green >= 0 && green <= 255, "Invalid green component")
        assert(blue >= 0 && blue <= 255, "Invalid blue component")
        
        self.init(red: CGFloat(red) / 255.0, green: CGFloat(green) / 255.0, blue: CGFloat(blue) / 255.0, alpha: 1.0)
    }
    
    convenience init(netHex:Int) {
        self.init(red:(netHex >> 16) & 0xff, green:(netHex >> 8) & 0xff, blue:netHex & 0xff)
    }
}
