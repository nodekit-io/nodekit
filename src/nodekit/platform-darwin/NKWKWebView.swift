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

import Cocoa
import WebKit

var mainWindows:NSMutableArray? = nil
var webview:WKWebView! = nil

public class NKWKWebView: NSObject, WKScriptMessageHandler {
    
    var mainWindow : NSWindow!
    
    public init(urlAddress: NSString, title:NSString, width:CGFloat, height:CGFloat )
    {

        let windowRect : NSRect = (NSScreen.mainScreen()!).frame
        
        let frameRect : NSRect = NSMakeRect(
            (NSWidth(windowRect) - width)/2,
            (NSHeight(windowRect) - height)/2,
            width, height)
        
        let viewRect : NSRect = NSMakeRect(0,0,width, height);
        
        mainWindow = NSWindow(contentRect: frameRect, styleMask: NSTitledWindowMask | NSClosableWindowMask | NSResizableWindowMask, backing: NSBackingStoreType.Buffered, `defer`: false, screen: NSScreen.mainScreen())
        
        
        if (mainWindows == nil) {
            mainWindows = NSMutableArray()
        }
        
        mainWindows?.addObject(mainWindow)
        
        let config = WKWebViewConfiguration()
        let webPrefs = WKPreferences()
        
        webPrefs.javaEnabled = false
        webPrefs.plugInsEnabled = false
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
 
        
        super.init()
        
        config.userContentController.addScriptMessageHandler(self,
            name: "interOp");
        
        webview = WKWebView(frame: viewRect, configuration: config)
        
        mainWindow.makeKeyAndOrderFront(nil)
        mainWindow.contentView = webview
        mainWindow.title = title as String
        webview.autoresizingMask = [NSAutoresizingMaskOptions.ViewWidthSizable, NSAutoresizingMaskOptions.ViewHeightSizable]
        
         NSURLProtocol.registerClass(NKUrlProtocolLocalFile)
         NSURLProtocol.registerClass(NKUrlProtocolCustom)
        
        NKJavascriptBridge.registerStringViewer({ (msg: String?, title: String?) -> () in
            webview.loadHTMLString(msg!, baseURL: NSURL(string: "about:blank"))
            return
        })
        
        
        NKJavascriptBridge.registerNavigator ({ (uri: String?, title: String?) -> () in
            let requestObj: NSURLRequest = NSURLRequest(URL: NSURL(string: uri!)!)
            self.mainWindow.title = title!
            webview.loadRequest(requestObj)
            return
        })
        
        let url = NSURL(string: urlAddress as String)
        let requestObj: NSURLRequest = NSURLRequest(URL: url!)
        webview.loadRequest(requestObj)

    }
    
    
    public func userContentController(userContentController: WKUserContentController, didReceiveScriptMessage message: WKScriptMessage)
    {
        print(message.description)
    }
    
    public func close()
    {
        mainWindow.close()
    }
    
}


